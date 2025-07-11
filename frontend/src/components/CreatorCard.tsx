import React from 'react';
import { Link } from 'react-router-dom';
import { Star, Heart, MessageSquare, Check, ExternalLink, Briefcase, MapPin, GraduationCap, Lock, Unlock, Phone, Mail, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Creator as MockCreator } from '@/data/creators';

// Тип для вложенного объекта пользователя от API
interface UserData {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  avatar: string;
  location: string;
  is_verified: boolean;
  phone?: string;
  bio?: string;
}

// Тип для API-формата данных креатора
interface APICreator {
  id: string | number;
  user?: UserData; // Используем вложенный тип
  bio?: string;
  creator_name?: string;
  categories?: { id: number; name: string; slug: string }[];
  rating?: number;
  reviews_count?: number;
  services_count?: number | string;
  base_price?: number | string;
  max_price?: number;
  tags?: string[];
  platform?: string;
  social_links?: Array<{ platform: string; url: string }>;
  location?: string;
  is_online?: boolean;
  is_verified?: boolean;
  response_time?: string;
  completion_rate?: number;
  date_joined?: string;
  last_login?: string;
  // Дополнительные поля
  first_name?: string;
  last_name?: string;
  nickname?: string;
  specialization?: string;
  experience?: string;
  available_for_hire?: boolean;
  phone?: string;
}

// Тип для компонента, который поддерживает оба формата данных
type CreatorProps = MockCreator | APICreator;

interface CreatorCardProps {
  creator: CreatorProps;
  useLink?: boolean;
  showDetailedProfile?: boolean;
}

const CreatorCard: React.FC<CreatorCardProps> = ({ creator, useLink, showDetailedProfile }) => {
  // Адаптеры для получения данных из разных форматов
  const getNestedUser = () => {
    return 'user' in creator ? creator.user : null;
  };

  const getName = (): string => {
    // Приоритет: Mock -> поля верхнего уровня -> вложенный user -> creator_name -> nickname
    if ('name' in creator) return creator.name; // Mock data

    // Проверяем поля, пришедшие на верхнем уровне
    if ('first_name' in creator || 'last_name' in creator) {
      const fn = (creator as APICreator).first_name || '';
      const ln = (creator as APICreator).last_name || '';
      const full = `${fn} ${ln}`.trim();
      if (full) return full;
    }

    // Проверяем вложенный объект user
    const user = getNestedUser();
    if (user && (user.first_name || user.last_name)) {
      return `${user.first_name || ''} ${user.last_name || ''}`.trim();
    }

    // Проверяем другие возможные варианты
    return (
      (creator as APICreator).nickname ||
      user?.username ||
      (creator as APICreator).creator_name ||
      'Неизвестный креатор'
    );
  };
  
  const getUsername = (): string => {
    const user = getNestedUser();
    return user?.username || ('username' in creator ? creator.username : '');
  };
  
  const getAvatar = (): string | null => {
    const user = getNestedUser();
    if (user && user.avatar && user.avatar.trim().length > 0) return user.avatar;
    if ('avatar' in creator && typeof creator.avatar === 'string' && creator.avatar.trim().length > 0) return creator.avatar;
    return null; // Возвращаем null вместо placeholder
  };

  const getIsVerified = (): boolean => {
    if ('isVerified' in creator) return !!creator.isVerified; // Mock
    const user = getNestedUser();
    return !!user?.is_verified;
  };
  
  const getIsOnline = (): boolean => {
    if ('isOnline' in creator) return !!creator.isOnline;
    return !!(creator as APICreator).is_online;
  };
  
  const getLocation = (): string | undefined => {
    if ('location' in creator && typeof creator.location === 'string') return creator.location; // Mock
    const user = getNestedUser();
    return user?.location;
  };
  
  const getDescription = (): string | undefined => {
    if ('description' in creator) return creator.description;
    return (creator as APICreator).bio;
  };
  
  const getBio = (): string | undefined => {
    if ('bio' in creator) return creator.bio;
    const user = getNestedUser();
    return user?.bio;
  };
  
  const getCategories = (): string[] => {
    if ('categories' in creator) {
      if (Array.isArray(creator.categories)) {
        // Для API формата
        return creator.categories.map(cat => cat.name || cat.slug || '');
      }
    }
    
    if ('category' in creator) return [creator.category];
    return [];
  };
  
  const getTags = (): string[] => {
    if ('tags' in creator && Array.isArray(creator.tags)) return creator.tags;
    return [];
  };
  
  const getServicesCount = (): number => {
    if ('services' in creator && Array.isArray(creator.services)) return creator.services.length;
    if ('services_count' in creator) {
      const count = creator.services_count;
      return typeof count === 'number' ? count : parseInt(count as string) || 0;
    }
    return 0;
  };
  
  const getBasePrice = (): string | number => {
    if ('base_price' in creator) {
      const price = creator.base_price;
      return price || 0;
    }
    if ('price' in creator) return creator.price;
    return 0;
  };
  
  const getRating = (): number | undefined => {
    if ('rating' in creator) return typeof creator.rating === 'number' ? creator.rating : undefined;
    return undefined;
  };
  
  const getReviews = (): number | undefined => {
    if ('reviews_count' in creator) return typeof creator.reviews_count === 'number' ? creator.reviews_count : undefined;
    if ('reviewsCount' in creator) return creator.reviewsCount;
    return undefined;
  };
  
  const getId = (): string | number => {
    return creator.id;
  };
  
  const getSpecialization = (): string | undefined => {
    return ('specialization' in creator) ? creator.specialization : undefined;
  };
  
  const getExperience = (): string | undefined => {
    return ('experience' in creator) ? creator.experience : undefined;
  };
  
  const getAvailableForHire = (): boolean => {
    return ('available_for_hire' in creator) ? !!creator.available_for_hire : true;
  };

  const getSocialLinks = (): Array<{platform: string, url: string}> | undefined => {
    if ('social_links' in creator && Array.isArray(creator.social_links)) {
      return creator.social_links as Array<{platform: string, url: string}>;
    }
    return undefined;
  };

  const getPhone = (): string | undefined => {
    const user = getNestedUser();
    return user?.phone || ('phone' in creator ? creator.phone as string : undefined);
  };
  
  // Эти методы будут работать только в профиле креатора, где есть полные данные пользователя
  // В каталоге эти данные не доступны, так как бэкенд возвращает только user_id
  const getEmail = (): string | undefined => {
    const user = getNestedUser();
    return user?.email;
  };
  
  const getDateJoined = (): string | undefined => {
    const user = getNestedUser();
    return user?.date_joined;
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 dark:border-gray-700 hover:border-purple-200 dark:hover:border-purple-800 group">
      <div className="relative p-6">
        {/* Верхняя часть карточки с аватаркой, именем и статусами */}
        <div className="flex items-center mb-4">
          <div className="relative mr-4">
            <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-700">
              {getAvatar() ? (
                <img
                  src={getAvatar() as string}
                  alt={`${getName()} avatar`}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-lg font-bold bg-gray-100 dark:bg-gray-800 text-gray-500">
                  {getName().charAt(0)}
                </div>
              )}
            </div>
            {getIsOnline() && (
              <div className="absolute bottom-0 right-0 h-4 w-4 rounded-full bg-green-400 border-2 border-white dark:border-gray-700" />
            )}
          </div>
          <div className="flex-1 overflow-hidden">
            <div className="flex items-center">
              <h3 className="font-semibold text-lg truncate group-hover:text-primary">
                {getName()}
              </h3>
              {getIsVerified() && (
                <Check className="h-4 w-4 ml-1 text-primary" />
              )}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              @{getUsername()}
            </div>
            <div className="flex flex-wrap items-center gap-3 mt-1 text-xs">
              {typeof getRating() === 'number' && (
                <div className="flex items-center">
                  <Star className="w-3 h-3 text-yellow-400 mr-1" />
                  <span className="font-medium">
                    {typeof getRating() === 'number' ? getRating()!.toFixed(1) : 'Н/Д'}
                  </span>
                </div>
              )}
              {getLocation() && (
                <div className="flex items-center">
                  <MapPin className="w-3 h-3 text-gray-500 mr-1" />
                  <span>{getLocation()}</span>
                </div>
              )}
              {/* Номер телефона отображается только на странице профиля, но не в каталоге */}
              {showDetailedProfile && getPhone() && (
                <div className="flex items-center">
                  <Phone className="w-3 h-3 text-gray-500 mr-1" />
                  <span>{getPhone()}</span>
                </div>
              )}
              {/* Контактная информация будет отображаться только в профиле креатора */}
              {showDetailedProfile && getEmail() && (
                <div className="flex items-center">
                  <Mail className="w-3 h-3 text-gray-500 mr-1" />
                  <span className="text-xs truncate max-w-[120px]">{getEmail()}</span>
                </div>
              )}
              {showDetailedProfile && getDateJoined() && (
                <div className="flex items-center">
                  <Calendar className="w-3 h-3 text-gray-500 mr-1" />
                  <span className="text-xs">{new Date(getDateJoined() || '').toLocaleDateString()}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Статус доступности для найма */}
        <div className="mb-3">
          {getAvailableForHire() ? (
            <div className="flex items-center text-green-600">
              <Unlock className="w-4 h-4 text-green-500 mr-1" />
              <span className="text-sm">Доступен для найма</span>
            </div>
          ) : (
            <div className="flex items-center text-gray-600">
              <Lock className="w-4 h-4 text-gray-500 mr-1" />
              <span className="text-sm">Недоступен для найма</span>
            </div>
          )}
        </div>

        {/* Специализация и опыт */}
        <div className="flex flex-col gap-2 mb-4">
          {/* Всегда показываем поле Специализация */}
          <div className="flex items-center gap-2">
            <Briefcase className="h-4 w-4 text-primary" />
            <div>
              <h3 className="font-medium text-xs text-gray-500">Специализация</h3>
              <p className="text-sm">{getSpecialization() || 'Не указана'}</p>
            </div>
          </div>
          
          {/* Всегда показываем поле Опыт работы */}
          <div className="flex items-center gap-2">
            <GraduationCap className="h-4 w-4 text-primary" />
            <div>
              <h3 className="font-medium text-xs text-gray-500">Опыт работы</h3>
              <p className="text-sm">{getExperience() || 'Не указан'}</p>
            </div>
          </div>
        </div>

        {/* Описание (всегда отображаем) */}
        <div className="mb-4">
          <h3 className="font-medium text-xs text-gray-500 mb-1">О себе</h3>
          <p className="text-gray-600 dark:text-gray-300 text-sm line-clamp-3">
            {getBio() || 'Нет информации'}
          </p>
        </div>

        {/* Теги с горизонтальной прокруткой */}
        {getTags().length > 0 && (
          <div className="mb-4 overflow-hidden">
            <div className="overflow-x-auto" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
              <div className="flex gap-2 pb-1" style={{ minWidth: 'max-content' }}>
                {getTags().map((tag, idx) => (
                  <Badge key={idx} variant="outline" className="whitespace-nowrap">
                    #{tag}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Социальные сети */}
        {getSocialLinks() && getSocialLinks()!.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {getSocialLinks()!.slice(0, 3).map((link, idx) => (
              <a 
                key={idx} 
                href={link.url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-primary text-xs hover:underline"
              >
                <ExternalLink className="h-3 w-3" />
                {link.platform}
              </a>
            ))}
          </div>
        )}

        {/* Информация о цене и услугах */}
        <div className="flex items-center justify-between mb-4">
          <div className="text-sm">
            <span className="font-semibold">{getServicesCount() || 0}</span>
            <span className="text-gray-500"> услуг</span>
          </div>
          <div className="text-right">
            <span className="text-gray-500 text-sm">от </span>
            <span className="font-semibold text-primary">{getBasePrice() || 0}₽</span>
          </div>
        </div>

        {/* Кнопки действий */}
        <div className="flex justify-between items-center pt-2 border-t border-gray-100 dark:border-gray-700">
          <Button variant="ghost" size="sm" className="text-gray-500 hover:text-primary" asChild>
            <Link to={`/creators/${getId()}`}>
              <ExternalLink className="h-4 w-4 mr-1" />
              Профиль
            </Link>
          </Button>
          <div className="flex space-x-2">
            <Button variant="ghost" size="sm" className="text-gray-500 hover:text-primary">
              <MessageSquare className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" className="text-gray-500 hover:text-red-500">
              <Heart className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreatorCard;