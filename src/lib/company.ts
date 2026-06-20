import { doc, getDoc } from "firebase/firestore";
import { db } from "./firebase";
import type { Company } from "../types";

const companyCache = new Map<string, Company>();

export async function getCompany(companyId: string): Promise<Company | null> {
  if (companyCache.has(companyId)) return companyCache.get(companyId)!;
  const snap = await getDoc(doc(db, "companies", companyId));
  if (!snap.exists()) return null;
  const company = { id: snap.id, ...snap.data() } as Company;
  companyCache.set(companyId, company);
  return company;
}

export function invalidateCompanyCache(companyId: string) {
  companyCache.delete(companyId);
}
