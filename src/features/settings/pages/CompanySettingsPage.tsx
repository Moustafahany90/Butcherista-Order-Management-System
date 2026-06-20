import { useState, useEffect } from "react";
import { doc, updateDoc } from "firebase/firestore";
import { toast } from "sonner";
import { db } from "../../../lib/firebase";
import { Card } from "../../../components/ui/Card";
import { Button } from "../../../components/ui/Button";
import { Skeleton } from "../../../components/ui/Skeleton";
import { useCompany } from "../../../hooks/useCompany";
import { useAuth } from "../../auth/hooks/useAuth";
import type { OrderSource } from "../../../types";

const ALL_SOURCES: { value: OrderSource; label: string }[] = [
  { value: "phone", label: "Phone" },
  { value: "whatsapp", label: "WhatsApp" },
  { value: "instagram", label: "Instagram" },
  { value: "website", label: "Website" },
  { value: "email", label: "Email" },
];

export function CompanySettingsPage() {
  const { user } = useAuth();
  const { company, loading } = useCompany();
  const [name, setName] = useState("");
  const [currency, setCurrency] = useState("EGP");
  const [selectedSources, setSelectedSources] = useState<OrderSource[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (company) {
      setName(company.name);
      setCurrency(company.settings.currency || "EGP");
      setSelectedSources(company.settings.orderSources || []);
    }
  }, [company]);

  const toggleSource = (source: OrderSource) => {
    setSelectedSources((prev) =>
      prev.includes(source) ? prev.filter((s) => s !== source) : [...prev, source],
    );
  };

  const save = async () => {
    if (!user) return;
    setSaving(true);
    try {
      await updateDoc(doc(db, "companies", user.companyId), {
        name,
        "settings.currency": currency,
        "settings.orderSources": selectedSources,
      });
      toast.success("Settings saved");
    } catch {
      toast.error("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="space-y-4"><Skeleton className="h-8 w-48" /><Skeleton className="h-64 w-full" /></div>;
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Company Settings</h1>

      <Card title="General">
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Company Name</label>
            <input value={name} onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-200 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Currency</label>
            <select value={currency} onChange={(e) => setCurrency(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-200 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100">
              <option value="EGP">EGP (E£)</option>
              <option value="USD">USD ($)</option>
              <option value="EUR">EUR (€)</option>
              <option value="GBP">GBP (£)</option>
              <option value="SAR">SAR (﷼)</option>
              <option value="AED">AED (د.إ)</option>
            </select>
          </div>
        </div>
      </Card>

      <Card title="Order Sources" subtitle="Enable the order sources your team uses">
        <div className="space-y-2">
          {ALL_SOURCES.map((s) => (
            <label key={s.value} className="flex cursor-pointer items-center gap-3 rounded-lg border border-gray-200 p-3 transition hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800">
              <input
                type="checkbox"
                checked={selectedSources.includes(s.value)}
                onChange={() => toggleSource(s.value)}
                className="h-4 w-4 rounded border-gray-300 text-primary-700 focus:ring-primary-500"
              />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{s.label}</span>
            </label>
          ))}
        </div>
      </Card>

      <div className="flex justify-end">
        <Button onClick={save} loading={saving}>Save Settings</Button>
      </div>
    </div>
  );
}
