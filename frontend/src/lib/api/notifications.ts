import { apiClient } from './client';

export interface NotificationItem {
  id: string;
  user_id: string;
  complaint_id: string;
  type: string;
  payload: Record<string, any>;
  is_read: boolean;
  created_at: string;
}

export const notificationsApi = {
  getUnread: async (limit: number = 50): Promise<NotificationItem[]> => {
    return apiClient<NotificationItem[]>(`/notifications/?limit=${limit}`);
  },

  markAllAsRead: async (): Promise<{ message: string }> => {
    return apiClient<{ message: string }>('/notifications/read', {
      method: 'PATCH',
    });
  },
};
