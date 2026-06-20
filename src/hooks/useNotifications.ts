import { useEffect, useState, useCallback } from "react";
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  addDoc,
  updateDoc,
  Timestamp,
  type Unsubscribe,
} from "firebase/firestore";
import { db } from "../lib/firebase";
import { useAuth } from "../features/auth/hooks/useAuth";
import type { AppNotification, NotificationType } from "../types";

export function useNotifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, "companies", user.companyId, "notifications"),
      where("createdFor", "==", user.uid),
    );

    const unsub: Unsubscribe = onSnapshot(
      q,
      (snap) => {
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() } as AppNotification));
        list.sort((a, b) => {
          const da = a.createdAt?.toDate().getTime() ?? 0;
          const db = b.createdAt?.toDate().getTime() ?? 0;
          return db - da;
        });
        setNotifications(list);
        setLoading(false);
      },
      () => setLoading(false),
    );

    return () => unsub();
  }, [user]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markRead = useCallback(async (notificationId: string) => {
    if (!user) return;
    await updateDoc(doc(db, "companies", user.companyId, "notifications", notificationId), { read: true });
  }, [user]);

  const markAllRead = useCallback(async () => {
    if (!user) return;
    const promises = notifications.filter((n) => !n.read).map((n) =>
      updateDoc(doc(db, "companies", user.companyId, "notifications", n.id), { read: true }),
    );
    await Promise.all(promises);
  }, [user, notifications]);

  return { notifications, loading, unreadCount, markRead, markAllRead };
}

export async function createNotification(
  companyId: string,
  type: NotificationType,
  title: string,
  message: string,
  createdFor: string,
  link?: string,
) {
  await addDoc(collection(db, "companies", companyId, "notifications"), {
    companyId,
    type,
    title,
    message,
    read: false,
    link: link ?? "",
    createdAt: Timestamp.now(),
    createdFor,
  });
}
