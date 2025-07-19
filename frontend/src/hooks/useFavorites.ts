/**
 * Хук для работы с избранными креаторами.
 * 
 * Предоставляет функции для управления избранными креаторами,
 * включая добавление, удаление и проверку статуса.
 */

import { useState, useEffect, useCallback } from 'react';
import { favoritesApi, FavoriteCreator, FavoriteStatus } from '@/api/favoritesApi';
import { toast } from '@/components/ui/use-toast';

/**
 * Интерфейс для состояния хука избранных
 */
interface UseFavoritesState {
  favorites: FavoriteCreator[];
  loading: boolean;
  error: string | null;
}

/**
 * Хук для работы с избранными креаторами
 * 
 * @returns Объект с данными и функциями для работы с избранными
 */
export const useFavorites = () => {
  const [state, setState] = useState<UseFavoritesState>({
    favorites: [],
    loading: false,
    error: null
  });

  /**
   * Загружает список избранных креаторов
   */
  const loadFavorites = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const favorites = await favoritesApi.getFavorites();
      setState(prev => ({ 
        ...prev, 
        favorites, 
        loading: false 
      }));
    } catch (error) {
      console.error('Ошибка при загрузке избранных:', error);
      setState(prev => ({ 
        ...prev, 
        error: 'Не удалось загрузить избранных креаторов', 
        loading: false 
      }));
    }
  }, []);

  /**
   * Добавляет креатора в избранное
   * 
   * @param creatorId ID креатора
   */
  const addToFavorites = useCallback(async (creatorId: number) => {
    try {
      const newFavorite = await favoritesApi.addToFavorites(creatorId);
      setState(prev => ({
        ...prev,
        favorites: [newFavorite, ...prev.favorites]
      }));
      
      toast({
        title: "Успешно!",
        description: "Креатор добавлен в избранное",
      });
      
      // Перезагружаем данные для синхронизации
      await loadFavorites();
      
      return true;
    } catch (error) {
      console.error('Ошибка при добавлении в избранное:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось добавить креатора в избранное",
        variant: "destructive",
      });
      return false;
    }
  }, [loadFavorites]);

  /**
   * Удаляет креатора из избранного
   * 
   * @param creatorId ID креатора
   */
  const removeFromFavorites = useCallback(async (creatorId: number) => {
    try {
      await favoritesApi.removeFromFavoritesByCreatorId(creatorId);
      setState(prev => ({
        ...prev,
        favorites: prev.favorites.filter(fav => fav.creator.id !== creatorId)
      }));
      
      toast({
        title: "Успешно!",
        description: "Креатор удален из избранного",
      });
      
      // Перезагружаем данные для синхронизации
      await loadFavorites();
      
      return true;
    } catch (error) {
      console.error('Ошибка при удалении из избранного:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось удалить креатора из избранного",
        variant: "destructive",
      });
      return false;
    }
  }, [loadFavorites]);

  /**
   * Переключает статус избранного для креатора
   * 
   * @param creatorId ID креатора
   * @returns Promise<boolean> Новый статус избранного
   */
  const toggleFavorite = useCallback(async (creatorId: number): Promise<boolean> => {
    try {
      const newStatus = await favoritesApi.toggleFavorite(creatorId);
      
      if (newStatus) {
        // Креатор добавлен в избранное - обновляем локальное состояние
        const favorites = await favoritesApi.getFavorites();
        setState(prev => ({ ...prev, favorites }));
        
        toast({
          title: "Успешно!",
          description: "Креатор добавлен в избранное",
        });
      } else {
        // Креатор удален из избранного - обновляем локальное состояние
        setState(prev => ({
          ...prev,
          favorites: prev.favorites.filter(fav => fav.creator.id !== creatorId)
        }));
        
        toast({
          title: "Успешно!",
          description: "Креатор удален из избранного",
        });
      }
      
      return newStatus;
    } catch (error) {
      console.error('Ошибка при переключении избранного:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось изменить статус избранного",
        variant: "destructive",
      });
      throw error;
    }
  }, []);

  /**
   * Проверяет, находится ли креатор в избранном
   * 
   * @param creatorId ID креатора
   * @returns boolean Статус избранного
   */
  const isFavorite = useCallback((creatorId: number): boolean => {
    return state.favorites.some(fav => fav.creator.id === creatorId);
  }, [state.favorites]);

  // Загружаем избранных при монтировании компонента
  useEffect(() => {
    loadFavorites();
  }, [loadFavorites]);

  return {
    favorites: state.favorites,
    loading: state.loading,
    error: state.error,
    loadFavorites,
    addToFavorites,
    removeFromFavorites,
    toggleFavorite,
    isFavorite
  };
};

/**
 * Хук для проверки статуса избранного конкретного креатора
 * 
 * @param creatorId ID креатора
 * @returns Объект с данными о статусе избранного
 */
export const useFavoriteStatus = (creatorId: number | null) => {
  const [status, setStatus] = useState<FavoriteStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkStatus = useCallback(async () => {
    if (!creatorId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const favoriteStatus = await favoritesApi.checkFavoriteStatus(creatorId);
      setStatus(favoriteStatus);
    } catch (error) {
      console.error('Ошибка при проверке статуса избранного:', error);
      setError('Не удалось проверить статус избранного');
    } finally {
      setLoading(false);
    }
  }, [creatorId]);

  useEffect(() => {
    checkStatus();
  }, [checkStatus]);

  return {
    status,
    loading,
    error,
    checkStatus
  };
};

export default useFavorites;