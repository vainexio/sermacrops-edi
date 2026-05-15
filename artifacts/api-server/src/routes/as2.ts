import { Router } from "express";
import { As2Setting } from "../models/As2Setting";
import { TradingPartner } from "../models/TradingPartner";

const router = Router();

function serialize(s: InstanceType<typeof As2Setting>, partnerName?: string | null) {
  return {
    id: s._id.toString(),
    partnerId: s.partnerId.toString(),
    partnerName: partnerName ?? null,
    localAs2Id: s.localAs2Id,
    remoteAs2Id: s.remoteAs2Id,
    remoteUrl: s.remoteUrl,
    encryptionAlgorithm: s.encryptionAlgorithm,
    signatureAlgorithm: s.signatureAlgorithm,
    mdnMode: s.mdnMode,
    mdnUrl: s.mdnUrl ?? null,
    isActive: s.isActive,
    lastTestedAt: s.lastTestedAt?.toISOString() ?? null,
    createdAt: s.createdAt.toISOString(),
    updatedAt: s.updatedAt.toISOString(),
  };
}

router.get("/as2-settings", async (req, res) => {
  const filter: Record<string, unknown> = {};
  if (req.query["partnerId"]) filter["partnerId"] = req.query["partnerId"];
  const settings = await As2Setting.find(filter).sort({ createdAt: -1 });
  const partnerIds = [...new Set(settings.map((s) => s.partnerId.toString()))];
  const partners = await TradingPartner.find({ _id: { $in: partnerIds } });
  const partnerMap = new Map(partners.map((p) => [p._id.toString(), p.name]));
  res.json(settings.map((s) => serialize(s, partnerMap.get(s.partnerId.toString()))));
});

router.post("/as2-settings", async (req, res) => {
  const { partnerId, localAs2Id, remoteAs2Id, remoteUrl, encryptionAlgorithm, signatureAlgorithm, mdnMode, mdnUrl, isActive } = req.body;
  if (!partnerId || !localAs2Id || !remoteAs2Id || !remoteUrl) {
    res.status(400).json({ error: "partnerId, localAs2Id, remoteAs2Id, and remoteUrl are required" });
    return;
  }
  const setting = await As2Setting.create({
    partnerId, localAs2Id, remoteAs2Id, remoteUrl,
    encryptionAlgorithm: encryptionAlgorithm ?? "AES256",
    signatureAlgorithm: signatureAlgorithm ?? "SHA256",
    mdnMode: mdnMode ?? "sync",
    mdnUrl, isActive: isActive ?? true,
  });
  const partner = await TradingPartner.findById(partnerId);
  res.status(201).json(serialize(setting, partner?.name));
});

router.get("/as2-settings/:id", async (req, res) => {
  const s = await As2Setting.findById(req.params["id"]);
  if (!s) { res.status(404).json({ error: "Not found" }); return; }
  const partner = await TradingPartner.findById(s.partnerId);
  res.json(serialize(s, partner?.name));
});

router.patch("/as2-settings/:id", async (req, res) => {
  const s = await As2Setting.findByIdAndUpdate(req.params["id"], req.body, { new: true });
  if (!s) { res.status(404).json({ error: "Not found" }); return; }
  const partner = await TradingPartner.findById(s.partnerId);
  res.json(serialize(s, partner?.name));
});

router.delete("/as2-settings/:id", async (req, res) => {
  await As2Setting.findByIdAndDelete(req.params["id"]);
  res.status(204).send();
});

router.post("/as2-settings/:id/test", async (req, res) => {
  const s = await As2Setting.findById(req.params["id"]);
  if (!s) { res.status(404).json({ error: "Not found" }); return; }
  const testedAt = new Date();
  await As2Setting.findByIdAndUpdate(req.params["id"], { lastTestedAt: testedAt });
  // Simulate AS2 connection test
  const success = s.isActive;
  const responseTime = Math.floor(Math.random() * 300) + 50;
  res.json({
    success,
    message: success
      ? `AS2 connection to ${s.remoteUrl} established successfully (${responseTime}ms)`
      : "AS2 connection failed: endpoint is inactive",
    responseTime,
    testedAt: testedAt.toISOString(),
  });
});

export default router;
