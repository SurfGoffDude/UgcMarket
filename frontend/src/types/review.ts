/**
 * Типы данных для работы с отзывами и рейтингами.
 * 
 * Этот файл содержит типы данных для работы с API отзывов,
 * включая типы для отзывов, ответов на отзывы и статистики рейтингов.
 */

import { User } from './user';

/**
 * Тип данных для отзыва с сервера
 */
export interface Review {
  id: number;
  order_id: number;
  service_id: number;
  service_title: string;
  reviewer: User;
  creator_name: string;
  rating: number;
  comment: string;
  created_at: string;
  updated_at: string;
  reply?: ReviewReply;
}

/**
 * Тип данных для ответа на отзыв
 */
export interface ReviewReply {
  id: number;
  author: User;
  content: string;
  created_at: string;
  updated_at: string;
}

/**
 * Запрос для создания отзыва
 */
export interface CreateReviewRequest {
  rating: number;
  comment: string;
}

/**
 * Запрос для создания ответа на отзыв
 */
export interface CreateReplyRequest {
  content: string;
}

/**
 * Модель статистики рейтингов
 */
export interface RatingStatistics {
  total_reviews: number;
  average_rating: number;
  rating_distribution: {
    [key: number]: {
      count: number;
      percentage: number;
    };
  };
}

/**
 * Набор доступных звездных рейтингов
 */
export const RATING_OPTIONS = [
  { value: 5, label: '5 - Отлично' },
  { value: 4, label: '4 - Очень хорошо' },
  { value: 3, label: '3 - Хорошо' },
  { value: 2, label: '2 - Удовлетворительно' },
  { value: 1, label: '1 - Не очень' },
];
