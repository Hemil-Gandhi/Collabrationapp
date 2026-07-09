import { Router } from "express";
import { createPost, getPosts, generateCaption } from "../controllers/post.controller.js";
import { requireAuth } from "../shared/middlewares/auth.middleware.js";
import { upload } from "../shared/middlewares/upload.middleware.js";

const router = Router();

router.get("/", requireAuth as any, getPosts as any);
router.post(
  "/",
  requireAuth as any,
  upload.fields([{ name: "postImage", maxCount: 1 }]) as any,
  createPost as any
);
router.post("/generate-caption", requireAuth as any, generateCaption as any);

export default router;
