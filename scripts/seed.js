/**
 * Seed script — creates the first company + admin user.
 *
 * Prerequisites:
 *   1. Go to Firebase Console → Project Settings → Service accounts
 *   2. Click "Generate new private key" → saves as serviceAccountKey.json
 *   3. Place that file in the project root (or update SERVICE_ACCOUNT_PATH below)
 *
 * Usage:
 *   node scripts/seed.js
 *
 * You can override defaults with environment variables:
 *   COMPANY_NAME=MyCo node scripts/seed.js
 *   ADMIN_PASSWORD=securepass123 node scripts/seed.js
 */

import { initializeApp, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { readFileSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");

// ── Config ──
const SERVICE_ACCOUNT_PATH = resolve(ROOT, "serviceAccountKey.json");
const COMPANY_NAME = process.env.COMPANY_NAME || "Butcherista Co.";
const DOMAIN = process.env.DOMAIN || "butcherista-co";
const ADMIN_NAME = process.env.ADMIN_NAME || "Admin";
const ADMIN_EMPLOYEE_ID = process.env.ADMIN_EMPLOYEE_ID || "ADMIN-001";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "123456";

// ── Main ──
async function main() {
  if (!existsSync(SERVICE_ACCOUNT_PATH)) {
    console.error(`
  ❌ Service account key not found at: ${SERVICE_ACCOUNT_PATH}

  Steps:
    1. Go to https://console.firebase.google.com/project/butcherista-83eba/settings/serviceaccounts/adminsdk
    2. Click "Generate new private key"
    3. Save the file as "serviceAccountKey.json" in the project root (${ROOT})
    4. Run this script again
    `);
    process.exit(1);
  }

  const serviceAccount = JSON.parse(readFileSync(SERVICE_ACCOUNT_PATH, "utf-8"));

  initializeApp({ credential: cert(serviceAccount) });

  const auth = getAuth();
  const db = getFirestore();

  const adminEmail = `${ADMIN_EMPLOYEE_ID}@${DOMAIN}.system`;

  // Check if admin already exists
  try {
    const existing = await auth.getUserByEmail(adminEmail);
    console.error(`❌ Admin "${ADMIN_EMPLOYEE_ID}" already exists (uid: ${existing.uid})`);
    console.log("\nUse a different EMPLOYEE_ID, or delete the existing user first.");
    process.exit(1);
  } catch (err) {
    if (err.code !== "auth/user-not-found") {
      throw err;
    }
  }

  // Create the admin Auth user
  const adminRecord = await auth.createUser({
    email: adminEmail,
    password: ADMIN_PASSWORD,
    displayName: ADMIN_NAME,
  });
  console.log(`✅ Auth user created: ${adminRecord.uid}`);

  // Create the company
  const companyRef = db.collection("companies").doc();
  await companyRef.set({
    name: COMPANY_NAME,
    domain: DOMAIN,
    plan: "basic",
    orderCounter: 0,
    createdAt: new Date(),
    settings: {
      zones: [
        { id: "zone-1", name: "Main District", fee: 15 },
        { id: "zone-2", name: "Suburbs", fee: 25 },
      ],
      currency: "EGP",
      orderSources: ["phone", "whatsapp", "instagram", "website", "email"],
      deliveryEmployees: [],
    },
  });
  console.log(`✅ Company created: ${companyRef.id}`);

  // Create the admin Firestore profile
  await db.collection("users").doc(adminRecord.uid).set({
    companyId: companyRef.id,
    employeeId: ADMIN_EMPLOYEE_ID,
    name: ADMIN_NAME,
    role: "admin",
    active: true,
    createdAt: new Date(),
    createdBy: adminRecord.uid,
  });
  console.log(`✅ Admin profile created`);

  // ── Done ──
  console.log(`\n🎉 All set! Login credentials:`);
  console.log(`   Company Domain: ${DOMAIN}`);
  console.log(`   Employee ID:    ${ADMIN_EMPLOYEE_ID}`);
  console.log(`   Password:       ${ADMIN_PASSWORD}`);
  console.log(`\n   Company ID:     ${companyRef.id}`);
  console.log(`   Admin UID:      ${adminRecord.uid}`);
}

main().catch((err) => {
  console.error("❌ Seed failed:", err);
  process.exit(1);
});
