import { useState, useEffect } from "react";
import { collection, query, where, getDocs, onSnapshot, type Unsubscribe } from "firebase/firestore";
import { db } from "../../../lib/firebase";
import { Card } from "../../../components/ui/Card";
import { Badge } from "../../../components/ui/Badge";
import { EmptyState } from "../../../components/ui/EmptyState";
import { formatCurrency, formatDateTime } from "../../../lib/utils";
import { STATUS_BADGE_VARIANTS, PAYMENT_BADGE_VARIANTS } from "../../../lib/constants";
import type { Order, DeliveryEmployee } from "../../../types";

export function DeliveryViewPage() {
  const [phone, setPhone] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [deliveryName, setDeliveryName] = useState("");

  useEffect(() => {
    if (!submitted || !phone.trim()) return;

    const q = query(collection(db, "orders"), where("assignedDelivery", "==", phone.trim()));

    const unsub: Unsubscribe = onSnapshot(q, (snap) => {
      const assigned = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Order));

      const dayStart = new Date();
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(dayStart);
      dayEnd.setDate(dayEnd.getDate() + 1);
      const today = assigned.filter((o) => {
        if (!o.createdAt) return false;
        const d = o.createdAt.toDate();
        return d >= dayStart && d < dayEnd;
      });

      setOrders(today);
    });

    return () => unsub();
  }, [submitted, phone]);

  const handleLookup = async () => {
    if (!phone.trim()) return;
    const q = query(collection(db, "companies"));
    const snap = await getDocs(q);
    let found = false;
    snap.forEach((d) => {
      const data = d.data();
      const emps: DeliveryEmployee[] = data.settings?.deliveryEmployees ?? [];
      const match = emps.find((e) => e.phone === phone.trim());
      if (match) {
        setDeliveryName(match.name);
        found = true;
      }
    });
    if (!found) {
      setDeliveryName("Delivery Staff");
    }
    setSubmitted(true);
  };

  if (!submitted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-100 px-4 dark:bg-gray-950">
        <div className="w-full max-w-md rounded-xl bg-white p-8 shadow-lg dark:bg-gray-900 dark:border dark:border-gray-800">
          <h1 className="mb-2 text-center text-2xl font-bold text-primary-700 dark:text-primary-400">Delivery View</h1>
          <p className="mb-6 text-center text-sm text-gray-500 dark:text-gray-400">Enter your phone number to see today's assigned orders</p>
          <div className="space-y-4">
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Mobile number"
              onKeyDown={(e) => e.key === "Enter" && handleLookup()}
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-200 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
            />
            <button
              onClick={handleLookup}
              className="w-full rounded-lg bg-primary-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-800 dark:bg-primary-600 dark:hover:bg-primary-700"
            >
              View My Orders
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Welcome, {deliveryName}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">{orders.length} order{orders.length !== 1 ? "s" : ""} assigned today</p>
        </div>
        <button onClick={() => { setSubmitted(false); setPhone(""); }} className="text-sm text-primary-600 hover:underline dark:text-primary-400">
          Change phone
        </button>
      </div>

      {orders.length === 0 ? (
        <EmptyState title="No orders today" description="You have no deliveries assigned for today." icon={<span className="text-4xl">🚚</span>} />
      ) : (
        <div className="space-y-4">
          <Card title={`Today's Deliveries (${orders.length})`}>
            <div className="divide-y divide-gray-100 dark:divide-gray-800">
              {orders.map((order) => (
                <div key={order.id} className="py-4 first:pt-0 last:pb-0">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-gray-100">#{order.orderNumber} {order.customerName}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{order.address}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{order.phone}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900 dark:text-gray-100">{formatCurrency(order.price + order.deliveryFee)}</p>
                      <Badge variant={STATUS_BADGE_VARIANTS[order.status] ?? "default"}>{order.status}</Badge>
                      <Badge variant={PAYMENT_BADGE_VARIANTS[order.paymentStatus] ?? "default"}>{order.paymentStatus}</Badge>
                    </div>
                  </div>
                  <div className="mt-2 text-xs text-gray-400 dark:text-gray-500">
                    {order.notes && <p>Notes: {order.notes}</p>}
                    <p>{formatDateTime(order.createdAt)}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
