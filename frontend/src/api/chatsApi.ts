/**
 * API для работы с чатами и заказами в чатах
 */

import api from '@/services/api';

// Типы данных
export interface OrderAction {
  action: 'cancel' | 'complete' | 'request_revision';
  comment?: string;
}

export interface ClientOrder {
  id: number;
  title: string;
  status: string;
  status_label: string;
  budget: number;
  deadline: string;
  creator?: {
    id: number;
    username: string;
    avatar?: string | null;
  };
  target_creator?: {
    id: number;
    username: string;
    avatar?: string | null;
  };
  chat_id: number;
  allowed_actions: string[];
  action_labels: Record<string, string>;
  created_at: string;
  updated_at: string;
}

export interface ClientOrdersResponse {
  orders: ClientOrder[];
  count: number;
}

export interface ChangeStatusResponse {
  message: string;
  new_status: string;
  comment?: string;
}

/**
 * Получает заказы клиента в чатах с информацией о доступных действиях
 */
export const getClientOrders = async (): Promise<ClientOrdersResponse> => {
  const response = await api.get('/api/chats/client-orders/');
  return response.data;
};

/**
 * Изменяет статус заказа клиентом
 * @param orderId - ID заказа
 * @param orderAction - действие и опциональный комментарий
 */
export const changeOrderStatus = async (
  orderId: number,
  orderAction: OrderAction
): Promise<ChangeStatusResponse> => {
  const response = await api.post(`/api/orders/${orderId}/client-change-status/`, orderAction);
  return response.data;
};

/**
 * Получает список чатов
 */
export const getChats = async () => {
  const response = await api.get('/api/chats/');
  return response.data;
};

/**
 * Получает сообщения чата
 * @param chatId - ID чата
 */
export const getChatMessages = async (chatId: string) => {
  const response = await api.get(`/api/chats/${chatId}/messages/`);
  return response.data;
};

/**
 * Отправляет сообщение в чат
 * @param chatId - ID чата
 * @param content - содержимое сообщения
 * @param attachment - прикрепленный файл (опционально)
 */
export const sendMessage = async (
  chatId: string,
  content: string,
  attachment?: File
) => {
  const formData = new FormData();
  formData.append('content', content);
  if (attachment) {
    formData.append('attachment', attachment);
  }

  const response = await api.post(`/api/chats/${chatId}/messages/`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};