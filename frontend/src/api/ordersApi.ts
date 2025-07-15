import apiClient from './client';
import { Order } from '@/types/orders';

// Интерфейсы для тегов с бэкенда
export interface BackendTag {
  id: number;
  name: string;
  slug: string;
  category?: number; // ID категории, если есть
  string_id: string; // Строковый ID тега в формате tag-{id}
}

interface TagsResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: BackendTag[];
}

interface CreateOrderPayload {
  service: number;
  with_modifications: boolean;
  modifications_description?: string;
}

interface CustomOrderPayload {
  title: string;
  description: string;
  budget: number;
  deadline: string;
  is_private?: boolean;
  target_creator_id?: number;
  tags_ids?: number[];
  references?: string[];
  attachments?: File[];
}

export type { CreateOrderPayload, CustomOrderPayload };

/**
 * Создает новый заказ на основе услуги.
 * @param payload - Данные для создания заказа.
 * @returns - Созданный объект заказа.
 */
export const createOrder = async (payload: CreateOrderPayload): Promise<Order> => {
  try {
    // Эндпоинт со слешем на конце для совместимости с Django APPEND_SLASH
    const response = await apiClient.post<Order>('orders/', payload);

    return response.data;
  } catch (error: any) {
    // Обработка ошибок
    if (error.response) {
      // Обработка ответа от сервера с ошибкой
    }
    throw error;
  }
};

/**
 * Создает новый произвольный заказ с указанными параметрами.
 * @param payload - Параметры для создания произвольного заказа.
 * @returns - Созданный объект заказа.
 */
export const createCustomOrder = async (payload: CustomOrderPayload): Promise<Order> => {
  try {
    const response = await apiClient.post<Order>('orders/custom/', payload);
    return response.data;
  } catch (error: any) {
    // Обработка ошибок
    if (error.response) {
      // Обработка ответа от сервера с ошибкой
    }
    throw error;
  }
};

/**
 * Получает детальную информацию о заказе по его ID.
 * @param orderId - ID заказа.
 * @returns - Объект заказа с детальной информацией.
 */
export const getOrder = async (orderId: number): Promise<Order> => {
  try {
    const url = `orders/${orderId}/`;
    const response = await apiClient.get<Order>(url);
    return response.data;
  } catch (error: any) {
    // Обработка ошибок
    if (error.response) {
      // Обработка ответа от сервера с ошибкой
    }
    throw error;
  }
};

/**
 * Получает список всех заказов с пагинацией.
 * @param page - Номер страницы (необязательный).
 * @param filters - Объект с фильтрами (необязательный).
 * @returns - Объект с результатами и метаданными пагинации.
 */
export const getOrders = async (page?: number, filters?: Record<string, any>) => {
  try {
    let url = 'orders/';
    const params: Record<string, any> = {};
    
    if (page) {
      params.page = page;
    }
    
    if (filters) {
      Object.assign(params, filters);
    }
    
    const response = await apiClient.get(url, { params });
    return response.data;
  } catch (error: any) {

    if (error.response) {


    }
    throw error;
  }
};

/**
 * Принять заказ в работу креатором.
 * @param orderId - ID заказа.
 * @returns - Обновленный объект заказа.
 */
export const acceptOrder = async (orderId: number): Promise<Order> => {
  try {
    const response = await apiClient.post<Order>(`orders/${orderId}/accept/`);

    return response.data;
  } catch (error: any) {
    if (error.response) {
    }
    throw error;
  }
};

/**
 * Доставить заказ с файлами и комментарием.
 * @param orderId - ID заказа.
 * @param formData - Данные для доставки (файлы и сообщение).
 * @returns - Обновленный объект заказа.
 */
export const deliverOrder = async (orderId: number, formData: FormData): Promise<Order> => {
  try {
    const response = await apiClient.post<Order>(`orders/${orderId}/deliver/`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });

    return response.data;
  } catch (error: any) {
    // Обработка ошибок
    if (error.response) {
      // Обработка ответа от сервера с ошибкой
    }
    throw error;
  }
};

/**
 * Запросить доработку заказа.
 * @param orderId - ID заказа.
 * @param reason - Причина запроса доработки.
 * @returns - Обновленный объект заказа.
 */
export const requestRevision = async (orderId: number, reason: string): Promise<Order> => {
  try {
    const response = await apiClient.post<Order>(`orders/${orderId}/request-revision/`, { reason });

    return response.data;
  } catch (error: any) {
    // Обработка ошибок
    if (error.response) {
      // Обработка ответа от сервера с ошибкой
    }
    throw error;
  }
};

/**
 * Завершить заказ.
 * @param orderId - ID заказа.
 * @param comment - Опциональный комментарий при завершении.
 * @returns - Обновленный объект заказа.
 */
export const completeOrder = async (orderId: number, comment?: string): Promise<Order> => {
  try {
    const response = await apiClient.post<Order>(`orders/${orderId}/complete/`, comment ? { comment } : {});

    return response.data;
  } catch (error: any) {
    // Обработка ошибок
    if (error.response) {
      // Обработка ответа от сервера с ошибкой
    }
    throw error;
  }
};

/**
 * Отменить заказ.
 * @param orderId - ID заказа.
 * @param reason - Причина отмены заказа.
 * @returns - Обновленный объект заказа.
 */
export const cancelOrder = async (orderId: number, reason: string): Promise<Order> => {
  try {
    const response = await apiClient.post<Order>(`orders/${orderId}/cancel/`, { reason });

    return response.data;
  } catch (error: any) {
    // Обработка ошибок
    if (error.response) {
      // Обработка ответа от сервера с ошибкой
    }
    throw error;
  }
};

/**
 * Открыть спор по заказу.
 * @param orderId - ID заказа.
 * @param reason - Причина открытия спора.
 * @returns - Обновленный объект заказа.
 */
export const openDispute = async (orderId: number, reason: string): Promise<Order> => {
  try {
    const response = await apiClient.post<Order>(`orders/${orderId}/dispute/`, { reason });

    return response.data;
  } catch (error: any) {
    // Обработка ошибок
    if (error.response) {
      // Обработка ответа от сервера с ошибкой
    }
    throw error;
  }
};

/**
 * Получает список всех тегов с бэкенда.
 * @returns - Ответ API с тегами
 */
export const getTags = async (): Promise<BackendTag[]> => {
  try {
    const response = await apiClient.get<TagsResponse | BackendTag[]>('tags/');

    
    // Проверяем, в каком формате пришел ответ с тегами
    // Если это пагинированный результат (TagsResponse), то берем results
    if (response.data && 'results' in response.data && Array.isArray(response.data.results)) {

      return response.data.results;
    }
    // Если это просто массив, то возвращаем его
    if (Array.isArray(response.data)) {

      return response.data;
    }
    
    // Если ничего не подходит, возвращаем пустой массив

    return [];
  } catch (error: any) {
    // Обработка ошибок
    if (error.response) {
      // Обработка ответа от сервера с ошибкой
    }
    throw error;
  }
};

/**
 * Получить список последних публичных заказов
 * @param limit - Ограничение на количество возвращаемых заказов
 * @returns Объект с результатами запроса, содержащий массив заказов
 */
export const fetchLatestPublicOrders = async (limit = 4): Promise<{ count: number; results: any[]; next: string | null; previous: string | null }> => {
  try {
    const response = await apiClient.get('orders/', {
      params: {
        is_private: false,
        page_size: limit,
        ordering: '-created_at'
      }
    });
    
    return response.data;
  } catch (error: any) {
    console.error('Ошибка при загрузке последних публичных заказов:', error);
    throw error;
  }
};

