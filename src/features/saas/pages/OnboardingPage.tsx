import { useState } from "react";
import { doc, updateDoc } from "firebase/firestore";
import { toast } from "sonner";
import { db } from "../../../lib/firebase";
import { Button } from "../../../components/ui/Button";
import { useAuth } from "../../auth/hooks/useAuth";
import { useCompany } from "../../../hooks/useCompany";
import type { OrderSource } from "../../../types";

const STEPS = ["Company Info", "Delivery Zones", "Order Sources"];

const ALL_SOURCES: { value: OrderSource; label: string }[] = [
  { value: "phone", label: "Phone" },
  { value: "whatsapp", label: "WhatsApp" },
  { value: "instagram", label: "Instagram" },
  { value: "website", label: "Website" },
  { value: "email", label: "Email" },
];

export function OnboardingPage() {
  const { user } = useAuth();
  const { company } = useCompany();
  const [step, setStep] = useState(0);
  const [companyName, setCompanyName] = useState(company?.name ?? "");
  const [zoneName, setZoneName] = useState("");
  const [zoneFee, setZoneFee] = useState(0);
  const [zones, setZones] = useState<{ name: string; fee: number }[]>([]);
  const [selectedSources, setSelectedSources] = useState<OrderSource[]>(["phone", "whatsapp"]);
  const [saving, setSaving] = useState(false);

  const addZone = () => {
    if (!zoneName.trim()) return;
    setZones([...zones, { name: zoneName.trim(), fee: zoneFee }]);
    setZoneName("");
    setZoneFee(0);
  };

  const removeZone = (idx: number) => {
    setZones(zones.filter((_, i) => i !== idx));
  };

  const toggleSource = (src: OrderSource) => {
    setSelectedSources((prev) => prev.includes(src) ? prev.filter((s) => s !== src) : [...prev, src]);
  };

  const finish = async () => {
    if (!user) return;
    setSaving(true);
    try {
      await updateDoc(doc(db, "companies", user.companyId), {
        name: companyName,
        "settings.zones": zones.map((z, i) => ({ id: `zone-${i}`, ...z })),
        "settings.orderSources": selectedSources,
        onboardingComplete: true,
      });
      toast.success("Setup complete!");
      window.location.href = "/admin";
    } catch {
      toast.error("Failed to save setup");
    } finally {
      setSaving(false);
    }
  };

  const canProceed = () => {
    if (step === 0) return companyName.trim().length > 0;
    if (step === 1) return zones.length > 0;
    return selectedSources.length > 0;
  };

  const inputClass = "w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-200 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100";

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 px-4 dark:bg-gray-950">
      <div className="w-full max-w-lg rounded-xl bg-white p-8 shadow-lg dark:bg-gray-900 dark:border dark:border-gray-800">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-primary-700 dark:text-primary-400">Welcome to Butcherista!</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Let's set up your company</p>
        </div>

        <div className="mb-6 flex items-center justify-center gap-2">
          {STEPS.map((label, i) => (
            <div key={label} className="flex items-center gap-2">
              <span className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${
                i <= step ? "bg-primary-700 text-white dark:bg-primary-600" : "bg-gray-200 text-gray-500 dark:bg-gray-800 dark:text-gray-400"
              }`}>{i + 1}</span>
              <span className={`text-xs ${i <= step ? "font-medium text-primary-700 dark:text-primary-400" : "text-gray-400"}`}>{label}</span>
              {i < STEPS.length - 1 && <div className="mx-1 h-px w-6 bg-gray-300 dark:bg-gray-700" />}
            </div>
          ))}
        </div>

        {step === 0 && (
          <div className="space-y-4">
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Company Name</label>
            <input value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder="e.g. Butcherista Co." className={inputClass} />
          </div>
        )}

        {step === 1 && (
          <div className="space-y-4">
            <p className="text-sm text-gray-500 dark:text-gray-400">Add the delivery zones your company serves.</p>
            <div className="flex gap-2">
              <input value={zoneName} onChange={(e) => setZoneName(e.target.value)} placeholder="Zone name" className={inputClass} />
              <input type="number" value={zoneFee} onChange={(e) => setZoneFee(Number(e.target.value))} placeholder="Fee" className={`${inputClass} w-24`} />
              <Button onClick={addZone} variant="secondary" size="sm">Add</Button>
            </div>
            {zones.length > 0 && (
              <div className="space-y-2">
                {zones.map((z, i) => (
                  <div key={i} className="flex items-center justify-between rounded-lg border border-gray-200 p-3 dark:border-gray-700">
                    <span className="text-sm text-gray-700 dark:text-gray-300">{z.name} — EGP {z.fee}</span>
                    <button onClick={() => removeZone(i)} className="text-xs text-danger">Remove</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {step === 2 && (
          <div className="space-y-2">
            <p className="text-sm text-gray-500 dark:text-gray-400">Select where orders come from.</p>
            {ALL_SOURCES.map((s) => (
              <label key={s.value} className="flex cursor-pointer items-center gap-3 rounded-lg border border-gray-200 p-3 transition hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800">
                <input type="checkbox" checked={selectedSources.includes(s.value)} onChange={() => toggleSource(s.value)} className="h-4 w-4 rounded border-gray-300 text-primary-700 focus:ring-primary-500" />
                <span className="text-sm text-gray-700 dark:text-gray-300">{s.label}</span>
              </label>
            ))}
          </div>
        )}

        <div className="mt-8 flex justify-between">
          {step > 0 ? (
            <Button variant="secondary" onClick={() => setStep(step - 1)}>Back</Button>
          ) : <div />}
          {step < STEPS.length - 1 ? (
            <Button disabled={!canProceed()} onClick={() => setStep(step + 1)}>Next</Button>
          ) : (
            <Button disabled={!canProceed()} onClick={finish} loading={saving}>Complete Setup</Button>
          )}
        </div>
      </div>
    </div>
  );
}
