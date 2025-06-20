/**
 * Компонент для отображения статистики рейтингов
 * 
 * Отображает среднюю оценку, количество отзывов и распределение оценок в виде гистограммы
 */

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Star } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import api from '@/lib/api';
import { RatingStatistics } from '@/types/review';

interface RatingStatsProps {
  /** ID создателя для отображения статистики */
  creatorId?: number;
  /** Класс для стилизации внешнего контейнера */
  className?: string;
}

/**
 * Компонент статистики рейтингов
 * 
 * @param props - Свойства компонента
 * @returns React компонент
 */
const RatingStats: React.FC<RatingStatsProps> = ({ creatorId, className = '' }) => {
  // Запрос на получение статистики рейтингов
  const {
    data,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['review-statistics', creatorId],
    queryFn: async () => {
      return api.getReviewStatistics(creatorId) as Promise<RatingStatistics>;
    },
  });
  
  // Распределение рейтингов с учетом возможного отсутствия некоторых значений
  const getRatingDistribution = () => {
    if (!data || !data.rating_distribution) {
      return [];
    }
    
    return [5, 4, 3, 2, 1].map(rating => ({
      rating,
      count: data.rating_distribution[rating]?.count || 0,
      percentage: data.rating_distribution[rating]?.percentage || 0
    }));
  };
  
  // Отображение Skeleton при загрузке
  if (isLoading) {
    return (
      <div className={`space-y-4 ${className}`}>
        <div className="flex items-center gap-3">
          <Skeleton className="h-16 w-16 rounded" />
          <div>
            <Skeleton className="h-6 w-32 mb-2" />
            <Skeleton className="h-4 w-24" />
          </div>
        </div>
        
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center gap-2">
              <Skeleton className="h-4 w-4" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-8" />
            </div>
          ))}
        </div>
      </div>
    );
  }
  
  // Обработка ошибок
  if (error || !data) {
    return (
      <div className={`text-center py-4 ${className}`}>
        <p className="text-gray-500">Не удалось загрузить статистику рейтингов</p>
      </div>
    );
  }
  
  // Нет отзывов
  if (data.total_reviews === 0) {
    return (
      <div className={`text-center py-4 ${className}`}>
        <p className="text-gray-500">Нет отзывов</p>
      </div>
    );
  }
  
  // Форматирование средней оценки до 1 десятичного знака
  const formattedAverage = data.average_rating.toFixed(1);
  
  return (
    <div className={className}>
      {/* Общая статистика */}
      <div className="flex items-center gap-6 mb-6">
        <div className="flex items-center justify-center bg-gray-50 rounded-lg p-3 min-w-[80px]">
          <span className="text-3xl font-bold text-gray-900">{formattedAverage}</span>
          <Star className="w-4 h-4 text-yellow-500 ml-1" />
        </div>
        
        <div>
          <h4 className="font-medium text-gray-900">Средний рейтинг</h4>
          <p className="text-sm text-gray-500">На основе {data.total_reviews} отзывов</p>
        </div>
      </div>
      
      {/* Распределение рейтингов */}
      <div className="space-y-2">
        {getRatingDistribution().map((item) => (
          <div key={item.rating} className="flex items-center gap-2">
            <div className="flex items-center gap-1 min-w-[30px]">
              <span>{item.rating}</span>
              <Star className="w-3 h-3 text-gray-400" />
            </div>
            <Progress value={item.percentage} className="h-2" />
            <span className="text-xs text-gray-500 min-w-[40px]">
              {item.count} ({Math.round(item.percentage)}%)
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RatingStats;
