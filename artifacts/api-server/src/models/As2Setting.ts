import mongoose, { Document, Schema } from "mongoose";

export interface IAs2Setting extends Document {
  partnerId: mongoose.Types.ObjectId;
  localAs2Id: string;
  remoteAs2Id: string;
  remoteUrl: string;
  encryptionAlgorithm: "AES128" | "AES256" | "3DES" | "NONE";
  signatureAlgorithm: "SHA1" | "SHA256" | "SHA384" | "SHA512" | "NONE";
  mdnMode: "sync" | "async" | "none";
  mdnUrl?: string;
  isActive: boolean;
  lastTestedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const As2SettingSchema = new Schema<IAs2Setting>(
  {
    partnerId: { type: Schema.Types.ObjectId, ref: "TradingPartner", required: true },
    localAs2Id: { type: String, required: true },
    remoteAs2Id: { type: String, required: true },
    remoteUrl: { type: String, required: true },
    encryptionAlgorithm: {
      type: String,
      enum: ["AES128", "AES256", "3DES", "NONE"],
      default: "AES256",
    },
    signatureAlgorithm: {
      type: String,
      enum: ["SHA1", "SHA256", "SHA384", "SHA512", "NONE"],
      default: "SHA256",
    },
    mdnMode: { type: String, enum: ["sync", "async", "none"], default: "sync" },
    mdnUrl: { type: String },
    isActive: { type: Boolean, default: true },
    lastTestedAt: { type: Date },
  },
  { timestamps: true },
);

export const As2Setting = mongoose.model<IAs2Setting>("As2Setting", As2SettingSchema);
