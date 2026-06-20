import { useEffect, useState, useCallback } from "react";
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  runTransaction,
  Timestamp,
  type Unsubscribe,
} from "firebase/firestore";
import { db } from "../lib/firebase";
import { useAuth } from "../features/auth/hooks/useAuth";
import { createNotification } from "./useNotifications";
import { sendTelegramOrderAlert } from "../lib/telegram";
import type { Order, OrderFormData } from "../types";

interface UseOrdersOptions {
  status?: string;
  zone?: string;
  createdBy?: string;
  dateFrom?: string;
  dateTo?: string;
}

export function useOrders(options: UseOrdersOptions = {}) {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, "orders"),
      where("companyId", "==", user.companyId),
    );

    const unsub: Unsubscribe = onSnapshot(
      q,
      (snap) => {
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Order));

        let filtered = list;

        if (options.createdBy) {
          filtered = filtered.filter((o) => o.createdBy === options.createdBy);
        }
        if (options.status) {
          filtered = filtered.filter((o) => o.status === options.status);
        }
        if (options.zone) {
          filtered = filtered.filter((o) => o.zone === options.zone);
        }
        if (options.dateFrom) {
          const from = new Date(options.dateFrom);
          filtered = filtered.filter((o) => {
            const d = o.createdAt?.toDate();
            return d ? d >= from : false;
          });
        }
        if (options.dateTo) {
          const to = new Date(options.dateTo);
          to.setHours(23, 59, 59, 999);
          filtered = filtered.filter((o) => {
            const d = o.createdAt?.toDate();
            return d ? d <= to : false;
          });
        }

        filtered.sort((a, b) => {
          const da = a.createdAt?.toDate().getTime() ?? 0;
          const db = b.createdAt?.toDate().getTime() ?? 0;
          return db - da;
        });

        setOrders(filtered);
        setLoading(false);
      },
      (err) => {
        console.error("Orders subscription error:", err);
        setLoading(false);
      },
    );

    return () => unsub();
  }, [user, options.status, options.zone, options.createdBy, options.dateFrom, options.dateTo]);

  const createOrder = useCallback(
    async (data: OrderFormData) => {
      if (!user) return;

      const companyRef = doc(db, "companies", user.companyId);
      const orderNumber = await runTransaction<number>(db, async (transaction) => {
        const companySnap = await transaction.get(companyRef);
        const current = companySnap.data()?.orderCounter ?? 0;
        const next = current + 1;
        transaction.update(companyRef, { orderCounter: next });
        return next;
      });

      await addDoc(collection(db, "orders"), {
        orderNumber,
        companyId: user.companyId,
        customerName: data.customerName,
        phone: data.phone,
        address: data.address,
        zone: data.zone,
        price: Number(data.price),
        deliveryFee: Number(data.deliveryFee),
        paymentMethod: data.paymentMethod,
        paymentStatus: data.paymentStatus,
        status: data.status,
        source: data.source,
        notes: data.notes,
        deliveryDate: data.deliveryDate ? Timestamp.fromDate(new Date(data.deliveryDate)) : null,
        assignedDelivery: data.assignedDelivery,
        assignedDeliveryName: data.assignedDeliveryName,
        createdBy: user.uid,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        updatedBy: user.uid,
      });

      await createNotification(
        user.companyId,
        "order_created",
        `Order #${orderNumber} Created`,
        `${user.name} created order for ${data.customerName} — ${data.status}`,
        user.uid,
        "/orders",
      );

      if (data.assignedDelivery) {
        sendTelegramOrderAlert({
          orderNumber,
          customerName: data.customerName,
          phone: data.phone,
          address: data.address,
          zone: data.zone,
          price: Number(data.price),
          deliveryFee: Number(data.deliveryFee),
          paymentMethod: data.paymentMethod,
          paymentStatus: data.paymentStatus,
          assignedDelivery: data.assignedDelivery,
          assignedDeliveryName: data.assignedDeliveryName,
          notes: data.notes,
        });
      }
    },
    [user],
  );

  const updateOrder = useCallback(
    async (orderId: string, data: Partial<OrderFormData>) => {
      if (!user) return;
      const orderSnap = await getDoc(doc(db, "orders", orderId));
      const orderNumber = orderSnap.data()?.orderNumber;
      const payload: Record<string, unknown> = { ...data, updatedAt: Timestamp.now(), updatedBy: user.uid };
      if (data.deliveryDate) {
        payload.deliveryDate = Timestamp.fromDate(new Date(data.deliveryDate));
      }
      await updateDoc(doc(db, "orders", orderId), payload);
      await createNotification(
        user.companyId,
        "order_updated",
        `Order #${orderNumber} Updated`,
        `${user.name} updated order #${orderNumber}`,
        user.uid,
        `/orders/${orderId}/edit`,
      );
    },
    [user],
  );

  const deleteOrder = useCallback(
    async (orderId: string) => {
      if (!user) return;
      await deleteDoc(doc(db, "orders", orderId));
    },
    [user],
  );

  return { orders, loading, createOrder, updateOrder, deleteOrder };
}
