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
import type { Zone } from "../../../types";

const inputClass = "w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-200 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:focus:ring-primary-800";

export function ZoneListPage() {
  const { user } = useAuth();
  const { company, loading } = useCompany();
  const [zones, setZones] = useState<Zone[]>([]);

  useEffect(() => {
    if (company) setZones(company.settings?.zones ?? []);
  }, [company]);

  const addZone = () => {
    const id = `zone-${Date.now()}`;
    setZones([...zones, { id, name: "", fee: 0 }]);
  };

  const updateZone = (id: string, field: "name" | "fee", value: string | number) => {
    setZones(zones.map((z) => (z.id === id ? { ...z, [field]: value } : z)));
  };

  const removeZone = (id: string) => {
    setZones(zones.filter((z) => z.id !== id));
  };

  const save = async () => {
    if (!user) return;
    const cleaned = zones.filter((z) => z.name.trim());
    if (cleaned.length === 0) {
      toast.error("At least one zone with a name is required");
      return;
    }
    try {
      await updateDoc(doc(db, "companies", user.companyId), {
        "settings.zones": cleaned,
      });
      toast.success("Zones saved");
    } catch {
      toast.error("Failed to save zones");
    }
  };

  if (loading) {
    return <div className="space-y-4"><Skeleton className="h-8 w-48" /><Skeleton className="h-64 w-full" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Delivery Zones</h1>
        <Button onClick={addZone}>+ Add Zone</Button>
      </div>

      <Card>
        {zones.length === 0 ? (
          <EmptyState title="No zones defined" description="Add delivery zones with custom fees." action={<Button onClick={addZone}>+ Add Zone</Button>} />
        ) : (
          <div className="space-y-3">
            {zones.map((zone) => (
              <div key={zone.id} className="flex items-center gap-3 rounded-lg border border-gray-200 p-3 dark:border-gray-700">
                <input
                  value={zone.name}
                  onChange={(e) => updateZone(zone.id, "name", e.target.value)}
                  placeholder="Zone name"
                  className={inputClass}
                />
                <div className="flex items-center gap-1">
                  <span className="text-sm text-gray-500 dark:text-gray-400">EGP</span>
                  <input
                    type="number"
                    step="0.01"
                    value={zone.fee}
                    onChange={(e) => updateZone(zone.id, "fee", Number(e.target.value))}
                    className={`${inputClass} w-24`}
                  />
                </div>
                <button onClick={() => removeZone(zone.id)} className="text-sm text-danger hover:text-red-800">Remove</button>
              </div>
            ))}
          </div>
        )}
      </Card>

      {zones.length > 0 && (
        <div className="flex justify-end">
          <Button onClick={save}>Save Zones</Button>
        </div>
      )}
    </div>
  );
}
