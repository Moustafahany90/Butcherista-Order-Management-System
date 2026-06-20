import { getFunctions, httpsCallable } from "firebase/functions";
import app from "./firebase";

const functions = getFunctions(app);

type OrderAlert = {
  orderNumber: number;
  customerName: string;
  phone: string;
  address: string;
  zone: string;
  price: number;
  deliveryFee: number;
  paymentMethod: string;
  paymentStatus: string;
  assignedDelivery: string;
  assignedDeliveryName: string;
  notes: string;
};

export async function sendTelegramOrderAlert(order: OrderAlert) {
  if (!order.assignedDelivery) return;

  try {
    const alertFn = httpsCallable(functions, "sendTelegramAlert");
    const result = await alertFn(order);
    const data = result.data as { sent: boolean };
    if (!data.sent) {
      console.warn("Telegram alert not sent (may be expected if no delivery assigned)");
    }
  } catch {
    console.warn("Telegram send failed (order still saved)");
  }
}
