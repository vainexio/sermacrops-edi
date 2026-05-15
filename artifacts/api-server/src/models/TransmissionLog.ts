import mongoose, { Document, Schema } from "mongoose";

export interface ITransmissionLog extends Document {
  documentId: mongoose.Types.ObjectId;
  partnerId: mongoose.Types.ObjectId;
  endpointUrl: string;
  protocol: string;
  status: "pending" | "success" | "failed";
  httpStatusCode?: number;
  responseMessage?: string;
  as2MessageId?: string;
  transmittedAt: Date;
}

const TransmissionLogSchema = new Schema<ITransmissionLog>(
  {
    documentId: { type: Schema.Types.ObjectId, ref: "EdiDocument", required: true },
    partnerId: { type: Schema.Types.ObjectId, ref: "TradingPartner", required: true },
    endpointUrl: { type: String, required: true },
    protocol: { type: String, required: true },
    status: { type: String, enum: ["pending", "success", "failed"], required: true },
    httpStatusCode: { type: Number },
    responseMessage: { type: String },
    as2MessageId: { type: String },
    transmittedAt: { type: Date, default: Date.now },
  },
  { timestamps: false },
);

export const TransmissionLog = mongoose.model<ITransmissionLog>(
  "TransmissionLog",
  TransmissionLogSchema,
);
