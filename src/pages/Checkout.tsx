import { useState, useEffect, FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { 
  ArrowLeft, ShieldCheck, CreditCard, Sparkles, Check, 
  Clock, HelpCircle, AlertCircle, ShoppingCart, Calendar, Tag, CheckCircle2 
} from "lucide-react";
import { fixedPriceCodes } from "../lib/fixedPriceCodes";
import { googleSignIn, writeToGoogleSheets, getCachedToken } from "../lib/sheetsAuth";

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
  const [paymentOption, setPaymentOption] = useState<"reserve" | "full">("full");
  const [selectedVipPerk, setSelectedVipPerk] = useState<"controller" | "game">("controller");
  const [isRazorpayLoaded, setIsRazorpayLoaded] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState<boolean | null>(null);
  const [paymentDetails, setPaymentDetails] = useState<any>(null);

  // Google Sheets integration form states
  const [sheetFullName, setSheetFullName] = useState("");
  const [sheetEmail, setSheetEmail] = useState("");
  const [sheetOfficialEmail, setSheetOfficialEmail] = useState("");
  const [sheetWhatsApp, setSheetWhatsApp] = useState("");
  const [sheetLocationLink, setSheetLocationLink] = useState("");
  const [sheetsError, setSheetsError] = useState("");
  const [sheetsSynced, setSheetsSynced] = useState(false);
  const [isSyncingSheets, setIsSyncingSheets] = useState(false);
  const [googleUser, setGoogleUser] = useState<any>(null);
  const [googleToken, setGoogleToken] = useState<string | null>(null);
  const [spreadsheetLink, setSpreadsheetLink] = useState("");

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
      if (parsed.name) setSheetFullName(parsed.name);
      if (parsed.phone) setSheetWhatsApp(parsed.phone);
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

  const calculatePaymentAmount = () => {
    return paymentOption === "reserve" ? 500 : finalTotal;
  };

  const handleRazorpayPayment = () => {
    if (!isRazorpayLoaded) {
      alert("Razorpay payment gateway is still loading. Please try again in a moment.");
      return;
    }

    setIsProcessing(true);
    const amountToPay = calculatePaymentAmount();

    // Razorpay Integration Options
    const options = {
      key: "rzp_live_SrSUBeAX9NQORg", // Specified Razorpay key
      amount: amountToPay * 100, // Razorpay expects amount in paise
      currency: "INR",
      name: "After Hours",
      description: paymentOption === "reserve" 
        ? "Reserve Now - Date & Gear Lock" 
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
        vip_perk: paymentOption === "full" ? selectedVipPerk : "none"
      },
      theme: {
        color: "#a855f7" // Neon violet/purple brand highlight
      },
      modal: {
        ondismiss: function() {
          setIsProcessing(false);
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

  const handleSheetsSubmission = async (e: FormEvent) => {
    e.preventDefault();
    setSheetsError("");
    if (!sheetFullName.trim()) {
      setSheetsError("Full Name is required.");
      return;
    }
    if (!sheetEmail.trim()) {
      setSheetsError("Email Address is required.");
      return;
    }
    if (!sheetWhatsApp.trim()) {
      setSheetsError("WhatsApp Number is required.");
      return;
    }
    if (!sheetLocationLink.trim()) {
      setSheetsError("Delivery Location Link is required.");
      return;
    }

    setIsSyncingSheets(true);
    try {
      let token = googleToken || getCachedToken();

      if (!token) {
        console.log("No token cached, prompting Google Sign In...");
        const result = await googleSignIn();
        if (result) {
          token = result.accessToken;
          setGoogleUser(result.user);
          setGoogleToken(result.accessToken);
          // Auto fill email if currently blank
          if (!sheetEmail && result.user.email) {
            setSheetEmail(result.user.email);
          }
        } else {
          throw new Error("Could not acquire Google access token. Please try signing in again.");
        }
      }

      const bookingItemsStr = cart.map(item => `${item.name} (x${item.quantity})`).join(", ");
      const durationStr = `${startDate} to ${endDate} (${getDaysCount()} days)`;
      const finalPriceStr = `₹${calculatePaymentAmount()} (${paymentOption === "reserve" ? "₹500 Deposit" : "Paid In Full"})`;
      const discountStr = `₹${discount}`;

      const { spreadsheetUrl } = await writeToGoogleSheets(token!, {
        fullName: sheetFullName,
        email: sheetEmail,
        officialEmail: sheetOfficialEmail,
        whatsappNumber: sheetWhatsApp,
        locationLink: sheetLocationLink,
        bookingItems: bookingItemsStr,
        duration: durationStr,
        finalPrice: finalPriceStr,
        discount: discountStr,
      });

      setSpreadsheetLink(spreadsheetUrl);
      setSheetsSynced(true);
    } catch (err: any) {
      console.error("Sheets submission error:", err);
      setSheetsError(err.message || "Failed to sync to Google Sheets. Please confirm authorization and try again.");
    } finally {
      setIsSyncingSheets(false);
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
                  <button 
                    onClick={() => setPaymentOption("reserve")}
                    className={`w-full text-left p-6 rounded-3xl border transition-all relative flex items-start gap-4 ${
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
                          Reserve Now (Pay ₹500 Deposit)
                        </span>
                        <span className="text-xs font-bold text-white/60 font-mono">₹500</span>
                      </div>
                      <p className="text-[11px] text-white/50 leading-relaxed">
                        Lock in your dates and gear today. The remaining balance (₹{finalTotal - 500}) is due upon doorstep delivery and setup.
                      </p>
                    </div>
                  </button>

                  {/* Option 2 Card: Highly Highlighted Pay in Full */}
                  <button 
                    onClick={() => setPaymentOption("full")}
                    className={`w-full text-left p-6 rounded-3xl border transition-all relative flex items-start gap-4 overflow-hidden ${
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
                              className={`p-3 rounded-xl border text-center transition-all ${
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
                              className={`p-3 rounded-xl border text-center transition-all ${
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
                  </button>

                </div>

                {/* TASK 3: CALL TO ACTION & RAZORPAY MODAL ACCELERATOR */}
                <div className="pt-6 border-t border-white/5">
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
          ) : !sheetsSynced ? (
            /* Google Sheets Sync Registration Form */
            <motion.div
              key="google-sheets-form"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="max-w-2xl mx-auto py-8 p-10 bg-afterhours-gray/90 border border-afterhours-purple/30 rounded-[3rem] relative overflow-hidden backdrop-blur-xl shadow-2xl space-y-8"
            >
              <div className="absolute top-0 right-0 w-48 h-48 bg-afterhours-purple/10 blur-[90px] rounded-full pointer-events-none" />

              <div className="text-center">
                <div className="w-12 h-12 rounded-full bg-afterhours-green/10 border border-afterhours-green/30 text-afterhours-green flex items-center justify-center mx-auto mb-4">
                  <span className="text-lg font-bold">✓</span>
                </div>
                <h2 className="text-2xl font-black uppercase italic tracking-tight mb-2 text-white">
                  Payment <span className="text-afterhours-green">Authorized!</span>
                </h2>
                <p className="text-white/40 text-[10px] uppercase font-bold tracking-widest bg-black/30 py-1.5 px-4 rounded-full inline-block">
                  Log Booking Details to Secure Setup Location
                </p>
              </div>

              {/* Read-Only Auto-Populated Configuration Summary */}
              <div className="bg-black/40 border border-white/5 p-5 rounded-2xl grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
                <div>
                  <span className="text-[10px] uppercase font-bold text-white/30 tracking-widest block mb-1">Auto-Selected Gear</span>
                  <span className="text-white font-bold break-words">
                    {cart.map(item => `${item.name} (x${item.quantity})`).join(", ")}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-white/30 tracking-widest block mb-1">Rental Duration</span>
                  <span className="text-white font-bold">
                    {startDate} to {endDate} ({getDaysCount()} Days)
                  </span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-white/30 tracking-widest block mb-1">Final Cost Paid</span>
                  <span className="text-afterhours-cyan font-bold">
                    ₹{paymentDetails?.amountPaid} ({paymentDetails?.paymentMode === "reserve" ? "₹500 Deposit" : "Full"})
                  </span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-white/30 tracking-widest block mb-1">Discount Applied</span>
                  <span className="text-afterhours-green font-bold">
                    ₹{discount || 0} Saved
                  </span>
                </div>
              </div>

              {/* Form Input Block */}
              <form onSubmit={handleSheetsSubmission} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  {/* Full Name */}
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase font-bold tracking-widest text-white/50 block">Full Name</label>
                    <input
                      type="text"
                      required
                      value={sheetFullName}
                      onChange={(e) => setSheetFullName(e.target.value)}
                      placeholder="e.g. John Doe"
                      className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-sm font-mono focus:border-afterhours-purple focus:ring-1 focus:ring-afterhours-purple outline-none transition-all text-white"
                    />
                  </div>

                  {/* Email */}
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase font-bold tracking-widest text-white/50 block">Personal Email</label>
                    <input
                      type="email"
                      required
                      value={sheetEmail}
                      onChange={(e) => setSheetEmail(e.target.value)}
                      placeholder="e.g. john@example.com"
                      className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-sm font-mono focus:border-afterhours-purple focus:ring-1 focus:ring-afterhours-purple outline-none transition-all text-white"
                    />
                  </div>

                  {/* Official Email */}
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase font-bold tracking-widest text-white/50 block">Official Email (Optional)</label>
                    <input
                      type="email"
                      value={sheetOfficialEmail}
                      onChange={(e) => setSheetOfficialEmail(e.target.value)}
                      placeholder="e.g. mail@company.com"
                      className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-sm font-mono focus:border-afterhours-purple focus:ring-1 focus:ring-afterhours-purple outline-none transition-all text-white"
                    />
                  </div>

                  {/* WhatsApp Number */}
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase font-bold tracking-widest text-white/50 block">WhatsApp Contact Number</label>
                    <input
                      type="text"
                      required
                      value={sheetWhatsApp}
                      onChange={(e) => setSheetWhatsApp(e.target.value)}
                      placeholder="e.g. +91 9999999999"
                      className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-sm font-mono focus:border-afterhours-purple focus:ring-1 focus:ring-afterhours-purple outline-none transition-all text-white"
                    />
                  </div>

                  {/* Location Link */}
                  <div className="md:col-span-2 space-y-2">
                    <label className="text-[10px] uppercase font-bold tracking-widest text-white/50 block">Delivery Location Google Maps Link</label>
                    <input
                      type="url"
                      required
                      value={sheetLocationLink}
                      onChange={(e) => setSheetLocationLink(e.target.value)}
                      placeholder="e.g. https://maps.app.goo.gl/..."
                      className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-sm font-mono focus:border-afterhours-purple focus:ring-1 focus:ring-afterhours-purple outline-none transition-all text-white"
                    />
                  </div>

                </div>

                {sheetsError && (
                  <div className="flex items-center gap-2 p-4 bg-red-950/40 border border-red-500/20 rounded-2xl text-red-400 text-xs font-mono">
                    <AlertCircle size={16} /> {sheetsError}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSyncingSheets}
                  className="w-full py-5 rounded-2xl text-sm font-black uppercase tracking-[0.2em] transition-all bg-gradient-to-r from-afterhours-purple to-afterhours-green text-black hover:scale-[1.01] active:scale-98 shadow-xl flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isSyncingSheets ? (
                    <>
                      <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                      Syncing to Google Sheets...
                    </>
                  ) : googleToken ? (
                    "Authorize & Log Booking to Google Sheets ➔"
                  ) : (
                    "Login with Google & Log Booking Row ➔"
                  )}
                </button>
              </form>
            </motion.div>
          ) : (
            /* Ultimate Booking Completed Screen Overlay with sheets link */
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
                Booking <span className="text-afterhours-green">Confirmed!</span>
              </h2>
              <p className="text-white/40 text-xs uppercase font-bold tracking-widest bg-black/30 py-1.5 px-4 rounded-full inline-block mb-8">
                Synced with Google Sheets Log
              </p>

              <div className="space-y-4 text-left bg-black/40 border border-white/5 p-6 rounded-2xl mb-8 font-mono text-xs">
                <div className="flex justify-between border-b border-white/5 pb-2">
                  <span className="text-white/40 uppercase">Transaction ID</span>
                  <span className="text-white font-bold">{paymentDetails?.paymentId}</span>
                </div>
                <div className="flex justify-between border-b border-white/5 pb-2">
                  <span className="text-white/40 uppercase">Spreadsheet Log</span>
                  <span className="text-afterhours-green font-bold">Logged successfully</span>
                </div>
                <div className="flex justify-between border-b border-white/5 pb-2">
                  <span className="text-white/40 uppercase">Amount Paid</span>
                  <span className="text-afterhours-green font-bold">₹{paymentDetails?.amountPaid}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/40 uppercase">Registered Customer</span>
                  <span className="text-white font-bold">{sheetFullName}</span>
                </div>
              </div>

              <div className="space-y-4 mb-8">
                {spreadsheetLink && (
                  <a
                    href={spreadsheetLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full block py-4 rounded-2xl text-xs font-black uppercase tracking-[0.15em] bg-afterhours-green text-black hover:scale-102 transition-all text-center shadow-[0_0_20px_rgba(34,197,94,0.3)] duration-200"
                  >
                    Open Google Sheets Bookings Log ➔
                  </a>
                )}
              </div>

              <p className="text-white/60 text-xs leading-relaxed max-w-md mx-auto mb-8">
                Your setup is locked for <span className="text-white font-black">{startDate}</span> to <span className="text-white font-black">{endDate}</span>. Our concierge team has verified your Google Sheets registry entry and will contact you at <span className="text-afterhours-cyan font-bold">{sheetWhatsApp}</span> to coordinate delivery setup!
              </p>

              <div className="flex justify-center gap-4">
                <button
                  onClick={() => navigate("/rentals")}
                  className="bg-white/10 hover:bg-white/15 text-white px-8 py-4 rounded-full font-bold uppercase tracking-widest text-xs transition-colors cursor-pointer"
                >
                  Return to Storefront
                </button>
                <a
                  href={`https://wa.me/919711844884?text=${encodeURIComponent(
                    `Hey After Hours! I just paid ₹${paymentDetails?.amountPaid} on your portal and logged the sheets register. Full Name: ${sheetFullName}. Dates: ${startDate} to ${endDate}. Trans ID: ${paymentDetails?.paymentId}`
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
