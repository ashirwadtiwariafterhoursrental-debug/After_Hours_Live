import { motion, AnimatePresence } from "motion/react";
import { 
  Package, ArrowRight, Monitor, Gamepad2, 
  Speaker, Zap, ShieldCheck, Truck, ShoppingCart, Calendar, 
  Tag, X, Plus, Minus, AlertTriangle, Loader2, Disc,
  Mic, Maximize, Play, Image
} from "lucide-react";
import { useState, useMemo, useEffect, FormEvent, ReactNode, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { GearAssistant } from "@/src/components/sections/GearAssistant";
import { fixedPriceCodes } from "../lib/fixedPriceCodes";
import { db, handleFirestoreError, OperationType } from "../firebase";
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, doc, setDoc, increment } from "firebase/firestore";

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
    id: "combo-party",
    name: "Full Party Setup",
    price: 1799,
    desc: "Includes Full HD Projector + JBL PartyBox Speaker. (Note: Console not included).",
    category: "Combo",
    isFeatured: true,
    icon: <Speaker className="w-full h-full" />
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
    id: "hw-ps5",
    name: "Play Station 5 ( PS5 console)",
    price: 1299,
    desc: "Includes standard controllers",
    category: "Hardware",
    icon: <Gamepad2 className="w-full h-full" />
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
  },
  {
    id: "hw-vr2",
    name: "Sony PlayStation VR2",
    price: 1599,
    category: "Hardware",
    icon: <Zap className="w-full h-full" />
  },
  {
    id: "hw-wheel",
    name: "Logitech G29 Racing Wheel",
    price: 1199,
    category: "Hardware",
    icon: <Zap className="w-full h-full" />
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

  // --- Firebase Premium Games Subscription ---
  const [premiumGames, setPremiumGames] = useState<any[]>([]);
  useEffect(() => {
    const q = query(collection(db, "premium_games"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: any[] = [];
      snapshot.forEach(doc => {
        list.push({ id: doc.id, ...doc.data() });
      });
      setPremiumGames(list);
    }, (err) => {
      console.error("Rentals error loading premium_games:", err);
    });
    return () => unsubscribe();
  }, []);

  // --- Firebase Dynamic Gear Media Subscription ---
  const [dynamicGearMedia, setDynamicGearMedia] = useState<Record<string, { mediaUrl: string; mediaUrls?: string[]; mediaType: "image" | "video" }>>({});
  useEffect(() => {
    const q = query(collection(db, "gear_catalog"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const mapping: Record<string, { mediaUrl: string; mediaUrls?: string[]; mediaType: "image" | "video" }> = {};
      snapshot.forEach(doc => {
        const data = doc.data();
        if (data.mediaUrl) {
          mapping[doc.id] = {
            mediaUrl: data.mediaUrl,
            mediaUrls: data.mediaUrls || [data.mediaUrl],
            mediaType: data.mediaType || "image"
          };
        }
      });
      setDynamicGearMedia(mapping);
    }, (err) => {
      console.error("Rentals error loading gear_catalog media:", err);
    });
    return () => unsubscribe();
  }, []);

  // --- Firebase Addon Media Subscription ---
  const [addonMedia, setAddonMedia] = useState<Record<string, { photoUrl: string; videoUrl: string; mediaUrls?: string[] }>>({});
  useEffect(() => {
    const q = query(collection(db, "addon_media"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const mapping: Record<string, { photoUrl: string; videoUrl: string; mediaUrls?: string[] }> = {};
      snapshot.forEach(doc => {
        const data = doc.data();
        if (data.photoUrl || data.videoUrl) {
          mapping[doc.id] = {
            photoUrl: data.photoUrl || "",
            videoUrl: data.videoUrl || "",
            mediaUrls: data.mediaUrls || (data.photoUrl ? [data.photoUrl] : [])
          };
        }
      });
      setAddonMedia(mapping);
    }, (err) => {
      console.error("Rentals error loading addon_media:", err);
    });
    return () => unsubscribe();
  }, []);

  const renderAddonMediaPreview = (addonName: string) => {
    const media = addonMedia[addonName];
    if (!media || (!media.photoUrl && !media.videoUrl)) {
      return (
        <div className="w-20 h-20 rounded-2xl bg-white/[0.01] border border-white/5 flex items-center justify-center text-white/20 shrink-0">
          <Image size={16} />
        </div>
      );
    }
    return (
      <AddonHoverPlayer 
        photoUrl={media.photoUrl} 
        videoUrl={media.videoUrl} 
        addonName={addonName} 
        mediaUrls={media.mediaUrls}
      />
    );
  };

  // --- Smart Cart Modal States ---
  const [isSmartCartOpen, setIsSmartCartOpen] = useState(false);
  const [smartCartItem, setSmartCartItem] = useState<RentalItem | null>(null);
  const [addExtraController, setAddExtraController] = useState(false);
  const [addProjectorScreen, setAddProjectorScreen] = useState(false);
  const [addHeavyDutyTripod, setAddHeavyDutyTripod] = useState(false);
  const [addWirelessMic, setAddWirelessMic] = useState(false);
  const [addMetaShotsBat, setAddMetaShotsBat] = useState(false);
  const [selectedGameIds, setSelectedGameIds] = useState<string[]>([]);
  const [isComboConverted, setIsComboConverted] = useState(false);
  const [isComboConverted2, setIsComboConverted2] = useState(false);

  // --- Waitlist Modal States ---
  const [isWaitlistOpen, setIsWaitlistOpen] = useState(false);
  const [waitlistItem, setWaitlistItem] = useState<RentalItem | null>(null);
  const [waitlistName, setWaitlistName] = useState("");
  const [waitlistContact, setWaitlistContact] = useState("");
  const [waitlistDate, setWaitlistDate] = useState("");
  const [isWaitlistSubmitting, setIsWaitlistSubmitting] = useState(false);
  const [waitlistSuccess, setWaitlistSuccess] = useState(false);
  const [waitlistError, setWaitlistError] = useState("");

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

  const isThresholdReached = useMemo(() => {
    if (!smartCartItem) return subtotal >= 1600;
    
    const baseItemPrice = calculateItemPriceForDates(smartCartItem.price, startDate, endDate);
    
    // Estimate total with regular un-discounted addon rates (Controller @ 299, Screen @ 199, Tripod @ 199, Mic @ 299, Bat @ 299)
    let extraControllerCost = addExtraController ? calculateItemPriceForDates(299, startDate, endDate) : 0;
    let projectorScreenCost = addProjectorScreen ? calculateItemPriceForDates(199, startDate, endDate) : 0;
    let tripodCost = addHeavyDutyTripod ? calculateItemPriceForDates(199, startDate, endDate) : 0;
    let micCost = addWirelessMic ? calculateItemPriceForDates(299, startDate, endDate) : 0;
    let batCost = addMetaShotsBat ? calculateItemPriceForDates(299, startDate, endDate) : 0;
    let gamesCost = selectedGameIds.length * calculateItemPriceForDates(199, startDate, endDate);
    
    let comboCost = 0;
    if (smartCartItem.id === "hw-ps5" && isComboConverted) {
      const theatreCombo = RENTAL_ITEMS.find(i => i.id === "combo-theatre");
      const theatrePrice = calculateItemPriceForDates(theatreCombo ? theatreCombo.price : 1999, startDate, endDate);
      comboCost = (theatrePrice - baseItemPrice);
    } else if (smartCartItem.id === "hw-speaker" && isComboConverted) {
      const partyCombo = RENTAL_ITEMS.find(i => i.id === "combo-party");
      const partyPrice = calculateItemPriceForDates(partyCombo ? partyCombo.price : 1799, startDate, endDate);
      comboCost = (partyPrice - baseItemPrice);
    } else if (smartCartItem.id === "hw-projector" && isComboConverted) {
      const theaterCombo = RENTAL_ITEMS.find(i => i.id === "combo-theatre");
      const theaterPrice = calculateItemPriceForDates(theaterCombo ? theaterCombo.price : 1999, startDate, endDate);
      comboCost = (theaterPrice - baseItemPrice);
    } else if (smartCartItem.id === "hw-projector" && isComboConverted2) {
      const partyCombo = RENTAL_ITEMS.find(i => i.id === "combo-party");
      const partyPrice = calculateItemPriceForDates(partyCombo ? partyCombo.price : 1799, startDate, endDate);
      comboCost = (partyPrice - baseItemPrice);
    }
    
    const estimateTotal = subtotal + baseItemPrice + extraControllerCost + projectorScreenCost + tripodCost + micCost + batCost + comboCost + gamesCost;
    return estimateTotal >= 1600;
  }, [smartCartItem, isComboConverted, isComboConverted2, addExtraController, addProjectorScreen, addHeavyDutyTripod, addWirelessMic, addMetaShotsBat, selectedGameIds, subtotal, startDate, endDate]);

  const prospectiveTotal = useMemo(() => {
    if (!smartCartItem) return subtotal;
    
    const baseItemPrice = calculateItemPriceForDates(smartCartItem.price, startDate, endDate);
    const controllerPrice = isThresholdReached ? 249 : 299;
    const screenPrice = isThresholdReached ? 149 : 199;
    const gamePrice = isThresholdReached ? 149 : 199;
    const tripodPrice = isThresholdReached ? 149 : 199;
    const micPrice = isThresholdReached ? 199 : 299;
    const batPrice = isThresholdReached ? 199 : 299;
    
    let optionsPrice = 0;
    if (addExtraController) {
      optionsPrice += calculateItemPriceForDates(controllerPrice, startDate, endDate);
    }
    
    if (smartCartItem.id === "hw-ps5" && isComboConverted) {
      const theatreCombo = RENTAL_ITEMS.find(i => i.id === "combo-theatre");
      const theatrePrice = calculateItemPriceForDates(theatreCombo ? theatreCombo.price : 1999, startDate, endDate);
      optionsPrice += (theatrePrice - baseItemPrice);
    } else if (smartCartItem.id === "hw-speaker" && isComboConverted) {
      const partyCombo = RENTAL_ITEMS.find(i => i.id === "combo-party");
      const partyPrice = calculateItemPriceForDates(partyCombo ? partyCombo.price : 1799, startDate, endDate);
      optionsPrice += (partyPrice - baseItemPrice);
    } else if (smartCartItem.id === "hw-projector" && isComboConverted) {
      const theaterCombo = RENTAL_ITEMS.find(i => i.id === "combo-theatre");
      const theaterPrice = calculateItemPriceForDates(theaterCombo ? theaterCombo.price : 1999, startDate, endDate);
      optionsPrice += (theaterPrice - baseItemPrice);
    } else if (smartCartItem.id === "hw-projector" && isComboConverted2) {
      const partyCombo = RENTAL_ITEMS.find(i => i.id === "combo-party");
      const partyPrice = calculateItemPriceForDates(partyCombo ? partyCombo.price : 1799, startDate, endDate);
      optionsPrice += (partyPrice - baseItemPrice);
    }
    
    if (addProjectorScreen) {
      optionsPrice += calculateItemPriceForDates(screenPrice, startDate, endDate);
    }
    if (addHeavyDutyTripod) {
      optionsPrice += calculateItemPriceForDates(tripodPrice, startDate, endDate);
    }
    if (addWirelessMic) {
      optionsPrice += calculateItemPriceForDates(micPrice, startDate, endDate);
    }
    if (addMetaShotsBat) {
      optionsPrice += calculateItemPriceForDates(batPrice, startDate, endDate);
    }
    
    const gamesPrice = selectedGameIds.length * calculateItemPriceForDates(gamePrice, startDate, endDate);
    
    return subtotal + baseItemPrice + optionsPrice + gamesPrice;
  }, [smartCartItem, isComboConverted, isComboConverted2, addExtraController, addProjectorScreen, addHeavyDutyTripod, addWirelessMic, addMetaShotsBat, selectedGameIds, subtotal, startDate, endDate, isThresholdReached]);

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
      if (code.toUpperCase().startsWith("SPECIAL")) return true;
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

  const openSmartCartModal = (item: RentalItem) => {
    setSmartCartItem(item);
    setAddExtraController(false);
    setAddProjectorScreen(false);
    setAddHeavyDutyTripod(false);
    setAddWirelessMic(false);
    setAddMetaShotsBat(false);
    setSelectedGameIds([]);
    setIsComboConverted(false);
    setIsComboConverted2(false);
    setIsSmartCartOpen(true);
  };

  const openWaitlistModal = (item: RentalItem) => {
    setWaitlistItem(item);
    setWaitlistName("");
    setWaitlistContact("");
    setWaitlistDate("");
    setWaitlistSuccess(false);
    setWaitlistError("");
    setIsWaitlistOpen(true);
  };

  const handlePhantomAddToCart = async (item: RentalItem) => {
    try {
      const docRef = doc(db, "intent_clicks", item.id);
      await setDoc(docRef, {
        itemId: item.id,
        itemName: item.name,
        clicks: increment(1),
        lastClicked: serverTimestamp()
      }, { merge: true });
    } catch (err) {
      console.warn("Silent click track failed:", err);
    }
    openWaitlistModal(item);
  };

  const handleWaitlistSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setWaitlistError("");
    if (!waitlistName.trim() || !waitlistContact.trim() || !waitlistDate) {
      setWaitlistError("Please fill out all waitlist fields.");
      return;
    }
    setIsWaitlistSubmitting(true);
    try {
      await addDoc(collection(db, "inventory_waitlist"), {
        name: waitlistName.trim(),
        contact: waitlistContact.trim(),
        planDate: waitlistDate,
        itemId: waitlistItem?.id || "unknown",
        itemName: waitlistItem?.name || "Premium Gear",
        createdAt: serverTimestamp()
      });
      setWaitlistSuccess(true);
    } catch (error: any) {
      console.error("Waitlist submit error:", error);
      setWaitlistError("Error: " + error.message);
    } finally {
      setIsWaitlistSubmitting(false);
    }
  };

  const handleSmartCartSubmit = () => {
    if (!smartCartItem) return;

    let itemsToAdd: RentalItem[] = [];

    // Dual Combo Converters logic
    if (smartCartItem.id === "hw-ps5" && isComboConverted) {
      const theaterItem = RENTAL_ITEMS.find(i => i.id === "combo-theatre");
      if (theaterItem) {
        itemsToAdd.push(theaterItem);
      } else {
        itemsToAdd.push(smartCartItem);
      }
    } else if (smartCartItem.id === "hw-speaker" && isComboConverted) {
      const partyItem = RENTAL_ITEMS.find(i => i.id === "combo-party");
      if (partyItem) {
        itemsToAdd.push(partyItem);
      } else {
        itemsToAdd.push(smartCartItem);
      }
    } else if (smartCartItem.id === "hw-projector" && isComboConverted) {
      const theaterItem = RENTAL_ITEMS.find(i => i.id === "combo-theatre");
      if (theaterItem) {
        itemsToAdd.push(theaterItem);
      } else {
        itemsToAdd.push(smartCartItem);
      }
    } else if (smartCartItem.id === "hw-projector" && isComboConverted2) {
      const partyItem = RENTAL_ITEMS.find(i => i.id === "combo-party");
      if (partyItem) {
        itemsToAdd.push(partyItem);
      } else {
        itemsToAdd.push(smartCartItem);
      }
    } else {
      itemsToAdd.push(smartCartItem);
    }

    const activeControllerPrice = isThresholdReached ? 249 : 299;
    const activeScreenPrice = isThresholdReached ? 149 : 199;
    const activeTripodPrice = isThresholdReached ? 149 : 199;
    const activeMicPrice = isThresholdReached ? 199 : 299;
    const activeBatPrice = isThresholdReached ? 199 : 299;
    const activeGamePrice = isThresholdReached ? 149 : 199;

    // Add extra controllers as addon item
    if (addExtraController) {
      itemsToAdd.push({
        id: "addon-controller",
        name: "Extra DualSense Controller (Addon)",
        price: activeControllerPrice,
        category: "Hardware",
        icon: <Gamepad2 className="w-full h-full" />
      });
    }

    // Add projector screen as addon item
    if (addProjectorScreen) {
      itemsToAdd.push({
        id: "addon-screen",
        name: "Projector Screen (Addon)",
        price: activeScreenPrice,
        category: "Hardware",
        icon: <Monitor className="w-full h-full" />
      });
    }

    // Add tripod as addon item
    if (addHeavyDutyTripod) {
      itemsToAdd.push({
        id: "addon-tripod",
        name: "Heavy Duty Tripod (Addon)",
        price: activeTripodPrice,
        category: "Hardware",
        icon: <Maximize className="w-full h-full" />
      });
    }

    // Add wireless mic as addon item
    if (addWirelessMic) {
      itemsToAdd.push({
        id: "addon-mic",
        name: "Wireless Mic (Addon)",
        price: activeMicPrice,
        category: "Hardware",
        icon: <Mic className="w-full h-full" />
      });
    }

    // Add meta shots bat as addon item
    if (addMetaShotsBat) {
      itemsToAdd.push({
        id: "addon-bat",
        name: "Meta Shots Bat (Addon)",
        price: activeBatPrice,
        category: "Hardware",
        icon: <Zap className="w-full h-full" />
      });
    }

    selectedGameIds.forEach(gameId => {
      const gameObj = premiumGames.find(g => g.id === gameId);
      if (gameObj) {
        itemsToAdd.push({
          id: `addon-game-${gameObj.id}`,
          name: `Premium Game: ${gameObj.title}`,
          price: activeGamePrice,
          category: "Hardware",
          icon: <Gamepad2 className="w-full h-full" />
        });
      }
    });

    setCart(prev => {
      let currentCart = [...prev];

      itemsToAdd.forEach(item => {
        // If we are adding Gaming Theatre Combo (due to conversion), clean up standalone parts
        if (item.id === "combo-theatre") {
          currentCart = currentCart.filter(c => c.id !== "hw-ps5" && c.id !== "hw-projector");
        }
        // If we are adding Party Combo, clean up speaker and projector
        if (item.id === "combo-party") {
          currentCart = currentCart.filter(c => c.id !== "hw-speaker" && c.id !== "hw-projector");
        }

        const existingIdx = currentCart.findIndex(c => c.id === item.id);
        if (existingIdx > -1) {
          currentCart[existingIdx] = {
            ...currentCart[existingIdx],
            quantity: currentCart[existingIdx].quantity + 1
          };
        } else {
          currentCart.push({ ...item, quantity: 1 });
        }
      });

      return currentCart;
    });

    setIsSmartCartOpen(false);
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

    // Check if it's a SPECIAL prefix code
    if (code.startsWith("SPECIAL")) {
      const amtStr = code.replace("SPECIAL", "");
      const parsedAmt = parseInt(amtStr, 10);
      if (!isNaN(parsedAmt) && parsedAmt > 0) {
        if (activeCodes.includes(code)) {
          setPromoError("Code already applied.");
          return;
        }
        setPromoError("");
        setActiveCodes(prev => [...prev, code]);
        setPromoInput("");
        return;
      }
    }

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
            {RENTAL_ITEMS.filter(i => i.isFeatured).map((combo, index) => {
              const isWaitlistItem = combo.id === "combo-racing" || combo.id === "hw-vr2" || combo.id === "hw-wheel";
              return (
                <motion.div
                  key={combo.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className="relative p-8 rounded-[2.5rem] bg-afterhours-charcoal border-2 border-afterhours-purple/20 hover:border-afterhours-purple transition-all group overflow-hidden neon-glow-purple"
                >
                  <div className="aspect-video w-full bg-black/40 rounded-2xl mb-8 flex items-center justify-center p-12 text-afterhours-purple/40 group-hover:text-afterhours-purple transition-colors overflow-hidden relative">
                    {dynamicGearMedia[combo.id] ? (
                      dynamicGearMedia[combo.id].mediaType === "video" ? (
                        <video src={dynamicGearMedia[combo.id].mediaUrl} className="absolute inset-0 w-full h-full object-cover rounded-2xl" muted autoPlay loop playsInline />
                      ) : (
                        <MediaCarousel
                          mediaUrls={dynamicGearMedia[combo.id].mediaUrls || [dynamicGearMedia[combo.id].mediaUrl]}
                          className="absolute inset-0 w-full h-full rounded-2xl"
                          itemTitle={combo.name}
                        />
                      )
                    ) : (
                      <>
                        <div className="absolute inset-0 opacity-10 group-hover:opacity-20 transition-opacity">
                          <Zap className="w-full h-full scale-150 rotate-12" />
                        </div>
                        <div className="relative z-10 w-24 h-24">
                          {combo.icon}
                        </div>
                      </>
                    )}
                  </div>
                  
                  <h3 className="text-3xl font-black uppercase italic mb-2 leading-tight">{combo.name}</h3>
                  <p className="text-2xl font-black mb-4 text-afterhours-purple">₹{combo.price}/day</p>
                  <p className="text-white/50 text-sm mb-8 leading-relaxed h-12">{combo.desc}</p>
                  
                  {isWaitlistItem ? (
                    <button 
                      onClick={() => handlePhantomAddToCart(combo)}
                      className="w-full py-4 rounded-full bg-[#90e0d0] text-black font-bold uppercase tracking-widest text-xs transition-all hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2 border border-white/5 shadow-lg"
                    >
                      ADD TO CART ➔
                    </button>
                  ) : (
                    <button 
                      onClick={() => openSmartCartModal(combo)}
                      className="w-full py-4 rounded-full bg-[#90e0d0] text-black font-bold uppercase tracking-widest text-xs transition-all hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2"
                    >
                      Add to Cart ➔
                    </button>
                  )}
                </motion.div>
              );
            })}
          </div>
        </section>

        {/* Premium Gears */}
        <section className="mb-32">
          <div className="flex items-center gap-4 mb-12">
            <div className="h-px flex-1 bg-white/10"></div>
            <h2 className="text-xs font-bold uppercase tracking-[0.3em] text-white/40">Premium Gears</h2>
            <div className="h-px flex-1 bg-white/10"></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {RENTAL_ITEMS.filter(i => !i.isFeatured).map((item, index) => {
              const isWaitlistItem = item.id === "combo-racing" || item.id === "hw-vr2" || item.id === "hw-wheel";
              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  viewport={{ once: true }}
                  className="p-6 rounded-3xl bg-afterhours-charcoal border border-white/5 hover:border-white/20 transition-all group lg:min-h-[350px] flex flex-col justify-between"
                >
                  <div>
                    <div className="aspect-square w-full bg-black/40 rounded-2xl mb-6 flex items-center justify-center p-10 text-afterhours-cyan/40 group-hover:text-afterhours-cyan transition-colors overflow-hidden relative">
                      {dynamicGearMedia[item.id] ? (
                        dynamicGearMedia[item.id].mediaType === "video" ? (
                          <video src={dynamicGearMedia[item.id].mediaUrl} className="absolute inset-0 w-full h-full object-cover rounded-2xl" muted autoPlay loop playsInline />
                        ) : (
                          <MediaCarousel
                            mediaUrls={dynamicGearMedia[item.id].mediaUrls || [dynamicGearMedia[item.id].mediaUrl]}
                            className="absolute inset-0 w-full h-full rounded-2xl"
                            itemTitle={item.name}
                          />
                        )
                      ) : (
                        <>
                          <div className="absolute inset-0 opacity-5 group-hover:opacity-10 transition-opacity">
                            <Package className="w-full h-full scale-110" />
                          </div>
                          <div className="relative z-10 w-16 h-16">
                            {item.icon}
                          </div>
                        </>
                      )}
                    </div>

                    <h3 className="text-lg font-bold uppercase italic mb-1">{item.name}</h3>
                    <p className="text-white/30 text-[10px] uppercase tracking-widest mb-4 h-8">{item.desc || "Premium Gear"}</p>
                  </div>
                  <div className="flex items-center justify-between mt-auto pt-4 gap-2">
                    <p className="text-afterhours-cyan font-black text-sm shrink-0">₹{item.price}/day</p>
                    {isWaitlistItem ? (
                      <button 
                        onClick={() => handlePhantomAddToCart(item)}
                        className="px-4 py-2 rounded-full bg-[#90e0d0] text-black font-bold uppercase tracking-widest text-[10px] transition-all hover:scale-105 active:scale-95 shrink-0 border border-white/5"
                      >
                        ADD TO CART
                      </button>
                    ) : (
                      <button 
                        onClick={() => openSmartCartModal(item)}
                        className="px-4 py-2 rounded-full bg-[#90e0d0] text-black font-bold uppercase tracking-widest text-[10px] transition-all hover:scale-105 active:scale-95 shrink-0"
                      >
                        Add to Cart ➔
                      </button>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </section>

        {/* How it Works */}
        <section className="mb-32 py-20 border-y border-white/5">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {[
              { title: "Select Gear", icon: <Package size={32} /> },
              { title: "Verify ID (Zero Deposit*)", icon: <ShieldCheck size={32} />, description: "*Zero deposit is only applicable upon verification via a valid corporate email address." },
              { title: "Doorstep Delivery & Setup", icon: <Truck size={32} /> }
            ].map((step, index) => (
              <div key={step.title} className="text-center group flex flex-col items-center">
                <div className="w-20 h-20 mb-8 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center text-afterhours-cyan group-hover:scale-110 transition-transform duration-500">
                  {step.icon}
                </div>
                <h4 className="text-lg font-black uppercase tracking-widest mb-2">
                  <span className="text-white/20 mr-2">{index + 1}.</span>
                  {step.title}
                </h4>
                {step.description && (
                  <p className="text-[10px] uppercase tracking-wider text-white/40 max-w-[240px] mt-2 block leading-relaxed font-mono">
                    {step.description}
                  </p>
                )}
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
                      onKeyDown={(e) => e.preventDefault()}
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
                      onKeyDown={(e) => e.preventDefault()}
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

      {/* --- TASK 3: WAITLIST MODAL --- */}
      <AnimatePresence>
        {isWaitlistOpen && waitlistItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Modal Backdrop overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsWaitlistOpen(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />

            {/* Modal Body card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-lg bg-[#121214] border border-afterhours-pink/30 rounded-[2.5rem] p-8 md:p-10 shadow-[0_0_50px_rgba(236,72,153,0.15)] overflow-hidden z-10"
            >
              {/* Pink spotlight ambient glow */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-32 bg-afterhours-pink/10 blur-[60px] pointer-events-none rounded-full" />
              
              <div className="relative flex justify-between items-start mb-6">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-[0.25em] text-afterhours-pink px-2.5 py-1 rounded-full bg-afterhours-pink/10 border border-afterhours-pink/20 mb-2.5 inline-block">
                    ⚡ Demand High / Waitlist Active
                  </span>
                  <h3 className="text-2xl font-black uppercase italic text-white flex items-center gap-2">
                    Queue: {waitlistItem.name}
                  </h3>
                </div>
                <button
                  onClick={() => setIsWaitlistOpen(false)}
                  className="p-1.5 bg-white/5 hover:bg-white/10 rounded-full text-white/50 hover:text-white transition-colors cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              {waitlistSuccess ? (
                <div className="space-y-6 text-center py-6">
                  <div className="w-16 h-16 bg-afterhours-green/15 border border-afterhours-green text-afterhours-green rounded-2xl flex items-center justify-center mx-auto text-3xl shadow-[0_0_15px_rgba(16,185,129,0.15)]">
                    ✓
                  </div>
                  <div className="space-y-2">
                    <h4 className="text-lg font-black uppercase italic text-white">Signed up to Shadow Queue!</h4>
                    <p className="text-xs text-white/60 leading-relaxed max-w-sm mx-auto">
                      We've reserved your priority spot in the waitlist for <span className="text-afterhours-pink font-bold">{waitlistItem.name}</span>. Our concierge team will ping you via WhatsApp or Email as soon as this setup clears out from rent!
                    </p>
                  </div>
                  <button
                    onClick={() => setIsWaitlistOpen(false)}
                    className="w-full py-4 rounded-xl bg-white text-black font-black uppercase tracking-widest text-xs transition-transform hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
                  >
                    Return to Catalog
                  </button>
                </div>
              ) : (
                <form onSubmit={handleWaitlistSubmit} className="space-y-6">
                  <p className="text-xs text-white/50 leading-relaxed font-sans">
                    Please submit your interest so we can notify you with a better offer.
                  </p>

                  {waitlistError && (
                    <div className="p-4 bg-red-950/40 border border-red-500/20 rounded-2xl flex items-start gap-3">
                      <AlertTriangle className="text-rose-450 mt-0.5" size={14} />
                      <p className="text-xs text-rose-350 font-mono">{waitlistError}</p>
                    </div>
                  )}

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 block ml-1">Your Name</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Rachel Green"
                        value={waitlistName}
                        onChange={(e) => setWaitlistError("") || setWaitlistName(e.target.value)}
                        className="w-full bg-black/40 border border-white/10 rounded-2xl px-5 py-3.5 text-xs font-bold text-white focus:outline-none focus:border-afterhours-pink transition-all"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 block ml-1">Phone / Email Address</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. +91 98123 45678 or rachel@gmail.com"
                        value={waitlistContact}
                        onChange={(e) => setWaitlistContact(e.target.value)}
                        className="w-full bg-black/40 border border-white/10 rounded-2xl px-5 py-3.5 text-xs font-bold text-white focus:outline-none focus:border-afterhours-pink transition-all"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 block ml-1">When were you planning to rent this?</label>
                      <input
                        type="date"
                        required
                        min={today}
                        value={waitlistDate}
                        onChange={(e) => setWaitlistDate(e.target.value)}
                        className="w-full bg-black/40 border border-white/10 rounded-2xl px-5 py-3.5 text-xs font-mono text-white/80 focus:outline-none focus:border-afterhours-pink transition-all"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isWaitlistSubmitting}
                    className="w-full py-4.5 bg-gradient-to-r from-afterhours-pink to-afterhours-purple text-white font-black uppercase tracking-widest text-xs rounded-2xl transition-all shadow-lg shadow-afterhours-pink/15 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-55 cursor-pointer"
                  >
                    {isWaitlistSubmitting ? (
                      <span className="flex items-center justify-center gap-2">
                        <Loader2 className="animate-spin" size={14} />
                        <span>Reserving shadow slot...</span>
                      </span>
                    ) : (
                      "Join shadow queue ➔"
                    )}
                  </button>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- TASK 1: SMART CART MODAL --- */}
      <AnimatePresence>
        {isSmartCartOpen && smartCartItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Modal Backdrop overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSmartCartOpen(false)}
              className="absolute inset-0 bg-black/85 backdrop-blur-sm"
            />

            {/* Modal Body card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 15 }}
              className="relative w-full max-w-2xl bg-[#0e0e10] border border-white/10 rounded-[2.5rem] p-8 md:p-10 shadow-2xl overflow-y-auto max-h-[90vh] z-10"
            >
              {/* Cyan visual glow */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-afterhours-cyan/5 blur-[80px] pointer-events-none rounded-full" />
              
              <div className="relative flex justify-between items-start mb-6 border-b border-white/5 pb-4">
                <div>
                  <span className="text-[9px] font-black uppercase tracking-[0.25em] text-afterhours-cyan mb-1 inline-block">
                    Interactive Set Configuration
                  </span>
                  <h3 className="text-3xl font-black uppercase italic text-white leading-none">
                    Configure {smartCartItem.id === "hw-ps5" && isComboConverted ? "Gaming Theatre Combo" : smartCartItem.name}
                  </h3>
                </div>
                <button
                  onClick={() => setIsSmartCartOpen(false)}
                  className="p-1.5 bg-white/5 hover:bg-white/10 rounded-full text-white/50 hover:text-white transition-colors cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Core Item Inclusions list */}
              <div className="space-y-3 mb-6 bg-white/[0.02] border border-white/5 rounded-2xl p-5">
                <h4 className="text-[10px] font-black uppercase tracking-wider text-white/50">Base Package Inclusions:</h4>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-white/80">
                  {(
                    (smartCartItem.id === "hw-ps5" && isComboConverted 
                      ? ["Sony PS5 Console", "2x DualSense Wireless Controllers", "Full HD 1080p Cinema Projector", "All HDMI & Power Cabling"]
                      : {
                          "combo-theatre": ["Sony PS5 Console", "2x DualSense Wireless Controllers", "Full HD 1080p Cinema Projector", "All HDMI & Power Cabling"],
                          "combo-racing": ["Sony PS5 Console", "2x DualSense Wireless Controllers", "Logitech G29 Driving Force Wheel & Pedals Studio", "High-Performance Mount Rig"],
                          "combo-party": ["Full HD 1085p Cinema Projector", "JBL PartyBox Professional Bluetooth Speaker", "Tripod Stand & Media Interface Cables"],
                          "hw-vr2": ["Sony PlayStation VR2 Headset", "2x VR2 Sense Controllers", "Stereo Cinematic Earphones", "Secure VR Box"],
                          "hw-ps5": ["Sony PS5 Console", "2x DualSense Wireless Controllers", "Heavy-Duty Power Cord & HDMI Cable"],
                          "hw-wheel": ["Logitech G29 Driving Wheel Engine", "Anti-Slip Responsive Pedals Unit", "Desk Mount Clamps"],
                          "hw-speaker": ["JBL PartyBox Speaker", "AUX Cables", "Speaker Stand"],
                          "hw-projector": ["Full HD Projector", "Projector Screen Stand", "High-Speed HDMI Input Kit"]
                        }[smartCartItem.id]
                    ) || ["High Quality Premium Hardware Gear Rig", "Necessary cabling and standard setup manual"]
                  ).map((inc, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <span className="text-afterhours-cyan text-sm">✦</span>
                      <span>{inc}</span>
                    </li>
                  ))}
                </ul>

                {/* Setup constraints and Wifi warnings */}
                {(smartCartItem.id.toLowerCase().includes("ps5") ||
                  smartCartItem.id.toLowerCase().includes("projector") ||
                  smartCartItem.id.toLowerCase().includes("theatre") ||
                  smartCartItem.id.toLowerCase().includes("racing") ||
                  smartCartItem.name.toLowerCase().includes("ps5") ||
                  smartCartItem.name.toLowerCase().includes("projector")) && (
                  <div className="mt-4 p-3.5 bg-afterhours-cyan/10 border border-afterhours-cyan/25 rounded-xl text-[11px] font-bold text-afterhours-cyan leading-relaxed flex items-center gap-2">
                    <ShieldCheck size={14} className="shrink-0" />
                    <span>⚠️ High-Speed Wi-Fi required for PS Deluxe Game Library and Multiplayer.</span>
                  </div>
                )}
              </div>

              {/* Enhance Your Setup Section */}
              <div className="space-y-4 mb-6 text-left">
                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/60">Enhance Your Experience</h4>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Extra Controllers Addon Option */}
                  {(smartCartItem.id === "hw-ps5" || smartCartItem.id === "combo-theatre") && (
                    <div
                      onClick={() => setAddExtraController(!addExtraController)}
                      className={`p-4 rounded-2xl border transition-all cursor-pointer select-none flex items-center justify-between gap-4 ${
                        addExtraController
                          ? "bg-afterhours-purple/15 border-afterhours-purple/50 shadow-[0_0_15px_rgba(168,85,247,0.15)]"
                          : "bg-white/[0.02] border-white/5 hover:border-white/10"
                      }`}
                    >
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <div className="flex-shrink-0 mt-0.5 flex items-center justify-center p-2 rounded-xl bg-afterhours-purple/10 border border-afterhours-purple/20 text-afterhours-purple">
                          <Gamepad2 size={18} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex-1 flex items-center justify-between gap-2 min-w-0">
                            <h5 className="text-xs font-black uppercase tracking-wider text-white whitespace-normal break-words flex-1">Extra Controller</h5>
                            <input
                              type="checkbox"
                              checked={addExtraController}
                              onChange={() => {}}
                              className="rounded border-white/20 text-afterhours-purple focus:ring-0 focus:ring-offset-0 bg-black/45 cursor-pointer pointer-events-none shrink-0"
                            />
                          </div>
                          <div className="flex items-baseline gap-2 mt-1">
                            <span className="text-xs text-white/40 line-through font-bold">₹599</span>
                            <span className="text-xl sm:text-2xl text-afterhours-purple font-black tracking-tight">
                              ₹{isThresholdReached ? 249 : 299}/day
                            </span>
                          </div>
                          <p className="text-[9px] text-white/50 mt-1 leading-normal">DualSense controller with haptic feedback</p>
                        </div>
                      </div>
                      
                      {/* Media Preview Box */}
                      {renderAddonMediaPreview("Extra Controller")}
                    </div>
                  )}

                  {/* Projector Screen option */}
                  {(smartCartItem.id === "hw-projector" || smartCartItem.id === "combo-theatre" || smartCartItem.id === "combo-party") && (
                    <div
                      onClick={() => setAddProjectorScreen(!addProjectorScreen)}
                      className={`p-4 rounded-2xl border transition-all cursor-pointer select-none flex items-center justify-between gap-4 ${
                        addProjectorScreen
                          ? "bg-afterhours-cyan/15 border-afterhours-cyan/50 shadow-[0_0_15px_rgba(6,182,212,0.15)]"
                          : "bg-white/[0.02] border-white/5 hover:border-white/10"
                      }`}
                    >
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <div className="flex-shrink-0 mt-0.5 flex items-center justify-center p-2 rounded-xl bg-afterhours-cyan/10 border border-afterhours-cyan/20 text-afterhours-cyan">
                          <Monitor size={18} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex-1 flex items-center justify-between gap-2 min-w-0">
                            <h5 className="text-xs font-black uppercase tracking-wider text-white whitespace-normal break-words flex-1">Projector Screen</h5>
                            <input
                              type="checkbox"
                              checked={addProjectorScreen}
                              onChange={() => {}}
                              className="rounded border-white/20 text-afterhours-cyan focus:ring-0 focus:ring-offset-0 bg-black/45 cursor-pointer pointer-events-none shrink-0"
                            />
                          </div>
                          <div className="flex items-baseline gap-2 mt-1">
                            <span className="text-xs text-white/40 line-through font-bold">₹499</span>
                            <span className="text-xl sm:text-2xl text-[#90e0d0] font-black tracking-tight">
                              ₹{isThresholdReached ? 149 : 199}/day
                            </span>
                          </div>
                          <p className="text-[9px] text-white/50 mt-1 leading-normal">High contrast 75-inch portable Projector Screen</p>
                        </div>
                      </div>

                      {/* Media Preview Box */}
                      {renderAddonMediaPreview("Projector Screen")}
                    </div>
                  )}

                  {/* Heavy Duty Tripod Addon Option */}
                  {(smartCartItem.id === "hw-projector" || smartCartItem.id === "combo-theatre" || smartCartItem.id === "combo-party") && (
                    <div
                      onClick={() => setAddHeavyDutyTripod(!addHeavyDutyTripod)}
                      className={`p-4 rounded-2xl border transition-all cursor-pointer select-none flex items-center justify-between gap-4 ${
                        addHeavyDutyTripod
                          ? "bg-afterhours-cyan/15 border-afterhours-cyan/50 shadow-[0_0_15px_rgba(6,182,212,0.15)]"
                          : "bg-white/[0.02] border-white/5 hover:border-white/10"
                      }`}
                    >
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <div className="flex-shrink-0 mt-0.5 flex items-center justify-center p-2 rounded-xl bg-afterhours-cyan/10 border border-afterhours-cyan/20 text-afterhours-cyan">
                          <Maximize size={18} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex-1 flex items-center justify-between gap-2 min-w-0">
                            <h5 className="text-xs font-black uppercase tracking-wider text-white whitespace-normal break-words flex-1">Heavy Duty Tripod</h5>
                            <input
                              type="checkbox"
                              checked={addHeavyDutyTripod}
                              onChange={() => {}}
                              className="rounded border-white/20 text-afterhours-cyan focus:ring-0 focus:ring-offset-0 bg-black/45 cursor-pointer pointer-events-none shrink-0"
                            />
                          </div>
                          <div className="flex items-baseline gap-2 mt-1">
                            <span className="text-xs text-white/40 line-through font-bold">₹499</span>
                            <span className="text-xl sm:text-2xl text-[#90e0d0] font-black tracking-tight">
                              ₹{isThresholdReached ? 149 : 199}/day
                            </span>
                          </div>
                          <p className="text-[9px] text-white/50 mt-1 leading-normal">Ultra sturdy camera/projector telescoping stand</p>
                        </div>
                      </div>

                      {/* Media Preview Box */}
                      {renderAddonMediaPreview("Heavy Duty Tripod")}
                    </div>
                  )}

                  {/* Wireless Mic Addon Option */}
                  {(smartCartItem.id === "hw-speaker" || smartCartItem.id === "combo-party") && (
                    <div
                      onClick={() => setAddWirelessMic(!addWirelessMic)}
                      className={`p-4 rounded-2xl border transition-all cursor-pointer select-none flex items-center justify-between gap-4 ${
                        addWirelessMic
                          ? "bg-afterhours-purple/15 border-afterhours-purple/50 shadow-[0_0_15px_rgba(168,85,247,0.15)]"
                          : "bg-white/[0.02] border-white/5 hover:border-white/10"
                      }`}
                    >
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <div className="flex-shrink-0 mt-0.5 flex items-center justify-center p-2 rounded-xl bg-afterhours-purple/10 border border-afterhours-purple/20 text-afterhours-purple">
                          <Mic size={18} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex-1 flex items-center justify-between gap-2 min-w-0">
                            <h5 className="text-xs font-black uppercase tracking-wider text-white whitespace-normal break-words flex-1">Wireless Mic</h5>
                            <input
                              type="checkbox"
                              checked={addWirelessMic}
                              onChange={() => {}}
                              className="rounded border-white/20 text-afterhours-purple focus:ring-0 focus:ring-offset-0 bg-black/45 cursor-pointer pointer-events-none shrink-0"
                            />
                          </div>
                          <div className="flex items-baseline gap-2 mt-1">
                            <span className="text-xs text-white/40 line-through font-bold">₹499</span>
                            <span className="text-xl sm:text-2xl text-afterhours-purple font-black tracking-tight">
                              ₹{isThresholdReached ? 199 : 299}/day
                            </span>
                          </div>
                          <p className="text-[9px] text-white/50 mt-1 leading-normal">Professional vocal wireless microphone unit</p>
                        </div>
                      </div>

                      {/* Media Preview Box */}
                      {renderAddonMediaPreview("Wireless Mic")}
                    </div>
                  )}

                  {/* Meta Shots Bat Addon Option */}
                  {(smartCartItem.id === "hw-ps5" || smartCartItem.id === "combo-theatre") && (
                    <div
                      onClick={() => setAddMetaShotsBat(!addMetaShotsBat)}
                      className={`p-4 rounded-2xl border transition-all cursor-pointer select-none flex items-center justify-between gap-4 ${
                        addMetaShotsBat
                          ? "bg-afterhours-purple/15 border-afterhours-purple/50 shadow-[0_0_15px_rgba(168,85,247,0.15)]"
                          : "bg-white/[0.02] border-white/5 hover:border-white/10"
                      }`}
                    >
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <div className="flex-shrink-0 mt-0.5 flex items-center justify-center p-2 rounded-xl bg-afterhours-purple/10 border border-afterhours-purple/20 text-afterhours-purple">
                          <Zap size={18} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex-1 flex items-center justify-between gap-2 min-w-0">
                            <h5 className="text-xs font-black uppercase tracking-wider text-white whitespace-normal break-words flex-1">Meta Shots Bat</h5>
                            <input
                              type="checkbox"
                              checked={addMetaShotsBat}
                              onChange={() => {}}
                              className="rounded border-white/20 text-afterhours-purple focus:ring-0 focus:ring-offset-0 bg-black/45 cursor-pointer pointer-events-none shrink-0"
                            />
                          </div>
                          <div className="flex items-baseline gap-2 mt-1">
                            <span className="text-xs text-white/40 line-through font-bold">₹499</span>
                            <span className="text-xl sm:text-2xl text-afterhours-purple font-black tracking-tight">
                              ₹{isThresholdReached ? 199 : 299}/day
                            </span>
                          </div>
                          <p className="text-[9px] text-white/50 mt-1 leading-normal">Premium VR physical cricket bat accessory</p>
                        </div>
                      </div>

                      {/* Media Preview Box */}
                      {renderAddonMediaPreview("Meta Shots Bat")}
                    </div>
                  )}

                  {/* Smart Combo Converter for standalone Speaker */}
                  {smartCartItem.id === "hw-speaker" && (
                    <div
                      onClick={() => setIsComboConverted(!isComboConverted)}
                      className={`p-4 rounded-2xl border transition-all cursor-pointer select-none flex items-start gap-4 col-span-1 sm:col-span-2 ${
                        isComboConverted
                          ? "bg-gradient-to-r from-afterhours-cyan/10 via-afterhours-purple/10 to-afterhours-pink/10 border-afterhours-cyan shadow-[0_0_15px_rgba(6,182,212,0.15)]"
                          : "bg-white/[0.02] border-white/5 hover:border-white/10"
                      }`}
                    >
                      <div className="flex-shrink-0 mt-0.5 flex items-center justify-center p-2 rounded-xl bg-afterhours-cyan/10 border border-afterhours-cyan/20 text-afterhours-cyan">
                        <Zap size={18} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between flex-wrap gap-2">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <h5 className="text-xs font-black uppercase tracking-wider text-white">Smart Upsell: Add cinema Projector Combo</h5>
                            <span className="text-[8px] font-black uppercase bg-linear-to-r from-afterhours-cyan to-afterhours-purple text-black px-2 py-0.5 rounded-full inline-block shrink-0">
                              Save ₹399/day
                            </span>
                          </div>
                          <input
                            type="checkbox"
                            checked={isComboConverted}
                            onChange={() => {}}
                            className="rounded border-cyan-400 text-afterhours-cyan bg-black focus:ring-0 cursor-pointer pointer-events-none shrink-0"
                          />
                        </div>
                        <p className="text-[10px] text-white/60 leading-normal mt-1">
                          Converts standalone JBL Speaker and Projector setup into our cohesive, premium <span className="text-afterhours-cyan font-bold">Full Party Setup Combo</span> for just <span className="text-afterhours-cyan font-black text-xs">₹1799/day</span> overall.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Smart Combo Converter for standalone PS5 */}
                  {smartCartItem.id === "hw-ps5" && (
                    <div
                      onClick={() => setIsComboConverted(!isComboConverted)}
                      className={`p-4 rounded-2xl border transition-all cursor-pointer select-none flex items-start gap-4 col-span-1 sm:col-span-2 ${
                        isComboConverted
                          ? "bg-gradient-to-r from-afterhours-cyan/10 via-afterhours-purple/10 to-afterhours-pink/10 border-afterhours-cyan shadow-[0_0_15px_rgba(6,182,212,0.15)]"
                          : "bg-white/[0.02] border-white/5 hover:border-white/10"
                      }`}
                    >
                      <div className="flex-shrink-0 mt-0.5 flex items-center justify-center p-2 rounded-xl bg-afterhours-cyan/10 border border-afterhours-cyan/20 text-afterhours-cyan">
                        <Zap size={18} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between flex-wrap gap-2">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <h5 className="text-xs font-black uppercase tracking-wider text-white">Smart Upsell: Add cinema Projector Combo</h5>
                            <span className="text-[8px] font-black uppercase bg-linear-to-r from-afterhours-cyan to-afterhours-purple text-black px-2 py-0.5 rounded-full inline-block shrink-0">
                              Save ₹299/day
                            </span>
                          </div>
                          <input
                            type="checkbox"
                            checked={isComboConverted}
                            onChange={() => {}}
                            className="rounded border-cyan-400 text-afterhours-cyan bg-black focus:ring-0 cursor-pointer pointer-events-none shrink-0"
                          />
                        </div>
                        <p className="text-[10px] text-white/60 leading-normal mt-1">
                          Converts standalone PS5 and Projector setup into our cohesive, premium <span className="text-afterhours-cyan font-bold">Gaming Theatre Combo</span> for just <span className="text-afterhours-cyan font-black text-xs">₹1999/day</span> overall.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Smart Combo Converter for standalone Projector */}
                  {smartCartItem.id === "hw-projector" && (
                    <>
                      <div
                        onClick={() => {
                          setIsComboConverted(!isComboConverted);
                          setIsComboConverted2(false);
                        }}
                        className={`p-4 rounded-2xl border transition-all cursor-pointer select-none flex items-start gap-4 col-span-1 sm:col-span-2 ${
                          isComboConverted
                            ? "bg-gradient-to-r from-afterhours-cyan/10 via-afterhours-purple/10 to-afterhours-pink/10 border-afterhours-cyan shadow-[0_0_15px_rgba(6,182,212,0.15)]"
                            : "bg-white/[0.02] border-white/5 hover:border-white/10"
                        }`}
                      >
                        <div className="flex-shrink-0 mt-0.5 flex items-center justify-center p-2 rounded-xl bg-afterhours-cyan/10 border border-afterhours-cyan/20 text-afterhours-cyan">
                          <Zap size={18} />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between flex-wrap gap-2">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <h5 className="text-xs font-black uppercase tracking-wider text-white">Smart Upsell: Add PS5 Combo</h5>
                              <span className="text-[8px] font-black uppercase bg-linear-to-r from-afterhours-cyan to-afterhours-purple text-black px-2 py-0.5 rounded-full inline-block shrink-0">
                                Save ₹299/day
                              </span>
                            </div>
                            <input
                              type="checkbox"
                              checked={isComboConverted}
                              onChange={() => {}}
                              className="rounded border-cyan-400 text-afterhours-cyan bg-black focus:ring-0 cursor-pointer pointer-events-none shrink-0"
                            />
                          </div>
                          <p className="text-[10px] text-white/60 leading-normal mt-1">
                            Converts standalone Projector setup and PS5 into our immersive, premium <span className="text-afterhours-cyan font-bold">Gaming Theatre Combo</span> for just <span className="text-afterhours-cyan font-black text-xs">₹1999/day</span> overall.
                          </p>
                        </div>
                      </div>

                      <div
                        onClick={() => {
                          setIsComboConverted2(!isComboConverted2);
                          setIsComboConverted(false);
                        }}
                        className={`p-4 rounded-2xl border transition-all cursor-pointer select-none flex items-start gap-4 col-span-1 sm:col-span-2 ${
                          isComboConverted2
                            ? "bg-gradient-to-r from-afterhours-cyan/10 via-afterhours-purple/10 to-afterhours-pink/10 border-afterhours-cyan shadow-[0_0_15px_rgba(6,182,212,0.15)]"
                            : "bg-white/[0.02] border-white/5 hover:border-white/10"
                        }`}
                      >
                        <div className="flex-shrink-0 mt-0.5 flex items-center justify-center p-2 rounded-xl bg-afterhours-cyan/10 border border-afterhours-cyan/20 text-afterhours-cyan">
                          <Zap size={18} />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between flex-wrap gap-2">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <h5 className="text-xs font-black uppercase tracking-wider text-white">Smart Upsell: Add JBL Speaker Combo</h5>
                              <span className="text-[8px] font-black uppercase bg-linear-to-r from-afterhours-cyan to-afterhours-purple text-black px-2 py-0.5 rounded-full inline-block shrink-0">
                                Save ₹399/day
                              </span>
                            </div>
                            <input
                              type="checkbox"
                              checked={isComboConverted2}
                              onChange={() => {}}
                              className="rounded border-cyan-400 text-afterhours-cyan bg-black focus:ring-0 cursor-pointer pointer-events-none shrink-0"
                            />
                          </div>
                          <p className="text-[10px] text-white/60 leading-normal mt-1">
                            Converts standalone Projector and Speaker setup into <span className="text-afterhours-cyan font-bold">Full Party Setup Combo</span> for just <span className="text-afterhours-cyan font-black text-xs">₹1799/day</span> overall.
                          </p>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Dynamic Game Pricing Block */}
              {(smartCartItem.id === "hw-ps5" || smartCartItem.id === "combo-theatre") && (
                <div className="space-y-4 mb-8 text-left">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white/[0.01] border border-white/5 rounded-2xl px-5 py-4">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-xl bg-afterhours-purple/10 border border-afterhours-purple/20 text-afterhours-purple">
                        <Disc size={18} />
                      </div>
                      <h4 className="text-xs font-black uppercase tracking-[0.15em] text-white">Bundle Unlock: Choose Premium Games</h4>
                    </div>
                    <div className="flex items-center gap-3 font-sans">
                      <span className="text-[10px] text-white/40 uppercase font-bold tracking-wider">Promo price:</span>
                      <span className="text-xs text-white/40 line-through font-bold">₹499</span>
                      <span className="text-base sm:text-lg text-afterhours-cyan font-black">₹{isThresholdReached ? 149 : 199}/day</span>
                    </div>
                  </div>

                {/* fetched games rendering */}
                {premiumGames.length === 0 ? (
                  <p className="text-[11px] text-white/45 italic pl-1 font-mono">No premium catalog games registered in system.</p>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {premiumGames.map((game) => {
                      const isSelected = selectedGameIds.includes(game.id);
                      return (
                        <div
                          key={game.id}
                          onClick={() => {
                            if (isSelected) {
                              setSelectedGameIds(prev => prev.filter(id => id !== game.id));
                            } else {
                              setSelectedGameIds(prev => [...prev, game.id]);
                            }
                          }}
                          className={`group p-2.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between text-left select-none ${
                            isSelected
                              ? "bg-afterhours-purple/10 border-afterhours-purple/50"
                              : "bg-white/[0.01] border-white/5 hover:border-white/10"
                          }`}
                        >
                          <div className="aspect-[3/4] w-full bg-black/60 rounded-lg overflow-hidden mb-2 relative">
                            <img src={game.coverUrl} alt={game.title} className="w-full h-full object-cover" />
                            {isSelected && (
                              <div className="absolute inset-0 bg-afterhours-purple/20 flex items-center justify-center backdrop-blur-[1px]">
                                <span className="bg-afterhours-purple border border-white/20 text-white text-[9px] font-black uppercase px-2 py-0.5 rounded-full scale-100 transition-transform">✓ Selected</span>
                              </div>
                            )}
                          </div>
                          
                          <h5 className="text-[10px] font-black text-white/90 uppercase tracking-widest line-clamp-1 truncate">{game.title}</h5>
                          <div className="flex items-center gap-1.5 mt-1">
                            <span className="text-[8px] text-white/30 line-through">~~₹499~~</span>
                            <span className="text-[9px] text-afterhours-purple font-bold">₹{isThresholdReached ? 149 : 199}/day</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

                {/* Progress bar and Target calculation logic */}
                <div className="space-y-3 bg-white/[0.02] border border-white/5 rounded-2xl p-5 mt-4">
                  <div className="flex justify-between text-xs font-black uppercase italic">
                    <span>Prospective Cart Total:</span>
                    <span className="text-white">₹{prospectiveTotal}</span>
                  </div>

                  {/* Simple Progress calculation */}
                  {(() => {
                    const progressVal = Math.min(100, (prospectiveTotal / 1600) * 100);
                    const isUnlocked = prospectiveTotal >= 1600;
                    return (
                      <div className="space-y-2.5">
                        <div className="w-full h-2.5 bg-black rounded-full overflow-hidden border border-white/5">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              isUnlocked ? "bg-afterhours-green shadow-[0_0_10px_rgba(16,185,129,0.3)]" : "bg-afterhours-purple"
                            }`}
                            style={{ width: `${progressVal}%` }}
                          />
                        </div>
                        <p className={`text-[10px] font-bold uppercase tracking-wider ${isUnlocked ? "text-afterhours-green" : "text-white/50"}`}>
                          {isUnlocked ? (
                            <span>🎉 UNLOCKED! Add-ons & Premium Games are now adjusted to maximum discount (Controller ₹249, Screen/Games ₹149)!</span>
                          ) : (
                            <span>Add ₹{1600 - prospectiveTotal} more to unlock Addon & Game discounts (Controller ₹249, Screen/Games ₹149, base <s>₹499/₹599</s>)!</span>
                          )}
                        </p>
                      </div>
                    );
                  })()}
                </div>

              {/* Confirm submit buttons */}
              <div className="pt-4 border-t border-white/5 flex flex-col sm:flex-row items-center gap-4 justify-between">
                <span className="text-[9px] font-mono uppercase text-white/40">
                  Adds selections as combined setup additions
                </span>
                <button
                  type="button"
                  onClick={handleSmartCartSubmit}
                  className="w-full sm:w-auto px-8 py-4 bg-linear-to-r from-afterhours-cyan to-afterhours-purple text-black font-black text-xs uppercase tracking-[0.2em] italic rounded-2xl transition-transform hover:scale-[1.02] active:scale-[0.98] cursor-pointer shadow-lg shadow-afterhours-cyan/10"
                >
                  Configure & Add Setup ➔
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function AddonHoverPlayer({ photoUrl, videoUrl, addonName, mediaUrls = [] }: { photoUrl: string; videoUrl: string; addonName: string; mediaUrls?: string[] }) {
  const [isHovered, setIsHovered] = useState(false);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (isHovered || !mediaUrls || mediaUrls.length <= 1) return;
    const interval = setInterval(() => {
      setIndex(prev => (prev + 1) % mediaUrls.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [mediaUrls, isHovered]);

  const activePhoto = mediaUrls.length > 0 ? mediaUrls[index] : photoUrl;

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onTouchStart={() => setIsHovered(true)}
      onTouchEnd={() => setIsHovered(false)}
      className="relative w-20 h-20 rounded-2xl overflow-hidden bg-black/50 border border-white/10 shrink-0 transition-transform duration-300 hover:scale-[1.03]"
    >
      {videoUrl && isHovered ? (
        <video
          src={videoUrl}
          autoPlay
          muted
          loop
          playsInline
          className="w-full h-full object-cover"
        />
      ) : (
        activePhoto ? (
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.img
              key={activePhoto}
              src={activePhoto}
              alt={addonName}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
              className="absolute inset-0 w-full h-full object-cover rounded-2xl"
              referrerPolicy="no-referrer"
            />
          </AnimatePresence>
        ) : (
          <div className="w-full h-full flex items-center justify-center text-white/20 bg-white/[0.02]">
            <Image size={16} />
          </div>
        )
      )}

      {videoUrl && !isHovered && (
        <div className="absolute inset-0 bg-black/30 flex items-center justify-center pointer-events-none z-10">
          <div className="p-1 px-1.5 bg-afterhours-cyan/85 backdrop-blur-sm rounded-full text-black shadow-lg flex items-center gap-1 scale-90">
            <Play size={8} className="fill-current" />
            <span className="text-[8px] font-black uppercase tracking-wider font-mono font-bold">DEMO</span>
          </div>
        </div>
      )}
    </div>
  );
}

interface MediaCarouselProps {
  mediaUrls: string[];
  autoPlayInterval?: number;
  className?: string;
  itemTitle?: string;
}

export function MediaCarousel({ mediaUrls, autoPlayInterval = 3000, className = "", itemTitle = "" }: MediaCarouselProps) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (!mediaUrls || mediaUrls.length <= 1) return;
    const interval = setInterval(() => {
      setIndex(prev => (prev + 1) % mediaUrls.length);
    }, autoPlayInterval);
    return () => clearInterval(interval);
  }, [mediaUrls, autoPlayInterval]);

  if (!mediaUrls || mediaUrls.length === 0) {
    return null;
  }

  if (mediaUrls.length === 1) {
    return (
      <img
        src={mediaUrls[0]}
        alt={itemTitle}
        className={`${className} object-cover`}
        referrerPolicy="no-referrer"
      />
    );
  }

  return (
    <div className={`relative overflow-hidden ${className}`}>
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.img
          key={index}
          src={mediaUrls[index]}
          alt={`${itemTitle} slide ${index + 1}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6, ease: "easeInOut" }}
          className="absolute inset-0 w-full h-full object-cover"
          referrerPolicy="no-referrer"
        />
      </AnimatePresence>
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-10">
        {mediaUrls.map((_, i) => (
          <button
            key={i}
            onClick={(e) => {
              e.stopPropagation();
              setIndex(i);
            }}
            className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
              i === index ? "bg-afterhours-cyan w-3.5 scale-110" : "bg-white/40 hover:bg-white/60"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
