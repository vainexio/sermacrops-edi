import { logger } from "./lib/logger";
import { TradingPartner } from "./models/TradingPartner";
import { PartnerEndpoint } from "./models/PartnerEndpoint";
import { EdiDocument } from "./models/EdiDocument";
import { DocumentStatusHistory } from "./models/DocumentStatusHistory";
import { ValidationResult } from "./models/ValidationResult";
import { TranslationLog } from "./models/TranslationLog";
import { TransmissionLog } from "./models/TransmissionLog";
import { Notification } from "./models/Notification";
import { As2Setting } from "./models/As2Setting";

export async function seed() {
  const existing = await TradingPartner.countDocuments();
  if (existing > 0) {
    logger.info("Seed data already present, skipping");
    return;
  }

  logger.info("Seeding sample data...");

  // Trading Partners
  const [partner1, partner2, partner3] = await TradingPartner.insertMany([
    {
      name: "GlobalTrade Corp",
      as2Identifier: "GLOBALTRADE",
      contactEmail: "edi@globaltrade.com",
      contactPhone: "+1-800-555-0101",
      supportedDocTypes: ["850", "855", "856", "810"],
      status: "active",
    },
    {
      name: "FastFreight Logistics",
      as2Identifier: "FASTFREIGHT",
      contactEmail: "edi@fastfreight.net",
      contactPhone: "+1-800-555-0202",
      supportedDocTypes: ["204", "990"],
      status: "active",
    },
    {
      name: "MegaSupply Inc",
      as2Identifier: "MEGASUPPLY",
      contactEmail: "edi@megasupply.com",
      contactPhone: "+1-800-555-0303",
      supportedDocTypes: ["850", "855", "856", "810", "204", "990"],
      status: "active",
    },
  ]);

  // Partner Endpoints
  const [ep1, ep2, ep3] = await PartnerEndpoint.insertMany([
    {
      partnerId: partner1._id,
      name: "GlobalTrade AS2 Production",
      url: "https://as2.globaltrade.com/receive",
      protocol: "AS2",
      direction: "both",
      supportedDocTypes: ["850", "855", "856", "810"],
      isActive: true,
    },
    {
      partnerId: partner2._id,
      name: "FastFreight AS2 Gateway",
      url: "https://as2.fastfreight.net/edi",
      protocol: "AS2",
      direction: "outbound",
      supportedDocTypes: ["204", "990"],
      isActive: true,
    },
    {
      partnerId: partner3._id,
      name: "MegaSupply SFTP Drop",
      url: "sftp://edi.megasupply.com/inbound",
      protocol: "SFTP",
      direction: "inbound",
      supportedDocTypes: ["850", "855"],
      isActive: true,
    },
  ]);

  // AS2 Settings
  await As2Setting.insertMany([
    {
      partnerId: partner1._id,
      localAs2Id: "SERMACROPS",
      remoteAs2Id: "GLOBALTRADE",
      remoteUrl: "https://as2.globaltrade.com/receive",
      encryptionAlgorithm: "AES256",
      signatureAlgorithm: "SHA256",
      mdnMode: "sync",
      mdnUrl: "https://as2.sermacrops.com/mdn",
      isActive: true,
      lastTestedAt: new Date(Date.now() - 1000 * 60 * 60 * 2),
    },
    {
      partnerId: partner2._id,
      localAs2Id: "SERMACROPS",
      remoteAs2Id: "FASTFREIGHT",
      remoteUrl: "https://as2.fastfreight.net/edi",
      encryptionAlgorithm: "AES128",
      signatureAlgorithm: "SHA256",
      mdnMode: "async",
      mdnUrl: "https://as2.sermacrops.com/mdn",
      isActive: true,
      lastTestedAt: new Date(Date.now() - 1000 * 60 * 30),
    },
    {
      partnerId: partner3._id,
      localAs2Id: "SERMACROPS",
      remoteAs2Id: "MEGASUPPLY",
      remoteUrl: "https://as2.megasupply.com/receive",
      encryptionAlgorithm: "AES256",
      signatureAlgorithm: "SHA512",
      mdnMode: "sync",
      isActive: false,
    },
  ]);

  // Helper to build raw EDI
  function ediContent(ts: string, ctrl: string) {
    const today = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    return [
      `ISA*00*          *00*          *ZZ*SERMACROPS     *ZZ*PARTNER        *${today}*1200*^*00501*${ctrl}*0*P*>`,
      `GS*PO*SERMACROPS*PARTNER*${today}*1200*${ctrl}*X*005010`,
      `ST*${ts}*0001`,
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

  // EDI Documents
  const now = new Date();
  const hoursAgo = (h: number) => new Date(now.getTime() - h * 3600 * 1000);

  const [doc1, doc2, doc3, doc4, doc5] = await EdiDocument.insertMany([
    {
      partnerId: partner1._id,
      endpointId: ep1._id,
      transactionSet: "850",
      controlNumber: "100000001",
      status: "Acknowledged",
      direction: "outbound",
      rawContent: ediContent("850", "100000001"),
      parsedContent: { transactionSet: "850", segmentCount: 12, segments: [] },
      validationStatus: "passed",
      isAcknowledged: true,
      sentAt: hoursAgo(5),
      createdAt: hoursAgo(6),
      updatedAt: hoursAgo(4),
    },
    {
      partnerId: partner1._id,
      endpointId: ep1._id,
      transactionSet: "855",
      controlNumber: "100000002",
      status: "Received",
      direction: "inbound",
      rawContent: ediContent("855", "100000002"),
      parsedContent: { transactionSet: "855", segmentCount: 10, segments: [] },
      validationStatus: "passed",
      isAcknowledged: false,
      receivedAt: hoursAgo(3),
      createdAt: hoursAgo(3),
      updatedAt: hoursAgo(3),
    },
    {
      partnerId: partner2._id,
      endpointId: ep2._id,
      transactionSet: "204",
      controlNumber: "200000001",
      status: "Sent",
      direction: "outbound",
      rawContent: ediContent("204", "200000001"),
      parsedContent: { transactionSet: "204", segmentCount: 14, segments: [] },
      validationStatus: "passed",
      isAcknowledged: false,
      sentAt: hoursAgo(1),
      createdAt: hoursAgo(2),
      updatedAt: hoursAgo(1),
    },
    {
      partnerId: partner3._id,
      transactionSet: "810",
      controlNumber: "300000001",
      status: "Failed",
      direction: "outbound",
      rawContent: "ISA*MALFORMED",
      validationStatus: "failed",
      isAcknowledged: false,
      createdAt: hoursAgo(8),
      updatedAt: hoursAgo(7),
    },
    {
      partnerId: partner1._id,
      endpointId: ep1._id,
      transactionSet: "856",
      controlNumber: "100000003",
      status: "Draft",
      direction: "outbound",
      rawContent: ediContent("856", "100000003"),
      validationStatus: "pending",
      isAcknowledged: false,
      createdAt: hoursAgo(0.5),
      updatedAt: hoursAgo(0.5),
    },
  ]);

  // Status history
  await DocumentStatusHistory.insertMany([
    { documentId: doc1._id, status: "Draft", message: "Document created", createdAt: hoursAgo(6) },
    { documentId: doc1._id, status: "Validated", message: "Validation passed", createdAt: hoursAgo(5.5) },
    { documentId: doc1._id, status: "Sent", message: "Sent via AS2 — MDN acknowledged", createdAt: hoursAgo(5) },
    { documentId: doc1._id, status: "Acknowledged", message: "Partner acknowledged receipt", createdAt: hoursAgo(4) },
    { documentId: doc2._id, status: "Received", message: "Document received via AS2", createdAt: hoursAgo(3) },
    { documentId: doc3._id, status: "Draft", message: "Document created", createdAt: hoursAgo(2) },
    { documentId: doc3._id, status: "Validated", message: "Validation passed", createdAt: hoursAgo(1.5) },
    { documentId: doc3._id, status: "Sent", message: "Sent via AS2 — MDN acknowledged", createdAt: hoursAgo(1) },
    { documentId: doc4._id, status: "Draft", message: "Document created", createdAt: hoursAgo(8) },
    { documentId: doc4._id, status: "Failed", message: "Validation failed: 2 error(s)", createdAt: hoursAgo(7) },
    { documentId: doc5._id, status: "Draft", message: "Document created", createdAt: hoursAgo(0.5) },
  ]);

  // Validation results
  await ValidationResult.insertMany([
    {
      documentId: doc1._id,
      isValid: true,
      errors: [],
      warnings: [],
      validatedAt: hoursAgo(5.5),
    },
    {
      documentId: doc2._id,
      isValid: true,
      errors: [],
      warnings: ["SE segment element count mismatch"],
      validatedAt: hoursAgo(3),
    },
    {
      documentId: doc3._id,
      isValid: true,
      errors: [],
      warnings: [],
      validatedAt: hoursAgo(1.5),
    },
    {
      documentId: doc4._id,
      isValid: false,
      errors: [
        { segment: "ISA", code: "001", message: "Malformed ISA envelope segment" },
        { segment: "GS", code: "002", message: "Missing GS functional group segment" },
      ],
      warnings: [],
      validatedAt: hoursAgo(7),
    },
  ]);

  // Translation logs
  await TranslationLog.insertMany([
    {
      documentId: doc1._id,
      direction: "edi_to_json",
      status: "success",
      inputFormat: "ANSI X12",
      outputFormat: "JSON",
      parsedSegments: 12,
      translatedAt: hoursAgo(5.8),
    },
    {
      documentId: doc2._id,
      direction: "edi_to_json",
      status: "success",
      inputFormat: "ANSI X12",
      outputFormat: "JSON",
      parsedSegments: 10,
      translatedAt: hoursAgo(2.9),
    },
    {
      documentId: doc4._id,
      direction: "edi_to_json",
      status: "failed",
      inputFormat: "ANSI X12",
      outputFormat: "JSON",
      parsedSegments: 1,
      errorMessage: "Malformed ISA envelope — cannot parse",
      translatedAt: hoursAgo(7.5),
    },
  ]);

  // Transmission logs
  await TransmissionLog.insertMany([
    {
      documentId: doc1._id,
      partnerId: partner1._id,
      endpointUrl: ep1.url,
      protocol: "AS2",
      status: "success",
      httpStatusCode: 200,
      responseMessage: "MDN received — message accepted",
      as2MessageId: `<${hoursAgo(5).getTime()}@sermacrops.com>`,
      transmittedAt: hoursAgo(5),
    },
    {
      documentId: doc3._id,
      partnerId: partner2._id,
      endpointUrl: ep2.url,
      protocol: "AS2",
      status: "success",
      httpStatusCode: 200,
      responseMessage: "MDN received — message accepted",
      as2MessageId: `<${hoursAgo(1).getTime()}@sermacrops.com>`,
      transmittedAt: hoursAgo(1),
    },
    {
      documentId: doc4._id,
      partnerId: partner3._id,
      endpointUrl: "https://as2.megasupply.com/receive",
      protocol: "AS2",
      status: "failed",
      httpStatusCode: 500,
      responseMessage: "Internal server error — message rejected",
      transmittedAt: hoursAgo(7.2),
    },
  ]);

  // Notifications
  await Notification.insertMany([
    {
      type: "acknowledgment",
      title: "EDI 850 Acknowledged",
      message: "GlobalTrade Corp acknowledged receipt of PO 100000001",
      documentId: doc1._id,
      partnerId: partner1._id,
      isRead: true,
      severity: "success",
      createdAt: hoursAgo(4),
    },
    {
      type: "status_change",
      title: "EDI 855 Received",
      message: "Inbound PO Acknowledgment received from GlobalTrade Corp",
      documentId: doc2._id,
      partnerId: partner1._id,
      isRead: false,
      severity: "info",
      createdAt: hoursAgo(3),
    },
    {
      type: "validation_error",
      title: "EDI 810 Validation Failed",
      message: "2 validation errors: Malformed ISA envelope segment",
      documentId: doc4._id,
      partnerId: partner3._id,
      isRead: false,
      severity: "error",
      createdAt: hoursAgo(7),
    },
    {
      type: "status_change",
      title: "EDI 204 Sent",
      message: "Motor Carrier Load tender transmitted to FastFreight Logistics",
      documentId: doc3._id,
      partnerId: partner2._id,
      isRead: true,
      severity: "success",
      createdAt: hoursAgo(1),
    },
    {
      type: "system",
      title: "System Ready",
      message: "SERMACROPS EDI Management System initialized successfully",
      isRead: true,
      severity: "info",
      createdAt: hoursAgo(24),
    },
  ]);

  logger.info("Seed data inserted successfully");
}
