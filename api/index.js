import app from "../backend/dist/app.js";
import { connectDB, isDBReady } from "../backend/dist/database/connection.js";

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  // Health checks should work even if the DB is unreachable.
  if (req.url === "/health" || req.url === "/api/health") {
    return app(req, res);
  }
  try {
    await connectDB();
  } catch (err) {
    console.error("Database connection error in Vercel function handler:", err);
  }
  // Fail fast: never let requests hang in Mongoose's 10s buffering queue.
  if (!isDBReady()) {
    res.statusCode = 503;
    return res.json({ success: false, error: "Database unavailable, try again." });
  }
  return app(req, res);
}
