/**
 * Компонент фильтрации креаторов по тегам, полу, времени ответа и поиску
 */

import React, { useState, useEffect } from 'react';
import { X, Search, Filter, ChevronDown, ChevronUp } from 'lucide-react';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

// Интерфейсы для тегов и категорий
export interface Tag {
  id: string;
  name: string;
}

export interface TagCategory {
  id: string;
  name: string;
  tags: Tag[];
}

export interface SelectedTags {
  [categoryId: string]: string[];
}

/**
 * Интерфейс для фильтров креаторов
 */
export interface CreatorFilters {
  tags: SelectedTags;
  query: string;
  gender?: 'male' | 'female' | 'prefer_not_to_say' | null;
  responseTime?: string | null;
}

export interface CreatorFiltersProps {
  onFilterChange: (filters: CreatorFilters) => void;
  initialFilters?: CreatorFilters;
}

/**
 * Функция для парсинга тегов из markdown файла
 */
const parseTagsFromMarkdown = (markdown: string): TagCategory[] => {
  const categories: TagCategory[] = [];
  let currentCategory: TagCategory | null = null;

  const lines = markdown.split('\n');

  for (const line of lines) {
    // Проверяем, является ли строка заголовком категории
    if (line.startsWith('### ')) {
      if (currentCategory) {
        categories.push(currentCategory);
      }

      const categoryName = line.replace('### ', '').replace(/\*\*/g, '').trim();
      const categoryId = categoryName.toLowerCase().replace(/[^а-яa-z0-9]+/g, '-');
      
      currentCategory = {
        id: categoryId,
        name: categoryName,
        tags: [],
      };
    } 
    // Проверяем, является ли строка тегом
    else if (line.match(/^\d+\. [а-яА-ЯёЁa-zA-Z0-9-]+/)) {
      if (currentCategory) {
        // Улучшенное регулярное выражение, которое обрабатывает все символы до конца строки
        // Включает поддержку буквы ё/Ё и смешанных тегов (русские + латинские)
        const tagMatch = line.match(/^(\d+)\. (.+)$/);
        if (tagMatch && tagMatch[1] && tagMatch[2]) {
          const tagNumber = tagMatch[1];
          const tagName = tagMatch[2];
          const tagId = `${tagName}-${tagNumber}`; // Используем номер как часть id
          currentCategory.tags.push({
            id: tagId,
            name: tagName.replace(/-/g, ' '),
          });
        }
      }
    }
  }

  // Добавляем последнюю категорию
  if (currentCategory) {
    categories.push(currentCategory);
  }

  return categories;
};

const RESPONSE_TIME_OPTIONS: { id: string; label: string }[] = [
  { id: 'up_to_24_hours', label: 'До 24 часов' },
  { id: 'up_to_3_days', label: 'До 3 дней' },
  { id: 'up_to_10_days', label: 'До 10 дней' },
  { id: 'up_to_14_days', label: 'До 14 дней' },
  { id: 'up_to_30_days', label: 'До 30 дней' },
  { id: 'up_to_60_days', label: 'До 60 дней' },
  { id: 'more_than_60_days', label: 'Более 60 дней' },
];

const CreatorFilters: React.FC<CreatorFiltersProps> = ({ onFilterChange, initialFilters = { tags: {}, query: '', gender: null, responseTime: null } }) => {
  const [searchQuery, setSearchQuery] = useState(initialFilters.query);
  const [inputValue, setInputValue] = useState(initialFilters.query);
  const [selectedTags, setSelectedTags] = useState<SelectedTags>(initialFilters.tags);
  const [selectedGender, setSelectedGender] = useState<'male' | 'female' | 'prefer_not_to_say' | null>(initialFilters.gender || null);
  type ResponseTimeFilterType = 'up_to_24_hours' | 'up_to_3_days' | 'up_to_10_days' | 'up_to_14_days' | 'up_to_30_days' | 'up_to_60_days' | 'more_than_60_days' | null;
  const [selectedResponseTime, setSelectedResponseTime] = useState<ResponseTimeFilterType>(initialFilters.responseTime as ResponseTimeFilterType || null);
  
  const [tagCategories, setTagCategories] = useState<TagCategory[]>([]);
  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (initialFilters) {
      if (initialFilters.query) {
        setSearchQuery(initialFilters.query);
      }
      
      if (initialFilters.tags) {
        setSelectedTags(initialFilters.tags);
      }

      if (initialFilters.gender) {
        setSelectedGender(initialFilters.gender);
      }

      if (initialFilters.responseTime) {
        setSelectedResponseTime(initialFilters.responseTime as ResponseTimeFilterType);
      }
    }
  }, [initialFilters]);

  // Загрузка тегов из файла tags.md
  useEffect(() => {
    const fetchTags = async () => {
      try {
        const response = await fetch('/tags.md');
        const markdown = await response.text();
        const parsedCategories = parseTagsFromMarkdown(markdown);
        setTagCategories(parsedCategories);
      } catch (error) {
        console.error('Ошибка при загрузке тегов:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTags();
  }, []);

  // Обработчик изменения текста в поле поиска
  const handleSearchInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  // Обработчик подтверждения поиска
  const handleSearchSubmit = () => {
    console.log('Нажата кнопка Найти, текущий ввод:', inputValue);
    setSearchQuery(inputValue); // Применяем поисковый запрос только при подтверждении
    
    // Явно вызываем функцию фильтрации
    onFilterChange({
      tags: selectedTags,
      query: inputValue,
      gender: selectedGender,
      responseTime: selectedResponseTime
    });
    
    console.log('Фильтрация применена с поисковым запросом:', inputValue);
  };

  // Обработчик изменения выбранных тегов
  const handleTagChange = (categoryId: string, tagId: string, checked: boolean) => {
    setSelectedTags(prev => {
      const newTags = { ...prev };
      
      if (!newTags[categoryId]) {
        newTags[categoryId] = [];
      }
      
      if (checked) {
        newTags[categoryId] = [...newTags[categoryId], tagId];
      } else {
        newTags[categoryId] = newTags[categoryId].filter(id => id !== tagId);
        
        // Удаляем пустую категорию
        if (newTags[categoryId].length === 0) {
          delete newTags[categoryId];
        }
      }
      
      return newTags;
    });
  };

  // Обработчик сброса фильтров
  const handleReset = () => {
    setSelectedTags({});
    setSearchQuery('');
    setInputValue('');
    setSelectedGender(null);
    setSelectedResponseTime(null);
    onFilterChange({ tags: {}, query: '', gender: null, responseTime: null });
  };

  // Обработчик применения фильтров
  const handleApplyFilters = () => {
    onFilterChange({
      tags: selectedTags,
      query: searchQuery,
      gender: selectedGender,
      responseTime: selectedResponseTime
    });
  };

  // Обработчик удаления выбранного тега
  const handleRemoveTag = (categoryId: string, tagId: string) => {
    handleTagChange(categoryId, tagId, false);
  };

  // Получение всех выбранных тегов для отображения
  const getSelectedTagsArray = () => {
    const result: { categoryId: string; tagId: string; tagName: string; categoryName: string }[] = [];
    
    Object.entries(selectedTags).forEach(([categoryId, tagIds]) => {
      const category = tagCategories.find(cat => cat.id === categoryId);
      if (category) {
        tagIds.forEach(tagId => {
          const tag = category.tags.find(t => t.id === tagId);
          if (tag) {
            result.push({
              categoryId,
              tagId,
              tagName: tag.name,
              categoryName: category.name,
            });
          }
        });
      }
    });
    
    return result;
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
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 h-full border border-gray-100 dark:border-gray-700">
      <div className="mb-6">
        {/* Фильтр по среднему времени ответа */}
      <div className="mb-4">
        <p className="text-sm font-medium mb-2">Среднее время ответа</p>
        <div className="grid grid-cols-3 gap-2">
          {RESPONSE_TIME_OPTIONS.map(opt => (
            <button
              key={opt.id}
              type="button"
              onClick={() => setSelectedResponseTime(prev => (prev === opt.id ? null : opt.id as ResponseTimeFilterType))}
              className={
                `p-2 border rounded-md text-center text-sm transition-colors `+
                (selectedResponseTime === opt.id
                  ? 'bg-primary text-white border-primary'
                  : 'hover:bg-gray-50 dark:hover:bg-gray-700')
              }
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div className="relative flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Поиск по имени, почте или полному имени"
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
            {getSelectedTagsArray().map(({ categoryId, tagId, tagName, categoryName }) => (
              <Badge 
                key={`${categoryId}-${tagId}`} 
                variant="secondary"
                className="flex items-center gap-1 px-2 py-1"
              >
                <span className="text-xs">{categoryName}: {tagName}</span>
                <button
                  onClick={() => handleRemoveTag(categoryId, tagId)}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Фильтр по полу */}
      <div className="mb-6">
        <p className="text-sm font-medium mb-2 flex items-center">
          <Filter className="h-4 w-4 mr-2" />
          Пол креатора
        </p>
        <div className="grid grid-cols-3 gap-2">
          <div 
            onClick={() => setSelectedGender(selectedGender === 'male' ? null : 'male')}
            className={`p-2 border rounded-md cursor-pointer text-center text-sm ${selectedGender === 'male' ? 'bg-primary text-white' : 'hover:bg-gray-50 dark:hover:bg-gray-700'}`}
          >
            Мужской
          </div>
          <div 
            onClick={() => setSelectedGender(selectedGender === 'female' ? null : 'female')}
            className={`p-2 border rounded-md cursor-pointer text-center text-sm ${selectedGender === 'female' ? 'bg-primary text-white' : 'hover:bg-gray-50 dark:hover:bg-gray-700'}`}
          >
            Женский
          </div>
          <div 
            onClick={() => setSelectedGender(selectedGender === 'prefer_not_to_say' ? null : 'prefer_not_to_say')}
            className={`p-2 border rounded-md cursor-pointer text-center text-sm ${selectedGender === 'prefer_not_to_say' ? 'bg-primary text-white' : 'hover:bg-gray-50 dark:hover:bg-gray-700'}`}
          >
            Другой
          </div>
        </div>
      </div>


      {/* Аккордеон с категориями тегов */}
      <div className="mb-6">
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
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 gap-2">
                      {category.tags.map((tag) => (
                        <div key={tag.id} className="flex items-center space-x-2">
                          <Checkbox 
                            id={`${category.id}-${tag.id}`}
                            checked={selectedTags[category.id]?.includes(tag.id) || false}
                            onCheckedChange={(checked) => {
                              handleTagChange(category.id, tag.id, checked === true);
                            }}
                          />
                          <label 
                            htmlFor={`${category.id}-${tag.id}`}
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

export default CreatorFilters;
