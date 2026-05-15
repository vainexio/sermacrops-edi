import { cn } from "@/lib/utils";

const statusStyles: Record<string, string> = {
  Draft: "bg-gray-100 text-gray-700 border border-gray-200",
  Validated: "bg-blue-50 text-blue-700 border border-blue-200",
  Sent: "bg-indigo-50 text-indigo-700 border border-indigo-200",
  Received: "bg-cyan-50 text-cyan-700 border border-cyan-200",
  Acknowledged: "bg-green-50 text-green-700 border border-green-200",
  Failed: "bg-red-50 text-red-700 border border-red-200",
  active: "bg-green-50 text-green-700 border border-green-200",
  inactive: "bg-gray-100 text-gray-600 border border-gray-200",
  pending: "bg-amber-50 text-amber-700 border border-amber-200",
  passed: "bg-green-50 text-green-700 border border-green-200",
  failed: "bg-red-50 text-red-700 border border-red-200",
  success: "bg-green-50 text-green-700 border border-green-200",
  error: "bg-red-50 text-red-700 border border-red-200",
  warning: "bg-amber-50 text-amber-700 border border-amber-200",
  info: "bg-blue-50 text-blue-700 border border-blue-200",
};

export function StatusBadge({ status, className }: { status: string; className?: string }) {
  return (
    <span
      data-testid={`badge-status-${status}`}
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold uppercase tracking-wide whitespace-nowrap",
        statusStyles[status] ?? "bg-gray-100 text-gray-700 border border-gray-200",
        className
      )}
    >
      {status}
    </span>
  );
}
