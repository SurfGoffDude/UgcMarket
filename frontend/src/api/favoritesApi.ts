/**
 * API клиент для работы с избранными креаторами.
 * 
 * Этот модуль предоставляет функции для взаимодействия с backend API
 * для управления избранными креаторами клиентов.
 */

import apiClient from './client';

/**
 * Интерфейс для избранного креатора
 */
export interface FavoriteCreator {
  id: number;
  creator: {
    id: number;
    user: {
      id: number;
      username: string;
      first_name: string;
      last_name: string;
      avatar: string;
      is_verified: boolean;
    };
    creator_name?: string;
    bio?: string;
    categories?: Array<{
      id: number;
      name: string;
      slug: string;
    }>;
    rating?: number;
    reviews_count?: number;
    services_count?: number;
    base_price?: number;
    location?: string;
    is_online?: boolean;
    response_time?: string;
    completion_rate?: number;
  };
  created_at: string;
}

/**
 * Интерфейс для создания избранного креатора
 */
export interface CreateFavoriteCreator {
  creator_id: number;
}

/**
 * Интерфейс для проверки статуса избранного
 */
export interface FavoriteStatus {
  is_favorite: boolean;
  creator_id: number;
}

/**
 * API для работы с избранными креаторами
 */
export const favoritesApi = {
  /**
   * Получить список избранных креаторов текущего пользователя
   * 
   * @returns Promise<FavoriteCreator[]> Список избранных креаторов
   */
  getFavorites: async (): Promise<FavoriteCreator[]> => {
    const response = await apiClient.get('/favorite-creators/');
    console.log('API response for favorites:', response.data);
    // Если ответ содержит results (пагинация), возвращаем results, иначе сами данные
    return response.data.results || response.data;
  },

  /**
   * Добавить креатора в избранное
   * 
   * @param creatorId ID креатора для добавления в избранное
   * @returns Promise<FavoriteCreator> Созданная запись избранного
   */
  addToFavorites: async (creatorId: number): Promise<FavoriteCreator> => {
    const response = await apiClient.post('/favorite-creators/', {
      creator_id: creatorId
    });
    return response.data;
  },

  /**
   * Удалить креатора из избранного по ID записи
   * 
   * @param favoriteId ID записи избранного для удаления
   * @returns Promise<void>
   */
  removeFromFavorites: async (favoriteId: number): Promise<void> => {
    await apiClient.delete(`/favorite-creators/${favoriteId}/`);
  },

  /**
   * Удалить креатора из избранного по ID креатора
   * 
   * @param creatorId ID креатора для удаления из избранного
   * @returns Promise<void>
   */
  removeFromFavoritesByCreatorId: async (creatorId: number): Promise<void> => {
    await apiClient.delete(`/favorite-creators/remove/?creator_id=${creatorId}`);
  },

  /**
   * Проверить, находится ли креатор в избранном
   * 
   * @param creatorId ID креатора для проверки
   * @returns Promise<FavoriteStatus> Статус избранного
   */
  checkFavoriteStatus: async (creatorId: number): Promise<FavoriteStatus> => {
    const response = await apiClient.get(`/favorite-creators/check/?creator_id=${creatorId}`);
    return response.data;
  },

  /**
   * Переключить статус избранного для креатора
   * 
   * Удобная функция, которая автоматически добавляет или удаляет креатора
   * из избранного в зависимости от текущего статуса.
   * 
   * @param creatorId ID креатора
   * @returns Promise<boolean> Новый статус избранного (true = добавлен, false = удален)
   */
  toggleFavorite: async (creatorId: number): Promise<boolean> => {
    try {
      const status = await favoritesApi.checkFavoriteStatus(creatorId);
      
      if (status.is_favorite) {
        // Удаляем из избранного
        await favoritesApi.removeFromFavoritesByCreatorId(creatorId);
        return false;
      } else {
        // Добавляем в избранное
        await favoritesApi.addToFavorites(creatorId);
        return true;
      }
    } catch (error) {
      console.error('Ошибка при переключении статуса избранного:', error);
      throw error;
    }
  }
};

export default favoritesApi;