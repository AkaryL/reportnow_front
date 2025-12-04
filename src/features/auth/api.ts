import type { AuthResponse, LoginCredentials, User } from '../../lib/types';
import { LS_TOKEN_KEY, LS_USER_KEY } from '../../lib/constants';
import apiClient from '../../lib/apiClient';

export const authApi = {
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    try {
      // Llamar al backend real
      const response = await apiClient.post<AuthResponse>('/auth/login', credentials);

      // Guardar token y usuario en localStorage
      if (response.data.token) {
        localStorage.setItem(LS_TOKEN_KEY, response.data.token);
        localStorage.setItem(LS_USER_KEY, JSON.stringify(response.data.user));
      }

      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.detail || error.message || 'Credenciales inválidas');
    }
  },

  getMe: async (): Promise<User> => {
    try {
      const response = await apiClient.get<User>('/auth/me');
      return response.data;
    } catch (error: any) {
      // Si falla, intentar obtener del localStorage como fallback
      const userStr = localStorage.getItem(LS_USER_KEY);
      if (userStr) {
        return JSON.parse(userStr) as User;
      }
      throw new Error('No autenticado');
    }
  },

  logout: async (): Promise<void> => {
    try {
      await apiClient.post('/auth/logout');
    } catch (error) {
      console.error('Error al hacer logout en backend:', error);
    } finally {
      // Siempre limpiar localStorage
      localStorage.removeItem(LS_TOKEN_KEY);
      localStorage.removeItem(LS_USER_KEY);
    }
  },

  loginAsClient: async (clientId: string): Promise<AuthResponse> => {
    try {
      const response = await apiClient.post<AuthResponse>('/auth/login-as-client', {
        client_id: clientId
      });

      // Guardar token y usuario en localStorage
      if (response.data.token) {
        localStorage.setItem(LS_TOKEN_KEY, response.data.token);
        localStorage.setItem(LS_USER_KEY, JSON.stringify(response.data.user));
      }

      return response.data;
    } catch (error: any) {
      const errorMessage = error.response?.data?.detail || error.response?.data || error.message || 'Error al iniciar sesión como cliente';
      throw new Error(typeof errorMessage === 'string' ? errorMessage : JSON.stringify(errorMessage));
    }
  },
};
