import { useListTranslationLogs } from "@workspace/api-client-react";
import { Languages } from "lucide-react";
import { StatusBadge } from "@/components/StatusBadge";
import { formatDistanceToNow } from "date-fns";

export default function TranslationLogs() {
  const { data: logs, isLoading } = useListTranslationLogs();

  return (
    <div className="p-6 space-y-5">
      <div>
        <h1 className="text-xl font-bold text-foreground">Translation Logs</h1>
        <p className="text-sm text-muted-foreground mt-0.5">{logs?.length ?? 0} translation record(s)</p>
      </div>

      {isLoading ? (
        <div className="space-y-2">{[...Array(5)].map((_, i) => <div key={i} className="h-12 bg-muted rounded animate-pulse" />)}</div>
      ) : (
        <div className="bg-card border border-card-border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 border-b border-border">
              <tr>
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground text-xs uppercase tracking-wide">Document ID</th>
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground text-xs uppercase tracking-wide">Direction</th>
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground text-xs uppercase tracking-wide">Input</th>
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground text-xs uppercase tracking-wide">Output</th>
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground text-xs uppercase tracking-wide">Segments</th>
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground text-xs uppercase tracking-wide">Status</th>
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground text-xs uppercase tracking-wide">When</th>
              </tr>
            </thead>
            <tbody>
              {(logs ?? []).map((log, i) => (
                <tr key={log.id} data-testid={`log-row-${log.id}`} className={`border-b border-border last:border-0 hover:bg-muted/30 ${i % 2 === 0 ? "" : "bg-muted/10"}`}>
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground truncate max-w-[140px]">{log.documentId}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{log.direction.replace(/_/g, " → ")}</td>
                  <td className="px-4 py-3 text-xs font-medium">{log.inputFormat}</td>
                  <td className="px-4 py-3 text-xs font-medium">{log.outputFormat}</td>
                  <td className="px-4 py-3 text-xs font-mono tabular-nums">{log.parsedSegments}</td>
                  <td className="px-4 py-3"><StatusBadge status={log.status} /></td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{formatDistanceToNow(new Date(log.translatedAt), { addSuffix: true })}</td>
                </tr>
              ))}
              {(!logs || logs.length === 0) && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-sm text-muted-foreground">
                    <Languages className="w-6 h-6 mx-auto mb-2 opacity-30" />
                    No translation logs yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
