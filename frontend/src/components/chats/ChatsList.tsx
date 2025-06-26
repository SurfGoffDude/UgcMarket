import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Card, 
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle 
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { MessageSquare, Clock, Package, User } from 'lucide-react';
import axios from 'axios';
import { formatDistanceToNow } from 'date-fns';
import { ru } from 'date-fns/locale';

/**
 * Интерфейс для последнего сообщения в чате
 */
interface LastMessage {
  id: number;
  content: string;
  sender: string | null;
  is_system_message: boolean;
  created_at: string;
}

/**
 * Интерфейс для участника чата
 */
interface ChatParticipant {
  id: number;
  username: string;
  avatar?: string;
}

/**
 * Интерфейс для объекта заказа в чате
 */
interface ChatOrder {
  id: number;
  title: string;
  status: string;
  budget: number;
}

/**
 * Интерфейс для объекта чата
 */
interface Chat {
  id: number;
  client: ChatParticipant;
  creator: ChatParticipant;
  order?: ChatOrder;
  created_at: string;
  updated_at: string;
  is_active: boolean;
  last_message?: LastMessage;
  unread_count: number;
}

/**
 * Интерфейс для пропсов компонента списка чатов
 */
interface ChatsListProps {
  orderId?: number; // ID заказа для фильтрации чатов
  limit?: number;   // Ограничение количества чатов
}

/**
 * Компонент для отображения списка чатов
 */
const ChatsList: React.FC<ChatsListProps> = ({
  orderId,
  limit = 10
}) => {
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState<number>(1);
  const [hasMore, setHasMore] = useState<boolean>(true);
  
  const navigate = useNavigate();

  // Функция для получения статусов заказа на русском языке
  const getOrderStatusText = (status: string): string => {
    const statusMap: Record<string, string> = {
      'awaiting_response': 'Ожидает отклика',
      'in_progress': 'В работе',
      'on_review': 'На проверке',
      'completed': 'Завершен',
      'cancelled': 'Отменен'
    };
    return statusMap[status] || status;
  };

  // Загрузка чатов при монтировании компонента
  useEffect(() => {
    const fetchChats = async () => {
      setLoading(true);
      try {
        // Формирование параметров запроса
        let queryParams = new URLSearchParams();
        
        if (orderId) {
          queryParams.append('order_id', orderId.toString());
        }
        
        queryParams.append('page', page.toString());
        queryParams.append('limit', limit.toString());
        
        const response = await axios.get(`/api/chats/?${queryParams.toString()}`);
        
        if (page === 1) {
          setChats(response.data.results);
        } else {
          setChats(prevChats => [...prevChats, ...response.data.results]);
        }
        
        setHasMore(!!response.data.next);
        setError(null);
      } catch (err) {
        setError('Ошибка при загрузке чатов');
        console.error('Ошибка при загрузке чатов:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchChats();
  }, [orderId, page, limit]);

  // Обработчик нажатия на карточку чата
  const handleChatClick = (id: number) => {
    navigate(`/chats/${id}`);
  };

  // Загрузка дополнительных чатов при прокрутке
  const loadMore = () => {
    if (!loading && hasMore) {
      setPage(prevPage => prevPage + 1);
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4">
        {loading && page === 1 ? (
          // Скелетон загрузки для первой страницы
          Array.from({ length: 5 }).map((_, index) => (
            <Card key={`skeleton-${index}`} className="overflow-hidden">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-center">
                  <Skeleton className="h-5 w-1/3" />
                  <Skeleton className="h-4 w-1/5" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-start">
                  <Skeleton className="h-10 w-10 rounded-full mr-3" />
                  <div className="flex-1">
                    <Skeleton className="h-4 w-3/4 mb-2" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          // Список чатов
          chats.map((chat) => (
            <Card 
              key={chat.id} 
              className={`overflow-hidden hover:shadow-md transition-shadow cursor-pointer ${
                chat.unread_count > 0 ? 'border-l-4 border-l-blue-500' : ''
              }`}
              onClick={() => handleChatClick(chat.id)}
            >
              <CardHeader className="pb-2">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-md flex items-center gap-2">
                    <MessageSquare size={16} className="text-blue-500" />
                    {chat.order ? (
                      <>
                        Чат по заказу: {chat.order.title}
                      </>
                    ) : (
                      <>
                        Общий чат
                      </>
                    )}
                  </CardTitle>
                  <CardDescription className="text-xs">
                    {chat.last_message && formatDistanceToNow(new Date(chat.last_message.created_at), {
                      addSuffix: true,
                      locale: ru
                    })}
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-start">
                  <div className="relative">
                    {/* Аватар собеседника (или заглушка) */}
                    <div className="h-10 w-10 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden flex items-center justify-center text-lg font-semibold">
                      {chat.client.avatar || chat.creator.avatar ? (
                        <img 
                          src={chat.client.avatar || chat.creator.avatar} 
                          alt="Аватар пользователя" 
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <User size={20} />
                      )}
                    </div>
                    {chat.unread_count > 0 && (
                      <Badge className="absolute -top-1 -right-1 w-5 h-5 p-0 flex items-center justify-center">
                        {chat.unread_count}
                      </Badge>
                    )}
                  </div>
                  <div className="ml-3 flex-1">
                    {/* Имя собеседника и детали */}
                    <div className="flex justify-between items-center mb-1">
                      <div className="font-medium">
                        С: {chat.client.username} • Для: {chat.creator.username}
                      </div>
                    </div>
                    
                    {/* Последнее сообщение */}
                    <div className="text-sm text-gray-600 dark:text-gray-300 line-clamp-1">
                      {chat.last_message ? (
                        <>
                          {chat.last_message.is_system_message ? (
                            <span className="italic text-gray-500">
                              Системное: {chat.last_message.content}
                            </span>
                          ) : (
                            <>
                              <span className="font-medium">
                                {chat.last_message.sender || 'Неизвестно'}:
                              </span>{' '}
                              {chat.last_message.content}
                            </>
                          )}
                        </>
                      ) : (
                        <span className="italic text-gray-500">Нет сообщений</span>
                      )}
                    </div>

                    {/* Информация о заказе, если он есть */}
                    {chat.order && (
                      <div className="flex items-center mt-2">
                        <Package size={14} className="text-gray-500 mr-1" />
                        <span className="text-xs text-gray-500">
                          {getOrderStatusText(chat.order.status)}
                          {' • '}
                          {chat.order.budget} ₽
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {!loading && chats.length === 0 && !error && (
        <div className="text-center py-10">
          <p className="text-gray-500 dark:text-gray-400">Чаты не найдены</p>
          <Button 
            variant="outline" 
            className="mt-4"
            onClick={() => navigate('/orders')}
          >
            Найти заказы
          </Button>
        </div>
      )}

      {error && (
        <div className="text-center py-10">
          <p className="text-red-500">{error}</p>
          <Button 
            variant="outline" 
            className="mt-4"
            onClick={() => {
              setError(null);
              setPage(1);
            }}
          >
            Попробовать снова
          </Button>
        </div>
      )}

      {hasMore && !loading && !error && (
        <div className="flex justify-center mt-6">
          <Button variant="outline" onClick={loadMore}>
            Загрузить еще
          </Button>
        </div>
      )}

      {loading && page > 1 && (
        <div className="flex justify-center mt-6">
          <Button variant="outline" disabled>
            Загрузка...
          </Button>
        </div>
      )}
    </div>
  );
};

export default ChatsList;