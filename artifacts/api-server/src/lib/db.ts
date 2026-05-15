import mongoose from "mongoose";
import { logger } from "./logger";

let mongoUri: string | null = process.env["MONGODB_URI"] || null;

export async function connectDb(): Promise<void> {
  if (!mongoUri) {
    const { MongoMemoryServer } = await import("mongodb-memory-server");
    const mongod = await MongoMemoryServer.create();
    mongoUri = mongod.getUri();
    logger.info("Using in-memory MongoDB (dev mode)");
  }
  await mongoose.connect(mongoUri);
  logger.info("MongoDB connected");
}
