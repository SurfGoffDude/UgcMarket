import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';

// Базовая конфигурация для axios
const apiConfig: AxiosRequestConfig = {
  baseURL: 'http://localhost:8000/api', // Убрали слеш в конце для предотвращения двойных слешей
  timeout: 30000, // 30 секунд таймаут
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
};

// Создание экземпляра axios с базовой конфигурацией
const apiClient: AxiosInstance = axios.create(apiConfig);



// Перехватчик для добавления токена авторизации ко всем запросам
apiClient.interceptors.request.use(
  (config) => {
    // Пробуем получить токен сначала по ключу 'authToken', затем по 'access_token'
    let token = localStorage.getItem('authToken');
    if (!token) {
      token = localStorage.getItem('access_token');
    }
    
    // Детальный лог запроса API
    // Корректное формирование URL для логирования
    let fullUrl = '';
    if (config.baseURL && config.url) {
      // Убедимся, что между baseURL и url есть только один слеш
      if (config.baseURL.endsWith('/') && config.url.startsWith('/')) {
        fullUrl = `${config.baseURL}${config.url.substring(1)}`;
      } else if (!config.baseURL.endsWith('/') && !config.url.startsWith('/')) {
        fullUrl = `${config.baseURL}/${config.url}`;
      } else {
        fullUrl = `${config.baseURL}${config.url}`;
      }
    } else {
      fullUrl = `${config.baseURL || ''}${config.url || ''}`;
    }
    

    
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {

    return Promise.reject(error);
  }
);

// Перехватчик ответов для обработки ошибок
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    // Логируем успешные ответы, особенно для профиля креатора

    return response;
  },
  async (error) => {
    // Обработка ошибок API

    const originalRequest = error.config;
    
    // Если ошибка 401 (не авторизован) и не было попытки обновления токена
    if (error.response?.status === 401 && !originalRequest._retry) {

      originalRequest._retry = true;
      
      try {
        // Пытаемся обновить токен
        const refreshToken = localStorage.getItem('refresh_token');
        if (!refreshToken) {
          // Если нет токена обновления, выход из системы
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          return Promise.reject(error);
        }
        
        // Запрос на обновление токена
        const response = await axios.post(
          `${apiConfig.baseURL}auth/token/refresh/`,
          { refresh: refreshToken },
          { headers: { 'Content-Type': 'application/json' } }
        );
        
        if (response.data.access) {
          // Сохраняем новый токен
          localStorage.setItem('access_token', response.data.access);
          
          // Обновляем заголовок авторизации и повторяем запрос
          apiClient.defaults.headers.common['Authorization'] = `Bearer ${response.data.access}`;
          return apiClient(originalRequest);
        }
      } catch (refreshError) {
        // Если не удалось обновить токен, выход из системы
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);

export default apiClient;