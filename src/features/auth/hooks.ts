import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { authApi } from './api';
import { QUERY_KEYS, LS_TOKEN_KEY, LS_USER_KEY, ROUTES } from '../../lib/constants';
import type { User } from '../../lib/types';

export function useAuth() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const { data: user, isLoading } = useQuery({
    queryKey: QUERY_KEYS.AUTH_USER,
    queryFn: authApi.getMe,
    retry: false,
    enabled: !!localStorage.getItem(LS_TOKEN_KEY),
    staleTime: Infinity,
    gcTime: Infinity,
    initialData: () => {
      // Use localStorage data as initial data
      const userStr = localStorage.getItem(LS_USER_KEY);
      if (userStr) {
        try {
          return JSON.parse(userStr) as User;
        } catch {
          return undefined;
        }
      }
      return undefined;
    },
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  const loginMutation = useMutation({
    mutationFn: authApi.login,
    onSuccess: (data) => {
      console.log('✅ Login successful:', data);
      localStorage.setItem(LS_TOKEN_KEY, data.token);
      localStorage.setItem(LS_USER_KEY, JSON.stringify(data.user));
      queryClient.setQueryData(QUERY_KEYS.AUTH_USER, data.user);
      console.log('➡️ Navigating to HOME...');
      navigate(ROUTES.HOME, { replace: true });
    },
  });

  const logout = () => {
    authApi.logout();
    queryClient.setQueryData(QUERY_KEYS.AUTH_USER, null);
    navigate(ROUTES.LOGIN);
  };

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    login: loginMutation.mutate,
    loginError: loginMutation.error,
    isLoggingIn: loginMutation.isPending,
    logout,
  };
}

export function useRequireAuth() {
  const navigate = useNavigate();
  const { user, isLoading } = useAuth();

  if (!isLoading && !user) {
    navigate(ROUTES.LOGIN);
  }

  return { user, isLoading };
}

export function useRequireRole(allowedRoles: string[]) {
  const navigate = useNavigate();
  const { user, isLoading } = useAuth();

  if (!isLoading) {
    if (!user) {
      navigate(ROUTES.LOGIN);
      return { user: null, isLoading: false, hasAccess: false };
    }

    if (!allowedRoles.includes(user.role)) {
      navigate(ROUTES.HOME);
      return { user, isLoading: false, hasAccess: false };
    }
  }

  return { user, isLoading, hasAccess: true };
}
