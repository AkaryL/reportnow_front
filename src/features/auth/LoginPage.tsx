import { useState } from 'react';
import type { FormEvent } from 'react';
import { useAuth } from './hooks';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { APP_NAME } from '../../lib/constants';
import { Lock, Mail } from 'lucide-react';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, isLoggingIn, loginError } = useAuth();

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    console.log('🔐 Login form submitted:', { email, password });
    login({ email, password });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-info-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-primary rounded-xl flex items-center justify-center mb-4">
            <Lock className="w-8 h-8 text-white" />
          </div>
          <CardTitle className="text-2xl">{APP_NAME}</CardTitle>
          <p className="text-gray-600 text-sm mt-2">
            Inicia sesión para acceder a la plataforma
          </p>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Usuario
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  id="email"
                  type="text"
                  placeholder="usuario"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                  required
                  autoComplete="username"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Contraseña
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10"
                  required
                  autoComplete="current-password"
                />
              </div>
            </div>

            {loginError && (
              <div className="p-3 bg-crit-50 border border-crit-200 rounded-lg">
                <p className="text-sm text-crit-700">
                  {loginError instanceof Error ? loginError.message : 'Error al iniciar sesión'}
                </p>
              </div>
            )}

            <Button
              type="submit"
              className="w-full"
              isLoading={isLoggingIn}
              disabled={isLoggingIn}
            >
              Iniciar sesión
            </Button>
          </form>

          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-600 font-semibold mb-2">Usuarios de prueba:</p>
            <div className="space-y-1 text-xs text-gray-600">
              <div>
                <strong>Superuser:</strong> julio / admin123
              </div>
              <div>
                <strong>Admin:</strong> admin / admin123
              </div>
              <div>
                <strong>Cliente:</strong> cliente / cliente123
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
