import { Router } from "express";
import { EdiDocument } from "../models/EdiDocument";
import { TradingPartner } from "../models/TradingPartner";
import { PartnerEndpoint } from "../models/PartnerEndpoint";
import { Notification } from "../models/Notification";
import { DocumentStatusHistory } from "../models/DocumentStatusHistory";

const router = Router();

router.get("/dashboard/summary", async (req, res) => {
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const [
    totalDocuments,
    totalPartners,
    totalEndpoints,
    unreadNotifications,
    docsByStatus,
    docsByTxSet,
    recentFailures,
    sentToday,
    receivedToday,
  ] = await Promise.all([
    EdiDocument.countDocuments(),
    TradingPartner.countDocuments(),
    PartnerEndpoint.countDocuments(),
    Notification.countDocuments({ isRead: false }),
    EdiDocument.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
    EdiDocument.aggregate([{ $group: { _id: "$transactionSet", count: { $sum: 1 } } }]),
    EdiDocument.countDocuments({ status: "Failed", updatedAt: { $gte: startOfDay } }),
    EdiDocument.countDocuments({ status: "Sent", sentAt: { $gte: startOfDay } }),
    EdiDocument.countDocuments({ status: "Received", receivedAt: { $gte: startOfDay } }),
  ]);

  const documentsByStatus: Record<string, number> = {};
  for (const item of docsByStatus) {
    documentsByStatus[item._id as string] = item.count as number;
  }

  const documentsByTransactionSet: Record<string, number> = {};
  for (const item of docsByTxSet) {
    documentsByTransactionSet[item._id as string] = item.count as number;
  }

  res.json({
    totalDocuments,
    totalPartners,
    totalEndpoints,
    unreadNotifications,
    documentsByStatus,
    documentsByTransactionSet,
    recentFailures,
    sentToday,
    receivedToday,
  });
});

router.get("/dashboard/activity", async (req, res) => {
  const limit = Math.min(Number(req.query["limit"]) || 20, 50);
  const recent = await DocumentStatusHistory.find()
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate("documentId");

  const items = recent.map((h) => ({
    id: h._id.toString(),
    type: "status_change",
    message: h.message || `Status changed to ${h.status}`,
    documentId: h.documentId?.toString() ?? null,
    partnerId: null,
    status: h.status,
    createdAt: h.createdAt?.toISOString() ?? new Date(0).toISOString(),
  }));

  res.json(items);
});

export default router;
