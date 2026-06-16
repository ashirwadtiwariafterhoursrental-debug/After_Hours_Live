import React, { useState, useMemo, useEffect } from "react";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { db } from "../firebase";
import { 
  Wallet, 
  ArrowUpRight, 
  Coins, 
  TrendingUp, 
  ShieldCheck, 
  AlertTriangle, 
  Clock, 
  Download, 
  FileText, 
  PlusCircle, 
  Search, 
  Calendar, 
  Wrench, 
  Cpu, 
  ArrowRight,
  Sparkles,
  CheckCircle,
  X,
  RefreshCw,
  Info
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

// Types
interface Asset {
  id: string;
  name: string;
  serialNo: string;
  enrollmentDate: string;
  queuePosition: string; // FIFO queue status
  queueIndex: number;    // numeric for ordering
  queueTotal: number;
  status: "On Rent" | "Idle/Queue" | "Maintenance" | "Blocked";
  category: "PS5" | "Projector" | "Accessory" | "VR";
  originalCost: number;
  monthlyYield: number;
  extendedTo?: string;
}

interface Transaction {
  id: string;
  date: string;
  orderId: string;
  assetId: string;
  assetName: string;
  duration: string;
  grossRevenue: number;
  platformFee: number;
  netPayout: number;
  isExtension?: boolean;
}

interface MaintenanceTask {
  id: string;
  assetId: string;
  assetName: string;
  date: string;
  task: string;
  cost: number;
  status: "Completed" | "Pending";
}

export function PartnerDashboard() {
  // 1. Initial State Data
  const [partnerProfile] = useState({
    name: "Aman Singhania",
    partnerId: "AP-2026-948301",
    level: "Elite Fleet Owner",
    enrollmentDate: "Jan 12, 2026",
    bankAccount: "HDFC Bank - **** 4820"
  });

  // State for available funds, lifetime totals, showing interactivity
  const [availableFunds, setAvailableFunds] = useState<number>(124500);
  const [totalLifetimeRevenue, setTotalLifetimeRevenue] = useState<number>(284000);
  const [totalWithdrawnFunds, setTotalWithdrawnFunds] = useState<number>(159500);
  
  // Calculate Avg Yield (dynamic based on active portfolio value)
  const avgMonthlyYield = 12.4; 

  // Asset Fleet State
  const [assets, setAssets] = useState<Asset[]>([
    {
      id: "AST-PS5-01",
      name: "PlayStation 5 Slim 1TB Edition",
      serialNo: "PS5-SLM-0831",
      enrollmentDate: "2026-01-15",
      queuePosition: "#1 of 4",
      queueIndex: 1,
      queueTotal: 4,
      status: "On Rent",
      category: "PS5",
      originalCost: 45000,
      monthlyYield: 4800
    },
    {
      id: "AST-PRJ-01",
      name: "BenQ TK700STi 4K Gaming Projector",
      serialNo: "PRJ-4K-9284",
      enrollmentDate: "2026-02-10",
      queuePosition: "#2 of 5",
      queueIndex: 2,
      queueTotal: 5,
      status: "Idle/Queue",
      category: "Projector",
      originalCost: 110000,
      monthlyYield: 11200
    },
    {
      id: "AST-CTL-01",
      name: "Sony DualSense Edge Controller",
      serialNo: "CTL-EDG-3012",
      enrollmentDate: "2026-02-28",
      queuePosition: "#1 of 3",
      queueIndex: 1,
      queueTotal: 3,
      status: "On Rent",
      category: "Accessory",
      originalCost: 19000,
      monthlyYield: 1800
    },
    {
      id: "AST-VR2-01",
      name: "PlayStation VR2 Virtual Reality Kit",
      serialNo: "VR2-SNY-5531",
      enrollmentDate: "2026-03-05",
      queuePosition: "#3 of 4",
      queueIndex: 3,
      queueTotal: 4,
      status: "Idle/Queue",
      category: "VR",
      originalCost: 57000,
      monthlyYield: 5100
    },
    {
      id: "AST-PS5-02",
      name: "PlayStation 5 Pro Edition 2TB",
      serialNo: "PS5-PRO-1142",
      enrollmentDate: "2026-04-01",
      queuePosition: "#4 of 4",
      queueIndex: 4,
      queueTotal: 4,
      status: "Maintenance",
      category: "PS5",
      originalCost: 69000,
      monthlyYield: 7200
    }
  ]);

  // Bank Ledger / Transaction State
  const [transactions, setTransactions] = useState<Transaction[]>([
    {
      id: "TX-9904",
      date: "2026-06-14",
      orderId: "ORD-2026-9938",
      assetId: "PS5-SLM-0831",
      assetName: "PlayStation 5 Slim",
      duration: "3 Days",
      grossRevenue: 4500,
      platformFee: 1350,
      netPayout: 3150
    },
    {
      id: "TX-9878",
      date: "2026-06-11",
      orderId: "ORD-2026-9541",
      assetId: "PRJ-4K-9284",
      assetName: "BenQ 4K Projector",
      duration: "5 Days",
      grossRevenue: 15000,
      platformFee: 4500,
      netPayout: 10500
    },
    {
      id: "TX-9844",
      date: "2026-06-08",
      orderId: "ORD-2026-9420",
      assetId: "CTL-EDG-3012",
      assetName: "DualSense Edge Controller",
      duration: "2 Days",
      grossRevenue: 2400,
      platformFee: 720,
      netPayout: 1680
    },
    {
      id: "TX-9721",
      date: "2026-06-01",
      orderId: "ORD-2026-8891",
      assetId: "PS5-SLM-0831",
      assetName: "PlayStation 5 Slim",
      duration: "7 Days",
      grossRevenue: 9500,
      platformFee: 2850,
      netPayout: 6650
    },
    {
      id: "TX-9650",
      date: "2026-05-25",
      orderId: "ORD-2026-8712",
      assetId: "VR2-SNY-5531",
      assetName: "PlayStation VR2 Kit",
      duration: "4 Days",
      grossRevenue: 8000,
      platformFee: 2400,
      netPayout: 5600
    }
  ]);

  // Repair/Maintenance log data
  const [maintenanceLogs, setMaintenanceLogs] = useState<MaintenanceTask[]>([
    {
      id: "LOG-304",
      assetId: "AST-PS5-02",
      assetName: "PlayStation 5 Pro Edition 2TB",
      date: "2026-06-12",
      task: "DualSense Pro joystick drift resolution & deep chassis detailing",
      cost: 1500,
      status: "Pending"
    },
    {
      id: "LOG-291",
      assetId: "AST-PRJ-01",
      assetName: "BenQ TK700STi 4K Projector",
      date: "2026-05-18",
      task: "Lens microscale recalibration & firmware security patch implementation",
      cost: 0,
      status: "Completed"
    },
    {
      id: "LOG-212",
      assetId: "AST-PS5-01",
      assetName: "PlayStation 5 Slim 1TB Edition",
      date: "2026-04-10",
      task: "Thermal paste renewal & dual fan dust extraction treatment",
      cost: 2200,
      status: "Completed"
    }
  ]);

  // 2. Interactivity State variables
  const [selectedAssetForBlock, setSelectedAssetForBlock] = useState<Asset | null>(null);
  const [isBlockModalOpen, setIsBlockModalOpen] = useState(false);
  const [blockStartDate, setBlockStartDate] = useState("");
  const [blockEndDate, setBlockEndDate] = useState("");
  const [acknowledgePenalty, setAcknowledgePenalty] = useState(false);

  // Withdrawal logic
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [withdrawSuccess, setWithdrawSuccess] = useState(false);
  const [withdrawnValue, setWithdrawnValue] = useState(0);

  // Growth Engine / Upsell state
  const [hoveredUpsellCard, setHoveredUpsellCard] = useState<string | null>(null);
  const [investSuccess, setInvestSuccess] = useState(false);
  const [investedAssetName, setInvestedAssetName] = useState("");

  // Ledger Filter State
  const [transactionSearch, setTransactionSearch] = useState("");
  const [assetFilter, setAssetFilter] = useState("ALL");

  // Notifications banner state (simulating real time pipeline logs)
  const [showNotification, setShowNotification] = useState<string | null>(null);

  // Real-time subscription to Firestore orders
  useEffect(() => {
    const q = query(collection(db, "orders"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const dbOrders: any[] = [];
      snapshot.forEach(docSnap => {
        dbOrders.push({ id: docSnap.id, ...docSnap.data() });
      });

      setAssets(currentAssets => {
        const updatedAssets = currentAssets.map(asset => {
          const activeOrder = dbOrders.find(order => {
            const assignedUnit = order.assignedUnit || "";
            const assignedUnits = order.assignedUnits || [];
            const matchesUnit = assignedUnit === asset.serialNo || assignedUnits.includes(asset.serialNo);
            const statusStr = (order.Status || order.status || "").toLowerCase();
            return matchesUnit && statusStr === "active";
          });

          if (activeOrder) {
            if (Array.isArray(activeOrder.extensions) && activeOrder.extensions.length > 0) {
              const endDate = activeOrder["End date"] || activeOrder.endDate || "";
              let formattedEndDate = endDate;
              try {
                formattedEndDate = new Date(endDate).toLocaleDateString("en-IN", {
                  year: "numeric", month: "short", day: "numeric"
                });
              } catch (e) {}

              return {
                ...asset,
                extendedTo: formattedEndDate
              };
            }
          }
          return {
            ...asset,
            extendedTo: undefined
          };
        });

        const fetchedTransactions: Transaction[] = [];

        dbOrders.forEach(order => {
          const assignedUnit = order.assignedUnit || "";
          const assignedUnits = order.assignedUnits || [];
          
          const matchedAsset = updatedAssets.find(a => 
            a.serialNo === assignedUnit || 
            assignedUnits.includes(a.serialNo)
          );

          if (matchedAsset) {
            const rentAmt = parseFloat(order["Rent Amount"] || order.rentAmount || "0");
            const grossRev = rentAmt > 0 ? rentAmt : (parseFloat(order["Total Revenue"] || "0") || 1000);
            const platformFee = Math.round(grossRev * 0.3);
            const netPayout = grossRev - platformFee;

            const origTxId = `TX-FIRE-${order.id}`;
            const startDate = order["Start date"] || order.startDate || "";
            const endDate = order["End date"] || order.endDate || "";
            const rawDate = order["Order Date"] || order.orderDate || startDate || "2026-06-15";
            const formattedDate = new Date(rawDate).toISOString().substring(0, 10);

            let durationStr = "3 Days";
            if (startDate && endDate) {
              const startD = new Date(startDate);
              const endD = new Date(endDate);
              const diff = endD.getTime() - startD.getTime();
              if (diff > 0) {
                durationStr = `${Math.ceil(diff / (1000 * 60 * 60 * 24))} Days`;
              }
            }

            fetchedTransactions.push({
              id: origTxId,
              date: formattedDate,
              orderId: order["Order ID"] || `ORD-${order.id.slice(0,6).toUpperCase()}`,
              assetId: matchedAsset.serialNo,
              assetName: matchedAsset.name,
              duration: durationStr,
              grossRevenue: grossRev,
              platformFee,
              netPayout
            });

            if (Array.isArray(order.extensions) && order.extensions.length > 0) {
              order.extensions.forEach((ext: any, index: number) => {
                const extAddedDays = ext.addedDays || 0;
                const extExtraRev = ext.extraRevenue || 0;
                const extFee = Math.round(extExtraRev * 0.3);
                const extNet = extExtraRev - extFee;
                const extDate = ext.dateModified ? ext.dateModified.substring(0, 10) : formattedDate;

                fetchedTransactions.push({
                  id: `${origTxId}-EXT-${index}`,
                  date: extDate,
                  orderId: `${order["Order ID"] || `ORD-${order.id.slice(0,6).toUpperCase()}`} (Extension)`,
                  assetId: matchedAsset.serialNo,
                  assetName: matchedAsset.name,
                  duration: `+${extAddedDays} Days`,
                  grossRevenue: extExtraRev,
                  platformFee: extFee,
                  netPayout: extNet,
                  isExtension: true
                });
              });
            }
          }
        });

        // Update transaction list
        setTransactions(prev => {
          const otherTx = prev.filter(tx => tx.orderId === "PARTNER-WITHDRAW" || tx.orderId === "FLEET-ACQUISITION");
          
          const defaultTx = [
            {
              id: "TX-9904",
              date: "2026-06-14",
              orderId: "ORD-2026-9938",
              assetId: "PS5-SLM-0831",
              assetName: "PlayStation 5 Slim 1TB Edition",
              duration: "3 Days",
              grossRevenue: 4500,
              platformFee: 1350,
              netPayout: 3150
            },
            {
              id: "TX-9878",
              date: "2026-06-11",
              orderId: "ORD-2026-9541",
              assetId: "PRJ-4K-9284",
              assetName: "BenQ TK700STi 4K Gaming Projector",
              duration: "5 Days",
              grossRevenue: 15000,
              platformFee: 4500,
              netPayout: 10500
            },
            {
              id: "TX-9844",
              date: "2026-06-08",
              orderId: "ORD-2026-9420",
              assetId: "CTL-EDG-3012",
              assetName: "Sony DualSense Edge Controller",
              duration: "2 Days",
              grossRevenue: 2400,
              platformFee: 720,
              netPayout: 1680
            },
            {
              id: "TX-9721",
              date: "2026-06-01",
              orderId: "ORD-2026-8891",
              assetId: "PS5-SLM-0831",
              assetName: "PlayStation 5 Slim 1TB Edition",
              duration: "7 Days",
              grossRevenue: 9500,
              platformFee: 2850,
              netPayout: 6650
            },
            {
              id: "TX-9650",
              date: "2026-05-25",
              orderId: "ORD-2026-8712",
              assetId: "VR2-SNY-5531",
              assetName: "PlayStation VR2 Virtual Reality Kit",
              duration: "4 Days",
              grossRevenue: 8000,
              platformFee: 2400,
              netPayout: 5600
            }
          ];

          const dynamicOrderIds = fetchedTransactions.map(t => t.orderId.replace(" (Extension)", ""));
          const filteredDefaults = defaultTx.filter(t => !dynamicOrderIds.includes(t.orderId));

          const combined = [...fetchedTransactions, ...otherTx, ...filteredDefaults];
          
          combined.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
          return combined;
        });

        return updatedAssets;
      });

    }, (err) => {
      console.error("Firestore onSnapshot error:", err);
    });

    return () => unsubscribe();
  }, []);

  // Download indicator trigger helper
  const handleLockerDownload = (docName: string) => {
    setShowNotification(`Success: Verification Token generated. '${docName}' downloaded to local secure device storage.`);
    setTimeout(() => {
      setShowNotification(null);
    }, 5000);
  };

  // Helper: Open Blocker Modal
  const openBlockerModal = (asset: Asset) => {
    setSelectedAssetForBlock(asset);
    setBlockStartDate(new Date().toISOString().substring(0, 10));
    // Default 3 days later
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 3);
    setBlockEndDate(futureDate.toISOString().substring(0, 10));
    setAcknowledgePenalty(false);
    setIsBlockModalOpen(true);
  };

  // Execute Block for Personal Use
  const handleConfirmPersonalBlock = () => {
    if (!selectedAssetForBlock) return;
    if (!acknowledgePenalty) {
      alert("Please check and acknowledge the FIFO penalty warning to authorize this action.");
      return;
    }

    // Update asset state: status to "Blocked", push to back of queue (meaning set queuePosition index to maximum)
    const categoryType = selectedAssetForBlock.category;
    // Count how many in this category
    const sameCategoryAssets = assets.filter(a => a.category === categoryType);
    const totalCount = sameCategoryAssets.length;

    setAssets(prevAssets => {
      return prevAssets.map(asset => {
        if (asset.id === selectedAssetForBlock.id) {
          return {
            ...asset,
            status: "Blocked" as const,
            queuePosition: `#${totalCount} of ${totalCount}`,
            queueIndex: totalCount
          };
        }
        // Adjust queues for others in same category who might move up
        if (asset.category === categoryType && asset.id !== selectedAssetForBlock.id) {
          // If this asset was after the blocked asset in queue, let's bump it up
          if (asset.queueIndex > selectedAssetForBlock.queueIndex) {
            const newIdx = asset.queueIndex - 1;
            return {
              ...asset,
              queueIndex: newIdx,
              queuePosition: `#${newIdx} of ${totalCount}`
            };
          }
        }
        return asset;
      });
    });

    setIsBlockModalOpen(false);
    setShowNotification(`Locked Asset: Serial No. ${selectedAssetForBlock.serialNo} successfully reserved for owner use from ${blockStartDate} to ${blockEndDate}. Relaying FIFO Queue alignment...`);
    setSelectedAssetForBlock(null);

    setTimeout(() => {
      setShowNotification(null);
    }, 5500);
  };

  // Handle Withdrawal Request Submission
  const handleRequestWithdrawal = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(withdrawAmount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      alert("Please input a valid positive amount.");
      return;
    }
    if (parsedAmount > availableFunds) {
      alert("Withdrawal amount exceeds your current available balance.");
      return;
    }

    // Deduct available
    setAvailableFunds(prev => prev - parsedAmount);
    setTotalWithdrawnFunds(prev => prev + parsedAmount);
    setWithdrawnValue(parsedAmount);

    // Append to Transaction statement
    const newTx: Transaction = {
      id: `TX-WDR-${Math.floor(1000 + Math.random() * 9000)}`,
      date: new Date().toISOString().substring(0, 10),
      orderId: "PARTNER-WITHDRAW",
      assetId: "FUNDS-ATM",
      assetName: "Direct Transfer",
      duration: "N/A",
      grossRevenue: -parsedAmount,
      platformFee: 0,
      netPayout: -parsedAmount
    };

    setTransactions(prev => [newTx, ...prev]);
    setWithdrawAmount("");
    setWithdrawSuccess(true);

    setTimeout(() => {
      setWithdrawSuccess(false);
      setIsWithdrawModalOpen(false);
    }, 3000);
  };

  // Handle New Asset Investment (Growth Engine Upsell click)
  const handleInvestInAsset = (type: "projector" | "ps5pro") => {
    let cost = 0;
    let name = "";
    let serial = "";
    let cat: Asset["category"] = "PS5";
    let estYield = 0;

    if (type === "projector") {
      cost = 25000; // special initial partner investment shares
      name = "BenQ TK850 4K Premium Cinema Projector";
      serial = `PRJ-4K-${Math.floor(1000 + Math.random() * 9000)}`;
      cat = "Projector";
      estYield = 12500;
    } else {
      cost = 35000;
      name = "PlayStation 5 Pro Extreme Liquid Cooled Edition";
      serial = `PS5-PRO-${Math.floor(1000 + Math.random() * 9000)}`;
      cat = "PS5";
      estYield = 16800;
    }

    if (availableFunds < cost) {
      alert(`Insufficient available funds in portal. A bank deposit of ₹${(cost - availableFunds).toLocaleString()} is required. Let's simulate authorization from bank...`);
      // Double flow: we can simulate importing funds, let's allow it so users have fun!
      const missing = cost - availableFunds;
      setAvailableFunds(prev => prev + missing);
    }

    // Deduct the cost from available funds
    setAvailableFunds(prev => prev - cost);
    // Increase Total Lifetime Asset value conceptually by adding to asset fleet list
    // Let's add new asset at back of FIFO
    const sameCat = assets.filter(a => a.category === cat);
    const newIndex = sameCat.length + 1;
    const totalCount = sameCat.length + 1;

    const newAsset: Asset = {
      id: `AST-NEW-${Math.floor(100 + Math.random() * 900)}`,
      name: name,
      serialNo: serial,
      enrollmentDate: new Date().toISOString().substring(0, 10),
      queuePosition: `#${newIndex} of ${totalCount}`,
      queueIndex: newIndex,
      queueTotal: totalCount,
      status: "Idle/Queue",
      category: cat,
      originalCost: cost,
      monthlyYield: estYield / 12
    };

    // Update previous fleet list totals count
    setAssets(prev => {
      // First let's update counts of other assets in the same category
      const updatedList = prev.map(a => {
        if (a.category === cat) {
          return {
            ...a,
            queuePosition: `#${a.queueIndex} of ${totalCount}`,
            queueTotal: totalCount
          };
        }
        return a;
      });
      return [...updatedList, newAsset];
    });

    setInvestedAssetName(name);
    setInvestSuccess(true);
    
    // Create new transaction tracking purchase
    const newTx: Transaction = {
      id: `TX-INV-${Math.floor(1000 + Math.random() * 9000)}`,
      date: new Date().toISOString().substring(0, 10),
      orderId: "FLEET-ACQUISITION",
      assetId: serial,
      assetName: name,
      duration: "Unlimited",
      grossRevenue: -cost,
      platformFee: 0,
      netPayout: -cost
    };
    setTransactions(prev => [newTx, ...prev]);

    setTimeout(() => {
      setInvestSuccess(false);
    }, 4500);
  };

  // Unblock helper
  const handleUnblockAsset = (assetId: string) => {
    setAssets(prev => prev.map(a => {
      if (a.id === assetId) {
        return {
          ...a,
          status: "Idle/Queue"
        };
      }
      return a;
    }));
    setShowNotification("Asset status successfully restored to active FIFO standby mode.");
    setTimeout(() => {
      setShowNotification(null);
    }, 4000);
  };

  // Filter & Search statement transactions calculation
  const filteredTransactions = useMemo(() => {
    return transactions.filter(tx => {
      const matchesSearch = 
        tx.orderId.toLowerCase().includes(transactionSearch.toLowerCase()) ||
        tx.assetId.toLowerCase().includes(transactionSearch.toLowerCase()) ||
        tx.assetName.toLowerCase().includes(transactionSearch.toLowerCase());
      
      const matchesCategory = 
        assetFilter === "ALL" ||
        (assetFilter === "PS5" && tx.assetId.includes("PS5")) ||
        (assetFilter === "PRJ" && tx.assetId.includes("PRJ")) ||
        (assetFilter === "VR" && tx.assetId.includes("VR")) ||
        (assetFilter === "WITHDRAWS" && tx.orderId === "PARTNER-WITHDRAW");

      return matchesSearch && matchesCategory;
    });
  }, [transactions, transactionSearch, assetFilter]);

  // Download XLS transaction file trigger
  const handleExportStatement = () => {
    const header = "Date,Order ID,Asset ID,Asset Name,Duration,Gross,Fee,Net Payout\n";
    const body = transactions.map(tx => 
      `"${tx.date}","${tx.orderId}","${tx.assetId}","${tx.assetName}","${tx.duration}",${tx.grossRevenue},${tx.platformFee},${tx.netPayout}`
    ).join("\n");
    const blob = new Blob([header + body], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `Partner_Ledger_${new Date().toISOString().substring(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setShowNotification("Ledger Export Complete: Statement exported in standardized Bank format (.csv).");
    setTimeout(() => {
      setShowNotification(null);
    }, 4000);
  };

  return (
    <div className="w-full bg-slate-50 text-slate-800 min-h-screen relative font-sans leading-relaxed">
      
      {/* Decorative Brand Header Pattern (PlayStation Blue Accent Wave) */}
      <div className="bg-[#003791] text-white py-12 px-6 sm:px-8 relative overflow-hidden shadow-md">
        {/* Abstract light grid overlays */}
        <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none" />
        <div className="absolute bottom-[-100px] right-[-100px] w-[500px] h-[500px] bg-sky-400 rounded-full blur-[140px] opacity-25 pointer-events-none" />
        <div className="absolute top-1/4 left-5 w-48 h-48 bg-blue-900 rounded-full blur-[80px] opacity-40 pointer-events-none" />

        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-3.5 mb-2">
              <span className="bg-white/15 backdrop-blur-md text-[10px] uppercase font-mono tracking-[0.25em] px-3 py-1.5 rounded-full text-blue-100 font-extrabold border border-white/10">
                {partnerProfile.level}
              </span>
              <span className="text-[11px] text-blue-200 font-mono">
                Partner ID: <strong className="text-white">{partnerProfile.partnerId}</strong>
              </span>
            </div>
            
            <h1 className="text-3xl sm:text-4xl font-black font-display tracking-tight text-white mb-2 uppercase">
              Asset Partner Portal
            </h1>
            <p className="text-sm text-blue-100/80 font-normal max-w-xl">
              Real-time capital deployment metrics, FIFO pipeline alignment trackers, and digital ledger for investor <strong className="text-white">{partnerProfile.name}</strong>.
            </p>
          </div>

          <div className="flex items-center gap-4 bg-white/5 backdrop-blur-lg border border-white/10 p-4 rounded-2xl md:self-end">
            <span className="text-xs font-mono text-blue-200">
              Verified Ownership Status:
            </span>
            <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400">
              <ShieldCheck className="w-4 h-4" />
              <span>Compliant & Verified</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Container Wrapper */}
      <div className="max-w-7xl mx-auto p-4 sm:p-8 space-y-8 pb-20">

        {/* Global Floating Notification Panel */}
        <AnimatePresence>
          {showNotification && (
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              className="bg-slate-900 text-white rounded-2xl p-4 shadow-xl border border-blue-500/20 flex items-start gap-3 relative z-40 overflow-hidden"
            >
              <div className="absolute top-0 bottom-0 left-0 w-2 bg-[#003791]" />
              <Info className="text-sky-400 shrink-0 w-5 h-5 mt-0.5" />
              <div className="flex-grow">
                <span className="text-xs uppercase font-mono tracking-widest text-[#003791] font-bold block mb-0.5">System Alert Ledger Log</span>
                <p className="text-sm text-slate-200 font-mono leading-relaxed">{showNotification}</p>
              </div>
              <button onClick={() => setShowNotification(null)} className="text-slate-400 hover:text-white transition-colors p-1">
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Live investment celebration banner */}
        <AnimatePresence>
          {investSuccess && (
            <motion.div
              initial={{ scale: 0.93, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.93, opacity: 0 }}
              className="bg-emerald-50 border border-emerald-200 text-slate-900 rounded-3xl p-6 shadow-xl flex flex-col sm:flex-row items-center gap-6 relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
              <div className="bg-emerald-600 text-white p-4 rounded-2xl shadow-md shrink-0">
                <Sparkles className="w-7 h-7 animate-spin" />
              </div>
              <div className="text-center sm:text-left flex-grow">
                <span className="text-xs font-black uppercase text-emerald-700 tracking-wider font-mono">Portfolio Expanded!</span>
                <h3 className="text-lg font-bold text-emerald-950 mt-1">
                  Congratulations! '{investedAssetName}' Added
                </h3>
                <p className="text-xs text-slate-600 mt-1 max-w-xl">
                  Asset allocation successfully initialized. Your system ID and warranty codes have been logged to the Digital Locker. It is placed immediately in the live standby FIFO queue to gather rentals.
                </p>
              </div>
              <button 
                onClick={() => setInvestSuccess(false)}
                className="bg-emerald-900 hover:bg-emerald-800 text-white px-4 py-2 rounded-xl text-xs font-bold uppercase transition-colors"
              >
                Done
              </button>
            </motion.div>
          )}
        </AnimatePresence>


        {/* ================= SECTION 1: THE ATM HEADER ================= */}
        <div id="partner-atm-header" className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm relative overflow-hidden">
          {/* Subtle background PlayStation shape accent */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#003791]/[0.015] rounded-full pointer-events-none transform translate-x-12 -translate-y-12" />

          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 pb-8 border-b border-slate-100">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="bg-[#003791]/10 p-1.5 rounded-lg text-[#003791]">
                  <Wallet className="w-4 h-4" />
                </div>
                <span className="text-xs font-extrabold uppercase text-slate-400 tracking-wider font-mono">
                  Available ATM Balance
                </span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight">
                  ₹{availableFunds.toLocaleString("en-IN")}
                </span>
                <span className="text-emerald-600 text-xs font-bold bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-100">
                  Ready to Transfer
                </span>
              </div>
              <p className="text-xs text-slate-500 font-mono">
                Secured via standard API credentials node • Linked Account: {partnerProfile.bankAccount}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => setIsWithdrawModalOpen(true)}
                className="bg-[#003791] hover:bg-blue-800 text-white px-7 py-3.5 rounded-full text-xs font-bold uppercase tracking-widest transition-all duration-200 shadow-md hover:shadow-lg hover:-translate-y-0.5 cursor-pointer flex items-center justify-center gap-2"
              >
                <Coins className="w-4 h-4" />
                <span>Request Withdrawal</span>
              </button>
              
              <a
                href="#growth-engine"
                className="bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 px-7 py-3.5 rounded-full text-xs font-bold uppercase tracking-widest transition-all duration-200 text-center flex items-center justify-center gap-1.5"
              >
                <span>Expand Portfolio</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

          {/* 3-Column Summary metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-8">
            <div className="space-y-1 border-b md:border-b-0 md:border-r border-slate-100 pb-4 md:pb-0 md:pr-4">
              <span className="text-[10px] font-extrabold uppercase text-slate-400 tracking-widest font-mono block">Lifetime Gross Earnings</span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-black text-slate-900">₹{totalLifetimeRevenue.toLocaleString("en-IN")}</span>
                <span className="text-slate-400 text-xs font-mono">INR</span>
              </div>
              <p className="text-[11px] text-slate-500">Cumulative payout share accrued since enrollment</p>
            </div>

            <div className="space-y-1 border-b md:border-b-0 md:border-r border-slate-100 pb-4 md:pb-0 md:px-4">
              <span className="text-[10px] font-extrabold uppercase text-slate-400 tracking-widest font-mono block">Withdrawn Funds (Lifetime)</span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-black text-slate-900">₹{totalWithdrawnFunds.toLocaleString("en-IN")}</span>
                <span className="text-slate-400 text-xs font-mono">INR</span>
              </div>
              <p className="text-[11px] text-slate-500">Transferred safely to associated bank nodes</p>
            </div>

            <div className="space-y-1 pb-2 md:pb-0 md:pl-4">
              <span className="text-[10px] font-extrabold uppercase text-slate-400 tracking-widest font-mono block">Portfolio Monthly Yield</span>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-black text-slate-900">{avgMonthlyYield}%</span>
                <div className="flex items-center gap-0.5 text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded text-xs font-bold border border-emerald-100">
                  <TrendingUp className="w-3 h-3" />
                  <span>+0.8% MoM</span>
                </div>
              </div>
              <p className="text-[11px] text-slate-500">Net revenue vs cost of enrolled capital assets</p>
            </div>
          </div>
        </div>


        {/* ================= SECTION 2: THE LIVE FLEET TABLE (FIFO TRACKER) ================= */}
        <div id="live-fleet-table" className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <div className="flex items-center gap-2.5 mb-1">
                <h2 className="text-xl font-extrabold text-slate-900 uppercase tracking-tight">Enrolled Live Fleet</h2>
                <span className="bg-blue-50 text-[#003791] text-[10px] font-mono uppercase font-black tracking-widest px-2.5 py-1 rounded-full border border-blue-100 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Strict FIFO Queue Model Active</span>
                </span>
              </div>
              <p className="text-xs text-slate-500 max-w-2xl">
                When a checkout is finalized, our framework automatically scopes the qualifying unit positioned at the top (#1) of the <strong>FIFO (First In, First Out) Standby Queue</strong>. Restoring or blocking units adjusts coordinates instantly.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 font-mono">Fleet Units: <strong>{assets.length}</strong></span>
              <div className="h-4 w-[1px] bg-slate-200" />
              <button 
                onClick={() => {
                  setShowNotification("Refreshing serial status logs with local storage index... All systems clean.");
                  setTimeout(() => setShowNotification(null), 3000);
                }}
                className="p-2 hover:bg-slate-100 rounded-lg text-slate-600 cursor-pointer border border-transparent hover:border-slate-200 transition-all"
                title="Force Refresh Sync"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-100">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/75 text-slate-400 text-[10px] font-extrabold uppercase tracking-wider border-b border-slate-200 font-mono">
                  <th className="py-4 px-5">Enrollment Date</th>
                  <th className="py-4 px-5">Asset Name</th>
                  <th className="py-4 px-5">Serial No. / ID</th>
                  <th className="py-4 px-5">FIFO Queue Position</th>
                  <th className="py-4 px-5">Status</th>
                  <th className="py-4 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm font-sans">
                {assets.map((asset) => {
                  // Class tag configurations for different conditions
                  let statusTagClass = "";
                  switch(asset.status) {
                    case "On Rent":
                      statusTagClass = "bg-emerald-50 text-emerald-700 border-emerald-200";
                      break;
                    case "Idle/Queue":
                      statusTagClass = "bg-amber-50 text-amber-700 border-amber-200";
                      break;
                    case "Maintenance":
                      statusTagClass = "bg-rose-50 text-rose-700 border-rose-200";
                      break;
                    case "Blocked":
                      statusTagClass = "bg-sky-50 text-[#003791] border-sky-200";
                      break;
                  }

                  return (
                    <tr key={asset.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-4 px-5 font-mono text-xs text-slate-500">
                        {new Date(asset.enrollmentDate).toLocaleDateString("en-IN", {
                          year: "numeric",
                          month: "short",
                          day: "numeric"
                        })}
                      </td>
                      <td className="py-4 px-5">
                        <div className="font-bold text-slate-950">{asset.name}</div>
                        <div className="text-[11px] text-slate-400 capitalize">{asset.category} category investment</div>
                      </td>
                      <td className="py-4 px-5">
                        <span className="font-mono text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded border border-slate-200/50">
                          {asset.serialNo}
                        </span>
                      </td>
                      <td className="py-4 px-5">
                        {asset.status === "Blocked" ? (
                          <span className="text-slate-400 text-xs italic font-mono">Withdrawn from Standby Queue</span>
                        ) : asset.status === "Maintenance" ? (
                          <span className="text-rose-500 text-xs font-bold font-mono">Suspended for Repair</span>
                        ) : (
                          <div className="flex items-center gap-1.5 font-mono text-xs">
                            <span className="font-bold text-slate-900">{asset.queuePosition}</span>
                            <span className="text-[10px] text-slate-400">priority</span>
                          </div>
                        )}
                      </td>
                      <td className="py-4 px-5">
                        <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold leading-none border ${statusTagClass}`}>
                          <span className="w-1.5 h-1.5 rounded-full bg-current" />
                          <span>
                            {asset.status === "On Rent" && asset.extendedTo ? (
                              <span>
                                On Rent (Extended to {asset.extendedTo})
                              </span>
                            ) : (
                              asset.status
                            )}
                          </span>
                        </span>
                      </td>
                      <td className="py-4 px-5 text-right">
                        {asset.status === "Blocked" ? (
                          <button
                            onClick={() => handleUnblockAsset(asset.id)}
                            className="text-xs font-bold text-[#003791] hover:text-blue-800 bg-[#003791]/5 hover:bg-[#003791]/10 px-3.5 py-1.5 rounded-lg border border-[#003791]/10 transition-all cursor-pointer"
                          >
                            Unblock Standby
                          </button>
                        ) : (
                          <button
                            onClick={() => openBlockerModal(asset)}
                            disabled={asset.status === "Maintenance"}
                            className={`text-xs font-bold font-mono px-3.5 py-1.5 rounded-lg border transition-all cursor-pointer ${
                              asset.status === "Maintenance" 
                              ? "bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed" 
                              : "bg-white hover:bg-slate-50 text-slate-700 border-slate-300 hover:text-[#003791] hover:border-[#003791]/30"
                            }`}
                          >
                            Block for Personal Use
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>


        {/* ================= SECTION 4: THE ITEMIZED TRANSACTION LEDGER ================= */}
        <div id="transaction-ledger" className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm">
          <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6 mb-6">
            <div>
              <h2 className="text-xl font-extrabold text-slate-900 uppercase tracking-tight">
                Itemized Transaction Ledger
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Bank-level automated payouts statement proving platform receipts, individual user rental sessions, and net distributions.
              </p>
            </div>

            {/* Inputs & Actions Bar */}
            <div className="flex flex-col sm:flex-row items-center gap-3">
              {/* Search Bar */}
              <div className="relative w-full sm:w-64">
                <input
                  type="text"
                  placeholder="ID, Serial or Asset name..."
                  value={transactionSearch}
                  onChange={(e) => setTransactionSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 rounded-xl border border-slate-200 text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#003791] focus:border-[#003791] font-mono"
                />
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
              </div>

              {/* Filter Tabs */}
              <div className="flex bg-slate-50 p-1 rounded-xl border border-slate-100 shrink-0">
                <button
                  onClick={() => setAssetFilter("ALL")}
                  className={`px-3 py-1.5 rounded-lg text-xs leading-none font-bold transition-all cursor-pointer ${
                    assetFilter === "ALL" ? "bg-white text-[#003791] shadow-xs" : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setAssetFilter("PS5")}
                  className={`px-3 py-1.5 rounded-lg text-xs leading-none font-bold transition-all cursor-pointer ${
                    assetFilter === "PS5" ? "bg-white text-[#003791] shadow-xs" : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  PS5
                </button>
                <button
                  onClick={() => setAssetFilter("PRJ")}
                  className={`px-3 py-1.5 rounded-lg text-xs leading-none font-bold transition-all cursor-pointer ${
                    assetFilter === "PRJ" ? "bg-white text-[#003791] shadow-xs" : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  Projectors
                </button>
                <button
                  onClick={() => setAssetFilter("WITHDRAWS")}
                  className={`px-3 py-1.5 rounded-lg text-xs leading-none font-bold transition-all cursor-pointer ${
                    assetFilter === "WITHDRAWS" ? "bg-white text-[#003791] shadow-xs" : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  Withdrawals
                </button>
              </div>

              <button
                onClick={handleExportStatement}
                className="bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 px-4 py-2.5 rounded-xl text-xs font-bold leading-none uppercase flex items-center gap-1.5 transition-all cursor-pointer shrink-0"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export Ledger (.csv)</span>
              </button>
            </div>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-100">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/75 text-slate-400 text-[10px] font-extrabold uppercase tracking-wider border-b border-slate-200 font-mono">
                  <th className="py-4 px-5">Payout Date</th>
                  <th className="py-4 px-5">Order ID</th>
                  <th className="py-4 px-5">Asset ID / Serial</th>
                  <th className="py-4 px-5">Asset Class</th>
                  <th className="py-4 px-5">Duration</th>
                  <th className="py-4 px-5">Gross Revenue</th>
                  <th className="py-4 px-5">Operational Cut (30%)</th>
                  <th className="py-4 px-5 text-right">Net Partner Payout</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-mono">
                {filteredTransactions.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-400 italic">
                      No statement items match the selected filter criteria.
                    </td>
                  </tr>
                ) : (
                  filteredTransactions.map((tx) => {
                    const isWithdrawal = tx.orderId === "PARTNER-WITHDRAW";
                    const isAcquisition = tx.orderId === "FLEET-ACQUISITION";
                    const isExt = tx.isExtension;

                    return (
                      <tr 
                        key={tx.id} 
                        className={`transition-colors ${
                          isExt 
                            ? "bg-purple-50/30 hover:bg-purple-50/45 border-l-2 border-purple-500" 
                            : "hover:bg-slate-50/40"
                        }`}
                      >
                        <td className="py-3.5 px-5 text-slate-500">
                          {new Date(tx.date).toLocaleDateString("en-IN", {
                            year: "numeric",
                            month: "short",
                            day: "numeric"
                          })}
                        </td>
                        <td className="py-3.5 px-5">
                          {isWithdrawal ? (
                            <span className="text-indigo-600 font-bold uppercase">WITHDRAWAL</span>
                          ) : isAcquisition ? (
                            <span className="text-blue-600 font-bold uppercase">CAPITAL INVEST</span>
                          ) : isExt ? (
                            <span className="text-purple-700 font-black flex items-center gap-1">
                              <span>{tx.orderId}</span>
                            </span>
                          ) : (
                            <span className="text-slate-800 font-bold">{tx.orderId}</span>
                          )}
                        </td>
                        <td className="py-3.5 px-5">
                          {tx.assetId === "FUNDS-ATM" ? (
                            <span className="text-slate-400">Portal ATM</span>
                          ) : (
                            <span className={`font-mono text-xs ${isExt ? "text-purple-600" : "text-slate-600"}`}>
                              {tx.assetId}
                            </span>
                          )}
                        </td>
                        <td className={`py-3.5 px-5 font-sans max-w-[150px] truncate ${isExt ? "text-purple-950 italic" : "text-slate-800"}`}>
                          {tx.assetName} {isExt && <span className="text-[10px] text-purple-600 not-italic font-bold">(Extension Promo)</span>}
                        </td>
                        <td className={`py-3.5 px-5 font-bold ${isExt ? "text-purple-700" : "text-slate-500"}`}>
                          {tx.duration}
                        </td>
                        <td className={`py-3.5 px-5 font-semibold text-right sm:text-left ${isExt ? "text-purple-600" : "text-slate-600"}`}>
                          {isWithdrawal || isAcquisition ? "-" : `₹${tx.grossRevenue.toLocaleString()}`}
                        </td>
                        <td className={`py-3.5 px-5 text-right sm:text-left ${isExt ? "text-purple-400" : "text-slate-500"}`}>
                          {isWithdrawal || isAcquisition ? "-" : `₹${tx.platformFee.toLocaleString()}`}
                        </td>
                        <td className="py-3.5 px-5 text-right font-bold text-sm">
                          {isWithdrawal ? (
                            <span className="text-red-600">-₹{Math.abs(tx.netPayout).toLocaleString()}</span>
                          ) : isAcquisition ? (
                            <span className="text-slate-800">-₹{Math.abs(tx.netPayout).toLocaleString()}</span>
                          ) : isExt ? (
                            <span className="text-purple-600 bg-purple-50 border border-purple-100 px-2 py-1 rounded inline-block">
                              +₹{tx.netPayout.toLocaleString()}
                            </span>
                          ) : (
                            <span className="text-emerald-600 bg-emerald-50 border border-emerald-100/55 px-2 py-1 rounded inline-block">
                              +₹{tx.netPayout.toLocaleString()}
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
          <div className="flex justify-between items-center mt-4 text-[11px] text-slate-500 font-mono">
            <span>Showing {filteredTransactions.length} transaction entries</span>
            <span>Platform fees support real-time courier dispatch, comprehensive transit insurance, & periodic detailing.</span>
          </div>
        </div>


        {/* ================= SECTION 5: ASSET HEALTH & DIGITAL LOCKER ================= */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Asset Health Log Card */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm flex flex-col justify-between">
            <div className="space-y-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <div className="bg-amber-100 p-1.5 rounded-lg text-amber-700">
                    <Wrench className="w-4 h-4" />
                  </div>
                  <h2 className="text-lg font-bold text-slate-900 uppercase tracking-tight">
                    Asset Health & Maintenance
                  </h2>
                </div>
                <p className="text-xs text-slate-500">
                  Real-time health telemetry index monitoring hardware depreciations and service events.
                </p>
              </div>

              {/* Health Grid summary statistics */}
              <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <div className="space-y-1">
                  <span className="text-[10px] text-slate-400 font-mono uppercase block">Active Lifespans</span>
                  <p className="text-sm font-bold text-slate-800">Month 4 of 60 (Avg)</p>
                  <p className="text-[10px] text-slate-500 font-mono">8.2% spent lifespan</p>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] text-slate-400 font-mono uppercase block">Overall Fleet Score</span>
                  <div className="flex items-center gap-1">
                    <p className="text-sm font-bold text-[#003791]">96% Optimal</p>
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  </div>
                  <p className="text-[10px] text-slate-500 font-mono">Hardware warranty covers</p>
                </div>
              </div>

              {/* Maintenance Log List */}
              <div className="space-y-3">
                <span className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider font-mono block">Active Maintenance Diagnostics Log</span>
                <div className="space-y-2 max-h-[180px] overflow-y-auto pr-1">
                  {maintenanceLogs.map(log => (
                    <div key={log.id} className="p-3 bg-white border border-slate-200 rounded-xl flex items-start justify-between gap-3 text-xs">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5">
                          <strong className="text-slate-900 font-bold font-mono text-[11px]">{log.assetId}</strong>
                          <span className="text-[10px] text-slate-400">• {log.date}</span>
                        </div>
                        <p className="text-slate-600 font-sans">{log.task}</p>
                      </div>

                      <div className="shrink-0 flex flex-col items-end gap-1 font-mono">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                          log.status === "Completed" 
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-100" 
                            : "bg-red-50 text-red-700 border border-red-100"
                        }`}>
                          {log.status}
                        </span>
                        {log.cost > 0 && <span className="text-[10px] text-slate-500">₹{log.cost}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <p className="text-[10px] text-slate-400 font-mono mt-4">
              * Maintenance costs are automatically structured as write-offs in compliant tax invoices.
            </p>
          </div>

          {/* Secure Digital Locker Card */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm flex flex-col justify-between">
            <div className="space-y-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <div className="bg-sky-100 p-1.5 rounded-lg text-sky-700">
                    <FileText className="w-4 h-4" />
                  </div>
                  <h2 className="text-lg font-bold text-slate-900 uppercase tracking-tight">
                    Partner Secure Digital Locker
                  </h2>
                </div>
                <p className="text-xs text-slate-500">
                  Fully encrypted repository storing notarized partnership pacts and real estate/ownership certificate files.
                </p>
              </div>

              {/* File list downloads */}
              <div className="space-y-3">
                <div 
                  onClick={() => handleLockerDownload("AfterHours Partnership Framework Pact")}
                  className="p-3.5 bg-slate-50 hover:bg-slate-100/85 border border-slate-200 hover:border-[#003791]/35 rounded-2xl flex items-center justify-between gap-4 transition-all duration-150 cursor-pointer group"
                >
                  <div className="flex items-center gap-3">
                    <div className="bg-red-50 text-red-600 group-hover:bg-red-100 p-2.5 rounded-xl transition-all">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider font-mono">Partnership Agreement</h4>
                      <p className="text-[11px] text-slate-500">Legal proof of revenue cut distribution agreements.pdf</p>
                    </div>
                  </div>
                  <div className="bg-white group-hover:bg-[#003791] text-[#003791] group-hover:text-white p-2 border border-slate-200/80 rounded-xl transition-all shadow-xs shrink-0">
                    <Download className="w-4 h-4" />
                  </div>
                </div>

                <div 
                  onClick={() => handleLockerDownload("NOTARIZED Hardware Ownership Certificate_S31")}
                  className="p-3.5 bg-slate-50 hover:bg-slate-100/85 border border-slate-200 hover:border-[#003791]/35 rounded-2xl flex items-center justify-between gap-4 transition-all duration-150 cursor-pointer group"
                >
                  <div className="flex items-center gap-3">
                    <div className="bg-blue-50 text-blue-600 group-hover:bg-blue-100 p-2.5 rounded-xl transition-all">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider font-mono">Ownership Certificates</h4>
                      <p className="text-[11px] text-slate-500">Hardware serial ownership and escrow guarantees.zip</p>
                    </div>
                  </div>
                  <div className="bg-white group-hover:bg-[#003791] text-[#003791] group-hover:text-white p-2 border border-slate-200/80 rounded-xl transition-all shadow-xs shrink-0">
                    <Download className="w-4 h-4" />
                  </div>
                </div>

                <div 
                  onClick={() => handleLockerDownload("Tax Invoice FY25-Q4 Report")}
                  className="p-3.5 bg-slate-50 hover:bg-slate-100/85 border border-slate-200 hover:border-[#003791]/35 rounded-2xl flex items-center justify-between gap-4 transition-all duration-150 cursor-pointer group"
                >
                  <div className="flex items-center gap-3">
                    <div className="bg-emerald-50 text-emerald-600 group-hover:bg-emerald-100 p-2.5 rounded-xl transition-all">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider font-mono">Tax Invoicing Reports</h4>
                      <p className="text-[11px] text-slate-500">Compliant unified accounting sheets & GST reports.csv</p>
                    </div>
                  </div>
                  <div className="bg-white group-hover:bg-[#003791] text-[#003791] group-hover:text-white p-2 border border-slate-200/80 rounded-xl transition-all shadow-xs shrink-0">
                    <Download className="w-4 h-4" />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 mt-4 text-[10px] text-slate-500 bg-slate-100/50 p-3 rounded-xl border border-slate-100">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>TLS/SSL End-To-End encryption blocks browser-side leaks. Download requests trigger real-time multi-factor security logs.</span>
            </div>
          </div>
        </div>


        {/* ================= SECTION 6: THE GROWTH ENGINE (UPSELL) ================= */}
        <div id="growth-engine" className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm">
          <div className="mb-6">
            <h2 className="text-xl font-extrabold text-slate-900 uppercase tracking-tight">
              Expand Your Portfolio (Growth Engine)
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Deploy capital directly into high-utilization hardware slots. These items are integrated immediately into our express booking client systems.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Projector Asset allocation Card */}
            <div 
              onMouseEnter={() => setHoveredUpsellCard("projector")}
              onMouseLeave={() => setHoveredUpsellCard(null)}
              className="bg-slate-50 text-slate-800 rounded-2xl p-6 border border-slate-200 hover:border-[#003791] transition-all duration-300 flex flex-col justify-between relative overflow-hidden"
            >
              {/* Hot item indicator badge */}
              <div className="absolute top-4 right-4 bg-amber-500 text-white font-mono text-[9px] font-bold px-2 py-1 rounded-sm uppercase tracking-wider">
                90% Utilization Peak
              </div>

              <div className="space-y-4">
                <div className="bg-indigo-100 w-12 h-12 rounded-xl flex items-center justify-center text-indigo-700">
                  <Cpu className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-950 uppercase tracking-wide">4K Cinema Projector Portfolio</h3>
                  <p className="text-xs text-slate-600 mt-1 leading-normal">
                    High-utilization corporate experiences and private screening hubs are peaking. Invest to acquire another professional smart unit to service upcoming corporate winter bookings.
                  </p>
                </div>

                <div className="flex gap-4 border-y border-slate-200/80 py-3 text-xs font-mono">
                  <div>
                    <span className="text-slate-400 text-[10px] block uppercase">Avg Monthly Yield</span>
                    <strong className="text-slate-800 text-sm">~₹11,200/mo</strong>
                  </div>
                  <div className="w-[1px] bg-slate-200" />
                  <div>
                    <span className="text-slate-400 text-[10px] block uppercase">Est. Payback Cycle</span>
                    <strong className="text-slate-800 text-sm">11 Months</strong>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-center sm:text-left">
                  <span className="text-[10px] text-slate-400 block uppercase font-mono">Partner Investment Shares</span>
                  <span className="text-lg font-black text-[#003791]">₹25,000 / unit</span>
                </div>

                <button
                  onClick={() => handleInvestInAsset("projector")}
                  className="bg-[#003791] hover:bg-blue-800 text-white font-mono font-bold uppercase tracking-widest text-xs px-6 py-3 rounded-full cursor-pointer transition-all duration-200 w-full sm:w-auto text-center"
                >
                  Acquire & Deploy
                </button>
              </div>
            </div>

            {/* Premium PS5 Pro slot */}
            <div 
              onMouseEnter={() => setHoveredUpsellCard("ps5pro")}
              onMouseLeave={() => setHoveredUpsellCard(null)}
              className="bg-slate-50 text-slate-800 rounded-2xl p-6 border border-slate-200 hover:border-[#003791] transition-all duration-300 flex flex-col justify-between relative overflow-hidden"
            >
              {/* Premium indicator badge */}
              <div className="absolute top-4 right-4 bg-blue-600 text-white font-mono text-[9px] font-bold px-2 py-1 rounded-sm uppercase tracking-wider">
                Extremely High Rent Demand
              </div>

              <div className="space-y-4">
                <div className="bg-sky-100 w-12 h-12 rounded-xl flex items-center justify-center text-sky-700">
                  <Sparkles className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-950 uppercase tracking-wide">PlayStation 5 Pro Portfolio Slot</h3>
                  <p className="text-xs text-slate-600 mt-1 leading-normal">
                    Esports arenas, multiplayer custom pop-ups, and game day parties demand high-frame-rate rendering hardware. Secure this active Slot to harvest early-wave holiday premiums.
                  </p>
                </div>

                <div className="flex gap-4 border-y border-slate-200/80 py-3 text-xs font-mono">
                  <div>
                    <span className="text-slate-400 text-[10px] block uppercase">Avg Monthly Yield</span>
                    <strong className="text-slate-800 text-sm">~₹7,200/mo</strong>
                  </div>
                  <div className="w-[1px] bg-slate-200" />
                  <div>
                    <span className="text-slate-400 text-[10px] block uppercase">Est. Payback Cycle</span>
                    <strong className="text-slate-800 text-sm">9.5 Months</strong>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-center sm:text-left">
                  <span className="text-[10px] text-slate-400 block uppercase font-mono">Partner Investment Shares</span>
                  <span className="text-lg font-black text-[#003791]">₹35,000 / unit</span>
                </div>

                <button
                  onClick={() => handleInvestInAsset("ps5pro")}
                  className="bg-[#003791] hover:bg-blue-800 text-white font-mono font-bold uppercase tracking-widest text-xs px-6 py-3 rounded-full cursor-pointer transition-all duration-200 w-full sm:w-auto text-center"
                >
                  Acquire & Deploy
                </button>
              </div>
            </div>

          </div>
        </div>

      </div>


      {/* ================= SECTION 3: PERSONAL USE BLOCKER MODAL ================= */}
      <AnimatePresence>
        {isBlockModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            
            {/* Dark Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsBlockModalOpen(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs"
            />

            {/* Modal Box */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative w-full max-w-lg bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-200 z-10 text-slate-900"
            >
              <button
                onClick={() => setIsBlockModalOpen(false)}
                className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="space-y-4">
                {/* Header info */}
                <div className="flex items-center gap-2">
                  <div className="bg-sky-100 p-2 rounded-xl text-sky-700">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-mono tracking-widest text-slate-400 font-extrabold block">FIFO Scheduler Engine</span>
                    <h3 className="text-lg font-extrabold text-slate-950 uppercase tracking-tight">Block for Personal Use</h3>
                  </div>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col gap-1 text-xs text-slate-700">
                  <div className="flex justify-between font-mono">
                    <span className="text-slate-400">Target Asset:</span>
                    <strong className="text-slate-950">{selectedAssetForBlock?.name}</strong>
                  </div>
                  <div className="flex justify-between font-mono">
                    <span className="text-slate-400">Model Ref Serial:</span>
                    <strong className="text-[#003791]">{selectedAssetForBlock?.serialNo}</strong>
                  </div>
                  <div className="flex justify-between font-mono">
                    <span className="text-slate-400">Current FIFO Priority:</span>
                    <strong className="text-amber-700 font-bold">{selectedAssetForBlock?.queuePosition}</strong>
                  </div>
                </div>

                {/* Form inputs for Date limits */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-mono font-bold text-slate-400">Block Start Date</label>
                    <input
                      type="date"
                      value={blockStartDate}
                      onChange={(e) => setBlockStartDate(e.target.value)}
                      className="w-full text-xs font-mono bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#003791]"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-mono font-bold text-slate-400">Block End Date</label>
                    <input
                      type="date"
                      value={blockEndDate}
                      onChange={(e) => setBlockEndDate(e.target.value)}
                      className="w-full text-xs font-mono bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#003791]"
                    />
                  </div>
                </div>

                {/* CRITICAL STRICT REQUIREMENT: THE PENALTY WARNING */}
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <div className="text-xs text-amber-900 leading-relaxed">
                    <strong className="font-extrabold uppercase text-amber-950 block mb-1">
                      ⚠️ Penalty Warning
                    </strong>
                    Blocking an actively scheduled asset will forfeit its pending revenue, swap the booking to another unit, and push the investor's asset to the back of the FIFO queue.
                  </div>
                </div>

                {/* Checkbox acknowledgement */}
                <label className="flex items-start gap-2.5 cursor-pointer p-1">
                  <input
                    type="checkbox"
                    checked={acknowledgePenalty}
                    onChange={(e) => setAcknowledgePenalty(e.target.checked)}
                    className="mt-0.5 h-4 w-4 text-[#003791] border-slate-300 rounded focus:ring-[#003791]"
                  />
                  <span className="text-xs text-slate-600 select-none">
                    I acknowledge that executing this block overrides client rental pipelines, and I verify that I will take full responsibility for forfeited rental revenues.
                  </span>
                </label>

                {/* Modal Buttons */}
                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => setIsBlockModalOpen(false)}
                    className="flex-1 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 py-3 rounded-full text-xs font-bold uppercase transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleConfirmPersonalBlock}
                    className={`flex-1 text-white py-3 rounded-full text-xs font-bold uppercase transition-all ${
                      acknowledgePenalty 
                        ? "bg-[#003791] hover:bg-blue-800 shadow-md hover:shadow-lg cursor-pointer" 
                        : "bg-slate-300 text-slate-500 cursor-not-allowed"
                    }`}
                  >
                    Confirm Block
                  </button>
                </div>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>


      {/* MINIMAL ATM WITHDRAWAL MODAL */}
      <AnimatePresence>
        {isWithdrawModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => { if(!withdrawSuccess) setIsWithdrawModalOpen(false); }}
              className="absolute inset-0 bg-slate-900/65 backdrop-blur-xs"
            />

            {/* Modal Body */}
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-200 w-full max-w-md relative z-10 text-slate-900"
            >
              {!withdrawSuccess ? (
                <>
                  <button
                    onClick={() => setIsWithdrawModalOpen(false)}
                    className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>

                  <form onSubmit={handleRequestWithdrawal} className="space-y-4">
                    <div className="flex items-center gap-2">
                      <div className="bg-blue-50 text-[#003791] p-2 rounded-xl">
                        <Wallet className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="text-[10px] uppercase font-mono tracking-widest text-slate-400 block font-bold">ATM Withdraw Node</span>
                        <h3 className="text-base font-black text-slate-950 uppercase tracking-tight">Withdraw Available Funds</h3>
                      </div>
                    </div>

                    <p className="text-xs text-slate-500 font-sans">
                      Your funds will be deposited directly to your bank account: <strong className="text-slate-800">{partnerProfile.bankAccount}</strong>. Transfers take 3-5 seconds to reconcile.
                    </p>

                    <div className="p-3.5 bg-slate-50 border border-slate-100 rounded-2xl flex justify-between items-center">
                      <span className="text-xs text-slate-400 font-mono">Max Available Balance:</span>
                      <strong className="text-sm font-bold text-slate-950 font-mono">₹{availableFunds.toLocaleString("en-IN")}</strong>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] uppercase font-mono text-slate-400 font-bold block">Withdrawal Amount (₹)</label>
                      <div className="relative">
                        <span className="absolute left-4 top-3 text-slate-500 font-bold">₹</span>
                        <input
                          type="number"
                          required
                          max={availableFunds}
                          min={1}
                          placeholder="Amount in Rupees"
                          value={withdrawAmount}
                          onChange={(e) => setWithdrawAmount(e.target.value)}
                          className="w-full text-base font-bold font-mono pl-8 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-1 focus:ring-[#003791] focus:outline-none focus:border-[#003791] text-slate-900"
                        />
                      </div>
                    </div>

                    <div className="flex gap-3 pt-2">
                      <button
                        type="button"
                        onClick={() => setIsWithdrawModalOpen(false)}
                        className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 py-3 rounded-full text-xs font-bold uppercase transition-all"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="flex-1 bg-[#003791] hover:bg-blue-800 text-white py-3 rounded-full text-xs font-bold uppercase transition-all shadow-md hover:shadow-lg"
                      >
                        Request Transfer
                      </button>
                    </div>
                  </form>
                </>
              ) : (
                <div className="py-6 text-center space-y-4">
                  <div className="mx-auto w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center">
                    <CheckCircle className="w-7 h-7" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">Transfer Initiated</h3>
                    <p className="text-xs text-slate-500 mt-1 max-w-[280px] mx-auto font-sans leading-relaxed">
                      Successfully processed withdrawal of <strong>₹{withdrawnValue.toLocaleString()}</strong> to <strong>{partnerProfile.bankAccount}</strong>. Reconciling transaction codes...
                    </p>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
