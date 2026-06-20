/**
 * Fix: Re-creates the admin's Firestore profile if it was accidentally deleted.
 * Run: node scripts/fix-admin.js
 */
import { initializeApp, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { readFileSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const SERVICE_ACCOUNT_PATH = resolve(ROOT, "serviceAccountKey.json");

if (!existsSync(SERVICE_ACCOUNT_PATH)) {
  console.error("❌ serviceAccountKey.json not found");
  process.exit(1);
}

const sa = JSON.parse(readFileSync(SERVICE_ACCOUNT_PATH, "utf-8"));
initializeApp({ credential: cert(sa) });
const auth = getAuth();
const db = getFirestore();

async function main() {
  // Find admin by synthetic email
  let adminRecord;
  try {
    adminRecord = await auth.getUserByEmail("ADMIN-001@butcherista-co.system");
  } catch {
    console.error("❌ Admin user not found in Auth. Re-run the seed script.");
    process.exit(1);
  }

  // Check if Firestore doc exists
  const doc = await db.collection("users").doc(adminRecord.uid).get();
  if (doc.exists) {
    console.log("✅ Admin Firestore profile already exists");
    return;
  }

  // Find the company
  const companies = await db.collection("companies").limit(1).get();
  if (companies.empty) {
    console.error("❌ No company found. Re-run seed script.");
    process.exit(1);
  }
  const company = companies.docs[0];

  // Re-create admin profile
  await db.collection("users").doc(adminRecord.uid).set({
    companyId: company.id,
    employeeId: "ADMIN-001",
    name: "Admin",
    role: "admin",
    active: true,
    createdAt: new Date(),
    createdBy: adminRecord.uid,
  });

  console.log("✅ Admin Firestore profile re-created!");
  console.log(`   Company ID: ${company.id}`);
  console.log(`   Admin UID:  ${adminRecord.uid}`);
}

main().catch(console.error);
