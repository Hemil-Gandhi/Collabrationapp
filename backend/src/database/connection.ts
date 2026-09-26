import mongoose from "mongoose";
import { env } from "../config/env.js";
import { logger } from "../shared/utils/logger.js";
import { migrateCampaignDates, migrateCampaignBrands } from "../models/campaign.model.js";

export function isDBReady(): boolean {
  return mongoose.connection.readyState === 1;
}

export async function connectDB(): Promise<void> {
  if (isDBReady()) {
    return;
  }
  if (process.env.VERCEL && (!env.MONGODB_URI || env.MONGODB_URI.includes("localhost"))) {
    logger.warn("MongoDB URI not configured or set to localhost in Vercel environment.");
    return;
  }
  try {
    await mongoose.connect(env.MONGODB_URI, {
      // Fail fast on serverless: don't hang the function past its timeout.
      serverSelectionTimeoutMS: 8000,
      maxPoolSize: 1,
    });
    logger.info("MongoDB connected");
    // Migrations are a one-off task: never run them on Vercel cold starts
    // (they scan whole collections and can exceed the serverless timeout).
    // Run locally with RUN_MIGRATIONS=1, or not on Vercel at all.
    if (!process.env.VERCEL || process.env.RUN_MIGRATIONS === "1") {
      await migrateCampaignDates();
      await migrateCampaignBrands();
    }
  } catch (error) {
    logger.error("MongoDB connection failed", error);
    if (process.env.VERCEL) {
      return;
    }
    process.exit(1);
  }
}

export async function disconnectDB(): Promise<void> {
  await mongoose.disconnect();
  logger.info("MongoDB disconnected");
}
