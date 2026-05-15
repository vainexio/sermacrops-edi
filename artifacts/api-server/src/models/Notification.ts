import mongoose, { Document, Schema } from "mongoose";

export interface INotification extends Document {
  type: "status_change" | "validation_error" | "transmission_failure" | "acknowledgment" | "system";
  title: string;
  message: string;
  documentId?: mongoose.Types.ObjectId;
  partnerId?: mongoose.Types.ObjectId;
  isRead: boolean;
  severity: "info" | "warning" | "error" | "success";
  createdAt: Date;
}

const NotificationSchema = new Schema<INotification>(
  {
    type: {
      type: String,
      enum: ["status_change", "validation_error", "transmission_failure", "acknowledgment", "system"],
      required: true,
    },
    title: { type: String, required: true },
    message: { type: String, required: true },
    documentId: { type: Schema.Types.ObjectId, ref: "EdiDocument" },
    partnerId: { type: Schema.Types.ObjectId, ref: "TradingPartner" },
    isRead: { type: Boolean, default: false },
    severity: { type: String, enum: ["info", "warning", "error", "success"], default: "info" },
  },
  { timestamps: true },
);

export const Notification = mongoose.model<INotification>("Notification", NotificationSchema);
