import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { authApi } from './api';
import { QUERY_KEYS, LS_TOKEN_KEY, LS_USER_KEY, ROUTES } from '../../lib/constants';

export function useAuth() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const { data: user, isLoading } = useQuery({
    queryKey: QUERY_KEYS.AUTH_USER,
    queryFn: authApi.getMe,
    retry: false,
    enabled: !!localStorage.getItem(LS_TOKEN_KEY),
  });

  const loginMutation = useMutation({
    mutationFn: authApi.login,
    onSuccess: (data) => {
      localStorage.setItem(LS_TOKEN_KEY, data.token);
      localStorage.setItem(LS_USER_KEY, JSON.stringify(data.user));
      queryClient.setQueryData(QUERY_KEYS.AUTH_USER, data.user);
      navigate(ROUTES.HOME);
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
