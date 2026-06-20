import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod/v4";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { useAuth } from "../hooks/useAuth";
import { useNavigate } from "react-router-dom";

const loginSchema = z.object({
  companyDomain: z.string().min(1, "Company domain is required"),
  employeeId: z.string().min(1, "Employee ID is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type LoginForm = z.infer<typeof loginSchema>;

export function LoginPage() {
  const { login, user } = useAuth();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  if (user) {
    const target = user.role === "admin" ? "/admin" : "/dashboard";
    navigate(target, { replace: true });
    return null;
  }

  const onSubmit = async (data: LoginForm) => {
    setSubmitting(true);
    try {
      await login(data.employeeId, data.password, data.companyDomain);
      toast.success("Logged in successfully");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Login failed";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 px-4 dark:bg-gray-950">
      <div className="w-full max-w-md rounded-xl bg-white p-8 shadow-lg dark:bg-gray-900 dark:border dark:border-gray-800">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-primary-700 dark:text-primary-400">Butcherista</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Order Management System</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Company Domain
            </label>
            <input
              {...register("companyDomain")}
              placeholder="e.g. mybutcher"
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-200 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:focus:ring-primary-800"
            />
            {errors.companyDomain && (
              <p className="mt-1 text-xs text-danger">{errors.companyDomain.message}</p>
            )}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Employee ID
            </label>
            <input
              {...register("employeeId")}
              placeholder="e.g. EMP-001"
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-200 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:focus:ring-primary-800"
            />
            {errors.employeeId && (
              <p className="mt-1 text-xs text-danger">{errors.employeeId.message}</p>
            )}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Password
            </label>
            <input
              type="password"
              {...register("password")}
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-200 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:focus:ring-primary-800"
            />
            {errors.password && (
              <p className="mt-1 text-xs text-danger">{errors.password.message}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-lg bg-primary-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-800 disabled:opacity-50 dark:bg-primary-600 dark:hover:bg-primary-700"
          >
            {submitting ? "Signing in..." : "Sign In"}
          </button>
        </form>
      </div>
    </div>
  );
}
