import { useForm } from "react-hook-form";
import { z } from "zod/v4";
import { zodResolver } from "@hookform/resolvers/zod";
import type { Zone, DeliveryEmployee } from "../../../types";

const orderSchema = z.object({
  customerName: z.string().min(1, "Customer name is required"),
  phone: z.string().min(1, "Phone is required"),
  address: z.string().min(1, "Address is required"),
  zone: z.string().min(1, "Zone is required"),
  price: z.number({ message: "Must be a number" }).min(0, "Price must be 0 or more"),
  deliveryFee: z.number({ message: "Must be a number" }).min(0, "Fee must be 0 or more"),
  paymentMethod: z.enum(["cash", "visa", "instapay", "e-wallet"]),
  paymentStatus: z.enum(["paid", "unpaid", "partial"]),
  status: z.enum(["new", "inprogress", "done", "cancelled", "future"]),
  source: z.enum(["website", "phone", "whatsapp", "instagram", "email"]),
  notes: z.string(),
  deliveryDate: z.string(),
  assignedDelivery: z.string(),
  assignedDeliveryName: z.string(),
});

export type OrderFormValues = z.infer<typeof orderSchema>;

interface OrderFormProps {
  defaultValues?: Partial<OrderFormValues>;
  zones: Zone[];
  deliveryEmployees?: DeliveryEmployee[];
  onSubmit: (data: OrderFormValues) => Promise<void>;
  submitLabel: string;
  submitting: boolean;
}

const inputClass = "w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-200 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:focus:ring-primary-800";
const labelClass = "mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300";

export function OrderForm({
  defaultValues,
  zones,
  deliveryEmployees = [],
  onSubmit,
  submitLabel,
  submitting,
}: OrderFormProps) {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<OrderFormValues>({
    resolver: zodResolver(orderSchema),
    defaultValues: {
      status: "new",
      paymentMethod: "cash",
      paymentStatus: "unpaid",
      source: "phone",
      deliveryFee: 0,
      price: 0,
      notes: "",
      deliveryDate: "",
      assignedDelivery: "",
      assignedDeliveryName: "",
      ...defaultValues,
    },
  });

  const selectedZone = watch("zone");
  const selectedDelivery = watch("assignedDelivery");

  const handleZoneChange = (zoneId: string) => {
    setValue("zone", zoneId);
    const zone = zones.find((z) => z.id === zoneId);
    if (zone) setValue("deliveryFee", zone.fee);
  };

  const handleDeliveryChange = (phone: string) => {
    setValue("assignedDelivery", phone);
    const emp = deliveryEmployees.find((d) => d.phone === phone);
    setValue("assignedDeliveryName", emp?.name ?? "");
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <div>
          <label className={labelClass}>Customer Name</label>
          <input {...register("customerName")} className={inputClass} />
          {errors.customerName && <p className="mt-1 text-xs text-danger">{errors.customerName.message}</p>}
        </div>

        <div>
          <label className={labelClass}>Phone</label>
          <input {...register("phone")} className={inputClass} />
          {errors.phone && <p className="mt-1 text-xs text-danger">{errors.phone.message}</p>}
        </div>

        <div className="md:col-span-2">
          <label className={labelClass}>Address</label>
          <input {...register("address")} className={inputClass} />
          {errors.address && <p className="mt-1 text-xs text-danger">{errors.address.message}</p>}
        </div>

        <div>
          <label className={labelClass}>Delivery Zone</label>
          <select
            value={selectedZone}
            onChange={(e) => handleZoneChange(e.target.value)}
            className={inputClass}
          >
            <option value="">Select zone</option>
            {zones.map((z) => (
              <option key={z.id} value={z.id}>
                {z.name} — EGP {z.fee}
              </option>
            ))}
          </select>
          {errors.zone && <p className="mt-1 text-xs text-danger">{errors.zone.message}</p>}
        </div>

        <div>
          <label className={labelClass}>Delivery Fee (EGP)</label>
          <input type="number" step="0.01" {...register("deliveryFee", { valueAsNumber: true })} className={`${inputClass} bg-gray-50 dark:bg-gray-700`} readOnly />
        </div>

        <div>
          <label className={labelClass}>Price (EGP)</label>
          <input type="number" step="0.01" {...register("price", { valueAsNumber: true })} className={inputClass} />
          {errors.price && <p className="mt-1 text-xs text-danger">{errors.price.message}</p>}
        </div>

        <div>
          <label className={labelClass}>Payment Method</label>
          <select {...register("paymentMethod")} className={inputClass}>
            <option value="cash">Cash</option>
            <option value="visa">Visa</option>
            <option value="instapay">InstaPay</option>
            <option value="e-wallet">E-Wallet</option>
          </select>
        </div>

        <div>
          <label className={labelClass}>Payment Status</label>
          <select {...register("paymentStatus")} className={inputClass}>
            <option value="paid">Paid</option>
            <option value="unpaid">Unpaid</option>
            <option value="partial">Partial</option>
          </select>
        </div>

        <div>
          <label className={labelClass}>Order Status</label>
          <select {...register("status")} className={inputClass}>
            <option value="new">New</option>
            <option value="inprogress">In Progress</option>
            <option value="done">Done</option>
            <option value="cancelled">Cancelled</option>
            <option value="future">Future</option>
          </select>
        </div>

        <div>
          <label className={labelClass}>Source</label>
          <select {...register("source")} className={inputClass}>
            <option value="phone">Phone</option>
            <option value="whatsapp">WhatsApp</option>
            <option value="instagram">Instagram</option>
            <option value="website">Website</option>
            <option value="email">Email</option>
          </select>
        </div>

        <div>
          <label className={labelClass}>Assign Delivery</label>
          <select
            value={selectedDelivery}
            onChange={(e) => handleDeliveryChange(e.target.value)}
            className={inputClass}
          >
            <option value="">Not assigned</option>
            {deliveryEmployees.map((de) => (
              <option key={de.id} value={de.phone}>{de.name} — {de.phone}</option>
            ))}
          </select>
        </div>

        <div>
          <label className={labelClass}>Delivery Date</label>
          <input type="date" {...register("deliveryDate")} className={`${inputClass} dark:[color-scheme:dark]`} />
        </div>

        <div className="md:col-span-2">
          <label className={labelClass}>Notes</label>
          <textarea rows={3} {...register("notes")} className={inputClass} />
        </div>
      </div>

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={submitting}
          className="rounded-lg bg-primary-700 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-800 disabled:opacity-50 dark:bg-primary-600 dark:hover:bg-primary-700"
        >
          {submitting ? "Saving..." : submitLabel}
        </button>
      </div>
    </form>
  );
}
