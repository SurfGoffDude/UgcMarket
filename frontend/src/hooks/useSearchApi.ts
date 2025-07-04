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
 * Интерфейс для выбранных тегов
 */
export interface SelectedTags {
  [categoryId: string]: string[];
}

/**
 * Хук для получения списка всех креаторов с поддержкой фильтрации и поиска
 */
// Импортируем мок-данные креаторов для использования при недоступности API
import { creators as mockCreators } from '@/data/creators';

export function useCreatorsList(filters?: { tags: SelectedTags; query: string }) {
  const [url, setUrl] = useState(`${API_URL}/creator-profiles/`);
  const { data: apiData, loading, error, execute: refetch } = useApiRequest<any>(url, true);
  
  // Добавляем перезагрузку данных при изменении URL
  useEffect(() => {
    if (url) {
      console.log('%c[DEBUG] URL изменился, перезагружаем данные:', 'color: #4CAF50; font-weight: bold', url);
      refetch();
    }
  }, [url, refetch]);
  
  // Используем мок-данные, если API недоступен
  const rawData = apiData || mockCreators;
  
  // Применяем локальную фильтрацию к мок-данным, если нет данных из API
  const [filteredData, setFilteredData] = useState(rawData);
  
  // Применяем локальную фильтрацию, если используем мок-данные
  useEffect(() => {
    // Извлекаем массив креаторов из API данных, если они приходят в формате { results: [...] }
    const apiCreators = apiData 
      ? (apiData.results && Array.isArray(apiData.results) 
          ? apiData.results 
          : (Array.isArray(apiData) ? apiData : []))
      : null;

    // Если фильтры отсутствуют или пустые, показываем всех креаторов
    if (!filters || 
        (!filters.query && (!filters.tags || Object.keys(filters.tags).length === 0))) {
      setFilteredData(apiCreators || mockCreators);
      return;
    }
    
    if (!apiData) {
      // Фильтрация мок-данных на клиенте
      let result = [...mockCreators];
      
      // Фильтрация по поисковому запросу
      if (filters.query) {
        const query = filters.query.toLowerCase();
        result = result.filter(creator => 
          creator.name.toLowerCase().includes(query) || 
          creator.username.toLowerCase().includes(query) ||
          (creator.description && creator.description.toLowerCase().includes(query))
        );
      }
      
      // Фильтрация по тегам
      if (filters.tags && Object.keys(filters.tags).length > 0) {
        const tagValues: string[] = [];
        Object.entries(filters.tags).forEach(([categoryId, tagIds]) => {
          tagIds.forEach(tagId => {
            const tagValue = tagId.startsWith('#') ? tagId.substring(1) : tagId;
            tagValues.push(tagValue);
          });
        });
        
        if (tagValues.length > 0) {
          // Если есть выбранные теги, фильтруем креаторов по наличию этих тегов
          result = result.filter(creator => {
            if (!creator.tags || !Array.isArray(creator.tags)) return false;
            
            // Проверяем, есть ли хотя бы один тег у креатора, совпадающий с выбранными
            return tagValues.some(tagValue => 
              creator.tags?.some(creatorTag => 
                creatorTag.toLowerCase() === tagValue.toLowerCase()
              )
            );
          });
        }
      }
      
      // Устанавливаем отфильтрованные данные
      setFilteredData(result);
    } else {
      // Если есть данные из API, извлекаем из них массив креаторов
      setFilteredData(apiCreators || []);
    }
  }, [apiData, filters, mockCreators]);

  // Обновление URL при изменении фильтров
  useEffect(() => {
    if (!filters) {
      setUrl(`${API_URL}/creator-profiles/`);
      return;
    }

    let queryParams = new URLSearchParams();
    
    // Добавление поискового запроса
    if (filters.query) {
      queryParams.append('search', filters.query);
    }
    
    // Добавление тегов
    // Преобразуем ID тегов в их текстовые значения для поиска
    const tagValues: string[] = [];
    
    Object.entries(filters.tags).forEach(([categoryId, tagIds]) => {
      // Преобразуем ID тегов в формат, который соответствует тегам креаторов
      tagIds.forEach(tagId => {
        // Теги креаторов хранятся в формате "делает-под-родителей" (без # в начале)
        const tagValue = tagId.startsWith('#') ? tagId.substring(1) : tagId;
        tagValues.push(tagValue);
      });
    });
    
    if (tagValues.length > 0) {
      queryParams.append('tags', tagValues.join(','));
    }
    
    const queryString = queryParams.toString();
    setUrl(`${API_URL}/creator-profiles/${queryString ? `?${queryString}` : ''}`);
  }, [filters]);

  // Django REST Framework часто возвращает пагинированные данные в объекте { results: [...] }.
  // Этот код проверяет, есть ли поле results, и возвращает его.
  // В противном случае, он возвращает сами данные (если ответ не пагинирован).
  
  // Дополнительная проверка фильтрации для несуществующих тегов
  let finalData = filteredData;
  
  // Если есть выбранные теги, проверяем наличие этих тегов у креаторов
  if (filters?.tags && Object.keys(filters.tags).length > 0) {
    const tagValues: string[] = [];
    Object.entries(filters.tags).forEach(([categoryId, tagIds]) => {
      tagIds.forEach(tagId => {
        const tagValue = tagId.startsWith('#') ? tagId.substring(1) : tagId;
        tagValues.push(tagValue.toLowerCase());
      });
    });
    
    if (tagValues.length > 0 && Array.isArray(finalData)) {
      // Дебаг-информация для проверки тегов
      console.log('%c[DEBUG] Проверка тегов:', 'color: #FF5722; font-weight: bold', {
        tagValues,
        creatorsTags: finalData.map(creator => creator.tags || [])
      });
      
      // Фильтруем креаторов по наличию выбранных тегов
      finalData = finalData.filter(creator => {
        if (!creator.tags || !Array.isArray(creator.tags)) return false;
        
        // Преобразуем теги креатора в нижний регистр
        const lowerCaseCreatorTags = creator.tags.map(tag => tag.toLowerCase());
        
        // Проверяем разные варианты совпадения
        const hasMatchingTag = tagValues.some(tagValue => {
          // Точное совпадение
          const exactMatch = lowerCaseCreatorTags.includes(tagValue);
          
          // Проверка на содержание
          const containsMatch = lowerCaseCreatorTags.some(creatorTag => 
            creatorTag.includes(tagValue) || tagValue.includes(creatorTag)
          );
          
          // Проверка с удалением спецсимволов
          const tagValueWithoutDashes = tagValue.replace(/-/g, ' ');
          const containsMatchWithoutDashes = lowerCaseCreatorTags.some(creatorTag => {
            const creatorTagWithoutDashes = creatorTag.replace(/-/g, ' ');
            return creatorTagWithoutDashes.includes(tagValueWithoutDashes) || 
                  tagValueWithoutDashes.includes(creatorTagWithoutDashes);
          });
          
          return exactMatch || containsMatch || containsMatchWithoutDashes;
        });
        
        return hasMatchingTag;
      });
    }
  }
  
  // Возвращаем отфильтрованные данные или пустой массив, если данных нет
  return { 
    creators: Array.isArray(finalData) ? finalData : [], 
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
