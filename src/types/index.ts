export type Plan = 'FREE' | 'PRO' | 'ENTERPRISE';

export interface Profile {
  id: string;
  email: string;
  plan: Plan;
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
  raw_data: any;
  created_at: string;
}
