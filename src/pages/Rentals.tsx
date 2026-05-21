import { motion, AnimatePresence } from "motion/react";
import { 
  Package, ArrowRight, CheckCircle2, Monitor, Gamepad2, 
  Speaker, Zap, ShieldCheck, Truck, ShoppingCart, Calendar, 
  Tag, X, Plus, Minus
} from "lucide-react";
import { useState, useMemo, useEffect, FormEvent, ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { GearAssistant } from "@/src/components/sections/GearAssistant";
import { fixedPriceCodes } from "../lib/fixedPriceCodes";

// --- Types ---
interface RentalItem {
  id: string;
  name: string;
  price: number;
  desc?: string;
  category: "Combo" | "Hardware";
  icon: ReactNode;
  isFeatured?: boolean;
}

interface CartItem extends RentalItem {
  quantity: number;
}

// --- Data ---
const RENTAL_ITEMS: RentalItem[] = [
  {
    id: "combo-theatre",
    name: "Gaming Theatre",
    price: 1999,
    desc: "Includes Sony PS5 Console + Full HD Projector.",
    category: "Combo",
    isFeatured: true,
    icon: <Monitor className="w-full h-full" />
  },
  {
    id: "combo-racing",
    name: "PS5 Mega Racing Combo",
    price: 1999,
    desc: "Includes Sony PS5 Console + Logitech G29 Driving Force Racing Wheel.",
    category: "Combo",
    isFeatured: true,
    icon: <Zap className="w-full h-full" />
  },
  {
    id: "combo-party",
    name: "Full Party Setup",
    price: 1799,
    desc: "Includes Full HD Projector + JBL PartyBox Speaker. (Note: Console not included).",
    category: "Combo",
    isFeatured: true,
    icon: <Speaker className="w-full h-full" />
  },
  {
    id: "hw-vr2",
    name: "Sony PlayStation VR2",
    price: 1599,
    category: "Hardware",
    icon: <Zap className="w-full h-full" />
  },
  {
    id: "hw-ps5",
    name: "Sony PS5 Console",
    price: 1299,
    desc: "Includes standard controllers",
    category: "Hardware",
    icon: <Gamepad2 className="w-full h-full" />
  },
  {
    id: "hw-wheel",
    name: "Logitech G29 Racing Wheel",
    price: 1199,
    category: "Hardware",
    icon: <Zap className="w-full h-full" />
  },
  {
    id: "hw-speaker",
    name: "JBL Party Speaker",
    price: 1199,
    category: "Hardware",
    icon: <Speaker className="w-full h-full" />
  },
  {
    id: "hw-projector",
    name: "Full HD Projector",
    price: 999,
    category: "Hardware",
    icon: <Monitor className="w-full h-full" />
  }
];

const PROMO_CODES: Record<string, { type: 'delivery' | 'discount', value: number, minSubtotal?: number }> = {
  "FREEDELIVERY": { type: 'delivery', value: 199 },
  "FLAT50": { type: 'discount', value: 50 },
  "FLAT100": { type: 'discount', value: 100 },
  "FLAT150": { type: 'discount', value: 150 },
  "SPECIAL200": { type: 'discount', value: 200, minSubtotal: 1700 },
  "COMBO250": { type: 'discount', value: 250, minSubtotal: 1700 },
  "VIP_AH_DIS": { type: 'discount', value: 300, minSubtotal: 1700 }
};

// --- Helper Functions ---
const getLevenshteinDistance = (s1: string, s2: string): number => {
  const m = s1.length;
  const n = s2.length;
  const d: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) d[i][0] = i;
  for (let j = 0; j <= n; j++) d[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = s1[i - 1] === s2[j - 1] ? 0 : 1;
      d[i][j] = Math.min(
        d[i - 1][j] + 1,      // deletion
        d[i][j - 1] + 1,      // insertion
        d[i - 1][j - 1] + cost // substitution
      );
    }
  }
  return d[m][n];
};

const findClosestCode = (input: string): string | null => {
  const codes = [...Object.keys(PROMO_CODES), ...Object.keys(fixedPriceCodes)];
  let minDistance = Infinity;
  let closest = null;

  for (const code of codes) {
    const distance = getLevenshteinDistance(input, code);
    if (distance < minDistance) {
      minDistance = distance;
      closest = code;
    }
  }

  // Only return if it's a "small mistake" (distance <= 2)
  return minDistance <= 2 ? closest : null;
};

const calculateItemPriceForDates = (basePrice: number, startDate: string, endDate: string) => {
  if (!startDate || !endDate) return basePrice;
  
  const start = new Date(startDate);
  const end = new Date(endDate);
  if (end < start) return basePrice;

  let total = 0;
  const current = new Date(start);
  let dayCount = 0;

  while (current <= end) {
    if (dayCount === 0) {
      total += basePrice;
    } else {
      const dayOfWeek = current.getDay();
      let multiplier = 0.5;
      if (dayOfWeek === 0 || dayOfWeek === 5 || dayOfWeek === 6) {
        multiplier = 0.7;
      }
      const dailyPrice = Math.round((basePrice * multiplier) / 10) * 10;
      total += dailyPrice;
    }
    current.setDate(current.getDate() + 1);
    dayCount++;
  }
  return total;
};

export function Rentals() {
  const navigate = useNavigate();
  // --- State ---
  const [cart, setCart] = useState<CartItem[]>([]);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [promoInput, setPromoInput] = useState("");
  const [promoError, setPromoError] = useState("");
  const [activeCodes, setActiveCodes] = useState<string[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    phone: ""
  });

  // --- Calculations ---
  const activeOverrideCode = useMemo(() => {
    return activeCodes.find(code => code in fixedPriceCodes) || null;
  }, [activeCodes]);

  const overrideAmount = useMemo(() => {
    if (!activeOverrideCode) return null;
    return fixedPriceCodes[activeOverrideCode];
  }, [activeOverrideCode]);

  const subtotal = useMemo(() => {
    return cart.reduce((acc, item) => {
      const itemTotalPrice = calculateItemPriceForDates(item.price, startDate, endDate);
      return acc + (itemTotalPrice * item.quantity);
    }, 0);
  }, [cart, startDate, endDate]);

  const deliveryFee = activeCodes.includes("FREEDELIVERY") ? 0 : 199;

  const originalTotal = subtotal + deliveryFee;

  const discount = useMemo(() => {
    if (activeOverrideCode && overrideAmount !== null) {
      return Math.max(0, originalTotal - overrideAmount);
    }
    let totalDiscount = 0;
    activeCodes.forEach(code => {
      const promo = PROMO_CODES[code];
      if (promo && promo.type === 'discount') {
        if (promo.minSubtotal && subtotal <= promo.minSubtotal) {
          totalDiscount += 0;
        } else {
          totalDiscount += promo.value;
        }
      }
    });
    return totalDiscount;
  }, [activeCodes, subtotal, activeOverrideCode, overrideAmount, originalTotal]);

  const finalTotal = useMemo(() => {
    if (activeOverrideCode && overrideAmount !== null) {
      return overrideAmount;
    }
    return Math.max(0, originalTotal - discount);
  }, [originalTotal, discount, activeOverrideCode, overrideAmount]);

  // --- Effects ---
  useEffect(() => {
    const validCodes = activeCodes.filter(code => {
      if (code in fixedPriceCodes) return true;
      const promo = PROMO_CODES[code];
      if (promo && promo.minSubtotal && subtotal <= promo.minSubtotal) return false;
      return true;
    });
    if (validCodes.length !== activeCodes.length) {
      setActiveCodes(validCodes);
    }
  }, [subtotal, activeCodes]);

  // --- Handlers ---
  const addToCart = (item: RentalItem) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === item.id);
      if (existing) {
        return prev.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { ...item, quantity: 1 }];
    });
    setIsCartOpen(true);
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const newQty = Math.max(0, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    }).filter(item => item.quantity > 0));
  };

  const applyPromoCode = () => {
    const code = promoInput.toUpperCase().trim();
    if (!code) return;

    // Check if it's in fixed price Codes
    const overrideVal = fixedPriceCodes[code];

    if (overrideVal !== undefined) {
      const currentOriginalTotal = subtotal + deliveryFee;
      if (overrideVal > currentOriginalTotal) {
        setPromoError("Code not applicable for this cart value");
        return;
      }
      if (activeCodes.includes(code)) {
        setPromoError("Code already applied.");
        return;
      }
      setPromoError("");
      // Replace other discount/override codes with the new override code
      setActiveCodes(prev => [
        ...prev.filter(c => !(c in fixedPriceCodes) && c === "FREEDELIVERY"),
        code
      ]);
      setPromoInput("");
      return;
    }

    const promo = PROMO_CODES[code];

    if (!promo) {
      const closest = findClosestCode(code);
      if (closest) {
        setPromoError(`Spelling mistake. Did you mean: ${closest}?`);
      } else {
        setPromoError("Invalid VIP Code.");
      }
      return;
    }

    if (promo.minSubtotal && subtotal <= promo.minSubtotal) {
      setPromoError(`Requires subtotal of ₹${promo.minSubtotal}.`);
      return;
    }

    if (activeCodes.includes(code)) {
      setPromoError("Code already applied.");
      return;
    }

    setPromoError("");
    if (promo.type === 'delivery') {
      setActiveCodes(prev => [...prev.filter(c => PROMO_CODES[c]?.type !== 'delivery'), code]);
    } else {
      setActiveCodes(prev => [
        ...prev.filter(c => !(c in fixedPriceCodes) && PROMO_CODES[c]?.type !== 'discount'),
        code
      ]);
    }
    
    setPromoInput("");
  };

  const removeCode = (code: string) => {
    setActiveCodes(prev => prev.filter(c => c !== code));
  };

  const handleCheckoutRedirect = () => {
    if (cart.length === 0 || !startDate || !endDate) {
      alert("Please select gear and rental dates first.");
      return;
    }

    const checkoutData = {
      cart: cart.map(item => ({
        id: item.id,
        name: item.name,
        price: item.price,
        calculatedPrice: calculateItemPriceForDates(item.price, startDate, endDate),
        quantity: item.quantity,
        category: item.category
      })),
      startDate,
      endDate,
      activeCodes,
      subtotal,
      deliveryFee,
      discount,
      finalTotal,
      name: formData.name,
      phone: formData.phone
    };

    localStorage.setItem("afterhours_checkout_data", JSON.stringify(checkoutData));
    navigate("/checkout");
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.phone) {
      alert("Please fill in both Name and Phone to customize your secure checkout configuration!");
      return;
    }
    handleCheckoutRedirect();
  };

  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="pt-32 pb-24 bg-afterhours-black min-h-screen text-white">
      <div className="container mx-auto px-6">
        
        {/* Hero Header */}
        <div className="max-w-4xl mb-24">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-6xl md:text-8xl font-black uppercase italic mb-8 leading-none"
          >
            Build Your <span className="text-afterhours-purple">Own</span> <br />
            <span className="text-white">Setup.</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-white/60 text-xl md:text-2xl max-w-2xl leading-relaxed"
          >
            Premium tech delivered and installed. Choose a custom combo or rent individual gear for your next night in.
          </motion.p>
        </div>

        <GearAssistant onAddItems={(itemIds) => {
          itemIds.forEach(id => {
            const item = RENTAL_ITEMS.find(i => i.id === id);
            if (item) addToCart(item);
          });
        }} />

        {/* Featured Combos */}
        <section className="mb-32">
          <div className="flex items-center gap-4 mb-12">
            <div className="h-px flex-1 bg-white/10"></div>
            <h2 className="text-xs font-bold uppercase tracking-[0.3em] text-white/40">Featured Combos</h2>
            <div className="h-px flex-1 bg-white/10"></div>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {RENTAL_ITEMS.filter(i => i.isFeatured).map((combo, index) => (
              <motion.div
                key={combo.id}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
                viewport={{ once: true }}
                className="relative p-8 rounded-[2.5rem] bg-afterhours-charcoal border-2 border-afterhours-purple/20 hover:border-afterhours-purple transition-all group overflow-hidden neon-glow-purple"
              >
                <div className="aspect-video w-full bg-black/40 rounded-2xl mb-8 flex items-center justify-center p-12 text-afterhours-purple/40 group-hover:text-afterhours-purple transition-colors overflow-hidden relative">
                  <div className="absolute inset-0 opacity-10 group-hover:opacity-20 transition-opacity">
                    <Zap className="w-full h-full scale-150 rotate-12" />
                  </div>
                  <div className="relative z-10 w-24 h-24">
                    {combo.icon}
                  </div>
                </div>
                
                <h3 className="text-3xl font-black uppercase italic mb-2 leading-tight">{combo.name}</h3>
                <p className="text-2xl font-black mb-4 text-afterhours-purple">₹{combo.price}/day</p>
                <p className="text-white/50 text-sm mb-8 leading-relaxed h-12">{combo.desc}</p>
                
                <button 
                  onClick={() => addToCart(combo)}
                  className="w-full py-4 rounded-full bg-[#90e0d0] text-black font-bold uppercase tracking-widest text-xs transition-all hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2"
                >
                  Add to Cart ➔
                </button>
              </motion.div>
            ))}
          </div>
        </section>

        {/* A La Carte Hardware */}
        <section className="mb-32">
          <div className="flex items-center gap-4 mb-12">
            <div className="h-px flex-1 bg-white/10"></div>
            <h2 className="text-xs font-bold uppercase tracking-[0.3em] text-white/40">A La Carte Hardware</h2>
            <div className="h-px flex-1 bg-white/10"></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {RENTAL_ITEMS.filter(i => !i.isFeatured).map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                viewport={{ once: true }}
                className="p-6 rounded-3xl bg-afterhours-charcoal border border-white/5 hover:border-white/20 transition-all group"
              >
                <div className="aspect-square w-full bg-black/40 rounded-2xl mb-6 flex items-center justify-center p-10 text-afterhours-cyan/40 group-hover:text-afterhours-cyan transition-colors overflow-hidden relative">
                  <div className="absolute inset-0 opacity-5 group-hover:opacity-10 transition-opacity">
                    <Package className="w-full h-full scale-110" />
                  </div>
                  <div className="relative z-10 w-16 h-16">
                    {item.icon}
                  </div>
                </div>

                <h3 className="text-lg font-bold uppercase italic mb-1">{item.name}</h3>
                <p className="text-white/30 text-[10px] uppercase tracking-widest mb-4 h-8">{item.desc || "Premium Gear"}</p>
                <div className="flex items-center justify-between mt-auto">
                  <p className="text-afterhours-cyan font-black">₹{item.price}/day</p>
                  <button 
                    onClick={() => addToCart(item)}
                    className="px-4 py-2 rounded-full bg-[#90e0d0] text-black font-bold uppercase tracking-widest text-[10px] transition-all hover:scale-105 active:scale-95"
                  >
                    Add to Cart ➔
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* How it Works */}
        <section className="mb-32 py-20 border-y border-white/5">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {[
              { title: "Select Gear", icon: <Package size={32} /> },
              { title: "Verify ID (Zero Deposit)", icon: <ShieldCheck size={32} /> },
              { title: "Doorstep Delivery & Setup", icon: <Truck size={32} /> }
            ].map((step, index) => (
              <div key={step.title} className="text-center group">
                <div className="w-20 h-20 mx-auto mb-8 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center text-afterhours-cyan group-hover:scale-110 transition-transform duration-500">
                  {step.icon}
                </div>
                <h4 className="text-lg font-black uppercase tracking-widest mb-2">
                  <span className="text-white/20 mr-2">{index + 1}.</span>
                  {step.title}
                </h4>
              </div>
            ))}
          </div>
        </section>

        {/* Lead Capture Form (Bottom Section) */}
        <section className="max-w-4xl mx-auto mt-32">
          <div className="p-12 rounded-[3rem] bg-afterhours-charcoal border border-white/10 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-afterhours-purple/10 blur-[100px] -mr-32 -mt-32"></div>
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-afterhours-cyan/10 blur-[100px] -ml-32 -mb-32"></div>
            
            <div className="relative z-10">
              <h2 className="text-4xl font-black uppercase italic mb-4">Finalize Your Booking</h2>
              <p className="text-white/50 mb-12">Verify ID to book with zero deposit. Our team will handle delivery & setup.</p>
              
              <form onSubmit={handleSubmit} className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-4">Full Name</label>
                    <input 
                      type="text" 
                      required
                      placeholder="John Doe"
                      value={formData.name}
                      onChange={e => setFormData({...formData, name: e.target.value})}
                      className="w-full bg-black/50 border border-white/10 rounded-2xl px-6 py-4 focus:outline-none focus:border-afterhours-purple transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-4">Phone Number</label>
                    <input 
                      type="tel" 
                      required
                      placeholder="+91 97118 44884"
                      value={formData.phone}
                      onChange={e => setFormData({...formData, phone: e.target.value})}
                      className="w-full bg-black/50 border border-white/10 rounded-2xl px-6 py-4 focus:outline-none focus:border-afterhours-cyan transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-4">Gear Selection Checklist</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {RENTAL_ITEMS.map(item => (
                      <label
                        key={item.id}
                        className={`px-6 py-4 rounded-xl border text-xs font-bold uppercase tracking-widest transition-all cursor-pointer flex items-center justify-between ${
                          cart.find(i => i.id === item.id)
                            ? 'bg-white/10 border-afterhours-cyan text-white'
                            : 'bg-white/5 border-white/10 text-white/40 hover:border-white/30'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <input 
                            type="checkbox" 
                            className="hidden"
                            checked={!!cart.find(i => i.id === item.id)}
                            onChange={() => {
                              if (cart.find(i => i.id === item.id)) {
                                setCart(prev => prev.filter(i => i.id !== item.id));
                              } else {
                                addToCart(item);
                              }
                            }}
                          />
                          {item.name}
                        </div>
                        {cart.find(i => i.id === item.id) && <CheckCircle2 size={16} className="text-afterhours-cyan" />}
                      </label>
                    ))}
                  </div>
                </div>

                <button 
                  type="submit"
                  className="w-full py-6 rounded-2xl bg-linear-to-r from-afterhours-purple to-afterhours-cyan text-black font-black uppercase tracking-[0.2em] text-sm hover:scale-[1.02] transition-all active:scale-95 shadow-2xl"
                >
                  Request Gear
                </button>
              </form>
            </div>
          </div>
        </section>
      </div>

      {/* Rental Calculator / Checkout UI (Sticky Sidebar Style) */}
      <AnimatePresence>
        {isCartOpen && (
          <motion.div 
            initial={{ x: 400, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 400, opacity: 0 }}
            className="fixed top-0 right-0 h-screen w-full md:w-[450px] bg-afterhours-charcoal border-l border-white/10 z-50 shadow-2xl flex flex-col"
          >
            <div className="p-8 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <ShoppingCart className="text-afterhours-purple" />
                <h2 className="text-2xl font-black uppercase italic">Your Setup</h2>
              </div>
              <button onClick={() => setIsCartOpen(false)} className="p-2 hover:bg-white/5 rounded-full transition-colors">
                <X size={24} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-8 space-y-8">
              {/* Date Selection */}
              <div className="space-y-4">
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 flex items-center gap-2">
                  <Calendar size={14} /> Rental Period
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[9px] uppercase text-white/30 ml-2">Rental Start Date</label>
                    <input 
                      type="date" 
                      min={today}
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-afterhours-purple transition-colors cursor-pointer"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] uppercase text-white/30 ml-2">Rental End Date</label>
                    <input 
                      type="date" 
                      min={startDate || today}
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-afterhours-cyan transition-colors cursor-pointer"
                    />
                  </div>
                </div>
              </div>

              {/* Cart Items */}
              <div className="space-y-4">
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">Selected Gear</h3>
                {cart.length === 0 ? (
                  <p className="text-white/20 italic text-sm py-8 text-center border border-dashed border-white/10 rounded-2xl">Your cart is empty</p>
                ) : (
                  <div className="space-y-4">
                    {cart.map(item => (
                      <div key={item.id} className="flex items-center gap-4 p-4 rounded-2xl bg-black/30 border border-white/5">
                        <div className="w-12 h-12 rounded-lg bg-white/5 flex items-center justify-center text-white/40">
                          {item.icon}
                        </div>
                        <div className="flex-1">
                          <h4 className="text-sm font-bold uppercase italic">{item.name}</h4>
                          <p className="text-xs text-white/40">₹{calculateItemPriceForDates(item.price, startDate, endDate)} total</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <button onClick={() => updateQuantity(item.id, -1)} className="p-1 hover:text-afterhours-purple transition-colors"><Minus size={14} /></button>
                          <span className="text-sm font-bold">{item.quantity}</span>
                          <button onClick={() => addToCart(item)} className="p-1 hover:text-afterhours-cyan transition-colors"><Plus size={14} /></button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Promo Codes */}
              <div className="space-y-4">
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 flex items-center gap-2">
                  <Tag size={14} /> Promo Code
                </h3>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    placeholder="Enter Code"
                    value={promoInput}
                    onChange={(e) => {
                      setPromoInput(e.target.value);
                      setPromoError("");
                    }}
                    onKeyDown={(e) => e.key === 'Enter' && applyPromoCode()}
                    className={`flex-1 bg-black/50 border rounded-xl px-4 py-3 text-sm focus:outline-none transition-colors uppercase ${
                      promoError ? 'border-red-500' : 'border-white/10 focus:border-afterhours-purple'
                    }`}
                  />
                  <button 
                    onClick={applyPromoCode}
                    className="px-6 rounded-xl bg-white/10 hover:bg-white/20 font-bold uppercase text-[10px] transition-colors"
                  >
                    Apply
                  </button>
                </div>
                {promoError && (
                  <p className="text-red-500 text-[10px] font-bold uppercase tracking-widest mt-1 ml-2">
                    {promoError}
                  </p>
                )}
                <div className="flex flex-wrap gap-2">
                  {activeCodes.map(code => (
                    <div key={code} className="flex items-center gap-2 px-3 py-1 bg-afterhours-purple/20 text-afterhours-purple rounded-full text-[10px] font-bold border border-afterhours-purple/30">
                      {code}
                      <button onClick={() => removeCode(code)}><X size={12} /></button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Summary Footer */}
            <div className="p-8 bg-black/40 border-t border-white/10 space-y-4">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-white/40">
                  <span>Subtotal</span>
                  <span>₹{subtotal}</span>
                </div>
                <div className="flex justify-between text-white/40">
                  <span>Delivery Fee</span>
                  <span>₹{deliveryFee}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-afterhours-cyan font-bold">
                    <span>{activeOverrideCode ? "VIP Discount Applied" : "Discount"}</span>
                    <span>-₹{discount}</span>
                  </div>
                )}
                <div className="flex justify-between text-xl font-black uppercase italic pt-4 border-t border-white/10">
                  <span>Final Total</span>
                  <span className="text-afterhours-cyan">₹{finalTotal}</span>
                </div>
              </div>
              <button 
                disabled={cart.length === 0 || !startDate || !endDate}
                onClick={handleCheckoutRedirect}
                className="w-full py-5 rounded-2xl bg-linear-to-r from-afterhours-purple to-afterhours-cyan text-black font-black uppercase tracking-[0.2em] text-sm disabled:opacity-50 disabled:grayscale transition-all hover:scale-[1.02] active:scale-95 shadow-2xl"
              >
                Proceed to Checkout
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Cart Trigger (Mobile) */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsCartOpen(true)}
        className="fixed bottom-8 right-8 w-16 h-16 rounded-full bg-afterhours-purple text-black shadow-2xl flex items-center justify-center z-40 md:hidden"
      >
        <div className="relative">
          <ShoppingCart size={24} />
          {cart.length > 0 && (
            <span className="absolute -top-2 -right-2 w-5 h-5 bg-afterhours-cyan rounded-full text-[10px] font-black flex items-center justify-center border-2 border-afterhours-purple">
              {cart.reduce((a, b) => a + b.quantity, 0)}
            </span>
          )}
        </div>
      </motion.button>
    </div>
  );
}
