import { Router } from "express";
import mongoose from "mongoose";
import { EdiDocument } from "../models/EdiDocument";
import { DocumentStatusHistory } from "../models/DocumentStatusHistory";
import { ValidationResult } from "../models/ValidationResult";
import { TranslationLog } from "../models/TranslationLog";
import { TransmissionLog } from "../models/TransmissionLog";
import { Notification } from "../models/Notification";
import { TradingPartner } from "../models/TradingPartner";
import { PartnerEndpoint } from "../models/PartnerEndpoint";

const router = Router();

const PROCUREMENT_FLOW = ["850", "855", "856", "810"];
const LOGISTICS_FLOW = ["204", "990"];

function controlNumber() {
  return String(Math.floor(Math.random() * 900000000) + 100000000);
}

function serializeDoc(doc: InstanceType<typeof EdiDocument>, partnerName?: string | null) {
  return {
    id: doc._id.toString(),
    partnerId: doc.partnerId.toString(),
    partnerName: partnerName ?? null,
    endpointId: doc.endpointId?.toString() ?? null,
    transactionSet: doc.transactionSet,
    controlNumber: doc.controlNumber,
    status: doc.status,
    direction: doc.direction,
    rawContent: doc.rawContent ?? null,
    parsedContent: doc.parsedContent ?? null,
    validationStatus: doc.validationStatus,
    isAcknowledged: doc.isAcknowledged,
    sentAt: doc.sentAt?.toISOString() ?? null,
    receivedAt: doc.receivedAt?.toISOString() ?? null,
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
  };
}

function parseEdi(raw: string, transactionSet: string) {
  const segments = raw.split(/[~\n]/).filter((s) => s.trim());
  const parsed: Record<string, unknown> = {
    transactionSet,
    segments: segments.map((s) => {
      const parts = s.split("*");
      return { id: parts[0], elements: parts.slice(1) };
    }),
    segmentCount: segments.length,
  };
  return parsed;
}

function generateEdi(transactionSet: string, partnerId: string) {
  const ctrl = controlNumber();
  const today = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  return [
    `ISA*00*          *00*          *ZZ*SERMACROPS     *ZZ*${partnerId.slice(0, 15).padEnd(15)}*${today}*1200*^*00501*${ctrl}*0*P*>`,
    `GS*${transactionSet === "850" ? "PO" : transactionSet === "810" ? "IN" : "SH"}*SERMACROPS*PARTNER*${today}*1200*${ctrl}*X*005010`,
    `ST*${transactionSet}*0001`,
    `BEG*00*SA*PO${ctrl}**${today}`,
    `N1*BY*SERMACROPS MANUFACTURING*92*SERMACROPS`,
    `N1*SE*TRADING PARTNER*92*PARTNER001`,
    `PO1*1*100*EA*25.00**VP*ITEM-001`,
    `CTT*1`,
    `AMT*TT*2500.00`,
    `SE*9*0001`,
    `GE*1*${ctrl}`,
    `IEA*1*${ctrl}`,
  ].join("~\n");
}

// GET /documents
router.get("/documents", async (req, res) => {
  const filter: Record<string, unknown> = {};
  if (req.query["partnerId"]) filter["partnerId"] = req.query["partnerId"];
  if (req.query["status"]) filter["status"] = req.query["status"];
  if (req.query["transactionSet"]) filter["transactionSet"] = req.query["transactionSet"];
  if (req.query["direction"]) filter["direction"] = req.query["direction"];

  const docs = await EdiDocument.find(filter).sort({ createdAt: -1 });
  const partnerIds = [...new Set(docs.map((d) => d.partnerId.toString()))];
  const partners = await TradingPartner.find({ _id: { $in: partnerIds } });
  const partnerMap = new Map(partners.map((p) => [p._id.toString(), p.name]));
  res.json(docs.map((d) => serializeDoc(d, partnerMap.get(d.partnerId.toString()))));
});

// POST /documents
router.post("/documents", async (req, res) => {
  const { partnerId, endpointId, transactionSet, direction, rawContent } = req.body;
  if (!partnerId || !transactionSet || !direction) {
    res.status(400).json({ error: "partnerId, transactionSet, and direction are required" });
    return;
  }
  const raw = rawContent || generateEdi(transactionSet, partnerId);
  const doc = await EdiDocument.create({
    partnerId,
    endpointId: endpointId || undefined,
    transactionSet,
    controlNumber: controlNumber(),
    status: "Draft",
    direction,
    rawContent: raw,
    parsedContent: parseEdi(raw, transactionSet),
    validationStatus: "pending",
    isAcknowledged: false,
  });
  await DocumentStatusHistory.create({ documentId: doc._id, status: "Draft", message: "Document created" });
  await Notification.create({
    type: "status_change",
    title: `EDI ${transactionSet} Created`,
    message: `New ${direction} EDI ${transactionSet} document created (${doc.controlNumber})`,
    documentId: doc._id,
    partnerId: new mongoose.Types.ObjectId(partnerId),
    severity: "info",
  });
  const partner = await TradingPartner.findById(partnerId);
  res.status(201).json(serializeDoc(doc, partner?.name));
});

// GET /documents/receive (must be before /:id)
router.post("/documents/receive", async (req, res) => {
  const { partnerId, endpointId, transactionSet, rawContent } = req.body;
  if (!partnerId || !transactionSet || !rawContent) {
    res.status(400).json({ error: "partnerId, transactionSet, and rawContent are required" });
    return;
  }
  const doc = await EdiDocument.create({
    partnerId,
    endpointId: endpointId || undefined,
    transactionSet,
    controlNumber: controlNumber(),
    status: "Received",
    direction: "inbound",
    rawContent,
    parsedContent: parseEdi(rawContent, transactionSet),
    validationStatus: "pending",
    isAcknowledged: false,
    receivedAt: new Date(),
  });
  await DocumentStatusHistory.create({ documentId: doc._id, status: "Received", message: "Document received via AS2" });
  await Notification.create({
    type: "status_change",
    title: `EDI ${transactionSet} Received`,
    message: `Inbound EDI ${transactionSet} received from partner (${doc.controlNumber})`,
    documentId: doc._id,
    partnerId: new mongoose.Types.ObjectId(partnerId),
    severity: "success",
  });
  const partner = await TradingPartner.findById(partnerId);
  res.status(201).json(serializeDoc(doc, partner?.name));
});

// GET /documents/:id
router.get("/documents/:id", async (req, res) => {
  const doc = await EdiDocument.findById(req.params["id"]);
  if (!doc) { res.status(404).json({ error: "Not found" }); return; }
  const partner = await TradingPartner.findById(doc.partnerId);
  const [statusHistory, validationResults, translationLogs, transmissionLogs] = await Promise.all([
    DocumentStatusHistory.find({ documentId: doc._id }).sort({ createdAt: 1 }),
    ValidationResult.find({ documentId: doc._id }).sort({ validatedAt: -1 }),
    TranslationLog.find({ documentId: doc._id }).sort({ translatedAt: -1 }),
    TransmissionLog.find({ documentId: doc._id }).sort({ transmittedAt: -1 }),
  ]);
  res.json({
    ...serializeDoc(doc, partner?.name),
    statusHistory: statusHistory.map((h) => ({
      id: h._id.toString(),
      documentId: h.documentId.toString(),
      status: h.status,
      message: h.message ?? null,
      createdAt: h.createdAt.toISOString(),
    })),
    validationResults: validationResults.map((v) => ({
      id: v._id.toString(),
      documentId: v.documentId.toString(),
      isValid: v.isValid,
      errors: v.errors,
      warnings: v.warnings,
      validatedAt: v.validatedAt.toISOString(),
    })),
    translationLogs: translationLogs.map((t) => ({
      id: t._id.toString(),
      documentId: t.documentId.toString(),
      direction: t.direction,
      status: t.status,
      inputFormat: t.inputFormat,
      outputFormat: t.outputFormat,
      parsedSegments: t.parsedSegments,
      errorMessage: t.errorMessage ?? null,
      translatedAt: t.translatedAt.toISOString(),
    })),
    transmissionLogs: transmissionLogs.map((tx) => ({
      id: tx._id.toString(),
      documentId: tx.documentId.toString(),
      partnerId: tx.partnerId.toString(),
      endpointUrl: tx.endpointUrl,
      protocol: tx.protocol,
      status: tx.status,
      httpStatusCode: tx.httpStatusCode ?? null,
      responseMessage: tx.responseMessage ?? null,
      as2MessageId: tx.as2MessageId ?? null,
      transmittedAt: tx.transmittedAt.toISOString(),
    })),
  });
});

// PATCH /documents/:id
router.patch("/documents/:id", async (req, res) => {
  const doc = await EdiDocument.findByIdAndUpdate(req.params["id"], req.body, { new: true });
  if (!doc) { res.status(404).json({ error: "Not found" }); return; }
  const partner = await TradingPartner.findById(doc.partnerId);
  res.json(serializeDoc(doc, partner?.name));
});

// DELETE /documents/:id
router.delete("/documents/:id", async (req, res) => {
  await EdiDocument.findByIdAndDelete(req.params["id"]);
  res.status(204).send();
});

// POST /documents/:id/validate
router.post("/documents/:id/validate", async (req, res) => {
  const doc = await EdiDocument.findById(req.params["id"]);
  if (!doc) { res.status(404).json({ error: "Not found" }); return; }

  const errors: { segment: string; field?: string; code: string; message: string }[] = [];
  const warnings: string[] = [];
  const raw = doc.rawContent || "";

  if (!raw.includes("ISA")) errors.push({ segment: "ISA", code: "001", message: "Missing ISA envelope segment" });
  if (!raw.includes("GS")) errors.push({ segment: "GS", code: "002", message: "Missing GS functional group segment" });
  if (!raw.includes(`ST*${doc.transactionSet}`)) errors.push({ segment: "ST", code: "003", message: `Missing ST segment for transaction set ${doc.transactionSet}` });
  if (!raw.includes("SE")) warnings.push("SE segment not found — document may be incomplete");
  if (!raw.includes("IEA")) errors.push({ segment: "IEA", code: "004", message: "Missing IEA envelope terminator" });

  const isValid = errors.length === 0;
  const result = await ValidationResult.create({
    documentId: doc._id,
    isValid,
    errors,
    warnings,
    validatedAt: new Date(),
  });

  const newStatus = isValid ? "Validated" : "Failed";
  await EdiDocument.findByIdAndUpdate(doc._id, {
    status: newStatus,
    validationStatus: isValid ? "passed" : "failed",
  });
  await DocumentStatusHistory.create({
    documentId: doc._id,
    status: newStatus,
    message: isValid ? "Validation passed" : `Validation failed: ${errors.length} error(s)`,
  });
  if (!isValid) {
    await Notification.create({
      type: "validation_error",
      title: `EDI ${doc.transactionSet} Validation Failed`,
      message: `${errors.length} validation error(s): ${errors[0]?.message}`,
      documentId: doc._id,
      partnerId: doc.partnerId,
      severity: "error",
    });
  }

  res.json({
    id: result._id.toString(),
    documentId: result.documentId.toString(),
    isValid: result.isValid,
    errors: result.errors,
    warnings: result.warnings,
    validatedAt: result.validatedAt.toISOString(),
  });
});

// POST /documents/:id/translate
router.post("/documents/:id/translate", async (req, res) => {
  const doc = await EdiDocument.findById(req.params["id"]);
  if (!doc) { res.status(404).json({ error: "Not found" }); return; }

  const raw = doc.rawContent || "";
  const parsed = parseEdi(raw, doc.transactionSet);
  const segCount = Array.isArray((parsed as Record<string, unknown[]>)["segments"])
    ? ((parsed as Record<string, unknown[]>)["segments"]).length
    : 0;

  await EdiDocument.findByIdAndUpdate(doc._id, { parsedContent: parsed });
  const log = await TranslationLog.create({
    documentId: doc._id,
    direction: "edi_to_json",
    status: "success",
    inputFormat: "ANSI X12",
    outputFormat: "JSON",
    parsedSegments: segCount,
    translatedAt: new Date(),
  });

  res.json({
    id: log._id.toString(),
    documentId: log.documentId.toString(),
    direction: log.direction,
    status: log.status,
    inputFormat: log.inputFormat,
    outputFormat: log.outputFormat,
    parsedSegments: log.parsedSegments,
    errorMessage: log.errorMessage ?? null,
    translatedAt: log.translatedAt.toISOString(),
  });
});

async function doSend(docId: mongoose.Types.ObjectId) {
  const doc = await EdiDocument.findById(docId);
  if (!doc) throw new Error("Document not found");

  const endpoint = doc.endpointId
    ? await PartnerEndpoint.findById(doc.endpointId)
    : await PartnerEndpoint.findOne({ partnerId: doc.partnerId, direction: { $in: ["outbound", "both"] } });

  const endpointUrl = endpoint?.url || "https://as2.partner.example.com/receive";
  const protocol = endpoint?.protocol || "AS2";

  // Simulate send
  const success = Math.random() > 0.15;
  const as2MessageId = `<${Date.now()}@sermacrops.com>`;

  const txLog = await TransmissionLog.create({
    documentId: docId,
    partnerId: doc.partnerId,
    endpointUrl,
    protocol,
    status: success ? "success" : "failed",
    httpStatusCode: success ? 200 : 500,
    responseMessage: success ? "MDN received — message accepted" : "Connection timeout",
    as2MessageId: success ? as2MessageId : undefined,
    transmittedAt: new Date(),
  });

  const newStatus = success ? "Sent" : "Failed";
  await EdiDocument.findByIdAndUpdate(docId, {
    status: newStatus,
    sentAt: success ? new Date() : undefined,
  });
  await DocumentStatusHistory.create({
    documentId: docId,
    status: newStatus,
    message: success ? `Sent via ${protocol} — MDN acknowledged` : "Transmission failed",
  });

  if (!success) {
    await Notification.create({
      type: "transmission_failure",
      title: `EDI ${doc.transactionSet} Send Failed`,
      message: `Failed to transmit to ${endpointUrl}: Connection timeout`,
      documentId: docId,
      partnerId: doc.partnerId,
      severity: "error",
    });
  } else {
    await Notification.create({
      type: "status_change",
      title: `EDI ${doc.transactionSet} Sent`,
      message: `Document transmitted successfully via ${protocol}`,
      documentId: docId,
      partnerId: doc.partnerId,
      severity: "success",
    });
  }

  return {
    id: txLog._id.toString(),
    documentId: txLog.documentId.toString(),
    partnerId: txLog.partnerId.toString(),
    endpointUrl: txLog.endpointUrl,
    protocol: txLog.protocol,
    status: txLog.status,
    httpStatusCode: txLog.httpStatusCode ?? null,
    responseMessage: txLog.responseMessage ?? null,
    as2MessageId: txLog.as2MessageId ?? null,
    transmittedAt: txLog.transmittedAt.toISOString(),
  };
}

// POST /documents/:id/send
router.post("/documents/:id/send", async (req, res) => {
  const doc = await EdiDocument.findById(req.params["id"]);
  if (!doc) { res.status(404).json({ error: "Not found" }); return; }
  const result = await doSend(doc._id as mongoose.Types.ObjectId);
  res.json(result);
});

// POST /documents/:id/resend
router.post("/documents/:id/resend", async (req, res) => {
  const doc = await EdiDocument.findById(req.params["id"]);
  if (!doc) { res.status(404).json({ error: "Not found" }); return; }
  const result = await doSend(doc._id as mongoose.Types.ObjectId);
  res.json(result);
});

// GET /documents/:id/history
router.get("/documents/:id/history", async (req, res) => {
  const history = await DocumentStatusHistory.find({ documentId: req.params["id"] }).sort({ createdAt: 1 });
  res.json(history.map((h) => ({
    id: h._id.toString(),
    documentId: h.documentId.toString(),
    status: h.status,
    message: h.message ?? null,
    createdAt: h.createdAt.toISOString(),
  })));
});

// GET /documents/:id/progress
router.get("/documents/:id/progress", async (req, res) => {
  const doc = await EdiDocument.findById(req.params["id"]);
  if (!doc) { res.status(404).json({ error: "Not found" }); return; }

  const isProcurement = PROCUREMENT_FLOW.includes(doc.transactionSet);
  const flow = isProcurement ? PROCUREMENT_FLOW : LOGISTICS_FLOW;
  const flowType = isProcurement ? "procurement" : "logistics";

  const labels: Record<string, string> = {
    "850": "Purchase Order",
    "855": "PO Acknowledgment",
    "856": "Ship Notice (ASN)",
    "810": "Invoice",
    "204": "Motor Carrier Load",
    "990": "Response to 204",
  };

  const currentIdx = flow.indexOf(doc.transactionSet);

  const steps = flow.map((ts, idx) => {
    let status: "completed" | "current" | "pending" | "failed" = "pending";
    if (idx < currentIdx) status = "completed";
    else if (idx === currentIdx) {
      status = doc.status === "Failed" ? "failed" : doc.status === "Acknowledged" ? "completed" : "current";
    }
    return {
      stepNumber: idx + 1,
      transactionSet: ts,
      label: labels[ts] ?? ts,
      status,
      documentId: idx === currentIdx ? doc._id.toString() : null,
      completedAt: status === "completed" && idx === currentIdx ? doc.updatedAt.toISOString() : null,
    };
  });

  const currentStep = currentIdx + 1;

  res.json({
    documentId: doc._id.toString(),
    transactionSet: doc.transactionSet,
    flowType,
    steps,
    currentStep,
    totalSteps: flow.length,
  });
});

// GET /validation-results
router.get("/validation-results", async (req, res) => {
  const filter: Record<string, unknown> = {};
  if (req.query["documentId"]) filter["documentId"] = req.query["documentId"];
  const results = await ValidationResult.find(filter).sort({ validatedAt: -1 });
  res.json(results.map((v) => ({
    id: v._id.toString(),
    documentId: v.documentId.toString(),
    isValid: v.isValid,
    errors: v.errors,
    warnings: v.warnings,
    validatedAt: v.validatedAt.toISOString(),
  })));
});

// GET /translation-logs
router.get("/translation-logs", async (req, res) => {
  const filter: Record<string, unknown> = {};
  if (req.query["documentId"]) filter["documentId"] = req.query["documentId"];
  const logs = await TranslationLog.find(filter).sort({ translatedAt: -1 });
  res.json(logs.map((t) => ({
    id: t._id.toString(),
    documentId: t.documentId.toString(),
    direction: t.direction,
    status: t.status,
    inputFormat: t.inputFormat,
    outputFormat: t.outputFormat,
    parsedSegments: t.parsedSegments,
    errorMessage: t.errorMessage ?? null,
    translatedAt: t.translatedAt.toISOString(),
  })));
});

// GET /transmission-logs
router.get("/transmission-logs", async (req, res) => {
  const filter: Record<string, unknown> = {};
  if (req.query["documentId"]) filter["documentId"] = req.query["documentId"];
  const logs = await TransmissionLog.find(filter).sort({ transmittedAt: -1 });
  res.json(logs.map((tx) => ({
    id: tx._id.toString(),
    documentId: tx.documentId.toString(),
    partnerId: tx.partnerId.toString(),
    endpointUrl: tx.endpointUrl,
    protocol: tx.protocol,
    status: tx.status,
    httpStatusCode: tx.httpStatusCode ?? null,
    responseMessage: tx.responseMessage ?? null,
    as2MessageId: tx.as2MessageId ?? null,
    transmittedAt: tx.transmittedAt.toISOString(),
  })));
});

export default router;
