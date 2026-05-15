import { useListNotifications, useMarkNotificationRead, useMarkAllNotificationsRead, getListNotificationsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Bell, CheckCheck, Info, AlertTriangle, XCircle, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import { useState } from "react";

const severityIcons: Record<string, React.ElementType> = { info: Info, warning: AlertTriangle, error: XCircle, success: CheckCircle };
const severityColors: Record<string, string> = {
  info: "text-blue-600 bg-blue-50 border-blue-200",
  warning: "text-amber-600 bg-amber-50 border-amber-200",
  error: "text-destructive bg-destructive/5 border-destructive/20",
  success: "text-chart-2 bg-chart-2/5 border-chart-2/20",
};

export default function Notifications() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [unreadOnly, setUnreadOnly] = useState(false);
  const { data: notifications, isLoading } = useListNotifications({ unreadOnly: unreadOnly || undefined });
  const markRead = useMarkNotificationRead();
  const markAll = useMarkAllNotificationsRead();

  async function handleMarkRead(id: string) {
    await markRead.mutateAsync({ id });
    qc.invalidateQueries({ queryKey: getListNotificationsQueryKey() });
    qc.invalidateQueries({ queryKey: getListNotificationsQueryKey({ unreadOnly: true }) });
  }

  async function handleMarkAll() {
    await markAll.mutateAsync();
    qc.invalidateQueries({ queryKey: getListNotificationsQueryKey() });
    toast({ title: "All notifications marked as read" });
  }

  const unreadCount = (notifications ?? []).filter((n) => !n.isRead).length;

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bell className="w-5 h-5 text-primary" />
          <div>
            <h1 className="text-xl font-bold text-foreground">Notifications</h1>
            <p className="text-sm text-muted-foreground mt-0.5">{unreadCount} unread</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setUnreadOnly(!unreadOnly)} data-testid="button-filter-unread" className="h-8 text-xs">
            {unreadOnly ? "Show All" : "Unread Only"}
          </Button>
          <Button variant="outline" size="sm" onClick={handleMarkAll} disabled={markAll.isPending || unreadCount === 0} data-testid="button-mark-all-read" className="gap-1.5 h-8">
            <CheckCheck className="w-3.5 h-3.5" />
            Mark All Read
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="h-16 bg-muted rounded-lg animate-pulse" />)}</div>
      ) : (
        <div className="space-y-2">
          {(notifications ?? []).map((n) => {
            const Icon = severityIcons[n.severity] ?? Info;
            return (
              <div
                key={n.id}
                data-testid={`notification-item-${n.id}`}
                className={cn(
                  "flex items-start gap-3 p-4 rounded-lg border transition-all",
                  !n.isRead ? "bg-card shadow-sm" : "bg-muted/30 opacity-75",
                )}
              >
                <div className={cn("p-1.5 rounded border mt-0.5 flex-shrink-0", severityColors[n.severity])}>
                  <Icon className="w-3.5 h-3.5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-foreground">{n.title}</span>
                        {!n.isRead && <span className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{n.message}</p>
                      <p className="text-[10px] text-muted-foreground/60 mt-1.5">
                        {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                        {n.type && ` · ${n.type.replace(/_/g, " ")}`}
                      </p>
                    </div>
                    {!n.isRead && (
                      <Button variant="ghost" size="sm" onClick={() => handleMarkRead(n.id)} data-testid={`button-mark-read-${n.id}`} className="h-7 text-xs flex-shrink-0">
                        Mark Read
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
          {(!notifications || notifications.length === 0) && (
            <div className="text-center py-12 text-muted-foreground">
              <Bell className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm">No notifications</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
