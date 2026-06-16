import { useState, useEffect } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";

export interface OrderItem {
  id: string;
  quantity: number;
}

export function parseLocalDate(dateStr: string): Date {
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
}

export function getEffectiveEndDate(order: any): string {
  if (Array.isArray(order.extensions) && order.extensions.length > 0) {
    const lastExt = order.extensions[order.extensions.length - 1];
    if (lastExt && (lastExt.newEndDate || lastExt.endDate)) {
      return lastExt.newEndDate || lastExt.endDate;
    }
  }
  return order["End date"] || order.endDate || "";
}

export function isInventoryOccupyingStatus(status: string): boolean {
  if (!status) return false;
  const s = status.trim().toLowerCase();
  // Expanded fail-safes for admin custom statuses
  return ["active", "confirmed", "extended", "in progress", "in-progress", "pending", "booked", "reserved"].includes(s);
}

export function parseOrderItems(order: any): OrderItem[] {
  const items: OrderItem[] = [];

  // Check if order has a native cart array
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

  // Parse from Assets string (Bulletproofed text scanner)
  const assetsStr = order.Assets || order.assets || order["Item Rented"] || "";
  if (assetsStr && typeof assetsStr === "string") {
    const patterns = [
      { id: "combo-theatre", names: ["Gaming Theatre", "Gaming Theater", "combo-theatre"] },
      { id: "combo-party", names: ["Full Party Setup", "Party Setup", "combo-party"] },
      { id: "combo-racing", names: ["PS5 Mega Racing Combo", "Mega Racing Combo", "combo-racing"] },
      { id: "hw-ps5", names: ["Play Station 5", "PlayStation 5", "PS5 console", "hw-ps5", "PS5"] }, // Added PS5
      { id: "hw-speaker", names: ["JBL Party Speaker", "JBL Speaker", "hw-speaker", "Speaker", "JBL"] }, // Added JBL
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
        // Safe scan logic
        const matches = pattern.names.some(name => part.toLowerCase().includes(name.toLowerCase()));
        if (matches) {
          items.push({ id: pattern.id, quantity: qty });
          break; // Stop checking patterns once found to avoid double counting
        }
      }
    });
  }

  return items;
}

export function useAvailability(requestedStartDate?: string, requestedEndDate?: string) {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const ordersRef = collection(db, "orders");
    const unsub = onSnapshot(ordersRef, (snapshot) => {
      const list: any[] = [];
      snapshot.forEach(docSnap => {
        list.push({ id: docSnap.id, ...docSnap.data() });
      });
      setOrders(list);
      setLoading(false);
    }, (error) => {
      console.error("useAvailability: Firestore fetch failed: ", error);
      setLoading(false);
    });

    return () => unsub();
  }, []);

  const getDatesInRange = (startStr: string, endStr: string): Date[] => {
    const dates: Date[] = [];
    const current = parseLocalDate(startStr);
    const end = parseLocalDate(endStr);

    while (current <= end) {
      dates.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
    return dates;
  };

  const isAvailable = (itemTypeOrId: string, startDate?: string, endDate?: string): boolean => {
    const sDate = startDate || requestedStartDate;
    const eDate = endDate || requestedEndDate;

    if (!sDate || !eDate) return true;

    let targetNormalizedId = itemTypeOrId.toLowerCase().trim();
    if (targetNormalizedId.includes("ps5") || targetNormalizedId.includes("play station") || targetNormalizedId.includes("playstation")) {
      targetNormalizedId = targetNormalizedId.includes("theatre") || targetNormalizedId.includes("theater") ? "combo-theatre" : "hw-ps5";
    } else if (targetNormalizedId.includes("theatre") || targetNormalizedId.includes("theater")) {
      targetNormalizedId = "combo-theatre";
    } else if (targetNormalizedId.includes("party")) {
      targetNormalizedId = "combo-party";
    } else if (targetNormalizedId.includes("speaker")) {
      targetNormalizedId = "hw-speaker";
    } else if (targetNormalizedId.includes("projector")) {
      targetNormalizedId = "hw-projector";
    }

    const targetDays = getDatesInRange(sDate, eDate);

    // Baseline Capacities
    const CAP_PS5 = 2;
    const CAP_PROJECTOR = 1;
    const CAP_SPEAKER = 1;

    for (const d of targetDays) {
      const hasEventLockout = orders.some(order => {
        const orderStatus = order.Status || order.status || "Pending";
        if (!isInventoryOccupyingStatus(orderStatus)) return false;

        const isEvent = (order.bookingType || order.type || order.booking_type || "").toLowerCase() === "event" ||
                        (order.Assets || "").toLowerCase().includes("event");
        if (!isEvent) return false;

        const oStartStr = order["Start date"] || order.startDate;
        const oEndStr = getEffectiveEndDate(order);
        if (!oStartStr || !oEndStr) return false;

        const oStart = parseLocalDate(oStartStr);
        const oEnd = parseLocalDate(oEndStr);

        return d >= oStart && d <= oEnd;
      });

      if (hasEventLockout) return false;

      let demandPS5 = 0;
      let demandProjector = 0;
      let demandSpeaker = 0;

      let overlappingOrdersCount = 0;
      const debugOrderIds: string[] = [];

      orders.forEach(order => {
        const orderStatus = order.Status || order.status || "Pending";
        if (!isInventoryOccupyingStatus(orderStatus)) return;

        const oStartStr = order["Start date"] || order.startDate;
        const oEndStr = getEffectiveEndDate(order);
        if (!oStartStr || !oEndStr) return;

        const oStart = parseLocalDate(oStartStr);
        const oEnd = parseLocalDate(oEndStr);

        if (d >= oStart && d <= oEnd) {
          overlappingOrdersCount++;
          const orderName = order.id || order["Order ID"] || "Unnamed";
          
          const bookedItems = parseOrderItems(order);
          bookedItems.forEach(item => {
            if (item.id === "hw-ps5" || item.id === "combo-theatre") {
              demandPS5 += item.quantity;
              debugOrderIds.push(`${orderName} (Takes PS5)`);
            }
            if (item.id === "hw-projector" || item.id === "combo-theatre" || item.id === "combo-party") {
              demandProjector += item.quantity;
            }
            if (item.id === "hw-speaker" || item.id === "combo-party") {
              demandSpeaker += item.quantity;
            }
          });
        }
      });

      const isEvaluatingPS5 = targetNormalizedId === "hw-ps5" || targetNormalizedId === "combo-theatre";
      if (isEvaluatingPS5) {
        console.log(`[MATH LOG] Evaluating Date: ${d.toISOString().split("T")[0]}`, {
          ordersFoundOnDate: overlappingOrdersCount,
          ordersWithPS5: debugOrderIds,
          totalPS5Demand: demandPS5,
          availableRemaining: CAP_PS5 - demandPS5
        });
      }

      let requestedPS5 = 0;
      let requestedProjector = 0;
      let requestedSpeaker = 0;

      if (targetNormalizedId === "hw-ps5") requestedPS5 = 1;
      else if (targetNormalizedId === "hw-projector") requestedProjector = 1;
      else if (targetNormalizedId === "hw-speaker") requestedSpeaker = 1;
      else if (targetNormalizedId === "combo-theatre") { requestedPS5 = 1; requestedProjector = 1; }
      else if (targetNormalizedId === "combo-party") { requestedSpeaker = 1; requestedProjector = 1; }

      if (demandPS5 + requestedPS5 > CAP_PS5) return false;
      if (demandProjector + requestedProjector > CAP_PROJECTOR) return false;
      if (demandSpeaker + requestedSpeaker > CAP_SPEAKER) return false;
    }

    return true;
  };

  const isCartAvailable = (cartItems: any[], startDate?: string, endDate?: string): boolean => {
    const sDate = startDate || requestedStartDate;
    const eDate = endDate || requestedEndDate;

    if (!sDate || !eDate || !cartItems || cartItems.length === 0) return true;

    const targetDays = getDatesInRange(sDate, eDate);
    const CAP_PS5 = 2;
    const CAP_PROJECTOR = 1;
    const CAP_SPEAKER = 1;

    for (const d of targetDays) {
      const hasEventLockout = orders.some(order => {
        const orderStatus = order.Status || order.status || "Pending";
        if (!isInventoryOccupyingStatus(orderStatus)) return false;

        const isEvent = (order.bookingType || order.type || order.booking_type || "").toLowerCase() === "event" ||
                        (order.Assets || "").toLowerCase().includes("event");
        if (!isEvent) return false;

        const oStartStr = order["Start date"] || order.startDate;
        const oEndStr = getEffectiveEndDate(order);
        if (!oStartStr || !oEndStr) return false;

        const oStart = parseLocalDate(oStartStr);
        const oEnd = parseLocalDate(oEndStr);

        return d >= oStart && d <= oEnd;
      });

      if (hasEventLockout) return false;

      let demandPS5 = 0;
      let demandProjector = 0;
      let demandSpeaker = 0;

      orders.forEach(order => {
        const orderStatus = order.Status || order.status || "Pending";
        if (!isInventoryOccupyingStatus(orderStatus)) return;

        const oStartStr = order["Start date"] || order.startDate;
        const oEndStr = getEffectiveEndDate(order);
        if (!oStartStr || !oEndStr) return;

        const oStart = parseLocalDate(oStartStr);
        const oEnd = parseLocalDate(oEndStr);

        if (d >= oStart && d <= oEnd) {
          const bookedItems = parseOrderItems(order);
          bookedItems.forEach(item => {
            if (item.id === "hw-ps5" || item.id === "combo-theatre") demandPS5 += item.quantity;
            if (item.id === "hw-projector" || item.id === "combo-theatre" || item.id === "combo-party") demandProjector += item.quantity;
            if (item.id === "hw-speaker" || item.id === "combo-party") demandSpeaker += item.quantity;
          });
        }
      });

      let requestedPS5 = 0;
      let requestedProjector = 0;
      let requestedSpeaker = 0;

      cartItems.forEach(item => {
        const qty = Number(item.quantity) || 1;
        if (item.id === "hw-ps5") requestedPS5 += qty;
        else if (item.id === "hw-projector") requestedProjector += qty;
        else if (item.id === "hw-speaker") requestedSpeaker += qty;
        else if (item.id === "combo-theatre") { requestedPS5 += qty; requestedProjector += qty; }
        else if (item.id === "combo-party") { requestedSpeaker += qty; requestedProjector += qty; }
      });

      if (demandPS5 + requestedPS5 > CAP_PS5) return false;
      if (demandProjector + requestedProjector > CAP_PROJECTOR) return false;
      if (demandSpeaker + requestedSpeaker > CAP_SPEAKER) return false;
    }

    return true;
  };

  return {
    orders,
    loading,
    isAvailable,
    isCartAvailable
  };
}