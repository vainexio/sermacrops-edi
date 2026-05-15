import { useState } from "react";
import { useListAs2Settings, useListPartners, useCreateAs2Setting, useUpdateAs2Setting, useDeleteAs2Setting, useTestAs2Connection, getListAs2SettingsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2, Wifi } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StatusBadge } from "@/components/StatusBadge";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";

type As2Form = { partnerId: string; localAs2Id: string; remoteAs2Id: string; remoteUrl: string; encryptionAlgorithm: string; signatureAlgorithm: string; mdnMode: string; mdnUrl: string; isActive: boolean };
const defaultForm: As2Form = { partnerId: "", localAs2Id: "SERMACROPS", remoteAs2Id: "", remoteUrl: "", encryptionAlgorithm: "AES256", signatureAlgorithm: "SHA256", mdnMode: "sync", mdnUrl: "", isActive: true };

export default function As2Settings() {
  const qc = useQueryClient();
  const { data: settings, isLoading } = useListAs2Settings();
  const { data: partners } = useListPartners();
  const createSetting = useCreateAs2Setting();
  const updateSetting = useUpdateAs2Setting();
  const deleteSetting = useDeleteAs2Setting();
  const testConnection = useTestAs2Connection();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<As2Form>(defaultForm);
  const [testingId, setTestingId] = useState<string | null>(null);

  function openCreate() { setEditId(null); setForm(defaultForm); setOpen(true); }
  function openEdit(s: NonNullable<typeof settings>[number]) {
    setEditId(s.id);
    setForm({ partnerId: s.partnerId, localAs2Id: s.localAs2Id, remoteAs2Id: s.remoteAs2Id, remoteUrl: s.remoteUrl, encryptionAlgorithm: s.encryptionAlgorithm, signatureAlgorithm: s.signatureAlgorithm, mdnMode: s.mdnMode, mdnUrl: s.mdnUrl ?? "", isActive: s.isActive });
    setOpen(true);
  }

  async function handleSave() {
    if (!form.partnerId || !form.localAs2Id || !form.remoteAs2Id || !form.remoteUrl) {
      toast({ title: "Partner, AS2 IDs and URL are required", variant: "destructive" }); return;
    }
    if (editId) {
      await updateSetting.mutateAsync({ id: editId, data: form as Parameters<typeof updateSetting.mutateAsync>[0]["data"] });
      toast({ title: "AS2 settings updated" });
    } else {
      await createSetting.mutateAsync({ data: form as Parameters<typeof createSetting.mutateAsync>[0]["data"] });
      toast({ title: "AS2 settings created" });
    }
    qc.invalidateQueries({ queryKey: getListAs2SettingsQueryKey() });
    setOpen(false);
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete these AS2 settings?")) return;
    await deleteSetting.mutateAsync({ id });
    qc.invalidateQueries({ queryKey: getListAs2SettingsQueryKey() });
    toast({ title: "AS2 settings deleted" });
  }

  async function handleTest(id: string) {
    setTestingId(id);
    const result = await testConnection.mutateAsync({ id });
    setTestingId(null);
    qc.invalidateQueries({ queryKey: getListAs2SettingsQueryKey() });
    toast({ title: result.success ? "Connection test passed" : "Connection test failed", description: result.message, variant: result.success ? "default" : "destructive" });
  }

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">AS2 Communication Settings</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{settings?.length ?? 0} AS2 configuration(s)</p>
        </div>
        <Button onClick={openCreate} data-testid="button-create-as2" size="sm" className="gap-1.5">
          <Plus className="w-4 h-4" /> Add AS2 Config
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
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground text-xs uppercase tracking-wide">Local AS2 ID</th>
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground text-xs uppercase tracking-wide">Remote AS2 ID</th>
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground text-xs uppercase tracking-wide">Encryption</th>
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground text-xs uppercase tracking-wide">MDN Mode</th>
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground text-xs uppercase tracking-wide">Last Tested</th>
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground text-xs uppercase tracking-wide">Status</th>
                <th className="text-right px-4 py-3 font-semibold text-muted-foreground text-xs uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody>
              {(settings ?? []).map((s, i) => (
                <tr key={s.id} data-testid={`row-as2-${s.id}`} className={`border-b border-border last:border-0 hover:bg-muted/30 transition-colors ${i % 2 === 0 ? "" : "bg-muted/10"}`}>
                  <td className="px-4 py-3 font-medium text-foreground">{s.partnerName ?? "—"}</td>
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{s.localAs2Id}</td>
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{s.remoteAs2Id}</td>
                  <td className="px-4 py-3 text-xs font-medium">{s.encryptionAlgorithm} / {s.signatureAlgorithm}</td>
                  <td className="px-4 py-3 text-xs uppercase font-semibold text-muted-foreground">{s.mdnMode}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {s.lastTestedAt ? formatDistanceToNow(new Date(s.lastTestedAt), { addSuffix: true }) : "Never"}
                  </td>
                  <td className="px-4 py-3"><StatusBadge status={s.isActive ? "active" : "inactive"} /></td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="sm" onClick={() => handleTest(s.id)} disabled={testingId === s.id} data-testid={`button-test-as2-${s.id}`} className="h-7 w-7 p-0 text-primary hover:text-primary">
                        <Wifi className="w-3.5 h-3.5" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => openEdit(s)} data-testid={`button-edit-as2-${s.id}`} className="h-7 w-7 p-0"><Pencil className="w-3.5 h-3.5" /></Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(s.id)} data-testid={`button-delete-as2-${s.id}`} className="h-7 w-7 p-0 text-destructive hover:text-destructive"><Trash2 className="w-3.5 h-3.5" /></Button>
                    </div>
                  </td>
                </tr>
              ))}
              {(!settings || settings.length === 0) && <tr><td colSpan={8} className="px-4 py-8 text-center text-sm text-muted-foreground">No AS2 configurations yet</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editId ? "Edit AS2 Settings" : "Add AS2 Configuration"}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Trading Partner *</Label>
              <Select value={form.partnerId} onValueChange={(v) => setForm((f) => ({ ...f, partnerId: v }))}>
                <SelectTrigger data-testid="select-as2-partner"><SelectValue placeholder="Select partner" /></SelectTrigger>
                <SelectContent>{(partners ?? []).map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Local AS2 ID *</Label>
                <Input data-testid="input-local-as2-id" value={form.localAs2Id} onChange={(e) => setForm((f) => ({ ...f, localAs2Id: e.target.value }))} placeholder="SERMACROPS" />
              </div>
              <div className="space-y-1.5">
                <Label>Remote AS2 ID *</Label>
                <Input data-testid="input-remote-as2-id" value={form.remoteAs2Id} onChange={(e) => setForm((f) => ({ ...f, remoteAs2Id: e.target.value }))} placeholder="PARTNER" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Remote URL *</Label>
              <Input data-testid="input-remote-url" value={form.remoteUrl} onChange={(e) => setForm((f) => ({ ...f, remoteUrl: e.target.value }))} placeholder="https://as2.partner.com/receive" />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label>Encryption</Label>
                <Select value={form.encryptionAlgorithm} onValueChange={(v) => setForm((f) => ({ ...f, encryptionAlgorithm: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{["AES128", "AES256", "3DES", "NONE"].map((a) => <SelectItem key={a} value={a}>{a}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Signature</Label>
                <Select value={form.signatureAlgorithm} onValueChange={(v) => setForm((f) => ({ ...f, signatureAlgorithm: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{["SHA1", "SHA256", "SHA384", "SHA512", "NONE"].map((a) => <SelectItem key={a} value={a}>{a}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>MDN Mode</Label>
                <Select value={form.mdnMode} onValueChange={(v) => setForm((f) => ({ ...f, mdnMode: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{["sync", "async", "none"].map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>MDN URL</Label>
              <Input data-testid="input-mdn-url" value={form.mdnUrl} onChange={(e) => setForm((f) => ({ ...f, mdnUrl: e.target.value }))} placeholder="https://as2.sermacrops.com/mdn" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} data-testid="button-save-as2" disabled={createSetting.isPending || updateSetting.isPending}>
              {(createSetting.isPending || updateSetting.isPending) ? "Saving..." : "Save Settings"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
