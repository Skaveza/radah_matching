import { ReactNode } from "react";

interface StatCardProps {
  icon: ReactNode;
  label: string;
  value: number | string;
  sub?: string;
  color?: "blue" | "green" | "red" | "purple";
  href?: string;
}

export default function StatCard({
  icon,
  label,
  value,
  sub,
  color = "blue",
  href,
}: StatCardProps) {
  const colorMap = {
    blue: "border-blue-200",
    green: "border-green-200",
    red: "border-red-200",
    purple: "border-purple-200",
  };

  return (
    <div
      className={`bg-white rounded-2xl p-4 border ${colorMap[color]} shadow-sm transition-all duration-300 hover:scale-[1.02] hover:shadow-md`}
    >
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">{label}</div>
        <div>{icon}</div>
      </div>

      <div className="text-2xl font-bold mt-2">{value}</div>

      {sub && <div className="text-xs text-muted-foreground mt-1">{sub}</div>}

      {href && (
        <a href={href} className="text-xs text-blue-500 mt-2 inline-block">
          View →
        </a>
      )}
    </div>
  );
}