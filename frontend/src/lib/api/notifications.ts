import { api } from '@/lib/api/client'
import type { Notification } from '@/types/api'

export const notificationsApi = {
  /** GET /notifications/ — fetch unread notifications */
  list: (limit = 50) =>
    api.get<unknown, Notification[]>('/notifications/', { params: { limit } }),

  /** PATCH /notifications/read — mark all notifications as read */
  markAllRead: () =>
    api.patch<unknown, { message: string }>('/notifications/read'),
}
