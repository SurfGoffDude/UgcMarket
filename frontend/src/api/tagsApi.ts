import apiClient from './client';

/**
 * Интерфейс для тега/категории
 */
export interface Tag {
  id: number;
  name: string;
  slug: string;
  category?: number;
  string_id?: string;
}

/**
 * Интерфейс для популярной категории с дополнительной информацией
 */
export interface PopularCategory {
  id: number;
  name: string;
  slug: string;
  count: number;
  icon: string;
  color?: string;
  filter?: string;
}

/**
 * Получить все теги/категории
 * @returns Список тегов/категорий
 */
export const fetchTags = async (): Promise<Tag[]> => {
  try {
    const response = await apiClient.get<Tag[]>('tags/');
    return response.data;
  } catch (error) {
    console.error('Ошибка при загрузке тегов:', error);
    throw error;
  }
};

/**
 * Получить популярные категории с количеством услуг
 * @returns Список популярных категорий с количеством услуг
 */
export const fetchPopularCategories = async (): Promise<PopularCategory[]> => {
  try {
    // Получаем теги
    const tags = await fetchTags();
    
    // Группировка тегов по категориям для подсчета
    const categoryCounts: Record<string, number> = {};
    const categoryNames: Record<string, string> = {};
    const categoryIcons: Record<string, string> = {
      'video': 'Video',
      'voiceover': 'Mic',
      'music': 'Music',
      'editing': 'Scissors',
      'animation': 'Image',
      'thumbnails': 'Youtube',
    };
    const categoryColors: Record<string, string> = {
      'video': 'from-[#E95C4B] to-[#d54538]',
      'voiceover': 'from-[#E95C4B] to-[#fa7a6c]',
      'music': 'from-[#E95C4B] to-[#ca3c2b]',
      'editing': 'from-[#E95C4B] to-[#db4b3a]',
      'animation': 'from-[#E95C4B] to-[#ff6c5a]',
      'thumbnails': 'from-[#E95C4B] to-[#c43526]',
    };
    
    // Маппинг категорий для отображения
    const categoryMapping: Record<string, string> = {
      'Фото': 'thumbnails',
      'Видео от блогеров': 'video',
      'Вертикальные видео': 'video',
      'Горизонтальные видео': 'video',
      'Видео с озвучкой': 'voiceover',
      '3D анимация': 'animation',
      '2D анимация': 'animation',
      'Моушен': 'animation',
      'Озвучка': 'voiceover',
      'Музыка для Reels': 'music',
      'Монтаж': 'editing',
      'Интро и анимация': 'animation',
      'Обложки для YouTube': 'thumbnails',
    };
    
    // Переводим названия категорий
    const categoryDisplayNames: Record<string, string> = {
      'video': 'Видео от блогеров',
      'voiceover': 'Озвучка',
      'music': 'Музыка для Reels',
      'editing': 'Монтаж',
      'animation': 'Интро и анимация',
      'thumbnails': 'Обложки для YouTube',
    };
    
    // Подсчитываем количество услуг в каждой категории
    tags.forEach(tag => {
      const categoryKey = categoryMapping[tag.name] || 'other';
      
      if (categoryKey !== 'other') {
        categoryCounts[categoryKey] = (categoryCounts[categoryKey] || 0) + 1;
        categoryNames[categoryKey] = categoryDisplayNames[categoryKey] || tag.name;
      }
    });
    
    // Формируем список популярных категорий
    const popularCategories: PopularCategory[] = Object.keys(categoryCounts).map((key, index) => ({
      id: index + 1,
      name: categoryNames[key] || categoryDisplayNames[key] || key,
      slug: key,
      count: categoryCounts[key],
      icon: categoryIcons[key] || 'Tag',
      color: categoryColors[key] || 'from-[#E95C4B] to-[#d54538]',
      filter: key
    }));
    
    // Сортируем по количеству услуг
    return popularCategories.sort((a, b) => b.count - a.count).slice(0, 6);
  } catch (error) {
    console.error('Ошибка при загрузке популярных категорий:', error);
    throw error;
  }
};