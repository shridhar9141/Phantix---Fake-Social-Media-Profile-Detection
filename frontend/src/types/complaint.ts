import { AnalysisSignal } from './investigation';

export interface ComplaintEvidenceItem {
  id: string;
  signal_id: string;
  included: boolean;
  signal?: AnalysisSignal;
}

export interface ComplaintResponse {
  id: string;
  complaint_identifier: string;
  user_id: string;
  investigation_id: string;
  title: string;
  category: string;
  description: string;
  status: 'DRAFT' | 'READY' | 'SUBMITTED' | 'CLOSED';
  user_confirmed: boolean;
  created_at: string;
}

export interface ComplaintDetailResponse extends ComplaintResponse {
  domain: string;
  normalized_url: string;
  platform: string;
  risk_score: number;
  risk_level: string;
  evidence_items: ComplaintEvidenceItem[];
  declaration: string;
}

export interface ComplaintCreate {
  investigation_id: string;
  title: string;
  category: string;
  description: string;
  included_signal_ids?: string[];
}

export interface ComplaintUpdate {
  title?: string;
  category?: string;
  description?: string;
  included_signal_ids?: string[];
}
