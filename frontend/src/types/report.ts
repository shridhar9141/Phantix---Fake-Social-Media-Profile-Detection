import { AnalysisSignal, EntityConnection } from './investigation';

export interface ReportResponse {
  id: string;
  report_identifier: string;
  investigation_id: string;
  generated_by_user_id: string;
  report_type: string;
  risk_score: number;
  risk_level: string;
  status: string;
  generated_at: string;
}

export interface ReportDetailResponse extends ReportResponse {
  target_type: string;
  original_url: string;
  normalized_url: string;
  domain: string;
  platform: string;
  signals: AnalysisSignal[];
  connections: EntityConnection[];
  summary?: string;
  limitations: string[];
  disclaimer: string;
}
