import { Niche, Platform, CampaignStatus, Industry } from './enums';

export interface Campaign {
  _id?: string;
  brandEmail: string;
  brandName?: string;
  brand?: any;
  title: string;
  description: string;
  niche: Niche;
  industry: Industry;
  budget: number;
  startDate: string;
  endDate: string;
  deliverables: string;
  requirements: string;
  status: CampaignStatus;
  createdAt?: string;
  applications?: any[];
  platform?: Platform;
  maxApplicants?: number;
  daysLeft?: number;
}
