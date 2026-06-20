import { useState } from "react";
import { doc, deleteDoc, updateDoc, setDoc } from "firebase/firestore";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { z } from "zod/v4";
import { zodResolver } from "@hookform/resolvers/zod";
import { db } from "../../../lib/firebase";
import { Card } from "../../../components/ui/Card";
import { Button } from "../../../components/ui/Button";
import { Badge } from "../../../components/ui/Badge";
import { Skeleton } from "../../../components/ui/Skeleton";
import { EmptyState } from "../../../components/ui/EmptyState";
import { useEmployees } from "../../../hooks/useEmployees";
import { useAuth } from "../../auth/hooks/useAuth";
import { formatDate } from "../../../lib/utils";

const employeeSchema = z.object({
  name: z.string().min(1, "Name is required"),
  employeeId: z.string().min(1, "Employee ID is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type EmployeeForm = z.infer<typeof employeeSchema>;

async function createAuthUser(email: string, password: string): Promise<string> {
  const apiKey = import.meta.env.VITE_FIREBASE_API_KEY;
  const res = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, returnSecureToken: true }),
    },
  );
  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message || "Failed to create user");
  return data.localId;
}

const inputClass = "w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-200 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:focus:ring-primary-800";

export function EmployeeListPage() {
  const { user } = useAuth();
  const { employees, loading } = useEmployees();
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<EmployeeForm>({ resolver: zodResolver(employeeSchema) });

  const createEmployee = async (data: EmployeeForm) => {
    if (!user) return;
    setSubmitting(true);
    try {
      const domain = user.email.split("@")[1];
      const email = `${data.employeeId}@${domain}`;
      const uid = await createAuthUser(email, data.password);
      await setDoc(doc(db, "users", uid), {
        companyId: user.companyId,
        employeeId: data.employeeId,
        name: data.name,
        role: "employee",
        active: true,
        createdAt: new Date(),
        createdBy: user.uid,
      });
      toast.success(`Employee ${data.employeeId} created`);
      reset();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to create employee";
      toast.error(msg.includes("EMAIL_EXISTS") ? "Employee ID already in use" : msg);
    } finally {
      setSubmitting(false);
    }
  };

  const toggleStatus = async (targetUserId: string, active: boolean) => {
    try {
      await updateDoc(doc(db, "users", targetUserId), { active });
      toast.success(active ? "Employee activated" : "Employee deactivated");
    } catch {
      toast.error("Failed to update status");
    }
  };

  const deleteEmployee = async (targetUserId: string) => {
    if (!confirm("Delete this employee permanently?")) return;
    try {
      await deleteDoc(doc(db, "users", targetUserId));
      toast.success("Employee deleted");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to delete";
      toast.error(msg);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Employee Management</h1>

      <Card title="Create Employee" subtitle="Enter employee details to create an account">
        <form onSubmit={handleSubmit(createEmployee)} className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <input {...register("name")} placeholder="Full name" className={inputClass} />
            {errors.name && <p className="mt-1 text-xs text-danger">{errors.name.message}</p>}
          </div>
          <div>
            <input {...register("employeeId")} placeholder="e.g. EMP-002" className={inputClass} />
            {errors.employeeId && <p className="mt-1 text-xs text-danger">{errors.employeeId.message}</p>}
          </div>
          <div className="flex gap-2">
            <input type="password" {...register("password")} placeholder="Password" className={inputClass} />
            <Button type="submit" loading={submitting}>Create</Button>
          </div>
        </form>
        {errors.password && <p className="mt-1 text-xs text-danger">{errors.password.message}</p>}
      </Card>

      <Card title="Employees">
        {loading ? (
          <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
        ) : employees.length === 0 ? (
          <EmptyState title="No employees yet" description="Create your first employee above." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-xs uppercase text-gray-500 dark:border-gray-700 dark:text-gray-400">
                  <th className="px-4 py-3 font-medium">Employee ID</th>
                  <th className="px-4 py-3 font-medium">Name</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Created</th>
                  <th className="px-4 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {employees.map((emp) => (
                  <tr key={emp.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <td className="px-4 py-3 font-mono text-sm text-gray-700 dark:text-gray-400">{emp.employeeId}</td>
                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-gray-100">{emp.name}</td>
                    <td className="px-4 py-3">
                      <Badge variant={emp.active ? "success" : "danger"}>{emp.active ? "Active" : "Inactive"}</Badge>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500 dark:text-gray-400">{formatDate(emp.createdAt)}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button
                          onClick={() => toggleStatus(emp.id, !emp.active)}
                          className={`text-sm ${emp.active ? "text-warning hover:text-amber-800" : "text-success hover:text-green-800"}`}
                        >
                          {emp.active ? "Deactivate" : "Activate"}
                        </button>
                        <button onClick={() => deleteEmployee(emp.id)} className="text-sm text-danger hover:text-red-800">Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
