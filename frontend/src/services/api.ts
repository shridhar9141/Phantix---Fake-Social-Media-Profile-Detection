import { DashboardStats } from '../types/dashboard';
import { 
  InvestigationDetail, 
  InvestigationListItem, 
  PaginatedInvestigations 
} from '../types/investigation';
import { NetworkGraphData } from '../types/network';
import { UserProfile } from '../types/auth';
import { ReportResponse, ReportDetailResponse } from '../types/report';
import { 
  ComplaintResponse, 
  ComplaintDetailResponse, 
  ComplaintCreate, 
  ComplaintUpdate 
} from '../types/complaint';
import { authService } from './authService';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1';

async function fetchWithAuth<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  let token = await authService.getFreshIdToken() || localStorage.getItem('id_token') || '';
  if (!token) {
    token = 'mock-firebase-token-analyst_01::analyst@identitytrace.io::Lead Analyst';
  }
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
    ...(options.headers as Record<string, string> || {}),
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorMsg = 'An unexpected error occurred';
    try {
      const errorData = await response.json();
      errorMsg = errorData.detail || errorData.message || errorMsg;
    } catch {
      // JSON parse fallback
    }
    throw new Error(errorMsg);
  }

  if (response.status === 204) {
    return {} as T;
  }

  return response.json();
}

export const api = {
  // Auth & Profile
  async getCurrentUser(): Promise<UserProfile> {
    return fetchWithAuth<UserProfile>('/auth/me');
  },

  async updateProfile(displayName: string): Promise<UserProfile> {
    return fetchWithAuth<UserProfile>('/auth/me', {
      method: 'PATCH',
      body: JSON.stringify({ display_name: displayName }),
    });
  },

  // Dashboard
  async getDashboardStats(): Promise<DashboardStats> {
    return fetchWithAuth<DashboardStats>('/dashboard');
  },

  // Investigations
  async submitUrl(url: string): Promise<InvestigationDetail> {
    return fetchWithAuth<InvestigationDetail>('/investigations', {
      method: 'POST',
      body: JSON.stringify({ url }),
    });
  },

  async getInvestigations(params?: {
    search?: string;
    risk_level?: string;
    entity_type?: string;
    page?: number;
    limit?: number;
  }): Promise<PaginatedInvestigations> {
    const query = new URLSearchParams();
    if (params?.search) query.append('search', params.search);
    if (params?.risk_level) query.append('risk_level', params.risk_level);
    if (params?.entity_type) query.append('entity_type', params.entity_type);
    if (params?.page) query.append('page', params.page.toString());
    if (params?.limit) query.append('limit', params.limit.toString());

    const queryString = query.toString() ? `?${query.toString()}` : '';
    return fetchWithAuth<PaginatedInvestigations>(`/investigations${queryString}`);
  },

  async getInvestigationDetail(id: string): Promise<InvestigationDetail> {
    return fetchWithAuth<InvestigationDetail>(`/investigations/${id}`);
  },

  async deleteInvestigation(id: string): Promise<void> {
    return fetchWithAuth<void>(`/investigations/${id}`, {
      method: 'DELETE',
    });
  },

  // Network Graph
  async getNetworkGraph(): Promise<NetworkGraphData> {
    return fetchWithAuth<NetworkGraphData>('/network');
  },

  // Reports
  async generateReport(investigationId: string): Promise<ReportResponse> {
    return fetchWithAuth<ReportResponse>(`/investigations/${investigationId}/reports`, {
      method: 'POST',
    });
  },

  async getReports(): Promise<ReportResponse[]> {
    return fetchWithAuth<ReportResponse[]>('/reports');
  },

  async getReportDetail(reportId: string): Promise<ReportDetailResponse> {
    return fetchWithAuth<ReportDetailResponse>(`/reports/${reportId}`);
  },

  async downloadReport(reportId: string): Promise<Blob> {
    let token = await authService.getFreshIdToken() || localStorage.getItem('id_token') || '';
    if (!token) {
      token = 'mock-firebase-token-analyst_01::analyst@identitytrace.io::Lead Analyst';
    }
    const response = await fetch(`${API_BASE_URL}/reports/${reportId}/download`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    if (!response.ok) {
      throw new Error('Failed to download report file');
    }
    return response.blob();
  },

  // Complaints
  async createComplaint(payload: ComplaintCreate): Promise<ComplaintResponse> {
    return fetchWithAuth<ComplaintResponse>('/complaints', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async getComplaints(status?: string, category?: string): Promise<ComplaintResponse[]> {
    const query = new URLSearchParams();
    if (status) query.append('status', status);
    if (category) query.append('category', category);
    const queryString = query.toString() ? `?${query.toString()}` : '';
    return fetchWithAuth<ComplaintResponse[]>(`/complaints${queryString}`);
  },

  async getComplaintDetail(complaintId: string): Promise<ComplaintDetailResponse> {
    return fetchWithAuth<ComplaintDetailResponse>(`/complaints/${complaintId}`);
  },

  async updateComplaint(complaintId: string, payload: ComplaintUpdate): Promise<ComplaintResponse> {
    return fetchWithAuth<ComplaintResponse>(`/complaints/${complaintId}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  },

  async confirmComplaint(complaintId: string, userConfirmed: boolean): Promise<ComplaintResponse> {
    return fetchWithAuth<ComplaintResponse>(`/complaints/${complaintId}/confirm`, {
      method: 'POST',
      body: JSON.stringify({ user_confirmed: userConfirmed }),
    });
  },
};
