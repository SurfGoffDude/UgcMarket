import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Avatar,
  AvatarFallback,
  AvatarImage
} from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useCreatorProfile } from '@/hooks/useCreatorProfile';
import { Star, MapPin, Users, Plus, Pencil } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';
import PortfolioItem from '@/components/PortfolioItem';
import ServiceCard from '@/components/ServiceCard';

const CreatorProfilePage: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { creator, loading, error } = useCreatorProfile(id);
  const { user: currentUser } = useAuth();
  const isOwner = currentUser?.id === creator?.user?.id;

  const ratingValue = creator && creator.rating !== undefined && creator.rating !== null ? Number(creator.rating) : null;

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error) {
    return <div className="text-red-500 text-center p-4">{error}</div>;
  }

  if (!creator) {
    return <div className="text-center p-4">Профиль не найден.</div>;
  }

  return (
    <div className="container mx-auto p-4 md:p-6">
      {/* "Шапка" профиля */}
      <Card className="relative rounded-xl p-6 mt-8 space-y-4 shadow-md">
        {isOwner && (
          <Button
            variant="outline"
            className="absolute top-6 right-6"
            onClick={() => navigate(`/creator/${creator.id}/edit`)}
          >
            <Pencil className="h-4 w-4 mr-2" />
            Редактировать
          </Button>
        )}
        {/* Верхняя часть: Аватар, инфо, кнопки */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="flex gap-4 w-full md:w-auto">
            <Avatar className="h-20 w-20 md:h-24 md:w-24">
              <AvatarImage src={creator.user?.avatar} alt={creator.user?.username} />
              <AvatarFallback>
                {creator.user?.first_name?.[0] || 'A'}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col justify-center">
              <h1 className="text-2xl font-bold">{creator.user?.first_name} {creator.user?.last_name}</h1>
              <p className="text-gray-500">@{creator.user?.username}</p>
              <div className="flex items-center gap-4 text-sm text-gray-600 mt-2">
                <span className="flex items-center gap-1">
                  <Star className="h-4 w-4 text-yellow-400" />
                  {ratingValue !== null ? ratingValue.toFixed(1) : 'N/A'}
                </span>
                <span className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  {creator.user?.location}
                </span>
                <span className="flex items-center gap-1">
                </span>
              </div>
            </div>
          </div>
          <div className="flex-shrink-0">
            {/* Кнопки действий (не для владельца) */}
            {!isOwner && (
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => creator.user?.id && navigate(`/chat/${creator.user.id}`)}>Написать</Button>
                <Button onClick={() => navigate(`/creator/${creator.id}/order`)}>Заказать услугу</Button>
              </div>
            )}
          </div>
        </div>

        {/* Описание/био */}
        {creator.user?.bio && (
          <p className="text-gray-700 whitespace-pre-line">{creator.user?.bio}</p>
        )}

        {/* Теги */}
        {creator.tags && creator.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-2">
            {creator.tags.slice(0, 10).map((tag: string, idx: number) => (
              <Badge key={idx} variant="outline" className="text-sm">{`#${tag}`}</Badge>
            ))}
          </div>
        )}
      </Card>

      {/* Кнопки для добавления контента (только для владельца) */}
      {isOwner && (
        <div className="flex justify-start gap-2 my-4">
          
          <Button variant="outline" onClick={() => navigate(`/tags/add`)}>
             <Plus className="h-4 w-4 mr-1" />
             Тег
           </Button>

           <Button variant="outline" onClick={() => navigate(`/services/add`)}>
             <Plus className="h-4 w-4 mr-1" />
             Услугу
           </Button>
          <Button variant="outline" onClick={() => navigate(`/portfolio/add`)}>
            <Plus className="h-4 w-4 mr-1" />
            Работу
          </Button>
        </div>
      )}

      {/* Основная область: Портфолио / Услуги */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
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
                <ServiceCard key={idx} service={service as any} creatorId={creator.id!} />
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
