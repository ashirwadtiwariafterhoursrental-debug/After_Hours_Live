import { useState, useEffect, useRef, FormEvent, DragEvent, ChangeEvent, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { collection, addDoc, serverTimestamp, query, orderBy, onSnapshot, deleteDoc, doc, updateDoc, setDoc, writeBatch, getDocs, where } from "firebase/firestore";
import * as XLSX from "xlsx";
import { auth, db, storage, handleFirestoreError, OperationType } from "../firebase";
import { motion, AnimatePresence } from "motion/react";
import { LogOut, Plus, Image as ImageIcon, CheckCircle, FileText, Loader2, ArrowRight, X, FolderKanban, Sliders, Trash2, UploadCloud, Gamepad2, ShoppingBag, BellRing, Heart, Layers, AlertCircle, Eye, Play, Calendar, Monitor, Maximize, Mic, Zap } from "lucide-react";

export function AdminDashboard() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const assetFileInputRef = useRef<HTMLInputElement>(null);
  const slideFileInputRef = useRef<HTMLInputElement>(null);
  const addonPhotoInputRef = useRef<HTMLInputElement>(null);
  const addonVideoInputRef = useRef<HTMLInputElement>(null);

  const [currentUser, setCurrentUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Form states - Homepage Slider Manager
  const [slidePhoto, setSlidePhoto] = useState<File | null>(null);
  const [slidePhotoPreview, setSlidePhotoPreview] = useState<string | null>(null);
  const [isSlideSubmitting, setIsSlideSubmitting] = useState(false);
  const [slideDragActive, setSlideDragActive] = useState(false);
  const [slideFormError, setSlideFormError] = useState("");
  const [slideUploadSuccess, setSlideUploadSuccess] = useState(false);
  const [activeSlides, setActiveSlides] = useState<any[]>([]);
  const [deletingSlideId, setDeletingSlideId] = useState<string | null>(null);

  // Form states - Blog post
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [coverPhoto, setCoverPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  // Submit flow states - Blog
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDragActive, setIsDragActive] = useState(false);
  const [formError, setFormError] = useState("");
  const [uploadSuccess, setUploadSuccess] = useState(false);

  // Form states - Website Asset Manager
  const [assetCategory, setAssetCategory] = useState<"Combos" | "Individual Gears" | "Add-ons">("Combos");
  const [selectedAssetId, setSelectedAssetId] = useState<string>("combo-theatre");
  const [assetPhoto, setAssetPhoto] = useState<File | null>(null);
  const [assetPhotoPreview, setAssetPhotoPreview] = useState<string | null>(null);
  const [assetPhotos, setAssetPhotos] = useState<File[]>([]);
  const [assetPhotoPreviews, setAssetPhotoPreviews] = useState<string[]>([]);

  // Form states - Addon preview assets (preview photo and video)
  const [addonPhoto, setAddonPhoto] = useState<File | null>(null);
  const [addonPhotoPreview, setAddonPhotoPreview] = useState<string | null>(null);
  const [addonVideo, setAddonVideo] = useState<File | null>(null);
  const [addonVideoPreview, setAddonVideoPreview] = useState<string | null>(null);

  useEffect(() => {
    if (assetCategory === "Combos") {
      setSelectedAssetId("combo-theatre");
    } else if (assetCategory === "Individual Gears") {
      setSelectedAssetId("hw-ps5");
    } else if (assetCategory === "Add-ons") {
      setSelectedAssetId("Extra Controller");
    }
  }, [assetCategory]);

  // Submit flow states - Assets
  const [isAssetSubmitting, setIsAssetSubmitting] = useState(false);
  const [assetDragActive, setAssetDragActive] = useState(false);
  const [assetFormError, setAssetFormError] = useState("");
  const [assetUploadSuccess, setAssetUploadSuccess] = useState(false);

  // Form states - Premium Games Manager
  const gameFileInputRef = useRef<HTMLInputElement>(null);
  const [gameTitle, setGameTitle] = useState("");
  const [gameLink, setGameLink] = useState("");
  const [gameCover, setGameCover] = useState<File | null>(null);
  const [gameCoverPreview, setGameCoverPreview] = useState<string | null>(null);
  const [isGameSubmitting, setIsGameSubmitting] = useState(false);
  const [gameDragActive, setGameDragActive] = useState(false);
  const [gameFormError, setGameFormError] = useState("");
  const [gameUploadSuccess, setGameUploadSuccess] = useState(false);
  const [premiumGames, setPremiumGames] = useState<any[]>([]);
  const [deletingGameId, setDeletingGameId] = useState<string | null>(null);

  // Form states - Gear Media Manager
  const gearFileInputRef = useRef<HTMLInputElement>(null);
  const [selectedGearId, setSelectedGearId] = useState("hw-ps5");
  const [gearMediaFile, setGearMediaFile] = useState<File | null>(null);
  const [gearMediaPreview, setGearMediaPreview] = useState<string | null>(null);
  const [gearMediaType, setGearMediaType] = useState<"image" | "video">("image");
  const [isGearSubmitting, setIsGearSubmitting] = useState(false);
  const [gearDragActive, setGearDragActive] = useState(false);
  const [gearFormError, setGearFormError] = useState("");
  const [gearUploadSuccess, setGearUploadSuccess] = useState(false);
  const [gearCatalogList, setGearCatalogList] = useState<any[]>([]);
  const [deletingGearMediaId, setDeletingGearMediaId] = useState<string | null>(null);

  const ADMIN_GEARS = [
    { id: "hw-ps5", name: "Play Station 5 ( PS5 console)" },
    { id: "hw-speaker", name: "JBL Party Speaker" },
    { id: "hw-projector", name: "Full HD Projector" },
    { id: "hw-vr2", name: "Sony PlayStation VR2" },
    { id: "hw-wheel", name: "Logitech G29 Racing Wheel" }
  ];

  // Route protection, layout tabs, & operational states
  const [activeTab, setActiveTab] = useState<"orders" | "waitlist" | "content" | "calendar" | "vault">("orders");
  const [orders, setOrders] = useState<any[]>([]);
  const [waitlistItems, setWaitlistItems] = useState<any[]>([]);
  const [kycModalUrl, setKycModalUrl] = useState<string | null>(null);
  const [updatingOrderStatusId, setUpdatingOrderStatusId] = useState<string | null>(null);

  // --- Extension Engine States (Booking Extension Modal) ---
  const [extendingOrder, setExtendingOrder] = useState<any | null>(null);
  const [extensionEndDate, setExtensionEndDate] = useState<string>("");
  const [extensionRevenue, setExtensionRevenue] = useState<string>("0");
  const [isSubmitExtending, setIsSubmitExtending] = useState<boolean>(false);

  // --- Operational Excel Upgrade / Inline Editor ---
  const [editingCell, setEditingCell] = useState<{ orderId: string; field: string } | null>(null);
  const [tempValue, setTempValue] = useState<string>("");

  // --- Visual Availability Calendar States ---
  const [currentMonth, setCurrentMonth] = useState<number>(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState<number>(new Date().getFullYear());
  const [selectedAssetUnit, setSelectedAssetUnit] = useState<string>("ALL_PS5s");
  const [calendarOrders, setCalendarOrders] = useState<any[]>([]);
  const [calendarMode, setCalendarMode] = useState<"gears" | "addons">("gears");
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // --- Inventory Vault States (Dynamic Inventory Architecture) ---
  const [categoriesList, setCategoriesList] = useState<any[]>([]);
  const [unitsMap, setUnitsMap] = useState<Record<string, any[]>>({}); // categoryId -> list of units
  
  // Real-time subscription to dynamic inventory_vault categories
  useEffect(() => {
    const q = query(collection(db, "inventory_vault"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: any[] = [];
      snapshot.forEach(docSnap => {
        list.push({ id: docSnap.id, ...docSnap.data() });
      });
      setCategoriesList(list);
    }, (err) => {
      console.error("Error subscribing to inventory_vault:", err);
    });
    return () => unsubscribe();
  }, []);

  // Real-time subscription to units of each category
  useEffect(() => {
    if (categoriesList.length === 0) return;
    
    const unsubscribes = categoriesList.map(cat => {
      return onSnapshot(collection(db, "inventory_vault", cat.id, "units"), (snapshot) => {
        const units: any[] = [];
        snapshot.forEach(docSnap => {
          units.push({ id: docSnap.id, ...docSnap.data() });
        });
        setUnitsMap(prev => ({
          ...prev,
          [cat.id]: units
        }));
      }, (err) => {
        console.error(`Error subscribing to units of category ${cat.name}:`, err);
      });
    });

    return () => {
      unsubscribes.forEach(unsub => unsub());
    };
  }, [categoriesList]);

  // Unified Gear Units assembled dynamically for UI
  const allGearUnitsList = categoriesList
    .filter(cat => cat.type === "gear")
    .flatMap(cat => {
      const units = unitsMap[cat.id] || [];
      return units.map(u => ({
        id: u.id,
        name: u.name,
        categoryName: cat.name,
        categoryId: cat.id
      }));
    });

  // Selected state for Visual Calendar filter dropdown
  const [selectedCalendarAddonId, setSelectedCalendarAddonId] = useState("");

  // Auto-set first unit when allGearUnitsList becomes available or changes, respecting master categories starting with ALL_
  useEffect(() => {
    if (allGearUnitsList.length > 0) {
      if (!selectedAssetUnit) {
        setSelectedAssetUnit("ALL_PS5s");
      } else if (!selectedAssetUnit.startsWith("ALL_") && !allGearUnitsList.some(gu => gu.name === selectedAssetUnit)) {
        setSelectedAssetUnit("ALL_PS5s");
      }
    }
  }, [allGearUnitsList, selectedAssetUnit]);

  // Synchronize calendar-specific orders in real-time, matching selectedAssetUnit via array-contains
  useEffect(() => {
    if (!selectedAssetUnit) {
      setCalendarOrders([]);
      return;
    }

    const ordersRef = collection(db, "orders");
    const q = selectedAssetUnit.startsWith("ALL_")
      ? query(ordersRef)
      : query(ordersRef, where("assignedUnits", "array-contains", selectedAssetUnit));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: any[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        const oStatus = data["Order Status"] || data.Status || data.status || "";
        
        // Filter out cancelled or rejected orders
        if (oStatus !== "Cancelled" && oStatus !== "Rejected") {
          // Normalize dates to local midnight at browser timezone for maximum alignment
          const startStr = data["Start date"] || data.startDate || "";
          const endStr = data["End date"] || data.endDate || "";
          
          let normalizedStart = "";
          let normalizedEnd = "";

          const parseToLocalMidnightString = (dateStr: string): string => {
            if (!dateStr) return "";
            const trimmed = dateStr.trim();
            const matchYMD = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})/);
            if (matchYMD) {
              const d = new Date(parseInt(matchYMD[1], 10), parseInt(matchYMD[2], 10) - 1, parseInt(matchYMD[3], 10), 0, 0, 0, 0);
              return !isNaN(d.getTime()) ? d.toISOString().split('T')[0] : "";
            }
            const matchDMY = trimmed.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})/);
            if (matchDMY) {
              const d = new Date(parseInt(matchDMY[3], 10), parseInt(matchDMY[2], 10) - 1, parseInt(matchDMY[1], 10), 0, 0, 0, 0);
              return !isNaN(d.getTime()) ? d.toISOString().split('T')[0] : "";
            }
            const parsed = new Date(trimmed);
            if (!isNaN(parsed.getTime())) {
              const d = new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate(), 0, 0, 0, 0);
              return d.toISOString().split('T')[0];
            }
            return "";
          };

          if (startStr) normalizedStart = parseToLocalMidnightString(startStr);
          if (endStr) normalizedEnd = parseToLocalMidnightString(endStr);

          list.push({
            id: docSnap.id,
            ...data,
            // Align in both formats so any parser resolves at local midnight
            "Start date": normalizedStart || startStr,
            "End date": normalizedEnd || endStr,
            startDate: normalizedStart || startStr,
            endDate: normalizedEnd || endStr,
          });
        }
      });
      setCalendarOrders(list);
    }, (err) => {
      console.error("Error subscribing to calendar orders collection:", err);
    });

    return () => unsubscribe();
  }, [selectedAssetUnit]);

  // Synchronize category first option for Addons mode dropdown selection
  useEffect(() => {
    const addonCategories = categoriesList.filter(c => c.type === "addon");
    if (addonCategories.length > 0 && !selectedCalendarAddonId) {
      setSelectedCalendarAddonId(addonCategories[0].id);
    }
  }, [categoriesList, selectedCalendarAddonId]);

  // Form & Modification states for Master Category additions
  const [newCatName, setNewCatName] = useState("");
  const [newCatType, setNewCatType] = useState<"gear" | "addon">("gear");
  const [newUnitNames, setNewUnitNames] = useState<Record<string, string>>({}); // categoryId -> input field draft name

  const handleBootstrapVault = async () => {
    if (categoriesList.length > 0) {
      if (!confirm("An existing inventory structure is already online! Are you sure you want to add fallback defaults on top?")) {
        return;
      }
    }
    try {
      const bootstrapCategories = [
        { name: "PS5 Console", type: "gear", units: ["PS5 - Unit A", "PS5 - Unit B"] },
        { name: "Full HD Projector", type: "gear", units: ["Projector - Unit 1", "Projector - Unit 2"] },
        { name: "JBL Party Speaker", type: "gear", units: ["Speaker - Unit 1", "Speaker - Unit 2"] },
        { name: "Sony PlayStation VR2", type: "gear", units: ["VR2 - Unit A"] },
        { name: "Logitech G29 Racing Wheel", type: "gear", units: ["Racing Wheel - Unit 1"] },
        { name: "Extra Controller", type: "addon", units: ["Controller Unit 1", "Controller Unit 2", "Controller Unit 3", "Controller Unit 4", "Controller Unit 5"] },
        { name: "Projector Screen", type: "addon", units: ["Screen Unit 1", "Screen Unit 2", "Screen Unit 3", "Screen Unit 4"] },
        { name: "Heavy Duty Tripod", type: "addon", units: ["Tripod Unit 1", "Tripod Unit 2", "Tripod Unit 3", "Tripod Unit 4"] },
        { name: "Wireless Mic", type: "addon", units: ["Mic Unit 1", "Mic Unit 2", "Mic Unit 3", "Mic Unit 4", "Mic Unit 5", "Mic Unit 6"] },
        { name: "Meta Shots Bat", type: "addon", units: ["Bat Unit 1", "Bat Unit 2"] },
        { name: "Premium Games", type: "addon", units: ["Game Unit 1", "Game Unit 2", "Game Unit 3", "Game Unit 4", "Game Unit 5", "Game Unit 6", "Game Unit 7", "Game Unit 8", "Game Unit 9", "Game Unit 10"] }
      ];

      for (const item of bootstrapCategories) {
        const catRef = await addDoc(collection(db, "inventory_vault"), {
          name: item.name,
          type: item.type,
          createdAt: serverTimestamp()
        });
        for (const uName of item.units) {
          await addDoc(collection(db, "inventory_vault", catRef.id, "units"), {
            name: uName,
            createdAt: serverTimestamp()
          });
        }
      }
      alert("Inventory Vault bootstrapped successfully with real production units!");
    } catch (err) {
      console.error("Error bootstrapping vault:", err);
      alert("Failed to bootstrap vault: " + err);
    }
  };

  const handleCreateCategory = async (e: FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) {
      alert("Please enter a category name first.");
      return;
    }
    try {
      await addDoc(collection(db, "inventory_vault"), {
        name: newCatName.trim(),
        type: newCatType,
        createdAt: serverTimestamp()
      });
      setNewCatName("");
    } catch (err) {
      console.error("Error creating category:", err);
      alert("Failed to create category: " + err);
    }
  };

  const handleAddUnitToCategory = async (catId: string) => {
    const rawName = newUnitNames[catId] || "";
    if (!rawName.trim()) {
      alert("Please enter a Unit name first.");
      return;
    }
    try {
      await addDoc(collection(db, "inventory_vault", catId, "units"), {
        name: rawName.trim(),
        createdAt: serverTimestamp()
      });
      setNewUnitNames(prev => ({ ...prev, [catId]: "" }));
    } catch (err) {
      console.error("Error adding sub-unit:", err);
      alert("Failed to register unit: " + err);
    }
  };

  const handleDeleteCategory = async (catId: string, name: string) => {
    if (confirm(`Are you sure you want to delete the category "${name}" and all of its individual units from the master database?`)) {
      try {
        const unitsSnapshot = await getDocs(collection(db, "inventory_vault", catId, "units"));
        const batch = writeBatch(db);
        
        // Delete each subdoc in units subcollection
        unitsSnapshot.forEach(unitDoc => {
          batch.delete(doc(db, "inventory_vault", catId, "units", unitDoc.id));
        });
        
        // Delete parent category
        batch.delete(doc(db, "inventory_vault", catId));
        await batch.commit();
      } catch (err) {
        console.error("Error cascade deleting category:", err);
        alert("Failed to delete category: " + err);
      }
    }
  };

  const handleDeleteUnit = async (catId: string, unitId: string) => {
    if (confirm("Are you sure you want to delete this specific stock unit?")) {
      try {
        await deleteDoc(doc(db, "inventory_vault", catId, "units", unitId));
      } catch (err) {
        console.error("Error deleting sub unit:", err);
        alert("Failed to delete unit: " + err);
      }
    }
  };

  const getSelectedAddonStatsForDay = (day: Date, catId: string) => {
    if (!day || !catId) return { booked: 0, owned: 0, available: 0, unitStats: [] };
    const targetTime = new Date(day.getFullYear(), day.getMonth(), day.getDate()).getTime();

    const addonUnits = unitsMap[catId] || [];
    const owned = addonUnits.length;

    const activeOrders = orders.filter(order => {
      const status = order.Status || order.status || "Pending";
      if (!isInventoryOccupyingStatus(status)) return false;

      const startStr = order["Start date"] || order.startDate;
      const endStr = getEffectiveEndDate(order);
      if (!startStr || !endStr) return false;

      const orderStart = parseLocalDate(startStr);
      if (isNaN(orderStart.getTime())) return false;
      const startOnly = orderStart.getTime();

      const orderEnd = parseLocalDate(endStr);
      if (isNaN(orderEnd.getTime())) return false;
      const endOnly = orderEnd.getTime();

      return targetTime >= startOnly && targetTime <= endOnly;
    });

    let bookedCount = 0;
    const unitStats = addonUnits.map(unit => {
      const isUnitBooked = activeOrders.some(order => {
        const assigned = order.assignedUnits || [];
        const assignedUnit = order.assignedUnit || "";
        return (assignedUnit === unit.name) || (
          Array.isArray(assigned) ? assigned.includes(unit.name) : assigned === unit.name
        );
      });
      if (isUnitBooked) {
        bookedCount++;
      }
      return {
        unitId: unit.id,
        unitName: unit.name,
        booked: isUnitBooked
      };
    });

    return {
      booked: bookedCount,
      owned: owned,
      available: Math.max(0, owned - bookedCount),
      unitStats
    };
  };

  useEffect(() => {
    const isAdminAuthenticated = localStorage.getItem("isAdminAuthenticated") === "true";
    if (!isAdminAuthenticated) {
      navigate("/admin");
    } else {
      const storedEmail = localStorage.getItem("adminEmail") || "afterhoursrental@gmail.com";
      setCurrentUser({
        email: storedEmail,
        displayName: storedEmail === "afterhoursrental@gmail.com" ? "After Hours Rental Admin" : "Arjun Tiwari"
      });
    }
    setAuthLoading(false);
  }, [navigate]);

  // Fetch orders in real-time
  useEffect(() => {
    const ordersRef = collection(db, "orders");

    const extractOrderIdNumber = (idStr: string): number => {
      if (!idStr) return 0;
      const matches = idStr.match(/\d+/g);
      if (matches && matches.length > 0) {
        return parseInt(matches[matches.length - 1], 10);
      }
      return 0;
    };

    const unsubscribe = onSnapshot(ordersRef, (snapshot) => {
      const list: any[] = [];
      snapshot.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() });
      });
      // Sort strictly by Order ID number in descending order
      list.sort((a, b) => {
        const idA = String(a["Order ID"] || a.id || "");
        const idB = String(b["Order ID"] || b.id || "");
        const numA = extractOrderIdNumber(idA);
        const numB = extractOrderIdNumber(idB);
        if (numA !== numB) {
          return numB - numA;
        }
        return idB.localeCompare(idA);
      });
      setOrders(list);
    }, (err) => {
      console.error("Error subscribing to orders collection:", err);
    });
    return () => unsubscribe();
  }, []);

  // Fetch waitlist entries in real-time
  useEffect(() => {
    const waitlistRef = collection(db, "inventory_waitlist");
    const unsubscribe = onSnapshot(waitlistRef, (snapshot) => {
      const list: any[] = [];
      snapshot.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() });
      });
      // Sort by Requested Date (planDate) so admin can see heavy request periods
      list.sort((a, b) => {
        const dateA = a.planDate ? new Date(a.planDate).getTime() : 0;
        const dateB = b.planDate ? new Date(b.planDate).getTime() : 0;
        return dateA - dateB;
      });
      setWaitlistItems(list);
    }, (err) => {
      console.error("Error subscribing to waitlist collection:", err);
    });
    return () => unsubscribe();
  }, []);

  // Fetch active slides in real-time
  useEffect(() => {
    const slidesRef = collection(db, "homepage_slides");
    const q = query(slidesRef, orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: any[] = [];
      snapshot.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() });
      });
      setActiveSlides(list);
    }, (err) => {
      console.error("Error subscribing to homepage slides:", err);
    });
    return () => unsubscribe();
  }, []);

  // Fetch premium games in real-time
  useEffect(() => {
    const gamesRef = collection(db, "premium_games");
    const q = query(gamesRef, orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: any[] = [];
      snapshot.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() });
      });
      setPremiumGames(list);
    }, (err) => {
      console.error("Error subscribing to premium games:", err);
    });
    return () => unsubscribe();
  }, []);

  // Fetch gear catalog dynamically in real-time
  useEffect(() => {
    const q = query(collection(db, "gear_catalog"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: any[] = [];
      snapshot.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() });
      });
      setGearCatalogList(list);
    }, (err) => {
      console.error("Error subscribing to gear catalog collection:", err);
    });
    return () => unsubscribe();
  }, []);

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      validateAndSetPhoto(file);
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      validateAndSetPhoto(file);
    }
  };

  const validateAndSetPhoto = (file: File) => {
    setFormError("");
    if (!file.type.startsWith("image/")) {
      setFormError("Cover photo must be an image file (PNG, JPG, WEBP, etc.).");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setFormError("Image file size must be less than 5MB.");
      return;
    }
    setCoverPhoto(file);
    
    // Create preview URL
    const reader = new FileReader();
    reader.onloadend = () => {
      setPhotoPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const removePhoto = () => {
    setCoverPhoto(null);
    setPhotoPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Website Asset Manager helpers
  const handleAssetDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setAssetDragActive(true);
  };

  const handleAssetDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setAssetDragActive(false);
  };

  const handleAssetDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setAssetDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const files = Array.from(e.dataTransfer.files) as File[];
      validateAndSetAssetPhotos(files);
    }
  };

  const handleAssetFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files) as File[];
      validateAndSetAssetPhotos(files);
    }
  };

  const validateAndSetAssetPhotos = (files: File[]) => {
    setAssetFormError("");
    const validFiles: File[] = [];

    for (const file of files) {
      if (!file.type.startsWith("image/")) {
        setAssetFormError("All asset files must be images (PNG, JPG, WEBP, etc.).");
        continue;
      }
      if (file.size > 5 * 1024 * 1024) {
        setAssetFormError("All image file sizes must be less than 5MB.");
        continue;
      }
      validFiles.push(file);
    }

    if (validFiles.length > 0) {
      setAssetPhotos(prev => [...prev, ...validFiles]);
      validFiles.forEach(file => {
        const reader = new FileReader();
        reader.onloadend = () => {
          setAssetPhotoPreviews(prev => [...prev, reader.result as string]);
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const removeAssetPhoto = () => {
    setAssetPhotos([]);
    setAssetPhotoPreviews([]);
    if (assetFileInputRef.current) {
      assetFileInputRef.current.value = "";
    }
  };

  const handleLogOut = async () => {
    try {
      localStorage.removeItem("isAdminAuthenticated");
      localStorage.removeItem("adminEmail");
      await signOut(auth).catch(() => {});
      navigate("/admin");
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  const handleOrderStatusUpdate = async (orderId: string, newStatus: string) => {
    setUpdatingOrderStatusId(orderId);
    try {
      await updateDoc(doc(db, "orders", orderId), {
        Status: newStatus
      });
    } catch (err: any) {
      console.error("Failed to update status for order:", orderId, err);
      alert("Permission denied or failed to update: " + err.message);
    } finally {
      setUpdatingOrderStatusId(null);
    }
  };

  const handleInlineSave = async (orderId: string, field: string, value: string) => {
    setEditingCell(null);
    try {
      const orderRef = doc(db, "orders", orderId);
      const updates: any = { [field]: value };
      if (field === "location") {
        updates.locationLink = value;
        updates.address = value;
      }
      if (field === "assignedUnit") {
        updates.assignedUnits = value ? [value] : [];
      }
      await setDoc(orderRef, updates, { merge: true });
    } catch (err: any) {
      console.error("Failed to inline save order:", err);
      alert("Error saving: " + err.message);
    }
  };

  const handleExtendBooking = async (e: FormEvent) => {
    e.preventDefault();
    if (!extendingOrder) return;

    const originalEndStr = extendingOrder["End date"] || extendingOrder.endDate || "";
    if (!originalEndStr) {
      alert("Error: Original booking does not have a valid end date.");
      return;
    }

    if (!extensionEndDate) {
      alert("Please provide a valid new End Date.");
      return;
    }

    const originalEnd = new Date(originalEndStr);
    const newEnd = new Date(extensionEndDate);

    if (newEnd <= originalEnd) {
      alert("New End Date must be strictly after the original End Date: " + originalEndStr);
      return;
    }

    const diffTime = newEnd.getTime() - originalEnd.getTime();
    const addedDays = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));

    setIsSubmitExtending(true);
    try {
      const orderRef = doc(db, "orders", extendingOrder.id);
      
      const currentExtensions = Array.isArray(extendingOrder.extensions) ? [...extendingOrder.extensions] : [];
      const extraRevNum = parseFloat(extensionRevenue) || 0;

      const newLog = {
        addedDays,
        extraRevenue: extraRevNum,
        newEndDate: extensionEndDate,
        dateModified: new Date().toISOString()
      };
      const updatedExtensions = [...currentExtensions, newLog];

      const currentTotalRev = parseFloat(extendingOrder["Total Revenue"] || "0") || parseFloat(extendingOrder["Rent Amount"] || "0") || 0;
      const newTotalRev = String(currentTotalRev + extraRevNum);

      const updates = {
        "End date": extensionEndDate,
        "endDate": extensionEndDate,
        "Total Revenue": newTotalRev,
        extensions: updatedExtensions
      };

      await setDoc(orderRef, updates, { merge: true });
      setExtendingOrder(null);
    } catch (err: any) {
      console.error("Failed to extend booking:", err);
      alert("Error saving booking extension: " + err.message);
    } finally {
      setIsSubmitExtending(false);
    }
  };

  const handleCreateManualOrder = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "orders"));
      let maxNum = 1000;
      querySnapshot.forEach((docSnap) => {
        const data = docSnap.data();
        const orderIdStr = String(data["Order ID"] || data.id || "");
        const matches = orderIdStr.match(/\d+/g);
        if (matches && matches.length > 0) {
          const num = parseInt(matches[matches.length - 1], 10);
          if (!isNaN(num) && num > maxNum) {
            maxNum = num;
          }
        }
      });
      const nextNum = maxNum + 1;
      const manualId = `Order-${nextNum}`;

      const payload = {
        "Order ID": manualId,
        "Order Date": new Date().toISOString(),
        "Name": "New Manual Client",
        "Contact number": "",
        "Start date": new Date().toISOString().split('T')[0],
        "End date": new Date().toISOString().split('T')[0],
        "Order Type": "Manual",
        "Assets": "Draft Asset",
        "Addon": "",
        "location": "",
        "locationLink": "",
        "KYC Document URL": "",
        "Rent Amount": "₹0",
        "Extra Charges": "₹0",
        "Additional Dis": "₹0",
        "Total Revenue": "₹0",
        "Security Dep.": "₹2000",
        "Paid amt": "₹0",
        "Remaining amt": "₹0",
        "Pay Status": "Pending",
        "Status": "Pending",
        "Managed By": "Admin",
        "assignedUnits": [],
        "assignedUnit": ""
      };
      await addDoc(collection(db, "orders"), payload);
    } catch (err: any) {
      console.error("Failed to create manual order:", err);
      alert("Error creating manual order: " + err.message);
    }
  };

  const handleDeleteOrder = async (orderId: string) => {
    if (window.confirm("Are you sure you want to delete this order? This action is irreversible.")) {
      try {
        await deleteDoc(doc(db, "orders", orderId));
      } catch (err: any) {
        console.error("Failed to delete order:", err);
        alert("Failed to delete order: " + err.message);
      }
    }
  };

  const handleImportExcel = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const data = evt.target?.result as ArrayBuffer;
        if (!data) return;

        const array = new Uint8Array(data);
        const workbook = XLSX.read(array, { type: "array" });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const jsonRows: any[] = XLSX.utils.sheet_to_json(worksheet);

        if (jsonRows.length === 0) {
          alert("No rows found in Excel sheet.");
          return;
        }

        const batch = writeBatch(db);

        jsonRows.forEach((row: any) => {
          const rawId = row["Order Id"] || row["Order ID"];
          const orderId = rawId !== undefined ? String(rawId).trim() : `Import-${Math.random().toString(36).substring(2, 11).toUpperCase()}`;
          const isAssignedArr = row["assignedUnits"] ? String(row["assignedUnits"]).split(";") : [];

          let orderDate = "";
          if (row["Date"] !== undefined) {
            if (row["Date"] instanceof Date) {
              orderDate = row["Date"].toISOString();
            } else {
              orderDate = String(row["Date"]).trim();
            }
          } else {
            orderDate = new Date().toISOString();
          }

          let startDate = "";
          if (row["Start Date"] !== undefined) {
            if (row["Start Date"] instanceof Date) {
              startDate = row["Start Date"].toISOString().split('T')[0];
            } else {
              startDate = String(row["Start Date"]).trim();
            }
          }

          let endDate = "";
          if (row["End Date"] !== undefined) {
            if (row["End Date"] instanceof Date) {
              endDate = row["End Date"].toISOString().split('T')[0];
            } else {
              endDate = String(row["End Date"]).trim();
            }
          }

          const payload = {
            "Order ID": orderId,
            "Order Date": orderDate,
            "Name": row["Client Name"] || "Imported Legacy Client",
            "Contact number": row["Phone Num"] !== undefined ? String(row["Phone Num"]) : "",
            "Start date": startDate,
            "End date": endDate,
            "Order Type": row["Order Type"] || "Legacy Import",
            "Assets": row["Item Rented"] || "N/A",
            "Addon": row["Add-Ons"] || "",
            "location": row["Location Link"] || "",
            "locationLink": row["Location Link"] || "",
            "KYC Document URL": row["KYC Doc"] || "",
            "Rent Amount": row["Rent Amount"] !== undefined ? String(row["Rent Amount"]) : "",
            "Extra Charges": row["Extra Charges"] !== undefined ? String(row["Extra Charges"]) : "",
            "Additional Dis": row["Additional Dis"] !== undefined ? String(row["Additional Dis"]) : "",
            "Total Revenue": row["Total Revenue"] !== undefined ? String(row["Total Revenue"]) : "",
            "Security Dep.": row["Security Dep."] !== undefined ? String(row["Security Dep."]) : "",
            "Paid amt": row["Token Paid"] !== undefined ? String(row["Token Paid"]) : "₹0",
            "Remaining amt": row["To Collect"] !== undefined ? String(row["To Collect"]) : "₹0",
            "Pay Status": row["Pay Status"] || "Paid",
            "Status": row["Order Status"] || "Completed",
            "Managed By": row["Managed By"] || "System",
            "assignedUnits": isAssignedArr,
            "assignedUnit": isAssignedArr[0] || ""
          };

          const docRef = doc(db, "orders", orderId);
          batch.set(docRef, payload, { merge: true });
        });

        await batch.commit();
        alert(`Successfully imported ${jsonRows.length} legacy orders!`);
      } catch (err: any) {
        console.error("Excel Import failed:", err);
        alert("Failed parsing and importing Excel: " + err.message);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleExportExcel = () => {
    const formattedOrders = orders.map(order => ({
      "Order Id": order["Order ID"] || order.id || "",
      "Date": order["Order Date"] ? new Date(order["Order Date"]).toLocaleDateString() : "",
      "Client Name": order["Name"] || "",
      "Phone Num": order["Contact number"] || "",
      "Start Date": order["Start date"] || "",
      "End Date": order["End date"] || "",
      "Order Type": order["Order Type"] || "Online",
      "Item Rented": order["Assets"] || "",
      "Add-Ons": order["Addon"] || "",
      "Location Link": order.location || order.locationLink || order.address || "",
      "KYC Doc": order["KYC Document URL"] || "",
      "Rent Amount": order["Rent Amount"] || "",
      "Extra Charges": order["Extra Charges"] || "",
      "Additional Dis": order["Additional Dis"] || "",
      "Total Revenue": order["Total Revenue"] || "",
      "Security Dep.": order["Security Dep."] || "",
      "Token Paid": order["Paid amt"] || "",
      "To Collect": order["Remaining amt"] || "",
      "Pay Status": order["Pay Status"] || "Pending",
      "Order Status": order.Status || order.status || "Pending",
      "Managed By": order["Managed By"] || "",
      "assignedUnits": Array.isArray(order.assignedUnits) ? order.assignedUnits.join(";") : order.assignedUnits || ""
    }));

    const worksheet = XLSX.utils.json_to_sheet(formattedOrders);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Orders");
    XLSX.writeFile(workbook, "AfterHours_Orders.xlsx");
  };

  const daysInMonth = useMemo(() => {
    const days = [];
    const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay();
    const totalDays = new Date(currentYear, currentMonth + 1, 0).getDate();

    for (let i = 0; i < firstDayIndex; i++) {
      days.push(null);
    }

    for (let d = 1; d <= totalDays; d++) {
      days.push(new Date(currentYear, currentMonth, d));
    }
    return days;
  }, [currentMonth, currentYear]);

  const parseLocalDate = (dateStr: string): Date => {
    if (!dateStr) return new Date(NaN);
    const trimmed = dateStr.trim();
    const matchYMD = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (matchYMD) {
      return new Date(parseInt(matchYMD[1], 10), parseInt(matchYMD[2], 10) - 1, parseInt(matchYMD[3], 10), 0, 0, 0, 0);
    }
    const matchDMY = trimmed.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})/);
    if (matchDMY) {
      return new Date(parseInt(matchDMY[3], 10), parseInt(matchDMY[2], 10) - 1, parseInt(matchDMY[1], 10), 0, 0, 0, 0);
    }
    const d = new Date(trimmed);
    return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
  };

  const getEffectiveEndDate = (order: any): string => {
    if (Array.isArray(order.extensions) && order.extensions.length > 0) {
      const lastExt = order.extensions[order.extensions.length - 1];
      if (lastExt && (lastExt.newEndDate || lastExt.endDate)) {
        return lastExt.newEndDate || lastExt.endDate;
      }
    }
    return order["End date"] || order.endDate || "";
  };

  const isInventoryOccupyingStatus = (status: string): boolean => {
    if (!status) return false;
    const s = status.trim().toLowerCase();
    return ["active", "confirmed", "extended", "in progress", "in-progress", "pending"].includes(s);
  };

  const getOrdersForDayAndUnit = (day: Date, unit: string) => {
    if (!day) return [];
    const targetTime = new Date(day.getFullYear(), day.getMonth(), day.getDate(), 0, 0, 0, 0).getTime();

    // Use query-based calendarOrders for gears visual calendar, fallback to list logic
    const sourceOrders = (calendarMode === "gears" && selectedAssetUnit) ? calendarOrders : orders;

    return sourceOrders.filter(order => {
      const oStatus = order["Order Status"] || order.Status || order.status || "";
      if (oStatus === "Cancelled" || oStatus === "Rejected") return false;

      const startStr = order["Start date"] || order.startDate;
      const endStr = getEffectiveEndDate(order);
      if (!startStr || !endStr) return false;
      
      const orderStart = parseLocalDate(startStr);
      if (isNaN(orderStart.getTime())) return false;
      const startOnly = orderStart.getTime();
      
      const orderEnd = parseLocalDate(endStr);
      if (isNaN(orderEnd.getTime())) return false;
      const endOnly = orderEnd.getTime();

      const isDateMatched = targetTime >= startOnly && targetTime <= endOnly;

      const assigned = order.assignedUnits || [];
      const assignedUnit = order.assignedUnit || "";
      const hasUnit = (assignedUnit === unit) || (
        Array.isArray(assigned)
          ? assigned.includes(unit)
          : assigned === unit
      );

      return isDateMatched && hasUnit;
    });
  };

  const parseOrderItemsFromDashboard = (order: any) => {
    const items: { id: string; quantity: number }[] = [];

    if (Array.isArray(order.cart)) {
      order.cart.forEach((item: any) => {
        items.push({ id: item.id, quantity: Number(item.quantity) || 1 });
      });
      return items;
    }
    
    if (Array.isArray(order.items)) {
      order.items.forEach((item: any) => {
        items.push({ id: item.id || item.itemId, quantity: Number(item.quantity) || 1 });
      });
      return items;
    }

    const assetsStr = order.Assets || order.assets || "";
    if (assetsStr && typeof assetsStr === "string") {
      const patterns = [
        { id: "combo-theatre", names: ["Gaming Theatre", "combo-theatre"] },
        { id: "combo-party", names: ["Full Party Setup", "combo-party"] },
        { id: "combo-racing", names: ["PS5 Mega Racing Combo", "Mega Racing Combo", "combo-racing"] },
        { id: "hw-ps5", names: ["Play Station 5", "PS5 console", "hw-ps5"] },
        { id: "hw-speaker", names: ["JBL Party Speaker", "JBL Speaker", "hw-speaker", "Speaker"] },
        { id: "hw-projector", names: ["Full HD Projector", "Projector", "hw-projector"] }
      ];

      const parts = assetsStr.split(",");
      parts.forEach(part => {
        let qty = 1;
        const qtyMatch = part.match(/\(x(\d+)\)/i);
        if (qtyMatch) {
          qty = parseInt(qtyMatch[1], 10);
        }

        for (const pattern of patterns) {
          const matches = pattern.names.some(name => part.toLowerCase().includes(name.toLowerCase()));
          if (matches) {
            items.push({ id: pattern.id, quantity: qty });
            break;
          }
        }
      });
    }

    return items;
  };

  const getDailyAggregateStats = (day: Date, masterCategory: string) => {
    let capacity = 1;
    let categoryKey = "";
    if (masterCategory === "ALL_PS5s") {
      capacity = 2;
      categoryKey = "ps5";
    } else if (masterCategory === "ALL_Projectors") {
      capacity = 1;
      categoryKey = "projector";
    } else if (masterCategory === "ALL_Speakers") {
      capacity = 1;
      categoryKey = "speaker";
    }

    const dTime = new Date(day.getFullYear(), day.getMonth(), day.getDate(), 0, 0, 0, 0);
    const targetTime = dTime.getTime();

    // Identify global lockout
    const hasEventLockout = calendarOrders.some(order => {
      const orderStatus = order["Order Status"] || order.Status || order.status || "";
      if (!isInventoryOccupyingStatus(orderStatus)) return false;

      const isEvent = (order.bookingType || order.type || order.booking_type || "").toLowerCase() === "event" ||
                      (order.Assets || "").toLowerCase().includes("event");
      if (!isEvent) return false;

      const oStartStr = order["Start date"] || order.startDate;
      const oEndStr = getEffectiveEndDate(order);
      if (!oStartStr || !oEndStr) return false;

      const oStart = parseLocalDate(oStartStr);
      const oEnd = parseLocalDate(oEndStr);
      if (isNaN(oStart.getTime()) || isNaN(oEnd.getTime())) return false;

      return targetTime >= oStart.getTime() && targetTime <= oEnd.getTime();
    });

    if (hasEventLockout) {
      return {
        capacity: 0,
        demand: 0,
        available: 0,
        eventLockout: true
      };
    }

    let totalDemand = 0;

    calendarOrders.forEach(order => {
      const orderStatus = order["Order Status"] || order.Status || order.status || "";
      if (!isInventoryOccupyingStatus(orderStatus)) return;

      const oStartStr = order["Start date"] || order.startDate;
      const oEndStr = getEffectiveEndDate(order);
      if (!oStartStr || !oEndStr) return;

      const oStart = parseLocalDate(oStartStr);
      const oEnd = parseLocalDate(oEndStr);
      if (isNaN(oStart.getTime()) || isNaN(oEnd.getTime())) return;

      if (targetTime >= oStart.getTime() && targetTime <= oEnd.getTime()) {
        const items = parseOrderItemsFromDashboard(order);
        items.forEach(item => {
          if (categoryKey === "ps5") {
            if (item.id === "hw-ps5" || item.id === "combo-theatre") {
              totalDemand += item.quantity;
            }
          } else if (categoryKey === "projector") {
            if (item.id === "hw-projector" || item.id === "combo-theatre" || item.id === "combo-party") {
              totalDemand += item.quantity;
            }
          } else if (categoryKey === "speaker") {
            if (item.id === "hw-speaker" || item.id === "combo-party") {
              totalDemand += item.quantity;
            }
          }
        });
      }
    });

    const available = capacity - totalDemand;

    return {
      capacity,
      demand: totalDemand,
      available,
      eventLockout: false
    };
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (!title.trim()) {
      setFormError("Please enter a blog title.");
      return;
    }
    if (!content.trim()) {
      setFormError("Please write some content to publish.");
      return;
    }
    if (!coverPhoto) {
      setFormError("Please upload a cover photo.");
      return;
    }

    setIsSubmitting(true);

    try {
      // 1. Upload cover photo to Firebase Storage
      const storagePath = `blogs/${Date.now()}_${coverPhoto.name}`;
      const imageRef = ref(storage, storagePath);
      
      const uploadSnapshot = await uploadBytes(imageRef, coverPhoto);
      const downloadUrl = await getDownloadURL(uploadSnapshot.ref);

      // 2. Add document to Firestore 'blogs' collection
      const blogsPath = "blogs";
      try {
        await addDoc(collection(db, blogsPath), {
          title: title.trim(),
          content: content.trim(),
          coverPhotoUrl: downloadUrl,
          createdAt: serverTimestamp()
        });
      } catch (firestoreError) {
        handleFirestoreError(firestoreError, OperationType.CREATE, blogsPath);
      }

      setUploadSuccess(true);
      setTitle("");
      setContent("");
      setCoverPhoto(null);
      setPhotoPreview(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (err: any) {
      console.error("Blog submission error:", err);
      setFormError(err.message || "Failed to publish blog post. Try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getProductNameById = (id: string) => {
    const allProducts = [
      { id: "combo-theatre", name: "Gaming Theatre" },
      { id: "combo-party", name: "Full Party Setup" },
      { id: "combo-racing", name: "PS5 Mega Racing Combo" },
      { id: "hw-ps5", name: "Play Station 5 ( PS5 console)" },
      { id: "hw-speaker", name: "JBL Party Speaker" },
      { id: "hw-projector", name: "Full HD Projector" },
      { id: "hw-vr2", name: "Sony PlayStation VR2" },
      { id: "hw-wheel", name: "Logitech G29 Racing Wheel" }
    ];
    return allProducts.find(p => p.id === id)?.name || id;
  };

  const handleAssetSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setAssetFormError("");

    if (assetCategory === "Add-ons") {
      if (!addonPhoto && assetPhotos.length === 0) {
        setAssetFormError("Please upload at least one Preview Photo for the Add-on.");
        return;
      }
    } else {
      if (assetPhotos.length === 0) {
        setAssetFormError("Please upload at least one photo for the web asset.");
        return;
      }
    }

    setIsAssetSubmitting(true);

    try {
      if (assetCategory === "Add-ons") {
        let photoUrl = "";
        let videoUrl = "";
        const mediaUrls: string[] = [];

        // Upload addonPhoto if selected
        if (addonPhoto) {
          const photoPath = `addon_assets/${Date.now()}_${addonPhoto.name}`;
          const photoRef = ref(storage, photoPath);
          const uploadSnap = await uploadBytes(photoRef, addonPhoto);
          photoUrl = await getDownloadURL(uploadSnap.ref);
          mediaUrls.push(photoUrl);
        }

        // Upload multiple selected photos if any
        for (const file of assetPhotos) {
          const fileRefPath = `addon_assets/${Date.now()}_${file.name}`;
          const photoRef = ref(storage, fileRefPath);
          const uploadSnap = await uploadBytes(photoRef, file);
          const url = await getDownloadURL(uploadSnap.ref);
          mediaUrls.push(url);
          if (!photoUrl) {
            photoUrl = url;
          }
        }

        if (addonVideo) {
          const videoPath = `addon_assets/${Date.now()}_${addonVideo.name}`;
          const videoRef = ref(storage, videoPath);
          const uploadSnap = await uploadBytes(videoRef, addonVideo);
          videoUrl = await getDownloadURL(uploadSnap.ref);
        }

        const docRef = doc(db, "addon_media", selectedAssetId);
        await setDoc(docRef, {
          addonId: selectedAssetId,
          addonName: selectedAssetId,
          photoUrl: photoUrl || "",
          videoUrl: videoUrl || "",
          mediaUrls: mediaUrls.length > 0 ? mediaUrls : (photoUrl ? [photoUrl] : []),
          updatedAt: serverTimestamp()
        }, { merge: true });

        setAssetUploadSuccess(true);
        setAddonPhoto(null);
        setAddonPhotoPreview(null);
        setAddonVideo(null);
        setAddonVideoPreview(null);
        setAssetPhotos([]);
        setAssetPhotoPreviews([]);
        if (addonPhotoInputRef.current) addonPhotoInputRef.current.value = "";
        if (addonVideoInputRef.current) addonVideoInputRef.current.value = "";
        if (assetFileInputRef.current) assetFileInputRef.current.value = "";
      } else {
        const mediaUrls: string[] = [];
        let firstDownloadUrl = "";

        // Iterate and upload each file
        for (const file of assetPhotos) {
          const storagePath = `website_assets/${Date.now()}_${file.name}`;
          const imageRef = ref(storage, storagePath);
          const uploadSnapshot = await uploadBytes(imageRef, file);
          const downloadUrl = await getDownloadURL(uploadSnapshot.ref);
          
          mediaUrls.push(downloadUrl);
          if (!firstDownloadUrl) {
            firstDownloadUrl = downloadUrl;
          }

          // Back up in site_images
          try {
            await addDoc(collection(db, "site_images"), {
              url: downloadUrl,
              category: assetCategory,
              productId: selectedAssetId,
              createdAt: serverTimestamp()
            });
          } catch (firestoreError) {
            console.warn("Soft warning: site_images backup failed:", firestoreError);
          }
        }

        // 3. Directly tie the image(s) to the specific product in 'gear_catalog'!
        await setDoc(doc(db, "gear_catalog", selectedAssetId), {
          gearId: selectedAssetId,
          gearName: getProductNameById(selectedAssetId),
          mediaUrl: firstDownloadUrl,
          mediaUrls: mediaUrls,
          mediaType: "image",
          updatedAt: serverTimestamp()
        }, { merge: true });

        setAssetUploadSuccess(true);
        setAssetPhotos([]);
        setAssetPhotoPreviews([]);
        if (assetFileInputRef.current) {
          assetFileInputRef.current.value = "";
        }
      }
    } catch (err: any) {
      console.error("Asset upload failure:", err);
      setAssetFormError(err.message || "Failed to register new asset. Try again.");
    } finally {
      setIsAssetSubmitting(false);
    }
  };

  // --- Homepage Slider Manager Handlers ---
  const handleSlideDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setSlideDragActive(true);
  };

  const handleSlideDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setSlideDragActive(false);
  };

  const handleSlideDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setSlideDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      validateAndSetSlidePhoto(file);
    }
  };

  const handleSlideFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      validateAndSetSlidePhoto(file);
    }
  };

  const validateAndSetSlidePhoto = (file: File) => {
    setSlideFormError("");
    if (!file.type.startsWith("image/")) {
      setSlideFormError("Slide photo must be an image file (PNG, JPG, WEBP, etc.).");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setSlideFormError("Image file size must be less than 5MB.");
      return;
    }
    setSlidePhoto(file);
    
    const reader = new FileReader();
    reader.onloadend = () => {
      setSlidePhotoPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const removeSlidePhoto = () => {
    setSlidePhoto(null);
    setSlidePhotoPreview(null);
    if (slideFileInputRef.current) {
      slideFileInputRef.current.value = "";
    }
  };

  const handleSlideSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSlideFormError("");
    setSlideUploadSuccess(false);

    if (!slidePhoto) {
      setSlideFormError("Please upload a slide image.");
      return;
    }

    setIsSlideSubmitting(true);

    try {
      const fileName = `${Date.now()}_${slidePhoto.name}`;
      const storagePath = `homepage_slides/${fileName}`;
      const imageRef = ref(storage, storagePath);
      
      const uploadSnapshot = await uploadBytes(imageRef, slidePhoto);
      const downloadUrl = await getDownloadURL(uploadSnapshot.ref);

      const homepageSlidesPath = "homepage_slides";
      try {
        await addDoc(collection(db, homepageSlidesPath), {
          url: downloadUrl,
          storagePath: storagePath,
          createdAt: serverTimestamp()
        });
      } catch (firestoreError) {
        handleFirestoreError(firestoreError, OperationType.CREATE, homepageSlidesPath);
      }

      setSlideUploadSuccess(true);
      setSlidePhoto(null);
      setSlidePhotoPreview(null);
      if (slideFileInputRef.current) {
        slideFileInputRef.current.value = "";
      }
    } catch (err: any) {
      console.error("Slide upload failure:", err);
      setSlideFormError(err.message || "Failed to upload slide image. Try again.");
    } finally {
      setIsSlideSubmitting(false);
    }
  };

  const handleDeleteSlide = async (slide: any) => {
    setDeletingSlideId(slide.id);
    try {
      if (slide.storagePath) {
        const imageRef = ref(storage, slide.storagePath);
        await deleteObject(imageRef).catch(err => {
          console.warn("Could not delete file from Cloud storage:", err);
        });
      }
      await deleteDoc(doc(db, "homepage_slides", slide.id));
    } catch (err: any) {
      console.error("Failed to delete slide:", err);
      setSlideFormError("Deletion error: " + err.message);
    } finally {
      setDeletingSlideId(null);
    }
  };

  // --- Premium Games Manager Handlers ---
  const handleGameDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setGameDragActive(true);
  };

  const handleGameDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setGameDragActive(false);
  };

  const handleGameDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setGameDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      validateAndSetGameCover(file);
    }
  };

  const handleGameFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      validateAndSetGameCover(file);
    }
  };

  const validateAndSetGameCover = (file: File) => {
    setGameFormError("");
    if (!file.type.startsWith("image/")) {
      setGameFormError("Cover photo must be an image file (PNG, JPG, WEBP, etc.).");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setGameFormError("Image file size must be less than 5MB.");
      return;
    }
    setGameCover(file);
    
    const reader = new FileReader();
    reader.onloadend = () => {
      setGameCoverPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const removeGameCover = () => {
    setGameCover(null);
    setGameCoverPreview(null);
    if (gameFileInputRef.current) {
      gameFileInputRef.current.value = "";
    }
  };

  const handleGameSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setGameFormError("");
    setGameUploadSuccess(false);

    if (!gameTitle.trim()) {
      setGameFormError("Please enter a Game Title.");
      return;
    }
    if (!gameLink.trim()) {
      setGameFormError("Please enter a PS Store Preview Link.");
      return;
    }
    if (!gameCover) {
      setGameFormError("Please upload a game cover image.");
      return;
    }

    setIsGameSubmitting(true);

    try {
      const fileName = `${Date.now()}_${gameCover.name}`;
      const storagePath = `game_covers/${fileName}`;
      const imageRef = ref(storage, storagePath);
      
      const uploadSnapshot = await uploadBytes(imageRef, gameCover);
      const downloadUrl = await getDownloadURL(uploadSnapshot.ref);

      const premiumGamesPath = "premium_games";
      try {
        await addDoc(collection(db, premiumGamesPath), {
          title: gameTitle.trim(),
          link: gameLink.trim(),
          coverUrl: downloadUrl,
          storagePath: storagePath,
          createdAt: serverTimestamp()
        });
      } catch (firestoreError) {
        handleFirestoreError(firestoreError, OperationType.CREATE, premiumGamesPath);
      }

      setGameUploadSuccess(true);
      setGameTitle("");
      setGameLink("");
      setGameCover(null);
      setGameCoverPreview(null);
      if (gameFileInputRef.current) {
        gameFileInputRef.current.value = "";
      }
    } catch (err: any) {
      console.error("Game upload failure:", err);
      setGameFormError(err.message || "Failed to upload premium game. Try again.");
    } finally {
      setIsGameSubmitting(false);
    }
  };

  const handleDeleteGame = async (game: any) => {
    setDeletingGameId(game.id);
    try {
      if (game.storagePath) {
        const imageRef = ref(storage, game.storagePath);
        await deleteObject(imageRef).catch(err => {
          console.warn("Could not delete file from Cloud storage:", err);
        });
      }
      await deleteDoc(doc(db, "premium_games", game.id));
    } catch (err: any) {
      console.error("Failed to delete game:", err);
      setGameFormError("Deletion error: " + err.message);
    } finally {
      setDeletingGameId(null);
    }
  };

  // Gear Media Manager Handlers
  const handleGearFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setGearMediaFile(file);
      setGearMediaType(file.type.startsWith("video") ? "video" : "image");
      const previewUrl = URL.createObjectURL(file);
      setGearMediaPreview(previewUrl);
      setGearUploadSuccess(false);
      setGearFormError("");
    }
  };

  const handleGearDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setGearDragActive(true);
  };

  const handleGearDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setGearDragActive(false);
  };

  const handleGearDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setGearDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      if (!file.type.startsWith("image/") && !file.type.startsWith("video/")) {
        setGearFormError("Unsupported file type. Please upload an image or video.");
        return;
      }
      setGearMediaFile(file);
      setGearMediaType(file.type.startsWith("video") ? "video" : "image");
      const previewUrl = URL.createObjectURL(file);
      setGearMediaPreview(previewUrl);
      setGearUploadSuccess(false);
      setGearFormError("");
    }
  };

  const removeGearMedia = () => {
    setGearMediaFile(null);
    setGearMediaPreview(null);
    if (gearFileInputRef.current) {
      gearFileInputRef.current.value = "";
    }
  };

  const handleGearSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!gearMediaFile) {
      setGearFormError("Please choose or drop a photo or video file.");
      return;
    }
    setIsGearSubmitting(true);
    setGearFormError("");
    setGearUploadSuccess(false);

    try {
      const fileExt = gearMediaFile.name.split('.').pop();
      const storagePath = `gear_media/${selectedGearId}_${Date.now()}.${fileExt}`;
      const fileRef = ref(storage, storagePath);
      
      const uploadResult = await uploadBytes(fileRef, gearMediaFile);
      const mediaUrl = await getDownloadURL(uploadResult.ref);
      
      await setDoc(doc(db, "gear_catalog", selectedGearId), {
        gearId: selectedGearId,
        gearName: ADMIN_GEARS.find(g => g.id === selectedGearId)?.name || selectedGearId,
        mediaUrl,
        mediaType: gearMediaType,
        storagePath,
        updatedAt: serverTimestamp()
      });

      setGearMediaFile(null);
      setGearMediaPreview(null);
      if (gearFileInputRef.current) {
        gearFileInputRef.current.value = "";
      }
      setGearUploadSuccess(true);
    } catch (err: any) {
      console.error("Error updating gear media:", err);
      setGearFormError(err.message || "Failed to upload gear media.");
    } finally {
      setIsGearSubmitting(false);
    }
  };

  const handleDeleteGearMedia = async (gearDoc: any) => {
    setDeletingGearMediaId(gearDoc.id);
    try {
      if (gearDoc.storagePath) {
        const fileRef = ref(storage, gearDoc.storagePath);
        await deleteObject(fileRef).catch(e => console.warn("Storage item delete issue:", e));
      }
      await deleteDoc(doc(db, "gear_catalog", gearDoc.id));
    } catch (err) {
      console.error("Error resetting gear media entry:", err);
    } finally {
      setDeletingGearMediaId(null);
    }
  };

  const waitlistGrouped = useMemo(() => {
    const groups: { [key: string]: any[] } = {};
    waitlistItems.forEach((sub) => {
      const dateStr = sub.planDate || "No Requested Date";
      if (!groups[dateStr]) {
        groups[dateStr] = [];
      }
      groups[dateStr].push(sub);
    });
    return Object.keys(groups).sort().map((date) => ({
      date,
      items: groups[date]
    }));
  }, [waitlistItems]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-afterhours-purple" />
          <p className="text-xs uppercase tracking-[0.3em] text-white/50 font-black animate-pulse">
            Establishing Secured session...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div id="admin-dashboard-view" className="min-h-screen bg-afterhours-black pt-28 pb-20 px-6 relative">
      {/* Background radial soft light */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-afterhours-purple/5 rounded-full blur-[120px] pointer-events-none" />
      
      <div className={`mx-auto space-y-16 transition-all duration-300 ${
        activeTab === "content" ? "max-w-4xl" : "max-w-7xl w-full"
      }`}>
        
        {/* Dashboard Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 border-b border-white/5 pb-8">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-1.5 h-1.5 rounded-full bg-afterhours-green animate-pulse" />
              <span className="text-[10px] uppercase font-bold tracking-[0.4em] text-white/40 font-mono">
                Operator: {currentUser?.email}
              </span>
            </div>
            <h1 className="text-3xl font-black italic uppercase tracking-tighter text-white">
              System Admin Hub
            </h1>
          </div>
          
          <button
            id="admin-logout-btn"
            onClick={handleLogOut}
            className="flex items-center gap-2 text-xs uppercase font-bold tracking-widest text-white/60 hover:text-afterhours-pink bg-white/5 hover:bg-afterhours-pink/15 px-4 py-2.5 rounded-xl border border-white/5 hover:border-afterhours-pink/30 cursor-pointer transition-all self-start sm:self-auto"
          >
            <LogOut size={14} />
            <span>Sign Out</span>
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-white/5 pb-2 gap-2 md:gap-4 overflow-x-auto select-none no-scrollbar">
          <button
            onClick={() => setActiveTab("orders")}
            className={`px-5 py-3 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all cursor-pointer border flex items-center gap-2 whitespace-nowrap ${
              activeTab === "orders"
                ? "bg-gradient-to-r from-afterhours-cyan/15 to-afterhours-purple/15 border-afterhours-cyan/60 text-afterhours-cyan shadow-[0_0_15px_rgba(34,211,238,0.1)]"
                : "bg-black/40 border-white/5 text-white/40 hover:text-white/70 hover:border-white/10"
            }`}
          >
            <ShoppingBag size={13} />
            <span>Excel Order Matrix</span>
          </button>
          
          <button
            onClick={() => setActiveTab("waitlist")}
            className={`px-5 py-3 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all cursor-pointer border flex items-center gap-2 whitespace-nowrap ${
              activeTab === "waitlist"
                ? "bg-gradient-to-r from-afterhours-pink/15 to-afterhours-purple/15 border-afterhours-pink/60 text-afterhours-pink shadow-[0_0_15px_rgba(236,72,153,0.1)]"
                : "bg-black/40 border-white/5 text-white/40 hover:text-white/70 hover:border-white/10"
            }`}
          >
            <BellRing size={13} />
            <span>Waitlist & Demand</span>
          </button>

          <button
            onClick={() => setActiveTab("content")}
            className={`px-5 py-3 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all cursor-pointer border flex items-center gap-2 whitespace-nowrap ${
              activeTab === "content"
                ? "bg-white/5 border-afterhours-purple/60 text-afterhours-purple shadow-[0_0_15px_rgba(168,85,247,0.1)]"
                : "bg-black/40 border-white/5 text-white/40 hover:text-white/70 hover:border-white/10"
            }`}
          >
            <Sliders size={13} />
            <span>Content Directors</span>
          </button>

          <button
            onClick={() => setActiveTab("calendar")}
            className={`px-5 py-3 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all cursor-pointer border flex items-center gap-2 whitespace-nowrap ${
              activeTab === "calendar"
                ? "bg-gradient-to-r from-afterhours-green/15 to-afterhours-purple/15 border-afterhours-green/60 text-afterhours-green shadow-[0_0_15px_rgba(34,197,94,0.1)]"
                : "bg-black/40 border-white/5 text-white/40 hover:text-white/70 hover:border-white/10"
            }`}
          >
            <Calendar size={13} />
            <span>Availability Calendar</span>
          </button>

          <button
            onClick={() => setActiveTab("vault")}
            className={`px-5 py-3 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all cursor-pointer border flex items-center gap-2 whitespace-nowrap ${
              activeTab === "vault"
                ? "bg-gradient-to-r from-afterhours-cyan/15 to-afterhours-purple/15 border-afterhours-cyan/60 text-afterhours-cyan shadow-[0_0_15px_rgba(34,211,238,0.1)]"
                : "bg-black/40 border-white/5 text-white/40 hover:text-white/70 hover:border-white/10"
            }`}
          >
            <Sliders size={13} className="text-afterhours-cyan" />
            <span>Inventory Vault</span>
          </button>
        </div>

        {/* TAB 1: EXCEL ORDER MATRIX */}
        {activeTab === "orders" && (() => {
          const isEditing = (field: string, orderId: string) => editingCell?.orderId === orderId && editingCell?.field === field;

          const renderEditableTextCell = (field: string, defaultValue: string, order: any, displayValue?: any) => {
            const getFieldVal = () => {
              if (field === "assignedUnit") {
                if (order.assignedUnit) return order.assignedUnit;
                if (Array.isArray(order.assignedUnits) && order.assignedUnits.length > 0) return order.assignedUnits[0];
                if (typeof order.assignedUnits === 'string' && order.assignedUnits) return order.assignedUnits;
                return defaultValue;
              }
              return order[field] !== undefined ? order[field] : defaultValue;
            };
            const currentVal = getFieldVal();
            if (isEditing(field, order.id)) {
              if (field === "Start date" || field === "End date") {
                let dateValue = tempValue;
                if (!dateValue || !/^\d{4}-\d{2}-\d{2}$/.test(dateValue)) {
                  try {
                    const d = new Date(dateValue || Date.now());
                    if (!isNaN(d.getTime())) {
                      dateValue = d.toISOString().split('T')[0];
                    } else {
                      dateValue = new Date().toISOString().split('T')[0];
                    }
                  } catch (err) {
                    dateValue = new Date().toISOString().split('T')[0];
                  }
                }
                return (
                  <td className="px-4 py-4 whitespace-nowrap bg-white/[0.04] min-w-[150px]">
                    <div className="flex items-center gap-1.5">
                      <input
                        type="date"
                        value={dateValue}
                        onChange={(e) => setTempValue(e.target.value)}
                        onBlur={() => {
                          handleInlineSave(order.id, field, tempValue || dateValue);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            handleInlineSave(order.id, field, tempValue || dateValue);
                          } else if (e.key === "Escape") {
                            setEditingCell(null);
                          }
                        }}
                        className="bg-black text-[11px] font-mono text-white border border-afterhours-cyan/60 rounded px-2 py-1 focus:outline-none cursor-pointer"
                        autoFocus
                      />
                      <button
                        onMouseDown={(e) => {
                          e.preventDefault();
                          handleInlineSave(order.id, field, tempValue || dateValue);
                        }}
                        className="p-1 px-1.5 bg-afterhours-green/25 hover:bg-afterhours-green text-afterhours-green hover:text-black rounded text-[10px] uppercase font-bold tracking-wide transition-all cursor-pointer flex items-center justify-center"
                        title="Save Date"
                      >
                        ✔
                      </button>
                    </div>
                  </td>
                );
              }

              if (field === "assignedUnit") {
                const selectedVal = tempValue || currentVal || "";
                return (
                  <td className="px-4 py-4 whitespace-nowrap bg-white/[0.04] min-w-[200px]">
                    <div className="flex items-center gap-1.5">
                      <select
                        value={selectedVal === "None" ? "" : selectedVal}
                        onChange={(e) => setTempValue(e.target.value)}
                        onBlur={() => {
                          handleInlineSave(order.id, field, tempValue || selectedVal);
                        }}
                        className="bg-black text-[11px] font-mono text-white border border-afterhours-cyan/60 rounded px-2 py-1 focus:outline-none cursor-pointer"
                        autoFocus
                      >
                        <option value="">None</option>
                        {allGearUnitsList.map((unit) => (
                          <option key={unit.id} value={unit.name}>
                            {unit.name} ({unit.categoryName})
                          </option>
                        ))}
                      </select>
                      <button
                        onMouseDown={(e) => {
                          e.preventDefault();
                          handleInlineSave(order.id, field, tempValue || selectedVal);
                        }}
                        className="p-1 px-1.5 bg-afterhours-green/25 hover:bg-afterhours-green text-afterhours-green hover:text-black rounded text-[10px] uppercase font-bold tracking-wide transition-all cursor-pointer flex items-center justify-center"
                        title="Save Unit"
                      >
                        ✔
                      </button>
                    </div>
                  </td>
                );
              }

              if (field === "KYC Document URL") {
                return (
                  <td className="px-4 py-4 whitespace-nowrap bg-white/[0.04] min-w-[210px]">
                    <div className="flex items-center gap-1.5 border border-dashed border-white/15 p-1.5 rounded-lg bg-black/60">
                      <input
                        type="file"
                        accept="image/*,.pdf"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          try {
                            setEditingCell(null);
                            const storagePath = `kyc/${order.id || Date.now()}_${file.name}`;
                            const storageRef = ref(storage, storagePath);
                            const uploadSnapshot = await uploadBytes(storageRef, file);
                            const downloadUrl = await getDownloadURL(uploadSnapshot.ref);
                            
                            const orderRef = doc(db, "orders", order.id);
                            await updateDoc(orderRef, {
                              "KYC Document URL": downloadUrl
                            });
                            alert("KYC Document uploaded and saved successfully!");
                          } catch (uploadErr: any) {
                            console.error("KYC upload error:", uploadErr);
                            alert("Failed to upload KYC document: " + uploadErr.message);
                          }
                        }}
                        className="text-[9px] text-white/75 font-mono file:mr-1.5 file:py-1 file:px-2 file:rounded file:border-0 file:bg-afterhours-purple/20 file:text-afterhours-purple hover:file:bg-afterhours-purple hover:file:text-white file:text-[9px] file:cursor-pointer cursor-pointer"
                        autoFocus
                      />
                      <button
                        onClick={() => setEditingCell(null)}
                        className="p-1 bg-white/5 hover:bg-white/10 text-white/50 hover:text-white rounded transition-all cursor-pointer"
                        title="Cancel"
                      >
                        <X size={10} />
                      </button>
                    </div>
                  </td>
                );
              }

              return (
                <td className="px-4 py-4 whitespace-nowrap bg-white/[0.04] min-w-[120px]">
                  <input
                    type="text"
                    value={tempValue}
                    onChange={(e) => setTempValue(e.target.value)}
                    onBlur={() => handleInlineSave(order.id, field, tempValue)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        handleInlineSave(order.id, field, tempValue);
                      } else if (e.key === "Escape") {
                        setEditingCell(null);
                      }
                    }}
                    className="bg-black text-xs font-mono text-white border border-afterhours-cyan/60 rounded px-2 py-1 w-full focus:outline-none"
                    autoFocus
                  />
                </td>
              );
            }
            return (
              <td
                onClick={() => {
                  setEditingCell({ orderId: order.id, field });
                  setTempValue(currentVal);
                }}
                className="px-4 py-4 cursor-pointer hover:bg-white/5 transition-all font-mono text-xs text-white/70 whitespace-nowrap min-w-[120px]"
                title="Click to edit value"
              >
                {displayValue !== undefined ? (
                  <span className="hover:text-afterhours-cyan transition-colors">{displayValue}</span>
                ) : currentVal !== undefined && currentVal !== "" ? (
                  <span className="hover:text-afterhours-cyan transition-colors">{currentVal}</span>
                ) : (
                  <span className="text-white/20 italic tracking-wide group-hover:text-white/40">Click to edit</span>
                )}
              </td>
            );
          };

          return (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="bg-afterhours-cyan/10 border border-afterhours-cyan/25 p-2.5 rounded-xl text-afterhours-cyan">
                    <ShoppingBag size={18} />
                  </div>
                  <div>
                    <h2 className="text-xl font-black uppercase italic text-white">Excel-Style Order Matrix</h2>
                    <p className="text-[10px] uppercase tracking-wider text-white/40 font-mono">Live customer orders synced with Cloud Firestore</p>
                  </div>
                </div>
                <div className="text-[10px] font-mono text-white/45 bg-[#121215] border border-white/5 rounded-full px-3 py-1.5 self-start sm:self-auto uppercase tracking-wider">
                  Total Orders: <strong className="text-afterhours-cyan font-bold">{orders.length}</strong>
                </div>
              </div>

              {/* Excel Import/Export and Manual Create tools panel */}
              <div className="flex flex-wrap items-center gap-3 bg-[#121215]/50 border border-white/5 p-3 rounded-2xl">
                <span className="text-[10px] uppercase font-bold tracking-widest text-white/30 font-mono ml-1">Tools Panel:</span>
                
                {/* Create Manual Order */}
                <button
                  onClick={handleCreateManualOrder}
                  className="px-4 py-2 text-[10px] font-black uppercase tracking-widest bg-afterhours-green/10 text-afterhours-green hover:bg-afterhours-green hover:text-black border border-afterhours-green/20 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 font-sans font-sans"
                  title="Create a new blank manual order"
                >
                  <Plus size={12} />
                  + Create Manual Order
                </button>

                {/* Import Excel */}
                <button
                  onClick={() => document.getElementById("excel-import-input")?.click()}
                  className="px-4 py-2 text-[10px] font-black uppercase tracking-widest bg-afterhours-cyan/10 text-afterhours-cyan hover:bg-afterhours-cyan hover:text-black border border-afterhours-cyan/20 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 font-sans"
                  title="Upload legacy orders Excel file"
                >
                  <UploadCloud size={12} />
                  Import Legacy Excel
                </button>
                <input
                  type="file"
                  id="excel-import-input"
                  accept=".xlsx, .xls"
                  className="hidden"
                  onChange={handleImportExcel}
                />

                {/* Export Excel */}
                <button
                  onClick={handleExportExcel}
                  className="px-4 py-2 text-[10px] font-black uppercase tracking-widest bg-afterhours-purple/10 text-afterhours-purple hover:bg-afterhours-purple hover:text-white border border-afterhours-purple/20 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 font-sans"
                  title="Download all orders as Excel"
                >
                  <FileText size={12} />
                  Download Excel
                </button>
              </div>

              <div className="w-full overflow-x-auto bg-[#0a0a0c]/80 border border-white/5 rounded-3xl p-1 shadow-2xl relative">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-white/5 bg-white/[0.02]">
                      <th className="px-4 py-3 font-black text-[10px] uppercase tracking-wider text-white/50 whitespace-nowrap">Order Id</th>
                      <th className="px-4 py-3 font-black text-[10px] uppercase tracking-wider text-white/50 whitespace-nowrap">Date</th>
                      <th className="px-4 py-3 font-black text-[10px] uppercase tracking-wider text-white/50 whitespace-nowrap">Client Name</th>
                      <th className="px-4 py-3 font-black text-[10px] uppercase tracking-wider text-white/50 whitespace-nowrap">Phone Num</th>
                      <th className="px-4 py-3 font-black text-[10px] uppercase tracking-wider text-white/50 whitespace-nowrap">Start Date</th>
                      <th className="px-4 py-3 font-black text-[10px] uppercase tracking-wider text-white/50 whitespace-nowrap">End Date</th>
                      <th className="px-4 py-3 font-black text-[10px] uppercase tracking-wider text-white/50 whitespace-nowrap">Order Type</th>
                      <th className="px-4 py-3 font-black text-[10px] uppercase tracking-wider text-white/50 whitespace-nowrap">Item Rented</th>
                      <th className="px-4 py-3 font-black text-[10px] uppercase tracking-wider text-white/50 whitespace-nowrap">Add-Ons</th>
                      <th className="px-4 py-3 font-black text-[10px] uppercase tracking-wider text-white/50 whitespace-nowrap">Assigned Unit</th>
                      <th className="px-4 py-3 font-black text-[10px] uppercase tracking-wider text-white/50 whitespace-nowrap">Location Link</th>
                      <th className="px-4 py-3 font-black text-[10px] uppercase tracking-wider text-white/50 text-center whitespace-nowrap">KYC Doc</th>
                      <th className="px-4 py-3 font-black text-[10px] uppercase tracking-wider text-white/50 whitespace-nowrap">Rent Amount</th>
                      <th className="px-4 py-3 font-black text-[10px] uppercase tracking-wider text-white/50 whitespace-nowrap">Extra Charges</th>
                      <th className="px-4 py-3 font-black text-[10px] uppercase tracking-wider text-white/50 whitespace-nowrap">Additional Dis</th>
                      <th className="px-4 py-3 font-black text-[10px] uppercase tracking-wider text-white/50 whitespace-nowrap">Total Revenue</th>
                      <th className="px-4 py-3 font-black text-[10px] uppercase tracking-wider text-white/50 whitespace-nowrap">Security Dep.</th>
                      <th className="px-4 py-3 font-black text-[10px] uppercase tracking-wider text-white/50 whitespace-nowrap">Token Paid</th>
                      <th className="px-4 py-3 font-black text-[10px] uppercase tracking-wider text-white/50 whitespace-nowrap">To Collect</th>
                      <th className="px-4 py-3 font-black text-[10px] uppercase tracking-wider text-white/50 whitespace-nowrap">Pay Status</th>
                      <th className="px-4 py-3 font-black text-[10px] uppercase tracking-wider text-white/50 whitespace-nowrap">Order Status</th>
                      <th className="px-4 py-3 font-black text-[10px] uppercase tracking-wider text-white/50 whitespace-nowrap">Managed By</th>
                      <th className="px-4 py-3 font-black text-[10px] uppercase tracking-wider text-white/50 text-center whitespace-nowrap">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {orders.length === 0 ? (
                      <tr>
                        <td colSpan={23} className="text-center py-20 text-xs font-mono text-white/30">
                          No customer orders stored in the orders collection.
                        </td>
                      </tr>
                    ) : (
                      orders.map((order) => (
                        <tr key={order.id} className="hover:bg-white/[0.02] transition-all border-b border-white/5">
                          {/* 1. Order Id */}
                          {renderEditableTextCell("Order ID", order.id || "", order, order["Order ID"] || order.id)}

                          {/* 2. Date */}
                          {renderEditableTextCell(
                            "Order Date", 
                            new Date().toISOString(), 
                            order, 
                            order["Order Date"] ? new Date(order["Order Date"]).toLocaleDateString() : "N/A"
                          )}

                          {/* 3. Client Name */}
                          {renderEditableTextCell("Name", "Anonymous", order)}

                          {/* 4. Phone Num */}
                          {renderEditableTextCell("Contact number", "N/A", order)}

                          {/* 5. Start Date */}
                          {renderEditableTextCell("Start date", "N/A", order)}

                          {/* 6. End Date */}
                          {renderEditableTextCell("End date", "N/A", order)}

                          {/* 7. Order Type */}
                          {renderEditableTextCell("Order Type", "Online", order)}

                          {/* 8. Item Rented */}
                          {renderEditableTextCell("Assets", "N/A", order)}

                          {/* 9. Add-Ons */}
                          {renderEditableTextCell("Addon", "N/A", order)}

                          {/* 9b. Assigned Unit */}
                          {renderEditableTextCell("assignedUnit", "None", order)}

                          {/* 10. Location Link */}
                          {(() => {
                            const rawLoc = order.location || order.locationLink || order.address || "";
                            const displayLocation = (() => {
                              if (!rawLoc) return undefined;
                              const isUrl = /^(https?:\/\/|www\.)[^\s/$.?#].[^\s]*$/i.test(rawLoc.trim()) || 
                                            rawLoc.trim().includes("maps.google") || 
                                            rawLoc.trim().includes("maps.app.goo.gl");
                              if (isUrl) {
                                const fullUrl = rawLoc.trim().startsWith("http") ? rawLoc.trim() : `https://${rawLoc.trim()}`;
                                return (
                                  <a
                                    href={fullUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 text-afterhours-cyan hover:text-white hover:underline font-bold transition-all text-[11px] uppercase tracking-wider"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    📍 View Map ➔
                                  </a>
                                );
                              }
                              return (
                                <span className="text-white/70 max-w-[150px] truncate block text-[11px]" title={rawLoc}>
                                  {rawLoc}
                                </span>
                              );
                            })();
                            return renderEditableTextCell("location", "", order, displayLocation ? (displayLocation as any) : undefined);
                          })()}

                          {/* 11. KYC Doc */}
                          {(() => {
                            const kycUrl = order["KYC Document URL"] || "";
                            const displayKyc = kycUrl ? (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setKycModalUrl(kycUrl);
                                }}
                                className="px-3 py-1.5 text-[9px] font-black uppercase tracking-widest bg-afterhours-purple/10 text-afterhours-purple hover:bg-afterhours-purple hover:text-white border border-afterhours-purple/20 hover:border-afterhours-purple/80 rounded-lg transition-all cursor-pointer flex items-center gap-1 mx-auto"
                              >
                                <Eye size={10} />
                                <span>View KYC</span>
                              </button>
                            ) : undefined;
                            return renderEditableTextCell("KYC Document URL", "", order, displayKyc ? (displayKyc as any) : undefined);
                          })()}

                          {/* 12. Rent Amount */}
                          {renderEditableTextCell("Rent Amount", "", order)}

                          {/* 13. Extra Charges */}
                          {renderEditableTextCell("Extra Charges", "", order)}

                          {/* 14. Additional Dis */}
                          {renderEditableTextCell("Additional Dis", "", order)}

                          {/* 15. Total Revenue */}
                          {renderEditableTextCell("Total Revenue", "", order)}

                          {/* 16. Security Dep. */}
                          {renderEditableTextCell("Security Dep.", "", order)}

                          {/* 17. Token Paid */}
                          {renderEditableTextCell("Paid amt", "", order)}

                          {/* 18. To Collect (Remaining amt) - Inline Editable */}
                          {renderEditableTextCell("Remaining amt", "₹0", order)}

                          {/* 19. Pay Status - Inline Editable Select dropdown */}
                          <td className="px-4 py-4 whitespace-nowrap">
                            {isEditing("Pay Status", order.id) ? (
                              <select
                                value={tempValue}
                                onChange={(e) => {
                                  setTempValue(e.target.value);
                                  handleInlineSave(order.id, "Pay Status", e.target.value);
                                }}
                                onBlur={() => setEditingCell(null)}
                                className="bg-black text-[10px] font-black uppercase tracking-wider border border-afterhours-cyan/60 rounded px-2 py-1 focus:outline-none text-white cursor-pointer"
                                autoFocus
                              >
                                <option value="Pending">Pending</option>
                                <option value="Partially Paid">Partially Paid</option>
                                <option value="Fully Paid">Fully Paid</option>
                                <option value="Refunded">Refunded</option>
                              </select>
                            ) : (
                              <span
                                onClick={() => {
                                  setEditingCell({ orderId: order.id, field: "Pay Status" });
                                  setTempValue(order["Pay Status"] || "Pending");
                                }}
                                className={`cursor-pointer hover:text-afterhours-cyan transition-colors text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded border whitespace-nowrap ${
                                  (order["Pay Status"] || "Pending").toLowerCase() === "fully paid" || (order["Pay Status"] || "Pending").toLowerCase() === "paid" ? "border-green-500/20 text-afterhours-green bg-green-500/5" :
                                  (order["Pay Status"] || "Pending").toLowerCase() === "partially paid" ? "border-cyan-500/20 text-afterhours-cyan bg-afterhours-cyan/5" :
                                  "border-yellow-500/20 text-yellow-500 bg-yellow-500/5"
                                }`}
                              >
                                {order["Pay Status"] || "Pending"}
                              </span>
                            )}
                          </td>

                          {/* 20. Order Status - Inline Editable Select dropdown */}
                          <td className="px-4 py-4 whitespace-nowrap">
                            {isEditing("Status", order.id) ? (
                              <select
                                value={tempValue}
                                onChange={(e) => {
                                  setTempValue(e.target.value);
                                  handleInlineSave(order.id, "Status", e.target.value);
                                }}
                                onBlur={() => setEditingCell(null)}
                                className="bg-black text-[10px] font-black uppercase tracking-wider border border-afterhours-cyan/60 rounded px-2 py-1 focus:outline-none text-white cursor-pointer"
                                autoFocus
                              >
                                <option value="Pending">Pending</option>
                                <option value="Active">Active</option>
                                <option value="Completed">Completed</option>
                                <option value="Cancelled">Cancelled</option>
                              </select>
                            ) : (
                              <span
                                onClick={() => {
                                  setEditingCell({ orderId: order.id, field: "Status" });
                                  setTempValue(order.Status || "Pending");
                                }}
                                className={`cursor-pointer hover:text-afterhours-cyan transition-colors text-[10px] font-black uppercase tracking-widest px-2.5 py-1.5 rounded border whitespace-nowrap ${
                                  (order.Status || "Pending") === "Pending" ? "border-yellow-500/20 text-yellow-500 bg-yellow-500/5" :
                                  (order.Status || "Pending") === "Active" ? "border-green-500/20 text-afterhours-green bg-green-500/5" :
                                  (order.Status || "Pending") === "Completed" ? "border-white/5 text-white/50 bg-white/5" :
                                  "border-red-500/25 text-red-500 bg-red-500/5"
                                }`}
                              >
                                {order.Status || "Pending"}
                              </span>
                            )}
                          </td>

                          {/* 21. Managed By */}
                          {renderEditableTextCell("Managed By", "", order)}

                          {/* 22. Actions */}
                          <td className="px-4 py-4 text-center whitespace-nowrap space-x-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setExtendingOrder(order);
                                setExtensionEndDate(order["End date"] || order.endDate || "");
                                setExtensionRevenue("0");
                              }}
                              className="p-2 bg-cyan-500/10 hover:bg-cyan-500 text-cyan-400 hover:text-black rounded-lg border border-cyan-500/20 hover:border-cyan transition-all cursor-pointer inline-flex items-center justify-center mr-1"
                              title="Extend Booking"
                            >
                              <Calendar size={13} />
                            </button>
                            <button
                              onClick={() => handleDeleteOrder(order.id)}
                              className="p-2 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white rounded-lg border border-red-500/20 hover:border-red-500 transition-all cursor-pointer inline-flex items-center justify-center"
                              title="Delete this order"
                            >
                              <Trash2 size={13} />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })()}

        {/* TAB 2: DEMAND INTELLIGENCE HUB */}
        {activeTab === "waitlist" && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="bg-afterhours-pink/10 border border-afterhours-pink/25 p-2.5 rounded-xl text-afterhours-pink">
                  <BellRing size={18} />
                </div>
                <div>
                  <h2 className="text-xl font-black uppercase italic text-white">Waitlist & Demand</h2>
                  <p className="text-[10px] uppercase tracking-wider text-white/40 font-mono">Watch out-of-stock item subscriptions sorted by requested target date</p>
                </div>
              </div>
              <div className="text-[10px] font-mono text-white/45 bg-[#121215] border border-white/5 rounded-full px-3 py-1.5 self-start sm:self-auto uppercase tracking-wider">
                Total Subscribers: <strong className="text-afterhours-pink font-bold">{waitlistItems.length}</strong>
              </div>
            </div>

            {waitlistGrouped.length === 0 ? (
              <div className="text-center py-20 bg-[#0a0a0c]/80 border border-white/5 rounded-3xl p-8 shadow-2xl">
                <p className="text-xs font-mono text-white/30">
                  No priority queue registrations logged in the inventory_waitlist collection.
                </p>
              </div>
            ) : (
              <div className="space-y-8">
                {waitlistGrouped.map(({ date, items }) => (
                  <div key={date} className="relative p-6 rounded-3xl bg-neutral-900/40 border border-white/5 hover:border-white/10 transition-all space-y-4">
                    <div className="flex items-center justify-between border-b border-white/5 pb-3">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-afterhours-pink animate-pulse" />
                        <h3 className="text-xs uppercase font-black tracking-[0.2em] text-white">
                          Requested Date: <span className="text-afterhours-pink font-mono">{date}</span>
                        </h3>
                      </div>
                      <span className="text-[9px] font-black uppercase tracking-wider bg-afterhours-pink/10 border border-afterhours-pink/20 px-2.5 py-0.5 rounded-full text-afterhours-pink">
                        {items.length} {items.length === 1 ? "priority alert" : "priority alerts"}
                      </span>
                    </div>

                    <div className="w-full overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="border-b border-white/5 text-[9px] uppercase tracking-wider text-white/40">
                            <th className="pb-2">Target gear</th>
                            <th className="pb-2">Gear code</th>
                            <th className="pb-2">Contact Link</th>
                            <th className="pb-2 font-mono">Subscriber name</th>
                            <th className="pb-2 text-right">Registration time</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5 text-xs text-white/80 font-mono">
                          {items.map((sub, idx) => (
                            <tr key={sub.id || idx} className="hover:bg-white/[0.01] transition-all">
                              <td className="py-3 font-sans font-black text-white uppercase">{sub.itemName}</td>
                              <td className="py-3 text-[10px] text-white/40">{sub.itemId}</td>
                              <td className="py-3 text-afterhours-cyan font-bold">{sub.contact}</td>
                              <td className="py-3 font-sans font-bold uppercase text-white/90">{sub.name}</td>
                              <td className="py-3 text-right text-[10px] text-white/30">
                                {sub.createdAt?.seconds 
                                  ? new Date(sub.createdAt.seconds * 1000).toLocaleString() 
                                  : sub.createdAt ? new Date(sub.createdAt).toLocaleString() : "N/A"}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 4: VISUAL AVAILABILITY CALENDAR */}
        {activeTab === "calendar" && (
          <div className="space-y-6 animate-fadeIn">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="bg-afterhours-green/10 border border-afterhours-green/25 p-2.5 rounded-xl text-afterhours-green">
                  <Calendar size={18} />
                </div>
                <div>
                  <h2 className="text-xl font-black uppercase italic text-white font-mono tracking-tight">Visual Availability Calendar</h2>
                  <p className="text-[10px] uppercase tracking-wider text-white/40 font-mono">
                    {calendarMode === "gears" ? "Real-time status tracking for high-ticket inventory units" : "Aggregate rented vs available counts for rental addons"}
                  </p>
                </div>
              </div>

              {/* Header Segmented Toggle & Config Control */}
              <div className="flex flex-wrap items-center gap-4">
                {/* Mode Toggle Button Set */}
                <div className="flex p-1 bg-black/60 rounded-xl border border-white/5 font-mono">
                  <button
                    onClick={() => setCalendarMode("gears")}
                    className={`px-3 py-1.5 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all cursor-pointer ${
                      calendarMode === "gears"
                        ? "bg-gradient-to-r from-afterhours-cyan to-afterhours-purple text-black"
                        : "text-white/60 hover:text-white"
                    }`}
                  >
                    Gears
                  </button>
                  <button
                    onClick={() => setCalendarMode("addons")}
                    className={`px-3 py-1.5 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all cursor-pointer ${
                      calendarMode === "addons"
                        ? "bg-gradient-to-r from-afterhours-cyan to-afterhours-purple text-black"
                        : "text-white/60 hover:text-white"
                    }`}
                  >
                    Add-ons
                  </button>
                </div>



                {/* Asset Dropdown Selector - only visible in 'gears' view */}
                {calendarMode === "gears" && (
                  <div className="flex items-center gap-2">
                    <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest font-mono">Select Unit:</label>
                    <select
                      value={selectedAssetUnit}
                      onChange={(e) => setSelectedAssetUnit(e.target.value)}
                      className="bg-black/80 border border-white/10 rounded-xl px-3 py-2 text-xs font-mono font-bold text-afterhours-green focus:border-afterhours-green focus:outline-none cursor-pointer uppercase tracking-wider"
                    >
                      <optgroup label="Master Categories" className="bg-black text-afterhours-cyan">
                        <option value="ALL_PS5s">ALL PS5s</option>
                        <option value="ALL_Projectors">ALL Projectors</option>
                        <option value="ALL_Speakers">ALL Speakers</option>
                      </optgroup>
                      <optgroup label="Individual Units" className="bg-black text-afterhours-green">
                        {allGearUnitsList.length === 0 ? (
                          <option value="">No individual units created</option>
                        ) : (
                          allGearUnitsList.map(unit => (
                            <option key={unit.id} value={unit.name}>{unit.name} ({unit.categoryName})</option>
                          ))
                        )}
                      </optgroup>
                    </select>
                  </div>
                )}

                {/* Add-on Dropdown Selector - only visible in 'addons' view */}
                {calendarMode === "addons" && (
                  <div className="flex items-center gap-2">
                    <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest font-mono">Select Add-on:</label>
                    <select
                      value={selectedCalendarAddonId}
                      onChange={(e) => setSelectedCalendarAddonId(e.target.value)}
                      className="bg-black/80 border border-white/10 rounded-xl px-3 py-2 text-xs font-mono font-bold text-afterhours-purple focus:border-afterhours-purple focus:outline-none cursor-pointer uppercase tracking-wider"
                    >
                      {categoriesList.filter(c => c.type === "addon").length === 0 ? (
                        <option value="">No Add-ons created</option>
                      ) : (
                        categoriesList
                          .filter(c => c.type === "addon")
                          .map(cat => (
                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                          ))
                      )}
                    </select>
                  </div>
                )}
              </div>
            </div>

            {/* Calendar Control Frame */}
            <div className="p-6 rounded-3xl bg-[#0a0a0c]/80 border border-white/5 shadow-2xl space-y-6">
              <div className="flex items-center justify-between border-b border-white/5 pb-4">
                <button
                  onClick={() => {
                    if (currentMonth === 0) {
                      setCurrentMonth(11);
                      setCurrentYear(prev => prev - 1);
                    } else {
                      setCurrentMonth(prev => prev - 1);
                    }
                  }}
                  className="px-4 py-2 text-xs font-black uppercase tracking-wider bg-white/5 hover:bg-white/10 rounded-xl border border-white/5 transition-all text-white/80 cursor-pointer"
                >
                  ◀ Previous
                </button>
                <h3 className="text-sm font-black uppercase tracking-widest text-afterhours-cyan font-mono">
                  {new Date(currentYear, currentMonth).toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                </h3>
                <button
                  onClick={() => {
                    if (currentMonth === 11) {
                      setCurrentMonth(0);
                      setCurrentYear(prev => prev + 1);
                    } else {
                      setCurrentMonth(prev => prev + 1);
                    }
                  }}
                  className="px-4 py-2 text-xs font-black uppercase tracking-wider bg-white/5 hover:bg-white/10 rounded-xl border border-white/5 transition-all text-white/80 cursor-pointer"
                >
                  Next ▶
                </button>
              </div>

              {/* 7 Days of the Week Header */}
              <div className="grid grid-cols-7 gap-2 text-center">
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(dayName => (
                  <div key={dayName} className="text-[10px] font-black uppercase tracking-widest text-white/30 font-mono py-1">
                    {dayName}
                  </div>
                ))}
              </div>

              {/* Calendar Grid */}
              <div className="grid grid-cols-7 gap-2">
                {daysInMonth.map((day, idx) => {
                  if (!day) {
                    return (
                      <div
                        key={`empty-${idx}`}
                        className="aspect-square min-h-[90px] rounded-2xl bg-[#121215]/10 border border-dashed border-white/[0.02]"
                      />
                    );
                  }

                  const isMasterCategory = calendarMode === "gears" && selectedAssetUnit.startsWith("ALL_");
                  const matchedOrders = getOrdersForDayAndUnit(day, selectedAssetUnit);
                  const isToday = new Date().toDateString() === day.toDateString();
                  
                  const addonStats = calendarMode === "addons" ? getSelectedAddonStatsForDay(day, selectedCalendarAddonId) : null;
                  const aggStats = (isMasterCategory && day) ? getDailyAggregateStats(day, selectedAssetUnit) : null;

                  const isBooked = calendarMode === "addons"
                    ? (addonStats ? addonStats.booked > 0 : false)
                    : (isMasterCategory 
                       ? (aggStats ? aggStats.demand > 0 : false)
                       : matchedOrders.length > 0);

                  let bgBorderClasses = "bg-[#121215]/40 border-white/5 hover:border-white/10";
                  if (isToday) {
                    bgBorderClasses = "bg-[#06b6d4]/5 border-[#06b6d4]/40 shadow-[0_0_15px_rgba(6,182,212,0.1)]";
                  } else if (calendarMode === "addons") {
                    if (isBooked) {
                      bgBorderClasses = "bg-[#a855f7]/10 border-[#a855f7]/30";
                    }
                  } else {
                    if (isMasterCategory && aggStats) {
                      if (aggStats.eventLockout) {
                        bgBorderClasses = "bg-rose-950/20 border-rose-500/20";
                      } else if (aggStats.available <= 0) {
                        bgBorderClasses = "bg-rose-950/20 border-rose-500/25";
                      } else if (aggStats.available > 0 && aggStats.available < aggStats.capacity) {
                        bgBorderClasses = "bg-amber-950/20 border-amber-500/25";
                      } else {
                        bgBorderClasses = "bg-emerald-950/10 border-emerald-500/20";
                      }
                    } else if (isBooked) {
                      bgBorderClasses = "bg-[#a855f7]/10 border-[#a855f7]/30";
                    }
                  }

                  return (
                    <div
                      key={day.toISOString()}
                      className={`min-h-[110px] p-2.5 rounded-2xl border transition-all flex flex-col justify-between max-w-full overflow-hidden ${bgBorderClasses}`}
                    >
                      {/* Day Number */}
                      <span className={`text-[10px] font-bold font-mono ${isToday ? "text-[#06b6d4] font-black" : "text-white/40"}`}>
                        {day.getDate()}
                      </span>

                      {/* Dynamic Mode Render Block */}
                      {calendarMode === "addons" ? (
                        <div className="space-y-1 mt-1.5 flex-grow overflow-y-auto max-h-[85px] no-scrollbar">
                          {selectedCalendarAddonId ? (() => {
                            const cat = categoriesList.find(c => c.id === selectedCalendarAddonId);
                            const stats = getSelectedAddonStatsForDay(day, selectedCalendarAddonId);
                            if (stats.owned === 0) {
                              return (
                                <p className="text-[8px] text-white/20 italic font-mono uppercase text-center mt-4">
                                  No units
                                </p>
                              );
                            }
                            return (
                              <div className="space-y-1">
                                <div
                                  className={`p-1 px-1.5 rounded-lg text-white leading-tight font-mono text-[9px] ${
                                    stats.booked > 0 
                                      ? "bg-[#a855f7]/20 border border-[#a855f7]/30" 
                                      : "bg-white/5 border border-white/10 text-white/50"
                                  }`}
                                  title={`${cat?.name || "Addon"}: ${stats.booked} booked, ${stats.available} available from ${stats.owned}`}
                                >
                                  <span className="font-sans font-bold text-[9px] block truncate text-white">
                                    {cat?.name || "Addon"}
                                  </span>
                                  <div className="flex justify-between items-center text-[8px] mt-0.5 font-mono">
                                    <span className="text-white/40">Booked:</span>
                                    <span>
                                      <span className={stats.booked > 0 ? "text-[#a855f7] font-black" : "text-white/40"}>
                                        {stats.booked}
                                      </span>
                                      <span className="text-white/20 mx-[2px]">/</span>
                                      <span className="text-white/60">{stats.owned}</span>
                                    </span>
                                  </div>
                                </div>
                                <div className="space-y-0.5">
                                  {stats.unitStats.map(u => (
                                    <div 
                                      key={u.unitId} 
                                      className={`text-[8px] px-1 py-0.5 rounded flex justify-between items-center font-mono ${
                                        u.booked 
                                          ? "bg-red-500/10 text-red-400 border border-red-500/15" 
                                          : "bg-green-500/5 text-[#22c55e] border border-green-500/10"
                                      }`}
                                    >
                                      <span className="truncate max-w-[55px]">{u.unitName}</span>
                                      <span className="text-[6px] uppercase font-bold tracking-tight">
                                        {u.booked ? "Rented" : "Idle"}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            );
                          })() : (
                            <p className="text-[8px] text-white/20 italic font-mono uppercase text-center mt-4">
                              Select from dropdown
                            </p>
                          )}
                        </div>
                      ) : isMasterCategory ? (() => {
                        const agg = getDailyAggregateStats(day, selectedAssetUnit);
                        let colorClass = "bg-emerald-500/10 border border-emerald-500/30 text-emerald-400";
                        let statusText = "Idle";
                        let statusValue = `${agg.available}/${agg.capacity}`;

                        if (agg.eventLockout) {
                          colorClass = "bg-rose-500/10 border border-rose-500/35 text-rose-400 animate-pulse";
                          statusText = "LOCKOUT";
                          statusValue = "0/0";
                        } else if (agg.available <= 0) {
                          colorClass = "bg-rose-500/10 border border-rose-500/35 text-rose-400";
                          statusText = "OUT OF STOCK";
                        } else if (agg.available > 0 && agg.available < agg.capacity) {
                          colorClass = "bg-amber-500/10 border border-amber-500/35 text-amber-400";
                          statusText = "PARTIAL";
                        }

                        return (
                          <div className="flex-grow flex flex-col justify-end mt-2">
                            <div className={`p-2 rounded-xl border ${colorClass} text-center space-y-1`}>
                              <div className="text-[10px] font-black uppercase tracking-wider font-mono">
                                {statusText}
                              </div>
                              <div className="text-[11px] font-mono font-bold">
                                {statusValue} Available
                              </div>
                            </div>
                          </div>
                        );
                      })() : (
                        /* Default Gears Unit Rented list */
                        <div className="space-y-1.5 mt-2 flex-grow overflow-y-auto max-h-[80px] no-scrollbar">
                          {matchedOrders.map(order => (
                            <div
                              key={order.id}
                              className="p-1 px-1.5 rounded-lg bg-[#a855f7]/20 border border-[#a855f7]/30 text-white leading-tight"
                              title={`Order: ${order["Order ID"] || order.id} \nClient: ${order["Name"] || "Anonymous"}`}
                            >
                              <p className="text-[9px] font-black uppercase tracking-wider text-[#06b6d4] truncate">
                                {order["Name"] || "Anonymous"}
                              </p>
                              <p className="text-[8px] font-mono text-white/50 truncate">
                                #{order["Order ID"] || order.id}
                              </p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: CONTENT DIRECTORS */}
        {activeTab === "content" && (
          <div className="space-y-16">
            {/* SECTION 1: BLOG STORY PUBLISHER */}
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="bg-afterhours-purple/10 border border-afterhours-purple/20 p-2.5 rounded-xl text-afterhours-purple">
              <FileText size={18} />
            </div>
            <div>
              <h2 className="text-xl font-black uppercase italic text-white">Blog Story Publisher</h2>
              <p className="text-[10px] uppercase tracking-wider text-white/40">Publish new press releases & announcement stories</p>
            </div>
          </div>

          {/* Upload Success Alert - Blog */}
          <AnimatePresence>
            {uploadSuccess && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="bg-afterhours-green/10 border border-afterhours-green/30 text-afterhours-green p-6 rounded-2xl flex items-start gap-4">
                  <CheckCircle className="w-6 h-6 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <h3 className="font-black uppercase tracking-wider text-sm mb-1">Press Release Live!</h3>
                    <p className="text-xs text-white/70 leading-relaxed">
                      Blog post has been safely broadcasted. Cover photo was uploaded to cloud storage and metadata saved to Firestore collection.
                    </p>
                    <button
                      onClick={() => setUploadSuccess(false)}
                      className="text-[10px] font-bold uppercase tracking-widest text-white hover:text-afterhours-green mt-3 flex items-center gap-1.5 transition-colors"
                    >
                      <span>Create Another Post</span>
                      <ArrowRight size={10} />
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Global Error Banner - Blog */}
          {formError && (
            <div className="p-4 bg-red-950/40 border border-red-500/20 rounded-2xl flex items-start gap-3">
              <span className="text-sm">⚠️</span>
              <p className="text-xs font-mono text-rose-300 leading-relaxed">{formError}</p>
            </div>
          )}

          {/* Interactive Form - Blog */}
          <form onSubmit={handleSubmit} className="space-y-8 bg-afterhours-gray/25 border border-white/5 backdrop-blur-md p-8 md:p-10 rounded-3xl">
            <div className="space-y-6">
              
              <div className="space-y-2">
                <label className="text-[10px] uppercase font-bold tracking-[0.25em] text-white/50 block">
                  Article Title <span className="text-afterhours-purple">*</span>
                </label>
                <input
                  id="blog-title-input"
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. After Hours Brings Hyper-Reality VR Lounges"
                  className="w-full bg-black/40 border border-white/10 rounded-2xl px-5 py-4 text-xs text-white placeholder-white/20 focus:outline-none focus:border-afterhours-purple focus:ring-1 focus:ring-afterhours-purple/50 font-semibold transition-all"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] uppercase font-bold tracking-[0.25em] text-white/50 block">
                  Article Content <span className="text-afterhours-purple">*</span>
                </label>
                <div className="relative">
                  <textarea
                    id="blog-content-input"
                    required
                    rows={6}
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Tell the story..."
                    className="w-full bg-black/40 border border-white/10 rounded-2xl px-5 py-4 text-xs text-white placeholder-white/20 focus:outline-none focus:border-afterhours-purple focus:ring-1 focus:ring-afterhours-purple/50 leading-relaxed transition-all resize-y min-h-[140px]"
                  />
                  <div className="absolute right-3 bottom-3 text-[10px] text-white/30 font-mono">
                    {content.length} characters
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] uppercase font-bold tracking-[0.25em] text-white/50 block">
                  Cover Photo Image <span className="text-afterhours-purple">*</span>
                </label>
                
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`relative border-2 border-dashed rounded-3xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
                    isDragActive 
                      ? "border-afterhours-purple bg-afterhours-purple/5 scale-[1.01]" 
                      : "border-white/10 bg-black/30 hover:bg-black/50 hover:border-white/20"
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />

                  {photoPreview ? (
                    <div className="w-full relative" onClick={(e) => e.stopPropagation()}>
                      <img
                        src={photoPreview}
                        alt="Cover Photo Preview"
                        className="max-h-60 w-full object-cover rounded-2xl border border-white/10 my-2"
                      />
                      <div className="absolute top-4 right-4 bg-black/80 hover:bg-black text-white hover:text-afterhours-pink p-2 rounded-full border border-white/10 transition-colors shadow-lg">
                        <button type="button" onClick={removePhoto}>
                          <X size={16} />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3 py-3 pointer-events-none">
                      <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center mx-auto text-white/40">
                        <ImageIcon size={20} />
                      </div>
                      <p className="text-xs text-white/85 font-mono">Drag blog photo here or <span className="text-afterhours-purple font-bold">browse</span></p>
                    </div>
                  )}
                </div>
              </div>

            </div>

            <div className="pt-4 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-6">
              <span className="text-[10px] uppercase text-white/40 font-mono flex items-center gap-1.5">
                <Plus size={12} className="text-afterhours-purple" />
                Visible on blog landing page instantly
              </span>
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full sm:w-auto px-6 py-3.5 bg-gradient-to-r from-afterhours-purple to-afterhours-pink text-white font-black text-xs uppercase tracking-[0.2em] italic rounded-2xl transition-all shadow-[0_4px_15px_rgba(168,85,247,0.2)] hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none max-w-xs cursor-pointer"
              >
                {isSubmitting ? "Publishing story..." : "Publish Press Story ➔"}
              </button>
            </div>
          </form>
        </div>


        {/* TASK 4: SECTION 2: WEBSITE ASSET MANAGER */}
        <div id="website-asset-manager-section" className="space-y-6 pt-8 border-t border-white/5">
          <div className="flex items-center gap-3">
            <div className="bg-afterhours-cyan/10 border border-afterhours-cyan/20 p-2.5 rounded-xl text-afterhours-cyan">
              <FolderKanban size={18} />
            </div>
            <div>
              <h2 className="text-xl font-black uppercase italic text-white">Website Asset Manager</h2>
              <p className="text-[10px] uppercase tracking-wider text-white/40">Upload and categorize photos for rental/combo items dynamically</p>
            </div>
          </div>

          {/* Upload Success Alert - Asset */}
          <AnimatePresence>
            {assetUploadSuccess && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="bg-afterhours-green/10 border border-afterhours-green/30 text-afterhours-green p-6 rounded-2xl flex items-start gap-4">
                  <CheckCircle className="w-6 h-6 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <h3 className="font-black uppercase tracking-wider text-sm mb-1">Asset Registered!</h3>
                    <p className="text-xs text-white/70 leading-relaxed">
                      Photo has been successfully saved in Storage (`website_assets/`) and registered in the Firestore database (`site_images`) under the category **{assetCategory}**.
                    </p>
                    <button
                      onClick={() => setAssetUploadSuccess(false)}
                      className="text-[10px] font-bold uppercase tracking-widest text-white hover:text-afterhours-green mt-3 flex items-center gap-1.5 transition-colors"
                    >
                      <span>Upload Another Photo</span>
                      <ArrowRight size={10} />
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Error Banner - Asset */}
          {assetFormError && (
            <div className="p-4 bg-red-950/40 border border-red-500/20 rounded-2xl flex items-start gap-3">
              <span className="text-sm">⚠️</span>
              <p className="text-xs font-mono text-rose-300 leading-relaxed">{assetFormError}</p>
            </div>
          )}

          {/* Interactive Form - Asset */}
          <form onSubmit={handleAssetSubmit} className="space-y-8 bg-afterhours-gray/25 border border-white/5 backdrop-blur-md p-8 md:p-10 rounded-3xl">
            <div className="space-y-6">
              
              {/* Step 1 & Step 2 Selection Process */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-bold tracking-[0.25em] text-white/50 block">
                    Step 1: Select Category <span className="text-afterhours-cyan">*</span>
                  </label>
                  <select
                    value={assetCategory}
                    onChange={(e) => setAssetCategory(e.target.value as "Combos" | "Individual Gears" | "Add-ons")}
                    className="w-full bg-black/50 border border-white/10 rounded-2xl px-5 py-4 text-xs text-white focus:outline-none focus:border-afterhours-cyan transition-all cursor-pointer font-bold uppercase tracking-wider"
                  >
                    <option value="Combos" className="bg-afterhours-charcoal text-white">Combos</option>
                    <option value="Individual Gears" className="bg-afterhours-charcoal text-white">Individual Gears</option>
                    <option value="Add-ons" className="bg-afterhours-charcoal text-white">Add-ons</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-bold tracking-[0.25em] text-white/50 block">
                    Step 2: Select Specific Product <span className="text-afterhours-cyan">*</span>
                  </label>
                  <select
                    value={selectedAssetId}
                    onChange={(e) => setSelectedAssetId(e.target.value)}
                    className="w-full bg-black/50 border border-white/10 rounded-2xl px-5 py-4 text-xs text-white focus:outline-none focus:border-afterhours-cyan transition-all cursor-pointer font-bold uppercase tracking-wider"
                  >
                    {assetCategory === "Combos" && (
                      <>
                        <option value="combo-theatre" className="bg-afterhours-charcoal text-white">Gaming Theatre</option>
                        <option value="combo-party" className="bg-afterhours-charcoal text-white">Full Party Setup</option>
                        <option value="combo-racing" className="bg-afterhours-charcoal text-white">PS5 Mega Racing Combo</option>
                      </>
                    )}
                    {assetCategory === "Individual Gears" && (
                      <>
                        <option value="hw-ps5" className="bg-afterhours-charcoal text-white">Play Station 5 ( PS5 console)</option>
                        <option value="hw-speaker" className="bg-afterhours-charcoal text-white">JBL Party Speaker</option>
                        <option value="hw-projector" className="bg-afterhours-charcoal text-white">Full HD Projector</option>
                        <option value="hw-vr2" className="bg-afterhours-charcoal text-white">Sony PlayStation VR2</option>
                        <option value="hw-wheel" className="bg-afterhours-charcoal text-white">Logitech G29 Racing Wheel</option>
                      </>
                    )}
                    {assetCategory === "Add-ons" && (
                      <>
                        <option value="Extra Controller" className="bg-afterhours-charcoal text-white">Extra Controller</option>
                        <option value="Meta Shots Bat" className="bg-afterhours-charcoal text-white">Meta Shots Bat</option>
                        <option value="Premium Games" className="bg-afterhours-charcoal text-white">Premium Games</option>
                        <option value="Projector Screen" className="bg-afterhours-charcoal text-white">Projector Screen</option>
                        <option value="Heavy Duty Tripod" className="bg-afterhours-charcoal text-white">Heavy Duty Tripod</option>
                        <option value="Wireless Mic" className="bg-afterhours-charcoal text-white">Wireless Mic</option>
                      </>
                    )}
                  </select>
                </div>
              </div>

              {/* Drag & Drop Upload Block or Addons Inputs */}
              {assetCategory === "Add-ons" ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Photo Zone */}
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase font-bold tracking-[0.25em] text-white/50 block">
                      Preview Photo <span className="text-afterhours-cyan">*</span>
                    </label>
                    <div
                      onClick={() => addonPhotoInputRef.current?.click()}
                      className="border border-dashed border-white/10 rounded-3xl p-6 flex flex-col items-center justify-center text-center cursor-pointer bg-black/30 hover:bg-black/50 hover:border-white/20 transition-all min-h-[160px]"
                    >
                      <input
                        ref={addonPhotoInputRef}
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            const file = e.target.files[0];
                            setAddonPhoto(file);
                            const reader = new FileReader();
                            reader.onloadend = () => {
                              setAddonPhotoPreview(reader.result as string);
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                        className="hidden"
                      />
                      {addonPhotoPreview ? (
                        <div className="w-full relative" onClick={(e) => e.stopPropagation()}>
                          <img
                            src={addonPhotoPreview}
                            alt="Addon Photo Preview"
                            className="max-h-32 object-contain rounded-xl mx-auto"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              setAddonPhoto(null);
                              setAddonPhotoPreview(null);
                              if (addonPhotoInputRef.current) addonPhotoInputRef.current.value = "";
                            }}
                            className="absolute top-1 right-1 bg-black/80 hover:bg-black text-rose-400 p-1.5 rounded-full border border-white/10 transition-colors"
                          >
                            <X size={12} />
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-2 text-white/50 font-mono text-xs">
                          <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center mx-auto text-white/40">
                            <ImageIcon size={16} />
                          </div>
                          <span>Upload Photo</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Video Zone */}
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase font-bold tracking-[0.25em] text-white/50 block">
                      Preview Video (mp4 only)
                    </label>
                    <div
                      onClick={() => addonVideoInputRef.current?.click()}
                      className="border border-dashed border-white/10 rounded-3xl p-6 flex flex-col items-center justify-center text-center cursor-pointer bg-black/30 hover:bg-black/50 hover:border-white/20 transition-all min-h-[160px]"
                    >
                      <input
                        ref={addonVideoInputRef}
                        type="file"
                        accept="video/mp4"
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            const file = e.target.files[0];
                            setAddonVideo(file);
                            setAddonVideoPreview(URL.createObjectURL(file));
                          }
                        }}
                        className="hidden"
                      />
                      {addonVideoPreview ? (
                        <div className="w-full relative" onClick={(e) => e.stopPropagation()}>
                          <video
                            src={addonVideoPreview}
                            className="max-h-32 object-contain rounded-xl mx-auto"
                            controls
                            muted
                          />
                          <button
                            type="button"
                            onClick={() => {
                              setAddonVideo(null);
                              setAddonVideoPreview(null);
                              if (addonVideoInputRef.current) addonVideoInputRef.current.value = "";
                            }}
                            className="absolute top-1 right-1 bg-black/80 hover:bg-black text-rose-400 p-1.5 rounded-full border border-white/10 transition-colors"
                          >
                            <X size={12} />
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-2 text-white/50 font-mono text-xs">
                          <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center mx-auto text-white/40">
                            <Play size={16} />
                          </div>
                          <span>Upload Video (.mp4)</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-bold tracking-[0.25em] text-white/50 block">
                    Upload Asset Photo <span className="text-afterhours-cyan">*</span>
                  </label>
                  
                  <div
                    onDragOver={handleAssetDragOver}
                    onDragLeave={handleAssetDragLeave}
                    onDrop={handleAssetDrop}
                    onClick={() => assetFileInputRef.current?.click()}
                    className={`relative border-2 border-dashed rounded-3xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
                      assetDragActive 
                        ? "border-afterhours-cyan bg-afterhours-cyan/5 scale-[1.01]" 
                        : "border-white/10 bg-black/30 hover:bg-black/50 hover:border-white/20"
                    }`}
                  >
                    <input
                      ref={assetFileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleAssetFileChange}
                      multiple
                      className="hidden"
                    />

                    {assetPhotoPreviews.length > 0 ? (
                      <div className="w-full relative space-y-4" onClick={(e) => e.stopPropagation()}>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 my-2">
                          {assetPhotoPreviews.map((preview, i) => (
                            <div key={i} className="relative aspect-video rounded-xl overflow-hidden border border-white/10 group bg-black/60">
                              <img
                                src={preview}
                                alt={`Asset Preview ${i + 1}`}
                                className="w-full h-full object-cover"
                              />
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setAssetPhotos(prev => prev.filter((_, idx) => idx !== i));
                                    setAssetPhotoPreviews(prev => prev.filter((_, idx) => idx !== i));
                                  }}
                                  className="bg-black/85 hover:bg-black text-rose-500 p-1.5 rounded-full border border-white/10 transition-colors shadow-lg"
                                >
                                  <X size={14} />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                        <div className="text-[10px] font-mono text-white/40 flex items-center justify-center gap-1">
                          <Plus size={10} /> Click outer box to add more files
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3 py-3 pointer-events-none">
                        <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center mx-auto text-white/40">
                          <ImageIcon size={20} />
                        </div>
                        <p className="text-xs text-white/85 font-mono">Drag asset photo(s) here or <span className="text-afterhours-cyan font-bold">browse</span></p>
                      </div>
                    )}
                  </div>
                </div>
              )}

            </div>

            <div className="pt-4 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-6">
              <span className="text-[10px] uppercase text-white/40 font-mono flex items-center gap-1.5">
                <Plus size={12} className="text-afterhours-cyan" />
                Will be registered in Firestore `site_images`
              </span>
              <button
                type="submit"
                disabled={isAssetSubmitting}
                className="w-full sm:w-auto px-6 py-3.5 bg-gradient-to-r from-afterhours-cyan to-afterhours-purple text-black font-black text-xs uppercase tracking-[0.2em] italic rounded-2xl transition-all shadow-[0_4px_15px_rgba(34,211,238,0.2)] hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none max-w-xs cursor-pointer"
              >
                {isAssetSubmitting ? "Uploading asset photo..." : "Upload Site Asset Image ➔"}
              </button>
            </div>
          </form>
        </div>

        {/* SECTION 3: HOMEPAGE SLIDER MANAGER */}
        <div id="homepage-slider-manager-section" className="space-y-6 pt-8 border-t border-white/5">
          <div className="flex items-center gap-3">
            <div className="bg-afterhours-pink/10 border border-afterhours-pink/20 p-2.5 rounded-xl text-afterhours-pink">
              <Sliders size={18} />
            </div>
            <div>
              <h2 className="text-xl font-black uppercase italic text-white">Homepage Slider Manager</h2>
              <p className="text-[10px] uppercase tracking-wider text-white/40">Upload and remove full-screen images currently active in the homepage hero rotation</p>
            </div>
          </div>

          {/* Upload Success Alert - Slide */}
          <AnimatePresence>
            {slideUploadSuccess && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="bg-afterhours-green/10 border border-afterhours-green/30 text-afterhours-green p-6 rounded-2xl flex items-start gap-4">
                  <CheckCircle className="w-6 h-6 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <h3 className="font-black uppercase tracking-wider text-sm mb-1">Slide Image Safe!</h3>
                    <p className="text-xs text-white/70 leading-relaxed">
                      Slide has been successfully saved to Storage (`homepage_slides/`) and registered in the Firestore database (`homepage_slides`). The home page will rotate into this slide automatically in real-time.
                    </p>
                    <button
                      onClick={() => setSlideUploadSuccess(false)}
                      className="text-[10px] font-bold uppercase tracking-widest text-white hover:text-afterhours-green mt-3 flex items-center gap-1.5 transition-colors"
                    >
                      <span>Upload Another Slide</span>
                      <ArrowRight size={10} />
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Error Banner - Slide */}
          {slideFormError && (
            <div className="p-4 bg-red-950/40 border border-red-500/20 rounded-2xl flex items-start gap-3">
              <span className="text-sm">⚠️</span>
              <p className="text-xs font-mono text-rose-300 leading-relaxed">{slideFormError}</p>
            </div>
          )}

          {/* Upload Form - Slide */}
          <form onSubmit={handleSlideSubmit} className="space-y-8 bg-afterhours-gray/25 border border-white/5 backdrop-blur-md p-8 md:p-10 rounded-3xl">
            <div className="space-y-6">
              {/* Drag & Drop Upload Block */}
              <div className="space-y-2">
                <label className="text-[10px] uppercase font-bold tracking-[0.25em] text-white/50 block">
                  Select Slide Frame Image <span className="text-afterhours-pink">*</span>
                </label>
                
                <div
                  onDragOver={handleSlideDragOver}
                  onDragLeave={handleSlideDragLeave}
                  onDrop={handleSlideDrop}
                  onClick={() => slideFileInputRef.current?.click()}
                  className={`relative border-2 border-dashed rounded-3xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
                    slideDragActive 
                      ? "border-afterhours-pink bg-afterhours-pink/5 scale-[1.01]" 
                      : "border-white/10 bg-black/30 hover:bg-black/50 hover:border-white/20"
                  }`}
                >
                  <input
                    ref={slideFileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleSlideFileChange}
                    className="hidden"
                  />

                  {slidePhotoPreview ? (
                    <div className="w-full relative" onClick={(e) => e.stopPropagation()}>
                      <img
                        src={slidePhotoPreview}
                        alt="Slide Preview"
                        className="max-h-60 w-full object-cover rounded-2xl border border-white/10 my-2"
                      />
                      <div className="absolute top-4 right-4 bg-black/80 hover:bg-black text-white hover:text-afterhours-pink p-2 rounded-full border border-white/10 transition-colors shadow-lg">
                        <button type="button" onClick={removeSlidePhoto}>
                          <X size={16} />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3 py-3 pointer-events-none">
                      <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center mx-auto text-white/40">
                        <UploadCloud size={20} />
                      </div>
                      <p className="text-xs text-white/85 font-mono">Drag slide image here or <span className="text-afterhours-pink font-bold">browse files</span></p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-6">
              <span className="text-[10px] uppercase text-white/40 font-mono flex items-center gap-1.5">
                <Plus size={12} className="text-afterhours-pink" />
                Saves to Firebase Storage path `homepage_slides/`
              </span>
              <button
                type="submit"
                disabled={isSlideSubmitting}
                className="w-full sm:w-auto px-6 py-3.5 bg-gradient-to-r from-afterhours-pink to-afterhours-purple text-white font-black text-xs uppercase tracking-[0.2em] italic rounded-2xl transition-all shadow-[0_4px_15px_rgba(236,72,153,0.2)] hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none max-w-xs cursor-pointer"
              >
                {isSlideSubmitting ? "Uploading slide file..." : "Add Homepage Slide ➔"}
              </button>
            </div>
          </form>

          {/* Slides Grid Display */}
          <div className="space-y-4 pt-6">
            <h3 className="text-xs uppercase font-bold tracking-[0.25em] text-white/60">Active Slide Rotation Grid ({activeSlides.length})</h3>
            
            {activeSlides.length === 0 ? (
              <div className="text-center py-10 bg-neutral-900/40 rounded-3xl border border-white/5">
                <p className="text-xs text-white/30 font-mono">No custom slides uploaded. Currently rotating default placeholder images.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                {activeSlides.map((slide) => (
                  <div key={slide.id} className="group relative rounded-2xl overflow-hidden border border-white/5 bg-neutral-900 text-left flex flex-col justify-between">
                    <div className="aspect-[16/10] relative w-full overflow-hidden bg-black/40">
                      <img src={slide.url} alt="Active Slide" className="w-full h-full object-cover group-hover:scale-105 transition-all duration-300" />
                    </div>
                    
                    <div className="p-4 flex items-center justify-between bg-black/20">
                      <span className="text-[8px] font-mono uppercase tracking-wider text-white/30 truncate max-w-[150px]">
                        ID: {slide.id}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleDeleteSlide(slide)}
                        disabled={deletingSlideId === slide.id}
                        className="px-3 py-1.5 rounded-lg bg-red-950/20 border border-red-500/10 hover:border-red-500/35 text-red-400 hover:text-red-300 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 cursor-pointer transition-all disabled:opacity-55"
                      >
                        {deletingSlideId === slide.id ? (
                          <>
                            <Loader2 size={10} className="animate-spin" />
                            <span>Deleting...</span>
                          </>
                        ) : (
                          <>
                            <Trash2 size={10} />
                            <span>Remove</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* SECTION 4: PREMIUM GAMES MANAGER */}
        <div id="premium-games-manager-section" className="space-y-6 pt-8 border-t border-white/5">
          <div className="flex items-center gap-3">
            <div className="bg-afterhours-purple/10 border border-afterhours-purple/20 p-2.5 rounded-xl text-afterhours-purple">
              <Gamepad2 size={18} />
            </div>
            <div>
              <h2 className="text-xl font-black uppercase italic text-white">Premium Games Manager</h2>
              <p className="text-[10px] uppercase tracking-wider text-white/40">Add and remove premium titles available for high-speed PS5 Deluxe bundles</p>
            </div>
          </div>

          {/* Upload Success Alert - Game */}
          <AnimatePresence>
            {gameUploadSuccess && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="bg-afterhours-green/10 border border-afterhours-green/30 text-afterhours-green p-6 rounded-2xl flex items-start gap-4">
                  <CheckCircle className="w-6 h-6 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <h3 className="font-black uppercase tracking-wider text-sm mb-1">Premium Game Registered!</h3>
                    <p className="text-xs text-white/70 leading-relaxed">
                      Your premium title was successfully saved and is live. Customers will see it instantly in the high-fidelity PS5 setups Addon drawer.
                    </p>
                    <button
                      onClick={() => setGameUploadSuccess(false)}
                      className="text-[10px] font-bold uppercase tracking-widest text-white hover:text-afterhours-green mt-3 flex items-center gap-1.5 transition-colors"
                    >
                      <span>Upload Another Premium Title</span>
                      <ArrowRight size={10} />
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Error Banner - Game */}
          {gameFormError && (
            <div className="p-4 bg-red-950/40 border border-red-500/20 rounded-2xl flex items-start gap-3">
              <span className="text-sm">⚠️</span>
              <p className="text-xs font-mono text-rose-300 leading-relaxed">{gameFormError}</p>
            </div>
          )}

          {/* Upload Form - Game */}
          <form onSubmit={handleGameSubmit} className="space-y-8 bg-afterhours-gray/25 border border-white/5 backdrop-blur-md p-8 md:p-10 rounded-3xl">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-bold tracking-[0.25em] text-white/50 block">Game Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Marvel's Spider-Man 2"
                    value={gameTitle}
                    onChange={(e) => setGameTitle(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-2xl px-6 py-4 text-xs font-bold text-white focus:outline-none focus:border-afterhours-purple transition-all"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-bold tracking-[0.25em] text-white/50 block">PS Store Link</label>
                  <input
                    type="url"
                    required
                    placeholder="https://store.playstation.com/..."
                    value={gameLink}
                    onChange={(e) => setGameLink(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-2xl px-6 py-4 text-xs font-mono text-white/80 focus:outline-none focus:border-afterhours-purple transition-all"
                  />
                </div>
              </div>

              {/* Drag & Drop Upload Block for Game Cover */}
              <div className="space-y-2">
                <label className="text-[10px] uppercase font-bold tracking-[0.25em] text-white/50 block">Cover Image File</label>
                
                <div
                  onDragOver={handleGameDragOver}
                  onDragLeave={handleGameDragLeave}
                  onDrop={handleGameDrop}
                  onClick={() => gameFileInputRef.current?.click()}
                  className={`relative border-2 border-dashed rounded-3xl p-6 flex flex-col items-center justify-center text-center cursor-pointer min-h-[200px] transition-all ${
                    gameDragActive 
                      ? "border-afterhours-purple bg-afterhours-purple/5 scale-[1.01]" 
                      : "border-white/10 bg-black/30 hover:bg-black/50 hover:border-white/20"
                  }`}
                >
                  <input
                    ref={gameFileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleGameFileChange}
                    className="hidden"
                  />

                  {gameCoverPreview ? (
                    <div className="w-full relative" onClick={(e) => e.stopPropagation()}>
                      <img
                        src={gameCoverPreview}
                        alt="Game Cover Preview"
                        className="max-h-40 object-contain mx-auto rounded-xl border border-white/10"
                      />
                      <div className="absolute -top-2 -right-2 bg-black/80 hover:bg-black text-white hover:text-afterhours-pink p-2 rounded-full border border-white/10 transition-colors shadow-lg">
                        <button type="button" onClick={removeGameCover}>
                          <X size={12} />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3 py-3 pointer-events-none">
                      <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center mx-auto text-white/40">
                        <UploadCloud size={20} />
                      </div>
                      <p className="text-xs text-white/85 font-mono">Drag cover image or <span className="text-afterhours-purple font-bold">browse</span></p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-6">
              <span className="text-[10px] uppercase text-white/40 font-mono flex items-center gap-1.5">
                <Plus size={12} className="text-afterhours-purple" />
                Saves to Firebase Storage path `game_covers/`
              </span>
              <button
                type="submit"
                disabled={isGameSubmitting}
                className="w-full sm:w-auto px-6 py-3.5 bg-gradient-to-r from-afterhours-purple to-afterhours-pink text-white font-black text-xs uppercase tracking-[0.2em] italic rounded-2xl transition-all shadow-[0_4px_15px_rgba(236,72,153,0.2)] hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none max-w-xs cursor-pointer"
              >
                {isGameSubmitting ? "Uploading title cover..." : "Add Premium Game ➔"}
              </button>
            </div>
          </form>

          {/* Premium Games Grid Display */}
          <div className="space-y-4 pt-6">
            <h3 className="text-xs uppercase font-bold tracking-[0.25em] text-white/60 font-black">Active Premium Game Library ({premiumGames.length})</h3>
            
            {premiumGames.length === 0 ? (
              <div className="text-center py-10 bg-neutral-900/40 rounded-3xl border border-white/5">
                <p className="text-xs text-white/30 font-mono">No custom premium games uploaded yet.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
                {premiumGames.map((game) => (
                  <div key={game.id} className="group relative rounded-2xl overflow-hidden border border-white/5 bg-neutral-900/50 p-4 text-left flex flex-col justify-between hover:border-white/10 transition-all">
                    <div className="aspect-[3/4] relative w-full overflow-hidden bg-black/40 rounded-xl mb-4 group-hover:scale-[1.02] transition-transform duration-300">
                      <img src={game.coverUrl} alt={game.title} className="w-full h-full object-cover" />
                    </div>
                    
                    <div className="space-y-3">
                      <h4 className="text-xs font-black uppercase tracking-wider text-white line-clamp-1 truncate">{game.title}</h4>
                      <a
                        href={game.link}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[9px] text-afterhours-purple hover:underline font-mono truncate block"
                      >
                        PS Store Link ➔
                      </a>
                      
                      <button
                        type="button"
                        onClick={() => handleDeleteGame(game)}
                        disabled={deletingGameId === game.id}
                        className="w-full py-2 rounded-xl bg-red-950/20 border border-red-500/10 hover:border-red-500/35 text-red-400 hover:text-red-300 text-[9px] font-bold uppercase tracking-wider flex items-center justify-center gap-1 cursor-pointer transition-all disabled:opacity-55"
                      >
                        {deletingGameId === game.id ? (
                          <>
                            <Loader2 size={10} className="animate-spin" />
                            <span>Removing...</span>
                          </>
                        ) : (
                          <>
                            <Trash2 size={10} />
                            <span>Delete Title</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>


        {/* TASK 4: SECTION 5: GEAR MEDIA MANAGER */}
        <div id="gear-media-manager-section" className="space-y-6 pt-8 border-t border-white/5 font-sans">
          <div className="flex items-center gap-3">
            <div className="bg-afterhours-purple/10 border border-afterhours-purple/20 p-2.5 rounded-xl text-afterhours-purple">
              <Gamepad2 size={18} />
            </div>
            <div>
              <h2 className="text-xl font-black uppercase italic text-white">Gear Media Manager</h2>
              <p className="text-[10px] uppercase tracking-wider text-white/40">Upload and configure premium photo or video background assets for Individual Gears</p>
            </div>
          </div>

          {/* Upload Success Alert - Gear */}
          <AnimatePresence>
            {gearUploadSuccess && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="bg-afterhours-green/10 border border-afterhours-green/30 text-afterhours-green p-6 rounded-2xl flex items-start gap-4">
                  <CheckCircle className="w-6 h-6 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <h3 className="font-black uppercase tracking-wider text-sm mb-1">Gear Media Activated!</h3>
                    <p className="text-xs text-white/70 leading-relaxed">
                      Your media asset has been uploaded and linked dynamically. Customers on the /rentals page will immediately see this new image/video for this gear.
                    </p>
                    <button
                      onClick={() => setGearUploadSuccess(false)}
                      className="text-[10px] font-bold uppercase tracking-widest text-white hover:text-afterhours-green mt-3 flex items-center gap-1.5 transition-colors"
                    >
                      <span>Upload More Media</span>
                      <ArrowRight size={10} />
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Error Banner - Gear */}
          {gearFormError && (
            <div className="p-4 bg-red-950/40 border border-red-500/20 rounded-2xl flex items-start gap-3">
              <span className="text-sm">⚠️</span>
              <p className="text-xs font-mono text-rose-300 leading-relaxed">{gearFormError}</p>
            </div>
          )}

          {/* Interactive Form - Gear */}
          <form onSubmit={handleGearSubmit} className="space-y-8 bg-afterhours-gray/25 border border-white/5 backdrop-blur-md p-8 md:p-10 rounded-3xl text-left">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-6">
                
                {/* Gear Selector */}
                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-bold tracking-[0.25em] text-white/50 block">Select Individual Gear</label>
                  <select
                    value={selectedGearId}
                    onChange={(e) => setSelectedGearId(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-2xl px-6 py-4 text-xs font-bold text-white focus:outline-none focus:border-afterhours-purple transition-all animate-none"
                  >
                    {ADMIN_GEARS.map((gear) => (
                      <option key={gear.id} value={gear.id} className="bg-[#121214] text-white">
                        {gear.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-bold tracking-[0.25em] text-white/50 block">Detected File Type</label>
                  <div className="flex gap-4">
                    <button
                      type="button"
                      onClick={() => setGearMediaType("image")}
                      className={`flex-1 py-3 rounded-xl border text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                        gearMediaType === "image"
                          ? "bg-afterhours-purple/15 border-afterhours-purple text-afterhours-purple"
                          : "border-white/5 bg-black/20 text-white/40 hover:text-white"
                      }`}
                    >
                      🖼️ Image / Photo
                    </button>
                    <button
                      type="button"
                      onClick={() => setGearMediaType("video")}
                      className={`flex-1 py-3 rounded-xl border text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                        gearMediaType === "video"
                          ? "bg-afterhours-purple/15 border-afterhours-purple text-afterhours-purple"
                          : "border-white/5 bg-black/20 text-white/40 hover:text-white"
                      }`}
                    >
                      🎬 Video Clip
                    </button>
                  </div>
                </div>
              </div>

              {/* Drag & Drop Upload for Gear Media */}
              <div className="space-y-2">
                <label className="text-[10px] uppercase font-bold tracking-[0.25em] text-white/50 block">Upload Media File (Photo/Video)</label>
                
                <div
                  onDragOver={handleGearDragOver}
                  onDragLeave={handleGearDragLeave}
                  onDrop={handleGearDrop}
                  onClick={() => gearFileInputRef.current?.click()}
                  className={`relative border-2 border-dashed rounded-3xl p-6 flex flex-col items-center justify-center text-center cursor-pointer min-h-[200px] transition-all ${
                    gearDragActive 
                      ? "border-afterhours-purple bg-afterhours-purple/5 scale-[1.01]" 
                      : "border-white/10 bg-black/30 hover:bg-black/50 hover:border-white/20"
                  }`}
                >
                  <input
                    ref={gearFileInputRef}
                    type="file"
                    accept="image/*,video/*"
                    onChange={handleGearFileChange}
                    className="hidden"
                  />

                  {gearMediaPreview ? (
                    <div className="w-full relative" onClick={(e) => e.stopPropagation()}>
                      {gearMediaType === "video" ? (
                        <video
                          src={gearMediaPreview}
                          controls
                          className="max-h-40 object-contain mx-auto rounded-xl border border-white/10"
                        />
                      ) : (
                        <img
                          src={gearMediaPreview}
                          alt="Gear Media Preview"
                          className="max-h-40 object-contain mx-auto rounded-xl border border-white/10"
                        />
                      )}
                      <div className="absolute -top-2 -right-2 bg-black/80 hover:bg-black text-white hover:text-afterhours-pink p-2 rounded-full border border-white/10 transition-colors shadow-lg">
                        <button type="button" onClick={removeGearMedia}>
                          <X size={12} />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3 py-3 pointer-events-none">
                      <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center mx-auto text-white/40">
                        <UploadCloud size={20} />
                      </div>
                      <p className="text-xs text-white/85 font-mono">Drag photo/video or <span className="text-afterhours-purple font-bold">browse</span></p>
                      <p className="text-[9px] text-white/40 uppercase font-mono">Image or MP4 supported</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-6">
              <span className="text-[10px] uppercase text-white/40 font-mono flex items-center gap-1.5 flex-wrap">
                <Plus size={12} className="text-afterhours-purple" />
                Saves dynamically into the `gear_catalog` Firestore doc collection
              </span>
              <button
                type="submit"
                disabled={isGearSubmitting}
                className="w-full sm:w-auto px-6 py-3.5 bg-gradient-to-r from-afterhours-purple to-afterhours-pink text-white font-black text-xs uppercase tracking-[0.2em] italic rounded-2xl transition-all shadow-[0_4px_15px_rgba(236,72,153,0.2)] hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none max-w-xs cursor-pointer"
              >
                {isGearSubmitting ? "Activating gear media..." : "Update Gear Media ➔"}
              </button>
            </div>
          </form>

          {/* Active Gear Catalog Grid Display */}
          <div className="space-y-4 pt-6">
            <h3 className="text-xs uppercase font-bold tracking-[0.25em] text-white/60 font-black">Active Dynamic Gear Media ({gearCatalogList.length})</h3>
            
            {gearCatalogList.length === 0 ? (
              <div className="text-center py-10 bg-neutral-900/40 rounded-3xl border border-white/5">
                <p className="text-xs text-white/30 font-mono">No dynamic gear media uploaded yet. Default SVG icons will render.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6 text-left">
                {gearCatalogList.map((gear) => (
                  <div key={gear.id} className="group relative rounded-2xl overflow-hidden border border-white/5 bg-neutral-900/50 p-4 text-left flex flex-col justify-between hover:border-white/10 transition-all">
                    <div className="aspect-square relative w-full overflow-hidden bg-black/40 rounded-xl mb-4 group-hover:scale-[1.02] transition-transform duration-300 flex items-center justify-center">
                      {gear.mediaType === "video" ? (
                        <video src={gear.mediaUrl} className="w-full h-full object-cover rounded-lg" muted autoPlay loop playsInline />
                      ) : (
                        <img src={gear.mediaUrl} alt={gear.gearName} className="w-full h-full object-cover rounded-lg" referrerPolicy="no-referrer" />
                      )}
                    </div>
                    
                    <div className="space-y-3">
                      <h4 className="text-[10px] font-black uppercase tracking-wider text-white line-clamp-1 truncate">{gear.gearName}</h4>
                      <p className="text-[9px] text-[#90e0d0] font-mono uppercase font-bold">{gear.mediaType === "video" ? "🎬 Video" : "🖼️ Image"}</p>
                      
                      <button
                        type="button"
                        onClick={() => handleDeleteGearMedia(gear)}
                        disabled={deletingGearMediaId === gear.id}
                        className="w-full py-2 rounded-xl bg-red-950/20 border border-red-500/10 hover:border-red-500/35 text-red-400 hover:text-red-300 text-[9px] font-bold uppercase tracking-wider flex items-center justify-center gap-1 cursor-pointer transition-all disabled:opacity-55"
                      >
                        {deletingGearMediaId === gear.id ? (
                          <>
                            <Loader2 size={10} className="animate-spin" />
                            <span>Resetting...</span>
                          </>
                        ) : (
                          <>
                            <Trash2 size={10} />
                            <span>Reset to Default</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
          </div>
        )}

        {/* TAB 4: DECOUPLED INVENTORY MASTER VAULT */}
        {activeTab === "vault" && (
          <div className="space-y-12 animate-fadeIn">
            {/* Header / Intro */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 border-b border-white/5 pb-6">
              <div className="flex items-center gap-3">
                <div className="bg-afterhours-cyan/10 border border-afterhours-cyan/25 p-2.5 rounded-xl text-afterhours-cyan">
                  <Sliders size={18} />
                </div>
                <div>
                  <h2 className="text-xl font-black uppercase italic text-white font-mono tracking-tight">Decoupled Inventory Master Vault</h2>
                  <p className="text-[10px] uppercase tracking-wider text-white/40 font-mono">
                    Manage Master Categories and individual sub-units dynamically.
                  </p>
                </div>
              </div>
              <button
                onClick={handleBootstrapVault}
                className="px-4 py-2 bg-gradient-to-r from-afterhours-cyan to-afterhours-purple text-black text-[10px] font-black uppercase tracking-wider rounded-xl hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer shadow-[0_0_15px_rgba(34,211,238,0.2)]"
              >
                ⚡ Seed Default Vault Preset
              </button>
            </div>

            {/* Quick Category Form */}
            <div className="bg-gradient-to-r from-neutral-900 via-[#121215] to-[#0a0a0c] border border-white/5 rounded-3xl p-6 shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 h-40 w-40 bg-afterhours-cyan/5 blur-3xl rounded-full pointer-events-none" />
              <h3 className="text-xs uppercase font-black tracking-widest text-[#90e0d0] font-mono mb-4">
                Step 1: Create Master Product Category
              </h3>
              
              <form onSubmit={handleCreateCategory} className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                <div className="md:col-span-5">
                  <label className="text-[8px] font-bold text-white/40 uppercase tracking-widest font-mono block mb-1.5">
                    Category Name
                  </label>
                  <input
                    type="text"
                    value={newCatName}
                    onChange={(e) => setNewCatName(e.target.value)}
                    placeholder="e.g., PS5 Console, Wireless Mic, Projector Screen"
                    className="w-full bg-[#121215]/80 border border-white/10 rounded-xl px-4 py-2.5 text-xs font-mono font-bold text-white placeholder-white/20 focus:border-afterhours-cyan focus:outline-none"
                  />
                </div>

                <div className="md:col-span-4">
                  <label className="text-[8px] font-bold text-white/40 uppercase tracking-widest font-mono block mb-1.5">
                    Inventory Stream
                  </label>
                  <div className="grid grid-cols-2 gap-2 bg-[#121215]/80 p-1.5 rounded-xl border border-white/10">
                    <button
                      type="button"
                      onClick={() => setNewCatType("gear")}
                      className={`py-1.5 text-[9px] font-black uppercase tracking-wider rounded-lg transition-all ${
                        newCatType === "gear"
                          ? "bg-afterhours-cyan text-black"
                          : "text-white/40 hover:text-white"
                      }`}
                    >
                      Base Gear
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewCatType("addon")}
                      className={`py-1.5 text-[9px] font-black uppercase tracking-wider rounded-lg transition-all ${
                        newCatType === "addon"
                          ? "bg-afterhours-purple text-white"
                          : "text-white/40 hover:text-white"
                      }`}
                    >
                      Modular Add-on
                    </button>
                  </div>
                </div>

                <div className="md:col-span-3">
                  <button
                    type="submit"
                    className="w-full py-2.5 bg-white text-black text-[10px] font-black uppercase tracking-[0.1em] rounded-xl hover:bg-afterhours-cyan hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer font-bold"
                  >
                    + Register Category
                  </button>
                </div>
              </form>
            </div>

            {/* Step 2: Main categories and units management */}
            <div className="space-y-8">
              <div className="flex items-center justify-between border-b border-white/5 pb-2">
                <h3 className="text-xs uppercase font-black tracking-widest text-white/50 font-mono">
                  Step 2: Define Custom Stock Sub-units / Serial SKUs ({categoriesList.length} Categories Registered)
                </h3>
              </div>

              {categoriesList.length === 0 ? (
                <div className="text-center py-16 bg-[#121215]/40 rounded-3xl border border-dashed border-white/5">
                  <p className="text-xs text-white/30 font-mono uppercase tracking-wider">
                    The Master inventory vault is empty. Click "Seed Default Vault Preset" to fill your assets instantly!
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Gears Section */}
                  <div className="space-y-6">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-[#90e0d0] font-mono flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-afterhours-cyan" />
                      Gears Stock Stream
                    </h4>

                    <div className="space-y-4">
                      {categoriesList.filter(c => c.type === "gear").map(cat => {
                        const unitsSnapshot = unitsMap[cat.id] || [];
                        return (
                          <div key={cat.id} className="bg-neutral-950/60 border border-white/5 p-5 rounded-2xl relative space-y-4 hover:border-white/10 transition-all">
                            {/* Category Header */}
                            <div className="flex items-center justify-between">
                              <div className="space-y-1">
                                <span className="text-xs font-black uppercase tracking-wider text-white">
                                  {cat.name}
                                </span>
                                <span className="block text-[8px] font-mono text-afterhours-cyan uppercase font-bold tracking-tight">
                                  Base Asset • {unitsSnapshot.length} Units in Vault
                                </span>
                              </div>
                              <button
                                onClick={() => handleDeleteCategory(cat.id, cat.name)}
                                className="p-1.5 rounded-lg bg-red-950/10 border border-red-500/10 text-red-400 hover:bg-red-950/20 hover:border-red-500/40 transition-all cursor-pointer"
                                title="Delete Category"
                              >
                                <Trash2 size={11} />
                              </button>
                            </div>

                            {/* Units Pill Grid */}
                            <div className="flex flex-wrap gap-2 pt-2">
                              {unitsSnapshot.length === 0 ? (
                                <span className="text-[9px] text-white/20 italic uppercase font-mono tracking-wider py-1 pl-1">
                                  No Stock Units registered
                                </span>
                              ) : (
                                unitsSnapshot.map(unit => (
                                  <div
                                    key={unit.id}
                                    className="px-2.5 py-1.5 rounded-xl bg-white/5 border border-white/10 flex items-center gap-2 text-[10px] font-mono font-bold text-white/80"
                                  >
                                    <span>{unit.name}</span>
                                    <button
                                      onClick={() => handleDeleteUnit(cat.id, unit.id)}
                                      className="text-white/30 hover:text-red-400 transition-colors"
                                    >
                                      &times;
                                    </button>
                                  </div>
                                ))
                              )}
                            </div>

                            {/* Inline Creator Input */}
                            <div className="flex gap-2 border-t border-white/5 pt-4">
                              <input
                                type="text"
                                placeholder="e.g. Unit A, Serial #12"
                                value={newUnitNames[cat.id] || ""}
                                onChange={(e) => setNewUnitNames(prev => ({ ...prev, [cat.id]: e.target.value }))}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") {
                                    handleAddUnitToCategory(cat.id);
                                  }
                                }}
                                className="flex-grow bg-black/40 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white placeholder-white/20 font-mono font-bold"
                              />
                              <button
                                onClick={() => handleAddUnitToCategory(cat.id)}
                                className="px-3 py-1.5 bg-afterhours-cyan text-black font-black uppercase text-[9px] rounded-xl tracking-wider cursor-pointer"
                              >
                                + Add Unit
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Addons Section */}
                  <div className="space-y-6">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-[#a855f7] font-mono flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-afterhours-purple animate-pulse" />
                      Add-ons Material Stream
                    </h4>

                    <div className="space-y-4">
                      {categoriesList.filter(c => c.type === "addon").map(cat => {
                        const unitsSnapshot = unitsMap[cat.id] || [];
                        return (
                          <div key={cat.id} className="bg-neutral-950/60 border border-white/5 p-5 rounded-2xl relative space-y-4 hover:border-white/10 transition-all">
                            {/* Category Header */}
                            <div className="flex items-center justify-between">
                              <div className="space-y-1">
                                <span className="text-xs font-black uppercase tracking-wider text-white">
                                  {cat.name}
                                </span>
                                <span className="block text-[8px] font-mono text-[#a855f7] uppercase font-bold tracking-tight">
                                  Modular Accessory • {unitsSnapshot.length} Units in Stock
                                </span>
                              </div>
                              <button
                                onClick={() => handleDeleteCategory(cat.id, cat.name)}
                                className="p-1.5 rounded-lg bg-red-950/10 border border-red-500/10 text-red-400 hover:bg-red-950/20 hover:border-red-500/40 transition-all cursor-pointer"
                                title="Delete Category"
                              >
                                <Trash2 size={11} />
                              </button>
                            </div>

                            {/* Units Pill Grid */}
                            <div className="flex flex-wrap gap-2 pt-2">
                              {unitsSnapshot.length === 0 ? (
                                <span className="text-[9px] text-white/20 italic uppercase font-mono tracking-wider py-1 pl-1">
                                  No Modular Units in Stock
                                </span>
                              ) : (
                                unitsSnapshot.map(unit => (
                                  <div
                                    key={unit.id}
                                    className="px-2.5 py-1.5 rounded-xl bg-white/5 border border-white/10 flex items-center gap-2 text-[10px] font-mono font-bold text-white/80"
                                  >
                                    <span>{unit.name}</span>
                                    <button
                                      onClick={() => handleDeleteUnit(cat.id, unit.id)}
                                      className="text-white/30 hover:text-red-400 transition-colors"
                                    >
                                      &times;
                                    </button>
                                  </div>
                                ))
                              )}
                            </div>

                            {/* Inline Creator Input */}
                            <div className="flex gap-2 border-t border-white/5 pt-4">
                              <input
                                type="text"
                                placeholder="e.g. Unit 1, Serial #34"
                                value={newUnitNames[cat.id] || ""}
                                onChange={(e) => setNewUnitNames(prev => ({ ...prev, [cat.id]: e.target.value }))}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") {
                                    handleAddUnitToCategory(cat.id);
                                  }
                                }}
                                className="flex-grow bg-black/40 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white placeholder-white/20 font-mono font-bold"
                              />
                              <button
                                onClick={() => handleAddUnitToCategory(cat.id)}
                                className="px-3 py-1.5 bg-afterhours-purple text-white font-black uppercase text-[9px] rounded-xl tracking-wider cursor-pointer font-bold"
                              >
                                + Add Stock
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

      </div>

      {/* KYC Lightbox Modal */}
      <AnimatePresence>
        {kycModalUrl && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md"
            onClick={() => setKycModalUrl(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative max-w-2xl w-full bg-[#0e0e11] border border-white/10 rounded-3xl overflow-hidden p-6 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-white/5 pb-4 mb-4">
                <h3 className="text-xs uppercase font-serif font-black tracking-[0.25em] text-white/80 flex items-center gap-2">
                  <ImageIcon size={14} className="text-afterhours-cyan" />
                  <span>Customer KYC Document Vault</span>
                </h3>
                <button
                  onClick={() => setKycModalUrl(null)}
                  className="p-1.5 rounded-full bg-white/5 text-white/50 hover:text-white hover:bg-white/10 transition-all pointer-events-auto cursor-pointer"
                >
                  <X size={15} />
                </button>
              </div>

              <div className="aspect-[4/3] w-full relative overflow-hidden bg-black/60 rounded-2xl border border-white/5 flex items-center justify-center">
                <img
                  src={kycModalUrl}
                  alt="KYC Verification File"
                  className="max-h-full max-w-full object-contain"
                  referrerPolicy="no-referrer"
                />
              </div>

              <div className="flex justify-end gap-3 mt-5">
                <a
                  href={kycModalUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="px-4 py-2.5 text-[10px] font-black uppercase tracking-widest bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all cursor-pointer text-white flex items-center justify-center"
                >
                  Open Original ➔
                </a>
                <button
                  onClick={() => setKycModalUrl(null)}
                  className="px-5 py-2.5 text-[10px] font-black uppercase tracking-widest bg-afterhours-cyan text-black hover:scale-[1.01] active:scale-[0.99] rounded-xl transition-all cursor-pointer font-bold"
                >
                  Close Document
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Extend Booking Modal */}
      <AnimatePresence>
        {extendingOrder && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/95 backdrop-blur-md"
            onClick={() => setExtendingOrder(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative max-w-md w-full bg-[#0a0a0d] border border-white/10 rounded-3xl p-6 shadow-2xl space-y-6 text-white"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-white/0 pb-4">
                <div className="space-y-1">
                  <span className="text-[10px] uppercase font-mono tracking-widest text-[#06b6d4] font-black">Extension Engine Node</span>
                  <h3 className="text-sm uppercase font-serif font-black tracking-[0.2em] text-white">
                    Extend Booking
                  </h3>
                </div>
                <button
                  onClick={() => setExtendingOrder(null)}
                  className="p-1.5 rounded-full bg-white/5 text-white/50 hover:text-white hover:bg-white/10 transition-all pointer-events-auto cursor-pointer"
                >
                  <X size={15} />
                </button>
              </div>

              <div className="space-y-4 text-xs font-mono">
                <div className="bg-white/5 p-4 rounded-2xl border border-white/5 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-white/40 uppercase">Order ID:</span>
                    <span className="text-[#06b6d4] font-bold">#{extendingOrder["Order ID"] || extendingOrder.id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/40 uppercase">Client:</span>
                    <span className="text-white font-bold">{extendingOrder.Name || "Manual Client"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/40 uppercase">Original End Date:</span>
                    <span className="text-white/80 font-bold">{extendingOrder["End date"] || extendingOrder.endDate || "N/A"}</span>
                  </div>
                </div>

                <form onSubmit={handleExtendBooking} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-bold tracking-wider text-white/60">New End Date</label>
                    <input
                      type="date"
                      value={extensionEndDate}
                      min={extendingOrder["End date"] || extendingOrder.endDate || ""}
                      onChange={(e) => setExtensionEndDate(e.target.value)}
                      required
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white placeholder-white/20 font-mono font-bold focus:border-[#06b6d4] focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-bold tracking-wider text-white/60">Extension Price / Revenue (₹)</label>
                    <input
                      type="number"
                      value={extensionRevenue}
                      min="0"
                      onChange={(e) => setExtensionRevenue(e.target.value)}
                      required
                      placeholder="e.g. 1500"
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white placeholder-white/20 font-mono font-bold focus:border-[#06b6d4] focus:outline-none"
                    />
                  </div>

                  {/* Calculations summary preview */}
                  {(() => {
                    const origEndStr = extendingOrder["End date"] || extendingOrder.endDate || "";
                    if (!origEndStr || !extensionEndDate) return null;
                    const origEnd = new Date(origEndStr);
                    const newEnd = new Date(extensionEndDate);
                    if (isNaN(origEnd.getTime()) || isNaN(newEnd.getTime()) || newEnd <= origEnd) return null;
                    const diffTime = newEnd.getTime() - origEnd.getTime();
                    const addedDays = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
                    return (
                      <div className="bg-emerald-500/5 border border-emerald-500/10 p-3 rounded-xl flex justify-between items-center text-[11px] text-emerald-400">
                        <span>Proposed Extension:</span>
                        <span className="font-bold">+{addedDays} Day{addedDays > 1 ? "s" : ""} (@ +₹{parseFloat(extensionRevenue) || 0})</span>
                      </div>
                    );
                  })()}

                  <div className="flex gap-3 justify-end pt-2">
                    <button
                      type="button"
                      onClick={() => setExtendingOrder(null)}
                      className="px-4 py-2.5 text-[10px] font-black uppercase tracking-widest bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all cursor-pointer text-white flex items-center justify-center"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitExtending}
                      className="px-5 py-2.5 text-[10px] font-black uppercase tracking-widest bg-[#06b6d4] text-black hover:scale-[1.01] active:scale-[0.99] disabled:bg-neutral-800 disabled:text-white/40 disabled:cursor-not-allowed rounded-xl transition-all cursor-pointer font-bold flex items-center gap-1.5"
                    >
                      {isSubmitExtending ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Extending...</span>
                        </>
                      ) : (
                        <span>Confirm Extension</span>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>



    </div>
  );
}
