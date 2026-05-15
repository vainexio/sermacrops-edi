import { useListValidationResults } from "@workspace/api-client-react";
import { ShieldCheck, ShieldX } from "lucide-react";
import { StatusBadge } from "@/components/StatusBadge";
import { formatDistanceToNow } from "date-fns";

export default function Validation() {
  const { data: results, isLoading } = useListValidationResults();

  return (
    <div className="p-6 space-y-5">
      <div>
        <h1 className="text-xl font-bold text-foreground">Validation Results</h1>
        <p className="text-sm text-muted-foreground mt-0.5">{results?.length ?? 0} validation record(s)</p>
      </div>

      {isLoading ? (
        <div className="space-y-3">{[...Array(4)].map((_, i) => <div key={i} className="h-24 bg-muted rounded-lg animate-pulse" />)}</div>
      ) : (
        <div className="space-y-3">
          {(results ?? []).map((vr) => (
            <div key={vr.id} data-testid={`validation-card-${vr.id}`} className="bg-card border border-card-border rounded-lg p-4">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-2">
                  {vr.isValid
                    ? <ShieldCheck className="w-4 h-4 text-chart-2 flex-shrink-0" />
                    : <ShieldX className="w-4 h-4 text-destructive flex-shrink-0" />}
                  <StatusBadge status={vr.isValid ? "passed" : "failed"} />
                  <span className="text-xs font-mono text-muted-foreground">{vr.documentId}</span>
                </div>
                <span className="text-xs text-muted-foreground flex-shrink-0">
                  {formatDistanceToNow(new Date(vr.validatedAt), { addSuffix: true })}
                </span>
              </div>
              {vr.errors.length > 0 && (
                <div className="space-y-1.5 mb-2">
                  {vr.errors.map((err, i) => (
                    <div key={i} className="bg-destructive/5 border border-destructive/20 rounded p-2.5 text-xs">
                      <div className="font-semibold text-destructive">[{err.segment}] Code: {err.code}</div>
                      <div className="text-muted-foreground mt-0.5">{err.message}</div>
                      {err.field && <div className="text-muted-foreground/70">Field: {err.field}</div>}
                    </div>
                  ))}
                </div>
              )}
              {vr.warnings.length > 0 && (
                <div className="space-y-1">
                  {vr.warnings.map((w, i) => (
                    <div key={i} className="bg-amber-50 border border-amber-200 rounded p-2 text-xs text-amber-700">{w}</div>
                  ))}
                </div>
              )}
              {vr.errors.length === 0 && vr.warnings.length === 0 && (
                <p className="text-xs text-muted-foreground">All checks passed — no issues found.</p>
              )}
            </div>
          ))}
          {(!results || results.length === 0) && (
            <div className="text-center py-12 text-muted-foreground">
              <ShieldCheck className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm">No validation results yet</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
