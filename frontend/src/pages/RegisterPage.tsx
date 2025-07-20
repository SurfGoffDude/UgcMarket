import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useAuth } from '@/contexts/AuthContext';
import { RegisterRequest } from '@/types/auth';

/**
 * Страница регистрации нового пользователя
 * 
 * Позволяет пользователю создать новый аккаунт в системе UGC Market
 * с выбором типа пользователя (клиент или креатор)
 * 
 * @returns {JSX.Element} Компонент страницы регистрации
 */
const RegisterPage: React.FC = () => {
  // Получаем функции из контекста аутентификации
  const { register, isAuthenticated } = useAuth();
  // Сначала инициализируем navigate
  const navigate = useNavigate();

  // Перенаправляем на главную страницу, если пользователь уже авторизован
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  const [formData, setState] = useState({
    username: '',
    email: '',
    first_name: '',
    last_name: '',
    password: '',
    password_confirm: '',
    phone: '',
    user_type: 'client' as 'client' | 'creator' // значение по умолчанию с явным указанием типа
  });
  
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string[]>>({});

  /**
   * Обрабатывает изменение полей формы
   * @param e - Событие изменения поля
   */
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setState({
      ...formData,
      [name]: value,
    });
  };

  /**
   * Обрабатывает отправку формы регистрации
   * @param e - Событие отправки формы
   */
  /**
   * Обрабатывает отправку формы регистрации с расширенной диагностикой ошибок
   * @param e - Событие отправки формы
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Сбрасываем ошибки перед новой отправкой
    setError(null);
    setErrors({});
    

    
    // Проверяем совпадение паролей
    if (formData.password !== formData.password_confirm) {

      setErrors({
        password_confirm: ['Пароли не совпадают']
      });
      return;
    }

    // Проверка на принятие условий
    if (!acceptTerms) {

      setError('Необходимо принять условия пользовательского соглашения');
      return;
    }

    setLoading(true);


    try {
      // Подготавливаем данные для регистрации - явно указываем все обязательные поля
      // Мы преобразуем формат данных в точное соответствие с RegisterRequest
      const userData = {
        username: formData.username || '',
        email: formData.email || '',
        password: formData.password || '',
        password_confirm: formData.password_confirm || '',
        first_name: formData.first_name || '',
        last_name: formData.last_name || '',
        phone: formData.phone || '',
        user_type: formData.user_type || 'client'
      } as RegisterRequest;

      // Вызываем метод регистрации из контекста аутентификации
      let success;
      try {
        success = await register(userData);
      } catch (registerError: any) {
        // Обрабатываем ошибки валидации от сервера
        if(registerError?.response?.data && typeof registerError.response.data === 'object') {
          // Если есть данные об ошибках валидации
          const serverErrors = registerError.response.data;

          
          // Устанавливаем ошибки в состояние компонента
          setErrors(serverErrors);
          setLoading(false);
          return; // Прерываем выполнение функции
        }
        
        // Если это не ошибка валидации или нет данных об ошибках, показываем общую ошибку
        setError('Произошла ошибка при регистрации. Пожалуйста, попробуйте еще раз.');
        setLoading(false);
        return;
      }
      
      if (success) {

        // Перенаправляем на страницу подтверждения email
        navigate('/email-verification', { 
          state: { email: formData.email } 
        });
        return;
      } else {

        setError('Не удалось зарегистрироваться. Пожалуйста, попробуйте еще раз.');
      }
    } catch (err: any) {

      
      // Улучшенная обработка ошибок валидации с бэкенда
      if (err.response) {
        if (typeof err.response.data === 'object') {
          setErrors(err.response.data);
        } else {
          const errorMessage = typeof err.response.data === 'string' ? err.response.data : 'Ошибка сервера';

          setError(errorMessage);
        }
      } else if (err.request) {
        console.error('Запрос был отправлен, но ответ не получен:', err.request);
        setError('Сервер не отвечает. Пожалуйста, проверьте подключение к интернету и попробуйте еще раз.');
      } else {
        console.error('Ошибка при настройке запроса или другая ошибка:', err.message);
        setError(err.message || 'Не удалось зарегистрироваться. Пожалуйста, попробуйте еще раз.');
      }
    } finally {

      setLoading(false);
    }
  };

  /**
   * Рендерит сообщение об ошибке для конкретного поля
   * @param field - Имя поля
   * @returns JSX.Element | null
   */
  const renderFieldError = (field: string) => {
    if (errors[field] && errors[field].length > 0) {
      return (
        <p className="text-xs text-red-500 mt-1">
          {errors[field][0]}
        </p>
      );
    }
    return null;
  };

  return (
    <div className="min-h-screen py-12 px-4 flex items-center justify-center">
      <div className="max-w-md w-full space-y-8 bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-gray-900 dark:text-gray-100 text-[#E95C4B]">
            Регистрация в UGC Market
          </h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Создайте свой аккаунт для доступа к платформе
          </p>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm space-y-4">
            <div>
              <Label htmlFor="username" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Имя пользователя*
              </Label>
              <div className="mt-1">
                <Input
                  id="username"
                  name="username"
                  type="text"
                  autoComplete="username"
                  required
                  value={formData.username}
                  onChange={handleChange}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm"
                  disabled={loading}
                />
                {renderFieldError('username')}
              </div>
            </div>

            <div>
              <Label htmlFor="email" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Email*
              </Label>
              <div className="mt-1">
                <Input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm"
                  disabled={loading}
                />
                {renderFieldError('email')}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="first_name" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Имя
                </Label>
                <div className="mt-1">
                  <Input
                    id="first_name"
                    name="first_name"
                    type="text"
                    autoComplete="given-name"
                    value={formData.first_name}
                    onChange={handleChange}
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm"
                    disabled={loading}
                  />
                  {renderFieldError('first_name')}
                </div>
              </div>

              <div>
                <Label htmlFor="last_name" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Фамилия
                </Label>
                <div className="mt-1">
                  <Input
                    id="last_name"
                    name="last_name"
                    type="text"
                    autoComplete="family-name"
                    value={formData.last_name}
                    onChange={handleChange}
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm"
                    disabled={loading}
                  />
                  {renderFieldError('last_name')}
                </div>
              </div>
            </div>
            
            <div>
              <Label htmlFor="phone" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Номер телефона*
              </Label>
              <div className="mt-1">
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  autoComplete="tel"
                  required
                  value={formData.phone}
                  onChange={handleChange}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm"
                  disabled={loading}
                  placeholder="+7 (999) 123-45-67"
                />
                {renderFieldError('phone')}
              </div>
            </div>

            <div>
              <Label htmlFor="password" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Пароль*
              </Label>
              <div className="mt-1">
                <Input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm"
                  disabled={loading}
                />
                {renderFieldError('password')}
              </div>
            </div>

            <div>
              <Label htmlFor="password_confirm" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Подтверждение пароля*
              </Label>
              <div className="mt-1">
                <Input
                  id="password_confirm"
                  name="password_confirm"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={formData.password_confirm}
                  onChange={handleChange}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm"
                  disabled={loading}
                />
                {renderFieldError('password_confirm')}
              </div>
            </div>
          </div>

          <div>
            <div className="text-center mb-4">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Я хочу использовать платформу как:
              </p>
            </div>

            <div className="flex space-x-4 justify-center">
              <button 
                type="button"
                className={`flex flex-col items-center p-4 rounded-lg border transition-all ${formData.user_type === 'client' ? 'border-[#E95C4B] bg-[#E95C4B]/10 dark:bg-[#E95C4B]/20' : 'border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'}`}
                onClick={() => setState({...formData, user_type: 'client'})}
              >
                <span className={`font-medium mb-1 ${formData.user_type === 'client' ? 'text-[#E95C4B]' : 'text-gray-600 dark:text-gray-400'}`}>
                  Клиент
                </span>
                <p className="text-xs text-center text-gray-500 dark:text-gray-400 max-w-[140px] m-0">
                  Я хочу заказывать услуги на платформе
                </p>
              </button>
              
              <button 
                type="button"
                className={`flex flex-col items-center p-4 rounded-lg border transition-all ${formData.user_type === 'creator' ? 'border-[#E95C4B] bg-[#E95C4B]/10 dark:bg-[#E95C4B]/20' : 'border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'}`}
                onClick={() => setState({...formData, user_type: 'creator'})}
              >
                <span className={`font-medium mb-1 ${formData.user_type === 'creator' ? 'text-[#E95C4B]' : 'text-gray-600 dark:text-gray-400'}`}>
                  Креатор
                </span>
                <p className="text-xs text-center text-gray-500 dark:text-gray-400 max-w-[140px] m-0">
                  Я хочу предоставлять услуги на платформе
                </p>
              </button>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox 
              id="acceptTerms" 
              checked={acceptTerms}
              onCheckedChange={() => setAcceptTerms(!acceptTerms)} 
            />
            <Label 
              htmlFor="acceptTerms" 
              className="text-sm text-gray-700 dark:text-gray-300"
            >
              Я принимаю <Link to="/terms" className="text-[#E95C4B] hover:underline">условия пользовательского соглашения</Link> и <Link to="/privacy" className="text-[#E95C4B] hover:underline">политику конфиденциальности</Link>*
            </Label>
          </div>

          <div>
            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-[#E95C4B] hover:bg-[#d54538] text-white font-bold rounded-md px-4 py-2"
            >
              {loading ? 'Создание аккаунта...' : 'Зарегистрироваться'}
            </Button>
          </div>
        </form>

        <div className="text-center mt-6">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Уже есть аккаунт?{' '}
            <Link 
              to="/login" 
              className="font-medium text-[#E95C4B] hover:text-[#d54538] dark:text-[#E95C4B] dark:hover:text-[#d54538]"
            >
              Войти
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;