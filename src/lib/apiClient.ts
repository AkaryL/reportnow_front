import axios, { type AxiosInstance, type InternalAxiosRequestConfig } from 'axios';
import { API_URL, LS_TOKEN_KEY } from './constants';

// Crear instancia de Axios con configuración base
const apiClient: AxiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 120000, // 2 min
});

// Interceptor para agregar el token de autenticación a cada request
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem(LS_TOKEN_KEY);

    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para manejar errores de respuesta
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Si el token expiró o no es válido (401)
    if (error.response?.status === 401) {
      // Limpiar localStorage
      localStorage.removeItem(LS_TOKEN_KEY);
      localStorage.removeItem('reportnow:user');

      // Redirigir al login (solo si no estamos ya en /login)
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }

    // Si hay un error de validación (422), mostrar detalles
    if (error.response?.status === 422) {
      console.error('Validation error:', error.response.data);
    }

    return Promise.reject(error);
  }
);

export default apiClient;
