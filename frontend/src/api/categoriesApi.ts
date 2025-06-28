import apiClient from './client';

export interface Category {
  id: number;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  parent?: number;
}

/**
 * Получает список категорий.
 * @returns Promise с массивом категорий.
 */
export const fetchCategories = async (): Promise<Category[]> => {
  try {
    const response = await apiClient.get<Category[]>('categories/');
    return response.data;
  } catch (error) {
    console.error('Ошибка при получении категорий:', error);
    throw error;
  }
};

/**
 * Получает информацию о конкретной категории по ID.
 * @param id - ID категории.
 * @returns Promise с данными категории.
 */
export const fetchCategoryById = async (id: number): Promise<Category> => {
  try {
    const response = await apiClient.get<Category>(`categories/${id}/`);
    return response.data;
  } catch (error) {
    console.error(`Ошибка при получении категории с ID ${id}:`, error);
    throw error;
  }
};
