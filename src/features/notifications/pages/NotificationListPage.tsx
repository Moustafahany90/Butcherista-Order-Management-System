import { useNotifications } from "../../../hooks/useNotifications";
import { Card } from "../../../components/ui/Card";
import { Button } from "../../../components/ui/Button";
import { Skeleton } from "../../../components/ui/Skeleton";
import { EmptyState } from "../../../components/ui/EmptyState";
import { formatDateTime } from "../../../lib/utils";
import { useNavigate } from "react-router-dom";

const TYPE_ICONS: Record<string, string> = {
  order_created: "📦",
  order_updated: "✏️",
  prebook_reminder: "📅",
  payment_reminder: "💳",
  employee_joined: "👋",
};

export function NotificationListPage() {
  const { notifications, loading, unreadCount, markRead, markAllRead } = useNotifications();
  const navigate = useNavigate();

  const handleClick = async (n: typeof notifications[0]) => {
    if (!n.read) await markRead(n.id);
    if (n.link) navigate(n.link);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Notifications</h1>
        {unreadCount > 0 && (
          <Button variant="ghost" onClick={markAllRead}>Mark all as read</Button>
        )}
      </div>

      <Card>
        {loading ? (
          <div className="space-y-4">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}</div>
        ) : notifications.length === 0 ? (
          <EmptyState title="No notifications" description="You're all caught up!" icon={<span className="text-4xl">🔔</span>} />
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {notifications.map((n) => (
              <button
                key={n.id}
                onClick={() => handleClick(n)}
                className={`flex w-full items-start gap-4 px-4 py-4 text-left transition hover:bg-gray-50 dark:hover:bg-gray-800/50 ${!n.read ? "bg-primary-50/50 dark:bg-primary-900/10" : ""}`}
              >
                <span className="mt-0.5 text-xl">{TYPE_ICONS[n.type] ?? "🔔"}</span>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm ${!n.read ? "font-semibold text-gray-900 dark:text-gray-100" : "text-gray-700 dark:text-gray-300"}`}>
                    {n.title}
                  </p>
                  <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400 line-clamp-2">{n.message}</p>
                  <p className="mt-1 text-[10px] text-gray-400 dark:text-gray-500">{formatDateTime(n.createdAt)}</p>
                </div>
                {!n.read && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary-600" />}
              </button>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
