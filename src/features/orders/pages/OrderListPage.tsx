import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Card } from "../../../components/ui/Card";
import { Badge } from "../../../components/ui/Badge";
import { Button } from "../../../components/ui/Button";
import { Skeleton } from "../../../components/ui/Skeleton";
import { EmptyState } from "../../../components/ui/EmptyState";
import { useOrders } from "../../../hooks/useOrders";
import { useCompany } from "../../../hooks/useCompany";
import { useEmployees } from "../../../hooks/useEmployees";
import { useAuth } from "../../auth/hooks/useAuth";
import { formatDateTime, formatCurrency } from "../../../lib/utils";
import {
  STATUS_BADGE_VARIANTS,
  PAYMENT_BADGE_VARIANTS,
  ORDER_STATUSES,
} from "../../../lib/constants";
import { ExcelExport } from "../components/ExcelExport";

export function OrderListPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { company } = useCompany();
  const { employees } = useEmployees();
  const [statusFilter, setStatusFilter] = useState("");
  const [zoneFilter, setZoneFilter] = useState("");
  const [empFilter, setEmpFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const isAdmin = user?.role === "admin";

  const { orders, loading, deleteOrder } = useOrders({
    status: statusFilter || undefined,
    zone: zoneFilter || undefined,
    createdBy: isAdmin ? (empFilter || undefined) : user?.uid,
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
  });

  const zones = company?.settings.zones ?? [];
  const deliveryEmployees = company?.settings.deliveryEmployees ?? [];

  const handleDelete = async (orderId: string) => {
    if (!confirm("Delete this order?")) return;
    try {
      await deleteOrder(orderId);
      toast.success("Order deleted");
    } catch {
      toast.error("Failed to delete");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          {isAdmin ? "Orders" : "My Orders"}
        </h1>
        <div className="flex gap-2">
          <ExcelExport orders={orders} />
          <Link to="/orders/new">
            <Button>+ New Order</Button>
          </Link>
        </div>
      </div>

      <Card>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-5">
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-200 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100">
            <option value="">All Statuses</option>
            {ORDER_STATUSES.map((s) => (<option key={s.value} value={s.value}>{s.label}</option>))}
          </select>

          <select value={zoneFilter} onChange={(e) => setZoneFilter(e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-200 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100">
            <option value="">All Zones</option>
            {zones.map((z) => (<option key={z.id} value={z.id}>{z.name}</option>))}
          </select>

          {isAdmin && (
            <select value={empFilter} onChange={(e) => setEmpFilter(e.target.value)}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-200 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100">
              <option value="">All Employees</option>
              {employees.map((e) => (<option key={e.id} value={e.id}>{e.name} ({e.employeeId})</option>))}
            </select>
          )}

          <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-200 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:[color-scheme:dark]" />

          <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-200 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:[color-scheme:dark]" />
        </div>
      </Card>

      <Card>
        {loading ? (
          <div className="space-y-4">{Array.from({ length: 5 }).map((_, i) => (<Skeleton key={i} className="h-14 w-full" />))}</div>
        ) : orders.length === 0 ? (
          <EmptyState title="No orders yet" description="Create your first order to get started." action={<Link to="/orders/new"><Button>+ New Order</Button></Link>} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-xs uppercase text-gray-500 dark:border-gray-700 dark:text-gray-400">
                  <th className="px-4 py-3 font-medium w-16"># ID</th>
                  <th className="px-4 py-3 font-medium">Customer</th>
                  <th className="px-4 py-3 font-medium">Zone</th>
                  <th className="px-4 py-3 font-medium">Delivery</th>
                  <th className="px-4 py-3 font-medium">Total</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Payment</th>
                  <th className="px-4 py-3 font-medium">Source</th>
                  <th className="px-4 py-3 font-medium">Date</th>
                  <th className="px-4 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {orders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <td className="px-4 py-3 text-xs font-mono text-gray-500 dark:text-gray-400">#{order.orderNumber}</td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900 dark:text-gray-100">{order.customerName}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{order.phone}</p>
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{zones.find((z) => z.id === order.zone)?.name ?? order.zone}</td>
                    <td className="px-4 py-3 text-xs text-gray-500 dark:text-gray-400">{deliveryEmployees.find((d) => d.phone === order.assignedDelivery)?.name ?? (order.assignedDelivery || "—")}</td>
                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-gray-100">{formatCurrency(order.price + order.deliveryFee)}</td>
                    <td className="px-4 py-3"><Badge variant={STATUS_BADGE_VARIANTS[order.status] ?? "default"}>{order.status}</Badge></td>
                    <td className="px-4 py-3"><Badge variant={PAYMENT_BADGE_VARIANTS[order.paymentStatus] ?? "default"}>{order.paymentStatus}</Badge></td>
                    <td className="px-4 py-3 text-xs text-gray-500 dark:text-gray-400">{order.source}</td>
                    <td className="px-4 py-3 text-xs text-gray-500 dark:text-gray-400">{formatDateTime(order.createdAt)}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button onClick={() => navigate(`/orders/${order.id}/edit`)} className="text-sm text-primary-600 hover:text-primary-800 dark:text-primary-400 dark:hover:text-primary-300">Edit</button>
                        {isAdmin && (
                          <button onClick={() => handleDelete(order.id)} className="text-sm text-danger hover:text-red-800">Delete</button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
