import { Router } from "express";
import { TradingPartner } from "../models/TradingPartner";
import { Notification } from "../models/Notification";

const router = Router();

router.get("/partners", async (req, res) => {
  const partners = await TradingPartner.find().sort({ createdAt: -1 });
  const result = partners.map((p) => ({
    id: p._id.toString(),
    name: p.name,
    as2Identifier: p.as2Identifier,
    contactEmail: p.contactEmail ?? null,
    contactPhone: p.contactPhone ?? null,
    supportedDocTypes: p.supportedDocTypes,
    status: p.status,
    createdAt: p.createdAt?.toISOString() ?? new Date(0).toISOString(),
    updatedAt: p.updatedAt?.toISOString() ?? new Date(0).toISOString(),
  }));
  res.json(result);
});

router.post("/partners", async (req, res) => {
  const { name, as2Identifier, contactEmail, contactPhone, supportedDocTypes, status } = req.body;
  if (!name || !as2Identifier) {
    res.status(400).json({ error: "name and as2Identifier are required" });
    return;
  }
  const partner = await TradingPartner.create({
    name,
    as2Identifier,
    contactEmail,
    contactPhone,
    supportedDocTypes: supportedDocTypes ?? [],
    status: status ?? "active",
  });
  await Notification.create({
    type: "system",
    title: "New Trading Partner",
    message: `Trading partner "${name}" has been added.`,
    partnerId: partner._id,
    severity: "info",
  });
  res.status(201).json({
    id: partner._id.toString(),
    name: partner.name,
    as2Identifier: partner.as2Identifier,
    contactEmail: partner.contactEmail ?? null,
    contactPhone: partner.contactPhone ?? null,
    supportedDocTypes: partner.supportedDocTypes,
    status: partner.status,
    createdAt: partner.createdAt?.toISOString() ?? new Date(0).toISOString(),
    updatedAt: partner.updatedAt?.toISOString() ?? new Date(0).toISOString(),
  });
});

router.get("/partners/:id", async (req, res) => {
  const partner = await TradingPartner.findById(req.params["id"]);
  if (!partner) { res.status(404).json({ error: "Not found" }); return; }
  res.json({
    id: partner._id.toString(),
    name: partner.name,
    as2Identifier: partner.as2Identifier,
    contactEmail: partner.contactEmail ?? null,
    contactPhone: partner.contactPhone ?? null,
    supportedDocTypes: partner.supportedDocTypes,
    status: partner.status,
    createdAt: partner.createdAt?.toISOString() ?? new Date(0).toISOString(),
    updatedAt: partner.updatedAt?.toISOString() ?? new Date(0).toISOString(),
  });
});

router.patch("/partners/:id", async (req, res) => {
  const partner = await TradingPartner.findByIdAndUpdate(req.params["id"], req.body, { new: true });
  if (!partner) { res.status(404).json({ error: "Not found" }); return; }
  res.json({
    id: partner._id.toString(),
    name: partner.name,
    as2Identifier: partner.as2Identifier,
    contactEmail: partner.contactEmail ?? null,
    contactPhone: partner.contactPhone ?? null,
    supportedDocTypes: partner.supportedDocTypes,
    status: partner.status,
    createdAt: partner.createdAt?.toISOString() ?? new Date(0).toISOString(),
    updatedAt: partner.updatedAt?.toISOString() ?? new Date(0).toISOString(),
  });
});

router.delete("/partners/:id", async (req, res) => {
  await TradingPartner.findByIdAndDelete(req.params["id"]);
  res.status(204).send();
});

export default router;
