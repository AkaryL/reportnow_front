// import { apiClient } from '../../lib/apiClient';
import type { AuthResponse, LoginCredentials, User } from '../../lib/types';
import { LS_TOKEN_KEY, LS_USER_KEY } from '../../lib/constants';

// Mock users for development
const MOCK_USERS = [
  {
    id: '1',
    email: 'julio@fleetwatch.com',
    password: 'julio123',
    name: 'Julio González',
    role: 'superuser' as const,
  },
  {
    id: '2',
    email: 'admin@fleetwatch.com',
    password: 'admin123',
    name: 'Admin FleetWatch',
    role: 'admin' as const,
    organizationId: 'org-1',
  },
  {
    id: '3',
    email: 'cliente@fleetwatch.com',
    password: 'cliente123',
    name: 'Cliente Demo',
    role: 'cliente' as const,
    organizationId: 'org-1',
  },
];

export const authApi = {
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    // Mock API call
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const user = MOCK_USERS.find(
          (u) => u.email === credentials.email && u.password === credentials.password
        );

        if (!user) {
          reject(new Error('Credenciales inválidas'));
          return;
        }

        const { password, ...userData } = user;
        const token = `mock-jwt-token-${user.id}`;

        resolve({
          token,
          user: userData,
        });
      }, 500);
    });

    // Real API call (commented for later)
    // return apiClient.post<AuthResponse>('/auth/login', credentials);
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
