import { useParams, useLocation } from "wouter";
import {
  useGetDocument, useGetDocumentProgress, useValidateDocument, useTranslateDocument,
  useSendDocument, useResendDocument, getGetDocumentQueryKey, getGetDocumentProgressQueryKey
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, ShieldCheck, Languages, Send, RotateCcw, CheckCircle, Circle, XCircle, Clock, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/StatusBadge";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow, format } from "date-fns";
import { cn } from "@/lib/utils";

export default function DocumentDetail() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const [, setLocation] = useLocation();
  const qc = useQueryClient();
  const { toast } = useToast();

  const { data: doc, isLoading } = useGetDocument(id, { query: { enabled: !!id, queryKey: getGetDocumentQueryKey(id) } });
  const { data: progress } = useGetDocumentProgress(id, { query: { enabled: !!id, queryKey: getGetDocumentProgressQueryKey(id) } });

  const validate = useValidateDocument();
  const translate = useTranslateDocument();
  const send = useSendDocument();
  const resend = useResendDocument();

  function invalidate() {
    qc.invalidateQueries({ queryKey: getGetDocumentQueryKey(id) });
    qc.invalidateQueries({ queryKey: getGetDocumentProgressQueryKey(id) });
  }

  async function handleValidate() {
    await validate.mutateAsync({ id });
    invalidate();
    toast({ title: "Validation complete" });
  }
  async function handleTranslate() {
    await translate.mutateAsync({ id });
    invalidate();
    toast({ title: "Translation complete" });
  }
  async function handleSend() {
    await send.mutateAsync({ id });
    invalidate();
    toast({ title: "Document sent" });
  }
  async function handleResend() {
    await resend.mutateAsync({ id });
    invalidate();
    toast({ title: "Document resent" });
  }

  const stepIcons: Record<string, React.ElementType> = { completed: CheckCircle, current: Clock, pending: Circle, failed: XCircle };
  const stepColors: Record<string, string> = { completed: "text-chart-2", current: "text-primary", pending: "text-muted-foreground", failed: "text-destructive" };

  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        <div className="h-8 w-48 bg-muted rounded animate-pulse" />
        <div className="h-40 bg-muted rounded-lg animate-pulse" />
        <div className="h-60 bg-muted rounded-lg animate-pulse" />
      </div>
    );
  }

  if (!doc) return <div className="p-6 text-muted-foreground">Document not found.</div>;

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => setLocation("/documents")} className="gap-1.5 h-8 px-2" data-testid="button-back">
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-foreground">EDI {doc.transactionSet}</h1>
              <StatusBadge status={doc.status} />
            </div>
            <p className="text-xs text-muted-foreground mt-0.5 font-mono">Control: {doc.controlNumber} · {doc.partnerName ?? "Unknown Partner"}</p>
          </div>
        </div>
        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <Button variant="outline" size="sm" onClick={handleValidate} disabled={validate.isPending} data-testid="button-validate" className="gap-1.5 h-8">
            <ShieldCheck className="w-3.5 h-3.5" />
            {validate.isPending ? "Validating..." : "Validate"}
          </Button>
          <Button variant="outline" size="sm" onClick={handleTranslate} disabled={translate.isPending} data-testid="button-translate" className="gap-1.5 h-8">
            <Languages className="w-3.5 h-3.5" />
            {translate.isPending ? "Translating..." : "Translate"}
          </Button>
          {doc.status === "Failed" ? (
            <Button size="sm" onClick={handleResend} disabled={resend.isPending} data-testid="button-resend" className="gap-1.5 h-8">
              <RotateCcw className="w-3.5 h-3.5" />
              {resend.isPending ? "Resending..." : "Resend"}
            </Button>
          ) : (
            <Button size="sm" onClick={handleSend} disabled={send.isPending || doc.status === "Acknowledged"} data-testid="button-send" className="gap-1.5 h-8">
              <Send className="w-3.5 h-3.5" />
              {send.isPending ? "Sending..." : "Send"}
            </Button>
          )}
        </div>
      </div>

      {/* Progress Flow */}
      {progress && (
        <div className="bg-card border border-card-border rounded-lg p-5">
          <h2 className="text-sm font-semibold text-foreground mb-4">
            Transaction Flow — {progress.flowType === "procurement" ? "Procurement" : "Logistics"}
          </h2>
          <div className="flex items-center gap-1 overflow-x-auto pb-2">
            {progress.steps.map((step, idx) => {
              const Icon = stepIcons[step.status] ?? Circle;
              return (
                <div key={step.stepNumber} className="flex items-center gap-1">
                  <div
                    data-testid={`progress-step-${step.transactionSet}`}
                    className={cn(
                      "flex flex-col items-center gap-1.5 px-4 py-3 rounded-lg border transition-all min-w-[110px]",
                      step.status === "current" ? "bg-primary/5 border-primary/30" :
                      step.status === "completed" ? "bg-chart-2/5 border-chart-2/20" :
                      step.status === "failed" ? "bg-destructive/5 border-destructive/20" :
                      "bg-muted/40 border-border"
                    )}
                  >
                    <Icon className={cn("w-5 h-5", stepColors[step.status])} />
                    <div className="text-center">
                      <div className="text-xs font-mono font-bold text-foreground">EDI {step.transactionSet}</div>
                      <div className="text-[10px] text-muted-foreground mt-0.5 leading-tight">{step.label}</div>
                      <div className={cn("text-[10px] font-semibold uppercase mt-1", stepColors[step.status])}>
                        {step.status}
                      </div>
                    </div>
                    {step.completedAt && (
                      <div className="text-[9px] text-muted-foreground/60">
                        {format(new Date(step.completedAt), "HH:mm")}
                      </div>
                    )}
                  </div>
                  {idx < progress.steps.length - 1 && (
                    <ArrowRight className="w-4 h-4 text-muted-foreground/40 flex-shrink-0" />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Document Info */}
        <div className="bg-card border border-card-border rounded-lg p-5">
          <h2 className="text-sm font-semibold text-foreground mb-3">Document Details</h2>
          <dl className="space-y-2 text-sm">
            {[
              ["Transaction Set", `EDI ${doc.transactionSet}`],
              ["Direction", doc.direction],
              ["Validation", doc.validationStatus],
              ["Acknowledged", doc.isAcknowledged ? "Yes" : "No"],
              ["Sent At", doc.sentAt ? format(new Date(doc.sentAt), "MMM d, yyyy HH:mm") : "—"],
              ["Received At", doc.receivedAt ? format(new Date(doc.receivedAt), "MMM d, yyyy HH:mm") : "—"],
              ["Created", formatDistanceToNow(new Date(doc.createdAt), { addSuffix: true })],
            ].map(([label, value]) => (
              <div key={label} className="flex items-start justify-between gap-2">
                <dt className="text-muted-foreground flex-shrink-0">{label}</dt>
                <dd className="font-medium text-foreground text-right">{value}</dd>
              </div>
            ))}
          </dl>
        </div>

        {/* Status History */}
        <div className="bg-card border border-card-border rounded-lg p-5">
          <h2 className="text-sm font-semibold text-foreground mb-3">Status History</h2>
          <div className="space-y-2">
            {(doc.statusHistory ?? []).map((h) => (
              <div key={h.id} className="flex items-start gap-2.5 text-sm" data-testid={`history-item-${h.id}`}>
                <StatusBadge status={h.status} className="flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <div className="text-muted-foreground text-xs">{h.message}</div>
                  <div className="text-[10px] text-muted-foreground/60">{formatDistanceToNow(new Date(h.createdAt), { addSuffix: true })}</div>
                </div>
              </div>
            ))}
            {(!doc.statusHistory || doc.statusHistory.length === 0) && (
              <p className="text-sm text-muted-foreground">No status history</p>
            )}
          </div>
        </div>
      </div>

      {/* Validation Results */}
      {doc.validationResults && doc.validationResults.length > 0 && (
        <div className="bg-card border border-card-border rounded-lg p-5">
          <h2 className="text-sm font-semibold text-foreground mb-3">Validation Results</h2>
          {doc.validationResults.map((vr) => (
            <div key={vr.id} data-testid={`validation-result-${vr.id}`}>
              <div className="flex items-center gap-2 mb-2">
                <StatusBadge status={vr.isValid ? "passed" : "failed"} />
                <span className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(vr.validatedAt), { addSuffix: true })}</span>
              </div>
              {vr.errors.length > 0 && (
                <div className="space-y-1.5 mb-2">
                  {vr.errors.map((err, i) => (
                    <div key={i} className="bg-destructive/5 border border-destructive/20 rounded p-2.5 text-xs">
                      <div className="font-semibold text-destructive">[{err.segment}] {err.code}</div>
                      <div className="text-muted-foreground mt-0.5">{err.message}</div>
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
            </div>
          ))}
        </div>
      )}

      {/* Raw EDI Content */}
      {doc.rawContent && (
        <div className="bg-card border border-card-border rounded-lg p-5">
          <h2 className="text-sm font-semibold text-foreground mb-3">Raw ANSI X12 Content</h2>
          <pre className="text-xs font-mono text-muted-foreground bg-muted/50 rounded p-3 overflow-x-auto whitespace-pre-wrap break-all" data-testid="raw-edi-content">
            {doc.rawContent}
          </pre>
        </div>
      )}

      {/* Translation Logs */}
      {doc.translationLogs && doc.translationLogs.length > 0 && (
        <div className="bg-card border border-card-border rounded-lg p-5">
          <h2 className="text-sm font-semibold text-foreground mb-3">Translation Logs</h2>
          <div className="space-y-2">
            {doc.translationLogs.map((log) => (
              <div key={log.id} className="flex items-center justify-between text-sm border-b border-border last:border-0 py-2" data-testid={`translation-log-${log.id}`}>
                <div className="flex items-center gap-2">
                  <StatusBadge status={log.status} />
                  <span className="text-xs text-muted-foreground">{log.inputFormat} → {log.outputFormat}</span>
                  <span className="text-xs text-muted-foreground">{log.parsedSegments} segments</span>
                </div>
                <span className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(log.translatedAt), { addSuffix: true })}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Transmission Logs */}
      {doc.transmissionLogs && doc.transmissionLogs.length > 0 && (
        <div className="bg-card border border-card-border rounded-lg p-5">
          <h2 className="text-sm font-semibold text-foreground mb-3">Transmission Logs</h2>
          <div className="space-y-2">
            {doc.transmissionLogs.map((log) => (
              <div key={log.id} className="text-sm border-b border-border last:border-0 py-2" data-testid={`transmission-log-${log.id}`}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <StatusBadge status={log.status} />
                    <span className="text-xs font-mono text-muted-foreground">{log.protocol}</span>
                    {log.httpStatusCode && <span className="text-xs text-muted-foreground">HTTP {log.httpStatusCode}</span>}
                  </div>
                  <span className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(log.transmittedAt), { addSuffix: true })}</span>
                </div>
                <div className="text-xs text-muted-foreground">{log.endpointUrl}</div>
                {log.responseMessage && <div className="text-xs text-muted-foreground/70 mt-0.5">{log.responseMessage}</div>}
                {log.as2MessageId && <div className="text-[10px] font-mono text-muted-foreground/50 mt-0.5">{log.as2MessageId}</div>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
