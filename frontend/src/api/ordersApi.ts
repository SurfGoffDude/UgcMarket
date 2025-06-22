import apiClient from './client';
import { Order } from '@/types/orders';

interface CreateOrderPayload {
  service: number;
  with_modifications: boolean;
  modifications_description?: string;
}

/**
 * Создает новый заказ на основе услуги.
 * @param payload - Данные для создания заказа.
 * @returns - Созданный объект заказа.
 */
export const createOrder = async (payload: CreateOrderPayload): Promise<Order> => {
  try {
    const response = await apiClient.post<Order>('/orders/', payload);
    return response.data;
  } catch (error) {
    console.error('Error creating order:', error);
    throw error;
  }
};
