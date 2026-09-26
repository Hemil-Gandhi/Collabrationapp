import express from "express";
import helmet from "helmet";
import cors from "cors";
import rateLimit from "express-rate-limit";
import path from "path";
import os from "os";

import { errorMiddleware } from "./shared/middlewares/error.middleware.js";
import authRoutes from "./routes/auth.routes.js";
import campaignRoutes from "./routes/campaign.routes.js";
import instagramRoutes from "./routes/instagram.routes.js";
import postRoutes from "./routes/post.routes.js";

const app = express();

const staticUploadsDir = process.env.VERCEL
  ? path.join(os.tmpdir(), "uploads")
  : path.join(process.cwd(), "uploads");

app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "10mb", extended: true }));

app.use("/uploads", express.static(staticUploadsDir));

app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: { success: false, error: "Too many requests, slow down." },
  }),
);

app.get(["/health", "/api/health"], (_req, res) => res.json({ status: "ok" }));

app.use("/api/auth", authRoutes);
app.use("/api/campaigns", campaignRoutes);
app.use("/api/instagram", instagramRoutes);
app.use("/api/posts", postRoutes);

app.use((_req, res) =>
  res.status(404).json({ success: false, error: "Route not found" }),
);

app.use(errorMiddleware);

export default app;
