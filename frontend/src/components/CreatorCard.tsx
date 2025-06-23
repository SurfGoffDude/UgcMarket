
import React from 'react';
import { Link } from 'react-router-dom';
import { Star, Heart, MessageSquare, Check, ExternalLink, Briefcase } from 'lucide-react';
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
  social_links?: Record<string, string>;
  location?: string;
  is_online?: boolean; // Это поле может быть на верхнем уровне
  is_verified?: boolean;
  response_time?: string;
  completion_rate?: number;
  date_joined?: string;
  last_login?: string;
  // Дополнительные поля, которые приходят с API
  first_name?: string;
  last_name?: string;
  nickname?: string;
}

// Тип для компонента, который поддерживает оба формата данных
type CreatorProps = MockCreator | APICreator;

interface CreatorCardProps {
  creator: CreatorProps;
}

const CreatorCard: React.FC<CreatorCardProps> = ({ creator }) => {
  // Адаптеры для получения данных из разных форматов
  const getNestedUser = () => {
    return 'user' in creator ? creator.user : null;
  }

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
      creator.creator_name ||
      'Неизвестный креатор'
    );
  };
  
  const getUsername = (): string => {
    const user = getNestedUser();
    return user?.username || ('username' in creator ? creator.username : '');
  };
  
  const getAvatar = (): string => {
    const user = getNestedUser();
    if (user && user.avatar) return user.avatar;
    if ('avatar' in creator && typeof creator.avatar === 'string') return creator.avatar;
    return 'https://via.placeholder.com/150';
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
  
  const getTags = (): string[] => {
    if ('tags' in creator) return creator.tags;
    return (creator as APICreator).tags || [];
  };
  
  // const getRating = (): number => {
  //  if ('rating' in creator) return creator.rating;
  //  return creator.rating || 0;
  // };
  
  const getReviews = (): number => {
    if ('reviews' in creator) return creator.reviews;
    return (creator as APICreator).reviews_count || 0;
  };

  const getBasePrice = (): number => {
    if ('base_price' in creator) {
      const price = (creator as any).base_price;
      if (typeof price === 'number') return price;
      if (typeof price === 'string') return parseFloat(price) || 0;
    }
    return 0;
  };

  const getSocialLinks = (): Record<string, string> | undefined => {
    if ('socialLinks' in creator) return creator.socialLinks;
    return (creator as APICreator).social_links;
  };
  
  const getCategories = (): string[] => {
    if ('categories' in creator && Array.isArray(creator.categories)) {
      if (typeof creator.categories[0] === 'string') {
        return creator.categories as string[];
      } else {
        return (creator.categories as {name: string}[]).map(cat => cat.name);
      }
    }
    return [];
  };

  const getServicesCount = (): number => {
    if ('services_count' in creator) {
      const count = (creator as any).services_count;
      if (typeof count === 'string') return Number(count) || 0;
      return count || 0;
    }
    return 0;
  };

  // Функция для отображения названия платформы
  const getPlatformName = (platform: string) => {
    switch (platform.toLowerCase()) {
      case 'tiktok':
        return 'TikTok';
      case 'instagram':
        return 'Instagram';
      case 'youtube':
        return 'YouTube';
      default:
        return platform;
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 dark:border-gray-700 hover:border-purple-200 dark:hover:border-purple-800 group">
      {/* Header with avatar and online status */}
      <div className="relative p-6 pb-4">
        <div className="flex items-start justify-between">
          <Link to={`/creators/${creator.id}`} className="flex items-center space-x-3 flex-1">
            <div className="relative">
              <img 
                src={getAvatar()} 
                alt={getName()}
                className="w-14 h-14 rounded-full object-cover border-2 border-gray-100 dark:border-gray-700"
              />
              {getIsOnline() && (
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white dark:border-gray-800"></div>
              )}
              {getIsVerified() && (
                <div className="absolute -top-1 -right-1 w-5 h-5 bg-blue-500 text-white rounded-full flex items-center justify-center">
                  <Check className="w-3 h-3" />
                </div>
              )}
            </div>
            <div className="overflow-hidden">
              <h3 className="font-semibold text-gray-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors truncate">
                {getName()}
              </h3>
              <p className="text-gray-500 dark:text-gray-400 text-sm truncate">@{getUsername()}</p>
            </div>
          </Link>
          <button 
            className="text-gray-400 hover:text-red-500 transition-colors flex-shrink-0 ml-2"
            aria-label="Добавить в избранное"
          >
            <Heart className="w-5 h-5" />
          </button>
        </div>

        {/* Platform and categories */}
        <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
          {getLocation() && (
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {getLocation()?.split(',')[0]}
            </span>
          )}
        </div>
      </div>

      {/* Description */}
      {getDescription() && (
        <div className="px-6 pb-4">
          <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2">
            {getDescription()}
          </p>
        </div>
      )}

      {/* Категории */}
      {getCategories().length > 0 && (
        <div className="px-6 pb-4">
          <div className="flex flex-wrap gap-2">
            {getCategories().map((cat, idx) => (
              <Badge key={idx} variant="secondary" className="text-xs">{cat}</Badge>
            ))}
          </div>
        </div>
      )}

      {/* Теги */}
      {getTags().length > 0 && (
        <div className="px-6 pb-4">
          <div className="overflow-x-auto" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            <div className="flex gap-2 pb-1" style={{ minWidth: 'max-content' }}>
              {getTags().map((tag, idx) => (
                <Badge key={idx} variant="outline" className="text-xs whitespace-nowrap">{`#${tag}`}</Badge>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Rating and price */}
      <div className="px-6 pb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-1 bg-gray-50 dark:bg-gray-700/50 px-2 py-1 rounded-full">
              <Star className="w-4 h-4 text-yellow-500 fill-current" />
              {/* <span className="font-semibold text-gray-900 dark:text-white">{getRating().toFixed(1)}</span> */}
              <span className="text-gray-500 dark:text-gray-400 text-xs">
                ({getReviews()})
              </span>
            </div>
            <div className="flex items-center space-x-1 bg-gray-50 dark:bg-gray-700/50 px-2 py-1 rounded-full">
              <Briefcase className="w-4 h-4 text-blue-500" />
              <span className="text-gray-500 dark:text-gray-400 text-xs">
                {getServicesCount()} услуг
              </span>
            </div>
          </div>

          {/* Price */}
          <div className="text-right">
            <p className="text-sm text-gray-500 dark:text-gray-400">от</p>
            <p className="text-lg font-bold text-purple-600 dark:text-purple-400">{getBasePrice()}₽</p>
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="px-6 pb-6 pt-2 flex space-x-2">
        <Link to={`/creators/${creator.id}`} className="flex-1">
          <Button 
            variant="outline"
            size="sm" 
            className="w-full rounded-full border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
          >
            <MessageSquare className="w-4 h-4 mr-2" />
            Написать
          </Button>
        </Link>
        <Link to={`/creators/${creator.id}`} className="flex-1">
          <Button 
            size="sm" 
            className="w-full rounded-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white transition-all"
          >
            Подробнее
            <ExternalLink className="w-4 h-4 ml-2" />
          </Button>
        </Link>
      </div>
      
      {/* Social links */}
      {getSocialLinks() && (
        <div className="px-6 pb-4 pt-2 flex items-center justify-center space-x-4">
          {getSocialLinks()?.instagram && (
            <a 
              href={getSocialLinks()?.instagram} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-pink-600 dark:hover:text-pink-400 transition-colors"
              aria-label="Instagram"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path fillRule="evenodd" d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.415-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.248-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-1.893.014-2.363.086-3.14.07-.7.204-1.22.392-1.67.205-.497.43-.854.74-1.165.31-.31.668-.534 1.165-.74.45-.188.97-.322 1.67-.393.777-.072 1.247-.085 3.14-.085h.63zM12 6.938a5.063 5.063 0 100 10.125 5.063 5.063 0 000-10.125zm0 8.35a3.288 3.288 0 110-6.575 3.288 3.288 0 010 6.575zm7.312-10.15a1.183 1.183 0 100-2.365 1.183 1.183 0 000 2.366z" clipRule="evenodd" />
              </svg>
            </a>
          )}
          {getSocialLinks()?.tiktok && (
            <a 
              href={getSocialLinks()?.tiktok} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-black dark:hover:text-white transition-colors"
              aria-label="TikTok"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M12.53.02C13.84 0 15.14.01 16.44 0c.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
              </svg>
            </a>
          )}
          {getSocialLinks()?.youtube && (
            <a 
              href={getSocialLinks()?.youtube} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-red-600 transition-colors"
              aria-label="YouTube"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path fillRule="evenodd" d="M19.812 5.418c.861.23 1.538.907 1.768 1.768C21.998 8.746 22 12 22 12s0 3.255-.418 4.814a2.504 2.504 0 0 1-1.768 1.768c-1.56.419-7.814.419-7.814.419s-6.255 0-7.814-.419a2.505 2.505 0 0 1-1.768-1.768C2 15.255 2 12 2 12s0-3.255.417-4.814a2.507 2.507 0 0 1 1.768-1.768C5.744 5 11.998 5 11.998 5s6.255 0 7.814.418ZM15.194 12 10 15V9l5.194 3Z" clipRule="evenodd" />
              </svg>
            </a>
          )}
          {getSocialLinks()?.twitter && (
            <a 
              href={getSocialLinks()?.twitter} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-blue-500 transition-colors"
              aria-label="Twitter"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
              </svg>
            </a>
          )}
          {getSocialLinks()?.twitch && (
            <a 
              href={getSocialLinks()?.twitch} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-purple-600 transition-colors"
              aria-label="Twitch"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714Z" />
              </svg>
            </a>
          )}
        </div>
      )}
    </div>
  );
};

export default CreatorCard;
