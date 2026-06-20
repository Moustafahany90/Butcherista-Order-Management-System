import { useEffect, useState } from "react";
import { collection, query, where, onSnapshot, type Unsubscribe } from "firebase/firestore";
import { db } from "../../../lib/firebase";
import { useAuth } from "../../auth/hooks/useAuth";
import { useEmployees } from "../../../hooks/useEmployees";
import { useCompany } from "../../../hooks/useCompany";
import { Card } from "../../../components/ui/Card";
import { Skeleton } from "../../../components/ui/Skeleton";
import { EmptyState } from "../../../components/ui/EmptyState";
import { formatCurrency, formatDateTime } from "../../../lib/utils";
import { Link } from "react-router-dom";
import { Button } from "../../../components/ui/Button";
import type { Order } from "../../../types";

export function AdminDashboard() {
  const { user } = useAuth();
  const { employees } = useEmployees();
  const { company } = useCompany();
  const zones = company?.settings?.zones ?? [];
  const [todayOrders, setTodayOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const dayStart = new Date();
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(dayStart);
    dayEnd.setDate(dayEnd.getDate() + 1);

    const q = query(
      collection(db, "orders"),
      where("companyId", "==", user.companyId),
    );

    const unsub: Unsubscribe = onSnapshot(q, (snap) => {
      const all = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Order));
      const today = all.filter((o) => {
        if (!o.createdAt) return false;
        const d = o.createdAt.toDate();
        return d >= dayStart && d < dayEnd;
      });
      setTodayOrders(today);
      setLoading(false);
    });

    return () => unsub();
  }, [user]);

  const activeEmployees = employees.filter((e) => e.active).length;
  const todayRevenue = todayOrders.reduce((s, o) => s + o.price + o.deliveryFee, 0);
  const pendingOrders = todayOrders.filter((o) => o.paymentStatus !== "paid");
  const recentOrders = todayOrders.slice(0, 5);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Admin Dashboard</h1>
        <Link to="/orders/new"><Button>+ New Order</Button></Link>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <Card title="Today's Orders" subtitle="Orders placed today">
          <p className="text-3xl font-bold text-primary-700 dark:text-primary-400">{todayOrders.length}</p>
        </Card>
        <Card title="Revenue" subtitle="Today">
          <p className="text-3xl font-bold text-success">{formatCurrency(todayRevenue)}</p>
        </Card>
        <Card title="Active Employees" subtitle="Currently active">
          <p className="text-3xl font-bold text-info">{activeEmployees}</p>
        </Card>
        <Card title="Pending" subtitle="Unpaid orders today">
          <p className="text-3xl font-bold text-warning">{pendingOrders.length}</p>
        </Card>
      </div>

      <Card title="Recent Orders Today">
        {recentOrders.length === 0 ? (
          <EmptyState
            title="No orders today"
            description="Start by creating your first order."
            action={<Link to="/orders/new"><Button>+ New Order</Button></Link>}
          />
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {recentOrders.map((order) => (
              <div key={order.id} className="flex items-center justify-between py-3">
                <div>
                  <p className="font-medium text-gray-900 dark:text-gray-100">
                    <span className="text-xs text-gray-500 dark:text-gray-400">#{order.orderNumber}</span> {order.customerName}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{order.status} · {zones.find((z) => z.id === order.zone)?.name ?? order.zone} · {formatDateTime(order.createdAt)}</p>
                </div>
                <p className="font-semibold text-gray-900 dark:text-gray-100">{formatCurrency(order.price + order.deliveryFee)}</p>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
