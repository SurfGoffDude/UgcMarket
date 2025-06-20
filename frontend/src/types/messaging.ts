/**
 * Типы данных для системы сообщений
 * 
 * Содержит модели для работы с сообщениями, беседами,
 * и вложениями для системы обмена сообщениями между пользователями.
 */

import { User } from './user';
import { Order } from './orders';
import { UploadedFile } from './common';

/**
 * Модель беседы между пользователями
 */
export interface Thread {
  id: number;
  participants: User[];
  other_user: User; // Пользователь, с которым ведется беседа
  order?: Order;
  related_order?: { id: number; service: { title: string; } }; // Связанный заказ
  subject: string;
  created_at: string;
  updated_at: string;
  last_message?: Message;
  last_message_at: string; // Время последнего сообщения
  unread_count?: number;
}

/**
 * Модель сообщения в беседе
 */
export interface Message {
  id: number;
  thread_id: number;
  sender: User;
  content: string;
  read_at: string | null;
  created_at: string;
  attachments?: Attachment[];
}

/**
 * Вложение к сообщению
 */
export interface Attachment {
  id: number;
  message_id: number;
  file: string; // URL к файлу
  file_name: string;
  file_size: number;
  file_type: string;
  created_at: string;
}

/**
 * Данные для создания нового сообщения
 */
export interface CreateMessageInput {
  thread_id: number;
  content: string;
  attachment_ids?: number[];
}

/**
 * Данные для создания новой беседы
 */
export interface CreateThreadInput {
  participant_ids: number[];
  subject?: string;
  order_id?: number;
  initial_message: string;
  attachment_ids?: number[];
}
