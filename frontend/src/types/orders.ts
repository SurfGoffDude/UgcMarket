/**
 * Типы данных для работы с заказами
 * 
 * Этот файл содержит все необходимые типы TypeScript для работы
 * с заказами, доставками и статусами заказов.
 */

import { User } from './user';
import { Service, ServiceOption } from './services';
import { UploadedFile } from './common';

/**
 * Возможные статусы заказа
 */
export type OrderStatus = 
  | 'pending'    // Ожидает оплаты
  | 'paid'       // Оплачен
  | 'in_progress' // В работе
  | 'delivered'  // Выполнен (доставлен)
  | 'completed'  // Завершен (принят клиентом)
  | 'cancelled'  // Отменен
  | 'disputed';  // Спор

/**
 * Основная модель заказа
 */
export interface Order {
  id: number;
  service: Service;
  buyer: User;
  status: OrderStatus;
  requirements: string;
  price: number;
  total_price: number;
  delivery_date: string;
  created_at: string;
  updated_at: string;
  paid_at: string | null;
  completed_at: string | null;
  selected_options: ServiceOption[];
  deliveries?: OrderDelivery[];
  payments?: Payment[];
  timeline_events?: TimelineEvent[];
}

/**
 * Модель для создания нового заказа
 */
export interface CreateOrderInput {
  service_id: number;
  requirements: string;
  delivery_date: string;
  selected_option_ids?: number[];
}

/**
 * Доставка файлов и результатов по заказу
 */
export interface OrderDelivery {
  id: number;
  order_id: number;
  files: UploadedFile[];
  message: string;
  created_by: User;
  created_at: string;
}

/**
 * События в истории заказа для отображения в таймлайне
 */
export interface TimelineEvent {
  type: 'order_created' | 'payment_pending' | 'payment_completed' | 'work_started' | 
        'delivery_added' | 'order_completed' | 'order_cancelled' | 'dispute_opened';
  timestamp: string;
  description: string;
  status: 'completed' | 'current' | 'pending';
  additional_info?: any;
}

/**
 * Статусы оплаты
 */
export type PaymentStatus = 
  | 'pending'    // Ожидает оплаты
  | 'processing' // В процессе
  | 'completed'  // Завершена
  | 'failed'     // Ошибка
  | 'refunded';  // Возвращена

/**
 * Способы оплаты
 */
export type PaymentMethod = 
  | 'yookassa'
  | 'cloudpayments'
  | 'bank_transfer'
  | 'other';

/**
 * Информация о платеже
 */
export interface Payment {
  id: number;
  order_id: number;
  amount: number;
  payment_method: PaymentMethod;
  status: PaymentStatus;
  transaction_id?: string;
  payment_details?: any;
  created_at: string;
  updated_at: string;
}

/**
 * Модель для добавления файлов доставки к заказу
 */
export interface AddDeliveryInput {
  order_id: number;
  message: string;
  file_ids: number[];
}
