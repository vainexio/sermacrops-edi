import { useState } from "react";
import { useListEndpoints, useListPartners, useCreateEndpoint, useUpdateEndpoint, useDeleteEndpoint, getListEndpointsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StatusBadge } from "@/components/StatusBadge";
import { useToast } from "@/hooks/use-toast";

const DOC_TYPES = ["850", "855", "856", "810", "204", "990"];
type EndpointForm = { partnerId: string; name: string; url: string; protocol: string; direction: string; supportedDocTypes: string[]; isActive: boolean };
const defaultForm: EndpointForm = { partnerId: "", name: "", url: "", protocol: "AS2", direction: "both", supportedDocTypes: [], isActive: true };

const protocolColors: Record<string, string> = { AS2: "bg-indigo-50 text-indigo-700 border border-indigo-200", SFTP: "bg-purple-50 text-purple-700 border border-purple-200", FTP: "bg-gray-100 text-gray-700 border border-gray-200", HTTP: "bg-cyan-50 text-cyan-700 border border-cyan-200", HTTPS: "bg-green-50 text-green-700 border border-green-200" };
const directionColors: Record<string, string> = { inbound: "bg-blue-50 text-blue-700 border border-blue-200", outbound: "bg-amber-50 text-amber-700 border border-amber-200", both: "bg-purple-50 text-purple-700 border border-purple-200" };

export default function Endpoints() {
  const qc = useQueryClient();
  const { data: endpoints, isLoading } = useListEndpoints();
  const { data: partners } = useListPartners();
  const createEndpoint = useCreateEndpoint();
  const updateEndpoint = useUpdateEndpoint();
  const deleteEndpoint = useDeleteEndpoint();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<EndpointForm>(defaultForm);

  function openCreate() { setEditId(null); setForm(defaultForm); setOpen(true); }
  function openEdit(ep: NonNullable<typeof endpoints>[number]) {
    setEditId(ep.id);
    setForm({ partnerId: ep.partnerId, name: ep.name, url: ep.url, protocol: ep.protocol, direction: ep.direction, supportedDocTypes: ep.supportedDocTypes, isActive: ep.isActive });
    setOpen(true);
  }
  function toggleDoc(ts: string) {
    setForm((f) => ({ ...f, supportedDocTypes: f.supportedDocTypes.includes(ts) ? f.supportedDocTypes.filter((d) => d !== ts) : [...f.supportedDocTypes, ts] }));
  }

  async function handleSave() {
    if (!form.partnerId || !form.name || !form.url) { toast({ title: "Partner, name and URL are required", variant: "destructive" }); return; }
    if (editId) {
      await updateEndpoint.mutateAsync({ id: editId, data: form as Parameters<typeof updateEndpoint.mutateAsync>[0]["data"] });
      toast({ title: "Endpoint updated" });
    } else {
      await createEndpoint.mutateAsync({ data: form as Parameters<typeof createEndpoint.mutateAsync>[0]["data"] });
      toast({ title: "Endpoint created" });
    }
    qc.invalidateQueries({ queryKey: getListEndpointsQueryKey() });
    setOpen(false);
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this endpoint?")) return;
    await deleteEndpoint.mutateAsync({ id });
    qc.invalidateQueries({ queryKey: getListEndpointsQueryKey() });
    toast({ title: "Endpoint deleted" });
  }

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Partner Endpoints</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{endpoints?.length ?? 0} endpoint(s) configured</p>
        </div>
        <Button onClick={openCreate} data-testid="button-create-endpoint" size="sm" className="gap-1.5">
          <Plus className="w-4 h-4" /> Add Endpoint
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="h-16 bg-muted rounded-lg animate-pulse" />)}</div>
      ) : (
        <div className="bg-card border border-card-border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 border-b border-border">
              <tr>
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground text-xs uppercase tracking-wide">Endpoint</th>
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground text-xs uppercase tracking-wide">Partner</th>
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground text-xs uppercase tracking-wide">URL</th>
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground text-xs uppercase tracking-wide">Protocol</th>
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground text-xs uppercase tracking-wide">Direction</th>
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground text-xs uppercase tracking-wide">Doc Types</th>
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground text-xs uppercase tracking-wide">Active</th>
                <th className="text-right px-4 py-3 font-semibold text-muted-foreground text-xs uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody>
              {(endpoints ?? []).map((ep, i) => (
                <tr key={ep.id} data-testid={`row-endpoint-${ep.id}`} className={`border-b border-border last:border-0 hover:bg-muted/30 transition-colors ${i % 2 === 0 ? "" : "bg-muted/10"}`}>
                  <td className="px-4 py-3 font-medium text-foreground">{ep.name}</td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{ep.partnerName ?? "—"}</td>
                  <td className="px-4 py-3"><span className="text-xs font-mono text-muted-foreground break-all">{ep.url}</span></td>
                  <td className="px-4 py-3"><span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold uppercase tracking-wide ${protocolColors[ep.protocol] ?? ""}`}>{ep.protocol}</span></td>
                  <td className="px-4 py-3"><span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold uppercase tracking-wide ${directionColors[ep.direction] ?? ""}`}>{ep.direction}</span></td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {ep.supportedDocTypes.map((ts) => <span key={ts} className="text-[10px] font-mono bg-primary/10 text-primary px-1.5 py-0.5 rounded font-semibold">{ts}</span>)}
                    </div>
                  </td>
                  <td className="px-4 py-3"><StatusBadge status={ep.isActive ? "active" : "inactive"} /></td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="sm" onClick={() => openEdit(ep)} data-testid={`button-edit-endpoint-${ep.id}`} className="h-7 w-7 p-0"><Pencil className="w-3.5 h-3.5" /></Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(ep.id)} data-testid={`button-delete-endpoint-${ep.id}`} className="h-7 w-7 p-0 text-destructive hover:text-destructive"><Trash2 className="w-3.5 h-3.5" /></Button>
                    </div>
                  </td>
                </tr>
              ))}
              {(!endpoints || endpoints.length === 0) && <tr><td colSpan={8} className="px-4 py-8 text-center text-sm text-muted-foreground">No endpoints configured</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editId ? "Edit Endpoint" : "Add Endpoint"}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Trading Partner *</Label>
              <Select value={form.partnerId} onValueChange={(v) => setForm((f) => ({ ...f, partnerId: v }))}>
                <SelectTrigger data-testid="select-partner"><SelectValue placeholder="Select partner" /></SelectTrigger>
                <SelectContent>{(partners ?? []).map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Endpoint Name *</Label>
                <Input data-testid="input-endpoint-name" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Production AS2" />
              </div>
              <div className="space-y-1.5">
                <Label>Protocol</Label>
                <Select value={form.protocol} onValueChange={(v) => setForm((f) => ({ ...f, protocol: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{["AS2", "SFTP", "FTP", "HTTP", "HTTPS"].map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Endpoint URL *</Label>
              <Input data-testid="input-endpoint-url" value={form.url} onChange={(e) => setForm((f) => ({ ...f, url: e.target.value }))} placeholder="https://as2.partner.com/receive" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Direction</Label>
                <Select value={form.direction} onValueChange={(v) => setForm((f) => ({ ...f, direction: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="inbound">Inbound</SelectItem>
                    <SelectItem value="outbound">Outbound</SelectItem>
                    <SelectItem value="both">Both</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Status</Label>
                <Select value={form.isActive ? "active" : "inactive"} onValueChange={(v) => setForm((f) => ({ ...f, isActive: v === "active" }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Supported Doc Types</Label>
              <div className="flex flex-wrap gap-2">
                {DOC_TYPES.map((ts) => (
                  <button key={ts} type="button" data-testid={`toggle-ep-doctype-${ts}`} onClick={() => toggleDoc(ts)}
                    className={`text-xs font-mono px-3 py-1.5 rounded border transition-colors ${form.supportedDocTypes.includes(ts) ? "bg-primary text-primary-foreground border-primary" : "bg-card text-muted-foreground border-border hover:border-primary/50"}`}>
                    {ts}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} data-testid="button-save-endpoint" disabled={createEndpoint.isPending || updateEndpoint.isPending}>
              {(createEndpoint.isPending || updateEndpoint.isPending) ? "Saving..." : "Save Endpoint"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
