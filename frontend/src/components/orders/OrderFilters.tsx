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
slug: string;
category?: {
  id: number;
  name: string;
} | number | string;
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

const OrderFilters: React.FC<OrderFiltersProps> = ({ onFilterChange, initialFilters = { tags: {}, query: '' } }) => {
const [searchQuery, setSearchQuery] = useState(initialFilters.query);
const [inputValue, setInputValue] = useState(initialFilters.query);
const [selectedTags, setSelectedTags] = useState<SelectedTags>(initialFilters.tags);
const [tagCategories, setTagCategories] = useState<TagCategory[]>([]);
const [expandedCategories, setExpandedCategories] = useState<string[]>([]);
const [isLoading, setIsLoading] = useState(true);

// Отслеживаем изменения в выбранных тегах и автоматически применяем фильтры
useEffect(() => {
  onFilterChange({ tags: selectedTags, query: searchQuery });
}, [selectedTags, searchQuery]);

// Загрузка категорий и тегов с бэкенда
useEffect(() => {
  const fetchCategoriesAndTags = async () => {
    try {
      setIsLoading(true);
      
      // Получаем все доступные теги с типом 'order'
      const tagsResponse = await apiClient.get('/tags/', {
        params: {
          type: 'order'
        }
      });
      
      // Получаем массив тегов из ответа API
      let tags = [];
      if (tagsResponse.data && Array.isArray(tagsResponse.data)) {
        tags = tagsResponse.data;
      } else if (tagsResponse.data && Array.isArray(tagsResponse.data.results)) {
        tags = tagsResponse.data.results;
      }
      
      // Логируем полученные теги для отладки

      
      // API уже должен возвращать только теги с типом 'order' благодаря фильтрации на бэкенде
      // Если теги все равно не отфильтрованы, можно добавить дополнительную проверку
      if (tags.length > 0 && tags.some(tag => tag.type !== 'order')) {
        console.warn('API вернул теги неправильного типа, применяем дополнительную фильтрацию');
        tags = tags.filter(tag => tag.type === 'order');
      }
      
      // Собираем уникальные категории из тегов
      const uniqueCategories = new Set();
      tags.forEach(tag => {
        if (tag.category && typeof tag.category === 'string') {
          uniqueCategories.add(tag.category);
        } else if (tag.category && typeof tag.category === 'object' && tag.category.name) {
          uniqueCategories.add(tag.category.name);
        }
      });
      
      // Создаем массив категорий из уникальных имен
      const categories = Array.from(uniqueCategories).map(catName => ({
        id: String(catName).replace(/\s+/g, '_').toLowerCase(),
        name: String(catName)
      }));
      
      // Логируем извлеченные категории для отладки

      
      // Группируем теги по категориям
      const groupedTags = groupTagsByCategories(tags, categories);
      
      setTagCategories(groupedTags);
      
      // Если есть хотя бы одна категория, раскрываем её
      if (groupedTags.length > 0) {
        setExpandedCategories([groupedTags[0].id]);
      }
    } catch (error) {
      console.error('Ошибка при загрузке тегов и категорий:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  fetchCategoriesAndTags();
}, []);

// Функция для группировки тегов по категориям
const groupTagsByCategories = (tags: any[], categories: any[]): TagCategory[] => {
  // Создаем Map для хранения категорий и их тегов
  const categoryMap = new Map<string, TagCategory>();
  
  // Обрабатываем каждый тег
  tags.forEach(tag => {
    if (!tag || !tag.name) return; // Пропускаем невалидные теги
    
    let categoryId: string | null = null;
    let categoryName: string | null = null;
    
    // Определяем категорию тега
    if (tag.category) {
      if (typeof tag.category === 'object' && tag.category.name) {
        // Если категория - это объект с name
        categoryId = String(tag.category.name).replace(/\s+/g, '_').toLowerCase();
        categoryName = tag.category.name;
      } else if (typeof tag.category === 'string') {
        // Если категория - это строка (имя категории)
        categoryId = tag.category.replace(/\s+/g, '_').toLowerCase();
        categoryName = tag.category;
      }
    }
    
    // Если категория не определена, добавляем тег в категорию "Другое"
    if (!categoryId || !categoryName) {
      categoryId = 'other';
      categoryName = 'Прочее';
    }
    
    // Добавляем категорию в Map, если её еще нет
    if (!categoryMap.has(categoryId)) {
      categoryMap.set(categoryId, {
        id: categoryId,
        name: categoryName,
        tags: []
      });
    }
    
    // Добавляем тег в соответствующую категорию
    const category = categoryMap.get(categoryId)!;
    
    // Убедимся, что у тега есть slug, если нет - создадим его из id или name
    const tagSlug = tag.slug || `tag-${tag.id || tag.name.toLowerCase().replace(/\s+/g, '-')}`;
    
    category.tags.push({
      id: tag.id || 0,
      name: tag.name,
      slug: tagSlug
    });
  });
  
  // Преобразуем Map в массив категорий
  const result = Array.from(categoryMap.values())
    .map(category => ({
      ...category,
      // Сортируем теги по имени
      tags: category.tags.sort((a, b) => a.name.localeCompare(b.name))
    }));
  
  // Сортируем категории по имени
  return result.sort((a, b) => a.name.localeCompare(b.name));
};

// Обработчик изменения текста в поле поиска
const handleSearchInput = (e: React.ChangeEvent<HTMLInputElement>) => {
  setInputValue(e.target.value);
};

// Обработчик подтверждения поиска
const handleSearchSubmit = () => {
  setSearchQuery(inputValue);
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
  
  // Автоматически применяем фильтры после небольшой задержки
  setTimeout(() => {
    onFilterChange({ tags: selectedTags, query: searchQuery });
  }, 100);
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

// Функция для отображения выбранных тегов
const renderSelectedTags = () => {
  const selectedTagsArray = getSelectedTagsArray();
  
  if (selectedTagsArray.length === 0) {
    return null;
  }
  
  return (
    <div className="mb-4">
      <p className="text-sm font-medium mb-2">Выбранные теги:</p>
      <div className="flex flex-wrap gap-2">
        {selectedTagsArray.map((tag) => (
          <Badge 
            key={`${tag.categoryId}-${tag.tagSlug}`} 
            variant="secondary" 
            className="flex items-center gap-1"
          >
            <span className="text-xs text-gray-500">{tag.categoryName}:</span>
            <span>{tag.tagName}</span>
            <button
              onClick={() => handleRemoveTag(tag.categoryId, tag.tagId, tag.tagSlug)}
              className="ml-1 hover:bg-gray-300 rounded-full p-0.5"
              type="button"
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        ))}
      </div>
    </div>
  );
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
    {renderSelectedTags()}
    
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
          {tagCategories.length > 0 ? (
            tagCategories.map((category) => (
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
            ))
          ) : (
            <div className="p-3 text-sm text-gray-500">
              Теги не найдены. Попробуйте добавить теги в систему.
            </div>
          )}
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