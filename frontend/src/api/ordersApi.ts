import apiClient from './client';
import { Order } from '@/types/orders';

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
    console.log('Заказ успешно создан:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('Ошибка при создании заказа:', error);
    // Лучшая обработка ошибок с дополнительной информацией
    if (error.response) {
      console.error('Данные ответа:', error.response.data);
      console.error('Статус ответа:', error.response.status);
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
    console.log('Отправка данных для создания произвольного заказа:', payload);
    const response = await apiClient.post<Order>('orders/custom/', payload);
    console.log('Произвольный заказ успешно создан:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('Ошибка при создании произвольного заказа:', error);
    if (error.response) {
      console.error('Данные ответа:', error.response.data);
      console.error('Статус ответа:', error.response.status);
    }
    throw error;
  }
};
