import type { OrderStatus, PaymentMethod, PaymentStatus, OrderSource } from "../types";

export const ORDER_STATUSES: { value: OrderStatus; label: string }[] = [
  { value: "new", label: "New" },
  { value: "inprogress", label: "In Progress" },
  { value: "done", label: "Done" },
  { value: "cancelled", label: "Cancelled" },
  { value: "future", label: "Future" },
];

export const PAYMENT_METHODS: { value: PaymentMethod; label: string }[] = [
  { value: "cash", label: "Cash" },
  { value: "visa", label: "Visa" },
  { value: "instapay", label: "InstaPay" },
  { value: "e-wallet", label: "E-Wallet" },
];

export const PAYMENT_STATUSES: { value: PaymentStatus; label: string }[] = [
  { value: "paid", label: "Paid" },
  { value: "unpaid", label: "Unpaid" },
  { value: "partial", label: "Partial" },
];

export const ORDER_SOURCES: { value: OrderSource; label: string }[] = [
  { value: "website", label: "Website" },
  { value: "phone", label: "Phone" },
  { value: "whatsapp", label: "WhatsApp" },
  { value: "instagram", label: "Instagram" },
  { value: "email", label: "Email" },
];

export const STATUS_BADGE_VARIANTS: Record<string, "info" | "warning" | "success" | "danger" | "default"> = {
  new: "info",
  inprogress: "warning",
  done: "success",
  cancelled: "danger",
  future: "default",
};

export const PAYMENT_BADGE_VARIANTS: Record<string, "success" | "danger" | "warning"> = {
  paid: "success",
  unpaid: "danger",
  partial: "warning",
};
