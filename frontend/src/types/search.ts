/**
 * Типы данных для расширенного поиска, истории запросов и рекомендаций
 */

import { Service } from './services';

/**
 * Параметры расширенного поиска услуг
 */
export interface SearchParams {
  search?: string;
  title?: string;
  description?: string;
  min_price?: number;
  max_price?: number;
  category?: string | number | (string | number)[];
  category_slug?: string;
  creator?: number;
  is_active?: boolean;
  min_delivery_time?: number;
  max_delivery_time?: number;
  platforms?: string | number | (string | number)[];
  languages?: string | number | (string | number)[];
  min_creator_rating?: number;
  max_creator_rating?: number;
  min_service_rating?: number;
  max_service_rating?: number;
  min_reviews_count?: number;
  is_featured?: boolean;
  min_completed_orders?: number;
  created_after?: string;
  created_before?: string;
  updated_after?: string;
  updated_before?: string;
  ordering?: string;
  page?: number;
  page_size?: number;
}

/**
 * Запись в истории поиска
 */
export interface SearchHistoryItem {
  id: number;
  username: string;
  user_id: number;
  query: string;
  filters: Record<string, any>;
  results_count: number;
  created_at: string;
  clicked_items: number[];
}

/**
 * Ответ API с историей поиска
 */
export interface SearchHistoryResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: SearchHistoryItem[];
}

/**
 * Рекомендация поискового запроса
 */
export interface SearchRecommendation {
  query: string;
  count: number;
  last_used: string;
  relevance_score: number;
  filters: Record<string, any>;
}

/**
 * Отформатированный вариант фильтров для UI
 */
export interface FilterOption {
  id: string;
  name: string;
  options: {
    value: string;
    label: string;
    count?: number;
  }[];
}

/**
 * Опция сортировки
 */
export interface SortOption {
  name: string;
  value: string;
}

/**
 * Преобразование параметров поиска в строку запроса
 */
export function searchParamsToQueryString(params: SearchParams): string {
  const queryParams = new URLSearchParams();
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      if (Array.isArray(value)) {
        queryParams.append(key, value.join(','));
      } else {
        queryParams.append(key, String(value));
      }
    }
  });
  
  return queryParams.toString();
}

/**
 * Парсинг строки запроса в объект параметров поиска
 */
export function queryStringToSearchParams(queryString: string): SearchParams {
  const params = new URLSearchParams(queryString);
  const searchParams: SearchParams = {};
  
  params.forEach((value, key) => {
    // Проверяем, является ли ключ допустимым ключом в SearchParams
    if (key in Object.keys(searchParams) || true) {
      // Числовые параметры
      if (key.includes('_price') || key.includes('_rating') || 
          key.includes('_time') || key.includes('_count') || 
          key === 'page' || key === 'page_size' || key === 'creator') {
        (searchParams as Record<string, any>)[key] = parseFloat(value);
      } 
      // Булевы параметры
      else if (key === 'is_active' || key === 'is_featured') {
        (searchParams as Record<string, any>)[key] = value === 'true';
      } 
      // Массивы
      else if (key === 'category' || key === 'platforms' || key === 'languages') {
        // Разделяем значения, разделенные запятой
        (searchParams as Record<string, any>)[key] = value.includes(',') ? 
          value.split(',') : value;
      } 
      // Строки по умолчанию
      else {
        (searchParams as Record<string, any>)[key] = value;
      }
    }
  });
  
  return searchParams;
}
