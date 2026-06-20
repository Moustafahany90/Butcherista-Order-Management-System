import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./features/auth/hooks/useAuth";
import { LoginPage } from "./features/auth/pages/LoginPage";
import { ProtectedRoute, AdminRoute, EmployeeRoute } from "./features/auth/components/ProtectedRoute";
import { AppLayout } from "./layouts/AppLayout";
import { AdminDashboard } from "./features/dashboard/pages/AdminDashboard";
import { EmployeeDashboard } from "./features/dashboard/pages/EmployeeDashboard";
import { NewOrderPage } from "./features/orders/pages/NewOrderPage";
import { OrderListPage } from "./features/orders/pages/OrderListPage";
import { EditOrderPage } from "./features/orders/pages/EditOrderPage";
import { EmployeeListPage } from "./features/employees/pages/EmployeeListPage";
import { ZoneListPage } from "./features/zones/pages/ZoneListPage";
import { AnalyticsPage } from "./features/analytics/pages/AnalyticsPage";
import { NotificationListPage } from "./features/notifications/pages/NotificationListPage";
import { CompanySettingsPage } from "./features/settings/pages/CompanySettingsPage";
import { ProfilePage } from "./features/settings/pages/ProfilePage";
import { OnboardingPage } from "./features/saas/pages/OnboardingPage";
import { SuperAdminPage } from "./features/saas/pages/SuperAdminPage";
import { DeliveryEmployeeListPage } from "./features/delivery/pages/DeliveryEmployeeListPage";
import { DeliveryViewPage } from "./features/delivery/pages/DeliveryViewPage";

export default function App() {
  const { loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary-200 border-t-primary-700" />
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/onboarding" element={<OnboardingPage />} />
      <Route path="/delivery" element={<DeliveryViewPage />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          {/* Order routes — accessible by both admin and employee */}
          <Route path="/orders" element={<OrderListPage />} />
          <Route path="/orders/new" element={<NewOrderPage />} />
          <Route path="/orders/:orderId/edit" element={<EditOrderPage />} />

          {/* Notifications — accessible by both */}
          <Route path="/notifications" element={<NotificationListPage />} />

          {/* Settings — accessible by both */}
          <Route path="/settings/profile" element={<ProfilePage />} />

          {/* Employee routes */}
          <Route element={<EmployeeRoute />}>
            <Route path="/dashboard" element={<EmployeeDashboard />} />
          </Route>

          {/* Admin routes */}
          <Route element={<AdminRoute />}>
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/employees" element={<EmployeeListPage />} />
            <Route path="/admin/zones" element={<ZoneListPage />} />
            <Route path="/admin/analytics" element={<AnalyticsPage />} />
            <Route path="/admin/delivery-employees" element={<DeliveryEmployeeListPage />} />
            <Route path="/admin/settings" element={<CompanySettingsPage />} />
          </Route>
        </Route>
      </Route>

      {/* Super admin — standalone layout */}
      <Route path="/superadmin" element={<SuperAdminPage />} />

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
