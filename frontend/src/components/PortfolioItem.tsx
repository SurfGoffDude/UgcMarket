
import React, { useEffect } from 'react';
import { Play, Eye, Heart, Calendar } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';

/**
 * Тип для моковых данных элемента портфолио
 */
interface MockPortfolioItem {
  id: number;
  title: string;
  thumbnail: string;
  views: string;
  likes: string;
}

/**
 * Тип для данных элемента портфолио из API
 */
interface APIPortfolioItem {
  id: number | string;
  title?: string;
  description?: string;
  image?: string;
  cover_image?: string; // Поле для основного изображения
  cover_image_url?: string; // Фактически используемое API поле для URL обложки
  thumbnail_url?: string;
  video_url?: string;
  external_url?: string;
  created_at?: string;
  updated_at?: string;
  stats?: {
    views?: number;
    likes?: number;
    comments?: number;
  };
  tags?: string[];
  category?: {
    id: number | string;
    name: string;
  };
  // Новые поля для работы с реальным API
  images?: Array<{
    id: number | string;
    image: string;
    caption?: string;
    portfolio_item?: number | string;
  }>;
}

/**
 * Объединенный тип для обоих вариантов данных
 */
type PortfolioItemData = MockPortfolioItem | APIPortfolioItem;

interface PortfolioItemProps {
  item: PortfolioItemData;
}

/**
 * Компонент элемента портфолио креатора
 * @param {PortfolioItemProps} props - Пропсы компонента
 * @returns {React.ReactElement}
 */
const PortfolioItem: React.FC<PortfolioItemProps> = ({ item }) => {
  // Отладочный код - выводим в консоль структуру объекта
  useEffect(() => {
    console.log('[DEBUG] PortfolioItem - получены данные:', item);
  }, [item]);
  /**
   * Получает заголовок элемента портфолио
   * @returns {string} Заголовок
   */
  const getTitle = (): string => {
    if ('title' in item) return item.title;
    return (item as APIPortfolioItem).title || 'Без названия';
  };
  
  /**
   * Получает URL миниатюры
   * @returns {string} URL миниатюры
   */
  const getThumbnail = (): string => {
    if ('thumbnail' in item) return item.thumbnail;
    
    const apiItem = item as APIPortfolioItem;
    
    // Проверяем поле cover_image_url (фактически используемое API)
    if (apiItem.cover_image_url) {
      console.log('[DEBUG] Используем cover_image_url:', apiItem.cover_image_url);
      return apiItem.cover_image_url;
    }
    
    // Другие возможные поля с URL изображений
    if (apiItem.thumbnail_url) {
      console.log('[DEBUG] Используем thumbnail_url:', apiItem.thumbnail_url);
      return apiItem.thumbnail_url;
    }
    
    if (apiItem.cover_image) {
      console.log('[DEBUG] Используем cover_image:', apiItem.cover_image);
      return apiItem.cover_image;
    }
    
    if (apiItem.image) {
      console.log('[DEBUG] Используем image:', apiItem.image);
      return apiItem.image;
    }
    
    // Проверяем наличие изображений в массиве
    if (apiItem.images && apiItem.images.length > 0 && apiItem.images[0]?.image) {
      console.log('[DEBUG] Используем изображение из массива:', apiItem.images[0].image);
      return apiItem.images[0].image;
    }
    
    console.log('[DEBUG] Изображения не найдены, используем placeholder');
    return 'https://via.placeholder.com/300';
  };
  
  /**
   * Проверяет, является ли элемент видео
   * @returns {boolean} Флаг видео
   */
  const isVideo = (): boolean => {
    const apiItem = item as APIPortfolioItem;
    return Boolean(apiItem.video_url);
  };
  
  /**
   * Получает количество просмотров
   * @returns {string} Форматированное кол-во просмотров
   */
  const getViews = (): string => {
    if ('views' in item) return item.views;
    const stats = (item as APIPortfolioItem).stats;
    if (stats && stats.views) {
      return formatNumber(stats.views);
    }
    return '0';
  };
  
  /**
   * Получает количество лайков
   * @returns {string} Форматированное кол-во лайков
   */
  const getLikes = (): string => {
    if ('likes' in item) return item.likes;
    const stats = (item as APIPortfolioItem).stats;
    if (stats && stats.likes) {
      return formatNumber(stats.likes);
    }
    return '0';
  };
  
  /**
   * Получает теги элемента портфолио
   * @returns {string[]} Массив тегов
   */
  const getTags = (): string[] => {
    return (item as APIPortfolioItem).tags || [];
  };
  
  /**
   * Форматирует число в краткий формат (1K, 1M, и т.д.)
   * @param {number} num - Число для форматирования
   * @returns {string} Форматированное число
   */
  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    } else if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
    return num.toString();
  };
  // Получаем ID элемента портфолио для формирования URL
  const getItemId = (): string | number => {
    return item.id || 0;
  };
  
  return (
    <Link to={`/portfolio/${getItemId()}`} className="block">
      <div className="group cursor-pointer bg-white rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300">
      <div className="relative">
        <img 
          src={getThumbnail()} 
          alt={getTitle()}
          className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
        />
        {isVideo() && (
          <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors duration-300 flex items-center justify-center">
            <div className="bg-white/90 rounded-full p-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <Play className="w-6 h-6 text-gray-900" />
            </div>
          </div>
        )}
      </div>
      
      <div className="p-4">
        <h3 className="font-semibold text-gray-900 mb-2 group-hover:text-purple-600 transition-colors">
          {getTitle()}
        </h3>
        
        {/* Вывод тегов, если есть */}
        {getTags().length > 0 && (
          <div className="flex flex-wrap gap-1 mb-2">
            {getTags().slice(0, 2).map((tag, index) => (
              <Badge key={index} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        )}
        
        <div className="flex items-center justify-between text-sm text-gray-600">
          <div className="flex items-center space-x-1">
            <Eye className="w-4 h-4" />
            <span>{getViews()}</span>
          </div>
          <div className="flex items-center space-x-1">
            <Heart className="w-4 h-4" />
            <span>{getLikes()}</span>
          </div>
        </div>
      </div>
    </div>
    </Link>
  );
};

export default PortfolioItem;
