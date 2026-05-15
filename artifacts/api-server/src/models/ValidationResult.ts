import mongoose, { Document, Schema } from "mongoose";

export interface IValidationError {
  segment: string;
  field?: string;
  code: string;
  message: string;
}

export interface IValidationResult extends Document {
  documentId: mongoose.Types.ObjectId;
  isValid: boolean;
  errors: IValidationError[];
  warnings: string[];
  validatedAt: Date;
}

const ValidationErrorSchema = new Schema<IValidationError>(
  {
    segment: { type: String, required: true },
    field: { type: String },
    code: { type: String, required: true },
    message: { type: String, required: true },
  },
  { _id: false },
);

const ValidationResultSchema = new Schema<IValidationResult>(
  {
    documentId: { type: Schema.Types.ObjectId, ref: "EdiDocument", required: true },
    isValid: { type: Boolean, required: true },
    errors: { type: [ValidationErrorSchema], default: [] },
    warnings: { type: [String], default: [] },
    validatedAt: { type: Date, default: Date.now },
  },
  { timestamps: false },
);

export const ValidationResult = mongoose.model<IValidationResult>(
  "ValidationResult",
  ValidationResultSchema,
);
