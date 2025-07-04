import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Страница входа в аккаунт
 * 
 * Позволяет пользователю войти в существующий аккаунт
 */
const LoginPage: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  // Получаем функции из контекста аутентификации
  const { login, isAuthenticated, user } = useAuth();

  // Перенаправляем на страницу профиля, если пользователь уже авторизован
  useEffect(() => {
    if (isAuthenticated && user) {
      // Определяем, куда перенаправить пользователя в зависимости от типа аккаунта
      if (user.has_creator_profile) {
        navigate('/creator-profile');
      } else {
        navigate('/client-profile');
      }
    }
  }, [isAuthenticated, user, navigate]);

  /**
   * Обрабатывает отправку формы входа
   * @param e - Событие отправки формы
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // Вызываем метод входа из контекста аутентификации
      const success = await login({ username, password });
      
      if (success) {
        // Перенаправление произойдет автоматически в useEffect,
        // когда обновится состояние isAuthenticated и user
        // Нет необходимости делать перенаправление здесь,
        // т.к. это дублирование логики
      } else {
        setError('Не удалось войти. Пожалуйста, проверьте учетные данные и повторите попытку.');
      }
    } catch (err) {

      setError(err instanceof Error ? err.message : 'Не удалось войти. Пожалуйста, проверьте учетные данные и повторите попытку.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen py-12 px-4 flex items-center justify-center">
      <div className="max-w-md w-full space-y-8 bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-gray-900 dark:text-gray-100 text-[#E95C4B]">
            Вход в UGC Market
          </h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Введите данные для входа в свой аккаунт
          </p>
        </div>

        {error && (
          <Alert variant="destructive" className="border-red-500 bg-red-50 dark:bg-red-900/30">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="ml-2">{error}</AlertDescription>
          </Alert>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <Label htmlFor="username" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Имя пользователя или Email
              </Label>
              <div className="mt-1">
                <Input
                  id="username"
                  name="username"
                  type="text"
                  autoComplete="username"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm"
                  disabled={loading}
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="password" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Пароль
              </Label>
              <div className="mt-1">
                <Input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm"
                  disabled={loading}
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="text-sm">
              <Link 
                to="/forgot-password" 
                className="font-medium text-[#E95C4B] hover:text-[#d54538] dark:text-[#E95C4B] dark:hover:text-[#d54538]"
              >
                Забыли пароль?
              </Link>
            </div>
          </div>

          <div>
            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-[#E95C4B] hover:bg-[#d54538] text-white font-bold rounded-md px-4 py-2"
            >
              {loading ? 'Выполняется вход...' : 'Войти'}
            </Button>
          </div>
        </form>

        <div className="text-center mt-6">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Еще нет аккаунта?{' '}
            <Link 
              to="/register" 
              className="font-medium text-[#E95C4B] hover:text-[#d54538] dark:text-[#E95C4B] dark:hover:text-[#d54538]"
            >
              Зарегистрироваться
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
