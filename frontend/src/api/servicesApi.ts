import apiClient from './client';
import { Service } from '@/types/services';

export const getServiceById = async (id: string): Promise<Service> => {
  try {
    const response = await apiClient.get<Service>(`/services/${id}/`);
    return response.data;
  } catch (error) {
    console.error('Failed to fetch service:', error);
    throw error;
  }
};
