/**
 * Контекст для управления фильтрами на всём приложении
 * Позволяет взаимодействовать между компонентами без необходимости редиректов
 */

import React, { createContext, useContext, useState, ReactNode } from 'react';
import { SelectedTags } from '@/components/CreatorFilters';

export interface Filters {
  tags: SelectedTags;
  query: string;
  gender?: 'male' | 'female' | 'prefer_not_to_say' | null;
  responseTime?: string | null;
}

interface FilterContextType {
  filters: Filters;
  updateFilters: (newFilters: Partial<Filters>) => void;
  setFilterTag: (categoryId: string, tagId: string, selected: boolean) => void;
  resetFilters: () => void;
}

const defaultFilters: Filters = {
  tags: {},
  query: '',
  gender: null,
  responseTime: null,
};

const FilterContext = createContext<FilterContextType | undefined>(undefined);

export const FilterProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [filters, setFilters] = useState<Filters>(defaultFilters);

  const updateFilters = (newFilters: Partial<Filters>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
  };

  // Функция для установки отдельного тега
  const setFilterTag = (categoryId: string, tagId: string, selected: boolean) => {
    setFilters((prev) => {
      const newTags = { ...prev.tags };
      
      if (!newTags[categoryId]) {
        newTags[categoryId] = [];
      }

      if (selected) {
        // Добавляем тег если его нет
        if (!newTags[categoryId].includes(tagId)) {
          newTags[categoryId] = [...newTags[categoryId], tagId];
        }
      } else {
        // Удаляем тег если он есть
        newTags[categoryId] = newTags[categoryId].filter(id => id !== tagId);
        
        // Если категория пуста, удаляем её
        if (newTags[categoryId].length === 0) {
          delete newTags[categoryId];
        }
      }

      return { ...prev, tags: newTags };
    });
  };

  const resetFilters = () => {
    setFilters(defaultFilters);
  };

  return (
    <FilterContext.Provider value={{ filters, updateFilters, setFilterTag, resetFilters }}>
      {children}
    </FilterContext.Provider>
  );
};

export const useFilter = (): FilterContextType => {
  const context = useContext(FilterContext);
  if (context === undefined) {
    throw new Error('useFilter must be used within a FilterProvider');
  }
  return context;
};
