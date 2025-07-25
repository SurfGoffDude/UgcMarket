import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { CreatorProfile } from '@/types/user';
import {
  Avatar,
  AvatarFallback,
  AvatarImage
} from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useCreatorProfile } from '@/hooks/useCreatorProfile';
import { Star, MapPin, Pencil, Plus, Calendar, Briefcase, GraduationCap, Lock, Unlock, ExternalLink, Phone, Clock, UserIcon, Heart, User } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2, MessageSquare } from 'lucide-react';
import PortfolioItem from '@/components/PortfolioItem';
import ServiceCard from '@/components/ServiceCard';
import SocialIcon from '@/components/SocialIcon';
import { useChat } from '@/hooks/useChat';

const CreatorProfilePage: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { creator, loading, error } = useCreatorProfile(id);
  const { user: currentUser } = useAuth();
  const isOwner = currentUser?.id === creator?.user?.id;
  const { openChatWithCreator, loading: chatLoading } = useChat();

  const ratingValue = creator && creator.rating !== undefined && creator.rating !== null ? Number(creator.rating) : null;

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error) {
    return <div className="text-red-500 text-center p-4">{error instanceof Error ? error.message : String(error)}</div>;
  }

  if (!creator) {
    return <div className="text-center p-4">Профиль не найден.</div>;
  }

  return (
    <div className="w-full p-4 md:p-6">
      {/* "Шапка" профиля */}
      <Card className="relative rounded-xl p-6 mt-8 space-y-4 shadow-md">
        {isOwner && (
          <Button
            variant="outline"
            className="absolute top-6 right-6"
            onClick={() => navigate(`/creators/${creator.id}/edit`)}
          >
            <Pencil className="h-4 w-4 mr-2" />
            Редактировать
          </Button>
        )}
        {/* Верхняя часть: Аватар, инфо, кнопки */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="flex gap-4 w-full md:w-auto">
            <Avatar className="h-20 w-20 md:h-24 md:w-24">
              <AvatarImage src={`${creator.user?.avatar}?t=${Date.now()}`} alt={creator.user?.username} />
              <AvatarFallback>
                {creator.user?.first_name?.[0] || 'A'}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col text-left">
              <h1 className="text-2xl font-bold">{creator.user?.first_name} {creator.user?.last_name}</h1>
              <p className="text-gray-500">@{creator.user?.username}</p>
              <div className="flex items-center gap-4 text-sm text-gray-600 mt-2">
                <span className="flex items-center gap-1">
                  <Star className="h-4 w-4 text-yellow-400" />
                  {ratingValue !== null ? ratingValue.toFixed(1) : 'N/A'}
                </span>
                {creator.user?.gender && (
                  <span className="flex items-center gap-1">
                    {creator.user.gender === 'male' ? (
                      <UserIcon className="h-4 w-4 text-blue-500" />
                    ) : creator.user.gender === 'female' ? (
                      <Heart className="h-4 w-4 text-pink-500" />
                    ) : (
                      <User className="h-4 w-4 text-gray-400" />
                    )}
                    <span>
                      {creator.user.gender === 'male' ? 'Мужской' :
                       creator.user.gender === 'female' ? 'Женский' :
                       creator.user.gender === 'other' ? 'Другой' : 'Не указан'}
                    </span>
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  {creator.user?.location || 'Не указано'}
                </span>
                <span className="flex items-center gap-1">
                  {creator.available_for_hire ? (
                    <>
                      <Unlock className="h-4 w-4 text-green-500" />
                      <span className="text-green-600">Доступен для найма</span>
                    </>
                  ) : (
                    <>
                      <Lock className="h-4 w-4 text-gray-500" />
                      <span className="text-gray-600">Недоступен для найма</span>
                    </>
                  )}
                </span>
              </div>
            </div>
          </div>
          <div className="flex-shrink-0">
            {/* Кнопки действий (не для владельца) */}
            {!isOwner && (
              <div className="flex gap-2">
                <Button 
                  variant="default" 
                  onClick={() => creator && openChatWithCreator(creator.id)}
                  disabled={chatLoading}
                >
                  {chatLoading ? (
                    <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                  ) : (
                    <MessageSquare className="h-4 w-4 mr-1" />
                  )}
                  Написать
                </Button>
                <Button onClick={() => navigate(`/creator/${creator.id}/order`)}>Заказать услугу</Button>
              </div>
            )}
          </div>
        </div>

        {/* Специализация и опыт */}
        <div className="flex flex-col md:flex-row gap-4 pt-2">
          {creator.specialization && (
            <div className="flex items-center gap-2">
              <Briefcase className="h-5 w-5 text-primary" />
              <div>
                <h3 className="font-medium text-sm text-gray-500">Специализация</h3>
                <p>{creator.specialization}</p>
              </div>
            </div>
          )}
          
          {creator.experience && (
            <div className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5 text-primary" />
              <div>
                <h3 className="font-medium text-sm text-gray-500">Опыт работы</h3>
                <p>{creator.experience}</p>
              </div>
            </div>
          )}

          {creator.average_work_time && (
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              <div>
                <h3 className="font-medium text-sm text-gray-500">Среднее время выполнения</h3>
                <p>
                  {creator.average_work_time === 'up_to_24_hours' && 'До 24 часов'}
                  {creator.average_work_time === 'up_to_3_days' && 'До 3 дней'}
                  {creator.average_work_time === 'up_to_10_days' && 'До 10 дней'}
                  {creator.average_work_time === 'up_to_14_days' && 'До 14 дней'}
                  {creator.average_work_time === 'up_to_30_days' && 'До 30 дней'}
                  {creator.average_work_time === 'up_to_60_days' && 'До 60 дней'}
                  {creator.average_work_time === 'more_than_60_days' && 'Более 60 дней'}
                </p>
              </div>
            </div>
          )}
        </div>
        
        {/* Описание/био */}
        {creator.user?.bio && (
          <div className="pt-2 text-left">
            <h3 className="font-medium text-sm text-gray-500">О себе</h3>
            <p className="text-gray-700 whitespace-pre-line">{creator.user?.bio}</p>
          </div>
        )}
        
        {/* Социальные сети */}
        {creator.social_links && creator.social_links.length > 0 && (
          <div className="pt-4">
            <h3 className="font-medium text-lg mb-4 text-left">Социальные сети</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {creator.social_links.map((link: any, idx: number) => {
                // Функция для получения понятного названия платформы
                const getPlatformName = (platform: string): string => {
                  const names: Record<string, string> = {
                    facebook: "Facebook",
                    youtube: "YouTube",
                    twitter: "Twitter",
                    instagram: "Instagram",
                    whatsapp: "WhatsApp",
                    tiktok: "TikTok",
                    linkedin: "LinkedIn",
                    telegram: "Telegram",
                    pinterest: "Pinterest",
                    reddit: "Reddit",
                    vkontakte: "ВКонтакте",
                    dzen: "Дзен",
                    twitch: "Twitch"
                  };
                  return names[platform] || platform;
                };
                
                return (
                  <div key={idx} className="bg-white/60 p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow border border-gray-100">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="bg-[#E95C4B]/20 rounded-full p-2 shadow-sm">
                        <SocialIcon platform={link.platform} className="h-5 w-5 text-[#E95C4B]" />
                      </div>
                      <h4 className="font-medium">{getPlatformName(link.platform)}</h4>
                    </div>
                    <a 
                      href={link.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:text-blue-800 hover:underline block truncate"
                      title={link.url}
                    >
                      {link.url.replace(/^https?:\/\//i, '')}
                    </a>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Теги */}
        {(creator as any).tags && (creator as any).tags.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-2">
            {(creator as any).tags.slice(0, 10).map((tag: string, idx: number) => (
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
                <ServiceCard key={idx} service={service as any} />
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
