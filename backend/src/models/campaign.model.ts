import mongoose, { Schema, Document } from "mongoose";
import { ApplicationStatus, CampaignStatus, Niche, Platform } from "../shared/enums/index.js";

export interface ICampaignApplication {
  influencerEmail: string;
  influencerName: string;
  influencer?: mongoose.Types.ObjectId | any;
  message: string;
  status: ApplicationStatus;
  appliedAt: Date;
}

export interface ICampaign extends Document {
  brandEmail: string;
  brandName: string;
  brand?: mongoose.Types.ObjectId | any;
  title: string;
  description: string;
  niche: Niche;
  budget: number;
  startDate: Date;
  endDate: Date;
  platform: Platform;
  deliverables: string;
  requirements: string;
  status: CampaignStatus;
  applications: ICampaignApplication[];
  maxApplicants: number;
  createdAt: Date;
}

const CampaignApplicationSchema = new Schema<ICampaignApplication>({
  influencerEmail: { type: String, required: true, lowercase: true, trim: true },
  influencerName: { type: String, required: true },
  influencer: { type: Schema.Types.ObjectId, ref: "User" },
  message: { type: String, required: true },
  status: { type: String, required: true, enum: Object.values(ApplicationStatus), default: ApplicationStatus.PENDING },
  appliedAt: { type: Date, required: true, default: Date.now },
});

const CampaignSchema = new Schema<ICampaign>(
  {
    brandEmail: { type: String, required: true, lowercase: true, trim: true },
    brandName: { type: String, required: true },
    brand: { type: Schema.Types.ObjectId, ref: "User" },
    title: { type: String, required: true },
    description: { type: String, required: true },
    niche: { type: String, required: true, enum: Object.values(Niche) },
    budget: { type: Number, required: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    platform: { type: String, required: true, enum: Object.values(Platform), default: Platform.INSTAGRAM },
    deliverables: { type: String, required: true },
    requirements: { type: String, required: true },
    maxApplicants: { type: Number, required: true },
    status: { type: String, required: true, enum: Object.values(CampaignStatus), default: CampaignStatus.OPEN },
    applications: [CampaignApplicationSchema],
  },
  {
    timestamps: true,
  }
);

export const Campaign = mongoose.model<ICampaign>("Campaign", CampaignSchema);

export async function migrateCampaignDates(): Promise<void> {
  const campaigns = await Campaign.find({
    $or: [{ startDate: { $exists: false } }, { endDate: { $exists: false } }],
  });

  if (campaigns.length === 0) return;

  const { logger } = await import("../shared/utils/logger.js");
  logger.info(`Migrating ${campaigns.length} campaign(s) missing date fields…`);
  let count = 0;

  for (const campaign of campaigns) {
    let changed = false;

    if (!campaign.startDate) {
      campaign.startDate = campaign.createdAt || new Date();
      changed = true;
    }

    if (!campaign.endDate) {
      const durationDays = campaign.get("durationDays") || 35;
      const end = new Date(campaign.startDate.getTime());
      end.setDate(end.getDate() + durationDays);
      campaign.endDate = end;
      changed = true;
    }

    if (changed) {
      await campaign.save();
      count++;
    }
  }

  logger.info(`Campaign date migration complete — updated ${count} document(s).`);
}

export async function migrateCampaignBrands(): Promise<void> {
  const campaigns = await Campaign.find({
    $or: [
      { brandEmail: { $exists: false } },
      { brandName: { $exists: false } },
      { brandEmail: "" },
      { brandName: "" }
    ],
  });

  if (campaigns.length === 0) return;

  const { logger } = await import("../shared/utils/logger.js");
  const { User } = await import("./user.model.js");

  logger.info(`Migrating ${campaigns.length} campaign(s) missing brand fields…`);
  let count = 0;

  for (const campaign of campaigns) {
    if (campaign.brand) {
      try {
        const brandUser = await User.findById(campaign.brand);
        if (brandUser) {
          campaign.brandEmail = brandUser.email;
          campaign.brandName = (brandUser as any).companyName || brandUser.name || brandUser.email;
          await campaign.save();
          count++;
        } else {
          logger.warn(`Brand user with ID ${campaign.brand} not found for campaign ${campaign._id}`);
        }
      } catch (err) {
        logger.error(`Failed to migrate campaign ${campaign._id}:`, err);
      }
    }
  }

  logger.info(`Campaign brand migration complete — updated ${count} document(s).`);
}

