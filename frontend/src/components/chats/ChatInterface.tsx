import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDistanceToNow, format } from 'date-fns';
import { ru } from 'date-fns/locale';
import {
  User,
  Send,
  ArrowLeft,
  Package,
  RefreshCcw,
  AlertCircle,
  MessageSquare,
  Paperclip,
  Loader2,
  Info
} from 'lucide-react';

/**
 * Интерфейсы для типов данных чата
 */
interface ChatParticipant {
  id: number;
  username: string;
  avatar?: string;
}

interface ChatOrder {
  id: number;
  title: string;
  status: string;
  budget: number;
}

interface Message {
  id: number;
  chat: number;
  sender: number | null;
  sender_details?: {
    id: number;
    username: string;
    avatar?: string;
  };
  content: string;
  attachment?: string;
  is_system_message: boolean;
  created_at: string;
  read_by_client: boolean;
  read_by_creator: boolean;
}

interface Chat {
  id: number;
  client: ChatParticipant;
  creator: ChatParticipant;
  order?: ChatOrder;
  created_at: string;
  updated_at: string;
  is_active: boolean;
}

/**
 * Компонент для интерфейса чата, включая отображение сообщений и поле отправки
 */
const ChatInterface: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [chat, setChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [sendingMessage, setSendingMessage] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState<number>(1);
  const [hasMoreMessages, setHasMoreMessages] = useState<boolean>(true);
  const [loadingMoreMessages, setLoadingMoreMessages] = useState<boolean>(false);
  const [pollingInterval, setPollingInterval] = useState<NodeJS.Timeout | null>(null);
  const [processingStatus, setProcessingStatus] = useState<boolean>(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  
  // Функция для получения статусов заказов на русском языке
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

  // Загрузка информации о чате
  useEffect(() => {
    const fetchChatDetails = async () => {
      if (!id) return;
      
      setLoading(true);
      try {
        const response = await axios.get(`/api/chats/${id}/`);
        setChat(response.data);
        setError(null);
      } catch (err) {
        console.error('Ошибка при загрузке данных чата:', err);
        setError('Не удалось загрузить чат');
      } finally {
        setLoading(false);
      }
    };

    fetchChatDetails();
    
    // Очищаем интервал при размонтировании компонента
    return () => {
      if (pollingInterval) {
        clearInterval(pollingInterval);
      }
    };
  }, [id]);

  // Загрузка сообщений чата
  useEffect(() => {
    const fetchMessages = async () => {
      if (!id) return;
      
      try {
        const response = await axios.get(`/api/messages/chat_messages/`, {
          params: {
            chat_id: id,
            page: page,
            limit: 50
          }
        });
        
        if (page === 1) {
          // Первая загрузка или обновление - устанавливаем сообщения
          setMessages(response.data.results.reverse());
        } else {
          // Загрузка более старых сообщений - добавляем в начало списка
          setMessages(prevMessages => [...response.data.results.reverse(), ...prevMessages]);
        }
        
        setHasMoreMessages(!!response.data.next);
        setError(null);
      } catch (err) {
        console.error('Ошибка при загрузке сообщений:', err);
        if (page === 1) {
          setError('Не удалось загрузить сообщения');
        }
      } finally {
        setLoadingMoreMessages(false);
      }
    };

    if (!loading && chat) {
      fetchMessages();
      
      // Настраиваем периодическое обновление сообщений
      if (!pollingInterval) {
        const interval = setInterval(() => {
          fetchMessages();
        }, 10000); // Обновление каждые 10 секунд
        setPollingInterval(interval);
      }
    }
  }, [id, loading, chat, page]);

  // Прокрутка до последнего сообщения при первой загрузке или отправке сообщения
  useEffect(() => {
    if (messages.length > 0 && page === 1 && !loadingMoreMessages) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, page, loadingMoreMessages]);

  // Обработчик загрузки более старых сообщений
  const handleLoadMoreMessages = () => {
    if (hasMoreMessages && !loadingMoreMessages) {
      setLoadingMoreMessages(true);
      setPage(prevPage => prevPage + 1);
    }
  };

  // Отправка нового сообщения
  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    if (!newMessage.trim() || !chat || !id) return;
    
    setSendingMessage(true);
    try {
      const response = await axios.post('/api/messages/', {
        chat: parseInt(id),
        content: newMessage.trim(),
        is_system_message: false
      });
      
      // Добавляем отправленное сообщение в список
      setMessages(prevMessages => [...prevMessages, {
        ...response.data,
        sender_details: user ? {
          id: user.id,
          username: user.username,
          avatar: user.avatar
        } : undefined
      }]);
      
      setNewMessage('');
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } catch (err) {
      console.error('Ошибка при отправке сообщения:', err);
      alert('Не удалось отправить сообщение. Попробуйте еще раз.');
    } finally {
      setSendingMessage(false);
    }
  };

  // Проверка, является ли пользователь отправителем сообщения
  const isCurrentUserSender = (message: Message) => {
    return user && message.sender === user.id;
  };

  // Переход на страницу заказа
  const goToOrder = () => {
    if (chat && chat.order) {
      navigate(`/orders/${chat.order.id}`);
    }
  };
  
  // Обработчик изменения статуса заказа
  const handleOrderStatusChange = async (newStatus: string) => {
    if (!chat?.order?.id) return;
    
    setProcessingStatus(true);
    try {
      let endpoint = '';
      let successMessage = '';
      
      if (newStatus === 'in_progress') {
        endpoint = `/api/orders/${chat.order.id}/start_order/`;
        successMessage = 'Заказ переведён в статус "В работе"';
      } else if (newStatus === 'completed') {
        endpoint = `/api/orders/${chat.order.id}/complete_order/`;
        successMessage = 'Заказ успешно завершён';
      } else {
        throw new Error('Неподдерживаемый статус заказа');
      }
      
      const response = await axios.post(endpoint);
      
      if (response.status === 200) {
        // Обновляем локальное состояние заказа
        setChat(prev => {
          if (!prev || !prev.order) return prev;
          
          return {
            ...prev,
            order: {
              ...prev.order,
              status: newStatus,
              status_display: getOrderStatusText(newStatus)
            }
          };
        });
        
        toast.success(successMessage);
      }
    } catch (error: any) {
      console.error('Ошибка при изменении статуса заказа:', error);
      toast.error(error.response?.data?.error || 'Не удалось изменить статус заказа');
    } finally {
      setProcessingStatus(false);
    }
  };

  // Отображение скелетона при загрузке
  if (loading) {
    return (
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        <Card className="h-[80vh] flex flex-col">
          <CardHeader>
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent className="flex-grow overflow-y-auto">
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, index) => (
                <div key={index} className={`flex ${index % 2 === 0 ? 'justify-start' : 'justify-end'}`}>
                  <div className={`max-w-[70%] ${index % 2 === 0 ? 'bg-gray-100 dark:bg-gray-800' : 'bg-blue-100 dark:bg-blue-900'} rounded-lg p-3`}>
                    <Skeleton className={`h-4 w-${Math.floor(Math.random() * 32) + 24}`} />
                    <Skeleton className={`h-3 w-${Math.floor(Math.random() * 24) + 16} mt-2`} />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
          <CardFooter>
            <Skeleton className="h-10 w-full" />
          </CardFooter>
        </Card>
      </div>
    );
  }

  // Отображение ошибки
  if (error || !chat) {
    return (
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        <Card className="text-center py-10">
          <CardContent>
            <AlertCircle className="h-12 w-12 mx-auto text-red-500" />
            <h2 className="text-xl font-medium mt-4">Ошибка при загрузке чата</h2>
            <p className="text-gray-500 mt-2">{error || 'Не удалось загрузить данные чата'}</p>
            <Button 
              className="mt-6" 
              variant="outline"
              onClick={() => navigate('/chats')}
            >
              Вернуться к списку чатов
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Определяем собеседника (клиент или креатор)
  const interlocutor = user?.id === chat.client.id ? chat.creator : chat.client;

  return (
    <div className="container mx-auto px-4 py-6 max-w-4xl">
      <Card className="h-[80vh] flex flex-col">
        <CardHeader className="pb-2 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => navigate('/chats')}
                className="mr-2"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div className="flex items-center">
                <div className="h-10 w-10 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden flex items-center justify-center mr-3">
                  {interlocutor.avatar ? (
                    <img 
                      src={interlocutor.avatar} 
                      alt={interlocutor.username} 
                      className="h-full w-full object-cover" 
                    />
                  ) : (
                    <User size={20} className="text-gray-500" />
                  )}
                </div>
                <div>
                  <CardTitle className="text-md">
                    {interlocutor.username}
                  </CardTitle>
                  {chat.order && (
                    <div className="text-xs text-gray-500 flex items-center mt-1">
                      <Package size={12} className="mr-1" />
                      Заказ: {chat.order.title}
                    </div>
                  )}
                </div>
              </div>
            </div>
            {chat.order && (
              <div className="flex items-center space-x-2">
                {/* Кнопка просмотра заказа */}
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={goToOrder}
                >
                  <Package size={14} className="mr-2" />
                  {getOrderStatusText(chat.order.status)}
                </Button>
                
                {/* Кнопка для креатора: изменить статус на "В работе" */}
                {user && chat.creator.id === user.id && chat.order.status === 'published' && (
                  <Button 
                    variant="default" 
                    size="sm"
                    className="bg-blue-600 text-white hover:bg-blue-700"
                    disabled={processingStatus}
                    onClick={() => handleOrderStatusChange('in_progress')}
                  >
                    Начать работу
                  </Button>
                )}
                
                {/* Кнопка для клиента: изменить статус на "Завершен" */}
                {user && chat.client.id === user.id && chat.order.status === 'in_progress' && (
                  <Button 
                    variant="default" 
                    size="sm"
                    className="bg-green-600 text-white hover:bg-green-700"
                    disabled={processingStatus}
                    onClick={() => handleOrderStatusChange('completed')}
                  >
                    Завершить заказ
                  </Button>
                )}
              </div>
            )}
          </div>
        </CardHeader>
        
        <CardContent className="flex-grow overflow-y-auto p-4" ref={messagesContainerRef}>
          {hasMoreMessages && !loadingMoreMessages && (
            <div className="text-center mb-4">
              <Button 
                variant="outline" 
                onClick={handleLoadMoreMessages}
                size="sm"
              >
                Загрузить предыдущие сообщения
              </Button>
            </div>
          )}
          
          {loadingMoreMessages && (
            <div className="flex justify-center mb-4">
              <Loader2 className="h-5 w-5 animate-spin text-gray-500" />
            </div>
          )}
          
          <div className="space-y-4">
            {messages.length === 0 ? (
              <div className="text-center py-10">
                <MessageSquare className="h-12 w-12 mx-auto text-gray-400" />
                <p className="mt-2 text-gray-500">
                  Начните общение, отправив первое сообщение
                </p>
              </div>
            ) : (
              messages.map((message) => (
                <div 
                  key={message.id} 
                  className={`flex ${isCurrentUserSender(message) ? 'justify-end' : 'justify-start'} ${message.is_system_message ? 'justify-center' : ''}`}
                >
                  {message.is_system_message ? (
                    <div className="bg-gray-100 dark:bg-gray-800 rounded-lg px-3 py-2 max-w-[80%] text-center">
                      <div className="flex items-center justify-center mb-1">
                        <Info size={14} className="text-blue-500 mr-1" />
                        <span className="text-xs font-medium text-gray-500">Системное сообщение</span>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-300">{message.content}</p>
                      <span className="text-xs text-gray-400 block text-right mt-1">
                        {format(new Date(message.created_at), "HH:mm", { locale: ru })}
                      </span>
                    </div>
                  ) : (
                    <div 
                      className={`max-w-[70%] ${
                        isCurrentUserSender(message) 
                          ? 'bg-blue-100 dark:bg-blue-900/30 ml-auto' 
                          : 'bg-gray-100 dark:bg-gray-800'
                      } rounded-lg p-3 relative message-bubble`}
                    >
                      {!isCurrentUserSender(message) && message.sender_details && (
                        <div className="flex items-center mb-1">
                          <span className="text-xs font-medium text-gray-500">
                            {message.sender_details.username}
                          </span>
                        </div>
                      )}
                      
                      <p className="text-gray-800 dark:text-gray-200">{message.content}</p>
                      
                      {message.attachment && (
                        <div className="mt-2">
                          <a 
                            href={message.attachment} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="flex items-center text-blue-600 dark:text-blue-400 text-sm"
                          >
                            <Paperclip size={14} className="mr-1" />
                            Прикрепленный файл
                          </a>
                        </div>
                      )}
                      
                      <span className="text-xs text-gray-400 block text-right mt-1">
                        {format(new Date(message.created_at), "HH:mm", { locale: ru })}
                      </span>
                    </div>
                  )}
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>
        </CardContent>
        
        <CardFooter className="p-4 border-t">
          <form onSubmit={handleSendMessage} className="flex items-center w-full space-x-2">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Введите сообщение..."
              disabled={sendingMessage}
              className="flex-1"
            />
            <Button 
              type="submit" 
              disabled={!newMessage.trim() || sendingMessage}
            >
              {sendingMessage ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              <span className="ml-2 sm:inline hidden">Отправить</span>
            </Button>
          </form>
        </CardFooter>
      </Card>
    </div>
  );
};

export default ChatInterface;