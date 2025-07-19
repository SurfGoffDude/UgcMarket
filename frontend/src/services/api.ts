import axios from 'axios';

/**
 * Преднастроенный экземпляр axios для взаимодействия с API бэкенда.
 *
 * @property {string} baseURL - Базовый URL для всех API-запросов.
 * @property {object} headers - Стандартные заголовки, отправляемые с каждым запросом.
 */
const api = axios.create({
  baseURL: 'http://127.0.0.1:8000', // Правильный порт для бэкенда
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Перехватчик запросов (request interceptor).
 * 
 * Этот перехватчик автоматически добавляет токен авторизации к каждому
 * исходящему запросу, если токен доступен в localStorage.
 * Это избавляет от необходимости добавлять заголовок Authorization вручную при каждом вызове API.
 */
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token'); // Токен хранится под ключом 'access_token'
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;

// ВОЗМОЖНЫЕ РАСШИРЕНИЯ:
// 1. Добавить перехватчик ответов (response interceptor) для централизованной обработки ошибок API (например, 401 Unauthorized для перенаправления на страницу логина).
// 2. Реализовать механизм обновления токена (token refresh), если ваше API использует краткоживущие access-токены и refresh-токены.
// 3. Внедрить более сложную логику управления состоянием загрузки или ошибок, возможно, с интеграцией с глобальным стейт-менеджером (Redux, Zustand).
