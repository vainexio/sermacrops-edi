import { useState } from "react";
import { useListPartners, useCreatePartner, useUpdatePartner, useDeletePartner, getListPartnersQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2, Mail, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StatusBadge } from "@/components/StatusBadge";
import { useToast } from "@/hooks/use-toast";

const DOC_TYPES = ["850", "855", "856", "810", "204", "990"];

type PartnerForm = { name: string; as2Identifier: string; contactEmail: string; contactPhone: string; supportedDocTypes: string[]; status: string };
const defaultForm: PartnerForm = { name: "", as2Identifier: "", contactEmail: "", contactPhone: "", supportedDocTypes: [], status: "active" };

export default function Partners() {
  const qc = useQueryClient();
  const { data: partners, isLoading } = useListPartners();
  const createPartner = useCreatePartner();
  const updatePartner = useUpdatePartner();
  const deletePartner = useDeletePartner();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<PartnerForm>(defaultForm);

  function openCreate() { setEditId(null); setForm(defaultForm); setOpen(true); }
  function openEdit(p: NonNullable<typeof partners>[number]) {
    setEditId(p.id);
    setForm({ name: p.name, as2Identifier: p.as2Identifier, contactEmail: p.contactEmail ?? "", contactPhone: p.contactPhone ?? "", supportedDocTypes: p.supportedDocTypes, status: p.status });
    setOpen(true);
  }
  function toggleDoc(ts: string) {
    setForm((f) => ({ ...f, supportedDocTypes: f.supportedDocTypes.includes(ts) ? f.supportedDocTypes.filter((d) => d !== ts) : [...f.supportedDocTypes, ts] }));
  }

  async function handleSave() {
    if (!form.name || !form.as2Identifier) { toast({ title: "Name and AS2 Identifier are required", variant: "destructive" }); return; }
    if (editId) {
      await updatePartner.mutateAsync({ id: editId, data: form as Parameters<typeof updatePartner.mutateAsync>[0]["data"] });
      toast({ title: "Partner updated" });
    } else {
      await createPartner.mutateAsync({ data: form as Parameters<typeof createPartner.mutateAsync>[0]["data"] });
      toast({ title: "Partner created" });
    }
    qc.invalidateQueries({ queryKey: getListPartnersQueryKey() });
    setOpen(false);
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Delete partner "${name}"?`)) return;
    await deletePartner.mutateAsync({ id });
    qc.invalidateQueries({ queryKey: getListPartnersQueryKey() });
    toast({ title: "Partner deleted" });
  }

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Trading Partners</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{partners?.length ?? 0} partner(s) configured</p>
        </div>
        <Button onClick={openCreate} data-testid="button-create-partner" size="sm" className="gap-1.5">
          <Plus className="w-4 h-4" /> Add Partner
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="h-20 bg-muted rounded-lg animate-pulse" />)}</div>
      ) : (
        <div className="bg-card border border-card-border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 border-b border-border">
              <tr>
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground text-xs uppercase tracking-wide">Partner</th>
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground text-xs uppercase tracking-wide">AS2 ID</th>
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground text-xs uppercase tracking-wide">Contact</th>
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground text-xs uppercase tracking-wide">Doc Types</th>
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground text-xs uppercase tracking-wide">Status</th>
                <th className="text-right px-4 py-3 font-semibold text-muted-foreground text-xs uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody>
              {(partners ?? []).map((p, i) => (
                <tr key={p.id} data-testid={`row-partner-${p.id}`} className={`border-b border-border last:border-0 hover:bg-muted/30 transition-colors ${i % 2 === 0 ? "" : "bg-muted/10"}`}>
                  <td className="px-4 py-3 font-medium text-foreground">{p.name}</td>
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{p.as2Identifier}</td>
                  <td className="px-4 py-3">
                    <div className="space-y-0.5">
                      {p.contactEmail && <div className="flex items-center gap-1.5 text-xs text-muted-foreground"><Mail className="w-3 h-3" />{p.contactEmail}</div>}
                      {p.contactPhone && <div className="flex items-center gap-1.5 text-xs text-muted-foreground"><Phone className="w-3 h-3" />{p.contactPhone}</div>}
                      {!p.contactEmail && !p.contactPhone && <span className="text-xs text-muted-foreground/50">—</span>}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {p.supportedDocTypes.map((ts) => (
                        <span key={ts} className="text-[10px] font-mono bg-primary/10 text-primary px-1.5 py-0.5 rounded font-semibold">{ts}</span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3"><StatusBadge status={p.status} /></td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="sm" onClick={() => openEdit(p)} data-testid={`button-edit-partner-${p.id}`} className="h-7 w-7 p-0">
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(p.id, p.name)} data-testid={`button-delete-partner-${p.id}`} className="h-7 w-7 p-0 text-destructive hover:text-destructive">
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              {(!partners || partners.length === 0) && (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-sm text-muted-foreground">No trading partners configured</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editId ? "Edit Partner" : "Add Trading Partner"}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="name">Partner Name *</Label>
                <Input id="name" data-testid="input-partner-name" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Acme Corp" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="as2id">AS2 Identifier *</Label>
                <Input id="as2id" data-testid="input-as2-identifier" value={form.as2Identifier} onChange={(e) => setForm((f) => ({ ...f, as2Identifier: e.target.value }))} placeholder="ACMECORP" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="email">Contact Email</Label>
                <Input id="email" data-testid="input-contact-email" type="email" value={form.contactEmail} onChange={(e) => setForm((f) => ({ ...f, contactEmail: e.target.value }))} placeholder="edi@acme.com" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="phone">Contact Phone</Label>
                <Input id="phone" data-testid="input-contact-phone" value={form.contactPhone} onChange={(e) => setForm((f) => ({ ...f, contactPhone: e.target.value }))} placeholder="+1-800-555-0100" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Supported Document Types</Label>
              <div className="flex flex-wrap gap-2">
                {DOC_TYPES.map((ts) => (
                  <button
                    key={ts}
                    type="button"
                    data-testid={`toggle-doctype-${ts}`}
                    onClick={() => toggleDoc(ts)}
                    className={`text-xs font-mono px-3 py-1.5 rounded border transition-colors ${form.supportedDocTypes.includes(ts) ? "bg-primary text-primary-foreground border-primary" : "bg-card text-muted-foreground border-border hover:border-primary/50"}`}
                  >
                    {ts}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(v) => setForm((f) => ({ ...f, status: v }))}>
                <SelectTrigger data-testid="select-status"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} data-testid="button-save-partner" disabled={createPartner.isPending || updatePartner.isPending}>
              {(createPartner.isPending || updatePartner.isPending) ? "Saving..." : "Save Partner"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
