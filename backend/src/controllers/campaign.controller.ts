import { Response, NextFunction } from "express";
import { Campaign } from "../models/campaign.model.js";
import { User, IBrand, IInfluencer } from "../models/user.model.js";
import { BadRequestError, NotFoundError, UnauthorizedError } from "../shared/utils/appError.js";
import { AuthenticatedRequest } from "../shared/types/index.js";
import { CampaignStatus, ApplicationStatus } from "../shared/enums/index.js";

const getAuthenticatedUser = async (req: AuthenticatedRequest) => {
  const email = req.user?.email;
  if (!email) throw new UnauthorizedError("Unauthorized.");
  const user = await User.findOne({ email });
  if (!user) throw new NotFoundError("User not found.");
  return { email: email.toLowerCase().trim(), user };
};

export async function getCampaigns(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { email, user } = await getAuthenticatedUser(req);
    
    const query = user.role === "brand" 
      ? { brandEmail: email } 
      : { $or: [{ status: CampaignStatus.OPEN }, { "applications.influencerEmail": email }] };

    const campaigns = await Campaign.find(query)
      .populate("brand", "name companyName companyLogo profilePicture email")
      .populate("applications.influencer", "name username profilePicture email")
      .sort({ createdAt: -1 });
    res.json({ campaigns });
  } catch (error) {
    next(error);
  }
}

export async function createCampaign(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { email, user } = await getAuthenticatedUser(req);
    if (user.role !== "brand") throw new UnauthorizedError("Only brands can create campaigns.");

    const requiredFields = ['title', 'description', 'niche', 'budget', 'startDate', 'endDate', 'platform', 'deliverables', 'requirements', 'maxApplicants'];
    for (const field of requiredFields) {
      if (!req.body[field]) throw new BadRequestError("All fields are required.");
    }

    const campaign = new Campaign({
      ...req.body,
      brandEmail: email,
      brandName: (user as IBrand).companyName || user.name || email,
      brand: user._id,
      budget: Number(req.body.budget),
      startDate: new Date(req.body.startDate),
      endDate: new Date(req.body.endDate),
      maxApplicants: Number(req.body.maxApplicants),
      status: CampaignStatus.OPEN,
      applications: [],
    });

    await campaign.save();
    res.status(201).json({ message: "Campaign created successfully.", campaign });
  } catch (error) {
    next(error);
  }
}

export async function getCampaignById(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const campaign = await Campaign.findById(req.params.id)
      .populate("brand", "name companyName companyLogo profilePicture email")
      .populate("applications.influencer", "name username profilePicture email");
    if (!campaign) throw new NotFoundError("Campaign not found.");
    res.json({ campaign });
  } catch (error) {
    next(error);
  }
}

export async function applyToCampaign(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { email, user } = await getAuthenticatedUser(req);
    if (user.role !== "influencer") throw new UnauthorizedError("Only influencers can apply to campaigns.");

    const { message } = req.body;
    if (!message) throw new BadRequestError("Message is required.");

    const campaign = await Campaign.findById(req.params.id);
    if (!campaign) throw new NotFoundError("Campaign not found.");
    if (campaign.status !== CampaignStatus.OPEN) throw new BadRequestError("Campaign is not open for applications.");

    if (campaign.applications.some((a) => a.influencerEmail.toLowerCase() === email)) {
      throw new BadRequestError("You have already applied to this campaign.");
    }

    campaign.applications.push({
      influencerEmail: email,
      influencerName: user.name || (user as IInfluencer).username || email,
      influencer: user._id,
      message,
      status: ApplicationStatus.PENDING,
      appliedAt: new Date(),
    } as any);

    await campaign.save();
    res.json({ message: "Application submitted successfully.", application: campaign.applications.slice(-1)[0] });
  } catch (error) {
    next(error);
  }
}

export async function updateApplicationStatus(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const brandEmail = req.user?.email?.toLowerCase().trim();
    if (!brandEmail) throw new UnauthorizedError("Unauthorized.");

    const { status } = req.body;
    if (![ApplicationStatus.ACCEPTED, ApplicationStatus.REJECTED].includes(status)) {
      throw new BadRequestError("Status must be 'accepted' or 'rejected'.");
    }

    const campaignId = req.params.id as string;
    const influencerEmail = decodeURIComponent(req.params.email as string).toLowerCase().trim();

    const campaign = await Campaign.findById(campaignId);
    if (!campaign) throw new NotFoundError("Campaign not found.");
    if (!campaign.brandEmail || campaign.brandEmail.toLowerCase().trim() !== brandEmail) {
      throw new UnauthorizedError("Only the campaign owner can update application status.");
    }

    const result = await Campaign.updateOne(
      { _id: campaignId, "applications.influencerEmail": { $regex: new RegExp(`^${influencerEmail}$`, "i") } },
      { $set: { "applications.$.status": status } }
    );

    if (result.matchedCount === 0) throw new NotFoundError("Application not found for this influencer.");
    res.json({ message: `Application ${status} successfully.` });
  } catch (error) {
    next(error);
  }
}

export async function updateCampaignStatus(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const brandEmail = req.user?.email?.toLowerCase().trim();
    if (!brandEmail) throw new UnauthorizedError("Unauthorized.");

    const { status } = req.body;
    if (!Object.values(CampaignStatus).includes(status)) throw new BadRequestError("Invalid campaign status.");

    const campaign = await Campaign.findById(req.params.id);
    if (!campaign) throw new NotFoundError("Campaign not found.");
    if (!campaign.brandEmail || campaign.brandEmail.toLowerCase().trim() !== brandEmail) {
      throw new UnauthorizedError("Only the campaign owner can update campaign status.");
    }

    campaign.status = status;
    await campaign.save();
    res.json({ message: `Campaign status updated to ${status} successfully.`, campaign });
  } catch (error) {
    next(error);
  }
}
