import React, { useState, useEffect, useMemo } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
import { auth, db } from "../firebase";
import { PartnerNavbar } from "../components/layout/PartnerNavbar";
import { 
  Building2, 
  Wallet, 
  Coins, 
  TrendingUp, 
  ArrowUpRight, 
  X, 
  AlertCircle, 
  Loader2, 
  ChevronRight,
  ShieldAlert,
  Server,
  FileSpreadsheet,
  ListOrdered,
  Clock,
  Sparkles
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface LedgerItem {
  id: string;
  orderNumber: string;
  startDate: string;
  endDate: string;
  grossRevenue: number;
  platformFee: number;
  netProfit: number;
  partnerShare: number;
  timestamp: Date | null;
}

interface Asset {
  id: string;
  name: string;
  serialNumber: string;
  category: string;
  purchaseCost: number;
  ownerId: string;
  status: string;
  totalEarned: number;
  ledgers: LedgerItem[];
}

interface GlobalAsset {
  id: string;
  name: string;
  serialNumber: string;
  category: string;
  ownerId: string;
  status: string;
  lastRentedTimestamp?: any;
}

interface UserData {
  name: string;
  investedAmount: number;
  withdrawnFunds: number;
}

export function PartnerDashboard() {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [globalAssets, setGlobalAssets] = useState<GlobalAsset[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedAssetForModal, setSelectedAssetForModal] = useState<Asset | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setLoading(true);
        try {
          // 1. Fetch current user's profile from the users collection
          const userDocRef = doc(db, "users", user.uid);
          const userDocSnap = await getDoc(userDocRef);
          
          let name = user.displayName || "Premium Partner";
          let investedAmount = 0;
          let withdrawnFunds = 0;

          if (userDocSnap.exists()) {
            const data = userDocSnap.data();
            name = data.name || name;
            investedAmount = Number(data.investedAmount) || 0;
            withdrawnFunds = Number(data.withdrawnFunds) || 0;
          }

          setUserData({
            name,
            investedAmount,
            withdrawnFunds
          });

          // 2. Query ALL assets from the inventory_vault collection to build global queues
          const assetsSnap = await getDocs(collection(db, "inventory_vault"));
          const fetchedAssets: Asset[] = [];
          const fetchedGlobalAssets: GlobalAsset[] = [];

          for (const assetDoc of assetsSnap.docs) {
            const data = assetDoc.data();
            
            // Deduplicate/verify it's a serialized asset item
            if (data.serialNumber !== undefined || data.serialNo !== undefined) {
              const assetId = assetDoc.id;
              const serialNum = data.serialNumber || data.serialNo || "N/A";
              const categoryName = data.category || "General";
              const ownerVal = data.ownerId || "";
              const statusVal = data.status || "idle";

              fetchedGlobalAssets.push({
                id: assetId,
                name: data.name || "Hardware Asset",
                serialNumber: serialNum,
                category: categoryName,
                ownerId: ownerVal,
                status: statusVal,
                lastRentedTimestamp: data.lastRentedTimestamp || null
              });

              // 3. If asset belongs to the logged-in partner, fetch its ledgers subcollection
              if (ownerVal === user.uid) {
                const ledgersRef = collection(db, "inventory_vault", assetId, "ledgers");
                const ledgersSnap = await getDocs(ledgersRef);
                const assetLedgers: LedgerItem[] = [];

                ledgersSnap.forEach((ledgerDoc) => {
                  const ledgerData = ledgerDoc.data();
                  assetLedgers.push({
                    id: ledgerDoc.id,
                    orderNumber: ledgerData.orderNumber || ledgerData.orderId || ledgerDoc.id.substring(0, 8).toUpperCase(),
                    startDate: ledgerData.startDate || "",
                    endDate: ledgerData.endDate || "",
                    grossRevenue: Number(ledgerData.grossRevenue) || 0,
                    platformFee: Number(ledgerData.platformFee) || 0,
                    netProfit: Number(ledgerData.netProfit) || 0,
                    partnerShare: Number(ledgerData.partnerShare) || 0,
                    timestamp: ledgerData.timestamp ? (typeof ledgerData.timestamp.toDate === 'function' ? ledgerData.timestamp.toDate() : new Date(ledgerData.timestamp)) : null
                  });
                });

                // Sort by timestamp desc (newest first)
                assetLedgers.sort((a, b) => {
                  if (a.timestamp && b.timestamp) {
                    return b.timestamp.getTime() - a.timestamp.getTime();
                  }
                  return b.startDate.localeCompare(a.startDate);
                });

                fetchedAssets.push({
                  id: assetId,
                  name: data.name || "Hardware Asset",
                  serialNumber: serialNum,
                  category: categoryName,
                  purchaseCost: Number(data.purchaseCost) || 0,
                  ownerId: ownerVal,
                  status: statusVal,
                  totalEarned: Number(data.totalEarned) || 0,
                  ledgers: assetLedgers
                });
              }
            }
          }

          setAssets(fetchedAssets);
          setGlobalAssets(fetchedGlobalAssets);
        } catch (error) {
          console.error("Error setting up partner dashboard data:", error);
        } finally {
          setLoading(false);
        }
      } else {
        setUserData(null);
        setAssets([]);
        setGlobalAssets([]);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  // 4. Calculate totalEarnedAllTime, availableFunds, and ROI
  const totalEarnedAllTime = assets.reduce((sum, asset) => sum + (asset.totalEarned || 0), 0);
  const withdrawnFunds = userData?.withdrawnFunds || 0;
  const investedAmount = userData?.investedAmount || 0;
  const availableFunds = Math.max(0, totalEarnedAllTime - withdrawnFunds);
  const roiPercentage = investedAmount > 0 ? (totalEarnedAllTime / investedAmount) * 100 : 0;

  // Helper to parse timestamp for FIFO index calculation
  const getTimestampMs = (t: any): number => {
    if (!t) return 0;
    if (typeof t.toDate === "function") return t.toDate().getTime();
    if (t.seconds) return t.seconds * 1000;
    const parsed = Date.parse(t);
    return isNaN(parsed) ? 0 : parsed;
  };

  // Determine categories the logged-in Partner owns
  const partnerCategories = useMemo(() => {
    const cats = new Set<string>();
    assets.forEach((asset) => {
      if (asset.category) {
        cats.add(asset.category);
      }
    });
    return Array.from(cats);
  }, [assets]);

  // Exclude "Add-on" and "Add-ons" (case-insensitive)
  const relevantCategories = useMemo(() => {
    return partnerCategories.filter((cat) => {
      const lower = cat.toLowerCase();
      return lower !== "add-on" && lower !== "add-ons" && lower !== "addon" && lower !== "addons";
    });
  }, [partnerCategories]);

  // Group and sort global assets for relevant categories by lastRentedTimestamp ascending (oldest/never-rented first)
  const categoryQueues = useMemo(() => {
    const queues: { [category: string]: GlobalAsset[] } = {};
    relevantCategories.forEach((category) => {
      const categoryAssets = globalAssets.filter(
        (asset) => asset.category === category
      );
      categoryAssets.sort((a, b) => {
        const timeA = getTimestampMs(a.lastRentedTimestamp);
        const timeB = getTimestampMs(b.lastRentedTimestamp);
        return timeA - timeB;
      });
      queues[category] = categoryAssets;
    });
    return queues;
  }, [relevantCategories, globalAssets]);

  // Formatting helper
  const renderRupees = (amount: number) => {
    return `₹${amount.toLocaleString("en-IN")}`;
  };

  // Status Badge styling helper
  const getStatusBadge = (status: string) => {
    const s = status.toLowerCase();
    if (s === "rented" || s === "on rent" || s === "active") {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200 shadow-xs">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          Active Rent
        </span>
      );
    }
    if (s === "idle" || s === "available" || s === "idle/queue") {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-105 text-[#003791] border border-blue-200 shadow-xs">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
          Available
        </span>
      );
    }
    if (s === "maintenance" || s === "repair") {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
          In Maintenance
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-250">
        {status}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="w-full min-h-screen bg-slate-50 flex flex-col items-center justify-center font-sans">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 text-[#003791] animate-spin mx-auto" />
          <h2 className="text-lg font-bold text-[#003791] uppercase tracking-wide">
            Connecting After Hours Vault...
          </h2>
          <p className="text-xs text-slate-500 max-w-xs leading-relaxed">
            Please wait while we establish a secure telemetry channel to retrieve your asset yields.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full bg-slate-50 text-slate-800 min-h-screen font-sans leading-relaxed flex flex-col pb-16">
      <PartnerNavbar />

      {/* Hero Banner Header with PlayStation Color Aesthetics */}
      <div className="bg-[#003791] text-white py-14 px-6 sm:px-8 relative overflow-hidden shadow-lg border-b border-blue-900">
        {/* Subtle overlays */}
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:20px_20px] pointer-events-none" />
        <div className="absolute -bottom-40 -right-40 w-[600px] h-[600px] bg-sky-400 rounded-full blur-[160px] opacity-20 pointer-events-none" />
        <div className="absolute top-1/4 left-10 w-64 h-64 bg-blue-950 rounded-full blur-[100px] opacity-50 pointer-events-none" />

        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 bg-white/10 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest text-[#00d2ff]">
              🚀 PARTNER PORTAL DEPLOYED
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">
              Welcome, <span className="text-[#00d2ff]">{userData?.name || "Premium Partner"}</span>
            </h1>
            <p className="text-xs text-slate-200 font-medium max-w-xl">
              Track real-time performance indices, aggregate ledger earnings, and view detailed historic order allocations of your hardware assets.
            </p>
          </div>
          <div className="flex items-center gap-3 self-start md:self-center">
            <div className="bg-white/10 backdrop-blur-md border border-white/20 px-5 py-3 rounded-2xl">
              <span className="text-[10px] uppercase tracking-widest text-slate-300 block font-bold">PORTAL STATUS</span>
              <span className="text-sm font-extrabold text-emerald-400 flex items-center gap-1.5 mt-0.5">
                <span className="w-2.5 h-2.5 bg-emerald-400 rounded-full inline-block animate-pulse" />
                Live Grid Sync
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto w-full px-6 sm:px-8 mt-10 space-y-10 flex-grow">
        
        {/* KPI Cards Row (White cards with soft shadows) */}
        <div>
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-450 mb-4 inline-flex items-center gap-1">
            <Coins className="w-3.5 h-3.5 text-[#003791]" /> Finance Indices
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            
            {/* KPI 1: Total Invested Capital */}
            <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-[0_4px_24px_rgba(30,41,59,0.04)] flex flex-col justify-between transition-transform duration-300 hover:translate-y-[-2px]">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">Total Invested Capital</span>
                <div className="p-2.5 rounded-xl bg-slate-50 text-slate-600">
                  <Building2 className="w-5 h-5 text-slate-500" />
                </div>
              </div>
              <div className="mt-4">
                <h3 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                  {renderRupees(investedAmount)}
                </h3>
                <p className="text-[10px] text-slate-400 font-medium mt-1">Value of hardware deployed in grid</p>
              </div>
            </div>

            {/* KPI 2: Available Funds */}
            <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-[0_4px_24px_rgba(30,41,59,0.04)] flex flex-col justify-between transition-transform duration-300 hover:translate-y-[-2px]">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">Available Funds</span>
                <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600">
                  <Wallet className="w-5 h-5 text-emerald-600" />
                </div>
              </div>
              <div className="mt-4">
                <h3 className="text-2xl font-extrabold text-emerald-600 tracking-tight animate-fade-in">
                  {renderRupees(availableFunds)}
                </h3>
                <p className="text-[10px] text-emerald-500 font-bold mt-1">Net profit ready for withdrawal</p>
              </div>
            </div>

            {/* KPI 3: Withdrawn Funds */}
            <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-[0_4px_24px_rgba(30,41,59,0.04)] flex flex-col justify-between transition-transform duration-300 hover:translate-y-[-2px]">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">Withdrawn Funds</span>
                <div className="p-2.5 rounded-xl bg-slate-50 text-slate-600">
                  <Coins className="w-5 h-5 text-slate-500" />
                </div>
              </div>
              <div className="mt-4">
                <h3 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                  {renderRupees(withdrawnFunds)}
                </h3>
                <p className="text-[10px] text-slate-400 font-medium mt-1">Transferred capital to bank settlement</p>
              </div>
            </div>

            {/* KPI 4: ROI % */}
            <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-[0_4px_24px_rgba(30,41,59,0.04)] flex flex-col justify-between transition-transform duration-300 hover:translate-y-[-2px]">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">Return on Investment (ROI)</span>
                <div className="p-2.5 rounded-xl bg-blue-50 text-[#003791]">
                  <TrendingUp className="w-5 h-5 text-[#003791]" />
                </div>
              </div>
              <div className="mt-4">
                <h3 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                  {roiPercentage.toFixed(1)}%
                </h3>
                {/* Visual bar */}
                <div className="w-full bg-slate-100 h-1.5 rounded-full mt-2 overflow-hidden">
                  <div 
                    className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, roiPercentage)}%` }}
                  />
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* The Asset Display (Grid Layout) */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-extrabold text-[#003791] tracking-tight">
                Deployed Hardware Fleet
              </h2>
              <p className="text-xs text-slate-500">
                Performance statistics of your individualized inventory units currently synced to our global pool.
              </p>
            </div>
            <div className="text-xs font-bold text-slate-500 font-mono bg-white px-3 py-1.5 rounded-xl border border-slate-150">
              Total Units: <strong className="text-slate-800">{assets.length}</strong>
            </div>
          </div>

          {assets.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-150 p-12 text-center max-w-xl mx-auto space-y-4">
              <div className="p-4 bg-blue-50 text-[#003791] rounded-full w-14 h-14 flex items-center justify-center mx-auto shadow-xs">
                <Server className="w-7 h-7" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-slate-900">No Hardwares Linked</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                  We did not detect any units attached to this Partner profile. Please contact the grid operator to ingest new series under your unit identifier.
                </p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {assets.map((asset) => (
                <div 
                  key={asset.id}
                  className="bg-white rounded-2xl border border-slate-150 shadow-[0_4px_24px_rgba(30,41,59,0.02)] overflow-hidden flex flex-col justify-between hover:shadow-[0_8px_30px_rgba(30,41,59,0.06)] transition-all duration-300"
                >
                  {/* Top content */}
                  <div className="p-6 space-y-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-1">
                        <span className="text-[10px] uppercase tracking-wider font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">
                          {asset.category}
                        </span>
                        <h3 className="text-base font-bold text-slate-900 leading-tight">
                          {asset.name}
                        </h3>
                      </div>
                      {getStatusBadge(asset.status)}
                    </div>

                    <div className="pt-2 border-t border-slate-100 flex flex-col gap-1.5 text-xs text-slate-600">
                      <div className="flex justify-between items-center">
                        <span className="text-slate-405 font-medium">Serial/Unit Number:</span>
                        <strong className="font-mono text-slate-850 bg-slate-50 px-2 py-0.5 rounded-md text-[11px] border border-slate-100">
                          {asset.serialNumber}
                        </strong>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-405 font-medium">Original Cost:</span>
                        <strong className="text-slate-800">{renderRupees(asset.purchaseCost)}</strong>
                      </div>
                      <div className="flex justify-between items-center bg-slate-50 p-2.5 rounded-xl border border-slate-100 mt-2">
                        <span className="text-[#003791] font-bold">Total Earned:</span>
                        <strong className="text-[#003791] text-sm font-extrabold">
                          {renderRupees(asset.totalEarned)}
                        </strong>
                      </div>
                    </div>
                  </div>

                  {/* Button Action */}
                  <div className="px-6 pb-6 pt-2 bg-slate-50/50 border-t border-slate-100">
                    <button
                      onClick={() => setSelectedAssetForModal(asset)}
                      className="w-full bg-[#003791] hover:bg-blue-800 text-white font-bold text-xs uppercase py-3 rounded-xl transition-all shadow-xs hover:shadow-md hover:translate-y-[-1px] active:translate-y-0 tracking-wider flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <FileSpreadsheet className="w-4 h-4" />
                      View Order History
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Live Category Queue Section */}
        <div className="space-y-6">
          <div>
            <div className="flex items-center gap-2">
              <div className="p-2 bg-blue-105 text-[#003791] rounded-xl">
                <ListOrdered className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <h2 className="text-xl font-extrabold text-[#003791] tracking-tight">
                  Live Dispatch Category Queues
                </h2>
                <p className="text-xs text-slate-500">
                  Real-time FIFO queue positions for categories you are actively invested in. Older dispatches (never or ancient rentals) sit at the front of the line.
                </p>
              </div>
            </div>
          </div>

          {relevantCategories.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-150 p-8 text-center text-slate-500">
              <Sparkles className="w-8 h-8 text-blue-400 mx-auto mb-2" />
              <p className="text-sm font-semibold">No Queues Available</p>
              <p className="text-xs text-slate-400">
                You will see live category queue lines once you have assets deployed in any active hardware categories.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {relevantCategories.map((category) => {
                const queue = categoryQueues[category] || [];
                return (
                  <div 
                    key={category} 
                    className="bg-white rounded-2xl border border-slate-150 shadow-[0_4px_24px_rgba(30,41,59,0.02)] overflow-hidden flex flex-col"
                  >
                    {/* Header */}
                    <div className="bg-[#003791]/5 px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-[#003791]" />
                        <h3 className="font-extrabold text-slate-900 text-sm tracking-tight uppercase">
                          {category} Queue
                        </h3>
                      </div>
                      <span className="text-[10px] uppercase tracking-wider font-mono font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-100">
                        {queue.length} {queue.length === 1 ? 'Unit' : 'Units'} Total
                      </span>
                    </div>

                    {/* Queue List */}
                    <div className="divide-y divide-slate-100 max-h-[360px] overflow-y-auto">
                      {queue.length === 0 ? (
                        <div className="p-6 text-center text-xs text-slate-400">
                          No units registered in this category.
                        </div>
                      ) : (
                        queue.map((item, index) => {
                          const isOwn = item.ownerId === auth.currentUser?.uid;
                          const queuePosition = index + 1;

                          return (
                            <div 
                              key={item.id} 
                              className={`px-6 py-4 flex items-center justify-between gap-4 transition-all duration-250 ${
                                isOwn ? 'bg-green-50 hover:bg-green-100 border-l-4 border-emerald-500' : 'hover:bg-slate-50/50'
                              }`}
                            >
                              <div className="flex items-center gap-3.5 min-w-0">
                                {/* Position Badge */}
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-mono font-bold text-xs shrink-0 ${
                                  queuePosition === 1 
                                    ? 'bg-[#003791] text-white ring-4 ring-blue-50' 
                                    : queuePosition === 2 
                                    ? 'bg-blue-600 text-white' 
                                    : queuePosition === 3 
                                    ? 'bg-blue-500 text-white' 
                                    : 'bg-slate-100 text-slate-600'
                                }`}>
                                  {queuePosition}
                                </div>

                                <div className="min-w-0">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <h4 className="font-bold text-slate-900 text-xs truncate">
                                      {item.name}
                                    </h4>
                                    {isOwn && (
                                      <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-200">
                                        Your Asset
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                                    Unit ID: <span className="font-bold text-slate-700">{item.serialNumber}</span>
                                  </p>
                                </div>
                              </div>

                              <div className="flex flex-col items-end gap-1 shrink-0 text-right">
                                {/* Status */}
                                {item.status.toLowerCase() === 'rented' || item.status.toLowerCase() === 'on rent' || item.status.toLowerCase() === 'active' ? (
                                  <span className="inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                                    <span className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
                                    Active Rent
                                  </span>
                                ) : item.status.toLowerCase() === 'idle' || item.status.toLowerCase() === 'available' || item.status.toLowerCase() === 'idle/queue' ? (
                                  <span className="inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-blue-50 text-[#003791]">
                                    <span className="w-1 h-1 rounded-full bg-blue-500" />
                                    Idle Queue
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-amber-55 text-amber-800">
                                    Maint.
                                  </span>
                                )}

                                {/* Last rent display */}
                                <span className="text-[9px] text-slate-400 flex items-center gap-1">
                                  <Clock className="w-2.5 h-2.5 text-slate-350" />
                                  {item.lastRentedTimestamp ? (
                                    <span>
                                      {item.lastRentedTimestamp.seconds
                                        ? new Date(item.lastRentedTimestamp.seconds * 1000).toLocaleDateString(undefined, {month: 'short', day: 'numeric'})
                                        : new Date(item.lastRentedTimestamp).toLocaleDateString(undefined, {month: 'short', day: 'numeric'})}
                                    </span>
                                  ) : (
                                    <span>Never Rented</span>
                                  )}
                                </span>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>

      {/* The History Pop-up (Modal) */}
      <AnimatePresence>
        {selectedAssetForModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedAssetForModal(null)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs"
            />

            {/* Modal Body */}
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-200 w-full max-w-4xl relative z-10 text-slate-800 overflow-hidden flex flex-col max-h-[90vh]"
            >
              
              {/* Header */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6 font-sans">
                <div className="space-y-1">
                  <span className="text-[10px] uppercase font-mono tracking-widest text-[#003791] font-extrabold block">
                    LEDGER TELEMETRY REPORT
                  </span>
                  <h3 className="text-xl font-extrabold text-slate-950 tracking-tight">
                    {selectedAssetForModal.name}
                  </h3>
                  <div className="flex items-center gap-3 text-xs text-slate-550 pt-0.5">
                    <span>Serial: <strong className="font-mono text-slate-800">{selectedAssetForModal.serialNumber}</strong></span>
                    <span className="h-3 w-px bg-slate-200" />
                    <span>Total Net Revenue: <strong className="text-emerald-600 font-bold">{renderRupees(selectedAssetForModal.totalEarned)}</strong></span>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedAssetForModal(null)}
                  className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-full transition-colors cursor-pointer border border-slate-100 shadow-xs"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Table / List Container */}
              <div className="overflow-y-auto flex-grow rounded-2xl border border-slate-150 shadow-xs">
                {selectedAssetForModal.ledgers.length === 0 ? (
                  <div className="py-14 text-center text-slate-500 space-y-2 bg-slate-50/50">
                    <AlertCircle className="w-8 h-8 text-slate-400 mx-auto" />
                    <p className="text-sm font-semibold text-slate-800">No rental history for this asset yet.</p>
                    <p className="text-xs text-slate-400 max-w-xs mx-auto">
                      Whenever active order logs map to this serial number, real-time ledgers will compile here.
                    </p>
                  </div>
                ) : (
                  <div className="min-w-full overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-150 text-left font-sans text-xs">
                      <thead className="bg-[#003791]/5 text-slate-650 uppercase tracking-widest text-[9px] font-extrabold">
                        <tr>
                          <th className="px-5 py-4 font-bold">Order No</th>
                          <th className="px-5 py-4 font-bold">Dates</th>
                          <th className="px-5 py-4 font-bold text-right">Total Revenue</th>
                          <th className="px-5 py-4 font-bold text-right">Operating Expenses</th>
                          <th className="px-5 py-4 font-bold text-right text-[#003791]">Partner Net Earnings</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 bg-white">
                        {selectedAssetForModal.ledgers.map((ledger) => (
                          <tr key={ledger.id} className="hover:bg-slate-50/70 transition-colors">
                            <td className="whitespace-nowrap px-5 py-4 font-mono font-bold text-slate-800">
                              {ledger.orderNumber}
                            </td>
                            <td className="whitespace-nowrap px-5 py-4 font-medium text-slate-650">
                              {ledger.startDate ? (
                                <span className="flex items-center gap-1">
                                  <span>{ledger.startDate}</span>
                                  {ledger.endDate && (
                                    <>
                                      <span className="text-slate-350">to</span>
                                      <span>{ledger.endDate}</span>
                                    </>
                                  )}
                                </span>
                              ) : (
                                <span className="text-slate-350">-</span>
                              )}
                            </td>
                            <td className="whitespace-nowrap px-5 py-4 text-right font-mono font-extrabold text-slate-800">
                              {renderRupees(ledger.grossRevenue)}
                            </td>
                            <td className="whitespace-nowrap px-5 py-4 text-right font-mono text-slate-500">
                              {renderRupees(ledger.platformFee)}
                            </td>
                            <td className="whitespace-nowrap px-5 py-4 text-right font-mono font-black text-emerald-600 bg-emerald-50/25">
                              {renderRupees(ledger.partnerShare || ledger.netProfit)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Close Bottom Area */}
              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setSelectedAssetForModal(null)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-705 border border-slate-205 font-bold text-xs uppercase px-6 py-3 rounded-xl transition-all cursor-pointer"
                >
                  Close Report
                </button>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
