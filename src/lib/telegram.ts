export async function sendTelegramOrderAlert(order: {
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
}) {
  const token = import.meta.env.VITE_TELEGRAM_BOT_TOKEN;
  const chatId = import.meta.env.VITE_TELEGRAM_CHAT_ID;
  if (!token || !chatId || !order.assignedDelivery) return;

  const total = (order.price + order.deliveryFee).toFixed(2);

  const text = [
    "🚚 NEW DELIVERY ORDER",
    `Order: #${order.orderNumber}`,
    `Customer: ${order.customerName}`,
    `Phone: ${order.phone}`,
    `Address: ${order.address}`,
    `Zone: ${order.zone}`,
    `Total: EGP ${total}`,
    `Payment: ${order.paymentMethod} (${order.paymentStatus})`,
    `Delivery: ${order.assignedDeliveryName} — ${order.assignedDelivery}`,
    `Notes: ${order.notes || "—"}`,
  ].join("\n");

  try {
    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: Number(chatId), text }),
    });
  } catch {
    console.warn("Telegram send failed (order still saved)");
  }
}
