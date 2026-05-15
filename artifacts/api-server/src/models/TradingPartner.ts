import mongoose, { Document, Schema } from "mongoose";

export interface ITradingPartner extends Document {
  name: string;
  as2Identifier: string;
  contactEmail?: string;
  contactPhone?: string;
  supportedDocTypes: string[];
  status: "active" | "inactive" | "pending";
  createdAt: Date;
  updatedAt: Date;
}

const TradingPartnerSchema = new Schema<ITradingPartner>(
  {
    name: { type: String, required: true },
    as2Identifier: { type: String, required: true },
    contactEmail: { type: String },
    contactPhone: { type: String },
    supportedDocTypes: { type: [String], default: [] },
    status: {
      type: String,
      enum: ["active", "inactive", "pending"],
      default: "active",
    },
  },
  { timestamps: true },
);

export const TradingPartner = mongoose.model<ITradingPartner>(
  "TradingPartner",
  TradingPartnerSchema,
);
