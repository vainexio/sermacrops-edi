import { Router } from "express";
import { PartnerEndpoint } from "../models/PartnerEndpoint";
import { TradingPartner } from "../models/TradingPartner";

const router = Router();

function serializeEndpoint(ep: InstanceType<typeof PartnerEndpoint> & { partnerName?: string }, partnerName?: string | null) {
  return {
    id: ep._id.toString(),
    partnerId: ep.partnerId.toString(),
    partnerName: partnerName ?? null,
    name: ep.name,
    url: ep.url,
    protocol: ep.protocol,
    direction: ep.direction,
    supportedDocTypes: ep.supportedDocTypes,
    isActive: ep.isActive,
    createdAt: ep.createdAt?.toISOString() ?? new Date(0).toISOString(),
    updatedAt: ep.updatedAt?.toISOString() ?? new Date(0).toISOString(),
  };
}

router.get("/endpoints", async (req, res) => {
  const filter: Record<string, unknown> = {};
  if (req.query["partnerId"]) filter["partnerId"] = req.query["partnerId"];
  const endpoints = await PartnerEndpoint.find(filter).sort({ createdAt: -1 });
  const partnerIds = [...new Set(endpoints.map((e) => e.partnerId.toString()))];
  const partners = await TradingPartner.find({ _id: { $in: partnerIds } });
  const partnerMap = new Map(partners.map((p) => [p._id.toString(), p.name]));
  res.json(endpoints.map((ep) => serializeEndpoint(ep as Parameters<typeof serializeEndpoint>[0], partnerMap.get(ep.partnerId.toString()))));
});

router.post("/endpoints", async (req, res) => {
  const { partnerId, name, url, protocol, direction, supportedDocTypes, isActive } = req.body;
  if (!partnerId || !name || !url || !protocol || !direction) {
    res.status(400).json({ error: "partnerId, name, url, protocol, and direction are required" });
    return;
  }
  const ep = await PartnerEndpoint.create({
    partnerId,
    name,
    url,
    protocol,
    direction,
    supportedDocTypes: supportedDocTypes ?? [],
    isActive: isActive ?? true,
  });
  const partner = await TradingPartner.findById(partnerId);
  res.status(201).json(serializeEndpoint(ep as Parameters<typeof serializeEndpoint>[0], partner?.name));
});

router.get("/endpoints/:id", async (req, res) => {
  const ep = await PartnerEndpoint.findById(req.params["id"]);
  if (!ep) { res.status(404).json({ error: "Not found" }); return; }
  const partner = await TradingPartner.findById(ep.partnerId);
  res.json(serializeEndpoint(ep as Parameters<typeof serializeEndpoint>[0], partner?.name));
});

router.patch("/endpoints/:id", async (req, res) => {
  const ep = await PartnerEndpoint.findByIdAndUpdate(req.params["id"], req.body, { new: true });
  if (!ep) { res.status(404).json({ error: "Not found" }); return; }
  const partner = await TradingPartner.findById(ep.partnerId);
  res.json(serializeEndpoint(ep as Parameters<typeof serializeEndpoint>[0], partner?.name));
});

router.delete("/endpoints/:id", async (req, res) => {
  await PartnerEndpoint.findByIdAndDelete(req.params["id"]);
  res.status(204).send();
});

export default router;
