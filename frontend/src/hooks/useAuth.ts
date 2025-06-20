/**
 * Хук для работы с аутентификацией пользователя
 * 
 * Предоставляет информацию о состоянии аутентификации, 
 * текущем пользователе и методы для входа/выхода
 */
import { useState, useEffect } from 'react';
import { AuthState, User, RegisterData, AuthHook } from '../types/auth';

/**
 * Хук для работы с авторизацией пользователя
 * @returns Объект с состоянием авторизации и методами работы с ней
 */
const useAuth = (): AuthHook => {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    user: null,
    token: localStorage.getItem('authToken'),
    loading: true
  });

  // Загрузка данных пользователя при инициализации
  useEffect(() => {
    const loadUser = async () => {
      const token = localStorage.getItem('authToken');
      
      if (!token) {
        setAuthState({
          isAuthenticated: false,
          token: null,
          user: null,
          loading: false
        });
        return;
      }

      try {
        const response = await fetch('/api/auth/user/', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const user = await response.json();
          setAuthState({
            isAuthenticated: true,
            token,
            user,
            loading: false
          });
        } else {
          // Токен недействителен
          localStorage.removeItem('authToken');
          setAuthState({
            isAuthenticated: false,
            token: null,
            user: null,
            loading: false
          });
        }
      } catch (error) {
        console.error('Ошибка при загрузке пользователя:', error);
        setAuthState(prev => ({ ...prev, loading: false }));
      }
    };

    loadUser();
  }, []);

  /**
   * Вход пользователя в систему
   * @param username имя пользователя или email
   * @param password пароль
   * @returns успешность входа
   */
  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      const response = await fetch('/api/auth/token/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, password })
      });

      if (response.ok) {
        const data = await response.json();
        // Сохраняем токен и обновляем состояние
        // Сохраняем токен по двум ключам для совместимости
        localStorage.setItem('authToken', data.access);
        localStorage.setItem('access_token', data.access);
        console.log('Токен сохранен в localStorage');
        
        // Загружаем данные пользователя
        const userResponse = await fetch('/api/auth/user/', {
          headers: {
            'Authorization': `Bearer ${data.access}`
          }
        });
        
        if (userResponse.ok) {
          const user = await userResponse.json();
          setAuthState({
            isAuthenticated: true,
            token: data.token,
            user,
            loading: false
          });
          return true;
        }
      }
      
      return false;
    } catch (error) {
      console.error('Ошибка при входе:', error);
      return false;
    }
  };

  /**
   * Выход пользователя из системы
   */
  const logout = () => {
    localStorage.removeItem('authToken');
    setAuthState({
      isAuthenticated: false,
      token: null,
      user: null,
      loading: false
    });
  };

  /**
   * Регистрация нового пользователя
   */
  const register = async (userData: RegisterData): Promise<boolean> => {
    try {
      const response = await fetch('/api/auth/register/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(userData)
      });

      if (response.ok) {
        // После успешной регистрации сразу входим в систему
        return await login(userData.username, userData.password);
      }
      
      return false;
    } catch (error) {
      console.error('Ошибка при регистрации:', error);
      return false;
    }
  };

  return {
    ...authState,
    login,
    logout,
    register
  };
};

// Экспорт хука аутентификации
export default useAuth;

// Экспорт типа для хука
export type { AuthHook };

