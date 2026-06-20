import { type Timestamp } from "firebase/firestore";

export type TimestampValue = Timestamp | null | undefined;

export function formatCurrency(amount: number, currency = "EGP"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(amount);
}

export function formatDate(timestamp: TimestampValue): string {
  if (!timestamp) return "—";
  return timestamp.toDate().toLocaleDateString("en-US", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function formatDateTime(timestamp: TimestampValue): string {
  if (!timestamp) return "—";
  return timestamp.toDate().toLocaleString("en-US", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function getOrderStatusColor(status: string): string {
  const map: Record<string, string> = {
    new: "bg-order-new",
    inprogress: "bg-order-progress",
    done: "bg-order-done",
    cancelled: "bg-order-cancelled",
    future: "bg-order-future",
  };
  return map[status] ?? "bg-gray-400";
}
