import mongoose, { Document, Schema } from "mongoose";

export interface IPartnerEndpoint extends Document {
  partnerId: mongoose.Types.ObjectId;
  name: string;
  url: string;
  protocol: "AS2" | "SFTP" | "FTP" | "HTTP" | "HTTPS";
  direction: "inbound" | "outbound" | "both";
  supportedDocTypes: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const PartnerEndpointSchema = new Schema<IPartnerEndpoint>(
  {
    partnerId: {
      type: Schema.Types.ObjectId,
      ref: "TradingPartner",
      required: true,
    },
    name: { type: String, required: true },
    url: { type: String, required: true },
    protocol: {
      type: String,
      enum: ["AS2", "SFTP", "FTP", "HTTP", "HTTPS"],
      required: true,
    },
    direction: {
      type: String,
      enum: ["inbound", "outbound", "both"],
      required: true,
    },
    supportedDocTypes: { type: [String], default: [] },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

export const PartnerEndpoint = mongoose.model<IPartnerEndpoint>(
  "PartnerEndpoint",
  PartnerEndpointSchema,
);
