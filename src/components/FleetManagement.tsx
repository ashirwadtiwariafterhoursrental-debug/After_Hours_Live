import { useState, useEffect, FormEvent, useMemo } from "react";
import { 
  collection, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  doc, 
  deleteDoc,
  serverTimestamp,
  increment,
  getDocs,
  writeBatch
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db, handleFirestoreError, OperationType } from "../firebase";
import { motion, AnimatePresence } from "motion/react";
import { 
  Plus, 
  X, 
  Loader2, 
  User, 
  Sliders, 
  TrendingUp, 
  Hammer, 
  Activity, 
  Trash2, 
  DollarSign, 
  Search, 
  Layers, 
  Users, 
  Coins,
  Receipt,
  Edit2,
  Check,
  UserCheck,
  HelpCircle,
  FileSpreadsheet
} from "lucide-react";

interface Asset {
  id: string;
  name: string;
  serialNumber: string;
  category: string;
  purchaseCost: number;
  ownerId?: string;
  status: "idle" | "on-rent" | "maintenance" | string;
  totalEarned: number;
  rentCount: number;
  lastRentedTimestamp?: any;
}

interface UserProfile {
  id: string;
  name: string;
  email: string;
  role?: string;
  investedAmount?: number;
  withdrawnFunds?: number;
}

interface LedgerItem {
  id: string;
  orderNumber: string;
  startDate: string;
  endDate: string;
  grossRevenue: number;
  platformFee: number; // Stored in Firestore as platformFee, rendered here as Operating Expenses
  netProfit: number;
  partnerShare: number; // Rendered as Partner Net Earnings
  timestamp: any;
}

export function FleetManagement() {
  // Global Collections States
  const [assets, setAssets] = useState<Asset[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loadingAssets, setLoadingAssets] = useState<boolean>(true);
  const [loadingUsers, setLoadingUsers] = useState<boolean>(true);
  const [isAuthLoading, setIsAuthLoading] = useState<boolean>(true);

  // Filter & Search Controls
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");

  // Feature A: Master Edit Asset Modal
  const [isEditAssetModalOpen, setIsEditAssetModalOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);
  const [isSavingAsset, setIsSavingAsset] = useState(false);

  // Feature B: Manage Investors Modal
  const [isManageInvestorsModalOpen, setIsManageInvestorsModalOpen] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editUserName, setEditUserName] = useState("");
  const [editUserInvested, setEditUserInvested] = useState("");
  const [editUserWithdrawn, setEditUserWithdrawn] = useState("");
  const [editUserRole, setEditUserRole] = useState("");
  const [isSavingUser, setIsSavingUser] = useState(false);

  // Feature C: View/Edit Ledger Modal
  const [isLedgerModalOpen, setIsLedgerModalOpen] = useState(false);
  const [selectedAssetForLedger, setSelectedAssetForLedger] = useState<Asset | null>(null);
  const [ledgerReceipts, setLedgerReceipts] = useState<LedgerItem[]>([]);
  const [loadingLedger, setLoadingLedger] = useState(false);

  // Nested Ledger Edit Sub-states
  const [editingLedgerId, setEditingLedgerId] = useState<string | null>(null);
  const [editLedgerOrderNo, setEditLedgerOrderNo] = useState("");
  const [editLedgerStart, setEditLedgerStart] = useState("");
  const [editLedgerEnd, setEditLedgerEnd] = useState("");
  const [editLedgerGross, setEditLedgerGross] = useState("");
  const [editLedgerExpenses, setEditLedgerExpenses] = useState("");
  const [editLedgerShare, setEditLedgerShare] = useState("");
  const [isSavingLedger, setIsSavingLedger] = useState(false);

  // Asset Receipt creation state
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [selectedAssetForReceipt, setSelectedAssetForReceipt] = useState<Asset | null>(null);
  const [orderNumber, setOrderNumber] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [grossRevenue, setGrossRevenue] = useState("");
  const [isLoggingReceipt, setIsLoggingReceipt] = useState(false);

  // Global "Add New Asset" state
  const [isAddAssetModalOpen, setIsAddAssetModalOpen] = useState(false);
  const [newAssetName, setNewAssetName] = useState("");
  const [newAssetSerial, setNewAssetSerial] = useState("");
  const [newAssetCategory, setNewAssetCategory] = useState("PS5");
  const [newAssetCost, setNewAssetCost] = useState("");
  const [isAddingAsset, setIsAddingAsset] = useState(false);

  // Live Auto-calc previews for Logging Receipts
  const grossVal = Number(grossRevenue) || 0;
  const platformFee = grossVal > 0 ? Math.min(Math.max(600, grossVal * 0.30), 1400) : 0;
  const netProfit = grossVal > 0 ? Math.max(0, grossVal - platformFee) : 0;
  const partnerShare = netProfit / 2;

  // --- Dynamic Categories Helper & timestamp helpers ---
  const uniqueCategories = useMemo(() => {
    const list = new Set(["PS5", "PICO", "SIMULATOR", "TV"]);
    assets.forEach(a => {
      if (a.category) list.add(a.category);
    });
    return Array.from(list);
  }, [assets]);

  const getTimestampValue = (asset: Asset) => {
    const ts = asset.lastRentedTimestamp;
    if (!ts) return 0;
    if (ts.seconds !== undefined) {
      return ts.seconds * 1000 + (ts.nanoseconds || 0) / 1000000;
    }
    if (ts instanceof Date) {
      return ts.getTime();
    }
    const ms = Date.parse(ts);
    if (!isNaN(ms)) {
      return ms;
    }
    if (typeof ts === 'number') {
      return ts;
    }
    return 0;
  };

  // --- New Combo Order Modal States ---
  const [isComboModalOpen, setIsComboModalOpen] = useState(false);
  const [comboOrderNo, setComboOrderNo] = useState("");
  const [comboStartDate, setComboStartDate] = useState("");
  const [comboEndDate, setComboEndDate] = useState("");
  const [comboGrossRevenue, setComboGrossRevenue] = useState("");
  const [comboAddons, setComboAddons] = useState<{ id: string; name: string; price: number }[]>([]);
  const [operatingExpense, setOperatingExpense] = useState("");
  const [isOpExCustom, setIsOpExCustom] = useState(false);
  const [allocatorRows, setAllocatorRows] = useState<{ id: string; assetId: string; splitPercent: number }[]>([]);
  const [isSavingCombo, setIsSavingCombo] = useState(false);

  // --- Combo Math Engine Logic ---
  const comboGrossVal = Number(comboGrossRevenue) || 0;
  const extractedAddonsSum = useMemo(() => {
    return comboAddons
      .filter(addon => addon.price < 400)
      .reduce((sum, addon) => sum + addon.price, 0);
  }, [comboAddons]);

  const rentableRevenue = Math.max(0, comboGrossVal - extractedAddonsSum);

  useEffect(() => {
    if (!isOpExCustom) {
      const calculated = Math.round(rentableRevenue * 0.30);
      setOperatingExpense(calculated.toString());
    }
  }, [rentableRevenue, isOpExCustom]);

  const opExVal = Number(operatingExpense) || 0;
  const comboNetProfit = Math.max(0, rentableRevenue - opExVal);

  const handleAddAddon = () => {
    setComboAddons([
      ...comboAddons,
      { id: Date.now().toString() + Math.random().toString(), name: "", price: 0 }
    ]);
  };

  const handleUpdateAddon = (id: string, field: "name" | "price", value: any) => {
    setComboAddons(
      comboAddons.map(addon => {
        if (addon.id === id) {
          return {
            ...addon,
            [field]: field === "price" ? (Number(value) || 0) : value
          };
        }
        return addon;
      })
    );
  };

  const handleRemoveAddon = (id: string) => {
    setComboAddons(comboAddons.filter(addon => addon.id !== id));
  };

  const handleAddAllocatorRow = () => {
    setAllocatorRows([
      ...allocatorRows,
      { id: Date.now().toString() + Math.random().toString(), assetId: "", splitPercent: 0 }
    ]);
  };

  const handleUpdateAllocatorRow = (id: string, field: "assetId" | "splitPercent", value: any) => {
    setAllocatorRows(
      allocatorRows.map(row => {
        if (row.id === id) {
          return {
            ...row,
            [field]: field === "splitPercent" ? (Number(value) || 0) : value
          };
        }
        return row;
      })
    );
  };

  const handleRemoveAllocatorRow = (id: string) => {
    setAllocatorRows(allocatorRows.filter(row => row.id !== id));
  };

  const handleSaveComboOrder = async (e: FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) {
      alert("Unauthorized operational call.");
      return;
    }

    const totalSplit = allocatorRows.reduce((sum, r) => sum + r.splitPercent, 0);
    if (totalSplit !== 100) {
      alert(`Asset Split sum must be exactly 100%. Currently it is ${totalSplit}%.`);
      return;
    }

    setIsSavingCombo(true);
    try {
      const batch = writeBatch(db);

      // Create documents & updates dynamically
      for (const row of allocatorRows) {
        const splitFraction = row.splitPercent / 100;
        const propGross = comboGrossVal * splitFraction;
        const propOpEx = opExVal * splitFraction;
        const assetCut = comboNetProfit * splitFraction;

        // Custom ledger collection schema
        const ledgerColRef = collection(db, "inventory_vault", row.assetId, "ledgers");
        const newDocRef = doc(ledgerColRef); // auto-generate empty document with ID

        batch.set(newDocRef, {
          orderNumber: comboOrderNo.trim(),
          startDate: comboStartDate,
          endDate: comboEndDate,
          grossRevenue: propGross,
          platformFee: propOpEx,
          netProfit: assetCut,
          partnerShare: assetCut,
          timestamp: serverTimestamp()
        });

        // Update target equipment values
        const assetDocRef = doc(db, "inventory_vault", row.assetId);
        batch.update(assetDocRef, {
          totalEarned: increment(assetCut),
          rentCount: increment(1),
          lastRentedTimestamp: serverTimestamp()
        });
      }

      await batch.commit();

      // Clear operational states
      setComboOrderNo("");
      setComboStartDate("");
      setComboEndDate("");
      setComboGrossRevenue("");
      setComboAddons([]);
      setOperatingExpense("");
      setIsOpExCustom(false);
      setAllocatorRows([]);
      setIsComboModalOpen(false);

      alert("Combo order math batch fully committed! Sub-ledgers generated and asset FIFO queue refreshed.");
    } catch (err: any) {
      console.error("Batch write failure:", err);
      if (auth.currentUser) {
        handleFirestoreError(err, OperationType.WRITE, "inventory_vault_batch_combo");
      }
      alert("Log Combo Order failed: " + err.message);
    } finally {
      setIsSavingCombo(false);
    }
  };

  // Real-time Users Fetch with Auth state wrapping
  useEffect(() => {
    let unsubUsers: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      setIsAuthLoading(false);

      if (unsubUsers) {
        unsubUsers();
        unsubUsers = null;
      }

      // Ensure the Admin pages are safely wrapped. If a user is NOT an admin, they should not even be attempting to load users.
      const isAdmin = localStorage.getItem("isAdminAuthenticated") === "true";
      const isAuthAdmin = user && (user.email === "afterhoursrental@gmail.com" || user.email === "arjuntiwari8604@gmail.com");

      if (user && (isAdmin || isAuthAdmin)) {
        unsubUsers = onSnapshot(collection(db, "users"), (snapshot) => {
          const list: UserProfile[] = [];
          snapshot.forEach((d) => {
            const u = d.data();
            list.push({
              id: d.id,
              name: u.name || "Unnamed investor",
              email: u.email || "",
              role: u.role || "user",
              investedAmount: Number(u.investedAmount) || 0,
              withdrawnFunds: Number(u.withdrawnFunds) || 0
            });
          });
          setUsers(list);
          setLoadingUsers(false);
        }, (err) => {
          console.error("Error loading users for Fleet management:", err);
          if (auth.currentUser) {
            handleFirestoreError(err, OperationType.LIST, "users");
          }
          setLoadingUsers(false);
        });
      } else {
        setUsers([]);
        setLoadingUsers(false);
      }
    });

    return () => {
      if (unsubUsers) unsubUsers();
      unsubscribeAuth();
    };
  }, []);

  // Real-time Assets Fetch with Auth state wrapping
  useEffect(() => {
    let unsubAssets: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      setIsAuthLoading(false);

      if (unsubAssets) {
        unsubAssets();
        unsubAssets = null;
      }

      // Ensure the Admin pages are safely wrapped. If a user is NOT an admin, they should not attempt to load assets.
      const isAdmin = localStorage.getItem("isAdminAuthenticated") === "true";
      const isAuthAdmin = user && (user.email === "afterhoursrental@gmail.com" || user.email === "arjuntiwari8604@gmail.com");

      if (user && (isAdmin || isAuthAdmin)) {
        unsubAssets = onSnapshot(collection(db, "inventory_vault"), (snapshot) => {
          const list: Asset[] = [];
          snapshot.forEach((d) => {
            const data = d.data();
            if (data.serialNumber !== undefined) {
              list.push({
                id: d.id,
                name: data.name || "",
                serialNumber: data.serialNumber || "",
                category: data.category || "General",
                purchaseCost: Number(data.purchaseCost) || 0,
                ownerId: data.ownerId || "unassigned",
                status: data.status || "idle",
                totalEarned: Number(data.totalEarned) || 0,
                rentCount: Number(data.rentCount) || 0,
                lastRentedTimestamp: data.lastRentedTimestamp
              });
            }
          });
          setAssets(list);
          setLoadingAssets(false);
        }, (err) => {
          console.error("Error loading assets for Fleet Management:", err);
          if (auth.currentUser) {
            handleFirestoreError(err, OperationType.LIST, "inventory_vault");
          }
          setLoadingAssets(false);
        });
      } else {
        setAssets([]);
        setLoadingAssets(false);
      }
    });

    return () => {
      if (unsubAssets) unsubAssets();
      unsubscribeAuth();
    };
  }, []);

  // Fetch ledgers for a single selected asset
  const handleOpenLedger = async (asset: Asset) => {
    setSelectedAssetForLedger(asset);
    setIsLedgerModalOpen(true);
    setLoadingLedger(true);
    setEditingLedgerId(null);
    try {
      const ledgersRef = collection(db, "inventory_vault", asset.id, "ledgers");
      const querySnapshot = await getDocs(ledgersRef);
      const list: LedgerItem[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        list.push({
          id: doc.id,
          orderNumber: data.orderNumber || "",
          startDate: data.startDate || "",
          endDate: data.endDate || "",
          grossRevenue: Number(data.grossRevenue) || 0,
          platformFee: Number(data.platformFee) || 0,
          netProfit: Number(data.netProfit) || 0,
          partnerShare: Number(data.partnerShare) || 0,
          timestamp: data.timestamp || null
        });
      });
      // Sort in-memory: descending order of start date/timestamp
      list.sort((a, b) => {
        if (a.timestamp && b.timestamp) {
          const aTime = a.timestamp.toDate ? a.timestamp.toDate().getTime() : new Date(a.timestamp).getTime();
          const bTime = b.timestamp.toDate ? b.timestamp.toDate().getTime() : new Date(b.timestamp).getTime();
          return bTime - aTime;
        }
        return b.startDate.localeCompare(a.startDate);
      });
      setLedgerReceipts(list);
    } catch (err: any) {
      console.error("Error fetching ledgers:", err);
      alert("Failed to load ledgers: " + err.message);
    } finally {
      setLoadingLedger(false);
    }
  };

  // Log a new booking receipt manually
  const handleLogBookingReceipt = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedAssetForReceipt) return;
    if (!orderNumber.trim() || !startDate || !endDate || !grossRevenue) {
      alert("Please fill out all receipt field data.");
      return;
    }
    const grossVal = Number(grossRevenue);
    if (isNaN(grossVal) || grossVal <= 0) {
      alert("Please enter a valid positive gross revenue.");
      return;
    }

    setIsLoggingReceipt(true);
    try {
      const computedPlatformFee = Math.min(Math.max(600, grossVal * 0.30), 1400);
      const computedNetProfit = Math.max(0, grossVal - computedPlatformFee);
      const computedPartnerShare = computedNetProfit / 2;

      // Add to ledgers subcollection
      const ledgersRef = collection(db, "inventory_vault", selectedAssetForReceipt.id, "ledgers");
      await addDoc(ledgersRef, {
        orderNumber: orderNumber.trim(),
        startDate,
        endDate,
        grossRevenue: grossVal,
        platformFee: computedPlatformFee,
        netProfit: computedNetProfit,
        partnerShare: computedPartnerShare,
        timestamp: serverTimestamp()
      });

      // Update parent asset aggregates
      const assetRef = doc(db, "inventory_vault", selectedAssetForReceipt.id);
      await updateDoc(assetRef, {
        rentCount: increment(1),
        totalEarned: increment(computedPartnerShare)
      });

      // Clear states
      setOrderNumber("");
      setStartDate("");
      setEndDate("");
      setGrossRevenue("");
      setIsReceiptModalOpen(false);
      setSelectedAssetForReceipt(null);
      alert("Ledger receipt logged, partner earnings dispatched!");
    } catch (err: any) {
      console.error("Error logging receipt:", err);
      alert("Failed to log receipt: " + err.message);
    } finally {
      setIsLoggingReceipt(false);
    }
  };

  // Global "Add Unique Asset" trigger
  const handleCreateAsset = async (e: FormEvent) => {
    e.preventDefault();
    if (!newAssetName.trim() || !newAssetSerial.trim() || !newAssetCost) {
      alert("Please fill out all new asset properties.");
      return;
    }
    setIsAddingAsset(true);
    try {
      await addDoc(collection(db, "inventory_vault"), {
        name: newAssetName.trim(),
        serialNumber: newAssetSerial.trim(),
        category: newAssetCategory,
        purchaseCost: Number(newAssetCost) || 0,
        ownerId: "unassigned",
        status: "idle",
        totalEarned: 0,
        rentCount: 0,
        createdAt: serverTimestamp()
      });
      setNewAssetName("");
      setNewAssetSerial("");
      setNewAssetCost("");
      setIsAddAssetModalOpen(false);
      alert("Asset dispatched into general vault!");
    } catch (err: any) {
      console.error("Error creating asset in vault: ", err);
      alert("Failed: " + err.message);
    } finally {
      setIsAddingAsset(false);
    }
  };

  // Feature A: Master Edit Asset Handler
  const handleOpenEditAsset = (asset: Asset) => {
    setEditingAsset({ ...asset });
    setIsEditAssetModalOpen(true);
  };

  const handleSaveAssetEdit = async (e: FormEvent) => {
    e.preventDefault();
    if (!editingAsset) return;
    if (!editingAsset.name.trim() || !editingAsset.serialNumber.trim() || editingAsset.purchaseCost === undefined) {
      alert("Required fields are missing.");
      return;
    }

    setIsSavingAsset(true);
    try {
      const assetRef = doc(db, "inventory_vault", editingAsset.id);
      await updateDoc(assetRef, {
        name: editingAsset.name.trim(),
        serialNumber: editingAsset.serialNumber.trim(),
        ownerId: editingAsset.ownerId,
        status: editingAsset.status,
        category: editingAsset.category,
        purchaseCost: Number(editingAsset.purchaseCost) || 0
      });

      setIsEditAssetModalOpen(false);
      setEditingAsset(null);
      alert("Asset configuration fully synchronized!");
    } catch (err: any) {
      console.error("Error updating asset config:", err);
      alert("Failed to synchronize asset details: " + err.message);
    } finally {
      setIsSavingAsset(false);
    }
  };

  // Feature B: Update User/Investor profile values
  const handleStartEditUser = (user: UserProfile) => {
    setEditingUserId(user.id);
    setEditUserName(user.name);
    setEditUserInvested((user.investedAmount || 0).toString());
    setEditUserWithdrawn((user.withdrawnFunds || 0).toString());
    setEditUserRole(user.role || "user");
  };

  const handleSaveUserEdit = async (userId: string) => {
    setIsSavingUser(true);
    try {
      const userRef = doc(db, "users", userId);
      await updateDoc(userRef, {
        name: editUserName.trim(),
        investedAmount: Number(editUserInvested) || 0,
        withdrawnFunds: Number(editUserWithdrawn) || 0,
        role: editUserRole
      });
      setEditingUserId(null);
      alert("Investor details updated perfectly!");
    } catch (err: any) {
      console.error("Error updating user account profiles:", err);
      alert("Failed to update user account: " + err.message);
    } finally {
      setIsSavingUser(false);
    }
  };

  // Feature C: Subcollection Ledger Edit/Delete Operations
  const handleOpenEditLedger = (ledger: LedgerItem) => {
    setEditingLedgerId(ledger.id);
    setEditLedgerOrderNo(ledger.orderNumber);
    setEditLedgerStart(ledger.startDate);
    setEditLedgerEnd(ledger.endDate);
    setEditLedgerGross(ledger.grossRevenue.toString());
    setEditLedgerExpenses(ledger.platformFee.toString());
    setEditLedgerShare(ledger.partnerShare.toString());
  };

  const handleSaveLedgerEdit = async (ledgerId: string) => {
    if (!selectedAssetForLedger) return;
    setIsSavingLedger(true);
    try {
      const oldLedger = ledgerReceipts.find(l => l.id === ledgerId);
      const oldShare = oldLedger ? oldLedger.partnerShare : 0;

      const newGross = Number(editLedgerGross) || 0;
      const newExpenses = Number(editLedgerExpenses) || 0;
      const newShare = Number(editLedgerShare) || 0;
      const newNet = Math.max(0, newGross - newExpenses);

      const ledgerDocRef = doc(db, "inventory_vault", selectedAssetForLedger.id, "ledgers", ledgerId);
      
      // Update ledger document
      await updateDoc(ledgerDocRef, {
        orderNumber: editLedgerOrderNo.trim(),
        startDate: editLedgerStart,
        endDate: editLedgerEnd,
        grossRevenue: newGross,
        platformFee: newExpenses,
        netProfit: newNet,
        partnerShare: newShare
      });

      // Smoothly adjust parent asset total wealth earnings
      const difference = newShare - oldShare;
      const assetRef = doc(db, "inventory_vault", selectedAssetForLedger.id);
      await updateDoc(assetRef, {
        totalEarned: increment(difference)
      });

      // Refresh local modal ledger lists
      setLedgerReceipts(prev => prev.map(l => {
        if (l.id === ledgerId) {
          return {
            ...l,
            orderNumber: editLedgerOrderNo.trim(),
            startDate: editLedgerStart,
            endDate: editLedgerEnd,
            grossRevenue: newGross,
            platformFee: newExpenses,
            netProfit: newNet,
            partnerShare: newShare
          };
        }
        return l;
      }));

      // Adjust original reference object state for safety
      if (selectedAssetForLedger) {
        selectedAssetForLedger.totalEarned += difference;
      }

      setEditingLedgerId(null);
      alert("Ledger modified securely. Parent aggregates adjusted!");
    } catch (err: any) {
      console.error("Error editing ledger records:", err);
      alert("Failed to write modifications: " + err.message);
    } finally {
      setIsSavingLedger(false);
    }
  };

  const handleDeleteLedger = async (ledgerId: string) => {
    if (!selectedAssetForLedger) return;
    if (!window.confirm("Are you sure you want to permanently delete this ledger receipt? This will deduct its partner earnings from the parent asset total yield.")) {
      return;
    }

    try {
      const targetLedger = ledgerReceipts.find(l => l.id === ledgerId);
      const oldShare = targetLedger ? targetLedger.partnerShare : 0;

      const ledgerDocRef = doc(db, "inventory_vault", selectedAssetForLedger.id, "ledgers", ledgerId);
      await deleteDoc(ledgerDocRef);

      // Subtract from parent total earned and decrease rent counts
      const assetRef = doc(db, "inventory_vault", selectedAssetForLedger.id);
      await updateDoc(assetRef, {
        totalEarned: increment(-oldShare),
        rentCount: increment(-1)
      });

      // Refresh list
      setLedgerReceipts(prev => prev.filter(l => l.id !== ledgerId));
      if (selectedAssetForLedger) {
        selectedAssetForLedger.totalEarned -= oldShare;
        selectedAssetForLedger.rentCount = Math.max(0, selectedAssetForLedger.rentCount - 1);
      }

      alert("Ledger annihilated from audit subcollection!");
    } catch (err: any) {
      console.error("Error purging ledger document: ", err);
      alert("Purge operation failed: " + err.message);
    }
  };

  // Filter Helper Logic
  const getFilteredAssets = () => {
    return assets.filter((asset) => {
      const matchesSearch = 
        asset.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        asset.serialNumber.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesStatus = 
        selectedStatus === "ALL" || 
        asset.status.toLowerCase() === selectedStatus.toLowerCase() ||
        (selectedStatus === "active" && (asset.status.toLowerCase() === "rented" || asset.status.toLowerCase() === "on rent" || asset.status.toLowerCase() === "active"));

      const matchesCategory = 
        selectedCategory === "ALL" || 
        asset.category.toLowerCase() === selectedCategory.toLowerCase();

      return matchesSearch && matchesStatus && matchesCategory;
    });
  };

  // Helper: map owner Uid to investor name
  const getOwnerName = (userId: string) => {
    if (userId === "unassigned") return "Unassigned Pool";
    const lookup = users.find(u => u.id === userId);
    return lookup ? lookup.name : `Unregistered Profile (${userId.substring(0,6)})`;
  };

  // Format Helper
  const formatRupees = (v: number) => {
    return `₹${v.toLocaleString("en-IN")}`;
  };

  // Category Colors
  const getCategoryColor = (cat: string) => {
    switch (cat.toUpperCase()) {
      case "PS5": return "bg-blue-100 text-[#003791] border-blue-250";
      case "PICO": return "bg-purple-100 text-purple-800 border-purple-200";
      case "SIMULATOR": return "bg-amber-100 text-amber-800 border-amber-250";
      default: return "bg-slate-100 text-slate-800 border-slate-205";
    }
  };

  // Grouped & Sorted assets computed as a top-level hook BEFORE early return
  const groupedAssets = useMemo(() => {
    const filtered = getFilteredAssets();
    const groups: { [cat: string]: Asset[] } = {};
    
    filtered.forEach(asset => {
      const cat = asset.category || "General";
      if (!groups[cat]) {
        groups[cat] = [];
      }
      groups[cat].push(asset);
    });

    const sortedGroups: { [cat: string]: Asset[] } = {};
    Object.keys(groups).sort().forEach(cat => {
      sortedGroups[cat] = [...groups[cat]].sort((a, b) => {
        return getTimestampValue(a) - getTimestampValue(b);
      });
    });

    return sortedGroups;
  }, [assets, searchQuery, selectedStatus, selectedCategory]);

  if (isAuthLoading) {
    return <div className="flex justify-center p-10">Loading securely...</div>;
  }

  if (loadingAssets || loadingUsers) {
    return (
      <div className="w-full min-h-96 flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-10 h-10 text-[#003791] animate-spin" />
        <p className="text-slate-500 font-medium text-xs uppercase tracking-widest font-mono">
          Assembling God Mode Fleet Telemetry...
        </p>
      </div>
    );
  }

  const filteredAssetsList = getFilteredAssets();

  return (
    <div className="w-full min-h-screen bg-slate-50 text-slate-800 font-sans pb-20">
      
      {/* Premium Header Accent Section */}
      <div className="bg-[#003791] text-white py-12 px-6 sm:px-8 border-b border-blue-900 shadow-md">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1.5">
            <span className="inline-flex items-center gap-1.5 bg-yellow-400/20 text-yellow-300 border border-yellow-400/30 px-3 py-1 rounded-full text-[10px] uppercase font-bold tracking-widest">
              ⚡ ADMINISTRATIVE CONSOLE ENABLED
            </span>
            <h1 className="text-3xl font-black tracking-tight">
              Hardware Fleet Control
            </h1>
            <p className="text-slate-350 text-xs font-medium max-w-xl">
              God Mode interface. Oversee all registered equipment, reconcile financial ledger receipts dynamically, and calibrate global investor balances.
            </p>
          </div>
          
          {/* Top Level Global Control Buttons */}
          <div className="flex flex-wrap items-center gap-3.5 self-start md:self-center">
            
            <button
              onClick={() => setIsManageInvestorsModalOpen(true)}
              className="px-5 py-3 rounded-xl bg-white text-[#003791] hover:bg-slate-100 font-extrabold text-xs uppercase transition-all tracking-wider flex items-center gap-2 shadow-xs hover:shadow-md cursor-pointer border border-transparent"
            >
              <Users className="w-4 h-4" />
              Manage Investors
            </button>

            <button
              onClick={() => {
                setComboOrderNo(`AHO-COMBO-${Math.floor(1000 + Math.random() * 9000)}`);
                setComboStartDate("");
                setComboEndDate("");
                setComboGrossRevenue("");
                setComboAddons([]);
                setOperatingExpense("");
                setIsOpExCustom(false);
                setAllocatorRows([{ id: '1', assetId: '', splitPercent: 100 }]);
                setIsComboModalOpen(true);
              }}
              className="px-5 py-3 rounded-xl bg-[#003791] hover:bg-blue-800 text-white font-extrabold text-xs uppercase transition-all tracking-wider flex items-center gap-2 shadow-xs hover:shadow-md cursor-pointer border border-transparent"
            >
              <Layers className="w-4 h-4" />
              Log Combo Order (Math Pro)
            </button>

            <button
              onClick={() => setIsAddAssetModalOpen(true)}
              className="px-5 py-3 rounded-xl bg-[#00d2ff] hover:bg-sky-400 text-blue-950 font-black text-xs uppercase transition-all tracking-wider flex items-center gap-2 shadow-xs hover:shadow-md cursor-pointer border border-[#00d2ff]/30"
            >
              <Plus className="w-4.5 h-4.5" />
              Ingest New Asset
            </button>

          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto w-full px-6 sm:px-8 mt-8 space-y-8">
        
        {/* Search, Filter Tools row */}
        <div className="bg-white rounded-3xl p-6 border border-slate-150 shadow-[0_4px_24px_rgba(30,41,59,0.02)] flex flex-col lg:flex-row lg:items-center gap-5 justify-between">
          <div className="relative flex-grow max-w-md">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-400">
              <Search className="w-4 h-4" />
            </span>
            <input
              type="text"
              placeholder="Search assets by name or serial tag..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 border border-slate-205 focus:border-[#003791] focus:ring-1 focus:ring-[#003791] pl-10 pr-4 py-3 rounded-2xl text-xs font-semibold text-slate-800 placeholder-slate-400 outline-none transition-all"
            />
          </div>

          <div className="flex flex-wrap items-center gap-4">
            
            {/* Category Select Filters */}
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase font-bold text-slate-450 tracking-wider font-mono">Category</span>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="bg-slate-50 border border-slate-205 text-xs font-semibold text-slate-700 py-2.5 px-4 rounded-xl outline-none focus:border-[#003791] transition-all whitespace-nowrap"
              >
                <option value="ALL">All Categories</option>
                {uniqueCategories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            {/* Status Select Filters */}
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase font-bold text-slate-450 tracking-wider font-mono">Status</span>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="bg-slate-50 border border-slate-205 text-xs font-semibold text-slate-700 py-2.5 px-4 rounded-xl outline-none focus:border-[#003791] transition-all"
              >
                <option value="ALL">All Statuses</option>
                <option value="idle">Available / Idle</option>
                <option value="active">On Rent / Active</option>
                <option value="maintenance">Maintenance</option>
              </select>
            </div>

          </div>
        </div>

        {/* Fleet Grid Display (Grouped & FIFO sorted) */}
        {Object.keys(groupedAssets).length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-150 p-16 text-center max-w-xl mx-auto space-y-4 shadow-[0_4px_24px_rgba(30,41,59,0.01)]">
            <HelpCircle className="w-10 h-10 text-slate-350 mx-auto" />
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-slate-900">No Hardware Found</h3>
              <p className="text-xs text-slate-405 leading-relaxed max-w-sm mx-auto">
                No physical devices match your search pattern. Adjust category selections or click "Ingest New Asset" to map one.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-12">
            {(Object.entries(groupedAssets) as [string, Asset[]][]).map(([categoryName, groupAssets]) => (
              <div key={categoryName} className="space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
                  <h2 className="text-xs font-black uppercase text-[#003791] tracking-wider font-mono bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-100">
                    {categoryName}
                  </h2>
                  <span className="text-[10px] text-slate-500 font-mono font-bold bg-slate-100 px-2.5 py-0.5 rounded-full border border-slate-200">
                    {groupAssets.length} Unit{groupAssets.length !== 1 ? "s" : ""} In Line
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {groupAssets.map((asset, index) => {
                    const statusLower = asset.status.toLowerCase();
                    const ownerName = getOwnerName(asset.ownerId || "unassigned");
                    const isNextInLine = index === 0;

                    return (
                      <div 
                        key={asset.id}
                        className="bg-white rounded-2xl border border-slate-150 shadow-[0_4px_24px_rgba(30,41,59,0.02)] hover:shadow-[0_8px_32px_rgba(30,41,59,0.06)] transition-all duration-300 overflow-hidden flex flex-col justify-between"
                      >
                        <div className="p-6 space-y-4">
                          
                          {/* Header info */}
                          <div className="flex items-start justify-between gap-2">
                            <div className="space-y-1.5">
                              <div className="flex flex-wrap items-center gap-1.5">
                                <span className={`inline-block px-2.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase border border-slate-150 ${getCategoryColor(asset.category)}`}>
                                  {asset.category}
                                </span>
                                {isNextInLine && (
                                  <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 border border-emerald-250 px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase animate-pulse">
                                    Next In Line
                                  </span>
                                )}
                              </div>
                              <h3 className="text-base font-black text-slate-900 tracking-tight leading-snug">
                                {asset.name}
                              </h3>
                            </div>

                            {/* Pill status */}
                            {statusLower === "rented" || statusLower === "on rent" || statusLower === "active" ? (
                              <span className="px-2.5 py-1 text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full flex items-center gap-1 shadow-2xs">
                                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping" />
                                On Rent
                              </span>
                            ) : statusLower === "maintenance" ? (
                              <span className="px-2.5 py-1 text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 rounded-full">
                                Maintenance
                              </span>
                            ) : (
                              <span className="px-2.5 py-1 text-[10px] font-bold bg-sky-50 text-sky-700 border border-sky-200 rounded-full">
                                Available
                              </span>
                            )}
                          </div>

                          {/* Numeric and Ownership metrics */}
                          <div className="pt-3 border-t border-slate-100 flex flex-col gap-2.5 text-xs text-slate-650">
                            
                            <div className="flex justify-between items-center">
                              <span className="text-slate-450 font-semibold font-mono text-[10px] uppercase">Serial Tag</span>
                              <strong className="font-mono bg-slate-50 border border-slate-150 px-2 py-0.5 rounded-md text-[11px] text-slate-800">
                                {asset.serialNumber}
                              </strong>
                            </div>

                            <div className="flex justify-between items-start">
                              <span className="text-slate-450 font-semibold font-mono text-[10px] uppercase mt-0.5">Assigned Owner</span>
                              <div className="text-right">
                                <strong className="text-slate-900 font-extrabold flex items-center gap-1 justify-end">
                                  <User className="w-3.5 h-3.5 text-slate-400" />
                                  {ownerName}
                                </strong>
                                {asset.ownerId !== "unassigned" && (
                                  <span className="text-[10px] text-[#003791] font-bold font-mono">Verified Partner</span>
                                )}
                              </div>
                            </div>

                            <div className="flex justify-between items-center bg-slate-50 p-2.5 rounded-xl border border-slate-100 mt-1">
                              <div className="space-y-0.5">
                                <p className="text-[10px] font-mono uppercase font-bold text-slate-400">Yield Earnings</p>
                                <p className="font-mono font-black text-slate-900 text-sm">
                                  {formatRupees(asset.totalEarned)}
                                </p>
                              </div>
                              <div className="text-right space-y-0.5">
                                <p className="text-[10px] font-mono uppercase font-bold text-slate-400">Bookings</p>
                                <p className="font-extrabold text-slate-800 text-sm">
                                  {asset.rentCount} ×
                                </p>
                              </div>
                            </div>

                            <div className="flex justify-between items-center text-[10px] text-slate-450 font-mono mt-0.5">
                              <span>Last Dispatch:</span>
                              <span className="font-bold">
                                {asset.lastRentedTimestamp?.seconds
                                  ? new Date(asset.lastRentedTimestamp.seconds * 1000).toLocaleString()
                                  : asset.lastRentedTimestamp
                                    ? new Date(asset.lastRentedTimestamp).toLocaleString()
                                    : "Never Rented"}
                              </span>
                            </div>

                          </div>
                        </div>

                        {/* Actions Drawer Bar */}
                        <div className="px-4 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-2 flex-wrap">
                          
                          <button
                            onClick={() => handleOpenEditAsset(asset)}
                            className="p-2.5 hover:bg-white text-slate-500 hover:text-[#003791] hover:border-blue-200 border border-transparent rounded-xl transition-all cursor-pointer flex-grow text-center text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1 bg-transparent"
                          >
                            <Edit2 className="w-4 h-4" />
                            Configure
                          </button>

                          <button
                            onClick={() => {
                              setSelectedAssetForReceipt(asset);
                              setOrderNumber(`AHO-${Math.floor(1000 + Math.random() * 9000)}`);
                              setIsReceiptModalOpen(true);
                            }}
                            className="p-2.5 hover:bg-white text-[#003791] hover:text-blue-800 hover:border-blue-200 border border-transparent rounded-xl transition-all cursor-pointer flex-grow text-center text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1 bg-transparent"
                          >
                            <Receipt className="w-4 h-4" />
                            Log Yield
                          </button>

                          <button
                            onClick={() => handleOpenLedger(asset)}
                            className="p-2.5 bg-[#003791]/10 hover:bg-[#003791] text-[#003791] hover:text-white border border-[#003791]/10 rounded-xl transition-all cursor-pointer flex-grow text-center text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1"
                          >
                            <FileSpreadsheet className="w-4 h-4" />
                            Audits
                          </button>

                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

      </div>

      {/* A. Master Edit Asset Modal */}
      <AnimatePresence>
        {isEditAssetModalOpen && editingAsset && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsEditAssetModalOpen(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-200 w-full max-w-lg relative z-10 text-slate-800"
            >
              <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 mb-5">
                <div className="space-y-0.5">
                  <span className="text-[10px] font-mono uppercase font-bold text-[#003791] tracking-widest">CONFIGURATION PORT</span>
                  <h3 className="text-xl font-extrabold text-slate-900">Edit Asset Schema</h3>
                </div>
                <button
                  onClick={() => setIsEditAssetModalOpen(false)}
                  className="p-1 text-slate-400 hover:text-slate-650 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveAssetEdit} className="space-y-4">
                
                <div className="space-y-1">
                  <label className="text-[10px] font-mono text-slate-500 uppercase tracking-wider font-bold">Asset Label/Name</label>
                  <input
                    type="text"
                    value={editingAsset.name || ""}
                    onChange={(e) => setEditingAsset({ ...editingAsset, name: e.target.value })}
                    required
                    className="w-full bg-slate-50 border border-slate-205 py-2.5 px-3.5 rounded-xl text-xs font-semibold focus:border-[#003791] outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono text-slate-500 uppercase tracking-wider font-bold">Category</label>
                    <input
                      type="text"
                      list="edit-category-datalist"
                      value={editingAsset.category || ""}
                      onChange={(e) => setEditingAsset({ ...editingAsset, category: e.target.value })}
                      placeholder="Select or type..."
                      className="w-full bg-slate-50 border border-slate-205 py-2.5 px-3 rounded-xl text-xs font-semibold focus:border-[#003791] outline-none"
                    />
                    <datalist id="edit-category-datalist">
                      {uniqueCategories.map(cat => (
                        <option key={cat} value={cat} />
                      ))}
                    </datalist>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-mono text-slate-500 uppercase tracking-wider font-bold">Purchase Cost (INR)</label>
                    <input
                      type="number"
                      value={editingAsset.purchaseCost || ""}
                      onChange={(e) => setEditingAsset({ ...editingAsset, purchaseCost: Number(e.target.value) || 0 })}
                      required
                      className="w-full bg-slate-50 border border-slate-205 py-2.5 px-3.5 rounded-xl text-xs font-semibold focus:border-[#003791] outline-none font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono text-slate-500 uppercase tracking-wider font-bold">Serial Number Tag</label>
                    <input
                      type="text"
                      value={editingAsset.serialNumber || ""}
                      onChange={(e) => setEditingAsset({ ...editingAsset, serialNumber: e.target.value })}
                      required
                      className="w-full bg-slate-50 border border-slate-205 py-2.5 px-3.5 rounded-xl text-xs font-semibold font-mono focus:border-[#003791] outline-none border-dashed"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-mono text-slate-500 uppercase tracking-wider font-bold">Initial Status</label>
                    <select
                      value={editingAsset.status || "idle"}
                      onChange={(e) => setEditingAsset({ ...editingAsset, status: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-205 py-2.5 px-3 rounded-xl text-xs font-semibold focus:border-[#003791] outline-none"
                    >
                      <option value="idle">Available / Idle</option>
                      <option value="rented">On Active Rent</option>
                      <option value="maintenance">Under Maintenance</option>
                    </select>
                  </div>
                </div>

                {/* Ownership reassign dropdown */}
                <div className="space-y-1.5 bg-slate-50 p-4 rounded-xl border border-slate-150">
                  <div className="flex items-center gap-1">
                    <UserCheck className="w-4 h-4 text-[#003791]" />
                    <label className="text-[10px] font-mono text-slate-650 uppercase tracking-wider font-extrabold block">Reassign Portfolio Owner</label>
                  </div>
                  <select
                    value={editingAsset.ownerId || "unassigned"}
                    onChange={(e) => setEditingAsset({ ...editingAsset, ownerId: e.target.value })}
                    className="w-full bg-white border border-slate-205 py-2.5 px-3 rounded-xl text-xs font-semibold focus:border-[#003791] outline-none shadow-2xs mt-1"
                  >
                    <option value="unassigned">🔥 Keep in Unassigned Open Pool</option>
                    {users.map((user) => (
                      <option key={user.id} value={user.id}>
                        👤 {user.name} ({user.email}) [{user.role || 'user'}]
                      </option>
                    ))}
                  </select>
                  <p className="text-[9px] text-slate-400 mt-1 leading-normal font-medium">
                    Re-budgeting ownership routes generated dividends and invoices directly into the target partner's live account aggregates instantly.
                  </p>
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsEditAssetModalOpen(false)}
                    className="px-5 py-3 rounded-xl bg-slate-100 font-bold text-xs uppercase hover:bg-slate-200 transition-colors cursor-pointer text-slate-600"
                  >
                    Cancel Action
                  </button>
                  <button
                    type="submit"
                    disabled={isSavingAsset}
                    className="px-6 py-3 rounded-xl bg-[#003791] hover:bg-blue-800 text-white font-extrabold text-xs uppercase transition-all shadow-xs flex items-center gap-1 cursor-pointer"
                  >
                    {isSavingAsset && <Loader2 className="w-4 h-4 animate-spin" />}
                    Save Configuration
                  </button>
                </div>

              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* B. Manage Investors Modal */}
      <AnimatePresence>
        {isManageInvestorsModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                if (editingUserId) setEditingUserId(null);
                setIsManageInvestorsModalOpen(false);
              }}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-200 w-full max-w-4xl relative z-10 text-slate-800 overflow-hidden flex flex-col max-h-[85vh]"
            >
              <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 mb-5 font-sans">
                <div className="space-y-0.5">
                  <span className="text-[10px] font-mono uppercase font-bold text-[#003791] tracking-widest">LEDGER MEMBERS REGISTRY</span>
                  <h3 className="text-xl font-extrabold text-slate-900">Manage Registered Accounts & Deposits</h3>
                </div>
                <button
                  onClick={() => {
                    setEditingUserId(null);
                    setIsManageInvestorsModalOpen(false);
                  }}
                  className="p-1.5 text-slate-400 hover:text-slate-650 transition-colors cursor-pointer border border-slate-100 hover:bg-slate-50 rounded-full"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Table Container */}
              <div className="overflow-y-auto flex-grow bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <table className="min-w-full text-left font-sans">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 text-sm font-semibold uppercase tracking-wider">
                    <tr>
                      <th className="py-4 px-6">Subscriber Identity</th>
                      <th className="py-4 px-6">Role</th>
                      <th className="py-4 px-6 text-right">Invested Capital</th>
                      <th className="py-4 px-6 text-right">Withdrawn Cash</th>
                      <th className="py-4 px-6 text-center font-bold">Operational Controls</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {users.map((user) => {
                      const isEditing = editingUserId === user.id;

                      return (
                        <tr key={user.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                          
                          {/* Name & Mail */}
                          <td className="py-4 px-6 text-slate-800 text-sm">
                            {isEditing ? (
                              <input
                                type="text"
                                value={editUserName}
                                onChange={(e) => setEditUserName(e.target.value)}
                                className="bg-slate-50 border border-slate-250 py-1.5 px-2.5 rounded-lg text-xs font-semibold focus:border-[#003791] outline-none w-full max-w-xs text-slate-900"
                              />
                            ) : (
                              <div>
                                <h4 className="font-extrabold text-slate-900 leading-tight block">{user.name}</h4>
                                <span className="text-[10px] text-slate-450 block truncate font-mono mt-0.5">{user.email}</span>
                              </div>
                            )}
                          </td>

                          {/* Role selector */}
                          <td className="py-4 px-6 text-slate-800 text-sm whitespace-nowrap">
                            {isEditing ? (
                              <select
                                value={editUserRole}
                                onChange={(e) => setEditUserRole(e.target.value)}
                                className="bg-slate-50 border border-slate-205 py-1 px-2 rounded-lg text-xs font-semibold outline-none focus:border-[#003791]"
                              >
                                <option value="admin">Operator (admin)</option>
                                <option value="partner">Partner (partner)</option>
                                <option value="user">General User (user)</option>
                              </select>
                            ) : (
                              <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                                user.role === 'admin' 
                                  ? 'bg-[#003791]/10 text-[#003791]' 
                                  : user.role === 'partner'
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-slate-100 text-slate-600'
                              }`}>
                                {user.role || 'user'}
                              </span>
                            )}
                          </td>

                          {/* Invested Cash */}
                          <td className="py-4 px-6 text-sm text-right font-mono font-bold">
                            {isEditing ? (
                              <input
                                type="number"
                                value={editUserInvested}
                                onChange={(e) => setEditUserInvested(e.target.value)}
                                className="bg-slate-50 border border-slate-250 py-1.5 px-2.5 rounded-lg text-xs text-right font-bold focus:border-[#003791] outline-none max-w-28 text-slate-900"
                              />
                            ) : (
                              <span className="text-green-600 font-semibold">{formatRupees(user.investedAmount || 0)}</span>
                            )}
                          </td>

                          {/* Withdrawn Funds */}
                          <td className="py-4 px-6 text-sm text-right font-mono font-semibold">
                            {isEditing ? (
                              <input
                                type="number"
                                value={editUserWithdrawn}
                                onChange={(e) => setEditUserWithdrawn(e.target.value)}
                                className="bg-slate-50 border border-slate-250 py-1.5 px-2.5 rounded-lg text-xs text-right font-semibold focus:border-[#003791] outline-none max-w-28 text-slate-900"
                              />
                            ) : (
                              <span className="text-slate-505">{formatRupees(user.withdrawnFunds || 0)}</span>
                            )}
                          </td>

                          {/* Row Actions */}
                          <td className="py-4 px-6 text-sm text-center whitespace-nowrap">
                            {isEditing ? (
                              <div className="flex items-center justify-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => handleSaveUserEdit(user.id)}
                                  disabled={isSavingUser}
                                  className="p-1 px-3.5 bg-[#003791] hover:bg-blue-800 text-white rounded-lg text-[10px] font-bold uppercase flex items-center gap-1 transition-all"
                                >
                                  {isSavingUser ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                                  Apply
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setEditingUserId(null)}
                                  className="p-1 px-2.5 bg-slate-100 hover:bg-slate-205 text-slate-600 rounded-lg text-[10px] font-bold uppercase transition-all"
                                >
                                  Dismiss
                                </button>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleStartEditUser(user)}
                                className="px-3 py-1.5 hover:bg-slate-100 border border-slate-200 rounded-lg text-xs font-semibold text-[#003791] inline-flex items-center gap-1.5 hover:shadow-2xs"
                              >
                                <Edit2 className="w-3 h-3" />
                                Edit Ledger
                              </button>
                            )}
                          </td>

                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Close Bottom Area */}
              <div className="mt-5 flex justify-end">
                <button
                  type="button"
                  onClick={() => setIsManageInvestorsModalOpen(false)}
                  className="bg-[#003791] text-white font-extrabold text-xs uppercase px-7 py-3 rounded-xl transition-all cursor-pointer hover:bg-blue-800"
                >
                  Finished auditing
                </button>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* C. Editable Order History (Ledgers) Modal */}
      <AnimatePresence>
        {isLedgerModalOpen && selectedAssetForLedger && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                if (!editingLedgerId) setIsLedgerModalOpen(false);
              }}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-200 w-full max-w-4xl relative z-10 text-slate-800 overflow-hidden flex flex-col max-h-[85vh]"
            >
              
              {/* LEDGER BANNER HEADER */}
              <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 mb-5 font-sans">
                <div className="space-y-0.5">
                  <span className="text-[10px] font-mono uppercase font-bold text-[#003791] tracking-widest">
                    LEDGER FLOW AUDIT - {selectedAssetForLedger.serialNumber}
                  </span>
                  <h3 className="text-xl font-extrabold text-slate-900">
                    {selectedAssetForLedger.name}
                  </h3>
                  <p className="text-[10px] text-slate-400 font-medium">
                    Adjust receipts manually below. Modified values will re-adjust the parent asset's earnings index accurately.
                  </p>
                </div>
                <button
                  onClick={() => setIsLedgerModalOpen(false)}
                  className="p-1 text-slate-400 hover:text-slate-650 transition-colors cursor-pointer border border-slate-100 hover:bg-slate-50 rounded-full"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Table ledger items listing with nested in-line editor */}
              <div className="overflow-y-auto flex-grow bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                {loadingLedger ? (
                  <div className="py-12 flex flex-col items-center justify-center space-y-2">
                    <Loader2 className="w-7 h-7 text-[#003791] animate-spin" />
                    <p className="text-xs text-slate-400 font-mono">Syncing subcollection sheets...</p>
                  </div>
                ) : ledgerReceipts.length === 0 ? (
                  <div className="py-14 text-center text-slate-450 space-y-2">
                    <HelpCircle className="w-8 h-8 text-slate-300 mx-auto" />
                    <p className="text-xs font-bold text-slate-800">No rental history for this asset yet.</p>
                    <p className="text-xs text-slate-400 max-w-xs mx-auto leading-normal">
                      Use the "Log Yield" mechanism on the respective fleet asset card to log manual receipt splits.
                    </p>
                  </div>
                ) : (
                  <div className="min-w-full overflow-x-auto">
                    <table className="min-w-full text-left font-sans">
                      <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 text-sm font-semibold uppercase tracking-wider">
                        <tr>
                          <th className="py-4 px-6 font-bold">Order No</th>
                          <th className="py-4 px-6 font-bold">Dates</th>
                          <th className="py-4 px-6 font-bold text-right">Total Revenue</th>
                          <th className="py-4 px-6 font-bold text-right">Operating Expenses</th>
                          <th className="py-4 px-6 font-bold text-right text-[#003791]">Partner Net Earnings</th>
                          <th className="py-4 px-6 font-bold text-center font-bold">Reconciliations</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 bg-white">
                        {ledgerReceipts.map((ledger) => {
                          const isEditing = editingLedgerId === ledger.id;

                          return (
                            <tr key={ledger.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                              
                              {/* Order number */}
                              <td className="py-4 px-6 text-slate-800 text-sm whitespace-nowrap font-mono font-black">
                                {isEditing ? (
                                  <input
                                    type="text"
                                    value={editLedgerOrderNo}
                                    onChange={(e) => setEditLedgerOrderNo(e.target.value)}
                                    className="bg-slate-50 border border-slate-250 p-1 px-2.5 rounded-lg font-mono text-xs font-bold w-24 text-slate-900"
                                  />
                                ) : (
                                  ledger.orderNumber
                                )}
                              </td>

                              {/* Dates details */}
                              <td className="py-4 px-6 text-[13px] whitespace-nowrap font-medium text-slate-500">
                                {isEditing ? (
                                  <div className="flex items-center gap-1">
                                    <input
                                      type="date"
                                      value={editLedgerStart}
                                      onChange={(e) => setEditLedgerStart(e.target.value)}
                                      className="bg-slate-50 border border-slate-205 p-1 rounded-md text-[10px]"
                                    />
                                    <span className="text-slate-350">-</span>
                                    <input
                                      type="date"
                                      value={editLedgerEnd}
                                      onChange={(e) => setEditLedgerEnd(e.target.value)}
                                      className="bg-slate-50 border border-slate-205 p-1 rounded-md text-[10px]"
                                    />
                                  </div>
                                ) : (
                                  `${ledger.startDate} - ${ledger.endDate}`
                                )}
                              </td>

                              {/* Gross Revenue */}
                              <td className="py-4 px-6 text-sm text-right font-mono font-extrabold text-slate-800">
                                {isEditing ? (
                                  <input
                                    type="number"
                                    value={editLedgerGross}
                                    onChange={(e) => setEditLedgerGross(e.target.value)}
                                    className="bg-slate-50 border border-slate-250 p-1 px-2 text-right font-mono text-xs font-bold max-w-24 text-slate-900"
                                  />
                                ) : (
                                  formatRupees(ledger.grossRevenue)
                                )}
                              </td>

                              {/* platformFee / expenses override */}
                              <td className="py-4 px-6 text-sm text-right font-mono text-slate-505">
                                {isEditing ? (
                                  <input
                                    type="number"
                                    value={editLedgerExpenses}
                                    onChange={(e) => setEditLedgerExpenses(e.target.value)}
                                    className="bg-slate-50 border border-slate-250 p-1 px-2 text-right font-mono text-xs max-w-24 text-slate-500"
                                  />
                                ) : (
                                  formatRupees(ledger.platformFee)
                                )}
                              </td>

                              {/* partnerShare / partner Net Earnings */}
                              <td className="py-4 px-6 text-sm text-right font-mono font-black text-green-600 bg-green-50/15">
                                {isEditing ? (
                                  <input
                                    type="number"
                                    value={editLedgerShare}
                                    onChange={(e) => setEditLedgerShare(e.target.value)}
                                    className="bg-slate-50 border border-slate-250 p-1 px-2 text-right font-mono text-xs font-black max-w-24 text-emerald-700 bg-emerald-50/30"
                                  />
                                ) : (
                                  <span className="text-green-600 font-semibold">{formatRupees(ledger.partnerShare)}</span>
                                )}
                              </td>

                              {/* Actions reconciliation */}
                              <td className="py-4 px-6 text-sm text-center whitespace-nowrap">
                                {isEditing ? (
                                  <div className="flex items-center justify-center gap-1.5">
                                    <button
                                      type="button"
                                      onClick={() => handleSaveLedgerEdit(ledger.id)}
                                      disabled={isSavingLedger}
                                      className="p-1 px-3 bg-[#003791] hover:bg-blue-800 text-white font-bold uppercase rounded-md text-[9px] inline-flex items-center gap-0.5"
                                    >
                                      {isSavingLedger ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                                      Save
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setEditingLedgerId(null)}
                                      className="p-1 px-2 bg-slate-100 border border-slate-205 text-slate-600 rounded-md text-[9px]"
                                    >
                                      Back
                                    </button>
                                  </div>
                                ) : (
                                  <div className="flex items-center justify-center gap-2">
                                    <button
                                      type="button"
                                      onClick={() => handleOpenEditLedger(ledger)}
                                      className="p-2.5 hover:bg-slate-105 border border-slate-200 text-[#003791] rounded-xl transition-all inline-flex items-center shadow-3xs"
                                      title="Edit Ledger Sheet"
                                    >
                                      <Edit2 className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteLedger(ledger.id)}
                                      className="p-2.5 hover:bg-[#ffebee] border border-transparent text-rose-600 rounded-xl transition-all inline-flex items-center"
                                      title="Delete Ledger Sheet"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                )}
                              </td>

                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Bottom modal end */}
              <div className="mt-5 flex justify-end">
                <button
                  type="button"
                  onClick={() => setIsLedgerModalOpen(false)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-705 border border-slate-205 font-bold text-xs uppercase px-7 py-3 rounded-xl transition-colors cursor-pointer"
                >
                  Dismiss Ledger Sheets
                </button>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Manual log booking sub-modal */}
      <AnimatePresence>
        {isReceiptModalOpen && selectedAssetForReceipt && (
          <div className="fixed inset-0 z-55 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsReceiptModalOpen(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-200 w-full max-w-lg relative z-10 text-slate-800"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-5 font-sans">
                <div className="space-y-0.5">
                  <span className="text-[10px] uppercase font-mono tracking-wider font-extrabold text-[#003791]">LEDGER DISPATCH ENGINE</span>
                  <h3 className="text-xl font-extrabold text-slate-900">Log Yield Dividend</h3>
                  <p className="text-[10px] text-slate-450 font-medium">Reconcile booking on {selectedAssetForReceipt.name}.</p>
                </div>
                <button onClick={() => setIsReceiptModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleLogBookingReceipt} className="space-y-4 font-sans">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono text-slate-500 uppercase tracking-wider font-bold">Order Number Tag</label>
                    <input
                      type="text"
                      value={orderNumber}
                      onChange={(e) => setOrderNumber(e.target.value)}
                      required
                      placeholder="e.g., AHO-4291"
                      className="w-full bg-slate-50 border border-slate-205 py-2.5 px-3.5 rounded-xl text-xs font-semibold focus:border-[#003791] outline-none font-mono"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono text-slate-500 uppercase tracking-wider font-bold">Gross Revenue (INR)</label>
                    <input
                      type="number"
                      value={grossRevenue}
                      onChange={(e) => setGrossRevenue(e.target.value)}
                      required
                      placeholder="₹"
                      className="w-full bg-slate-50 border border-slate-205 py-2.5 px-3.5 rounded-xl text-xs font-semibold focus:border-[#003791] outline-none font-mono text-[#003791]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono text-slate-500 uppercase tracking-wider font-bold">Start Date</label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      required
                      className="w-full bg-slate-50 border border-slate-205 py-2.5 px-3.5 rounded-xl text-xs font-semibold focus:border-[#003791] outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono text-slate-500 uppercase tracking-wider font-bold">End Date</label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      required
                      className="w-full bg-slate-50 border border-slate-205 py-2.5 px-3.5 rounded-xl text-xs font-semibold focus:border-[#003791] outline-none"
                    />
                  </div>
                </div>

                {/* Splittages Live Preview */}
                <div className="bg-slate-50 border border-slate-150 rounded-2xl p-4 space-y-2 text-xs font-mono text-slate-650">
                  <span className="text-[9px] uppercase tracking-wider font-bold block text-slate-400">Yield Splits Preview</span>
                  <div className="flex justify-between items-center text-[11px]">
                    <span>Operating Expenses:</span>
                    <strong className="text-slate-800">{formatRupees(platformFee)}</strong>
                  </div>
                  <div className="flex justify-between items-center text-[11px]">
                    <span>Fulfillment Net Profit:</span>
                    <strong className="text-slate-800">{formatRupees(netProfit)}</strong>
                  </div>
                  <div className="flex justify-between items-center text-[13px] bg-[#003791]/5 p-2 rounded-lg border border-[#003791]/10 text-[#003791]">
                    <span className="font-extrabold">Partner Net Earnings (50%):</span>
                    <strong className="font-black">{formatRupees(partnerShare)}</strong>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsReceiptModalOpen(false)}
                    className="px-5 py-3 rounded-xl bg-slate-100 font-bold text-xs uppercase hover:bg-slate-200 transition-colors cursor-pointer text-slate-650"
                  >
                    Dismiss
                  </button>
                  <button
                    type="submit"
                    disabled={isLoggingReceipt}
                    className="px-6 py-3 rounded-xl bg-[#003791] hover:bg-blue-800 text-white font-extrabold text-xs uppercase transition-all shadow-xs flex items-center gap-1 cursor-pointer"
                  >
                    {isLoggingReceipt && <Loader2 className="w-4 h-4 animate-spin" />}
                    Confirm Splits & Dispatch
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Global Add Asset Drawer Modal */}
      <AnimatePresence>
        {isAddAssetModalOpen && (
          <div className="fixed inset-0 z-55 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAddAssetModalOpen(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-200 w-full max-w-lg relative z-10 text-slate-800"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-5 font-sans">
                <div className="space-y-0.5">
                  <span className="text-[10px] uppercase font-mono tracking-wider font-extrabold text-[#003791]">FLEET EXPANSION</span>
                  <h3 className="text-xl font-extrabold text-slate-900">Ingest New Asset Item</h3>
                  <p className="text-[10px] text-slate-450">Instantiate physical console or gear configuration sheet.</p>
                </div>
                <button onClick={() => setIsAddAssetModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateAsset} className="space-y-4 font-sans text-xs font-semibold text-slate-700">
                <div className="space-y-1">
                  <label className="text-[10px] font-mono text-slate-550 uppercase tracking-wider font-bold block">Asset Name / Brand Label</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., PS5 Pro Console Edition"
                    value={newAssetName}
                    onChange={(e) => setNewAssetName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-205 py-2.5 px-3.5 rounded-xl focus:border-[#003791] outline-none font-sans"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono text-slate-555 uppercase tracking-wider font-bold block">Asset Category</label>
                    <input
                      type="text"
                      list="add-category-datalist"
                      value={newAssetCategory}
                      onChange={(e) => setNewAssetCategory(e.target.value)}
                      placeholder="Select or type..."
                      className="w-full bg-slate-50 border border-slate-205 py-2.5 px-3 rounded-xl focus:border-[#003791] outline-none text-xs font-semibold"
                    />
                    <datalist id="add-category-datalist">
                      {uniqueCategories.map(cat => (
                        <option key={cat} value={cat} />
                      ))}
                    </datalist>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono text-slate-555 uppercase tracking-wider font-bold block">Purchase Cost (INR)</label>
                    <input
                      type="number"
                      required
                      placeholder="₹"
                      value={newAssetCost}
                      onChange={(e) => setNewAssetCost(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-205 py-2.5 px-3.5 rounded-xl font-mono focus:border-[#003791] outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-mono text-slate-555 uppercase tracking-wider font-bold block">Unique Serial Number Tag</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., SN-AHO-PS5-9011X"
                    value={newAssetSerial}
                    onChange={(e) => setNewAssetSerial(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-205 py-2.5 px-3.5 rounded-xl font-mono focus:border-[#003791] outline-none border-dashed"
                  />
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsAddAssetModalOpen(false)}
                    className="px-5 py-3 rounded-xl bg-slate-100 font-bold text-xs uppercase hover:bg-slate-200 transition-colors text-slate-650 cursor-pointer"
                  >
                    Dismiss
                  </button>
                  <button
                    type="submit"
                    disabled={isAddingAsset}
                    className="px-6 py-3 rounded-xl bg-[#003791] hover:bg-blue-800 text-white font-extrabold text-xs uppercase transition-all shadow-xs flex items-center gap-1 cursor-pointer"
                  >
                    {isAddingAsset && <Loader2 className="w-4 h-4 animate-spin" />}
                    Confirm Ingestion
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Dynamic Combo Order Mathematical Engine Modal */}
      <AnimatePresence>
        {isComboModalOpen && (
          <div className="fixed inset-0 z-55 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsComboModalOpen(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-200 w-full max-w-3xl relative z-10 text-slate-800 overflow-y-auto max-h-[90vh] flex flex-col justify-between"
            >
              {/* Modal Head */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-5 font-sans">
                <div className="space-y-0.5">
                  <span className="text-[10px] uppercase font-mono tracking-wider font-extrabold text-[#003791]">
                    💼 COMBINATION BATCH ALLOCATOR
                  </span>
                  <h3 className="text-xl font-bold text-slate-900">
                    Combo Order Math Pro Engine
                  </h3>
                  <p className="text-[10px] text-slate-500">
                    Distribute multi-device combo orders, run dynamic add-on extractions, select split shares, and commit FIFO timestamps automatically.
                  </p>
                </div>
                <button 
                  type="button"
                  onClick={() => setIsComboModalOpen(false)} 
                  className="p-1 px-2 border border-slate-200 rounded-lg text-slate-450 hover:text-slate-650 hover:bg-slate-50 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Body */}
              <form onSubmit={handleSaveComboOrder} className="space-y-6 font-sans text-xs font-semibold text-slate-700">
                
                {/* 1. Order Details */}
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-150 space-y-3">
                  <h4 className="text-[10px] font-mono text-[#003791] uppercase tracking-widest font-black">
                    1. Identity & Schedule
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Order Code</label>
                      <input
                        type="text"
                        required
                        value={comboOrderNo}
                        onChange={(e) => setComboOrderNo(e.target.value)}
                        className="w-full bg-white border border-slate-205 py-2 px-3 rounded-xl focus:border-[#003791] outline-none font-mono font-bold"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Start Date</label>
                      <input
                        type="date"
                        required
                        value={comboStartDate}
                        onChange={(e) => setComboStartDate(e.target.value)}
                        className="w-full bg-white border border-slate-205 py-1.5 px-3 rounded-xl focus:border-[#003791] outline-none font-mono"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">End Date</label>
                      <input
                        type="date"
                        required
                        value={comboEndDate}
                        onChange={(e) => setComboEndDate(e.target.value)}
                        className="w-full bg-white border border-slate-205 py-1.5 px-3 rounded-xl focus:border-[#003791] outline-none font-mono"
                      />
                    </div>
                  </div>
                </div>

                {/* 2. Gross Revenue & Add-ons */}
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-150 space-y-4">
                  <div className="flex justify-between items-center">
                    <h4 className="text-[10px] font-mono text-[#003791] uppercase tracking-widest font-black">
                      2. Gross Revenue & Add-ons Extractions
                    </h4>
                    <span className="text-[10px] bg-slate-200 text-slate-700 px-2 py-0.5 rounded-full font-mono">
                      Gross: ₹{comboGrossVal.toLocaleString()}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">
                        Total Customer Payment (Gross Revenue)
                      </label>
                      <input
                        type="number"
                        required
                        placeholder="e.g., 25000"
                        value={comboGrossRevenue}
                        onChange={(e) => setComboGrossRevenue(e.target.value)}
                        className="w-full bg-white border border-slate-205 py-2.5 px-3.5 rounded-xl font-mono focus:border-[#003791] outline-none text-sm text-slate-900"
                      />
                    </div>

                    <div className="space-y-1 border-l sm:border-l border-slate-200 pl-0 sm:pl-4 flex flex-col justify-center">
                      <p className="text-[9px] uppercase font-bold text-slate-400">Math Rule A (Add-on Extraction):</p>
                      <p className="text-slate-500 font-medium leading-relaxed font-sans text-[10px]">
                        Any custom Add-on item with an absolute price <strong className="text-rose-600 font-bold">under ₹400</strong> is automatically extracted and excluded from the Rentable Revenue base logic.
                      </p>
                    </div>
                  </div>

                  {/* Dynamic Add-on rows */}
                  <div className="space-y-2 border-t border-slate-200 pt-3">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] text-slate-550 font-bold uppercase block">Dynamic Add-on Slots</span>
                      <button
                        type="button"
                        onClick={handleAddAddon}
                        className="px-3 py-1 bg-white border border-slate-250 text-slate-700 hover:text-[#003791] hover:border-[#003791] rounded-lg text-[10px] font-bold uppercase tracking-widest cursor-pointer flex items-center gap-1 hover:shadow-xs transition-all"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Add Add-on Row
                      </button>
                    </div>

                    {comboAddons.length === 0 ? (
                      <p className="text-[10px] italic text-slate-400 font-medium">No specialized add-on items added yet.</p>
                    ) : (
                      <div className="space-y-2">
                        {comboAddons.map((addon) => (
                          <div key={addon.id} className="flex items-center gap-2 bg-white p-2 rounded-xl border border-slate-150">
                            <input
                              type="text"
                              required
                              placeholder="Add-on Name (e.g., Extra Controller)"
                              value={addon.name}
                              onChange={(e) => handleUpdateAddon(addon.id, "name", e.target.value)}
                              className="flex-grow bg-slate-50 border border-slate-200 rounded-lg p-1.5 px-2.5 text-xs focus:border-[#003791] outline-none font-semibold text-slate-800"
                            />
                            <div className="flex items-center gap-1.5 w-32 shrink-0">
                              <span className="text-slate-450 font-mono text-xs">₹</span>
                              <input
                                type="number"
                                required
                                placeholder="Price"
                                value={addon.price || ""}
                                onChange={(e) => handleUpdateAddon(addon.id, "price", e.target.value)}
                                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-1.5 px-2 font-mono text-xs focus:border-[#003791] outline-none text-right"
                              />
                            </div>
                            <button
                              type="button"
                              onClick={() => handleRemoveAddon(addon.id)}
                              className="p-2 border border-slate-100 hover:border-red-200 hover:bg-red-50 text-slate-450 hover:text-red-600 rounded-lg cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {extractedAddonsSum > 0 && (
                      <div className="bg-rose-50 text-rose-800 p-2.5 rounded-xl border border-rose-100 flex justify-between items-center font-mono text-[10px]">
                        <span>Extracted Add-on Deductions:</span>
                        <span className="font-extrabold">- ₹{extractedAddonsSum.toLocaleString()}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* 3. Operating Expense Re-calibration */}
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-150 space-y-3">
                  <div className="flex justify-between items-center">
                    <h4 className="text-[10px] font-mono text-[#003791] uppercase tracking-widest font-black">
                      3. Operating Expense & Net Base Calculus
                    </h4>
                    <span className="text-[10px] text-slate-500 font-medium col-span-2">
                      Rentable revenue: <strong className="text-slate-900 font-extrabold">₹{rentableRevenue.toLocaleString()}</strong>
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">
                        Operating Expense (OpEx Cut)
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          required
                          value={operatingExpense}
                          onChange={(e) => {
                            setOperatingExpense(e.target.value);
                            setIsOpExCustom(true);
                          }}
                          className="w-full bg-white border border-slate-205 py-2 px-3 rounded-xl font-mono focus:border-[#003791] outline-none text-xs"
                        />
                        {isOpExCustom && (
                          <button
                            type="button"
                            onClick={() => {
                              setIsOpExCustom(false);
                            }}
                            className="shrink-0 px-2.5 py-2.5 bg-[#003791]/10 text-[#003791] text-[10px] rounded-xl hover:bg-[#003791]/20 font-bold uppercase tracking-wider cursor-pointer border border-[#003791]/20"
                          >
                            Reset (30%)
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col justify-center text-slate-500 font-medium text-[10px]">
                      <p className="text-[9px] uppercase font-bold text-slate-450 leading-normal">Operational Margin Rule:</p>
                      <p className="leading-snug">
                        Calculates to default 30% of Rentable Revenue (₹{Math.round(rentableRevenue * 0.3).toLocaleString()}). Reconciles Net Co-profit to split equally or via custom percentages.
                      </p>
                    </div>
                  </div>
                </div>

                {/* 4. Asset Allocator Splitter */}
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-150 space-y-3">
                  <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                    <div className="space-y-0.5 animate-pulse">
                      <h4 className="text-[10px] font-mono text-[#003791] uppercase tracking-widest font-black">
                        4. Equipment Asset Allocator Splits
                      </h4>
                      <p className="text-[9px] text-slate-400 font-medium">Split the residual Net Profit (₹{comboNetProfit.toLocaleString()}) among multiple items.</p>
                    </div>

                    <button
                      type="button"
                      onClick={handleAddAllocatorRow}
                      className="px-3 py-1 bg-white border border-slate-250 text-slate-700 hover:text-[#003791] hover:border-[#003791] rounded-lg text-[10px] font-bold uppercase tracking-widest cursor-pointer flex items-center gap-1 hover:shadow-xs transition-all"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Add Allocation Row
                    </button>
                  </div>

                  {/* List allocator rows */}
                  {allocatorRows.length === 0 ? (
                    <div className="py-2 text-rose-600 font-bold text-[10px] italic">
                      ⚠ Please add at least one asset allocation row.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {allocatorRows.map((row) => (
                        <div key={row.id} className="flex flex-col sm:flex-row sm:items-center gap-3 bg-white p-3 rounded-xl border border-slate-150 relative">
                          {/* Dropdown to select Asset */}
                          <div className="flex-grow space-y-0.5">
                            <label className="text-[8px] font-bold text-slate-400 uppercase tracking-widest font-mono">Allocate Equipment</label>
                            <select
                              required
                              value={row.assetId}
                              onChange={(e) => handleUpdateAllocatorRow(row.id, "assetId", e.target.value)}
                              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-1.5 text-xs text-slate-700 outline-none focus:border-[#003791]"
                            >
                              <option value="">-- Select Fleet Device --</option>
                              {assets.map(asset => (
                                <option key={asset.id} value={asset.id}>
                                  {asset.name} ({asset.serialNumber}) [{asset.category}]
                                </option>
                              ))}
                            </select>
                          </div>

                          {/* Split shares percentage */}
                          <div className="w-28 space-y-0.5 shrink-0">
                            <label className="text-[8px] font-bold text-slate-400 uppercase tracking-widest font-mono block">Split Share (%)</label>
                            <div className="flex items-center gap-1.5">
                              <input
                                type="number"
                                required
                                min="0"
                                max="100"
                                placeholder="Splits %"
                                value={row.splitPercent || ""}
                                onChange={(e) => handleUpdateAllocatorRow(row.id, "splitPercent", e.target.value)}
                                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-1.5 font-mono text-xs focus:border-[#003791] outline-none text-right"
                              />
                              <span className="text-slate-450 font-mono">%</span>
                            </div>
                          </div>

                          <div className="pt-3.5 self-end sm:self-auto">
                            <button
                              type="button"
                              onClick={() => handleRemoveAllocatorRow(row.id)}
                              className="p-1.5 border border-slate-100 hover:border-red-200 hover:bg-red-50 text-slate-450 hover:text-red-600 rounded-lg cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Interactive Status Badge Indicator */}
                  <div className="flex items-center justify-between border-t border-slate-200 pt-3">
                    <span className="text-[10px] text-slate-500 font-bold uppercase">Allocated Spans Total:</span>
                    <div className="flex items-center gap-2">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-mono font-bold border ${
                        allocatorRows.reduce((s, r) => s + r.splitPercent, 0) === 100
                          ? "bg-emerald-50 text-emerald-800 border-emerald-250"
                          : "bg-amber-50 text-amber-700 border-amber-250"
                      }`}>
                        Sum: {allocatorRows.reduce((s, r) => s + r.splitPercent, 0)}% / 100%
                      </span>
                      {allocatorRows.reduce((s, r) => s + r.splitPercent, 0) === 100 ? (
                        <span className="text-emerald-600 font-black text-xs">✓ Valid Math</span>
                      ) : (
                        <span className="text-amber-600 font-bold text-[10px]">⚠ Ratio sum must be exactly 100%</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* 5. Live Calculations Audit Box Preview */}
                <div className="p-4 bg-slate-100 border border-slate-250 rounded-2xl space-y-3">
                  <span className="inline-flex items-center gap-1 bg-[#003791]/10 text-[#003791] border border-[#003791]/20 px-2 py-0.5 rounded-full text-[9px] uppercase font-bold tracking-widest font-mono">
                    📊 Live Calculus Preview Output
                  </span>
                  
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center border-b border-slate-200 pb-3">
                    <div className="space-y-0.5">
                      <p className="text-[9px] font-mono uppercase text-slate-400">Total Gross</p>
                      <p className="font-mono font-black text-slate-850 text-sm">₹{comboGrossVal.toLocaleString()}</p>
                    </div>
                    <div className="space-y-0.5">
                      <p className="text-[9px] font-mono uppercase text-slate-400 font-medium">Extracted Addon</p>
                      <p className="font-mono font-bold text-slate-850 text-sm">₹{extractedAddonsSum.toLocaleString()}</p>
                    </div>
                    <div className="space-y-0.5">
                      <p className="text-[9px] font-mono uppercase text-slate-400 font-medium">Operating Expense</p>
                      <p className="font-mono font-bold text-slate-850 text-sm">₹{opExVal.toLocaleString()}</p>
                    </div>
                    <div className="space-y-0.5">
                      <p className="text-[9px] font-mono uppercase text-slate-400 font-black">Net co-profit</p>
                      <p className="font-mono font-extrabold text-[#003791] text-sm">₹{comboNetProfit.toLocaleString()}</p>
                    </div>
                  </div>

                  {/* Individual calculated splits */}
                  <div className="space-y-2 pt-1">
                    <p className="text-[9px] font-mono uppercase text-slate-450 font-bold block">Assigned Ledger Yield Dispatches:</p>
                    {allocatorRows.filter(r => r.assetId !== "").map((row, i) => {
                      const selectedAsset = assets.find(a => a.id === row.assetId);
                      const computedShare = Math.round(comboNetProfit * (row.splitPercent / 100));
                      return (
                        <div key={row.id || i} className="flex justify-between items-center font-mono text-[10px] bg-white px-2.5 py-1.5 rounded-lg border border-slate-150">
                          <span className="text-slate-650 font-semibold truncate max-w-[200px] sm:max-w-sm">
                            {selectedAsset ? `${selectedAsset.name} [${selectedAsset.serialNumber}]` : `Unknown Asset [${row.assetId}]`}
                          </span>
                          <span className="font-extrabold text-[#003791] shrink-0 text-[11px]">
                            Split {row.splitPercent}%: ₹{computedShare.toLocaleString()}
                          </span>
                        </div>
                      );
                    })}
                    {allocatorRows.filter(r => r.assetId !== "").length === 0 && (
                      <p className="text-[10px] text-slate-400 italic">Configure allocator row splits above to compute dynamic ledger receipts.</p>
                    )}
                  </div>
                </div>

                {/* Submit row */}
                <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3 close-modal-group font-sans">
                  <button
                    type="button"
                    onClick={() => setIsComboModalOpen(false)}
                    className="px-5 py-3 rounded-xl bg-slate-100 font-bold text-xs uppercase hover:bg-slate-200 transition-colors text-slate-650 cursor-pointer border border-transparent"
                  >
                    Dismiss Call
                  </button>
                  <button
                    type="submit"
                    disabled={isSavingCombo || allocatorRows.reduce((s, r) => s + r.splitPercent, 0) !== 100 || allocatorRows.length === 0 || allocatorRows.some(row => row.assetId === "")}
                    className="px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white font-extrabold text-xs uppercase transition-all shadow-md flex items-center gap-1 border-transparent cursor-pointer disabled:cursor-not-allowed"
                  >
                    {isSavingCombo && <Loader2 className="w-4 h-4 animate-spin text-white" />}
                    Commit Math Batch (FIFO)
                  </button>
                </div>

              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
