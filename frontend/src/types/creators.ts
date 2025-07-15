/**
 * Типы данных для работы с креаторами
 */

export interface Creator {
  id: number;
  user: {
    id: number;
    username: string;
    email?: string;
    first_name: string;
    last_name: string;
    full_name?: string;
  };
  avatar?: string;
  bio?: string;
  categories: number[];
  tags: number[];
  specializations?: string[];
  location?: string;
  rating: number;
  reviews_count: number;
  completed_orders_count: number;
  active_orders_count: number;
  response_time?: string;
  is_available: boolean;
  portfolio_count: number;
  price_range?: {
    min: number;
    max: number;
  };
  is_verified: boolean;
  is_online: boolean;
  languages?: string[];
  gender?: string;
  social_links?: {
    instagram?: string;
    tiktok?: string;
    youtube?: string;
    twitter?: string;
    twitch?: string;
  };
  platforms?: string[];
  // Дополнительные поля для отображения на фронтенде
  display_name?: string;
  username?: string;
  min_price?: number;
  tags_display?: string[];
  top_service?: string;
}

export interface CreatorResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Creator[];
}