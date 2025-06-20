/**
 * Типы данных для работы с услугами
 * 
 * Содержит интерфейсы для работы с услугами, категориями,
 * опциями и связанной информацией.
 */

import { User, CreatorProfile } from './user';

/**
 * Категория услуг
 */
export interface Category {
  id: number;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  parent?: Category;
  children?: Category[];
}

/**
 * Тег услуги
 */
export interface Tag {
  id: number;
  name: string;
  slug: string;
}

/**
 * Дополнительная опция к услуге
 */
export interface ServiceOption {
  id: number;
  service_id: number;
  name: string;
  description?: string;
  price: number;
  is_popular: boolean;
  is_required: boolean;
}

/**
 * Портфолио с примерами работ
 */
export interface PortfolioItem {
  id: number;
  title: string;
  description: string;
  image: string;
  created_at: string;
}

/**
 * Основная модель услуги
 */
export interface Service {
  id: number;
  title: string;
  slug: string;
  description: string;
  short_description?: string;
  thumbnail?: string;
  creator: CreatorProfile;
  price: number;
  discounted_price?: number;
  category: Category;
  tags: Tag[];
  options?: ServiceOption[];
  portfolio_items?: PortfolioItem[];
  average_rating?: number;
  review_count?: number;
  delivery_time: number; // в днях
  is_featured: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}
