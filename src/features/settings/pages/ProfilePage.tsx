import { useState } from "react";
import { updatePassword, EmailAuthProvider, reauthenticateWithCredential } from "firebase/auth";
import { doc, updateDoc } from "firebase/firestore";
import { toast } from "sonner";
import { auth, db } from "../../../lib/firebase";
import { Card } from "../../../components/ui/Card";
import { Button } from "../../../components/ui/Button";
import { useAuth } from "../../auth/hooks/useAuth";

export function ProfilePage() {
  const { user } = useAuth();
  const [name, setName] = useState(user?.name ?? "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingName, setSavingName] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  const handleSaveName = async () => {
    if (!user || !name.trim()) return;
    setSavingName(true);
    try {
      await updateDoc(doc(db, "users", user.uid), { name });
      toast.success("Name updated");
    } catch {
      toast.error("Failed to update name");
    } finally {
      setSavingName(false);
    }
  };

  const handleChangePassword = async () => {
    if (!auth.currentUser) return;
    if (newPassword !== confirmPassword) {
      toast.error("Passwords don't match");
      return;
    }
    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    setChangingPassword(true);
    try {
      const cred = EmailAuthProvider.credential(auth.currentUser.email!, currentPassword);
      await reauthenticateWithCredential(auth.currentUser, cred);
      await updatePassword(auth.currentUser, newPassword);
      toast.success("Password changed");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to change password";
      toast.error(msg.includes("wrong-password") ? "Current password is incorrect" : msg);
    } finally {
      setChangingPassword(false);
    }
  };

  const inputClass = "w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-200 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100";
  const labelClass = "mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300";

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Profile</h1>

      <Card title="Personal Information">
        <div className="space-y-4">
          <div>
            <label className={labelClass}>Name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Employee ID</label>
            <input value={user?.employeeId ?? ""} className={`${inputClass} bg-gray-50 dark:bg-gray-700`} readOnly />
          </div>
          <div>
            <label className={labelClass}>Email</label>
            <input value={user?.email ?? ""} className={`${inputClass} bg-gray-50 dark:bg-gray-700`} readOnly />
          </div>
          <Button onClick={handleSaveName} loading={savingName}>Save Changes</Button>
        </div>
      </Card>

      <Card title="Change Password">
        <div className="space-y-4">
          <div>
            <label className={labelClass}>Current Password</label>
            <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>New Password</label>
            <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Confirm New Password</label>
            <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className={inputClass} />
          </div>
          <Button onClick={handleChangePassword} loading={changingPassword}>Change Password</Button>
        </div>
      </Card>
    </div>
  );
}
