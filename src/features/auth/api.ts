import { apiClient } from '../../lib/apiClient';
import type { AuthResponse, LoginCredentials, User } from '../../lib/types';
import { LS_TOKEN_KEY, LS_USER_KEY } from '../../lib/constants';

export const authApi = {
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    console.log('🔄 authApi.login called with:', credentials);

    try {
      // Backend expects 'username' not 'email'
      const response = await apiClient.post<AuthResponse>('/api/auth/login', {
        username: credentials.email, // Using email as username
        password: credentials.password,
      });

      console.log('✅ Login response:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ Login error:', error);
      throw new Error(error.response?.data?.error || 'Credenciales inválidas');
    }
  },

  getMe: async (): Promise<User> => {
    // Mock API call - get user from localStorage
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const userStr = localStorage.getItem(LS_USER_KEY);
        if (!userStr) {
          reject(new Error('No autenticado'));
          return;
        }

        const user = JSON.parse(userStr) as User;
        resolve(user);
      }, 200);
    });

    // Real API call (commented for later)
    // return apiClient.get<User>('/auth/me');
  },

  logout: (): void => {
    localStorage.removeItem(LS_TOKEN_KEY);
    localStorage.removeItem(LS_USER_KEY);
  },
};
