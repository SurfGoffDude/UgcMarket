/**
 * Хуки для работы с API расширенного поиска, историей поиска и рекомендациями
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  SearchParams, 
  searchParamsToQueryString,
  SearchHistoryItem,
  SearchHistoryResponse,
  SearchRecommendation
} from '@/types/search';
import { Service } from '@/types/services';
import { Creator } from '@/data/creators';

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
 * Интерфейс для выбранных тегов
 */
export interface SelectedTags {
  [categoryId: string]: string[];
}

/**
 * Типы гендера для фильтрации
 */
export type GenderFilter = 'male' | 'female' | 'prefer_not_to_say' | null;

/**
 * Типы среднего времени ответа для фильтрации
 */
export type ResponseTimeFilter = 'up_to_24_hours' | 'up_to_3_days' | 'up_to_10_days' | 'up_to_14_days' | 'up_to_30_days' | 'up_to_60_days' | 'more_than_60_days' | null;

/**
 * Интерфейс входных фильтров для списка креаторов
 */
interface CreatorListFilters {
  tags: SelectedTags;
  query: string;
  gender: GenderFilter;
  responseTime: ResponseTimeFilter;
}

/**
 * Хук для получения списка всех креаторов с поддержкой фильтрации и поиска
 */

/**
 * Хук для работы со списком креаторов
 * Поддерживает фильтрацию по полу, среднему времени ответа и тегам
 */
export function useCreatorsList(filters?: CreatorListFilters) {
  const [url, setUrl] = useState(`${API_URL}/creator-profiles/`);
  const { data: apiData, loading, error, execute: refetch } = useApiRequest<any>(url, true);
  
  // Отслеживаем финальные отфильтрованные данные
  const [finalData, setFinalData] = useState<Creator[]>([]);
  
  // Добавляем перезагрузку данных при изменении URL
  useEffect(() => {
    if (url) {

      refetch();
    }
  }, [url, refetch]);
  
  // Обновление URL при изменении фильтров
  useEffect(() => {
    if (!filters) {
      setUrl(`${API_URL}/creator-profiles/`);
      return;
    }

    const queryParams = new URLSearchParams();
    
    // Добавление поискового запроса
    if (filters.query) {
      queryParams.append('search', filters.query);
    }
    
    // Добавление пола
    if (filters.gender) {
      queryParams.append('gender', filters.gender);
    }

    // Добавление среднего времени выполнения работы
    if (filters.responseTime) {
      queryParams.append('average_work_time', filters.responseTime);
    }

    // Добавление тегов
    if (filters.tags && Object.keys(filters.tags).length > 0) {
      const tagValues: string[] = [];
      
      Object.entries(filters.tags).forEach(([categoryId, tagIds]) => {
        tagIds.forEach(tagId => {
          // Извлекаем только числовую часть тега для отправки на бэкенд
          // Ожидается формат "tagname-123", где 123 - это ID для бэкенда
          const tagParts = tagId.split('-');
          const numericId = tagParts.length > 1 ? tagParts[tagParts.length - 1] : tagId;
          
          // Проверяем, что ID числовой
          if (!isNaN(Number(numericId))) {
            tagValues.push(numericId);

          }
        });
      });
      
      if (tagValues.length > 0) {
        queryParams.append('tag_ids', tagValues.join(','));
      }
    }
    
    const queryString = queryParams.toString();
    const newUrl = queryString ? `${API_URL}/creator-profiles/?${queryString}` : `${API_URL}/creator-profiles/`;
    

    setUrl(newUrl);
  }, [filters]);
  
  // Обрабатываем полученные от API данные
  useEffect(() => {
    // Извлекаем массив креаторов из API данных, если они приходят в формате { results: [...] }
    const apiCreators = apiData 
      ? (apiData.results && Array.isArray(apiData.results) 
          ? apiData.results 
          : (Array.isArray(apiData) ? apiData : []))
      : [];
    

    
    // Больше не применяем дублирующую фильтрацию на клиенте,
    // так как фильтрация уже была выполнена на сервере через параметры URL
    setFinalData(apiCreators);
  }, [apiData]);
  
  // Добавляем индикацию активных фильтров для UI
  const activeFilters = useMemo(() => {
    if (!filters) return {
      hasActiveFilters: false,
      activeFilterCount: 0,
      filterInfo: {}
    };
    
    const filterInfo: Record<string, any> = {};
    let count = 0;
    
    // Проверяем каждый тип фильтра
    if (filters.query) {
      filterInfo.query = filters.query;
      count++;
    }

    if (filters.gender) {
      filterInfo.gender = filters.gender;
      count++;
    }
    
    if (filters.responseTime) {
      filterInfo.responseTime = filters.responseTime;
      count++;
    }
    
    if (filters.tags && Object.keys(filters.tags).length > 0) {
      const tagCount = Object.values(filters.tags)
        .reduce((sum, tags) => sum + tags.length, 0);
      
      filterInfo.tags = {
        count: tagCount,
        values: filters.tags
      };
      
      if (tagCount > 0) count++;
    }
    
    return {
      hasActiveFilters: count > 0,
      activeFilterCount: count,
      filterInfo
    };
  }, [filters]);
  


  return {
    creators: finalData,
    loading,
    error,
    refetch
  };
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
