/**
 * Компонент для компактного отображения рейтинга
 * 
 * Отображает рейтинг в виде звезд и числового значения,
 * опционально с количеством отзывов.
 */

import React from 'react';
import { Star } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface RatingDisplayProps {
  /** Числовое значение рейтинга */
  rating: number;
  /** Количество отзывов (опционально) */
  reviewCount?: number;
  /** Размер компонента */
  size?: 'sm' | 'md' | 'lg';
  /** Дополнительные CSS классы */
  className?: string;
  /** Отображать ли только звезды без числового значения */
  starsOnly?: boolean;
  /** Максимальное значение рейтинга (по умолчанию 5) */
  maxRating?: number;
}

/**
 * Компонент отображения рейтинга
 * 
 * @param props - Свойства компонента
 * @returns React компонент
 */
const RatingDisplay: React.FC<RatingDisplayProps> = ({
  rating,
  reviewCount,
  size = 'md',
  className = '',
  starsOnly = false,
  maxRating = 5
}) => {
  // Размеры звезд для разных размеров компонента
  const starSizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5'
  };
  
  // Размеры текста для разных размеров компонента
  const textSizes = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base'
  };
  
  // Форматирование рейтинга с 1 десятичным знаком
  const formattedRating = Number(rating).toFixed(1);
  
  // Предотвращение отображения рейтинга, если он не задан
  if (!rating && rating !== 0) {
    if (starsOnly) {
      return (
        <div className={`flex items-center ${className}`}>
          {[...Array(maxRating)].map((_, i) => (
            <Star key={i} className={`${starSizes[size]} text-gray-300`} />
          ))}
        </div>
      );
    }
    
    return <span className={`text-gray-500 ${textSizes[size]} ${className}`}>Нет отзывов</span>;
  }
  
  // Построение подсказки с информацией о рейтинге
  const tooltipContent = reviewCount 
    ? `Рейтинг: ${formattedRating} из ${maxRating} (на основе ${reviewCount} отзывов)`
    : `Рейтинг: ${formattedRating} из ${maxRating}`;
  
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={`flex items-center gap-1 ${className}`}>
            {/* Звезды рейтинга */}
            <div className="flex">
              {[...Array(maxRating)].map((_, i) => {
                // Для частичного заполнения звезд используем clip-path
                if (i < Math.floor(rating)) {
                  // Полностью заполненная звезда
                  return (
                    <Star
                      key={i}
                      className={`${starSizes[size]} text-yellow-500 fill-current`}
                    />
                  );
                } else if (i < rating) {
                  // Частично заполненная звезда (для дробных значений)
                  const fillPercentage = (rating - Math.floor(rating)) * 100;
                  return (
                    <div key={i} className="relative">
                      <Star className={`${starSizes[size]} text-gray-300`} />
                      <div
                        className="absolute top-0 left-0 overflow-hidden"
                        style={{ width: `${fillPercentage}%` }}
                      >
                        <Star className={`${starSizes[size]} text-yellow-500 fill-current`} />
                      </div>
                    </div>
                  );
                } else {
                  // Пустая звезда
                  return (
                    <Star
                      key={i}
                      className={`${starSizes[size]} text-gray-300`}
                    />
                  );
                }
              })}
            </div>
            
            {/* Числовое значение рейтинга */}
            {!starsOnly && (
              <span className={`font-medium ${textSizes[size]}`}>
                {formattedRating}
                {reviewCount !== undefined && (
                  <span className="text-gray-500">
                    {` (${reviewCount})`}
                  </span>
                )}
              </span>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent>
          {tooltipContent}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default RatingDisplay;
