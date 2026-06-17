import { Request, Response, NextFunction } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { User } from "../models/user.model.js";
import { Otp } from "../models/otp.model.js";
import { sendOtpEmail } from "../services/email.service.js";
import {
  BadRequestError,
  ConflictError,
  NotFoundError,
  UnauthorizedError,
} from "../shared/utils/appError.js";
import { AuthenticatedRequest } from "../shared/types/index.js";

const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
const isStrongPassword = (password: string) => /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(password);
const signToken = (payload: { email: string; role: string }) => 
  jwt.sign(payload, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN as any });

const OTP_EXPIRATION = 10 * 60 * 1000;

export async function register(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { email, role } = req.body;
    if (!email || !role) throw new BadRequestError("Email and role are required.");
    if (!isValidEmail(email)) throw new BadRequestError("Invalid email format.");

    const normalizedEmail = email.toLowerCase().trim();
    const existingUser = await User.findOne({ email: normalizedEmail });
    
    if (existingUser?.isProfileComplete) {
      throw new ConflictError("An account with this email is already registered.");
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    await Otp.findOneAndUpdate(
      { email: normalizedEmail },
      { otp, role, verified: false, expiresAt: new Date(Date.now() + OTP_EXPIRATION) },
      { upsert: true }
    );

    await sendOtpEmail(email, otp);
    res.json({ message: `Verification code sent to ${email}.` });
  } catch (error) {
    next(error);
  }
}

export async function verifyOtp(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) throw new BadRequestError("Email and OTP are required.");

    const normalizedEmail = email.toLowerCase().trim();
    const record = await Otp.findOne({ email: normalizedEmail });

    if (!record) throw new BadRequestError("No OTP request found for this email. Please register first.");
    if (Date.now() > record.expiresAt.getTime()) {
      await Otp.deleteOne({ email: normalizedEmail });
      throw new UnauthorizedError("Verification code has expired. Please request a new one.");
    }
    if (record.otp !== otp) throw new ConflictError("Invalid verification code. Please try again.");

    await Otp.updateOne({ email: normalizedEmail }, { verified: true, $unset: { otp: 1 } });
    res.json({ message: "Email verified successfully." });
  } catch (error) {
    next(error);
  }
}

export async function createPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { email, password } = req.body;
    if (!email || !password) throw new BadRequestError("Email and password are required.");
    if (!isStrongPassword(password)) {
      throw new BadRequestError("Password must be at least 8 characters and include uppercase, lowercase, and a number.");
    }

    const normalizedEmail = email.toLowerCase().trim();
    const record = await Otp.findOne({ email: normalizedEmail });

    if (!record?.verified) throw new BadRequestError("Please verify your email first.");
    
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser?.password) throw new ConflictError("Password already set. Please log in.");

    const hashedPassword = await bcrypt.hash(password, 12);
    const user = await User.findOneAndUpdate(
      { email: normalizedEmail },
      { email: normalizedEmail, role: record.role, password: hashedPassword, isProfileComplete: false },
      { upsert: true, new: true }
    );

    await Otp.deleteOne({ email: normalizedEmail });
    if (!user) throw new NotFoundError("User creation failed.");

    const token = signToken({ email: user.email, role: user.role });
    res.json({ message: "Password created successfully.", user, token });
  } catch (error) {
    next(error);
  }
}

export async function login(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { email, password } = req.body;
    if (!email || !password) throw new BadRequestError("Email and password are required.");

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user || !user.password || !(await bcrypt.compare(password, user.password))) {
      throw new UnauthorizedError("Invalid email or password.");
    }

    const token = signToken({ email: user.email, role: user.role });
    res.json({ message: "Login successful.", user, token });
  } catch (error) {
    next(error);
  }
}

export async function updateProfile(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const userEmail = req.user?.email;
    if (!userEmail) throw new UnauthorizedError("Unauthorized.");

    const user = await User.findOne({ email: userEmail });
    if (!user) throw new NotFoundError("User not found.");

    const { email: _ignored, role: _ignoredRole, ...updates } = req.body;

    // Handle JSON parsed arrays
    ["niches", "countries", "pastWorkLinks"].forEach((key) => {
      if (typeof updates[key] === "string" && updates[key].startsWith("[")) {
        try { updates[key] = JSON.parse(updates[key]); } catch (e) {}
      }
    });

    // Handle file uploads
    const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;
    if (files?.profilePicture?.length) updates.profilePicture = `uploads/profilePictures/${files.profilePicture[0].filename}`;
    if (files?.companyLogo?.length) updates.companyLogo = `uploads/companyLogos/${files.companyLogo[0].filename}`;

    // Define allowed fields based on role
    const allowedFields = user.role === "influencer" 
      ? ["name", "username", "phone", "bio", "niches", "countries", "pastWorkLinks", "profilePicture"]
      : ["name", "phone", "firstName", "lastName", "companyName", "brandDescription", "website", "industry", "minBudget", "maxBudget", "companyLogo"];

    const filteredUpdates: any = { isProfileComplete: true };
    for (const key of allowedFields) {
      if (updates[key] !== undefined) {
        filteredUpdates[key] = key.toLowerCase().includes('budget') ? Number(updates[key]) : updates[key];
      }
    }

    const updatedUser = await User.findOneAndUpdate(
      { email: userEmail },
      { $set: filteredUpdates },
      { new: true }
    );

    res.json({ message: "Profile updated successfully.", user: updatedUser });
  } catch (error) {
    next(error);
  }
}

export async function getProfile(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user?.email) throw new UnauthorizedError("Unauthorized.");
    
    const user = await User.findOne({ email: req.user.email });
    if (!user) throw new NotFoundError("User not found.");

    res.json({ user });
  } catch (error) {
    next(error);
  }
}
