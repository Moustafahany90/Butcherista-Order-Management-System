import { useEffect, useState } from "react";
import {
  collection,
  query,
  where,
  onSnapshot,
  type Unsubscribe,
} from "firebase/firestore";
import { db } from "../lib/firebase";
import { useAuth } from "../features/auth/hooks/useAuth";
import type { AppUser } from "../types";

export function useEmployees() {
  const { user } = useAuth();
  const [employees, setEmployees] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || user.role !== "admin") return;

    const q = query(
      collection(db, "users"),
      where("companyId", "==", user.companyId),
    );

    const unsub: Unsubscribe = onSnapshot(
      q,
      (snap) => {
        const list = snap.docs
          .map((d) => ({ id: d.id, ...d.data() } as AppUser))
          .filter((u) => u.role === "employee");
        setEmployees(list);
        setLoading(false);
      },
      () => setLoading(false),
    );

    return () => unsub();
  }, [user]);

  return { employees, loading };
}
