import mongoose, { Document, Schema } from "mongoose";

export interface ITranslationLog extends Document {
  documentId: mongoose.Types.ObjectId;
  direction: "edi_to_json" | "json_to_edi";
  status: "success" | "failed";
  inputFormat: string;
  outputFormat: string;
  parsedSegments: number;
  errorMessage?: string;
  translatedAt: Date;
}

const TranslationLogSchema = new Schema<ITranslationLog>(
  {
    documentId: { type: Schema.Types.ObjectId, ref: "EdiDocument", required: true },
    direction: { type: String, enum: ["edi_to_json", "json_to_edi"], required: true },
    status: { type: String, enum: ["success", "failed"], required: true },
    inputFormat: { type: String, required: true },
    outputFormat: { type: String, required: true },
    parsedSegments: { type: Number, default: 0 },
    errorMessage: { type: String },
    translatedAt: { type: Date, default: Date.now },
  },
  { timestamps: false },
);

export const TranslationLog = mongoose.model<ITranslationLog>(
  "TranslationLog",
  TranslationLogSchema,
);
