/**
 * Хук для работы с профилем креатора
 * 
 * Отдельный специализированный хук для загрузки данных профиля креатора
 * с дополнительной информацией (навыки, портфолио, изображения).
 */

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import apiClient from '@/api/client';
import { CreatorProfile, CreatorSkill, PortfolioItem } from '@/types/auth';

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
      console.log('[DEBUG] useCreatorProfile - начало загрузки профиля');
      
      // Шаг 1: Получаем основной профиль
      let profileResponse;
      try {
        if (!id) {
          // Получаем текущий профиль пользователя
          console.log('[DEBUG] useCreatorProfile - запрос к creator-profile/');
          profileResponse = await apiClient.get('creator-profile/');
        } else {
          // Получаем профиль по ID
          console.log('[DEBUG] useCreatorProfile - запрос к creator-profiles/' + id);
          profileResponse = await apiClient.get(`creator-profiles/${id}/`);
        }
      } catch (error: any) {
        if (error.response && error.response.status === 404) {
          console.log('[INFO] useCreatorProfile - профиль не найден (404)');
          setCreator(null);
          setLoading(false);
          return;
        }
        throw error;
      }
      
      if (!profileResponse || !profileResponse.data) {
        console.log('[INFO] useCreatorProfile - нет данных профиля');
        setCreator(null);
        setLoading(false);
        return;
      }
      
      console.log('[INFO] useCreatorProfile - получен базовый профиль:', profileResponse.data);
      const profileData = profileResponse.data;
      
      // Если поле user пришло как ID, загружаем объект пользователя
      let userObj = profileData.user;
      if (userObj && (typeof userObj === 'number' || typeof userObj === 'string')) {
        try {
          const userRes = await apiClient.get(`users/${userObj}/`);
          userObj = userRes.data;
        } catch (uErr) {
          console.error('[ERROR] useCreatorProfile - не удалось загрузить данные пользователя', uErr);
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
      
      // Загружаем навыки
      try {
        console.log(`[DEBUG] useCreatorProfile - запрос навыков для профиля id=${profileData.id}`);
        const skillsResponse = await apiClient.get(`creator-skills/?creator_profile=${profileData.id}`);
        console.log('[DEBUG] useCreatorProfile - ответ навыков:', skillsResponse.data);
        
        // Проверяем структуру данных
        if (skillsResponse.data.results) {
          console.log('[DEBUG] useCreatorProfile - найдены навыки в results:', skillsResponse.data.results);
          completeProfile.skills = skillsResponse.data.results || [];
        } else {
          console.log('[DEBUG] useCreatorProfile - нет поля results в ответе навыков');
          completeProfile.skills = skillsResponse.data || [];
        }
        
        console.log('[DEBUG] useCreatorProfile - итоговые навыки профиля:', completeProfile.skills);
      } catch (skillsError) {
        console.error('[ERROR] useCreatorProfile - ошибка при загрузке навыков:', skillsError);
      }
      
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
        console.error('Ошибка при загрузке портфолио:', portfolioError);
      }
      
      // Загружаем услуги
      try {
        const servicesResponse = await apiClient.get(`services/?creator_profile=${profileData.id}`);
        completeProfile.services = servicesResponse.data.results || [];
      } catch (servicesError) {
        console.error('[ERROR] useCreatorProfile - ошибка загрузки услуг:', servicesError);
      }
      
      // Устанавливаем профиль в состояние
      setCreator(completeProfile);
    } catch (error: any) {
      console.error('[ERROR] useCreatorProfile - критическая ошибка:', error);
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
  
  return { creator, loading, error, reload };
}

export default useCreatorProfile;