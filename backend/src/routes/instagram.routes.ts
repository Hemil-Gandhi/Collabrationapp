import { Router } from "express";
import {
  connectWithToken,
  disconnect,
  getInstagramMedia,
} from "../controllers/instagram.controller.js";
import { requireAuth } from "../shared/middlewares/auth.middleware.js";

const router = Router();

// All Instagram routes require authentication
router.post("/connect", requireAuth as any, connectWithToken as any);
router.post("/disconnect", requireAuth as any, disconnect as any);
router.get("/media", requireAuth as any, getInstagramMedia as any);

export default router;
