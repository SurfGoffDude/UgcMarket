/**
 * Хуки для работы с API расширенного поиска, историей поиска и рекомендациями
 */

import { useState, useEffect, useCallback } from 'react';
import { 
  SearchParams, 
  searchParamsToQueryString,
  SearchHistoryItem,
  SearchHistoryResponse,
  SearchRecommendation
} from '@/types/search';
import { Service } from '@/types/services';

const API_URL = import.meta.env.VITE_API_URL || '/api/v1';

/**
 * Универсальный хук для выполнения запросов
 * @param initialFetch - выполнять ли запрос автоматически
 */
function useApiRequest<T>(url: string, initialFetch = false) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [options, setOptions] = useState<RequestInit>({});

  const execute = useCallback(async (requestOptions?: RequestInit) => {
    try {
      setLoading(true);
      setError(null);

      const fetchOptions = requestOptions || options;
      const jwtToken = localStorage.getItem('token');

      const headers: HeadersInit = {
        'Content-Type': 'application/json',
        ...fetchOptions.headers,
      };

      if (jwtToken) {
        headers['Authorization'] = `Bearer ${jwtToken}`;
      }

      const response = await fetch(url, {
        ...fetchOptions,
        headers,
      });

      if (!response.ok) {
        throw new Error(`Ошибка запроса: ${response.status}`);
      }

      const result = await response.json();
      setData(result);
      return result;
    } catch (error) {
      setError(error instanceof Error ? error : new Error('Неизвестная ошибка'));
      return null;
    } finally {
      setLoading(false);
    }
  }, [url, options]);

  // Опционально выполнить запрос при монтировании
  useEffect(() => {
    if (initialFetch) {
      execute();
    }
  }, [initialFetch, execute]);

  return { data, loading, error, execute, setOptions };
}

/**
 * Хук для получения услуг с расширенным поиском
 * @param params - параметры поиска
 * @param initialFetch - выполнять ли запрос автоматически
 */
export function useServiceSearch(params: SearchParams = {}, initialFetch = false) {
  const queryString = searchParamsToQueryString(params);
  const url = `${API_URL}/services/?${queryString}`;
  
  const { data, loading, error, execute } = useApiRequest<{
    count: number;
    next: string | null;
    previous: string | null;
    results: Service[];
  }>(url, initialFetch);

  return { data, loading, error, execute };
}

/**
 * Хук для получения истории поиска
 * @param page - номер страницы
 * @param pageSize - размер страницы
 * @param initialFetch - выполнять ли запрос автоматически
 */
export function useSearchHistory(page = 1, pageSize = 10, initialFetch = false) {
  const url = `${API_URL}/services/search-history/?page=${page}&page_size=${pageSize}`;
  
  const { data, loading, error, execute } = useApiRequest<SearchHistoryResponse>(url, initialFetch);

  return { data, loading, error, execute };
}

/**
 * Хук для очистки истории поиска
 */
export function useClearSearchHistory() {
  const url = `${API_URL}/services/search-history/clear/`;
  
  const { loading, error, execute } = useApiRequest<{status: string}>(url, false);

  const clearHistory = useCallback(async () => {
    return execute({
      method: 'DELETE',
    });
  }, [execute]);

  return { clearHistory, loading, error };
}

/**
 * Хук для добавления просмотренного элемента в историю поиска
 * @param searchHistoryId - ID записи в истории поиска
 */
export function useAddClickedItem(searchHistoryId: number) {
  const url = `${API_URL}/services/search-history/${searchHistoryId}/add_clicked_item/`;
  
  const { loading, error, execute } = useApiRequest<{status: string}>(url, false);

  const addClickedItem = useCallback(async (itemId: number) => {
    return execute({
      method: 'POST',
      body: JSON.stringify({ item_id: itemId }),
    });
  }, [execute]);

  return { addClickedItem, loading, error };
}

/**
 * Хук для получения рекомендаций поиска
 */
export function useSearchRecommendations(initialFetch = false) {
  const url = `${API_URL}/services/search-recommendations/`;
  
  const { data, loading, error, execute } = useApiRequest<SearchRecommendation[]>(url, initialFetch);

  return { data, loading, error, execute };
}

/**
 * Хук для получения рекомендуемых услуг
 */
export function useRelatedServices(initialFetch = false) {
  const url = `${API_URL}/services/related-services/`;
  
  const { data, loading, error, execute } = useApiRequest<{
    count: number;
    next: string | null;
    previous: string | null;
    results: Service[];
  }>(url, initialFetch);

  return { data, loading, error, execute };
}

/**
 * Хук для получения доступных фильтров для поисковой формы
 * Загружает категории, платформы и языки с сервера
 */
export function useFilterOptions(initialFetch = true) {
  // Общая структура данных для фильтров
  interface FilterData {
    platforms: Array<{id: number; name: string; service_count?: number}>;
    categories: Array<{id: number; name: string; service_count?: number}>;
    languages: Array<{id: number; name: string; service_count?: number}>;
  }
  
  const [data, setData] = useState<FilterData | null>(null);
  const [filters, setFilters] = useState<any[]>([]); // Преобразованные фильтры для UI
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchFilters = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Параллельная загрузка всех фильтров
      const [platformsRes, categoriesRes, languagesRes] = await Promise.all([
        fetch(`${API_URL}/platforms/`),
        fetch(`${API_URL}/categories/`),
        fetch(`${API_URL}/languages/`)
      ]);

      if (!platformsRes.ok || !categoriesRes.ok || !languagesRes.ok) {
        throw new Error('Ошибка при загрузке фильтров');
      }

      const platforms = await platformsRes.json();
      const categories = await categoriesRes.json();
      const languages = await languagesRes.json();

      const filterData: FilterData = { platforms, categories, languages };
      setData(filterData);
      
      // Преобразование данных в формат для фильтров UI
      const formattedFilters = [
        {
          id: 'platforms',
          name: 'Платформа',
          options: platforms.map((p: any) => ({
            value: p.id.toString(),
            label: p.name,
            count: p.service_count || 0
          }))
        },
        {
          id: 'category',
          name: 'Категория',
          options: categories.map((c: any) => ({
            value: c.id.toString(),
            label: c.name,
            count: c.service_count || 0
          }))
        },
        {
          id: 'languages',
          name: 'Языки',
          options: languages.map((l: any) => ({
            value: l.id.toString(),
            label: l.name,
            count: l.service_count || 0
          }))
        }
      ];
      
      setFilters(formattedFilters);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Неизвестная ошибка при загрузке фильтров'));
      console.error('Ошибка при загрузке фильтров:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (initialFetch) {
      fetchFilters();
    }
  }, [fetchFilters, initialFetch]);

  return { data, filters, loading, error, refetch: fetchFilters };
}
