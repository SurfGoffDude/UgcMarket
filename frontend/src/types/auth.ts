/**
 * Типы данных для авторизации пользователя
 */

/**
 * Интерфейс пользователя системы
 */
export interface User {
  id: number;
  username: string;
  email: string;
  first_name?: string;
  last_name?: string;
  is_staff?: boolean;
  is_active?: boolean;
  email_verified?: boolean;
  
  // Дополнительные поля для пользователя
  avatar?: string | null;
  phone?: string;
  bio?: string;
  location?: string;
  is_verified?: boolean;
  full_name?: string;
  gender?: '' | 'male' | 'female' | 'other' | 'prefer_not_to_say'; // Поле для пола пользователя
  
  // Поля для профиля креатора
  has_creator_profile?: boolean;
  creator_profile_id?: number;
}

/**
 * Социальная сеть пользователя
 */
export interface SocialLink {
  id: number;
  platform: string;
  url: string;
}

/**
 * Социальные сети креатора (формат для фронтенда)
 */
export interface CreatorSocialLinks {
  instagram?: string;
  github?: string;
  linkedin?: string;
  twitter?: string;
  website?: string;
}

/**
 * Профиль пользователя (базовый)
 */
export interface UserProfile {
  id: number;
  user: User;
  bio?: string;
  avatar?: string;
  // Тип SocialLinks не включен в объявление класса,
  // чтобы позволить его переопределение в CreatorProfile
  social_links?: any;
  rating?: number;
  reviews_count?: number;
  created_at?: string;
  updated_at?: string;
  location?: string;
}

/**
 * Навык для формы (упрощенный)
 */
export interface SimpleSkill {
  id?: number;
  name: string;
  level?: number;
}

/**
 * Навык креатора
 */
export interface CreatorSkill {
  id: number;
  skill: {
    id: number;
    name: string;
    description?: string;
  };
  level: number;
  creator_profile: number;
}

/**
 * Изображение в портфолио
 */
export interface PortfolioImage {
  id: number;
  image: string;
  caption?: string;
  order: number;
}

/**
 * Элемент портфолио креатора
 */
export interface PortfolioItem {
  id: number;
  title: string;
  description?: string;
  cover_image: string; // Основное изображение для списка
  image?: string;      // Совместимость с фронтендом
  images: PortfolioImage[];
  created_at: string;
  updated_at: string;
  creator_profile: number;
}

/**
 * Профиль креатора
 */
export interface CreatorProfile extends UserProfile {
  title?: string;
  description?: string;
  cover_image?: string;
  available_for_hire?: boolean;
  skills?: CreatorSkill[] | SimpleSkill[];
  portfolio_items?: PortfolioItem[];
  portfolio?: PortfolioItem[]; // Альтернативное название, используется в коде
  services?: any[];
  website?: string;
  specialization?: string;
  experience?: string;
  average_work_time?: '' | 'up_to_24_hours' | 'up_to_3_days' | 'up_to_10_days' | 'up_to_14_days' | 'up_to_30_days' | 'up_to_60_days' | 'more_than_60_days';
}

/**
 * Состояние авторизации
 */
export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
  loading: boolean;
}

/**
 * Интерфейс для запроса на вход
 */
export interface LoginRequest {
  username: string;
  password: string;
}

/**
 * Интерфейс для ответа при входе
 */
export interface LoginResponse {
  access: string;
  refresh: string;
}

/**
 * Интерфейс для запроса на регистрацию
 */
export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  password_confirm: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  user_type: 'client' | 'creator';
}

/**
 * Интерфейс для верификации email
 */
export interface EmailVerificationRequest {
  token: string;
}

/**
 * Интерфейс для хука авторизации
 */
export interface AuthHook extends AuthState {
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  register: (userData: RegisterRequest) => Promise<boolean>;
}
