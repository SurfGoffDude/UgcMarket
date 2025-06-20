import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import authApi, { setupAuth, isAuthenticated } from '../api/auth';
import { User, AuthState, RegisterRequest, LoginRequest } from '../types/auth';

// Создаем интерфейс для контекста авторизации
interface AuthContextType extends AuthState {
  login: (credentials: LoginRequest) => Promise<boolean>;
  register: (userData: RegisterRequest) => Promise<boolean>;
  logout: () => void;
  updateUser: (user: User) => void;
}

// Создаем контекст с начальными значениями
const AuthContext = createContext<AuthContextType | null>(null);

// Провайдер контекста авторизации
export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const navigate = useNavigate();

  // Начальное состояние авторизации
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: isAuthenticated(),
    user: null,
    token: localStorage.getItem('access_token'),
    loading: true
  });

  // Эффект для проверки авторизации при загрузке приложения
  useEffect(() => {
    const checkAuth = async () => {
      if (authState.token) {
        try {
          const response = await authApi.getCurrentUser();
          console.log('Данные пользователя при проверке авторизации:', response.data);
          console.log('Поля профиля креатора:', {
            has_creator_profile: response.data.has_creator_profile,
            creator_profile_id: response.data.creator_profile_id
          });
          setAuthState(prev => ({
            ...prev,
            isAuthenticated: true,
            user: response.data,
            loading: false
          }));
        } catch (error) {
          console.error('Ошибка при получении данных пользователя:', error);
          // Если токен недействителен, выходим из системы
          handleLogout();
        }
      } else {
        setAuthState(prev => ({
          ...prev,
          loading: false
        }));
      }
    };

    checkAuth();
  }, []);

  // Функция входа в систему
  const handleLogin = async (credentials: LoginRequest): Promise<boolean> => {
    try {
      const response = await authApi.login(credentials);
      const { access, refresh } = response.data;

      // Настраиваем авторизацию с полученными токенами
      setupAuth({ access, refresh });

      // Получаем данные текущего пользователя
      const userResponse = await authApi.getCurrentUser();

      setAuthState({
        isAuthenticated: true,
        user: userResponse.data,
        token: access,
        loading: false
      });

      return true;
    } catch (error) {
      console.error('Ошибка при входе в систему:', error);
      return false;
    }
  };

  // Функция регистрации
  const handleRegister = async (userData: RegisterRequest): Promise<boolean> => {
    try {
      await authApi.register(userData);
      
      // Уведомление об успешной регистрации и необходимости подтвердить email
      // (здесь может быть интеграция с системой оповещений)
      
      return true;
    } catch (error) {
      console.error('Ошибка при регистрации:', error);
      return false;
    }
  };

  // Функция выхода из системы
  const handleLogout = (): void => {
    authApi.logout();
    setAuthState({
      isAuthenticated: false,
      user: null,
      token: null,
      loading: false
    });
    navigate('/login');
  };

  // Функция обновления данных пользователя
  const updateUser = (user: User): void => {
    setAuthState(prev => ({
      ...prev,
      user
    }));
  };

  // Предоставляем контекст в дочерние компоненты
  return (
    <AuthContext.Provider
      value={{
        ...authState,
        login: handleLogin,
        register: handleRegister,
        logout: handleLogout,
        updateUser
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Хук для использования контекста авторизации
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  
  if (!context) {
    throw new Error('useAuth должен использоваться внутри AuthProvider');
  }
  
  return context;
};

export default AuthContext;