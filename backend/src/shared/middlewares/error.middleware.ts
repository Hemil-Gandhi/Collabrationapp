import { Request, Response, NextFunction } from "express";
import { AppError } from "../utils/appError.js";
import { logger } from "../utils/logger.js";

export function errorMiddleware(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      error: err.message,
    });
    return;
  }

  if ((err as any).code === 11000) {
    res.status(409).json({ success: false, error: "Duplicate field value" });
    return;
  }

  if (err.name === "ValidationError") {
    res.status(400).json({ success: false, error: err.message });
    return;
  }

  logger.error("Unhandled error", err);
  res.status(500).json({ success: false, error: "Internal server error" });
}
