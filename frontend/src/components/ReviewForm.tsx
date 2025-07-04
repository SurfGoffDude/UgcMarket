/**
 * Форма создания отзыва о заказе
 * 
 * Компонент предоставляет форму для создания отзыва о завершенном заказе,
 * включая выбор рейтинга и текстовый комментарий.
 */

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Star } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { useToast } from '@/components/ui/use-toast';
import api from '@/lib/api';
import { RATING_OPTIONS } from '@/types/review';
import { Label } from '@/components/ui/label';
import { useQueryClient } from '@tanstack/react-query';

interface ReviewFormProps {
  /** ID заказа, для которого создается отзыв */
  orderId: number;
  /** Обработчик успешной отправки отзыва */
  onSuccess?: () => void;
}

/**
 * Компонент формы создания отзыва
 * 
 * @param props - Свойства компонента
 * @returns React компонент
 */
const ReviewForm: React.FC<ReviewFormProps> = ({ orderId, onSuccess }) => {
  // Состояние формы
  const [rating, setRating] = useState<number>(0);
  const [comment, setComment] = useState<string>('');
  const [hoveredRating, setHoveredRating] = useState<number>(0);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Мутация для создания отзыва
  const createReviewMutation = useMutation({
    mutationFn: (data: { rating: number; comment: string }) => 
      api.createReview(orderId, data),
    onSuccess: () => {
      toast({ 
        title: 'Отзыв отправлен', 
        description: 'Ваш отзыв был успешно опубликован. Спасибо за обратную связь!' 
      });
      
      // Инвалидация запросов на получение заказа и отзывов
      queryClient.invalidateQueries({ queryKey: ['order', orderId] });
      queryClient.invalidateQueries({ queryKey: ['reviews'] });
      
      // Сброс формы
      setRating(0);
      setComment('');
      
      // Вызов колбэка при успешном создании отзыва
      if (onSuccess) {
        onSuccess();
      }
    },
    onError: (error) => {

      toast({
        title: 'Ошибка отправки отзыва',
        description: 'Не удалось отправить отзыв. Пожалуйста, попробуйте еще раз.',
        variant: 'destructive'
      });
    }
  });
  
  /**
   * Обработчик отправки формы
   */
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (rating === 0) {
      toast({
        title: 'Требуется рейтинг',
        description: 'Пожалуйста, выберите рейтинг для завершения отзыва',
        variant: 'destructive'
      });
      return;
    }
    
    if (!comment.trim()) {
      toast({
        title: 'Требуется комментарий',
        description: 'Пожалуйста, добавьте комментарий к вашему отзыву',
        variant: 'destructive'
      });
      return;
    }
    
    createReviewMutation.mutate({ rating, comment });
  };
  
  /**
   * Получает текстовое описание выбранного рейтинга
   */
  const getRatingLabel = (value: number): string => {
    const option = RATING_OPTIONS.find(option => option.value === value);
    return option ? option.label : '';
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label>Ваша оценка</Label>
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setRating(value)}
                onMouseEnter={() => setHoveredRating(value)}
                onMouseLeave={() => setHoveredRating(0)}
                className="p-1"
              >
                <Star
                  className={`w-8 h-8 transition-colors ${
                    value <= (hoveredRating || rating)
                      ? 'text-yellow-500 fill-current'
                      : 'text-gray-300'
                  }`}
                />
              </button>
            ))}
          </div>
          {rating > 0 && (
            <span className="text-sm text-gray-600">{getRatingLabel(rating)}</span>
          )}
        </div>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="comment">Ваш комментарий</Label>
        <Textarea
          id="comment"
          placeholder="Расскажите о вашем опыте сотрудничества..."
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          className="min-h-[120px]"
        />
        <p className="text-xs text-gray-500">
          Ваш отзыв поможет другим клиентам и создателю улучшить качество услуг.
        </p>
      </div>
      
      <Button
        type="submit"
        disabled={createReviewMutation.isPending}
        className="w-full"
      >
        {createReviewMutation.isPending ? 'Отправка...' : 'Опубликовать отзыв'}
      </Button>
    </form>
  );
};

export default ReviewForm;
