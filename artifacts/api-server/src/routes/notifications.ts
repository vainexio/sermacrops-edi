import { Router } from "express";
import { Notification } from "../models/Notification";

const router = Router();

function serialize(n: InstanceType<typeof Notification>) {
  return {
    id: n._id.toString(),
    type: n.type,
    title: n.title,
    message: n.message,
    documentId: n.documentId?.toString() ?? null,
    partnerId: n.partnerId?.toString() ?? null,
    isRead: n.isRead,
    severity: n.severity,
    createdAt: n.createdAt?.toISOString() ?? new Date(0).toISOString(),
  };
}

router.get("/notifications", async (req, res) => {
  const filter: Record<string, unknown> = {};
  if (req.query["unreadOnly"] === "true") filter["isRead"] = false;
  const notifications = await Notification.find(filter).sort({ createdAt: -1 }).limit(100);
  res.json(notifications.map(serialize));
});

router.patch("/notifications/:id/read", async (req, res) => {
  const n = await Notification.findByIdAndUpdate(req.params["id"], { isRead: true }, { new: true });
  if (!n) { res.status(404).json({ error: "Not found" }); return; }
  res.json(serialize(n));
});

router.patch("/notifications/read-all", async (req, res) => {
  await Notification.updateMany({ isRead: false }, { isRead: true });
  res.json({ success: true, message: "All notifications marked as read" });
});

export default router;
