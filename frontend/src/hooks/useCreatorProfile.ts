/**
 * Хук для работы с профилем креатора
 * 
 * Отдельный специализированный хук для загрузки данных профиля креатора
 * с дополнительной информацией (навыки, портфолио, изображения).
 */

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import apiClient from '@/api/client';
import { CreatorProfile, PortfolioItem } from '@/types/auth';

/**
 * Хук для работы с профилем креатора
 * @param id - ID профиля креатора (опционально)
 * @returns Объект с данными профиля, состоянием загрузки и ошибкой
 */
export function useCreatorProfile(id?: string) {
  const { user } = useAuth(); // Используем AuthContext напрямую
  const [creator, setCreator] = useState<CreatorProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  
  // Мемоизированная функция загрузки данных, чтобы избежать создания новой функции при каждом рендере
  const loadProfile = useCallback(async () => {
    if (!id && !user) return;
    
    setLoading(true);
    setError(null);
    
    try {

      
      // Шаг 1: Получаем основной профиль
      let profileResponse;
      try {
        if (!id) {
          // Получаем текущий профиль пользователя

          profileResponse = await apiClient.get('creator-profiles/me/?detail=true');
        } else {
          // Получаем профиль по ID

          profileResponse = await apiClient.get(`creator-profiles/${id}/retrieve_detail/`);
        }
      } catch (error: any) {
        if (error.response && error.response.status === 404) {

          setCreator(null);
          setLoading(false);
          return;
        }
        throw error;
      }
      
      if (!profileResponse || !profileResponse.data) {

        setCreator(null);
        setLoading(false);
        return;
      }
      

      const profileData = profileResponse.data;
      
      // Если поле user пришло как ID, загружаем объект пользователя
      let userObj = profileData.user;
      if (userObj && (typeof userObj === 'number' || typeof userObj === 'string')) {
        try {
          const userRes = await apiClient.get(`users/${userObj}/`);
          userObj = userRes.data;
        } catch (uErr) {

        }
      }

      // Шаг 2: Получаем дополнительные данные
      
      // Создаем базовый профиль с пустыми массивами
      const completeProfile = {
        ...profileData,
        user: userObj,
        skills: [],
        portfolio: [],
        portfolio_items: [],
        services: [] // услуги креатора
      };
      
      // Навыки устарели – используем теги, поэтому просто пропускаем загрузку skills
      
      // Загружаем портфолио
      try {
        const portfolioResponse = await apiClient.get(`portfolio/?creator_profile=${profileData.id}`);
        const portfolioItems = portfolioResponse.data.results || [];
        
        // Для каждого элемента портфолио получаем изображения
        const portfolioWithImages = await Promise.all(
          portfolioItems.map(async (item: PortfolioItem) => {
            try {
              const imagesResponse = await apiClient.get(`portfolio-images/?portfolio_item=${item.id}`);
              return {
                ...item,
                images: imagesResponse.data.results || []
              };
            } catch (error) {
              return {
                ...item,
                images: []
              };
            }
          })
        );
        
        completeProfile.portfolio = portfolioWithImages;
      } catch (portfolioError) {

      }
      
      // Загружаем услуги
      try {
        const servicesResponse = await apiClient.get(`services/?creator_profile=${profileData.id}`);
        completeProfile.services = servicesResponse.data.results || [];
      } catch (servicesError) {

      }
      
      // Устанавливаем профиль в состояние
      setCreator(completeProfile);
    } catch (error: any) {

      setError(new Error(error.message || 'Ошибка при загрузке профиля креатора'));
    } finally {
      setLoading(false);
    }
  }, [id, user]);
  
  // Используем useEffect с фиксированной зависимостью
  useEffect(() => {
    loadProfile();
  }, [loadProfile]);
  
  // Функция для обновления данных профиля
  const reload = useCallback(() => {
    loadProfile();
  }, [loadProfile]);
  
  // Функция для обновления профиля креатора
  const updateProfile = useCallback(async (profileData: Partial<CreatorProfile>) => {
    if (!id) return false;
    
    try {
      setLoading(true);
      await apiClient.patch(`creator-profiles/${id}/`, profileData);
      // После успешного обновления перезагружаем профиль
      await loadProfile();
      return true;
    } catch (error: any) {
      setError(new Error(error.message || 'Ошибка при обновлении профиля креатора'));
      return false;
    } finally {
      setLoading(false);
    }
  }, [id, loadProfile]);
  
  return { creator, loading, error, reload, updateProfile };
}

export default useCreatorProfile;