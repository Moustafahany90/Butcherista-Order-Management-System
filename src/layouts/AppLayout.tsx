import { Outlet } from "react-router-dom";
import { Sidebar } from "../components/ui/Sidebar";

export function AppLayout() {
  return (
    <div className="flex min-h-screen" dir="ltr">
      <Sidebar />
      <main className="flex-1 overflow-auto bg-gray-50 p-6 dark:bg-gray-950">
        <Outlet />
      </main>
    </div>
  );
}
