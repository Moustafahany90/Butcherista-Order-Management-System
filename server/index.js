import { readFileSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import express from "express";
import cors from "cors";
import { initializeApp, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const SERVICE_ACCOUNT_PATH = resolve(ROOT, "serviceAccountKey.json");

if (!existsSync(SERVICE_ACCOUNT_PATH)) {
  console.error("❌ serviceAccountKey.json not found in project root");
  process.exit(1);
}

const serviceAccount = JSON.parse(readFileSync(SERVICE_ACCOUNT_PATH, "utf-8"));
initializeApp({ credential: cert(serviceAccount) });
const auth = getAuth();
const db = getFirestore();

const app = express();
app.use(cors());
app.use(express.json());

// ── Create employee ──
app.post("/api/employees", async (req, res) => {
  try {
    const { name, employeeId, password, companyId, adminUid } = req.body;
    if (!name || !employeeId || !password || !companyId || !adminUid) {
      return res.status(400).json({ error: "Missing fields" });
    }

    // Verify admin
    const adminDoc = await db.collection("users").doc(adminUid).get();
    if (!adminDoc.exists || adminDoc.data().role !== "admin") {
      return res.status(403).json({ error: "Not authorized" });
    }

    // Get company domain
    const companyDoc = await db.collection("companies").doc(companyId).get();
    if (!companyDoc.exists) return res.status(404).json({ error: "Company not found" });
    const domain = companyDoc.data().domain;
    const email = `${employeeId}@${domain}.system`;

    const userRecord = await auth.createUser({ email, password, displayName: name });
    await db.collection("users").doc(userRecord.uid).set({
      companyId,
      employeeId,
      name,
      role: "employee",
      active: true,
      createdAt: new Date(),
      createdBy: adminUid,
    });

    res.json({ uid: userRecord.uid, employeeId });
  } catch (err) {
    console.error("Create employee error:", err);
    if (err.code === "auth/email-already-exists") {
      return res.status(409).json({ error: "Employee ID already in use" });
    }
    res.status(500).json({ error: "Internal error" });
  }
});

// ── Toggle active status ──
app.patch("/api/employees/:uid/status", async (req, res) => {
  try {
    const { active } = req.body;
    await db.collection("users").doc(req.params.uid).update({ active: !!active });
    res.json({ success: true });
  } catch (err) {
    console.error("Toggle error:", err);
    res.status(500).json({ error: "Failed to update" });
  }
});

// ── Delete employee ──
app.delete("/api/employees/:uid", async (req, res) => {
  try {
    await auth.deleteUser(req.params.uid);
    await db.collection("users").doc(req.params.uid).delete();
    res.json({ success: true });
  } catch (err) {
    console.error("Delete error:", err);
    res.status(500).json({ error: "Failed to delete" });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`✅ Admin server running on http://localhost:${PORT}`);
  console.log(`   Endpoints:`);
  console.log(`   POST   /api/employees`);
  console.log(`   PATCH  /api/employees/:uid/status`);
  console.log(`   DELETE /api/employees/:uid`);
});
