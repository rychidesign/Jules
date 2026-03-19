export type Plan = 'FREE' | 'PRO' | 'ENTERPRISE';

export interface Profile {
  id: string;
  email: string;
  plan: Plan;
  created_at: string;
}

export interface UserProfile {
  id: string;
  tier: Plan;
  scans_used_this_month: number;
  last_scan_reset_at: string;
  created_at: string;
}

export interface TierLimit {
  id: string;
  tier: Plan;
  max_projects: number;
  max_competitors_per_project: number;
  max_scans_per_month: number;
  allowed_models: string[];
  created_at: string;
}

export interface Project {
  id: string;
  user_id: string;
  name: string;
  url: string;
  focus: string;
  location: string;
  has_competitors: boolean;
  target_keywords: string[];
  brand_variations: string[];
  selected_models: string[];
  created_at: string;
}

export interface Competitor {
  id: string;
  project_id: string;
  name: string;
  url: string;
  created_at: string;
}

export interface Scan {
  id: string;
  project_id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  created_at: string;
}

export interface ScanResult {
  id: string;
  scan_id: string;
  entity_type: 'project' | 'competitor';
  entity_id: string;
  ai_visibility_score: number;
  geo_technical_score: number;
  sentiment_score: number;
  local_seo_score: number;
  recommendations: string[];
  raw_data: RawData | null;
  created_at: string;
}

export interface RawData {
  technicalMetrics?: {
    score: number;
    hasSchema: boolean;
    markdownFriendly: boolean;
    pageSpeed: number;
    entityDensity: number;
    recommendations: string[];
  };
  aiVisibilityMetrics?: {
    score: number;
    sentimentScore: number;
    citations: number;
    queriesSent: string[];
    responses: string[];
  };
  queriesSent?: string[];
}
