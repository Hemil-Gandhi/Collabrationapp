export interface CatalogueItem {
  source: "instagram" | "manual";
  mediaUrl: string;
  mediaType: "image" | "video";
  caption?: string;
  igId?: string;
  createdAt: Date;
}

export interface User {
  email: string;
  role: "influencer" | "brand";
  password?: string;
  name?: string;
  phone?: string;
  username?: string;
  bio?: string;
  niches?: string[];
  countries?: string[];
  instagramUsername?: string;
  instagramFollowers?: number | null;
  instagramMediaCount?: number | null;
  instagramAccessToken?: string;
  youtubeUsername?: string;
  youtubeFollowers?: number | null;
  twitterUsername?: string;
  twitterFollowers?: number | null;
  pastWorkLinks?: string[];
  catalogue?: CatalogueItem[];
  avatar?: string;
  isVerified?: boolean;
  companyName?: string;
  industry?: string;
  companySize?: string;
  location?: string;
  website?: string;
  firstName?: string;
  lastName?: string;
  brandDescription?: string;
  minBudget?: number;
  maxBudget?: number;
  isProfileComplete: boolean;
}
