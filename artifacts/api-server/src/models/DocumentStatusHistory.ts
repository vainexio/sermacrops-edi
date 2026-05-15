import mongoose, { Document, Schema } from "mongoose";

export interface IDocumentStatusHistory extends Document {
  documentId: mongoose.Types.ObjectId;
  status: "Draft" | "Validated" | "Sent" | "Received" | "Acknowledged" | "Failed";
  message?: string;
  createdAt: Date;
}

const DocumentStatusHistorySchema = new Schema<IDocumentStatusHistory>(
  {
    documentId: { type: Schema.Types.ObjectId, ref: "EdiDocument", required: true },
    status: {
      type: String,
      enum: ["Draft", "Validated", "Sent", "Received", "Acknowledged", "Failed"],
      required: true,
    },
    message: { type: String },
  },
  { timestamps: true },
);

export const DocumentStatusHistory = mongoose.model<IDocumentStatusHistory>(
  "DocumentStatusHistory",
  DocumentStatusHistorySchema,
);
