import { useState } from "react";
import { Link } from "wouter";
import { useListDocuments, useListPartners, useCreateDocument, useDeleteDocument, getListDocumentsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, ArrowUpRight, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { StatusBadge } from "@/components/StatusBadge";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";

const TX_SETS = ["850", "855", "856", "810", "204", "990"] as const;
const STATUSES = ["Draft", "Validated", "Sent", "Received", "Acknowledged", "Failed"] as const;

type DocForm = { partnerId: string; transactionSet: string; direction: string; rawContent: string };
const defaultForm: DocForm = { partnerId: "", transactionSet: "850", direction: "outbound", rawContent: "" };

export default function Documents() {
  const qc = useQueryClient();
  const [filterStatus, setFilterStatus] = useState<string>("");
  const [filterTxSet, setFilterTxSet] = useState<string>("");
  const [filterDir, setFilterDir] = useState<string>("");
  const { data: documents, isLoading } = useListDocuments({
    ...(filterStatus ? { status: filterStatus } : {}),
    ...(filterTxSet ? { transactionSet: filterTxSet } : {}),
    ...(filterDir ? { direction: filterDir } : {}),
  });
  const { data: partners } = useListPartners();
  const createDocument = useCreateDocument();
  const deleteDocument = useDeleteDocument();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<DocForm>(defaultForm);

  async function handleCreate() {
    if (!form.partnerId) { toast({ title: "Select a partner", variant: "destructive" }); return; }
    await createDocument.mutateAsync({ data: form as Parameters<typeof createDocument.mutateAsync>[0]["data"] });
    qc.invalidateQueries({ queryKey: getListDocumentsQueryKey() });
    toast({ title: "Document created" });
    setOpen(false);
    setForm(defaultForm);
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this document?")) return;
    await deleteDocument.mutateAsync({ id });
    qc.invalidateQueries({ queryKey: getListDocumentsQueryKey() });
    toast({ title: "Document deleted" });
  }

  const validationColors: Record<string, string> = { pending: "text-muted-foreground", passed: "text-chart-2", failed: "text-destructive" };

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">EDI Documents</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{documents?.length ?? 0} document(s)</p>
        </div>
        <Button onClick={() => setOpen(true)} data-testid="button-create-document" size="sm" className="gap-1.5">
          <Plus className="w-4 h-4" /> New Document
        </Button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground"><Filter className="w-3.5 h-3.5" /> Filter:</div>
        <Select value={filterStatus || "all"} onValueChange={(v) => setFilterStatus(v === "all" ? "" : v)}>
          <SelectTrigger className="h-8 text-xs w-36" data-testid="filter-status"><SelectValue placeholder="All Statuses" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterTxSet || "all"} onValueChange={(v) => setFilterTxSet(v === "all" ? "" : v)}>
          <SelectTrigger className="h-8 text-xs w-36" data-testid="filter-txset"><SelectValue placeholder="All Types" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {TX_SETS.map((ts) => <SelectItem key={ts} value={ts}>EDI {ts}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterDir || "all"} onValueChange={(v) => setFilterDir(v === "all" ? "" : v)}>
          <SelectTrigger className="h-8 text-xs w-36" data-testid="filter-direction"><SelectValue placeholder="All Directions" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Directions</SelectItem>
            <SelectItem value="inbound">Inbound</SelectItem>
            <SelectItem value="outbound">Outbound</SelectItem>
          </SelectContent>
        </Select>
        {(filterStatus || filterTxSet || filterDir) && (
          <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={() => { setFilterStatus(""); setFilterTxSet(""); setFilterDir(""); }}>Clear</Button>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-2">{[...Array(5)].map((_, i) => <div key={i} className="h-12 bg-muted rounded animate-pulse" />)}</div>
      ) : (
        <div className="bg-card border border-card-border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 border-b border-border">
              <tr>
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground text-xs uppercase tracking-wide">Control #</th>
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground text-xs uppercase tracking-wide">Type</th>
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground text-xs uppercase tracking-wide">Partner</th>
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground text-xs uppercase tracking-wide">Direction</th>
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground text-xs uppercase tracking-wide">Status</th>
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground text-xs uppercase tracking-wide">Validation</th>
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground text-xs uppercase tracking-wide">Created</th>
                <th className="text-right px-4 py-3 font-semibold text-muted-foreground text-xs uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody>
              {(documents ?? []).map((doc, i) => (
                <tr key={doc.id} data-testid={`row-document-${doc.id}`} className={`border-b border-border last:border-0 hover:bg-muted/30 transition-colors ${i % 2 === 0 ? "" : "bg-muted/10"}`}>
                  <td className="px-4 py-3 font-mono text-xs font-medium text-foreground">{doc.controlNumber}</td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-sidebar text-sidebar-foreground">
                      EDI {doc.transactionSet}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{doc.partnerName ?? "—"}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-semibold uppercase ${doc.direction === "inbound" ? "text-blue-600" : "text-amber-600"}`}>
                      {doc.direction === "inbound" ? "↓ In" : "↑ Out"}
                    </span>
                  </td>
                  <td className="px-4 py-3"><StatusBadge status={doc.status} /></td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-semibold uppercase tracking-wide ${validationColors[doc.validationStatus]}`}>
                      {doc.validationStatus}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{formatDistanceToNow(new Date(doc.createdAt), { addSuffix: true })}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Link href={`/documents/${doc.id}`}>
                        <Button variant="ghost" size="sm" data-testid={`button-view-document-${doc.id}`} className="h-7 w-7 p-0">
                          <ArrowUpRight className="w-3.5 h-3.5" />
                        </Button>
                      </Link>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(doc.id)} data-testid={`button-delete-document-${doc.id}`} className="h-7 w-7 p-0 text-destructive hover:text-destructive">
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              {(!documents || documents.length === 0) && (
                <tr><td colSpan={8} className="px-4 py-8 text-center text-sm text-muted-foreground">No documents found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Create EDI Document</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Trading Partner *</Label>
              <Select value={form.partnerId} onValueChange={(v) => setForm((f) => ({ ...f, partnerId: v }))}>
                <SelectTrigger data-testid="select-doc-partner"><SelectValue placeholder="Select partner" /></SelectTrigger>
                <SelectContent>{(partners ?? []).map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Transaction Set</Label>
                <Select value={form.transactionSet} onValueChange={(v) => setForm((f) => ({ ...f, transactionSet: v }))}>
                  <SelectTrigger data-testid="select-tx-set"><SelectValue /></SelectTrigger>
                  <SelectContent>{TX_SETS.map((ts) => <SelectItem key={ts} value={ts}>EDI {ts}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Direction</Label>
                <Select value={form.direction} onValueChange={(v) => setForm((f) => ({ ...f, direction: v }))}>
                  <SelectTrigger data-testid="select-direction"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="outbound">Outbound</SelectItem>
                    <SelectItem value="inbound">Inbound</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Raw EDI Content (optional)</Label>
              <Textarea data-testid="input-raw-content" value={form.rawContent} onChange={(e) => setForm((f) => ({ ...f, rawContent: e.target.value }))} placeholder="Leave blank to auto-generate sample EDI content" rows={4} className="font-mono text-xs" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={handleCreate} data-testid="button-save-document" disabled={createDocument.isPending}>
              {createDocument.isPending ? "Creating..." : "Create Document"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
