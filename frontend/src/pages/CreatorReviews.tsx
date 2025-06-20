/**
 * Страница всех отзывов о создателе
 * 
 * Отображает полный список отзывов о конкретном создателе с пагинацией
 * и подробной статистикой рейтингов
 */

import React from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink } from '@/components/ui/breadcrumb';
import api from '@/lib/api';
import RatingStats from '@/components/RatingStats';
import ReviewsList from '@/components/ReviewsList';
import RatingDisplay from '@/components/RatingDisplay';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

/**
 * Компонент страницы всех отзывов о создателе
 */
const CreatorReviews: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const creatorId = Number(id);

  // Получаем основную информацию о создателе
  const { 
    data: creator,
    isLoading: creatorLoading,
    error: creatorError
  } = useQuery({
    queryKey: ['creator', creatorId],
    queryFn: () => api.getCreator(String(creatorId)),
    enabled: !!creatorId,
  });

  // Если данные загружаются, показываем скелетон
  if (creatorLoading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="flex items-center mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(-1)}
            className="mr-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Назад
          </Button>
          
          <div className="w-full">
            <Skeleton className="h-8 w-2/3 mb-2" />
            <Skeleton className="h-4 w-1/3" />
          </div>
        </div>
        
        <Separator className="my-6" />
        
        <div className="grid md:grid-cols-3 gap-8">
          <div className="md:col-span-1">
            <Skeleton className="h-[200px] w-full mb-6" />
            <Skeleton className="h-6 w-3/4 mb-4" />
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-2/3" />
          </div>
          
          <div className="md:col-span-2">
            <Skeleton className="h-8 w-1/3 mb-6" />
            <div className="space-y-6">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-[100px] w-full" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Обработка ошибки получения данных о создателе
  if (creatorError) {
    return (
      <div className="container mx-auto py-8 px-4">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Ошибка</AlertTitle>
          <AlertDescription>
            Не удалось загрузить информацию о создателе. Пожалуйста, попробуйте позже.
          </AlertDescription>
        </Alert>
        
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate(-1)}
          className="mt-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Вернуться назад
        </Button>
      </div>
    );
  }

  // Если создатель не найден
  if (!creator) {
    return (
      <div className="container mx-auto py-8 px-4 text-center">
        <h1 className="text-2xl font-bold mb-4">Создатель не найден</h1>
        <p className="text-muted-foreground mb-6">Возможно, создатель был удалён или изменён его идентификатор.</p>
        <Button onClick={() => navigate('/')}>
          Вернуться на главную
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      {/* Хлебные крошки и навигация */}
      <div className="mb-6">
        <Breadcrumb>
          <BreadcrumbItem>
            <Link to="/">Главная</Link>
          </BreadcrumbItem>
          <BreadcrumbItem>
            <Link to="/catalog">Каталог</Link>
          </BreadcrumbItem>
          <BreadcrumbItem>
            <Link to={`/creator/${creator.id}`}>{creator.display_name || 'Профиль создателя'}</Link>
          </BreadcrumbItem>
          <BreadcrumbItem>
            <span>Отзывы</span>
          </BreadcrumbItem>
        </Breadcrumb>
      </div>
      
      {/* Заголовок страницы */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">{creator.display_name}: отзывы</h1>
          <div className="flex items-center">
            <RatingDisplay 
              rating={creator.rating || 0} 
              reviewCount={creator.reviews_count} 
              size="lg" 
            />
          </div>
        </div>
        
        <Button variant="outline" onClick={() => navigate(`/creators/${creator.id}`)}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Профиль создателя
        </Button>
      </div>
      
      <Separator className="my-6" />
      
      <div className="grid md:grid-cols-3 gap-8">
        {/* Статистика рейтингов */}
        <div className="md:col-span-1">
          <div className="sticky top-6">
            <h2 className="text-xl font-semibold mb-4">Статистика рейтингов</h2>
            <RatingStats creatorId={creator.id} className="mb-6" />
            <p className="text-sm text-muted-foreground">
              Статистика рассчитана на основе {creator.reviews_count || 0} отзывов
              от клиентов, работавших с этим создателем контента.
            </p>
          </div>
        </div>
        
        {/* Список отзывов */}
        <div className="md:col-span-2">
          <h2 className="text-xl font-semibold mb-6">Все отзывы</h2>
          <ReviewsList creatorId={creator.id} />
        </div>
      </div>
    </div>
  );
};

export default CreatorReviews;
