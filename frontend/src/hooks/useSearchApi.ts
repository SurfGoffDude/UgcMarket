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

const API_URL = import.meta.env.VITE_API_URL || '/api';

// --- Вспомогательные хуки и функции ---

function useApiRequest<T>(url: string, initialFetch = false) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const execute = useCallback(async (requestOptions?: RequestInit) => {
    setLoading(true);
    setError(null);
    try {
      const jwtToken = localStorage.getItem('access_token');
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
        ...requestOptions?.headers,
      };
      if (jwtToken) {
        headers['Authorization'] = `Bearer ${jwtToken}`;
      }

      const response = await fetch(url, { ...requestOptions, headers });
      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(`Ошибка запроса: ${response.status} ${response.statusText}. ${errorData?.detail || ''}`);
      }
      const result = await response.json();
      setData(result);
      return result;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Неизвестная ошибка'));
      return null;
    } finally {
      setLoading(false);
    }
  }, [url]);

  useEffect(() => {
    if (initialFetch) {
      execute();
    }
  }, [initialFetch, execute]);

  return { data, loading, error, execute };
}

// --- Основные хуки ---

/**
 * Хук для поиска услуг с пагинацией
 */
export function useServiceSearch(params: SearchParams, page: number) {
  const [services, setServices] = useState<Service[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const queryString = searchParamsToQueryString({ ...params, page });
      const url = `${API_URL}/services/search/?${queryString}`;
      const jwtToken = localStorage.getItem('token');
      const headers: HeadersInit = { 'Content-Type': 'application/json' };
      if (jwtToken) {
        headers['Authorization'] = `Bearer ${jwtToken}`;
      }

      const response = await fetch(url, { headers });
      if (!response.ok) throw new Error('Ошибка при загрузке услуг');
      
      const data = await response.json();
      setServices(prev => page === 1 ? data.results : [...prev, ...data.results]);
      setHasMore(data.next !== null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Неизвестная ошибка'));
    } finally {
      setLoading(false);
    }
  }, [params, page]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { services, loading, error, refetch, hasMore };
}

/**
 * Хук для управления историей поиска
 */
export function useSearchHistory() {
  const url = `${API_URL}/search-history/`;
  const { data, loading, error, execute: refetch } = useApiRequest<SearchHistoryResponse>(url, true);
  return { history: data?.results || [], loading, error, refetch };
}

/**
 * Хук для получения рекомендаций по поиску
 */
export function useSearchRecommendations(query: string) {
  const url = `${API_URL}/search-recommendations/?q=${query}`;
  const { data, loading, error } = useApiRequest<SearchRecommendation[]>(url, !!query);
  return { recommendations: data, loading, error };
}

/**
 * Хук для отслеживания кликов по элементам (заглушка)
 */
export function useAddClickedItem() {
  const addClickedItem = useCallback((itemId: number) => {
    console.log(`Отслеживание клика по элементу ${itemId}. Логика еще не реализована.`);
  }, []);
  return { addClickedItem };
}

// --- Хуки для фильтров ---

export interface FilterOption {
  value: string;
  label: string;
  count: number;
}

export interface Filter {
  id: string;
  name: string;
  options: FilterOption[];
}

/**
 * Хук для получения данных для фильтров
 */
/**
 * Хук для получения списка всех креаторов
 */
export function useCreatorsList() {
  const url = `${API_URL}/creator-profiles/`;
  const { data, loading, error, execute: refetch } = useApiRequest<any>(url, true);

  // Django REST Framework часто возвращает пагинированные данные в объекте { results: [...] }.
  // Этот код проверяет, есть ли поле results, и возвращает его.
  // В противном случае, он возвращает сами данные (если ответ не пагинирован).
  const creatorsList = data && data.results && Array.isArray(data.results) ? data.results : data;

  return { creators: creatorsList || [], loading, error, refetch };
}

export function useFilterOptions(initialFetch = true) {
  const [filters, setFilters] = useState<Filter[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchFilters = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const skillsRes = await fetch(`${API_URL}/skills/`);
      if (!skillsRes.ok) throw new Error('Ошибка при загрузке фильтров');
      const skills = await skillsRes.json();

      const formattedFilters: Filter[] = [
        {
          id: 'skills',
          name: 'Навыки',
          options: skills.map((s: any) => ({
            value: s.id.toString(),
            label: s.name,
            count: s.creator_count || 0,
          })),
        },
      ];
      setFilters(formattedFilters);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Неизвестная ошибка'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (initialFetch) {
      fetchFilters();
    }
  }, [initialFetch, fetchFilters]);

  return { filters, loading, error, refetch: fetchFilters };
}
