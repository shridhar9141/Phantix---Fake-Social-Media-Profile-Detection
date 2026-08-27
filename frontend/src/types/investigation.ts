export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type EntityType = 'SOCIAL_PROFILE' | 'WEBSITE';
export type SignalAvailability = 'AVAILABLE' | 'UNAVAILABLE';

export interface AnalysisSignal {
  id: string;
  signal_name: string;
  signal_category: string;
  detected: boolean;
  weight: number;
  value?: string | null;
  explanation: string;
  availability: SignalAvailability;
  created_at: string;
}

export interface EntityConnection {
  id: string;
  source_entity_id: string;
  target_entity_id: string;
  connection_type: string;
  connection_reason: string;
  similarity_score: number;
  target_domain?: string | null;
  target_platform?: string | null;
  created_at: string;
}

export interface InvestigationListItem {
  id: string;
  original_url: string;
  normalized_url: string;
  entity_type: EntityType;
  domain: string;
  platform: string;
  status: string;
  risk_score: number;
  risk_level: RiskLevel;
  summary?: string | null;
  created_at: string;
  completed_at?: string | null;
}

export interface SocialProfileData {
  id?: number;
  username: string;
  display_name?: string | null;
  platform: string;
  profile_url?: string | null;
  profile_image_url?: string | null;
  bio?: string | null;
  followers_count?: number | null;
  following_count?: number | null;
  posts_count?: number | null;
  availability?: Record<string, string>;
  status_message?: string | null;
}

export interface InvestigationDetail extends InvestigationListItem {
  signals: AnalysisSignal[];
  connections: EntityConnection[];
  profile?: SocialProfileData | null;
}


export interface PaginatedInvestigations {
  total: number;
  page: number;
  limit: number;
  pages: number;
  items: InvestigationListItem[];
}
