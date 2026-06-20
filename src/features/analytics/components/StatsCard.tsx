import type { ReactNode } from "react";

interface StatsCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon?: ReactNode;
}

export function StatsCard({ title, value, subtitle, icon }: StatsCardProps) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
          <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-gray-100">{value}</p>
          {subtitle && <p className="mt-0.5 text-xs text-gray-400 dark:text-gray-500">{subtitle}</p>}
        </div>
        {icon && <div className="text-2xl">{icon}</div>}
      </div>
    </div>
  );
}
