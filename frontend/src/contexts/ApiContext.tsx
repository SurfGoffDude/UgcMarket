/**
 * API контекст для глобального доступа к данным
 * 
 * Предоставляет доступ к данным API и состоянию авторизации
 * через React Context API для всего приложения.
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import api from '@/lib/api';
import useAuth from '@/hooks/useAuth';

// Определяем типы для контекста
interface ApiContextType {
  // Данные авторизации
  user: any | null;
  loading: boolean;
  error: Error | null;
  isAuthenticated: boolean;
  
  // Методы авторизации
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  refreshUser: () => Promise<any | null>;
}

// Создаем контекст
const ApiContext = createContext<ApiContextType | undefined>(undefined);

// Свойства для провайдера
interface ApiProviderProps {
  children: ReactNode;
}

/**
 * Провайдер API контекста
 * Предоставляет доступ к API данным во всем приложении
 */
export const ApiProvider: React.FC<ApiProviderProps> = ({ children }) => {
  const auth = useAuth();

  // Значение контекста
  const contextValue: ApiContextType = {
    ...auth,
  };

  return (
    <ApiContext.Provider value={contextValue}>
      {children}
    </ApiContext.Provider>
  );
};

/**
 * Хук для использования API контекста
 * @returns Объект с данными API и методами
 */
export const useApiContext = (): ApiContextType => {
  const context = useContext(ApiContext);
  
  if (context === undefined) {
    throw new Error('useApiContext должен использоваться внутри ApiProvider');
  }
  
  return context;
};
