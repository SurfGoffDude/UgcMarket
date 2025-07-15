import apiClient from './client';
import { Creator } from '@/types/creators';

/**
 * Интерфейс для запроса креаторов с пагинацией
 */
interface CreatorsResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Creator[];
}

/**
 * Получить список всех креаторов с пагинацией
 * @param page - Номер страницы
 * @param pageSize - Количество элементов на странице
 * @returns Ответ с пагинацией и списком креаторов
 */
export const fetchCreators = async (page = 1, pageSize = 10): Promise<CreatorsResponse> => {
  try {
    const response = await apiClient.get<CreatorsResponse>('creator-profiles/', {
      params: {
        page,
        page_size: pageSize,
      },
    });
    return response.data;
  } catch (error) {
    console.error('Ошибка при загрузке списка креаторов:', error);
    throw error;
  }
};

/**
 * Получить топ-креаторов по рейтингу и количеству заказов
 * @param limit - Ограничение на количество возвращаемых креаторов
 * @returns Массив популярных креаторов
 */
export const fetchTopCreators = async (limit = 4): Promise<Creator[]> => {
  try {
    // Получаем креаторов, отсортированных по рейтингу и активности
    const response = await apiClient.get<CreatorsResponse>('creator-profiles/', {
      params: {
        ordering: '-rating,-completed_orders_count',
        page_size: limit,
      },
    });
    return response.data.results || [];
  } catch (error) {
    console.error('Ошибка при загрузке топ-креаторов:', error);
    throw error;
  }
};

/**
 * Получить информацию о креаторе по ID
 * @param id - ID креатора
 * @returns Объект с данными креатора
 */
export const fetchCreatorById = async (id: string | number): Promise<Creator> => {
  try {
    const response = await apiClient.get<Creator>(`creator-profiles/${id}/`);
    return response.data;
  } catch (error) {
    console.error(`Ошибка при загрузке креатора с ID ${id}:`, error);
    throw error;
  }
};