/**
 * Компонент для отображения списка отзывов
 * 
 * Компонент отображает список отзывов с пагинацией и возможностью
 * фильтрации по различным параметрам.
 */

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Review } from '@/types/review';
import ReviewCard from './ReviewCard';
import { Pagination } from './ui/pagination';
import { Skeleton } from './ui/skeleton';
import api from '@/lib/api';
import { useApiContext } from '@/contexts/ApiContext';
import { useToast } from '@/components/ui/use-toast';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { useState } from 'react';

interface ReviewsListProps {
  /** ID создателя для фильтрации отзывов (опционально) */
  creatorId?: number;
  /** Количество отзывов на странице */
  pageSize?: number;
  /** Класс для стилизации контейнера */
  className?: string;
}

/**
 * Компонент списка отзывов
 * 
 * @param props - Свойства компонента
 * @returns React компонент
 */
const ReviewsList: React.FC<ReviewsListProps> = ({
  creatorId,
  pageSize = 10,
  className = '',
}) => {
  const [page, setPage] = useState<number>(1);
  const [replyDialogOpen, setReplyDialogOpen] = useState<boolean>(false);
  const [selectedReviewId, setSelectedReviewId] = useState<number | null>(null);
  const [replyContent, setReplyContent] = useState<string>('');
  
  const { user } = useApiContext();
  const isAdmin = user?.is_staff || false;
  const { toast } = useToast();
  
  // Запрос на получение отзывов
  const {
    data,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['reviews', creatorId, page, pageSize],
    queryFn: async () => {
      const params = {
        page,
        page_size: pageSize,
      };
      
      if (creatorId) {
        return api.getCreatorReviews(creatorId, params);
      } else {
        return api.getReviews(params);
      }
    },
  });

  /**
   * Обработчик нажатия на кнопку ответа на отзыв
   * @param reviewId - ID отзыва
   */
  const handleReply = (reviewId: number) => {
    setSelectedReviewId(reviewId);
    setReplyContent('');
    setReplyDialogOpen(true);
  };

  /**
   * Обработчик отправки ответа на отзыв
   */
  const handleSubmitReply = async () => {
    if (!selectedReviewId || !replyContent.trim()) return;
    
    try {
      await api.createReviewReply(selectedReviewId, { content: replyContent });
      toast({ 
        title: 'Ответ отправлен',
        description: 'Ваш ответ на отзыв был успешно опубликован'
      });
      setReplyDialogOpen(false);
      refetch(); // Обновить список отзывов
    } catch (error) {
      console.error('Error submitting reply:', error);
      toast({
        title: 'Ошибка отправки ответа',
        description: 'Не удалось отправить ответ. Пожалуйста, попробуйте еще раз.',
        variant: 'destructive'
      });
    }
  };

  /**
   * Проверяет, может ли текущий пользователь отвечать на отзыв
   * @returns true если пользователь создатель или администратор
   */
  const canReply = () => {
    return isAdmin || user?.user_type === 'creator';
  };
  
  // Загрузка скелетонов во время загрузки данных
  if (isLoading) {
    return (
      <div className={className}>
        {[...Array(3)].map((_, i) => (
          <div key={i} className="mb-4">
            <div className="flex items-start gap-3 mb-3">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div>
                <Skeleton className="h-4 w-40 mb-2" />
                <Skeleton className="h-3 w-28" />
              </div>
            </div>
            <div className="flex mb-2">
              {[...Array(5)].map((_, star) => (
                <Skeleton key={star} className="h-4 w-4 mr-1 rounded-full" />
              ))}
            </div>
            <Skeleton className="h-16 w-full mb-3" />
          </div>
        ))}
      </div>
    );
  }
  
  // Если нет отзывов
  if (!data || !data.results || data.results.length === 0) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <p className="text-gray-500">Отзывы отсутствуют</p>
      </div>
    );
  }
  
  const reviews = data.results as Review[];
  const totalPages = Math.ceil((data.count || 0) / pageSize);
  
  return (
    <div className={className}>
      {reviews.map((review) => (
        <ReviewCard 
          key={review.id} 
          review={review}
          onReply={handleReply}
          canReply={canReply() && !review.reply}
        />
      ))}
      
      {/* Пагинация */}
      {totalPages > 1 && (
        <div className="flex justify-center mt-6">
          <div className="flex justify-center gap-2 mt-4">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <Button
                key={page}
                variant={page === page ? 'default' : 'outline'}
                size="sm"
                onClick={() => setPage(page)}
              >
                {page}
              </Button>
            ))}
          </div>
        </div>
      )}
      
      {/* Диалог для ответа на отзыв */}
      <Dialog open={replyDialogOpen} onOpenChange={setReplyDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Ответить на отзыв</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Textarea
              placeholder="Напишите ваш ответ здесь..."
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              className="min-h-[100px]"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReplyDialogOpen(false)}>
              Отмена
            </Button>
            <Button onClick={handleSubmitReply}>
              Отправить ответ
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ReviewsList;
