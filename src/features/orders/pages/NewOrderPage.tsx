import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Card } from "../../../components/ui/Card";
import { useOrders } from "../../../hooks/useOrders";
import { useCompany } from "../../../hooks/useCompany";
import { Skeleton } from "../../../components/ui/Skeleton";
import { OrderForm, type OrderFormValues } from "../components/OrderForm";

export function NewOrderPage() {
  const navigate = useNavigate();
  const { createOrder } = useOrders();
  const { company, loading } = useCompany();
  const [submitting, setSubmitting] = useState(false);

  const zones = company?.settings.zones ?? [];
  const deliveryEmployees = company?.settings.deliveryEmployees ?? [];

  const handleSubmit = async (data: OrderFormValues) => {
    setSubmitting(true);
    try {
      await createOrder(data);
      toast.success("Order created successfully");
      navigate("/orders");
    } catch {
      toast.error("Failed to create order");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-6 text-2xl font-bold text-gray-900 dark:text-gray-100">New Order</h1>
      <Card>
        <OrderForm
          zones={zones}
          deliveryEmployees={deliveryEmployees}
          onSubmit={handleSubmit}
          submitLabel="Create Order"
          submitting={submitting}
        />
      </Card>
    </div>
  );
}
