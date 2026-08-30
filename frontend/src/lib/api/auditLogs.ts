import { apiClient } from './client';

export interface AuditLogItem {
  id: string;
  action: string;
  performed_by: string;
  actor_name?: string | null;
  actor_email?: string | null;
  complaint_id?: string | null;
  details: Record<string, any>;
  created_at: string;
}

export const auditLogsApi = {
  getByComplaint: async (complaintId: string): Promise<AuditLogItem[]> => {
    return apiClient<AuditLogItem[]>(`/complaints/${complaintId}/audit_logs`);
  },
};
