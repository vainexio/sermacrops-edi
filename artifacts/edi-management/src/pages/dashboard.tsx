import { useGetDashboardSummary, useGetRecentActivity } from "@workspace/api-client-react";
import { FileText, Users, Network, Bell, TrendingUp, AlertTriangle, ArrowUp, ArrowDown } from "lucide-react";
import { StatusBadge } from "@/components/StatusBadge";
import { formatDistanceToNow } from "date-fns";

function StatCard({ label, value, icon: Icon, sub, color }: { label: string; value: number | string; icon: React.ElementType; sub?: string; color: string }) {
  return (
    <div className="bg-card border border-card-border rounded-lg p-5 flex items-start gap-4" data-testid={`stat-card-${label.toLowerCase().replace(/\s+/g, "-")}`}>
      <div className={`p-2.5 rounded-lg ${color}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-2xl font-bold text-foreground tabular-nums">{value}</div>
        <div className="text-sm text-muted-foreground mt-0.5">{label}</div>
        {sub && <div className="text-xs text-muted-foreground/70 mt-1">{sub}</div>}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { data: summary, isLoading: loadingSummary } = useGetDashboardSummary();
  const { data: activity, isLoading: loadingActivity } = useGetRecentActivity({ limit: 15 });

  const txLabels: Record<string, string> = { "850": "850 PO", "855": "855 Ack", "856": "856 ASN", "810": "810 Inv", "204": "204 Load", "990": "990 Resp" };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-xl font-bold text-foreground">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-0.5">SERMACROPS EDI Operations Overview</p>
      </div>

      {/* Stat Cards */}
      {loadingSummary ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <div key={i} className="h-24 bg-muted rounded-lg animate-pulse" />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Total Documents" value={summary?.totalDocuments ?? 0} icon={FileText} color="bg-primary/10 text-primary" sub="All EDI transactions" />
          <StatCard label="Trading Partners" value={summary?.totalPartners ?? 0} icon={Users} color="bg-chart-2/10 text-chart-2" sub="Active connections" />
          <StatCard label="Endpoints" value={summary?.totalEndpoints ?? 0} icon={Network} color="bg-chart-5/10 text-chart-5" sub="Configured channels" />
          <StatCard label="Unread Alerts" value={summary?.unreadNotifications ?? 0} icon={Bell} color="bg-destructive/10 text-destructive" sub="Require attention" />
        </div>
      )}

      {/* Today's Activity */}
      {summary && (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="bg-card border border-card-border rounded-lg p-4 flex items-center gap-3" data-testid="stat-sent-today">
            <ArrowUp className="w-5 h-5 text-primary" />
            <div>
              <div className="text-lg font-bold tabular-nums">{summary.sentToday}</div>
              <div className="text-xs text-muted-foreground">Sent Today</div>
            </div>
          </div>
          <div className="bg-card border border-card-border rounded-lg p-4 flex items-center gap-3" data-testid="stat-received-today">
            <ArrowDown className="w-5 h-5 text-chart-2" />
            <div>
              <div className="text-lg font-bold tabular-nums">{summary.receivedToday}</div>
              <div className="text-xs text-muted-foreground">Received Today</div>
            </div>
          </div>
          <div className="bg-card border border-card-border rounded-lg p-4 flex items-center gap-3" data-testid="stat-failures">
            <AlertTriangle className="w-5 h-5 text-destructive" />
            <div>
              <div className="text-lg font-bold tabular-nums">{summary.recentFailures}</div>
              <div className="text-xs text-muted-foreground">Failures Today</div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status Breakdown */}
        {summary && (
          <div className="bg-card border border-card-border rounded-lg p-5">
            <h2 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary" />
              Documents by Status
            </h2>
            <div className="space-y-2">
              {Object.entries(summary.documentsByStatus).map(([status, count]) => (
                <div key={status} className="flex items-center justify-between py-1" data-testid={`status-row-${status}`}>
                  <StatusBadge status={status} />
                  <span className="text-sm font-semibold tabular-nums text-foreground">{count as number}</span>
                </div>
              ))}
              {Object.keys(summary.documentsByStatus).length === 0 && (
                <p className="text-sm text-muted-foreground py-2">No documents yet</p>
              )}
            </div>
          </div>
        )}

        {/* Transaction Set Breakdown */}
        {summary && (
          <div className="bg-card border border-card-border rounded-lg p-5">
            <h2 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
              <FileText className="w-4 h-4 text-primary" />
              Documents by Transaction Set
            </h2>
            <div className="space-y-2">
              {Object.entries(summary.documentsByTransactionSet).map(([ts, count]) => (
                <div key={ts} className="flex items-center justify-between py-1" data-testid={`txset-row-${ts}`}>
                  <span className="text-sm font-medium text-foreground">{txLabels[ts] ?? `EDI ${ts}`}</span>
                  <span className="text-sm font-semibold tabular-nums">{count as number}</span>
                </div>
              ))}
              {Object.keys(summary.documentsByTransactionSet).length === 0 && (
                <p className="text-sm text-muted-foreground py-2">No documents yet</p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Recent Activity */}
      <div className="bg-card border border-card-border rounded-lg p-5">
        <h2 className="text-sm font-semibold text-foreground mb-4">Recent Activity</h2>
        {loadingActivity ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => <div key={i} className="h-10 bg-muted rounded animate-pulse" />)}
          </div>
        ) : (
          <div className="space-y-1">
            {(activity ?? []).map((item) => (
              <div key={item.id} className="flex items-start justify-between py-2 border-b border-border last:border-0" data-testid={`activity-item-${item.id}`}>
                <div className="flex items-start gap-2 min-w-0">
                  {item.status && <StatusBadge status={item.status} className="mt-0.5 flex-shrink-0" />}
                  <span className="text-sm text-foreground truncate">{item.message}</span>
                </div>
                <span className="text-xs text-muted-foreground ml-4 flex-shrink-0">
                  {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
                </span>
              </div>
            ))}
            {(!activity || activity.length === 0) && (
              <p className="text-sm text-muted-foreground py-4 text-center">No recent activity</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
