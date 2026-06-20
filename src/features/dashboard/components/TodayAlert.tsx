import { useEffect, useState } from "react";
import { collection, query, where, onSnapshot, type Unsubscribe } from "firebase/firestore";
import { db } from "../../../lib/firebase";
import { useAuth } from "../../../features/auth/hooks/useAuth";
import type { Order } from "../../../types";

export function TodayAlert() {
  const { user } = useAuth();
  const [prebooked, setPrebooked] = useState<Order[]>([]);

  useEffect(() => {
    if (!user) return;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const q = query(
      collection(db, "orders"),
      where("companyId", "==", user.companyId),
    );

    const unsub: Unsubscribe = onSnapshot(q, (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Order));
      const todayFuture = list.filter((o) => {
        if (o.status !== "future") return false;
        if (!o.deliveryDate) return false;
        const d = o.deliveryDate.toDate();
        return d >= today && d < tomorrow;
      });
      setPrebooked(todayFuture);
    });

    return () => unsub();
  }, [user]);

  if (prebooked.length === 0) return null;

  return (
    <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-900/30">
      <div className="flex items-center gap-3">
        <span className="text-lg">📅</span>
        <div>
          <p className="font-semibold text-blue-900 dark:text-blue-200">
            You have <span className="font-bold">{prebooked.length}</span> pre-booked order{prebooked.length > 1 ? "s" : ""} for today
          </p>
          <p className="text-sm text-blue-700 dark:text-blue-300">
            {prebooked.map((o) => o.customerName).join(", ")}
          </p>
        </div>
      </div>
    </div>
  );
}
