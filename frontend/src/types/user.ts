/**
 * Типы данных для работы с пользователями
 * 
 * Содержит интерфейсы для работы с данными пользователей,
 * профилями и связанной информацией.
 */

/**
 * Базовый интерфейс пользователя
 */
export interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  full_name: string;
  avatar?: string;
  phone?: string;
  bio?: string;
  is_verified: boolean;
  user_type: 'Клиент' | 'Креатор';
  date_joined: string;
  has_creator_profile: boolean;
  has_client_profile: boolean;
}

/**
 * Расширенный профиль креатора
 * 
 * Содержит все поля профиля креатора, включая основную информацию,
 * данные для отображения в каталоге и на странице профиля.
 */
export interface CreatorProfile {
  id: number;
  user: User;
  nickname?: string;
  full_name?: string;
  username?: string;
  avatar?: string;
  bio?: string;
  location?: string;
  specialization: string;
  experience: string;
  portfolio_link?: string;
  cover_image?: string;
  is_online?: boolean;
  available_for_hire?: boolean;
  tags?: string[];
  social_links?: Array<{
    platform: string;
    url: string;
  }>;
  rating: number;
  review_count?: number;
  completed_orders: number;
  average_response_time?: string;
  created_at: string;
  updated_at: string;
}

/**
 * Профиль клиента
 */
export interface ClientProfile {
  id: number;
  user: User;
  company_name?: string;
  position?: string;
  website?: string;
  about?: string;
  notifications_enabled: boolean;
  email_notifications: boolean;
  push_notifications: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Тип пользовательского профиля для обновления данных
 */
export interface UserProfileUpdate {
  first_name?: string;
  last_name?: string;
  phone?: string;
  bio?: string;
  avatar?: File | null;
}
