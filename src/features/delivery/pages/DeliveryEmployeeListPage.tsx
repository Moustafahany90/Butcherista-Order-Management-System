import { useState, useEffect } from "react";
import { doc, updateDoc } from "firebase/firestore";
import { toast } from "sonner";
import { db } from "../../../lib/firebase";
import { Card } from "../../../components/ui/Card";
import { Button } from "../../../components/ui/Button";
import { Skeleton } from "../../../components/ui/Skeleton";
import { EmptyState } from "../../../components/ui/EmptyState";
import { useCompany } from "../../../hooks/useCompany";
import { useAuth } from "../../auth/hooks/useAuth";
import type { DeliveryEmployee } from "../../../types";

export function DeliveryEmployeeListPage() {
  const { user } = useAuth();
  const { company, loading } = useCompany();
  const [employees, setEmployees] = useState<DeliveryEmployee[]>([]);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");

  useEffect(() => {
    if (company) {
      setEmployees(company.settings?.deliveryEmployees ?? []);
    }
  }, [company]);

  const add = () => {
    if (!name.trim() || !phone.trim()) return;
    setEmployees([...employees, { id: `del-${Date.now()}`, name: name.trim(), phone: phone.trim() }]);
    setName("");
    setPhone("");
  };

  const remove = (id: string) => {
    setEmployees(employees.filter((e) => e.id !== id));
  };

  const save = async () => {
    if (!user) return;
    try {
      await updateDoc(doc(db, "companies", user.companyId), {
        "settings.deliveryEmployees": employees,
      });
      toast.success("Delivery employees saved");
    } catch {
      toast.error("Failed to save");
    }
  };

  const inputClass = "w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-200 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100";

  if (loading) {
    return <div className="space-y-4"><Skeleton className="h-8 w-48" /><Skeleton className="h-64 w-full" /></div>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Delivery Employees</h1>

      <Card title="Add Delivery Employee" subtitle="Track delivery staff by name and phone">
        <div className="flex gap-3">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" className={inputClass} />
          <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Mobile number" className={inputClass} />
          <Button onClick={add} variant="secondary">Add</Button>
        </div>
      </Card>

      <Card title="Delivery Staff">
        {employees.length === 0 ? (
          <EmptyState title="No delivery employees" description="Add your first delivery employee above." />
        ) : (
          <div className="space-y-2">
            {employees.map((emp) => (
              <div key={emp.id} className="flex items-center justify-between rounded-lg border border-gray-200 p-3 dark:border-gray-700">
                <div>
                  <p className="font-medium text-gray-900 dark:text-gray-100">{emp.name}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{emp.phone}</p>
                </div>
                <button onClick={() => remove(emp.id)} className="text-sm text-danger">Remove</button>
              </div>
            ))}
          </div>
        )}
      </Card>

      {employees.length > 0 && (
        <div className="flex justify-end">
          <Button onClick={save}>Save Changes</Button>
        </div>
      )}
    </div>
  );
}
