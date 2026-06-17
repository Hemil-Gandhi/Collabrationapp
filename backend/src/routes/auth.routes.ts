import { Router } from "express";
import {
  register,
  verifyOtp,
  createPassword,
  login,
  updateProfile,
  getProfile,
} from "../controllers/auth.controller.js";
import { requireAuth } from "../shared/middlewares/auth.middleware.js";
import { upload } from "../shared/middlewares/upload.middleware.js";

const router = Router();

router.post("/register", register);
router.post("/verify-otp", verifyOtp);
router.post("/create-password", createPassword);
router.post("/login", login);

router.put(
  "/profile",
  requireAuth as any,
  upload.fields([
    { name: "profilePicture", maxCount: 1 },
    { name: "companyLogo", maxCount: 1 },
  ]) as any,
  updateProfile as any
);

router.get("/profile", requireAuth as any, getProfile as any);

export default router;
