import { initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { https, logger } from "firebase-functions";
import { defineString } from "firebase-functions/params";

initializeApp();
const auth = getAuth();
const db = getFirestore();

const SUPER_ADMIN_UID = defineString("SUPER_ADMIN_UID");
const BOOTSTRAP_KEY = defineString("BOOTSTRAP_KEY");
const TELEGRAM_BOT_TOKEN = defineString("TELEGRAM_BOT_TOKEN");
const TELEGRAM_CHAT_ID = defineString("TELEGRAM_CHAT_ID");

/**
 * Verify that the caller is a company admin or super admin.
 */
async function requireAdmin(context) {
  if (!context.auth) throw new https.HttpsError("unauthenticated", "Not authenticated");
  const { uid } = context.auth;

  // Super admin check
  const userRecord = await auth.getUser(uid);
  if (userRecord.customClaims?.super_admin) return { role: "super_admin" };

  // Company admin check
  const userDoc = await db.collection("users").doc(uid).get();
  if (!userDoc.exists) throw new https.HttpsError("permission-denied", "User not found");
  const user = userDoc.data();
  if (!user.active) throw new https.HttpsError("permission-denied", "Account deactivated");
  if (user.role !== "admin") throw new https.HttpsError("permission-denied", "Admin role required");
  return { role: "admin", companyId: user.companyId };
}

/**
 * Bootstrap a new company with its admin account.
 * One-time setup — protected by a BOOTSTRAP_KEY config param.
 */
export const bootstrapCompany = https.onCall(async (data, context) => {
  const { setupKey, companyName, domain, adminName, adminEmployeeId, adminPassword } = data;
  if (setupKey !== BOOTSTRAP_KEY.value()) {
    throw new https.HttpsError("permission-denied", "Invalid setup key");
  }
  if (!companyName || !domain || !adminName || !adminEmployeeId || !adminPassword) {
    throw new https.HttpsError("invalid-argument", "Missing required fields");
  }
  if (adminPassword.length < 6) {
    throw new https.HttpsError("invalid-argument", "Password must be at least 6 characters");
  }

  const companyRef = db.collection("companies").doc();
  const adminEmail = `${adminEmployeeId}@${domain}.system`;

  const adminRecord = await auth.createUser({
    email: adminEmail,
    password: adminPassword,
    displayName: adminName,
  });

  await auth.setCustomUserClaims(adminRecord.uid, { super_admin: false });

  await companyRef.set({
    name: companyName,
    domain,
    plan: "basic",
    subscriptionStatus: "active",
    subscriptionExpiry: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    createdAt: new Date(),
    settings: {
      zones: [
        { id: "zone-1", name: "Main District", fee: 15 },
        { id: "zone-2", name: "Suburbs", fee: 25 },
      ],
      currency: "EGP",
      orderSources: ["phone", "whatsapp", "instagram", "website", "email"],
    },
  });

  await db.collection("users").doc(adminRecord.uid).set({
    companyId: companyRef.id,
    employeeId: adminEmployeeId,
    name: adminName,
    role: "admin",
    active: true,
    createdAt: new Date(),
    createdBy: adminRecord.uid,
  });

  logger.info(`Bootstrapped company ${companyName} (${companyRef.id}) with admin ${adminEmployeeId}`);
  return { companyId: companyRef.id, adminUid: adminRecord.uid };
});

/**
 * Create an employee account.
 * Called by the company admin from the frontend.
 */
export const createEmployee = https.onCall(async (data, context) => {
  const { name, employeeId, password, companyId } = data;
  if (!name || !employeeId || !password || !companyId) {
    throw new https.HttpsError("invalid-argument", "Missing required fields: name, employeeId, password, companyId");
  }
  if (password.length < 6) {
    throw new https.HttpsError("invalid-argument", "Password must be at least 6 characters");
  }

  const admin = await requireAdmin(context);
  if (admin.role === "admin" && admin.companyId !== companyId) {
    throw new https.HttpsError("permission-denied", "Cannot create users outside your company");
  }

  // Get company domain for synthetic email
  const companyDoc = await db.collection("companies").doc(companyId).get();
  if (!companyDoc.exists) throw new https.HttpsError("not-found", "Company not found");
  const domain = companyDoc.data().domain;

  const email = `${employeeId}@${domain}.system`;

  try {
    const userRecord = await auth.createUser({
      email,
      password,
      displayName: name,
      disabled: false,
    });

    await db.collection("users").doc(userRecord.uid).set({
      companyId,
      employeeId,
      name,
      role: "employee",
      active: true,
      createdAt: new Date(),
      createdBy: context.auth.uid,
    });

    logger.info(`Created employee ${employeeId} for company ${companyId}`);
    return { uid: userRecord.uid, employeeId };
  } catch (err) {
    logger.error("Failed to create employee", err);
    if (err.code === "auth/email-already-exists") {
      throw new https.HttpsError("already-exists", "Employee ID already in use");
    }
    throw new https.HttpsError("internal", "Failed to create employee account");
  }
});

/**
 * Toggle employee active status.
 */
export const toggleEmployeeStatus = https.onCall(async (data, context) => {
  const { targetUserId, active } = data;
  if (!targetUserId || typeof active !== "boolean") {
    throw new https.HttpsError("invalid-argument", "Missing targetUserId or active status");
  }

  const admin = await requireAdmin(context);

  // Get target user
  const targetDoc = await db.collection("users").doc(targetUserId).get();
  if (!targetDoc.exists) throw new https.HttpsError("not-found", "User not found");
  const targetUser = targetDoc.data();

  if (admin.role === "admin" && admin.companyId !== targetUser.companyId) {
    throw new https.HttpsError("permission-denied", "Cannot manage users outside your company");
  }

  await auth.updateUser(targetUserId, { disabled: !active });
  await db.collection("users").doc(targetUserId).update({ active });
  return { success: true };
});

/**
 * Delete an employee account (hard delete from Auth + Firestore).
 */
export const deleteEmployee = https.onCall(async (data, context) => {
  const { targetUserId } = data;
  if (!targetUserId) throw new https.HttpsError("invalid-argument", "Missing targetUserId");

  await requireAdmin(context);

  await auth.deleteUser(targetUserId);
  await db.collection("users").doc(targetUserId).delete();
  return { success: true };
});

/**
 * Send a Telegram delivery alert.
 * Called by the frontend when an order is assigned to a delivery employee.
 * The bot token and chat ID live server-side (Firebase params), not in the client bundle.
 */
export const sendTelegramAlert = https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new https.HttpsError("unauthenticated", "Must be logged in");
  }

  const { orderNumber, customerName, phone, address, zone, price, deliveryFee, paymentMethod, paymentStatus, assignedDelivery, assignedDeliveryName, notes } = data;
  if (!assignedDelivery) {
    return { sent: false, reason: "no_delivery_assigned" };
  }

  const total = (Number(price) + Number(deliveryFee)).toFixed(2);

  const text = [
    "NEW DELIVERY ORDER",
    `Order: #${orderNumber}`,
    `Customer: ${customerName}`,
    `Phone: ${phone}`,
    `Address: ${address}`,
    `Zone: ${zone}`,
    `Total: EGP ${total}`,
    `Payment: ${paymentMethod} (${paymentStatus})`,
    `Delivery: ${assignedDeliveryName} — ${assignedDelivery}`,
    `Notes: ${notes || "\u2014"}`,
  ].join("\n");

  try {
    const res = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN.value()}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: Number(TELEGRAM_CHAT_ID.value()), text }),
    });
    if (!res.ok) {
      const errBody = await res.text();
      logger.error("Telegram API error", errBody);
      return { sent: false, reason: "telegram_api_error" };
    }
    return { sent: true };
  } catch (err) {
    logger.error("Telegram send failed", err);
    return { sent: false, reason: "request_failed" };
  }
});
