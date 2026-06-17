import mongoose from "mongoose";
import { env } from "../config/env.js";
import { logger } from "../shared/utils/logger.js";
import { migrateCampaignDates, migrateCampaignBrands } from "../models/campaign.model.js";

export async function connectDB(): Promise<void> {
  try {
    await mongoose.connect(env.MONGODB_URI);
    logger.info("MongoDB connected");
    await migrateCampaignDates();
    await migrateCampaignBrands();
  } catch (error) {
    logger.error("MongoDB connection failed", error);
    process.exit(1);
  }
}

export async function disconnectDB(): Promise<void> {
  await mongoose.disconnect();
  logger.info("MongoDB disconnected");
}
