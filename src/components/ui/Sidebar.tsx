import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../features/auth/hooks/useAuth";
import { useThemeStore } from "../../stores/themeStore";
import { NotificationBell } from "../../features/notifications/components/NotificationBell";

const adminLinks = [
  { to: "/admin", label: "Dashboard", icon: "📊" },
  { to: "/orders", label: "Orders", icon: "📦" },
  { to: "/admin/employees", label: "Employees", icon: "👥" },
  { to: "/admin/zones", label: "Zones", icon: "📍" },
  { to: "/admin/analytics", label: "Analytics", icon: "📈" },
  { to: "/admin/delivery-employees", label: "Delivery", icon: "🚚" },
  { to: "/admin/settings", label: "Settings", icon: "⚙️" },
];

const employeeLinks = [
  { to: "/dashboard", label: "Dashboard", icon: "📊" },
  { to: "/orders/new", label: "New Order", icon: "➕" },
  { to: "/orders", label: "My Orders", icon: "📦" },
];

export function Sidebar() {
  const { user, logout } = useAuth();
  const { dark, toggleDark } = useThemeStore();
  const navigate = useNavigate();
  const links = user?.role === "admin" ? adminLinks : employeeLinks;

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <aside className="flex w-64 flex-col border-r border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
      <div className="flex h-16 items-center justify-between border-b border-gray-200 px-4 dark:border-gray-800">
        <span className="text-xl font-bold text-primary-700 dark:text-primary-400">Butcherista</span>
        <NotificationBell />
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition ${
                isActive
                  ? "bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400"
                  : "text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
              }`
            }
          >
            <span>{link.icon}</span>
            {link.label}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-gray-200 p-4 dark:border-gray-800">
        <NavLink
          to="/settings/profile"
          className={({ isActive }) =>
            `mb-2 flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition ${
              isActive
                ? "bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400"
                : "text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
            }`
          }
        >
          <span>👤</span>
          Profile
        </NavLink>
        <button
          onClick={toggleDark}
          className="mb-2 flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-gray-600 transition hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
        >
          <span>{dark ? "☀️" : "🌙"}</span>
          {dark ? "Light Mode" : "Dark Mode"}
        </button>
        <div className="mb-2 text-sm text-gray-500 dark:text-gray-400">
          <p className="font-medium text-gray-700 dark:text-gray-300">{user?.name}</p>
          <p className="text-xs capitalize">{user?.role}</p>
        </div>
        <button
          onClick={handleLogout}
          className="w-full rounded-lg px-3 py-2 text-left text-sm text-gray-600 transition hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
        >
          Sign Out
        </button>
      </div>
    </aside>
  );
}
