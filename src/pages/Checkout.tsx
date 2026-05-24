import { useState, useEffect, FormEvent, ChangeEvent } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { 
  ArrowLeft, ShieldCheck, CreditCard, Sparkles, Check, 
  Clock, HelpCircle, AlertCircle, ShoppingCart, Calendar, Tag, CheckCircle2,
  MapPin, Navigation
} from "lucide-react";
import { fixedPriceCodes } from "../lib/fixedPriceCodes";
import { db, storage, auth, handleFirestoreError, OperationType } from "../firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { collection, addDoc } from "firebase/firestore";

interface CheckoutItem {
  id: string;
  name: string;
  price: number;
  calculatedPrice: number;
  quantity: number;
  category: string;
}

interface CheckoutData {
  cart: CheckoutItem[];
  startDate: string;
  endDate: string;
  activeCodes: string[];
  subtotal: number;
  deliveryFee: number;
  discount: number;
  finalTotal: number;
  name: string;
  phone: string;
}

export function Checkout() {
  const navigate = useNavigate();
  const [checkoutData, setCheckoutData] = useState<CheckoutData | null>(null);
  const [paymentOption, setPaymentOption] = useState<"reserve" | "full" | "custom_reserve">("full");
  const [selectedVipPerk, setSelectedVipPerk] = useState<"controller" | "game">("controller");
  const [isRazorpayLoaded, setIsRazorpayLoaded] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState<boolean | null>(null);
  const [paymentDetails, setPaymentDetails] = useState<any>(null);
  const [paymentError, setPaymentError] = useState("");

  // States for dynamic SPECIAL Custom Deposit code on payment page
  const [checkoutSpecialCode, setCheckoutSpecialCode] = useState("");
  const [checkoutSpecialError, setCheckoutSpecialError] = useState("");

  // Delivery details collection states (logs to dispatch register on server)
  const [deliveryName, setDeliveryName] = useState("");
  const [deliveryPhone, setDeliveryPhone] = useState("");
  const [deliveryEmail, setDeliveryEmail] = useState("");
  const [deliveryLocation, setDeliveryLocation] = useState("");
  const [deliveryError, setDeliveryError] = useState("");
  const [deliverySynced, setDeliverySynced] = useState(false);
  const [isSyncingDelivery, setIsSyncingDelivery] = useState(false);
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);

  // File upload state for KYC/Corporate ID verification
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileBase64, setFileBase64] = useState("");
  const [fileName, setFileName] = useState("");
  const [fileMimeType, setFileMimeType] = useState("");
  const [fileError, setFileError] = useState("");

  // Load checkout data from localStorage
  useEffect(() => {
    const dataStr = localStorage.getItem("afterhours_checkout_data");
    if (!dataStr) {
      // If no data, redirect back to rentals
      navigate("/rentals");
      return;
    }
    try {
      const parsed = JSON.parse(dataStr);
      setCheckoutData(parsed);
      
      // Auto-populate form details from previous step
      if (parsed.name) setDeliveryName(parsed.name);
      if (parsed.phone) setDeliveryPhone(parsed.phone);

      // Check if code list already has a SPECIAL code and auto-activate Option 3
      if (parsed.activeCodes && parsed.activeCodes.length > 0) {
        const special = parsed.activeCodes.find((code: string) => code.toUpperCase().startsWith("SPECIAL"));
        if (special) {
          setCheckoutSpecialCode(special.toUpperCase());
          setPaymentOption("custom_reserve");
        }
      }
    } catch (e) {
      console.error("Error parsing checkout data:", e);
      navigate("/rentals");
    }
  }, [navigate]);

  // Load Razorpay SDK Script Dynamically
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => {
      setIsRazorpayLoaded(true);
    };
    script.onerror = () => {
      console.error("Failed to load Razorpay SDK");
    };
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  if (!checkoutData) {
    return (
      <div className="min-h-screen bg-afterhours-black flex items-center justify-center text-white">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-afterhours-purple border-t-transparent rounded-full animate-spin" />
          <p className="text-white/40 uppercase tracking-widest text-xs font-bold font-mono">Loading Checkout Arena...</p>
        </div>
      </div>
    );
  }

  const { cart, startDate, endDate, activeCodes, subtotal, deliveryFee, discount, finalTotal, name, phone } = checkoutData;

  const hasVipOverride = activeCodes?.some(code => code in fixedPriceCodes);

  const getDaysCount = () => {
    if (!startDate || !endDate) return 1;
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  };

  const getReserveDepositAmount = () => {
    return 500;
  };

  const getCustomDepositAmount = () => {
    if (activeCodes && activeCodes.length > 0) {
      const specialCode = activeCodes.find(code => code.toUpperCase().startsWith("SPECIAL"));
      if (specialCode) {
        const amtStr = specialCode.toUpperCase().replace("SPECIAL", "");
        const parsedAmt = parseInt(amtStr, 10);
        if (!isNaN(parsedAmt) && parsedAmt > 0) {
          return parsedAmt;
        }
      }
    }
    return null;
  };

  const calculatePaymentAmount = () => {
    if (paymentOption === "reserve") {
      return 500;
    }
    if (paymentOption === "custom_reserve") {
      return getCustomDepositAmount() || 500;
    }
    return finalTotal;
  };

  const handleApplySpecialCode = () => {
    setCheckoutSpecialError("");
    const code = checkoutSpecialCode.trim().toUpperCase();
    if (!code) {
      setCheckoutSpecialError("Please enter a valid token code.");
      return;
    }

    if (!code.startsWith("SPECIAL")) {
      setCheckoutSpecialError("The entered token code is invalid or not registered.");
      return;
    }

    const amtStr = code.replace("SPECIAL", "");
    const parsedAmt = parseInt(amtStr, 10);
    if (isNaN(parsedAmt) || parsedAmt <= 0) {
      setCheckoutSpecialError("The entered token code is invalid or not registered.");
      return;
    }

    // Apply code locally to the list of active codes
    setCheckoutData(prev => {
      if (!prev) return null;
      // Filter out any older SPECIAL codes
      const cleanCodes = prev.activeCodes.filter(c => !c.toUpperCase().startsWith("SPECIAL"));
      const newActiveCodes = [...cleanCodes, code];
      
      // Persist to localStorage
      const updated = { ...prev, activeCodes: newActiveCodes };
      localStorage.setItem("afterhours_checkout_data", JSON.stringify(updated));
      return updated;
    });

    setPaymentOption("custom_reserve");
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    setFileError("");
    const file = e.target.files?.[0];
    if (!file) {
      setSelectedFile(null);
      setFileBase64("");
      setFileName("");
      setFileMimeType("");
      return;
    }

    if (file.size > 3 * 1024 * 1024) {
      setFileError("File exceeds the maximum limit of 3MB.");
      setSelectedFile(null);
      setFileBase64("");
      setFileName("");
      setFileMimeType("");
      return;
    }

    setSelectedFile(file);
    setFileName(file.name);
    setFileMimeType(file.type);

    const reader = new FileReader();
    reader.onload = () => {
      const resultStr = reader.result as string;
      const base64Content = resultStr.split(",")[1] || "";
      setFileBase64(base64Content);
    };
    reader.onerror = () => {
      setFileError("Error converting file to Base64.");
    };
    reader.readAsDataURL(file);
  };

  const handleRazorpayPayment = () => {
    if (!isRazorpayLoaded) {
      alert("Razorpay payment gateway is still loading. Please try again in a moment.");
      return;
    }

    setIsProcessing(true);
    setPaymentError("");
    const amountToPay = calculatePaymentAmount();

    // Razorpay Integration Options
    const options = {
      key: "rzp_live_SrSUBeAX9NQORg", // Specified Razorpay key
      amount: amountToPay * 100, // Razorpay expects amount in paise
      currency: "INR",
      name: "After Hours",
      description: paymentOption === "reserve" 
        ? "Reserve Now - Date & Gear Lock" 
        : paymentOption === "custom_reserve"
          ? `Custom Reserve Deposit (Approved Code: ${checkoutSpecialCode})`
          : `Pay In Full - VIP Premium Package (${selectedVipPerk === "controller" ? "Extra Premium Controller" : "Premium Game Add-on"})`,
      image: "https://images.unsplash.com/photo-1612287230202-1bf1d85d1bdf?auto=format&fit=crop&q=80&w=150&h=150", 
      handler: function (response: any) {
        setIsProcessing(false);
        setPaymentSuccess(true);
        setPaymentDetails({
          paymentId: response.razorpay_payment_id,
          orderId: response.razorpay_order_id || `ORD_${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
          signature: response.razorpay_signature,
          amountPaid: amountToPay,
          paymentMode: paymentOption
        });
        // Clear cart after successful transaction
        localStorage.removeItem("afterhours_checkout_data");
      },
      prefill: {
        name: name || "Customer",
        contact: phone || "9999999999"
      },
      notes: {
        address: "New Delhi Delivery Setup",
        rental_dates: `${startDate} to ${endDate}`,
        vip_perk: paymentOption === "full" ? selectedVipPerk : "none",
        special_code: paymentOption === "custom_reserve" ? checkoutSpecialCode : "none"
      },
      theme: {
        color: "#a855f7" // Neon violet/purple brand highlight
      },
      modal: {
        ondismiss: function() {
          setIsProcessing(false);
          setPaymentError("Payment cancelled.");
        }
      }
    };

    try {
      const rzp = new (window as any).Razorpay(options);
      rzp.open();
    } catch (err) {
      console.error("Razorpay initiation crash :", err);
      setIsProcessing(false);
      alert("Something went wrong while launching the payment popup. Please retry.");
    }
  };

  const handleWhatsAppFallback = () => {
    const txId = paymentDetails?.paymentId || "N/A";
    const amtPaid = `₹${paymentDetails?.amountPaid || calculatePaymentAmount()}`;

    const textPayload = `Hello After Hours! I just completed my payment online but had trouble with the form.

Transaction ID: ${txId}
Amount Paid: ${amtPaid}

Here are my remaining details for delivery:

*Name: * ${deliveryName || ""}
*Contact Number: * ${deliveryPhone || ""}
*Email: * ${deliveryEmail || ""}
*Delivery Location: * ${deliveryLocation || ""}

(I will attach my Corporate/Govt ID to this chat)`;

    const encodedText = encodeURIComponent(textPayload);
    window.open(`https://wa.me/919711844884?text=${encodedText}`, "_blank", "noopener,noreferrer");
  };

  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      setDeliveryError("Geolocation is not supported by your browser. Please paste a link manually.");
      return;
    }

    setIsDetectingLocation(true);
    setDeliveryError("");

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const mapsLink = `https://www.google.com/maps?q=${latitude},${longitude}`;
        setDeliveryLocation(mapsLink);
        setIsDetectingLocation(false);
      },
      (error) => {
        setIsDetectingLocation(false);
        console.error("Geolocation error:", error);
        switch (error.code) {
          case error.PERMISSION_DENIED:
            setDeliveryError("Location access denied. Please allow location permissions or paste a Google Maps link manually.");
            break;
          case error.POSITION_UNAVAILABLE:
            setDeliveryError("Local position unavailable. Please paste a Google Maps link manually.");
            break;
          case error.TIMEOUT:
            setDeliveryError("Location detection request timed out. Please paste a Google Maps link manually.");
            break;
          default:
            setDeliveryError("Could not capture automatically. Please paste a Google Maps link manually.");
            break;
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const handleDeliverySubmission = async (e: FormEvent) => {
    e.preventDefault();
    setDeliveryError("");
    if (!deliveryName.trim()) {
      setDeliveryError("Full Name is required.");
      return;
    }
    if (!deliveryPhone.trim()) {
      setDeliveryError("WhatsApp Number is required.");
      return;
    }
    if (!deliveryEmail.trim()) {
      setDeliveryError("Email address is required.");
      return;
    }
    if (!deliveryLocation.trim()) {
      setDeliveryError("Delivery Location Google Maps Link is required.");
      return;
    }

    setIsSyncingDelivery(true);
    try {
      const bookingItemsStr = cart.map(item => `${item.name} (x${item.quantity})`).join(", ");
      const durationStr = `${startDate} to ${endDate} (${getDaysCount()} days)`;
      const totalPaidStr = `₹${paymentDetails?.amountPaid || calculatePaymentAmount()}`;
      const discountStr = `₹${discount || 0}`;

      // 1. Upload file if selected
      let fileUrl = "";
      if (selectedFile) {
        const uniqueFolder = auth.currentUser?.uid || `guest_${Date.now()}`;
        const storagePath = `kyc_uploads/${uniqueFolder}/${selectedFile.name}`;
        const storageRef = ref(storage, storagePath);
        const uploadResult = await uploadBytes(storageRef, selectedFile);
        fileUrl = await getDownloadURL(uploadResult.ref);
      }

      // 2. Add document to Firestore 'orders' collection
      await addDoc(collection(db, "orders"), {
        name: deliveryName,
        dates: durationStr,
        transactionId: paymentDetails?.paymentId || "N/A",
        location: deliveryLocation,
        documentUrl: fileUrl,
        email: deliveryEmail,
        number: deliveryPhone,
        totalPaid: totalPaidStr,
        discount: discountStr,
        assetsRent: bookingItemsStr,
        createdAt: new Date().toISOString()
      });

      setDeliverySynced(true);
    } catch (err: any) {
      console.error("Delivery submission error:", err);
      try {
        handleFirestoreError(err, OperationType.WRITE, "orders");
      } catch (firestoreErr: any) {
        setDeliveryError("Failure registering delivery: permissions are insufficient or offline client.");
        throw firestoreErr;
      }
    } finally {
      setIsSyncingDelivery(false);
    }
  };

  return (
    <div className="pt-32 pb-24 bg-afterhours-black min-h-screen text-white relative overflow-hidden">
      {/* Background glowing meshes */}
      <div className="absolute top-1/4 -left-1/4 w-[500px] h-[500px] bg-afterhours-purple/10 blur-[150px] rounded-full pointer-events-none" />
      <div className="absolute bottom-1/4 -right-1/4 w-[500px] h-[500px] bg-afterhours-green/5 blur-[150px] rounded-full pointer-events-none" />

      <div className="container mx-auto px-6 max-w-6xl relative z-10">
        
        {/* Back Link */}
        <button 
          onClick={() => navigate("/rentals")}
          className="group inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest text-white/40 hover:text-white mb-12 transition-colors"
        >
          <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
          Back to Rental Arena
        </button>

        <AnimatePresence mode="wait">
          {!paymentSuccess ? (
            <motion.div 
              key="checkout-flow"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-12"
            >
              
              {/* TASK 1: LEFT SIDE - ORDER SUMMARY */}
              <div className="lg:col-span-5 space-y-8">
                <div>
                  <h1 className="text-3xl md:text-4xl font-black uppercase italic tracking-tight mb-2">
                    Secure <span className="text-afterhours-purple">Checkout</span>
                  </h1>
                  <p className="text-white/40 text-xs uppercase font-bold tracking-widest">
                    Verify Arena configuration before reservation
                  </p>
                </div>

                {/* Sleek Glassmorphism Card */}
                <div className="bg-afterhours-gray/80 backdrop-blur-xl border border-white/10 rounded-[2.5rem] p-8 space-y-6 shadow-2xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-afterhours-purple/10 blur-2xl rounded-full" />
                  
                  {/* Period Block */}
                  <div className="border-b border-white/5 pb-6">
                    <span className="text-[10px] uppercase font-bold text-white/40 tracking-[0.2em] block mb-2">
                      Rental Period ({getDaysCount()} days)
                    </span>
                    <div className="flex items-center gap-3">
                      <div className="bg-white/5 p-2 rounded-xl border border-white/5 text-afterhours-purple">
                        <Calendar size={18} />
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm tracking-tight text-white">{startDate}</span>
                        <span className="text-white/30 text-xs">➔</span>
                        <span className="font-mono text-sm tracking-tight text-white">{endDate}</span>
                      </div>
                    </div>
                  </div>

                  {/* Cart Items */}
                  <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 scrollbar-thin">
                    <span className="text-[10px] uppercase font-bold text-white/40 tracking-[0.2em] block">
                      Selected Assets
                    </span>
                    {cart.map((item) => (
                      <div key={item.id} className="flex items-center justify-between gap-4 p-4 rounded-2xl bg-black/40 border border-white/5">
                        <div className="flex-1">
                          <h4 className="text-xs font-black uppercase italic text-white/90">{item.name}</h4>
                          <p className="text-[10px] text-white/40 uppercase tracking-wider mt-0.5">
                            ₹{item.price} / day × {item.quantity}
                          </p>
                        </div>
                        <div className="text-right">
                          <span className="text-xs font-bold text-afterhours-cyan font-mono">
                            ₹{item.calculatedPrice}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Pricing Breakdown */}
                  <div className="border-t border-white/5 pt-6 space-y-3 text-sm">
                    <div className="flex justify-between text-white/55">
                      <span className="text-xs uppercase tracking-wider">Subtotal</span>
                      <span className="font-mono">₹{subtotal}</span>
                    </div>

                    {discount > 0 && (
                      <div className="flex justify-between text-afterhours-green">
                        <span className="text-xs uppercase tracking-wider flex items-center gap-1 font-black">
                          <Tag size={12} /> {hasVipOverride ? "VIP Discount Applied" : "Promo Discount"}
                        </span>
                        <span className="font-mono font-black">-₹{discount}</span>
                      </div>
                    )}

                    <div className="flex justify-between text-white/55">
                      <span className="text-xs uppercase tracking-wider">Setup & Safe Delivery</span>
                      <span className="font-mono">₹{deliveryFee}</span>
                    </div>

                    <div className="border-t border-white/5 pt-4 flex justify-between items-end">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-white/40 tracking-widest block mb-1">
                          Total Value
                        </span>
                        <span className="text-xs text-white/40 font-mono">(incl. taxes)</span>
                      </div>
                      <span className="text-3xl font-black italic text-afterhours-cyan font-mono drop-shadow-[0_0_15px_rgba(34,211,238,0.2)]">
                        ₹{finalTotal}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Trust Signal badge */}
                <div className="flex items-center gap-3 p-5 rounded-2xl bg-white/5 border border-white/10">
                  <ShieldCheck className="text-afterhours-green shrink-0" size={24} />
                  <div>
                    <h4 className="text-[11px] font-black uppercase tracking-wider text-white">Trustpilot Grade Security</h4>
                    <p className="text-[9px] text-white/40 uppercase tracking-widest">
                      Encrypted Razorpay connection with 100% money back risk-protection.
                    </p>
                  </div>
                </div>
              </div>

              {/* TASK 1: RIGHT SIDE - PAYMENT SELECTION */}
              <div className="lg:col-span-7 space-y-8">
                <div>
                  <h2 className="text-xl font-black uppercase italic tracking-tight mb-2">
                    Payment <span className="text-afterhours-green">Options</span>
                  </h2>
                  <p className="text-white/40 text-xs uppercase font-bold tracking-widest">
                    Choose your payment formula and unlock premium perks
                  </p>
                </div>

                {/* User Info Capsule */}
                <div className="grid grid-cols-2 gap-4 p-5 rounded-2xl bg-white/5 border border-white/10">
                  <div>
                    <span className="text-[9px] uppercase font-mono text-white/40">Registered Name</span>
                    <p className="text-xs font-bold text-white truncate">{name || "Quick Guest"}</p>
                  </div>
                  <div>
                    <span className="text-[9px] uppercase font-mono text-white/40">Contact Number</span>
                    <p className="text-xs font-bold text-white truncate">{phone || "Not specified"}</p>
                  </div>
                </div>

                {/* TASK 2: THE PAYMENT OPTIONS */}
                <div className="space-y-4">
                  
                  {/* Option 1: Reserve Now - 500 */}
                  <div 
                    role="button"
                    tabIndex={0}
                    onClick={() => setPaymentOption("reserve")}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        setPaymentOption("reserve");
                      }
                    }}
                    className={`w-full text-left p-6 rounded-3xl border transition-all relative flex items-start gap-4 cursor-pointer focus:outline-none focus:ring-1 focus:ring-afterhours-purple ${
                      paymentOption === "reserve" 
                        ? "bg-afterhours-gray border-afterhours-purple/60 shadow-[0_0_20px_rgba(168,85,247,0.1)]" 
                        : "bg-afterhours-gray/30 border-white/5 hover:border-white/15"
                    }`}
                  >
                    <div className="mt-1 flex items-center justify-center">
                      <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                        paymentOption === "reserve" ? "border-afterhours-purple" : "border-white/30"
                      }`}>
                        {paymentOption === "reserve" && <div className="w-2.5 h-2.5 rounded-full bg-afterhours-purple" />}
                      </div>
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm font-black uppercase italic text-white">
                          Reserve Now (Pay ₹{getReserveDepositAmount()} Deposit)
                        </span>
                        <span className="text-xs font-bold text-white/60 font-mono">₹{getReserveDepositAmount()}</span>
                      </div>
                      <p className="text-[11px] text-white/50 leading-relaxed">
                        Lock in your dates and gear today. The remaining balance (₹{finalTotal - getReserveDepositAmount()}) is due upon doorstep delivery and setup.
                      </p>
                    </div>
                  </div>

                  {/* Option 2 Card: Highly Highlighted Pay in Full */}
                  <div 
                    role="button"
                    tabIndex={0}
                    onClick={() => setPaymentOption("full")}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        setPaymentOption("full");
                      }
                    }}
                    className={`w-full text-left p-6 rounded-3xl border transition-all relative flex items-start gap-4 overflow-hidden cursor-pointer focus:outline-none focus:ring-1 focus:ring-afterhours-green ${
                      paymentOption === "full" 
                        ? "bg-afterhours-gray border-afterhours-green/80 shadow-[0_0_25px_rgba(34,197,94,0.15)] ring-2 ring-afterhours-green/25" 
                        : "bg-afterhours-gray/30 border-white/5 hover:border-white/15"
                    }`}
                  >
                    {/* Pulsing visual halo banner */}
                    <div className="absolute top-0 right-0 bg-afterhours-green text-black font-black uppercase tracking-[0.15em] text-[9px] px-4 py-1.5 rounded-bl-2xl">
                      BEST VALUE / VIP PERK
                    </div>

                    <div className="mt-1 flex items-center justify-center">
                      <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                        paymentOption === "full" ? "border-afterhours-green" : "border-white/30"
                      }`}>
                        {paymentOption === "full" && <div className="w-2.5 h-2.5 rounded-full bg-afterhours-green" />}
                      </div>
                    </div>

                    <div className="flex-1">
                      <div className="flex justify-between items-center mb-1 mr-28 sm:mr-32">
                        <span className="text-sm font-black uppercase italic text-white flex items-center gap-1.5">
                          Pay in Full
                        </span>
                        <span className="text-xs font-black text-afterhours-green font-mono">₹{finalTotal}</span>
                      </div>
                      <p className="text-[11px] text-white/50 leading-relaxed max-w-lg mb-4">
                        Settle your total today and choose a completely complimentary add-on (Extra Controller or Premium Game) during delivery setup!
                      </p>

                      {/* VIP Perk selection inside the card if selected */}
                      {paymentOption === "full" && (
                        <motion.div 
                          initial={{ opacity: 0, y: -5 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="p-4 bg-black/40 border border-white/5 rounded-2xl space-y-4"
                        >
                          <span className="text-[9px] uppercase font-black tracking-widest text-afterhours-green flex items-center gap-1">
                            <Sparkles size={11} /> Choose Your Complimentary VIP Perk Add-on:
                          </span>
                          <div className="grid grid-cols-2 gap-3">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedVipPerk("controller");
                              }}
                              className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                                selectedVipPerk === "controller" 
                                  ? "bg-afterhours-green/10 border-afterhours-green text-afterhours-green font-bold text-[10px] uppercase tracking-wider" 
                                  : "bg-white/5 border-white/5 text-white/40 text-[10px] uppercase tracking-wider hover:border-white/10"
                              }`}
                            >
                              Extra DualSense Controller
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedVipPerk("game");
                              }}
                              className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                                selectedVipPerk === "game" 
                                  ? "bg-afterhours-green/10 border-afterhours-green text-afterhours-green font-bold text-[10px] uppercase tracking-wider" 
                                  : "bg-white/5 border-white/5 text-white/40 text-[10px] uppercase tracking-wider hover:border-white/10"
                              }`}
                            >
                              Additional Premium Game
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </div>
                  </div>

                  {/* Option 3: Custom Deposit (SPECIAL Code Required) */}
                  <div 
                    role="button"
                    tabIndex={0}
                    onClick={() => {
                      if (getCustomDepositAmount()) {
                        setPaymentOption("custom_reserve");
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        if (getCustomDepositAmount()) {
                          setPaymentOption("custom_reserve");
                        }
                      }
                    }}
                    className={`w-full text-left p-6 rounded-3xl border transition-all relative flex flex-col items-start gap-4 cursor-pointer focus:outline-none focus:ring-1 focus:ring-afterhours-cyan ${
                      paymentOption === "custom_reserve" 
                        ? "bg-afterhours-gray border-afterhours-cyan/60 shadow-[0_0_20px_rgba(34,211,238,0.1)]" 
                        : "bg-afterhours-gray/30 border-white/5 hover:border-white/15"
                    } ${!getCustomDepositAmount() ? "opacity-95" : ""}`}
                  >
                    <div className="flex items-start gap-4 w-full">
                      <div className="mt-1 flex items-center justify-center">
                        <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                          paymentOption === "custom_reserve" ? "border-afterhours-cyan" : "border-white/30"
                        }`}>
                          {paymentOption === "custom_reserve" && <div className="w-2.5 h-2.5 rounded-full bg-afterhours-cyan" />}
                        </div>
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-sm font-black uppercase italic text-white flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-afterhours-cyan animate-pulse" />
                            Option 3: Team-Shared Token Deposit
                          </span>
                          {getCustomDepositAmount() ? (
                            <span className="text-xs font-black text-afterhours-cyan font-mono bg-afterhours-cyan/15 px-3 py-1 rounded-full border border-afterhours-cyan/25 animate-pulse">₹{getCustomDepositAmount()}</span>
                          ) : (
                            <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest bg-white/5 px-2.5 py-1 rounded border border-white/5 font-mono">CODE REQUIRED</span>
                          )}
                        </div>
                        <p className="text-[11px] text-white/50 leading-relaxed max-w-lg mb-4">
                          Need a customized deposit token? Enter the exclusive booking lock code shared by our support agents during consultation.
                        </p>
                      </div>
                    </div>

                    {/* Integrated dynamic code slot */}
                    <div className="w-full pl-9" onClick={(e) => e.stopPropagation()}>
                      <div className="flex gap-2 max-w-sm">
                        <input
                          type="text"
                          placeholder="Enter exclusive code"
                          value={checkoutSpecialCode}
                          onChange={(e) => {
                            setCheckoutSpecialCode(e.target.value.toUpperCase().trim());
                            setCheckoutSpecialError("");
                          }}
                          className="bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-xs font-mono uppercase tracking-widest focus:outline-none focus:border-afterhours-cyan flex-1"
                        />
                        <button
                          type="button"
                          onClick={handleApplySpecialCode}
                          className="bg-afterhours-cyan/10 border border-afterhours-cyan text-afterhours-cyan hover:bg-afterhours-cyan hover:text-black font-black uppercase tracking-wider text-[10px] px-4 py-2 rounded-xl transition-all"
                        >
                          Apply Token Code
                        </button>
                      </div>
                      {checkoutSpecialError && (
                        <p className="text-[10px] text-red-400 font-mono italic mt-1.5">{checkoutSpecialError}</p>
                      )}
                      {getCustomDepositAmount() && (
                        <p className="text-[10px] text-afterhours-green font-mono italic mt-1.5 animate-pulse">
                          ✓ Token applied! Custom deposit of ₹{getCustomDepositAmount()} activated (remaining dues ₹{finalTotal - (getCustomDepositAmount() || 0)}).
                        </p>
                      )}
                    </div>
                  </div>

                </div>

                {/* TASK 3: CALL TO ACTION & RAZORPAY MODAL ACCELERATOR */}
                <div className="pt-6 border-t border-white/5 space-y-4">
                  {paymentError && (
                    <div className="flex items-center gap-2 p-4 bg-red-950/40 border border-red-500/20 rounded-2xl text-red-400 text-xs font-mono">
                      <AlertCircle size={16} /> {paymentError}
                    </div>
                  )}
                  <button
                    disabled={isProcessing}
                    onClick={handleRazorpayPayment}
                    className="w-full py-6 rounded-[2rem] text-sm font-black uppercase tracking-[0.2em] transition-all bg-gradient-to-r from-afterhours-purple to-afterhours-green text-black hover:scale-[1.02] active:scale-98 shadow-[0_0_30px_rgba(168,85,247,0.25)] flex items-center justify-center gap-2"
                  >
                    {isProcessing ? (
                      <>
                        <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                        Connecting to Razorpay...
                      </>
                    ) : (
                      <>
                        Proceed to Secure Payment (₹{calculatePaymentAmount()}) ➔
                      </>
                    )}
                  </button>

                  {/* Payment Breakdown Summary Tag */}
                  <div className="mt-4 flex items-center justify-center gap-4 text-[10px] uppercase tracking-wider text-white/40">
                    <span className="flex items-center gap-1">
                      <Clock size={12} /> Instant Allocation
                    </span>
                    <span className="text-white/20">•</span>
                    <span className="flex items-center gap-1">
                      <ShieldCheck size={12} /> SSL Encrypted
                    </span>
                  </div>
                </div>

              </div>

            </motion.div>
          ) : !deliverySynced ? (
            /* Smooth delivery details registration form */
            <motion.div
              key="delivery-registration-form"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="max-w-2xl mx-auto py-8 p-10 bg-afterhours-gray/90 border border-afterhours-purple/30 rounded-[3rem] relative overflow-hidden backdrop-blur-xl shadow-2xl space-y-8"
            >
              <div className="absolute top-0 right-0 w-48 h-48 bg-afterhours-purple/10 blur-[90px] rounded-full pointer-events-none" />

              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-afterhours-green/10 border border-afterhours-green/30 text-afterhours-green flex items-center justify-center mx-auto mb-4 shadow-[0_0_20px_rgba(34,197,94,0.2)]">
                  <span className="text-2xl font-bold animate-pulse">✓</span>
                </div>
                <h2 className="text-3xl font-black uppercase italic tracking-tight mb-1 text-white">
                  Payment <span className="text-afterhours-green">Authorized!</span>
                </h2>
                <p className="text-[10px] text-afterhours-green uppercase font-bold tracking-widest bg-afterhours-green/10 border border-afterhours-green/20 py-1.5 px-4 rounded-full inline-block mb-3">
                  Verification Complete
                </p>
                <p className="text-white/60 text-xs max-w-md mx-auto leading-relaxed">
                  Share remaining details for smooth delivery. Our dispatch team will use these coordinates to lock in your setup location.
                </p>
              </div>

              {/* Already Filled - Read-Only Auto-Populated Configuration Summary */}
              <div>
                <span className="text-[10px] uppercase font-bold text-white/40 tracking-widest block mb-1 font-mono">
                  Already Filled (From Order Summary)
                </span>
                <div className="bg-black/45 border border-white/5 p-5 rounded-2xl grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
                  <div>
                    <span className="text-[9px] uppercase font-bold text-white/30 tracking-widest block mb-1">Transaction ID</span>
                    <span className="text-afterhours-cyan font-bold break-all">
                      {paymentDetails?.paymentId || "N/A"}
                    </span>
                  </div>
                  <div>
                    <span className="text-[9px] uppercase font-bold text-white/30 tracking-widest block mb-1">Total Paid Funds</span>
                    <span className="text-white font-bold">
                      ₹{paymentDetails?.amountPaid || calculatePaymentAmount()} ({paymentOption === "reserve" ? "₹500 Deposit" : paymentOption === "custom_reserve" ? `₹${getCustomDepositAmount()} Custom Deposit` : "Full"})
                    </span>
                  </div>
                  <div>
                    <span className="text-[9px] uppercase font-bold text-white/30 tracking-widest block mb-1">Discount Applied</span>
                    <span className="text-afterhours-green font-bold">
                      ₹{discount || 0} Saved
                    </span>
                  </div>
                  <div>
                    <span className="text-[9px] uppercase font-bold text-white/30 tracking-widest block mb-1">Asset Rented Out</span>
                    <span className="text-white font-bold break-words">
                      {cart.map(item => `${item.name} (x${item.quantity})`).join(", ")}
                    </span>
                  </div>
                  <div className="md:col-span-2 border-t border-white/5 pt-2">
                    <span className="text-[9px] uppercase font-bold text-white/30 tracking-widest block mb-1">From and To Dates</span>
                    <span className="text-white font-bold">
                      {startDate} to {endDate} ({getDaysCount()} Days)
                    </span>
                  </div>
                </div>
              </div>

              {/* Form Input Block */}
              <form onSubmit={handleDeliverySubmission} className="space-y-6">
                <div>
                  <span className="text-[10px] uppercase font-bold text-afterhours-purple tracking-widest block mb-3 font-mono">
                    Please Complete Required Fields
                  </span>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    
                    {/* Full Name */}
                    <div className="space-y-2">
                      <label className="text-[10px] uppercase font-bold tracking-widest text-white/50 block">Name</label>
                      <input
                        type="text"
                        required
                        value={deliveryName}
                        onChange={(e) => setDeliveryName(e.target.value)}
                        placeholder="e.g. John Doe"
                        className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-sm font-mono focus:border-afterhours-purple focus:ring-1 focus:ring-afterhours-purple outline-none transition-all text-white"
                      />
                    </div>

                    {/* WhatsApp Number */}
                    <div className="space-y-2">
                      <label className="text-[10px] uppercase font-bold tracking-widest text-white/50 block">WhatsApp Phone Number</label>
                      <input
                        type="tel"
                        required
                        value={deliveryPhone}
                        onChange={(e) => setDeliveryPhone(e.target.value)}
                        placeholder="e.g. 9999999999"
                        className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-sm font-mono focus:border-afterhours-purple focus:ring-1 focus:ring-afterhours-purple outline-none transition-all text-white"
                      />
                    </div>

                    {/* Email */}
                    <div className="md:col-span-2 space-y-2">
                      <label className="text-[10px] uppercase font-bold tracking-widest text-white/50 block">Email Address</label>
                      <input
                        type="email"
                        required
                        value={deliveryEmail}
                        onChange={(e) => setDeliveryEmail(e.target.value)}
                        placeholder="e.g. john@example.com"
                        className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-sm font-mono focus:border-afterhours-purple focus:ring-1 focus:ring-afterhours-purple outline-none transition-all text-white"
                      />
                    </div>

                    {/* Location Link */}
                    <div className="md:col-span-2 space-y-2">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <label className="text-[10px] uppercase font-bold tracking-widest text-white/50 block">Location Link</label>
                        <button
                          type="button"
                          onClick={handleGetCurrentLocation}
                          disabled={isDetectingLocation}
                          className="text-[10px] uppercase font-bold tracking-wider text-afterhours-cyan hover:text-white transition-colors cursor-pointer flex items-center gap-1.5 bg-afterhours-cyan/10 hover:bg-afterhours-cyan/25 border border-afterhours-cyan/20 py-1.5 px-3.5 rounded-full outline-none"
                        >
                          <Navigation size={10} className={isDetectingLocation ? "animate-spin" : ""} />
                          {isDetectingLocation ? "Detecting Coordinates..." : "📍 Use My Current Location"}
                        </button>
                      </div>
                      <input
                        type="url"
                        required
                        value={deliveryLocation}
                        onChange={(e) => setDeliveryLocation(e.target.value)}
                        placeholder="e.g. https://maps.app.goo.gl/... or use button above"
                        className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-sm font-mono focus:border-afterhours-purple focus:ring-1 focus:ring-afterhours-purple outline-none transition-all text-white"
                      />
                    </div>

                    {/* Government ID / Corporate ID File Upload input (KYC) */}
                    <div className="md:col-span-2 space-y-2">
                      <label className="text-[10px] uppercase font-bold tracking-widest text-white/50 block">
                        Upload Corporate ID / Government ID (For Zero-Deposit Verification) <span className="text-white/30 italic">(Optional)</span>
                      </label>
                      <div className="relative group border-2 border-dashed border-white/10 rounded-2xl p-6 bg-black/30 hover:bg-black/50 hover:border-afterhours-purple/40 transition-all flex flex-col items-center justify-center cursor-pointer">
                        <input
                          type="file"
                          accept=".pdf, image/jpeg, image/png"
                          onChange={handleFileChange}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        />
                        <div className="text-center space-y-2 pointer-events-none">
                          <div className="text-xl">📁</div>
                          <p className="text-xs text-white/70 font-semibold font-mono">
                            {selectedFile ? `✓ Selected: ${selectedFile.name}` : "Click to select or drag & drop"}
                          </p>
                          <p className="text-[9px] text-white/40 uppercase tracking-widest font-mono">
                            Supports PDF, JPEG, PNG (Max 3MB file size limit)
                          </p>
                        </div>
                      </div>
                      {fileError && (
                        <p className="text-xs text-red-500 font-mono italic mt-1">⚠️ {fileError}</p>
                      )}
                    </div>

                  </div>
                </div>

                {deliveryError && (
                  <div className="flex items-center gap-2 p-4 bg-red-950/40 border border-red-500/20 rounded-2xl text-red-400 text-xs font-mono">
                    <AlertCircle size={16} /> {deliveryError}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSyncingDelivery}
                  className="w-full py-5 rounded-2xl text-sm font-black uppercase tracking-[0.2em] transition-all bg-gradient-to-r from-afterhours-purple to-afterhours-green text-black hover:scale-[1.01] active:scale-98 shadow-xl flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isSyncingDelivery ? (
                    <>
                      <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                      Saving remaining details...
                    </>
                  ) : (
                    "Submit Details for Smooth Delivery ➔"
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleWhatsAppFallback}
                  className="w-full py-4 rounded-2xl text-xs font-bold uppercase tracking-[0.15em] transition-all bg-black/40 border border-[#25D366]/40 text-[#25D366] hover:bg-black/60 hover:border-[#25D366]/80 hover:scale-[1.01] active:scale-98 shadow-lg flex items-center justify-center gap-2 cursor-pointer text-center"
                >
                  <span className="text-sm">💬</span> Having trouble? Send details via WhatsApp
                </button>
              </form>

              <div className="flex flex-col items-center border-t border-white/5 pt-4 space-y-2">
                <span className="text-[10px] uppercase font-bold text-white/30 tracking-widest">or skip register setup</span>
                <a
                  href="/index.html"
                  className="px-8 py-3.5 bg-white/10 hover:bg-white/15 text-white border border-white/10 rounded-full font-bold uppercase tracking-widest text-[11px] transition-all cursor-pointer hover:scale-[1.01] inline-block active:scale-98"
                >
                  Return to Home
                </a>
              </div>
            </motion.div>
          ) : (
            /* Ultimate Booking Completed Screen Overlay */
            <motion.div
              key="payment-success-overlay"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="max-w-xl mx-auto text-center py-12 p-8 bg-afterhours-gray/50 border border-afterhours-green/20 rounded-[3rem] relative overflow-hidden backdrop-blur-xl shadow-2xl"
            >
              {/* Dynamic shining particles grid */}
              <div className="absolute top-0 right-0 w-48 h-48 bg-afterhours-green/10 blur-[90px] rounded-full pointer-events-none" />
              
              <div className="w-16 h-16 rounded-full bg-afterhours-green/10 border border-afterhours-green/30 text-afterhours-green flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 size={36} className="animate-bounce" />
              </div>

              <h2 className="text-2xl md:text-3xl font-black uppercase italic tracking-tight mb-2 text-white">
                Delivery <span className="text-afterhours-cyan">Confirmed!</span>
              </h2>
              <p className="text-white/40 text-[10px] uppercase font-bold tracking-widest bg-black/30 py-1.5 px-4 rounded-full inline-block mb-3">
                Delivery Schedule Locked
              </p>

              <div className="space-y-4 text-left bg-black/40 border border-white/5 p-6 rounded-2xl mb-8 font-mono text-xs">
                <div className="flex justify-between border-b border-white/5 pb-2">
                  <span className="text-white/40 uppercase">Transaction ID</span>
                  <span className="text-white font-bold">{paymentDetails?.paymentId}</span>
                </div>
                <div className="flex justify-between border-b border-white/5 pb-2">
                  <span className="text-white/40 uppercase">Amount Paid</span>
                  <span className="text-afterhours-green font-bold">₹{paymentDetails?.amountPaid}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/40 uppercase">Registered Customer</span>
                  <span className="text-white font-bold">{deliveryName}</span>
                </div>
              </div>

              <p className="text-white/60 text-xs leading-relaxed max-w-md mx-auto mb-8">
                Your setup is locked for <span className="text-white font-black">{startDate}</span> to <span className="text-white font-black">{endDate}</span>. Our concierge team has verified your delivery details and will contact you at <span className="text-afterhours-cyan font-bold">{deliveryPhone}</span> to coordinate delivery setup!
              </p>

              <div className="flex justify-center gap-4">
                <a
                  href="/index.html"
                  className="bg-white/10 hover:bg-white/15 text-white px-8 py-4 rounded-full font-bold uppercase tracking-widest text-xs transition-colors cursor-pointer inline-flex items-center"
                >
                  Return to Home
                </a>
                <a
                  href={`https://wa.me/919711844884?text=${encodeURIComponent(
                    `Hey After Hours! I just paid ₹${paymentDetails?.amountPaid} on your portal and shared my delivery details. Customer: ${deliveryName}. Dates: ${startDate} to ${endDate}. Trans ID: ${paymentDetails?.paymentId}`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-afterhours-purple text-white px-8 py-4 rounded-full font-black uppercase tracking-widest text-xs hover:scale-105 transition-transform flex items-center gap-2 cursor-pointer"
                >
                  Ping Concierge on WhatsApp
                </a>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}
