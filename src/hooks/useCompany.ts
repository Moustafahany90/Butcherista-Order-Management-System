import { useEffect, useState } from "react";
import { doc, onSnapshot, type Unsubscribe } from "firebase/firestore";
import { db } from "../lib/firebase";
import { useAuth } from "../features/auth/hooks/useAuth";
import type { Company } from "../types";

export function useCompany() {
  const { user } = useAuth();
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const unsub: Unsubscribe = onSnapshot(
      doc(db, "companies", user.companyId),
      (snap) => {
        if (snap.exists()) {
          setCompany({ id: snap.id, ...snap.data() } as Company);
        }
        setLoading(false);
      },
      () => setLoading(false),
    );

    return () => unsub();
  }, [user]);

  return { company, loading };
}
