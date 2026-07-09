import mongoose, { Schema, Document } from "mongoose";
import { UserRole } from "../shared/enums/index.js";

// Base User Interface
export interface IUser extends Document {
  email: string;
  role: UserRole;
  password?: string;
  isProfileComplete: boolean;
  name?: string;
  phone?: string;
  profilePicture?: string;
  companyLogo?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Base User Schema
const UserSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    role: { type: String, required: true, enum: Object.values(UserRole) },
    password: { type: String },
    isProfileComplete: { type: Boolean, default: false },
    name: { type: String },
    phone: { type: String },
    profilePicture: { type: String },
    companyLogo: { type: String },
  },
  {
    timestamps: true,
    discriminatorKey: "role",
  }
);

export const User = mongoose.model<IUser>("User", UserSchema);

// Brand specific interface
export interface IBrand extends IUser {
  companyName?: string;
  firstName?: string;
  lastName?: string;
  brandDescription?: string;
  website?: string;
  industry?: string;
  minBudget?: number;
  maxBudget?: number;
}

// Brand specific schema
const BrandSchema = new Schema<IBrand>({
  companyName: { type: String },
  firstName: { type: String },
  lastName: { type: String },
  brandDescription: { type: String },
  website: { type: String },
  industry: { type: String },
  minBudget: { type: Number },
  maxBudget: { type: Number },
});

export const Brand = User.discriminator<IBrand>(UserRole.BRAND, BrandSchema);

// Influencer specific interface
export interface IInfluencer extends IUser {
  username?: string;
  bio?: string;
  niches?: string[];
  countries?: string[];
  instagramUsername?: string;
  instagramFollowers?: number;
  instagramAccessToken?: string;
  instagramAccountId?: string;
  youtubeUsername?: string;
  youtubeFollowers?: number;
  twitterUsername?: string;
  twitterFollowers?: number;
  pastWorkLinks?: string[];
}

// Influencer specific schema
const InfluencerSchema = new Schema<IInfluencer>({
  username: { type: String },
  bio: { type: String },
  niches: { type: [String], default: undefined },
  countries: { type: [String], default: undefined },
  instagramUsername: { type: String },
  instagramFollowers: { type: Number },
  instagramAccessToken: { type: String },
  instagramAccountId: { type: String },
  youtubeUsername: { type: String },
  youtubeFollowers: { type: Number },
  twitterUsername: { type: String },
  twitterFollowers: { type: Number },
  pastWorkLinks: { type: [String], default: undefined },
});

export const Influencer = User.discriminator<IInfluencer>(UserRole.INFLUENCER, InfluencerSchema);
