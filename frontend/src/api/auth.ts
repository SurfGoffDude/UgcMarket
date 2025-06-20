import apiClient from './client';
import { AxiosResponse } from 'axios';
import { 
  LoginRequest, 
  LoginResponse, 
  RegisterRequest, 
  User, 
  UserProfile, 
  EmailVerificationRequest
} from '../types/auth';

/**
 * Сервис для работы с API аутентификации и пользовательскими данными
 */
export const authApi = {
  /**
   * Регистрация нового пользователя с детальной обработкой ошибок
   * @param userData - Данные для регистрации
   * @returns Промис с данными зарегистрированного пользователя
   */
  register: async (userData: RegisterRequest): Promise<AxiosResponse<User>> => {
    console.log('Отправка запроса на регистрацию:', { url: 'auth/register/', data: userData });
    try {
      const response = await apiClient.post('auth/register/', userData);
      console.log('Успешный ответ от сервера:', response.data);
      return response;
    } catch (error: any) {
      console.error('Ошибка регистрации:', { 
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        headers: error.response?.headers,
        config: {
          url: error.config?.url,
          method: error.config?.method,
          baseURL: error.config?.baseURL,
          data: error.config?.data
        }
      });
      throw error;
    }
  },

  /**
   * Вход пользователя в систему
   * @param credentials - Логин и пароль
   * @returns Промис с токенами доступа и обновления
   */
  login: (credentials: LoginRequest): Promise<AxiosResponse<LoginResponse>> => {
    return apiClient.post('auth/token/', credentials);
  },

  /**
   * Проверка токена
   * @param token - Токен доступа
   * @returns Промис с результатом проверки
   */
  verifyToken: (token: string): Promise<AxiosResponse<any>> => {
    return apiClient.post('auth/token/verify/', { token });
  },

  /**
   * Обновление токена
   * @param refreshToken - Токен обновления
   * @returns Промис с новым токеном доступа
   */
  refreshToken: (refreshToken: string): Promise<AxiosResponse<{ access: string }>> => {
    return apiClient.post('auth/token/refresh/', { refresh: refreshToken });
  },

  /**
   * Подтверждение email
   * @param data - Данные для верификации email
   * @returns Промис с результатом верификации
   */
  verifyEmail: (data: EmailVerificationRequest): Promise<AxiosResponse<{ message: string }>> => {
    return apiClient.post('auth/verify-email/', data);
  },
  
  /**
   * Получение данных текущего пользователя
   * @returns Промис с данными пользователя
   */
  getCurrentUser: (): Promise<AxiosResponse<User>> => {
    return apiClient.get('users/me/');
  },
  
  /**
   * Получение профиля клиента для текущего пользователя
   * @returns Промис с данными профиля клиента
   */
  getClientProfile: (): Promise<AxiosResponse<UserProfile>> => {
    return apiClient.get('client-profiles/me/');
  },
  
  /**
   * Создание или обновление профиля клиента
   * @param profileData - Данные профиля клиента
   * @returns Промис с обновленным профилем клиента
   */
  updateClientProfile: (profileData: Partial<UserProfile>): Promise<AxiosResponse<UserProfile>> => {
    return apiClient.patch('client-profiles/me/', profileData);
  },
  
  /**
   * Получение профиля креатора для текущего пользователя
   * @param detailed - Включать детальную информацию (навыки и портфолио)
   * @returns Промис с данными профиля креатора
   */
  getCreatorProfile: (detailed: boolean = false): Promise<AxiosResponse<UserProfile>> => {
    return apiClient.get(`creator-profiles/me/?detail=${detailed}`);
  },
  
  /**
   * Создание профиля креатора
   * @param profileData - Данные профиля креатора
   * @returns Промис с созданным профилем креатора
   */
  createCreatorProfile: (profileData: Partial<UserProfile>): Promise<AxiosResponse<UserProfile>> => {
    return apiClient.post('creator-profiles/me/', profileData);
  },
  
  /**
   * Обновление профиля креатора
   * @param profileData - Данные профиля креатора
   * @returns Промис с обновленным профилем креатора
   */
  updateCreatorProfile: (profileData: Partial<UserProfile>): Promise<AxiosResponse<UserProfile>> => {
    return apiClient.patch('creator-profiles/me/', profileData);
  },

  /**
   * Выход пользователя (локальное удаление токенов)
   */
  logout: (): void => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
  }
};

/**
 * Утилита для настройки аутентификации после входа
 * @param tokens - Токены доступа и обновления
 */
export const setupAuth = (tokens: LoginResponse): void => {
  localStorage.setItem('access_token', tokens.access);
  localStorage.setItem('refresh_token', tokens.refresh);
  apiClient.defaults.headers.common['Authorization'] = `Bearer ${tokens.access}`;
};

/**
 * Проверка авторизации пользователя
 * @returns true, если пользователь авторизован
 */
export const isAuthenticated = (): boolean => {
  return !!localStorage.getItem('access_token');
};

export default authApi;