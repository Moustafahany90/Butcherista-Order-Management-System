import { useEffect, useState } from "react";
import { collection, onSnapshot, type Unsubscribe } from "firebase/firestore";
import { db } from "../../../lib/firebase";
import { Card } from "../../../components/ui/Card";
import { Skeleton } from "../../../components/ui/Skeleton";
import { formatDate } from "../../../lib/utils";
import type { Company } from "../../../types";

export function SuperAdminPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub: Unsubscribe = onSnapshot(
      collection(db, "companies"),
      (snap) => {
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Company));
        setCompanies(list);
        setLoading(false);
      },
      () => setLoading(false),
    );
    return () => unsub();
  }, []);

  if (loading) {
    return <div className="space-y-4"><Skeleton className="h-8 w-48" /><Skeleton className="h-64 w-full" /></div>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Super Admin</h1>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card title="Total Companies" subtitle="All registered">
          <p className="text-3xl font-bold text-primary-700 dark:text-primary-400">{companies.length}</p>
        </Card>
      </div>

      <Card title="All Companies">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-xs uppercase text-gray-500 dark:border-gray-700 dark:text-gray-400">
                <th className="px-4 py-3 font-medium">Company</th>
                <th className="px-4 py-3 font-medium">Domain</th>
                <th className="px-4 py-3 font-medium">Plan</th>
                <th className="px-4 py-3 font-medium">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {companies.map((c) => (
                <tr key={c.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                  <td className="px-4 py-3 font-medium text-gray-900 dark:text-gray-100">{c.name}</td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{c.domain}</td>
                  <td className="px-4 py-3 capitalize text-gray-700 dark:text-gray-300">{c.plan}</td>
                  <td className="px-4 py-3 text-xs text-gray-500 dark:text-gray-400">{formatDate(c.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
