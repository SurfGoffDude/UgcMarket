/**
 * Типы данных, используемые в приложении
 */

// Тип пользователя
export interface User {
  id: number;
  username: string;
  email?: string;
  first_name?: string;
  last_name?: string;
  is_client: boolean;
  is_creator: boolean;
  avatar?: string;
}

// Тип профиля клиента
export interface ClientProfile {
  id: number;
  user: User;
  bio?: string;
}

// Тип профиля креатора
export interface CreatorProfile {
  id: number;
  user: User;
  bio?: string;
  rating: number;
  specialization?: string;
  services?: Service[];
}

// Тип сервиса
export interface Service {
  id: number;
  name: string;
  description?: string;
  price: number;
  creator: number;
}

// Тип тега
export interface Tag {
  id: number;
  name: string;
}

// Тип категории
export interface Category {
  id: number;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  parent?: number;
}

// Тип заказа
export interface Order {
  id: number;
  title: string;
  description: string;
  status: 'draft' | 'pending' | 'awaiting_response' | 'in_progress' | 'completed' | 'cancelled';
  budget?: number;
  is_private: boolean;
  client: number | User;
  creator?: number | User;
  category?: number | Category;
  tags?: Tag[];
  created_at: string;
  deadline?: string;
  files?: OrderAttachment[];
  responses?: OrderResponse[];
}

// Тип вложения к заказу
export interface OrderAttachment {
  id: number;
  order: number;
  file: string;
  file_name: string;
  created_at: string;
}

// Тип отклика на заказ
export interface OrderResponse {
  id: number;
  creator: number | User;
  order: number | Order;
  message: string;
  price?: number;
  status: 'pending' | 'accepted' | 'rejected';
  created_at: string;
}

// Тип чата
export interface Chat {
  id: number;
  order: number | Order;
  client: number | User;
  creator: number | User;
  updated_at: string;
  last_message?: Message;
  unread_count?: number;
}

// Тип сообщения
export interface Message {
  id: number;
  chat: number | Chat;
  sender: number | User;
  content: string;
  is_system_message: boolean;
  created_at: string;
  read: boolean;
}

// Тип ответа для запросов с пагинацией
export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}