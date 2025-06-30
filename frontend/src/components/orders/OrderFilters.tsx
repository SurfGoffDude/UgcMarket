/**
 * Компонент фильтрации заявок по тегам и поиску
 */

import React, { useState, useEffect } from 'react';
import { X, Search, Filter, ChevronDown, ChevronUp } from 'lucide-react';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import apiClient from '@/api/client';

// Интерфейсы для тегов и категорий
export interface Tag {
  id: number;
  name: string;
  slug: string; // Добавляем slug для соответствия структуре бэкенда
}

export interface TagCategory {
  id: string;
  name: string;
  tags: Tag[];
}

export interface SelectedTags {
  [categoryId: string]: string[];
}

export interface OrderFiltersProps {
  onFilterChange: (filters: { tags: SelectedTags; query: string }) => void;
  initialFilters?: { tags: SelectedTags; query: string };
}

// Интерфейс для данных, получаемых от API
interface CategoryResponse {
  id: number;
  name: string;
  slug: string;
  description?: string;
  tags: Tag[];
}

// Функция для преобразования категорий из API в формат, используемый в компоненте
const transformCategories = (apiCategories: CategoryResponse[]): TagCategory[] => {
  // Создаем Map для предотвращения дублирования категорий
  const categoryMap = new Map<string, TagCategory>();
  
  apiCategories.forEach(category => {
    // Фильтруем категории с пустыми тегами
    if (category.tags && category.tags.length > 0) {
      const categoryId = category.slug;
      
      // Если категория уже существует в Map, добавляем к ней новые теги без дублирования
      if (categoryMap.has(categoryId)) {
        const existingCategory = categoryMap.get(categoryId)!;
        const existingTagIds = new Set(existingCategory.tags.map(t => t.id));
        
        // Добавляем только новые теги
        const newTags = category.tags.filter(tag => !existingTagIds.has(tag.id));
        if (newTags.length > 0) {
          existingCategory.tags = [...existingCategory.tags, ...newTags.map(tag => ({
            id: tag.id,
            name: tag.name,
            slug: tag.slug
          }))];
        }
      } else {
        // Добавляем новую категорию в Map
        categoryMap.set(categoryId, {
          id: categoryId,
          name: category.name,
          tags: category.tags.map(tag => ({
            id: tag.id,
            name: tag.name,
            slug: tag.slug
          }))
        });
      }
    }
  });
  
  // Преобразуем Map в массив и сортируем категории по имени
  return Array.from(categoryMap.values())
    .sort((a, b) => a.name.localeCompare(b.name));
};

const OrderFilters: React.FC<OrderFiltersProps> = ({ onFilterChange, initialFilters = { tags: {}, query: '' } }) => {
  const [searchQuery, setSearchQuery] = useState(initialFilters.query);
  const [inputValue, setInputValue] = useState(initialFilters.query);
  const [selectedTags, setSelectedTags] = useState<SelectedTags>(initialFilters.tags);
  const [tagCategories, setTagCategories] = useState<TagCategory[]>([]);
  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Загрузка категорий и тегов с бэкенда
  useEffect(() => {
    const fetchCategoriesAndTags = async () => {
      try {
        setIsLoading(true);
        console.log('Начинаем загрузку категорий и тегов...');

        // Загружаем категории
        const categoriesResponse = await apiClient.get('/categories/');
        const categories = categoriesResponse.data.results || [];
        console.log('Загружено категорий:', categories.length);
        
        // Загружаем теги с типом 'order'
        const tagsResponse = await apiClient.get('/tags/', {
          params: {
            type: 'order'
          }
        });

        // Проверяем структуру ответа для получения массива тегов
        const allTags = tagsResponse.data.results ? tagsResponse.data.results : [];
        console.log('Загружено тегов с типом order:', allTags.length);
        
        // Выведем структуру первого тега для отладки
        if (allTags.length > 0) {
          console.log('Пример тега:', JSON.stringify(allTags[0], null, 2));
        }
        
        // Создаем Map для уникальных категорий        
        const categoryMap = new Map<string, any>();
        
        // Добавляем уникальные категории из API
        const uniqueCategories = new Set<string>();
        categories.forEach(category => {
          // Проверяем уникальность по имени
          if (!uniqueCategories.has(category.name)) {
            uniqueCategories.add(category.name);
            categoryMap.set(category.name, {
              ...category,
              tags: []
            });
          }
        });
        
        console.log('Всего уникальных категорий:', categoryMap.size);
        
        // Счётчики для отладки
        let tagsWithCategory = 0;
        let tagsMatchedToCategory = 0;
        
        // Группируем теги по категориям на стороне фронтенда
        allTags.forEach((tag: any) => {
          // Добавляем логику проверки разных вариантов категорий
          let categoryName = null;
          
          // Проверяем разные варианты структуры поля category
          if (tag.category) {
            tagsWithCategory++;
            if (typeof tag.category === 'string') {
              categoryName = tag.category;
            } else if (typeof tag.category === 'object' && tag.category.name) {
              categoryName = tag.category.name;
            }
          }
          
          if (categoryName && categoryMap.has(categoryName)) {
            tagsMatchedToCategory++;
            const categoryData = categoryMap.get(categoryName);
            categoryData.tags.push(tag);
          }
        });
        
        console.log(`Тегов с категориями: ${tagsWithCategory}, успешно сопоставлено с категориями: ${tagsMatchedToCategory}`);
        
        // Выведем все категории для отладки
        console.log('Категории в Map:', Array.from(categoryMap.keys()));
        
        // Преобразуем Map в массив и сохраняем ВСЕ категории, даже если в них нет тегов
        const allCategories: CategoryResponse[] = [];
        categoryMap.forEach((categoryData) => {
          allCategories.push(categoryData);
        });
        
        console.log('Всего категорий:', allCategories.length);
        console.log('Категории без тегов:', allCategories.filter(cat => cat.tags.length === 0).length);
        allCategories.forEach(cat => {
          console.log(`Категория ${cat.name}: тегов ${cat.tags.length}`);
        });
        
        // Преобразуем данные в нужный формат
        const transformedCategories = allCategories.map(category => ({
          id: category.slug, // Используем slug категории как id
          name: category.name,
          // Добавляем отладочный вывод для тегов
          tags: category.tags.map((tag: any) => {
            console.log(`Тег ${tag.name}: id=${tag.id}, slug=${tag.slug || 'отсутствует'}`);
            return {
              id: tag.id,
              name: tag.name,
              slug: tag.slug || `tag-${tag.id}` // Используем slug или генерируем из id
            };
          })
        }));
        
        console.log('Преобразованных категорий:', transformedCategories.length);
        setTagCategories(transformedCategories);
        
        // Если есть хотя бы одна категория, раскрываем её
        if (transformedCategories.length > 0) {
          setExpandedCategories([transformedCategories[0].id]);
        }
      } catch (error) {
        console.error('Ошибка при загрузке категорий и тегов:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCategoriesAndTags();
  }, []);

  // Обработчик изменения текста в поле поиска
  const handleSearchInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  // Обработчик подтверждения поиска
  const handleSearchSubmit = () => {
    setSearchQuery(inputValue);
    onFilterChange({
      tags: selectedTags,
      query: inputValue
    });
  };

  // Обработчик изменения выбранных тегов
  const handleTagChange = (categoryId: string, tagId: number, tagSlug: string, checked: boolean) => {
    setSelectedTags(prev => {
      const newSelectedTags = { ...prev };
      
      // Если категория еще не существует, создаем ее
      if (!newSelectedTags[categoryId]) {
        newSelectedTags[categoryId] = [];
      }

      // Добавляем или удаляем тег в зависимости от состояния
      if (checked) {
        if (!newSelectedTags[categoryId].includes(tagSlug)) {
          newSelectedTags[categoryId] = [...newSelectedTags[categoryId], tagSlug];
        }
      } else {
        newSelectedTags[categoryId] = newSelectedTags[categoryId].filter(slug => slug !== tagSlug);
        
        // Если категория пуста, удаляем ее
        if (newSelectedTags[categoryId].length === 0) {
          delete newSelectedTags[categoryId];
        }
      }

      return newSelectedTags;
    });
  };

  // Обработчик сброса фильтров
  const handleReset = () => {
    setSelectedTags({});
    setInputValue('');
    setSearchQuery('');
    onFilterChange({ tags: {}, query: '' });
  };

  // Обработчик применения фильтров
  const handleApplyFilters = () => {
    onFilterChange({ tags: selectedTags, query: searchQuery });
  };

  // Обработчик удаления выбранного тега
  const handleRemoveTag = (categoryId: string, tagId: number, tagSlug: string) => {
    handleTagChange(categoryId, tagId, tagSlug, false);
  };

  // Получение всех выбранных тегов для отображения
  const getSelectedTagsArray = () => {
    const selectedTagsArray: { categoryId: string; tagId: number; tagSlug: string; tagName: string; categoryName: string }[] = [];

    Object.entries(selectedTags).forEach(([categoryId, tagSlugs]) => {
      // Находим категорию
      const category = tagCategories.find(cat => cat.id === categoryId);
      if (!category) return;

      // Для каждого тега в категории
      tagSlugs.forEach(tagSlug => {
        const tag = category.tags.find(t => t.slug === tagSlug);
        if (!tag) return;

        // Добавляем информацию о выбранном теге
        selectedTagsArray.push({
          categoryId,
          tagId: tag.id,
          tagSlug: tag.slug,
          tagName: tag.name,
          categoryName: category.name
        });
      });
    });

    return selectedTagsArray;
  };

  // Обработчик переключения раскрытия категории
  const toggleCategory = (categoryId: string) => {
    setExpandedCategories(prev => {
      if (prev.includes(categoryId)) {
        return prev.filter(id => id !== categoryId);
      } else {
        return [...prev, categoryId];
      }
    });
  };

  return (
    <div className="mb-8 bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
      <div className="mb-4">
        <div className="relative flex items-center gap-2">
          <div className="relative flex-1">
            <Search 
              className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" 
            />
            <Input
              placeholder="Поиск заявок..."
              value={inputValue}
              onChange={handleSearchInput}
              onKeyDown={(e) => e.key === 'Enter' && handleSearchSubmit()}
              className="pl-10 w-full"
            />
          </div>
          <Button 
            onClick={handleSearchSubmit}
            size="sm"
            className="whitespace-nowrap"
          >
            Найти
          </Button>
        </div>
      </div>

      {/* Отображение выбранных тегов */}
      {getSelectedTagsArray().length > 0 && (
        <div className="mb-4">
          <p className="text-sm font-medium mb-2">Выбранные теги:</p>
          <div className="flex flex-wrap gap-2">
            {getSelectedTagsArray().map(({ categoryId, tagId, tagSlug, tagName, categoryName }) => (
              <Badge 
                key={`${categoryId}-${tagSlug}`} 
                variant="secondary"
                className="flex items-center gap-1 px-2 py-1"
              >
                <span className="text-xs">{categoryName}: {tagName}</span>
                <button
                  onClick={() => handleRemoveTag(categoryId, tagId, tagSlug)}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Аккордеон с категориями тегов */}
      <div className="mb-4">
        <p className="text-sm font-medium mb-2 flex items-center">
          <Filter className="h-4 w-4 mr-2" />
          Фильтры по тегам
        </p>
        
        {isLoading ? (
          <p className="text-sm text-gray-500">Загрузка тегов...</p>
        ) : (
          <div className="border rounded-md">
            {tagCategories.map((category) => (
              <div key={category.id} className="border-b last:border-b-0">
                <div 
                  className="flex justify-between items-center p-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700"
                  onClick={() => toggleCategory(category.id)}
                >
                  <span className="font-medium">{category.name}</span>
                  {expandedCategories.includes(category.id) ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </div>
                
                {expandedCategories.includes(category.id) && (
                  <div className="p-3 pt-0">
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                      {category.tags.map((tag) => (
                        <div key={tag.id} className="flex items-center space-x-2">
                          <Checkbox 
                            id={`order-${category.id}-${tag.id}`}
                            checked={selectedTags[category.id]?.includes(tag.slug) || false}
                            onCheckedChange={(checked) => {
                              handleTagChange(category.id, tag.id, tag.slug, checked === true);
                            }}
                          />
                          <label 
                            htmlFor={`order-${category.id}-${tag.id}`}
                            className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                          >
                            {tag.name}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex justify-end space-x-2">
        <Button variant="outline" onClick={handleReset}>
          Сбросить
        </Button>
        <Button onClick={handleApplyFilters}>
          Применить фильтры
        </Button>
      </div>
    </div>
  );
};

export default OrderFilters;
