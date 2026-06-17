import { Router } from "express";
import { getCampaigns, createCampaign, getCampaignById, applyToCampaign, updateApplicationStatus, updateCampaignStatus } from "../controllers/campaign.controller.js";
import { requireAuth } from "../shared/middlewares/auth.middleware.js";

const router = Router();

router.get("/", requireAuth as any, getCampaigns as any);
router.post("/", requireAuth as any, createCampaign as any);
router.get("/:id", requireAuth as any, getCampaignById as any);
router.post("/:id/apply", requireAuth as any, applyToCampaign as any);
router.put("/:id/applications/:email/status", requireAuth as any, updateApplicationStatus as any);
router.put("/:id/status", requireAuth as any, updateCampaignStatus as any);

export default router;
