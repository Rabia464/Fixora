import { apiClient } from './client';

export type { Complaint, ComplaintPriority, ComplaintStatus } from '../domain/complaint';
import type { Complaint, ComplaintPriority, ComplaintStatus } from '../domain/complaint';

export interface CreateComplaintInput {
  title: string;
  description: string;
  location: string;
}

export interface SupervisorReviewInput {
  category: string;
  priority: ComplaintPriority;
  department: string;
  override: boolean;
}

export interface MaintenanceProgressInput {
  note?: string;
}

export interface MaintenanceResolveInput {
  resolution_note: string;
}

export interface StudentReopenInput {
  reason: string;
}

export const complaintsApi = {
  // Student or Supervisor dashboard complaints
  getComplaints: async (status?: ComplaintStatus): Promise<Complaint[]> => {
    const query = status ? `?status=${encodeURIComponent(status)}` : '';
    return apiClient<Complaint[]>(`/complaints${query}`);
  },

  // Maintenance dashboard complaints
  getMaintenanceComplaints: async (): Promise<Complaint[]> => {
    return apiClient<Complaint[]>('/maintenance/complaints');
  },

  // Get single complaint details
  getComplaint: async (id: string): Promise<Complaint> => {
    return apiClient<Complaint>(`/complaints/${id}`);
  },

  // Create new complaint (Student)
  createComplaint: async (data: CreateComplaintInput): Promise<Complaint> => {
    return apiClient<Complaint>('/complaints', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Supervisor reviews / overrides
  supervisorReview: async (id: string, data: SupervisorReviewInput): Promise<Complaint> => {
    return apiClient<Complaint>(`/complaints/${id}/review`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  // Supervisor forwards to maintenance
  forwardToMaintenance: async (id: string): Promise<Complaint> => {
    return apiClient<Complaint>(`/complaints/${id}/forward`, {
      method: 'PATCH',
    });
  },

  // Maintenance marks In Progress
  updateProgress: async (id: string, data: MaintenanceProgressInput = {}): Promise<Complaint> => {
    return apiClient<Complaint>(`/complaints/${id}/progress`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  // Maintenance marks Resolved
  resolveComplaint: async (id: string, data: MaintenanceResolveInput): Promise<Complaint> => {
    return apiClient<Complaint>(`/complaints/${id}/resolve`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  // Student confirms resolution -> Closed
  confirmResolution: async (id: string): Promise<Complaint> => {
    return apiClient<Complaint>(`/complaints/${id}/confirm`, {
      method: 'PATCH',
    });
  },

  // Student reopens ticket -> Reopened
  reopenComplaint: async (id: string, data: StudentReopenInput): Promise<Complaint> => {
    return apiClient<Complaint>(`/complaints/${id}/reopen`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },
};
