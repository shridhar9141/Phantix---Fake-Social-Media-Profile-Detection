import { InvestigationListItem } from './investigation';

export interface ActivityItem {
  id: string;
  event_type: string;
  message: string;
  timestamp: string;
}

export interface RiskDistribution {
  low: number;
  medium: number;
  high: number;
  critical: number;
}

export interface DashboardStats {
  total_investigations: number;
  high_risk_count: number;
  medium_risk_count: number;
  low_risk_count: number;
  risk_distribution: RiskDistribution;
  recent_investigations: InvestigationListItem[];
  recent_activity: ActivityItem[];
}
