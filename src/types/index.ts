import type { Timestamp } from "firebase/firestore";

export type TimestampValue = Timestamp | null | undefined;

export type Plan = "basic" | "pro" | "enterprise";

export type Role = "admin" | "employee" | "superadmin";
export type OrderStatus = "new" | "inprogress" | "done" | "cancelled" | "future";
export type PaymentMethod = "cash" | "visa" | "instapay" | "e-wallet";
export type PaymentStatus = "paid" | "unpaid" | "partial";
export type OrderSource = "website" | "phone" | "whatsapp" | "instagram" | "email";
export type NotificationType = "order_created" | "order_updated" | "prebook_reminder" | "payment_reminder" | "employee_joined";

export interface Zone {
  id: string;
  name: string;
  fee: number;
}

export interface DeliveryEmployee {
  id: string;
  name: string;
  phone: string;
}

export interface CompanySettings {
  zones: Zone[];
  currency: string;
  orderSources: OrderSource[];
  deliveryEmployees: DeliveryEmployee[];
}

export interface Company {
  id: string;
  name: string;
  domain: string;
  plan: Plan;
  createdAt: TimestampValue;
  settings: CompanySettings;
}

export interface AppUser {
  id: string;
  companyId: string;
  employeeId: string;
  name: string;
  role: Role;
  active: boolean;
  createdAt: TimestampValue;
  createdBy: string;
}

export interface AppNotification {
  id: string;
  companyId: string;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  link?: string;
  createdAt: TimestampValue;
  createdFor: string;
}

export interface Order {
  id: string;
  orderNumber: number;
  companyId: string;
  customerName: string;
  phone: string;
  address: string;
  zone: string;
  price: number;
  deliveryFee: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  status: OrderStatus;
  source: OrderSource;
  notes: string;
  deliveryDate: TimestampValue;
  assignedDelivery: string;
  assignedDeliveryName: string;
  createdBy: string;
  createdAt: TimestampValue;
  updatedAt: TimestampValue;
  updatedBy: string;
}

export interface OrderFormData {
  customerName: string;
  phone: string;
  address: string;
  zone: string;
  price: number;
  deliveryFee: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  status: OrderStatus;
  source: OrderSource;
  notes: string;
  deliveryDate: string;
  assignedDelivery: string;
  assignedDeliveryName: string;
}

export interface EmployeeFormData {
  name: string;
  employeeId: string;
  password: string;
}

export interface AnalyticsData {
  monthlySales: { month: string; revenue: number }[];
  revenueByZone: { zone: string; revenue: number }[];
  paymentMethodBreakdown: { method: string; amount: number }[];
  employeePerformance: { name: string; orders: number; revenue: number }[];
  collectedVsPending: { collected: number; pending: number };
}
