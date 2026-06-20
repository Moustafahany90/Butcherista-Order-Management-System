import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { toast } from "sonner";
import { db } from "../../../lib/firebase";
import { Card } from "../../../components/ui/Card";
import { Skeleton } from "../../../components/ui/Skeleton";
import { useOrders } from "../../../hooks/useOrders";
import { useCompany } from "../../../hooks/useCompany";
import { OrderForm, type OrderFormValues } from "../components/OrderForm";
import type { Order } from "../../../types";

export function EditOrderPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const { updateOrder } = useOrders();
  const { company, loading: companyLoading } = useCompany();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const zones = company?.settings.zones ?? [];
  const deliveryEmployees = company?.settings.deliveryEmployees ?? [];

  useEffect(() => {
    if (!orderId) return;
    (async () => {
      const snap = await getDoc(doc(db, "orders", orderId));
      if (snap.exists()) {
        setOrder({ id: snap.id, ...snap.data() } as Order);
      }
      setLoading(false);
    })();
  }, [orderId]);

  if (loading || companyLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="py-12 text-center text-gray-500 dark:text-gray-400">Order not found</div>
    );
  }

  const defaultValues: Partial<OrderFormValues> = {
    customerName: order.customerName,
    phone: order.phone,
    address: order.address,
    zone: order.zone,
    price: order.price,
    deliveryFee: order.deliveryFee,
    paymentMethod: order.paymentMethod,
    paymentStatus: order.paymentStatus,
    status: order.status,
    source: order.source,
            notes: order.notes,
            assignedDelivery: order.assignedDelivery ?? "",
            assignedDeliveryName: order.assignedDeliveryName ?? "",
            deliveryDate: order.deliveryDate
      ? order.deliveryDate.toDate().toISOString().split("T")[0]
      : "",
  };

  const handleSubmit = async (data: OrderFormValues) => {
    if (!orderId) return;
    setSubmitting(true);
    try {
      await updateOrder(orderId, data);
      toast.success("Order updated");
      navigate("/orders");
    } catch {
      toast.error("Failed to update order");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-6 text-2xl font-bold text-gray-900 dark:text-gray-100">Edit Order</h1>
      <Card>
        <OrderForm
          defaultValues={defaultValues}
          zones={zones}
          deliveryEmployees={deliveryEmployees}
          onSubmit={handleSubmit}
          submitLabel="Update Order"
          submitting={submitting}
        />
      </Card>
    </div>
  );
}
