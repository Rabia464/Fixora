import { apiClient } from './client';

export interface LoginResponse {
  access_token: string;
  token_type: string;
  role: string;
}

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  hostel: string | null;
  role_id: string;
  role: {
    id: string;
    name: string;
  };
  created_at: string;
  updated_at: string;
}

export const authApi = {
  login: async (email: string): Promise<LoginResponse> => {
    return apiClient<LoginResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },

  me: async (): Promise<UserProfile> => {
    return apiClient<UserProfile>('/auth/me');
  },
};
