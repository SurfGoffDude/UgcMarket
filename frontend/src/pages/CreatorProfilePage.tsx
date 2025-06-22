import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Avatar,
  AvatarFallback,
  AvatarImage
} from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useCreatorProfile } from '@/hooks/useCreatorProfile';
import { User, Star, MapPin, Users, Plus } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';
import PortfolioItem from '@/components/PortfolioItem';
import ServiceCard from '@/components/ServiceCard';

/**
 * CreatorProfilePageNew
 * ---------------------
 * Новый редизайн страницы профиля креатора (по макету от пользователя).
 * Структура:
 * 1. "Шапка" — карточка с аватаром, именем, @username, рейтингом, локацией, подписчиками, описанием,
 *    тегами-навыками и кнопками действий.
 * 2. Ниже — две колонки: Портфолио (слева) и Услуги (справа).
 *
 * NB: Пока реализована только шапка + заготовка для колонок.
 * Последующая логика (рендер работ, услуг, обработчики) будет добавляться по мере разработки.
 */
const CreatorProfilePage: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { creator, loading, error } = useCreatorProfile(!id ? undefined : id);
  const { user: currentUser } = useAuth();
  const isOwner = currentUser?.id === creator?.user?.id;

  // Безопасное преобразование рейтинга в число для корректного вывода
  const ratingValue = creator && creator.rating !== undefined && creator.rating !== null ? Number(creator.rating) : null;

  if (loading || !creator) {
    return (
      <div className="flex justify-center pt-20">
        <Loader2 className="animate-spin mr-2" /> Загрузка…
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-red-500 pt-20">
        Ошибка загрузки профиля
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 pb-12">
      {/* Шапка профиля */}
      <Card className="rounded-xl p-6 mt-8 space-y-4 shadow-md">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          {/* Левая секция: аватар и информация */}
          <div className="flex gap-4 w-full md:w-auto">
            <Avatar className="h-24 w-24">
              <AvatarImage src={creator.user?.avatar || ''} alt={creator.user?.username || ''} />
              <AvatarFallback>
                {creator.user?.username?.charAt(0).toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>

            <div className="space-y-1">
              <h1 className="text-2xl font-semibold leading-tight">
                {creator.user?.first_name || creator.user?.last_name ? `${creator.user.first_name ?? ''} ${creator.user.last_name ?? ''}`.trim() : creator.title || 'Имя не указано'}
              </h1>
              <div className="text-sm text-gray-500">@{creator.user?.username}</div>

              <div className="flex flex-wrap gap-2 text-sm mt-2 text-gray-600">
                {ratingValue !== null && !Number.isNaN(ratingValue) && (
                  <span className="flex items-center gap-1">
                    <Star className="h-4 w-4 text-yellow-500" />
                    {ratingValue.toFixed(1)}
                  </span>
                )}
                {(creator.user?.location || creator.location) && (
                  <span className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    {creator.user?.location || creator.location}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Правая секция: кнопки действий */}
          <div className="flex gap-3 w-full md:w-auto">
            {isOwner && (
              <Button variant="ghost" size="icon" title="Редактировать профиль" onClick={() => navigate('/profile/edit')}> 
                <User className="h-5 w-5" />
              </Button>
            )}
            {isOwner && (
              <Button variant="outline" size="sm" onClick={() => navigate('/skills/add')}>
                <Plus className="h-4 w-4 mr-1" />Навык
              </Button>
            )}
            {isOwner && (
              <Button variant="outline" size="sm" onClick={() => navigate('/services/add')}>
                <Plus className="h-4 w-4 mr-1" />Услугу
              </Button>
            )}
            {isOwner && (
              <Button variant="outline" size="sm" onClick={() => navigate('/portfolio/add')}>
                <Plus className="h-4 w-4 mr-1" />Работу
              </Button>
            )}
            <Button variant="outline" className="w-full md:w-auto">
              Написать
            </Button>
            <Button className="w-full md:w-auto">Заказать услугу</Button>
          </div>
        </div>

        {/* Описание */}
        {(creator.user?.bio || (creator as any).bio) && (
          <p className="text-gray-700 whitespace-pre-line">{creator.user?.bio || (creator as any).bio}</p>
        )}

        {/* Теги-навыки */}
        {creator.skills && creator.skills.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-2">
            {creator.skills.slice(0, 10).map((skill, idx) => (
              <Badge key={idx} variant="secondary" className="text-sm">
                {'name' in skill ? skill.name : skill.skill?.name || 'Навык'}
              </Badge>
            ))}
          </div>
        )}
      </Card>

      {/* Основная область: Портфолио / Услуги */}
      <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Портфолио (2/3) */}
        <section className="md:col-span-2 space-y-4">
          <h2 className="text-xl font-semibold">Портфолио</h2>
          {creator.portfolio && creator.portfolio.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {creator.portfolio.map((item, idx) => (
                <PortfolioItem key={idx} item={item as any} />
              ))}
            </div>
          ) : (
            <Card className="h-40 flex items-center justify-center text-gray-400">
              Работы отсутствуют
            </Card>
          )}
        </section>

        {/* Услуги (1/3) */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold">Услуги</h2>
          {creator.services && creator.services.length > 0 ? (
            <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
              {creator.services.map((service, idx) => (
                <ServiceCard key={idx} service={service as any} creatorId={creator.id} />
              ))}
            </div>
          ) : (
            <Card className="p-4 text-gray-400">Услуги отсутствуют</Card>
          )}
        </section>
      </div>
    </div>
  );
};

export default CreatorProfilePage;
