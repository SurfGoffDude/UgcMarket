/**
 * Хуки для работы с API бэкенда
 * 
 * Предоставляет набор React-хуков для запроса данных от API,
 * с поддержкой загрузки, обработки ошибок и кеширования.
 */

import { useState, useEffect, useCallback } from 'react';
import { useAuth as useAuthContext } from '../contexts/AuthContext';
import { CreatorSkill, PortfolioImage, PortfolioItem } from '../types/auth';
import apiClient from '@/api/client';
import api, { RequestParams, ApiResponse } from '@/lib/api';

/**
 * Базовый хук для выполнения запросов к API
 * @param fetchFn - Функция запроса данных
 * @param initialData - Начальные данные
 * @param immediate - Флаг немедленного выполнения запроса
 * @returns Объект с данными, состоянием загрузки, ошибкой и функцией обновления
 */
export function useFetch<T>(
  fetchFn: () => Promise<T>, 
  initialData: T | null = null, 
  immediate = true
) {
  const [data, setData] = useState<T | null>(initialData);
  const [loading, setLoading] = useState(immediate);
  const [error, setError] = useState<Error | null>(null);

  const execute = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await fetchFn();
      setData(result);
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Произошла неизвестная ошибка');
      setError(error);
      return null;
    } finally {
      setLoading(false);
    }
  }, [fetchFn]);

  useEffect(() => {
    if (immediate) {
      execute();
    }
  }, [execute, immediate]);

  return { data, loading, error, execute, setData };
}

/**
 * Хук для получения списка креаторов
 * @param params - Параметры запроса
 * @param immediate - Флаг немедленного выполнения запроса
 * @returns Объект с данными о креаторах, состоянии загрузки, ошибке и функцией обновления
 */
export function useCreators(params?: RequestParams, immediate = true) {
  return useFetch(() => api.getCreators(params), null, immediate);
}

/**
 * Хук для получения информации о креаторе по ID
 * @param id - Идентификатор креатора
 * @param immediate - Флаг немедленного выполнения запроса
 * @returns Объект с данными о креаторе, состоянии загрузки, ошибке и функцией обновления
 */
export function useCreator(id?: string, immediate = true) {
  const fetchCreator = useCallback(async () => {
    if (!id) return null;
    
    try {
      // Получаем основной профиль креатора
      const response = await apiClient.get(`creator-profiles/${id}/?detail=true`);
      const creatorProfile = response.data;
      
      // Получаем навыки креатора
      const skillsResponse = await apiClient.get(`creator-skills/?creator_profile=${id}`);
      creatorProfile.skills = skillsResponse.data.results || [];
      
      // Получаем портфолио креатора
      const portfolioResponse = await apiClient.get(`portfolio/?creator_profile=${id}`);
      creatorProfile.portfolio = portfolioResponse.data.results || [];
      
      // Для каждого элемента портфолио получаем изображения
      for (const item of creatorProfile.portfolio) {
        const imagesResponse = await apiClient.get(`portfolio-images/?portfolio_item=${item.id}`);
        item.images = imagesResponse.data.results || [];
      }
      
      return creatorProfile;
    } catch (error) {

      throw error;
    }
  }, [id]);

  return useFetch(fetchCreator, null, immediate && !!id);
}

/**
 * Хук для работы с профилем креатора текущего пользователя
 * @param id - Опциональный ID профиля креатора (если не указан, используется профиль текущего пользователя)
 * @returns Объект с данными профиля креатора, состоянием загрузки, ошибкой и функцией обновления
 */
export function useCreatorProfile(id?: string) {
  // Используем useAuth из контекста для избежания циклических зависимостей
  const { user } = useAuthContext();
  const [loadingAdditional, setLoadingAdditional] = useState(false);
  
  // Объединяем всю логику загрузки в одной функции
  const { data: creator, loading: loadingMain, error, execute } = useFetch(
    async () => {
      try {

        
        // Получаем основные данные профиля
        let profileData;
        
        // Если ID не указан, получаем данные текущего профиля через новый прямой эндпоинт
        if (!id) {
          try {
            // Используем прямой эндпоинт creator-profile/

            const response = await apiClient.get('creator-profile/');

            profileData = response.data;
          } catch (error) {
            // Если получили 404, значит профиля нет
            if (error.response && error.response.status === 404) {

              return null;
            }

            throw error;
          }
        } else {
          // Получаем данные по конкретному ID (например, для просмотра чужого профиля)

          const response = await apiClient.get(`creator-profiles/${id}/`);

          profileData = response?.data;
        }
        
        // Если профиль не найден, возвращаем null
        if (!profileData) {
          return null;
        }
        
        // Создаем полный объект с дополнительными данными
        const enrichedData = { ...profileData };
        
        try {
          setLoadingAdditional(true);
          
          // Получаем навыки креатора

          const skillsResponse = await apiClient.get(`/creator-skills/?creator_profile=${profileData.id}`);
          enrichedData.skills = skillsResponse.data.results || [];
          
          // Получаем портфолио креатора

          const portfolioResponse = await apiClient.get(`portfolio/?creator_profile=${profileData.id}`);
          const portfolioItems = portfolioResponse.data.results || [];
          
          // Для каждого элемента портфолио получаем изображения (параллельно)
          if (portfolioItems.length > 0) {

            const portfolioWithImages = await Promise.all(
              portfolioItems.map(async (item) => {
                const imagesResponse = await apiClient.get(`/portfolio-images/?portfolio_item=${item.id}`);
                return {
                  ...item,
                  images: imagesResponse.data.results || []
                };
              })
            );
            enrichedData.portfolio = portfolioWithImages;
          } else {
            enrichedData.portfolio = [];
          }

        } catch (error) {
          // Если произошла ошибка при загрузке дополнительных данных,
          // логируем ее, но возвращаем хотя бы основные данные профиля

          enrichedData.loadError = 'Не удалось загрузить все данные профиля';
        } finally {
          setLoadingAdditional(false);
        }
        
        return enrichedData;
      } catch (error) {

        throw error;
      }
    },
    null,
    !!(id || user)
  ); // добавляем creatorData в зависимости для контроля выполнения

  return {
    creator,
    loading: loadingMain || loadingAdditional,
    error,
    reload: execute
  };
}

/**
 * Хук для получения списка сервисов
 * @param params - Параметры запроса
 * @param immediate - Флаг немедленного выполнения запроса
 * @returns Объект с данными о сервисах, состоянии загрузки, ошибке и функцией обновления
 */
export function useServices(params?: RequestParams, immediate = true) {
  const fetchServices = useCallback(async () => {
    try {
      // Получаем список услуг
      const response = await apiClient.get('/services/', { params });
      return response.data;
    } catch (error) {

      throw error;
    }
  }, [JSON.stringify(params)]);

  return useFetch(fetchServices, null, immediate);
}

/**
 * Хук для получения информации о сервисе по slug
 * @param slug - Slug сервиса
 * @param immediate - Флаг немедленного выполнения запроса
 * @returns Объект с данными о сервисе, состоянии загрузки, ошибке и функцией обновления
 */
export function useService(slug?: string, immediate = true) {
  const fetchService = useCallback(() => {
    if (!slug) return Promise.resolve(null);
    return api.getService(slug);
  }, [slug]);

  return useFetch(fetchService, null, immediate && !!slug);
}

/**
 * Хук для получения списка категорий
 * @param immediate - Флаг немедленного выполнения запроса
 * @returns Объект с данными о категориях, состоянии загрузки, ошибке и функцией обновления
 */
export function useCategories(immediate = true) {
  return useFetch(() => api.getCategories(), null, immediate);
}

/**
 * Хук для работы с текущим пользователем
 * @returns Объект с данными о пользователе и методами авторизации
 */
export function useAuth() {
  const [user, setUser] = useState<any | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(!!api.getToken());

  const fetchCurrentUser = useCallback(async () => {
    if (!api.getToken()) {
      setIsAuthenticated(false);
      setUser(null);
      setLoading(false);
      return null;
    }

    try {
      setLoading(true);
      setError(null);
      const userData = await api.getCurrentUser();
      setUser(userData);
      setIsAuthenticated(true);
      return userData;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Ошибка получения данных пользователя'));
      setIsAuthenticated(false);
      api.removeToken();
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const login = useCallback(async (username: string, password: string) => {
    try {
      setLoading(true);
      setError(null);
      await api.login(username, password);
      await fetchCurrentUser();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Ошибка авторизации'));
      return false;
    } finally {
      setLoading(false);
    }
  }, [fetchCurrentUser]);

  const logout = useCallback(() => {
    api.logout();
    setUser(null);
    setIsAuthenticated(false);
  }, []);

  useEffect(() => {
    fetchCurrentUser();
  }, [fetchCurrentUser]);

  return {
    user,
    loading,
    error,
    isAuthenticated,
    login,
    logout,
    refreshUser: fetchCurrentUser,
  };
}

/**
 * Хук для получения данных о профиле клиента по ID
 * @param id - Идентификатор профиля клиента (если null, будет запрошен профиль текущего пользователя)
 * @returns Объект с данными о клиенте, состоянии загрузки и ошибке
 */
export function useClientProfile(id?: string) {
  const { user } = useAuth();
  const [clientData, setClientData] = useState(null);
  
  const { data, loading, error, execute } = useFetch(
    async () => {
      try {


        // Если ID не указан, получаем данные текущего профиля через новый прямой эндпоинт
        if (!id) {
          try {
            // Используем прямой эндпоинт client-profile/

            const response = await apiClient.get('client-profile/');

            return response.data || null;
          } catch (error) {
            // Если получили 404, значит профиля нет
            if (error.response && error.response.status === 404) {

              return null;
            }

            return null;
          }
        } else {
          // Получаем данные по конкретному ID (например, для просмотра чужого профиля)

          const response = await apiClient.get(`client-profiles/${id}/`);

          return response?.data || null;
        }
      } catch (error) {

        throw error;
      }
    },
    null,
    !!(id || user)
  );

  useEffect(() => {
    if (data) {
      // Получаем дополнительные данные о клиенте, если необходимо
      // В текущей версии API не предполагается наличие дополнительных данных, 
      // но мы сохраняем эту возможность для совместимости с будущими версиями API
      setClientData(data);
    }
  }, [data]);

  return {
    client: clientData || data,
    loading,
    error,
    reload: execute
  };
}

// Экспортируем все хуки
export default {
  useFetch,
  useCreators,
  useCreator,
  useClientProfile,
  useServices,
  useService,
  useCategories,
  useAuth,
};
