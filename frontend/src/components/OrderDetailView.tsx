/**
 * Компонент для отображения деталей заказа в стиле предпросмотра
 * 
 * Визуально соответствует стилю компонента OrderPreview
 * Используется для отображения существующего заказа на странице деталей
 */
import React from 'react';
import {
  Calendar,
  Clock,
  DollarSign,
  FileText,
  Tag as TagIcon,
  LinkIcon,
  Globe,
  Users,
  UserCircle,
  MessageSquare
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { OrderWithDetails, TimelineEvent } from '@/types/orders';

// Вспомогательная функция для форматирования даты
function formatDate(date: string | Date): string {
  if (!date) return 'Не указана';
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
}

// Вспомогательная функция для форматирования валюты
function formatCurrency(value: number | string): string {
  if (!value) return '0 ₽';
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    minimumFractionDigits: 0
  }).format(numValue);
}

// Возвращает заголовок события для отображения в таймлайне
function getEventTitle(eventType: TimelineEvent['type']): string {
  const eventTitles: Record<TimelineEvent['type'], string> = {
    'order_created': 'Заказ создан',
    'payment_pending': 'Ожидает оплаты',
    'payment_completed': 'Оплата получена',
    'work_started': 'Работа начата',
    'delivery_added': 'Файлы доставлены',
    'order_completed': 'Заказ завершён',
    'order_cancelled': 'Заказ отменён',
    'dispute_opened': 'Спор открыт'
  };
  return eventTitles[eventType] || 'Событие';
}

// Возвращает цвет бейджа в зависимости от статуса
function getStatusColor(status: string): string {

  const statusColors: Record<string, string> = {
    draft: 'bg-gray-200 text-gray-700',
    pending: 'bg-yellow-100 text-yellow-700',
    paid: 'bg-blue-100 text-blue-700',
    in_progress: 'bg-purple-100 text-purple-700',
    delivered: 'bg-green-100 text-green-700',
    completed: 'bg-emerald-100 text-emerald-700',
    revision: 'bg-amber-100 text-amber-700',
    disputed: 'bg-red-100 text-red-700',
    cancelled: 'bg-gray-200 text-gray-700'
  };
  return statusColors[status] || 'bg-gray-200 text-gray-700';
}

// Переводит статус заказа на русский
function translateStatus(status: string): string {
  const statusMap: Record<string, string> = {
    draft: 'Черновик',
    pending: 'Ожидает оплаты',
    paid: 'Оплачен',
    in_progress: 'В работе',
    delivered: 'Доставлен',
    completed: 'Завершен',
    revision: 'На доработке',
    disputed: 'В споре',
    cancelled: 'Отменен'
  };
  return statusMap[status] || status;
}

interface OrderDetailViewProps {
  order: OrderWithDetails;
  onViewMessages?: () => void;
  onBackToList?: () => void;
  actions?: React.ReactNode;
}

const OrderDetailView: React.FC<OrderDetailViewProps> = ({
  order,
  onViewMessages,
  onBackToList,
  actions
}) => {
  if (!order) return null;

  return (
    <div className="max-w-5xl mx-auto">
      <Button 
        variant="ghost" 
        onClick={onBackToList}
        className="mb-4 text-muted-foreground hover:text-foreground"
      >
        ← Назад к списку заказов
      </Button>

      <Card className="overflow-hidden border-0 shadow-lg mb-8">
        {/* Заголовок заказа с градиентным фоном */}
        <CardHeader className="bg-[#E95C4B] text-white p-8">
          <div className="flex flex-col md:flex-row justify-between gap-4">
            <div>
              <Badge className="bg-white/20 text-white mb-2 hover:bg-white/30">
                #{order.id}
              </Badge>
              <CardTitle className="text-2xl font-bold mb-2">
                {order.title || 'Без названия'}
              </CardTitle>
              <div className="flex items-center gap-2 text-white/80">
                <Badge className={`${getStatusColor(order.status)}`}>
                  {translateStatus(order.status)}
                </Badge>
                {order.service && (
                  <Badge className="bg-white/20 text-white hover:bg-white/30">
                    {order.service.title}
                  </Badge>
                )}
              </div>
            </div>

            {/* Кнопки действий */}
            {actions && (
              <div className="flex flex-wrap gap-2 md:justify-end">
                {actions}
              </div>
            )}
          </div>
        </CardHeader>

        <CardContent className="p-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Левая колонка: основная информация */}
            <div className="md:col-span-2 space-y-6">
              {/* Описание и требования */}
              <div>
                <h3 className="text-lg font-medium mb-3">Описание заказа</h3>
                <div className="bg-gray-50 rounded-lg p-4 whitespace-pre-wrap">
                  {order.description || 'Описание не добавлено'}
                </div>
              </div>

              {/* Референсы */}
              {order.references && order.references.length > 0 && (
                <div>
                  <h3 className="text-lg font-medium mb-3">Референсы</h3>
                  <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                    {order.references.map((ref, index) => (
                      <div key={index} className="flex items-start gap-3">
                        <div className="bg-[#FCF5F4] p-2 rounded-full">
                          <LinkIcon className="h-4 w-4 text-[#E95C4B]" />
                        </div>
                        <div>
                          <a 
                            href={ref} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-[#E95C4B] hover:underline break-all"
                          >
                            {ref}
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Теги */}
              {order.tags && order.tags.length > 0 && (
                <div>
                  <h3 className="text-lg font-medium mb-3">Теги</h3>
                  <div className="flex flex-wrap gap-2">
                    {order.tags
                      // Фильтруем теги по типу, если тип указан
                      // Если тип не указан - показываем все (для обратной совместимости)
                      .filter(tag => !tag.type || tag.type === 'order')
                      .map((tag, index) => (
                        <Badge key={index} className="bg-gray-100 text-gray-800 hover:bg-gray-200">
                          {tag.name}
                        </Badge>
                      ))}
                  </div>
                </div>
              )}
              
              {/* Доставленные файлы */}
              {order.deliveries && order.deliveries.length > 0 && (
                <div>
                  <h3 className="text-lg font-medium mb-3">Доставленные файлы</h3>
                  <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                    {order.deliveries.map((delivery, index) => (
                      <div key={index} className="border border-gray-200 rounded-lg p-3">
                        <div className="flex justify-between items-start mb-2">
                          <div className="font-medium">Доставка #{index + 1}</div>
                          <Badge className="bg-green-100 text-green-800">
                            {formatDate(delivery.created_at)}
                          </Badge>
                        </div>
                        <p className="mb-3 text-gray-600">{delivery.message || 'Без комментария'}</p>
                        <div className="space-y-2">
                          {delivery.files && delivery.files.map((file, fileIndex) => (
                            <div key={fileIndex} className="flex items-center gap-2">
                              <FileText className="h-4 w-4 text-gray-500" />
                              <a
                                href={file.url}
                                download={file.name}
                                className="text-[#E95C4B] hover:underline"
                              >
                                {file.name}
                              </a>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* История заказа */}
              {order.timeline && order.timeline.length > 0 && (
                <div>
                  <h3 className="text-lg font-medium mb-3">История заказа</h3>
                  <div className="space-y-4">
                    {order.timeline.map((event: TimelineEvent, index: number) => (
                      <div key={index} className="border-l-2 border-gray-200 pl-4 pb-4">
                        <div className="flex justify-between mb-1">
                          <span className="font-medium">{getEventTitle(event.type)}</span>
                          <Badge variant="outline" className="font-normal">
                            {formatDate(event.timestamp)}
                          </Badge>
                        </div>
                        {event.description && (
                          <p className="text-gray-600 text-sm">{event.description}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Правая колонка: мета-данные и участники */}
            <div className="space-y-6">
              {/* Информация о сроке и бюджете */}
              <Card className="border shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Детали заказа</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Срок */}
                  <div className="flex items-center gap-3">
                    <div className="bg-[#FCF5F4] p-2 rounded-full">
                      <Calendar className="h-4 w-4 text-[#E95C4B]" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Срок выполнения</p>
                      <p className="font-medium">
                        {order.deadline ? formatDate(order.deadline) : 'Не указан'}
                      </p>
                    </div>
                  </div>
                  
                  {/* Бюджет */}
                  <div className="flex items-center gap-3">
                    <div className="bg-[#FCF5F4] p-2 rounded-full">
                      <DollarSign className="h-4 w-4 text-[#E95C4B]" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Бюджет</p>
                      <p className="font-medium">{formatCurrency(order.budget)}</p>
                    </div>
                  </div>
                  
                  {/* Видимость */}
                  <div className="flex items-center gap-3">
                    <div className="bg-[#FCF5F4] p-2 rounded-full">
                      {!order.is_private ? (
                        <Globe className="h-4 w-4 text-[#E95C4B]" />
                      ) : (
                        <Users className="h-4 w-4 text-[#E95C4B]" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Видимость</p>
                      <p className="font-medium">
                        {!order.is_private ? 'Публичный заказ' : 'Приватный заказ'}
                      </p>
                    </div>
                  </div>
                  
                  {/* Дата создания */}
                  <div className="flex items-center gap-3">
                    <div className="bg-gray-100 p-2 rounded-full">
                      <Clock className="h-4 w-4 text-gray-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Создан</p>
                      <p className="font-medium">
                        {formatDate(order.created_at)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              {/* Информация о клиенте */}
              {order.buyer && (
                <Card className="border shadow-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Заказчик</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-3">
                      <div className="bg-[#FCF5F4] p-3 rounded-full">
                        <UserCircle className="h-5 w-5 text-[#E95C4B]" />
                      </div>
                      <div>
                        <p className="font-medium">
                          {order.buyer.username || order.buyer.email || 'Имя не указано'}
                        </p>
                        {order.buyer.first_name && order.buyer.last_name && (
                          <p className="text-sm text-gray-500">
                            {order.buyer.first_name} {order.buyer.last_name}
                          </p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
              
              {/* Информация об исполнителе */}
              {order.target_creator ? (
                <Card className="border shadow-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Целевой исполнитель</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-3">
                      <div className="bg-[#FCF5F4] p-3 rounded-full">
                        <UserCircle className="h-5 w-5 text-[#E95C4B]" />
                      </div>
                      <div>
                        <p className="font-medium">
                          {order.target_creator.user?.full_name || `Пользователь #${order.target_creator.id}`}
                        </p>
                        {order.target_creator.specialization && (
                          <p className="text-sm text-gray-500">
                            {order.target_creator.specialization}
                          </p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card className="border shadow-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Доступность заказа</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-3">
                      <div className="bg-[#FCF5F4] p-3 rounded-full">
                        <Globe className="h-5 w-5 text-[#E95C4B]" />
                      </div>
                      <div>
                        <p className="font-medium">Доступен всем исполнителям</p>
                        <p className="text-sm text-gray-500">
                          Любой креатор может принять этот заказ
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
              
              {/* Кнопка для просмотра сообщений */}
              {onViewMessages && (
                <Button 
                  variant="outline" 
                  className="w-full border-[#E95C4B] text-[#E95C4B] hover:bg-[#FCF5F4]" 
                  onClick={onViewMessages}
                >
                  <MessageSquare className="mr-2 h-4 w-4" />
                  Перейти к сообщениям
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default OrderDetailView;
