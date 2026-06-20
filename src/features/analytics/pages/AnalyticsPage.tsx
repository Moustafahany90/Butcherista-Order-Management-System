import { useMemo } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from "recharts";
import { Card } from "../../../components/ui/Card";
import { Skeleton } from "../../../components/ui/Skeleton";
import { EmptyState } from "../../../components/ui/EmptyState";
import { useOrders } from "../../../hooks/useOrders";
import { useCompany } from "../../../hooks/useCompany";
import { useEmployees } from "../../../hooks/useEmployees";
import { useAuth } from "../../auth/hooks/useAuth";
import { formatCurrency } from "../../../lib/utils";
import { StatsCard } from "../components/StatsCard";

const COLORS = ["#1d4ed8", "#16a34a", "#d97706", "#dc2626", "#8b5cf6", "#06b6d4"];

export function AnalyticsPage() {
  const { user } = useAuth();
  const { orders, loading } = useOrders();
  const { company } = useCompany();
  const { employees } = useEmployees();
  const zones = company?.settings.zones ?? [];

  const stats = useMemo(() => {
    const totalRevenue = orders.reduce((s, o) => s + o.price + o.deliveryFee, 0);
    const collected = orders.filter((o) => o.paymentStatus === "paid").reduce((s, o) => s + o.price + o.deliveryFee, 0);
    const pending = orders.filter((o) => o.paymentStatus === "unpaid").reduce((s, o) => s + o.price + o.deliveryFee, 0);
    return { totalOrders: orders.length, totalRevenue, collected, pending };
  }, [orders]);

  const monthlySales = useMemo(() => {
    const now = new Date();
    const months: Record<string, number> = {};
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = d.toLocaleString("en-US", { month: "short", year: "2-digit" });
      months[key] = 0;
    }
    orders.forEach((o) => {
      if (!o.createdAt) return;
      const d = o.createdAt.toDate();
      const key = d.toLocaleString("en-US", { month: "short", year: "2-digit" });
      if (key in months) months[key] += o.price + o.deliveryFee;
    });
    return Object.entries(months).map(([month, revenue]) => ({ month, revenue }));
  }, [orders]);

  const revenueByZone = useMemo(() => {
    const map: Record<string, number> = {};
    orders.forEach((o) => {
      const name = zones.find((z) => z.id === o.zone)?.name ?? o.zone;
      map[name] = (map[name] || 0) + o.price + o.deliveryFee;
    });
    return Object.entries(map).map(([zone, revenue]) => ({ zone, revenue }));
  }, [orders, zones]);

  const paymentBreakdown = useMemo(() => {
    const map: Record<string, number> = { cash: 0, visa: 0, instapay: 0, "e-wallet": 0 };
    orders.forEach((o) => { map[o.paymentMethod] = (map[o.paymentMethod] || 0) + o.price + o.deliveryFee; });
    return Object.entries(map).filter(([, amount]) => amount > 0).map(([method, amount]) => ({ method, amount }));
  }, [orders]);

  const employeePerf = useMemo(() => {
    const map: Record<string, { orders: number; revenue: number }> = {};
    orders.forEach((o) => {
      if (!map[o.createdBy]) map[o.createdBy] = { orders: 0, revenue: 0 };
      map[o.createdBy].orders++;
      map[o.createdBy].revenue += o.price + o.deliveryFee;
    });
    return Object.entries(map).map(([uid, data]) => {
      const emp = employees.find((e) => e.id === uid);
      const currentUser = uid === user?.uid;
      return { name: currentUser ? user.name : (emp?.name ?? uid.slice(0, 8)), ...data };
    });
  }, [orders, employees]);

  if (loading) {
    return <div className="space-y-4"><Skeleton className="h-8 w-48" /><Skeleton className="h-96 w-full" /></div>;
  }

  if (orders.length === 0) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Analytics</h1>
        <EmptyState title="No data yet" description="Start creating orders to see analytics." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Analytics</h1>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <StatsCard title="Total Orders" value={String(stats.totalOrders)} icon="📦" />
        <StatsCard title="Total Revenue" value={formatCurrency(stats.totalRevenue)} icon="💰" />
        <StatsCard title="Collected" value={formatCurrency(stats.collected)} icon="✅" />
        <StatsCard title="Pending" value={formatCurrency(stats.pending)} icon="⏳" />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card title="Monthly Sales (Last 6 Months)">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={monthlySales}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#9ca3af" }} />
              <YAxis tick={{ fontSize: 12, fill: "#9ca3af" }} />
              <Tooltip formatter={(v) => formatCurrency(Number(v))} contentStyle={{ backgroundColor: "#1f2937", border: "1px solid #374151", borderRadius: "8px", color: "#f3f4f6" }} />
              <Bar dataKey="revenue" fill="#1d4ed8" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card title="Revenue by Delivery Zone">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={revenueByZone}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="zone" tick={{ fontSize: 12, fill: "#9ca3af" }} />
              <YAxis tick={{ fontSize: 12, fill: "#9ca3af" }} />
              <Tooltip formatter={(v) => formatCurrency(Number(v))} contentStyle={{ backgroundColor: "#1f2937", border: "1px solid #374151", borderRadius: "8px", color: "#f3f4f6" }} />
              <Bar dataKey="revenue" fill="#16a34a" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card title="Payment Method Breakdown">
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie data={paymentBreakdown} dataKey="amount" nameKey="method" cx="50%" cy="50%" outerRadius={100} label={({ name, value }) => `${name} (${formatCurrency(Number(value))})`}>
                {paymentBreakdown.map((_, i) => (<Cell key={i} fill={COLORS[i % COLORS.length]} />))}
              </Pie>
              <Tooltip formatter={(v) => formatCurrency(Number(v))} contentStyle={{ backgroundColor: "#1f2937", border: "1px solid #374151", borderRadius: "8px", color: "#f3f4f6" }} />
            </PieChart>
          </ResponsiveContainer>
        </Card>

        <Card title="Employee Performance">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-xs uppercase text-gray-500 dark:border-gray-700 dark:text-gray-400">
                  <th className="px-4 py-3 font-medium">Employee</th>
                  <th className="px-4 py-3 font-medium">Orders</th>
                  <th className="px-4 py-3 font-medium">Revenue</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {employeePerf.map((emp) => (
                  <tr key={emp.name} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-gray-100">{emp.name}</td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{emp.orders}</td>
                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-gray-100">{formatCurrency(emp.revenue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
}
