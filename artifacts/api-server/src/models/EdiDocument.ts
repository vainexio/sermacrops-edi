import mongoose, { Document, Schema } from "mongoose";

export interface IEdiDocument extends Document {
  partnerId: mongoose.Types.ObjectId;
  endpointId?: mongoose.Types.ObjectId;
  transactionSet: "850" | "855" | "856" | "810" | "204" | "990";
  controlNumber: string;
  status: "Draft" | "Validated" | "Sent" | "Received" | "Acknowledged" | "Failed";
  direction: "inbound" | "outbound";
  rawContent?: string;
  parsedContent?: Record<string, unknown>;
  validationStatus: "pending" | "passed" | "failed";
  isAcknowledged: boolean;
  sentAt?: Date;
  receivedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const EdiDocumentSchema = new Schema<IEdiDocument>(
  {
    partnerId: { type: Schema.Types.ObjectId, ref: "TradingPartner", required: true },
    endpointId: { type: Schema.Types.ObjectId, ref: "PartnerEndpoint" },
    transactionSet: {
      type: String,
      enum: ["850", "855", "856", "810", "204", "990"],
      required: true,
    },
    controlNumber: { type: String, required: true },
    status: {
      type: String,
      enum: ["Draft", "Validated", "Sent", "Received", "Acknowledged", "Failed"],
      default: "Draft",
    },
    direction: { type: String, enum: ["inbound", "outbound"], required: true },
    rawContent: { type: String },
    parsedContent: { type: Schema.Types.Mixed },
    validationStatus: {
      type: String,
      enum: ["pending", "passed", "failed"],
      default: "pending",
    },
    isAcknowledged: { type: Boolean, default: false },
    sentAt: { type: Date },
    receivedAt: { type: Date },
  },
  { timestamps: true },
);

export const EdiDocument = mongoose.model<IEdiDocument>("EdiDocument", EdiDocumentSchema);
