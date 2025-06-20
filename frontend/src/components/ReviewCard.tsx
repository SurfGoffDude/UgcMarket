
import React from 'react';
import { Star, Calendar, Package, MessageSquare, ThumbsUp } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import { ru } from 'date-fns/locale';
import { Review } from '@/types/review';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';

/**
 * Интерфейс пропсов компонента ReviewCard
 */
interface ReviewCardProps {
  /** Объект отзыва */
  review: Review;
  /** Обработчик нажатия на кнопку ответа (только для создателя или админа) */
  onReply?: (reviewId: number) => void;
  /** Флаг, показывающий, что пользователь может отвечать на отзыв */
  canReply?: boolean;
}

/**
 * Компонент карточки отзыва
 * @param {ReviewCardProps} props - Пропсы компонента
 * @returns {React.ReactElement}
 */
const ReviewCard: React.FC<ReviewCardProps> = ({ review, onReply, canReply = false }) => {
  /**
   * Получает имя клиента
   * @returns {string} Имя клиента
   */
  const getClientName = (): string => {
    if (!review.reviewer) return 'Анонимный пользователь';
    
    if (review.reviewer.first_name && review.reviewer.last_name) {
      return `${review.reviewer.first_name} ${review.reviewer.last_name}`;
    } else if (review.reviewer.first_name) {
      return review.reviewer.first_name;
    } else {
      return review.reviewer.username || 'Пользователь';
    }
  };
  
  /**
   * Получает имя создателя
   * @returns {string} Имя создателя
   */
  const getCreatorName = (): string => {
    return review.creator_name || 'Создатель';
  };
  
  /**
   * Получает название услуги
   * @returns {string} Название услуги
   */
  const getServiceName = (): string => {
    return review.service_title || 'Услуга';
  };
  
  /**
   * Получает текст отзыва
   * @returns {string} Текст отзыва
   */
  const getText = (): string => {
    return review.comment || '';
  };
  
  /**
   * Получает дату отзыва
   * @returns {string} Форматированная дата
   */
  const getDate = (): string => {    
    if (!review.created_at) return '';
    
    try {
      return formatDistanceToNow(new Date(review.created_at), { addSuffix: true, locale: ru });
    } catch (e) {
      return review.created_at;
    }
  };
  
  /**
   * Получает рейтинг
   * @returns {number} Рейтинг
   */
  const getRating = (): number => {
    return review.rating || 0;
  };
  
  /**
   * Получает аватар пользователя
   * @returns {string} URL аватара или инициалы
   */
  const getUserAvatar = (): string => {
    if (review.reviewer?.avatar) return review.reviewer.avatar;
    return '';
  };
  
  /**
   * Получает инициалы пользователя для аватара
   * @returns {string} Инициалы пользователя
   */
  const getUserInitials = (): string => {
    const { reviewer } = review;
    if (!reviewer) return '??';
    
    if (reviewer.first_name && reviewer.last_name) {
      return `${reviewer.first_name[0]}${reviewer.last_name[0]}`;
    } else if (reviewer.first_name) {
      return reviewer.first_name.substring(0, 2);
    } else if (reviewer.username) {
      return reviewer.username.substring(0, 2);
    }
    
    return '??';
  };
  
  /**
   * Обработчик клика по кнопке ответа на отзыв
   */
  const handleReply = () => {
    if (onReply) {
      onReply(review.id);
    }
  };
  
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 mb-4">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-start gap-3">
          <Avatar>
            <AvatarImage src={getUserAvatar()} alt={getClientName()} />
            <AvatarFallback>{getUserInitials()}</AvatarFallback>
          </Avatar>
          <div>
            <h4 className="font-semibold text-gray-900">{getClientName()}</h4>
            <div className="flex items-center gap-2 mt-1">
              <Package className="w-3 h-3 text-gray-500" />
              <p className="text-sm text-gray-500">{getServiceName()}</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1 text-sm text-gray-500">
          <Calendar className="w-3 h-3" />
          <span>{getDate()}</span>
        </div>
      </div>
      
      <div className="flex items-center space-x-1 mb-3">
        {[...Array(5)].map((_, i) => (
          <Star 
            key={i} 
            className={`w-4 h-4 ${i < getRating() ? 'text-yellow-500 fill-current' : 'text-gray-300'}`} 
          />
        ))}
      </div>
      
      <p className="text-gray-700 mb-4">{getText()}</p>
      
      {/* Ответ на отзыв, если есть */}
      {review.reply && (
        <div className="mt-3 pl-4 border-l-2 border-gray-200">
          <div className="flex items-center gap-2 mb-2">
            <MessageSquare className="w-4 h-4 text-primary" />
            <h5 className="font-medium text-gray-900">Ответ от {getCreatorName()}</h5>
            <span className="text-xs text-gray-500">
              {formatDistanceToNow(new Date(review.reply.created_at), { addSuffix: true, locale: ru })}
            </span>
          </div>
          <p className="text-gray-700">{review.reply.content}</p>
        </div>
      )}
      
      {/* Кнопка для ответа на отзыв (только если пользователь может отвечать и еще нет ответа) */}
      {canReply && !review.reply && (
        <div className="mt-3 flex justify-end">
          <Button 
            variant="outline" 
            size="sm" 
            className="flex gap-1 items-center" 
            onClick={handleReply}
          >
            <MessageSquare className="w-4 h-4" />
            Ответить на отзыв
          </Button>
        </div>
      )}
    </div>
  );
};

export default ReviewCard;
