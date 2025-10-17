import type { AuthResponse, LoginCredentials, User } from '../../lib/types';
import { LS_TOKEN_KEY, LS_USER_KEY } from '../../lib/constants';
import { mockUsers } from '../../data/mockData';

// Función auxiliar para simular delay de red
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Función para generar un token JWT mock
const generateMockToken = (user: User): string => {
  return `mock.jwt.token.${user.id}.${Date.now()}`;
};

export const authApi = {
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    console.log('🔄 authApi.login called with:', credentials);

    try {
      // Simular delay de red
      await delay(300);

      // Buscar usuario por username (usando email como username)
      const user = mockUsers.find(
        u => u.username === credentials.email && u.password === credentials.password
      );

      if (!user) {
        throw new Error('Credenciales inválidas');
      }

      // Generar token mock
      const token = generateMockToken(user);

      // Crear objeto de usuario sin password
      const { password, ...userWithoutPassword } = user;

      console.log('✅ Login exitoso:', userWithoutPassword);

      return {
        token,
        user: userWithoutPassword,
      };
    } catch (error: any) {
      console.error('❌ Login error:', error);
      throw new Error(error.message || 'Credenciales inválidas');
    }
  },

  getMe: async (): Promise<User> => {
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
  },

  logout: (): void => {
    localStorage.removeItem(LS_TOKEN_KEY);
    localStorage.removeItem(LS_USER_KEY);
  },
};
