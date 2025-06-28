import apiClient from './client';
import { Service } from '@/types/services';

/**
 * Получает список всех услуг.
 * @returns Promise с массивом услуг.
 */
export const fetchServices = async (): Promise<Service[]> => {
  try {
    const response = await apiClient.get<Service[]>('services/');
    return response.data;
  } catch (error) {
    console.error('Ошибка при получении списка услуг:', error);
    throw error;
  }
};

export const getServiceById = async (id: string): Promise<Service> => {
  try {
    const response = await apiClient.get<Service>(`/services/${id}/`);
    return response.data;
  } catch (error) {
    console.error('Failed to fetch service:', error);
    throw error;
  }
};
