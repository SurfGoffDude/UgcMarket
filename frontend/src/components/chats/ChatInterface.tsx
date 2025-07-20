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
  Info,
  XCircle,
  CheckCheck,
  RotateCcw
} from 'lucide-react';
import { getClientOrders, changeOrderStatus, submitOrderForReview, type ClientOrder, type OrderAction } from '@/api/chatsApi';

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

interface OrderListItem {
  id: number;
  title: string;
  status: string;
  budget: number;
  created_at: string;
  updated_at: string;
}

interface Chat {
  id: number;
  client: ChatParticipant;
  creator: ChatParticipant;
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
  const { user, token } = useAuth();
  const [chat, setChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [interlocutor, setInterlocutor] = useState<ChatParticipant>({ id: 0, username: '' });
  const [page, setPage] = useState(1);
  const [hasMoreMessages, setHasMoreMessages] = useState(false);
  const [loadingMoreMessages, setLoadingMoreMessages] = useState(false);
  const [chatOrder, setChatOrder] = useState<ClientOrder | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  
  // Для заказов
  const [clientOrders, setClientOrders] = useState<ClientOrder[]>([]);
  

  const [loadingOrders, setLoadingOrders] = useState(false);
  const [updatingOrderStatus, setUpdatingOrderStatus] = useState<number | null>(null);
  
  // Для управления заказами
  const [processingStatus, setProcessingStatus] = useState(false);
  
  /**
  * Функция для получения заказов между клиентом и креатором
  * Использует специальный эндпоинт creator-client-orders для получения заказов
 * со статусами in_progress, on_review или completed
  */
  const fetchClientOrders = useCallback(async () => {

    console.trace('Stack trace for fetchClientOrders call');
    
    if (!user || !token) {

      return;
    }
    
    try {

      setLoadingOrders(true);
      const response = await getClientOrders();
      setClientOrders(response.orders || []);
    } catch (error) {
      console.error('Ошибка при загрузке заказов:', error);
      console.error('Полная информация об ошибке:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        headers: error.response?.headers
      });
      toast.error('Не удалось загрузить заказы');
    } finally {
      setLoadingOrders(false);
    }
  }, [user, token]);

  /**
   * Функция для поиска заказов, связанных с текущим чатом
   */
  const findChatOrder = useCallback(async () => {
    if (!chat || !id) return;
    
    try {
      const response = await getClientOrders();
      const orders = response.orders || [];
      
      // Ищем заказы, у которых chat_id совпадает с ID текущего чата
      const chatOrders = orders.filter(order => order.chat_id === parseInt(id));
      // Пока берем последний заказ для отображения в заголовке
      const latestOrder = chatOrders.length > 0 ? chatOrders[chatOrders.length - 1] : null;
      setChatOrder(latestOrder);
    } catch (error) {
      console.error('Ошибка при поиске заказов для чата:', error);
    }
  }, [chat, id]);


  
  /**
   * Функция загрузки информации о чате
   */
  const fetchChatDetails = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {

      
      const response = await axios.get(`/api/chats/${id}/`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      

      
      setChat(response.data);
    } catch (err) {
      console.error('Ошибка при загрузке данных чата:', err);
      toast.error('Не удалось загрузить данные чата');
      setError('Не удалось загрузить данные чата. Пожалуйста, попробуйте обновить страницу.');
    } finally {
      setLoading(false);
    }
  }, [id, token]);
  
  /**
   * Загрузка данных чата при монтировании компонента
   */
  useEffect(() => {
    if (token && id) {
      fetchChatDetails();
    }
  }, [id, token, fetchChatDetails]);
  
  useEffect(() => {
    if (chat && chat.creator && chat.client) {
      if (user?.id === chat.client.id) {
        setInterlocutor(chat.creator);
      } else {
        setInterlocutor(chat.client);
      }
      
      // Загружаем заказы клиента и ищем заказ для текущего чата
      fetchClientOrders();
      findChatOrder();
    }
  }, [chat, user, fetchClientOrders]);
  
  /**
   * Загрузка сообщений
   */
  const fetchMessages = useCallback(async (pageNum = 1, append = false) => {
    if (!token || !id || !chat) return;
    
    const isInitialLoad = pageNum === 1 && !append;
    
    if (isInitialLoad) {
      setLoading(true);
    } else if (append) {
      setLoadingMoreMessages(true);
    }
    
    // Формируем составной идентификатор для чата в формате creator_id-client_id
    const compositeId = chat && chat.creator && chat.client ? 
      `${chat.creator.id}-${chat.client.id}` : id;
      
    try {

      // Получаем сообщения чата по эндпоинту с составным ID
      const response = await axios.get(`/api/chats/${compositeId}/messages/`, {
        params: { 
          page: pageNum 
        },
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      // Проверяем формат ответа (пагинированный или непагинированный)
      let newMessages = [];
      let hasNext = false;
      
      if (response.data) {
        if (Array.isArray(response.data)) {
          // Непагинированный ответ - простой массив сообщений
          newMessages = response.data;
          hasNext = false; // В непагинированном ответе нет следующей страницы

        } else if (response.data.results) {
          // Пагинированный ответ - объект с полями results, next и т.д.
          newMessages = response.data.results;
          hasNext = !!response.data.next;

        } else {
          console.error('API вернул данные в неожиданном формате:', response.data);
        }
        
        if (append) {
          // При подгрузке более старых сообщений добавляем их в начало списка
          setMessages(prev => [...newMessages, ...prev]);
        } else {
          // При первичной загрузке или обновлении заменяем список целиком
          setMessages(newMessages);
        }
        
        // Обновляем состояние пагинации
        setHasMoreMessages(hasNext);
        setPage(pageNum);
      } else {
        // Если API вернул пустой ответ
        console.error('API вернул пустой ответ');
        if (isInitialLoad) {
          setMessages([]);
        }
      }
    } catch (err) {
      console.error('Ошибка при загрузке сообщений:', err);
      toast.error('Не удалось загрузить сообщения');
      
      // Не устанавливаем главную ошибку, чтобы не мешать пользователю продолжать общаться
      if (isInitialLoad) {
        setMessages([]); // При ошибке инициализируем пустой массив сообщений
      }
    } finally {
      // Сбрасываем состояние загрузки
      if (isInitialLoad) {
        setLoading(false);
      } else if (append) {
        setLoadingMoreMessages(false);
      }
    }
  }, [token, id, chat]);
  
  /**
   * Обрабатывает изменение статуса заказа
   */
  const handleOrderStatusChange = useCallback(async (orderId: number, action: string) => {
    try {
      setUpdatingOrderStatus(orderId);
      
      // Отладочная информация




      
      // Находим конкретный заказ для определения роли пользователя
      const currentOrder = clientOrders.find(order => order.id === orderId);



      
      if (!currentOrder) {
        console.error('Заказ не найден! orderId:', orderId, 'clientOrders:', clientOrders);
        throw new Error(`Заказ не найден. orderId: ${orderId}, доступные ID: ${clientOrders.map(o => o.id).join(', ')}`);
      }
      
      // Определяем роль пользователя для конкретного заказа
      const isOrderClient = user && currentOrder.client && user.id === currentOrder.client.id;
      const isOrderCreator = user && currentOrder.creator && user.id === currentOrder.creator.id;
      
      let response;
      
      // Для креаторов заказа действие "deliver" означает отправку на проверку
      if (isOrderCreator && action === 'deliver') {
        response = await submitOrderForReview(orderId);
      } else if (isOrderClient) {
        // Для клиентов заказа используем стандартный эндпоинт
        response = await changeOrderStatus(orderId, { action: action as 'cancel' | 'complete' | 'request_revision' });
      } else {
        throw new Error(`Недостаточно прав для выполнения данного действия. Пользователь: ${user?.id}, Клиент заказа: ${currentOrder.client?.id}, Креатор заказа: ${currentOrder.creator?.id}`);
      }
      
      toast.success(response.message);
      
      // Обновляем список заказов
      await fetchClientOrders();
      
      // Обновляем сообщения чата, чтобы показать системное сообщение
      if (chat) {
        await fetchMessages();
      }
      
    } catch (error: unknown) {
      console.error('Ошибка при изменении статуса заказа:', error);
      console.error('Полный response:', (error as any)?.response);
      console.error('Response data:', (error as any)?.response?.data);
      const errorMessage = (error as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Не удалось изменить статус заказа';
      toast.error(errorMessage);
    } finally {
      setUpdatingOrderStatus(null);
    }
  }, [clientOrders, fetchClientOrders, chat, fetchMessages]);
  
  /**
   * Отправка сообщения
   */
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Проверка валидности данных
    if (!newMessage.trim()) {
      toast.error('Введите текст сообщения');
      return;
    }
    
    if (!token || !id) {
      toast.error('Ошибка авторизации');
      return;
    }
    
    // Запоминаем текст сообщения до очистки поля ввода
    const messageText = newMessage.trim();
    
    // Очищаем поле ввода сразу для лучшего UX
    setNewMessage('');
    
    setSendingMessage(true);
    
    // Формируем составной идентификатор для чата в формате creator_id-client_id
    const compositeId = chat && chat.creator && chat.client ? 
      `${chat.creator.id}-${chat.client.id}` : id;
      
    try {

      // Теперь отправляем сообщение по URL с составным ID чата
      const response = await axios.post(`/api/chats/${compositeId}/messages/`, {
        content: messageText
      }, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      // Проверяем успешный ответ от API
      if (response.data && response.data.id) {
        // Временно добавляем новое сообщение в список для немедленного отображения
        setMessages(prev => [...prev, response.data]);
        
        // Задержка перед обновлением списка, чтобы сообщение точно успело сохраниться в БД
        setTimeout(() => {
          // После успешной отправки заново загружаем все сообщения с сервера
          // Это обеспечит синхронизацию с бэкендом и корректное отображение после обновления
          fetchMessages();
          
          // Прокручиваем к последнему сообщению
          scrollToBottom();
        }, 300);
      } else {
        throw new Error('Некорректный ответ от API при отправке сообщения');
      }
    } catch (error) {
      console.error('Ошибка при отправке сообщения:', error);
      
      // Возвращаем текст в поле ввода, чтобы пользователь мог повторить попытку
      setNewMessage(messageText);
      
      // Обрабатываем ошибки axios
      if (axios.isAxiosError(error)) {
        // Ошибка с ответом от сервера
        if (error.response) {
          if (error.response.status === 401 || error.response.status === 403) {
            toast.error('Нет доступа для отправки сообщения');
          } else {
            toast.error(`Ошибка при отправке сообщения: ${error.response.status}`);
          }
        } else if (error.request) {
          // Ошибка сети - запрос был отправлен, но ответ не получен
          toast.error('Не удалось отправить сообщение: проверьте соединение');
        } else {
          // Ошибка при настройке запроса
          toast.error(`Ошибка при отправке сообщения: ${error.message}`);
        }
      } else if (error instanceof Error) {
        // Другие ошибки JavaScript
        toast.error(`Не удалось отправить сообщение: ${error.message}`);
      } else {
        // Неизвестная ошибка
        toast.error('Не удалось отправить сообщение');
      }
    } finally {
      setSendingMessage(false);
    }
  };
  
  /**
   * Загрузка предыдущих сообщений
   */
  const handleLoadMoreMessages = () => {
    if (loadingMoreMessages) return;
    fetchMessages(page + 1, true);
  };
  
  /**
   * Прокрутка к последнему сообщению
   */
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messagesEndRef]);
  
  /**
   * Загрузка сообщений при монтировании компонента
   */
  useEffect(() => {
    if (token && id) {
      // Загружаем сообщения при монтировании компонента
      fetchMessages();
    }
  }, [id, token, fetchMessages]);
  
  /**
   * Прокрутка к последнему сообщению при загрузке
   */
  useEffect(() => {
    if (!loading && messages.length > 0) {
      scrollToBottom();
    }
  }, [loading, scrollToBottom, messages.length]);
  
  /**
   * Проверка, является ли текущий пользователь отправителем сообщения
   */
  const isCurrentUserSender = (message: Message) => {
    return message.sender === user?.id;
  };
  
  /**
   * Получение текстового представления статуса заказа
   */
  const getOrderStatusText = (status: string) => {
    switch (status) {
      case 'draft': return 'Черновик';
      case 'published': return 'Опубликован';
      case 'in_progress': return 'В работе';
      case 'on_review': return 'На проверке';
      case 'completed': return 'Выполнен';
      default: return status;
    }
  };

  /**
   * Форматирование даты сообщения
   */
  const formatMessageDate = (dateString: string) => {
    const messageDate = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    
    if (messageDate.toDateString() === today.toDateString()) {
      return 'Сегодня';
    } else if (messageDate.toDateString() === yesterday.toDateString()) {
      return 'Вчера';
    } else {
      return format(messageDate, 'dd MMMM', { locale: ru });
    }
  };
  
  /**
   * Определение необходимости отображения разделителя даты
   */
  const shouldDisplayTimeSeparator = (message: Message, index: number) => {
    if (index === 0) return true;
    
    const currentMessageDate = new Date(message.created_at);
    const prevMessageDate = new Date(messages[index - 1].created_at);
    
    return (
      currentMessageDate.getDate() !== prevMessageDate.getDate() ||
      currentMessageDate.getMonth() !== prevMessageDate.getMonth() ||
      currentMessageDate.getFullYear() !== prevMessageDate.getFullYear()
    );
  };
  

  
  /**
   * Переход на страницу деталей заказа
   */
  const goToOrderDetails = (orderId: number) => {
    navigate(`/orders/${orderId}`);
  };
  
  // Если идет загрузка, показываем скелетон
  if (loading) {
    return (
      <div className="container mx-auto p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-1 hidden md:block">
            <Card className="h-[80vh]">
              <CardContent className="p-4">
                <Skeleton className="h-12 w-full mb-4" />
                <Skeleton className="h-8 w-3/4 mb-2" />
                <Skeleton className="h-8 w-full mb-2" />
                <Skeleton className="h-8 w-2/3" />
              </CardContent>
            </Card>
          </div>
          
          <div className="md:col-span-3">
            <Card className="h-[80vh]">
              <CardHeader className="pb-2 border-b">
                <div className="flex items-center">
                  <Skeleton className="h-10 w-10 rounded-full mr-3" />
                  <div>
                    <Skeleton className="h-6 w-32 mb-1" />
                    <Skeleton className="h-4 w-20" />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-4 flex-1 overflow-hidden">
                <div className="space-y-4">
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} className={`flex ${i % 2 ? 'justify-start' : 'justify-end'}`}>
                      <Skeleton className={`h-24 w-2/3 rounded-lg`} />
                    </div>
                  ))}
                </div>
              </CardContent>
              <CardFooter className="p-4 border-t">
                <div className="w-full flex items-center gap-2">
                  <Skeleton className="h-10 flex-1" />
                  <Skeleton className="h-10 w-20" />
                </div>
              </CardFooter>
            </Card>
          </div>
        </div>
      </div>
    );
  }
  
  // Показываем ошибку, если она есть
  if (error) {
    return (
      <div className="container mx-auto p-4">
        <Card className="max-w-md mx-auto p-6 text-center">
          <AlertCircle className="h-12 w-12 mx-auto text-red-500 mb-4" />
          <h2 className="text-xl font-bold mb-2">Ошибка загрузки</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <div className="flex justify-center gap-2">
            <Button onClick={() => navigate('/chats')}>
              Вернуться к списку чатов
            </Button>
            <Button variant="outline" onClick={() => window.location.reload()}>
              <RefreshCcw className="h-4 w-4 mr-2" />
              Обновить
            </Button>
          </div>
        </Card>
      </div>
    );
  }
  
  // Если чат не найден или пользователь не авторизован
  if (!chat || !user) {
    return (
      <div className="container mx-auto p-4">
        <Card className="max-w-md mx-auto p-6 text-center">
          <AlertCircle className="h-12 w-12 mx-auto text-red-500 mb-4" />
          <h2 className="text-xl font-bold mb-2">Чат не найден</h2>
          <p className="text-gray-600 mb-4">
            Чат не существует или у вас нет доступа к нему.
          </p>
          <Button onClick={() => navigate('/chats')}>
            Вернуться к списку чатов
          </Button>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto p-4">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Боковая панель с заказами (видна только на больших экранах) */}
        <div className="md:col-span-1 hidden md:block">
          <Card className="h-[80vh] overflow-y-auto">
            <CardHeader className="pb-2 border-b">
              <div className="flex items-center justify-between">
                <CardTitle className="text-md flex items-center">
                  <MessageSquare className="h-5 w-5 mr-2" />
                  Заказы клиента
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-4">
              {loadingOrders ? (
                <div className="space-y-3">
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-16 w-full" />
                </div>
              ) : clientOrders.length > 0 ? (
                <div className="space-y-3">
                  {clientOrders.map((order) => (
                    <div 
                      key={order.id} 
                      className="p-3 rounded border hover:bg-gray-50 dark:hover:bg-gray-800"
                    >
                      <div 
                        className="cursor-pointer"
                        onClick={() => goToOrderDetails(order.id)}
                      >
                        <p className="font-medium truncate">{order.title}</p>
                        <div className="flex justify-between items-center mt-1">
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                            order.status === 'completed' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                            order.status === 'on_review' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400' :
                            order.status === 'in_progress' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' :
                            order.status === 'canceled' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' :
                            'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
                          }`}>
                            {order.status_label}
                          </span>
                          <span className="text-xs text-gray-500">
                            {formatDistanceToNow(new Date(order.created_at), { locale: ru, addSuffix: true })}
                          </span>
                        </div>
                      </div>
                      
                      {/* Кнопки управления статусом заказа */}
                      {order.allowed_actions && order.allowed_actions.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {order.allowed_actions.map((action) => {
                            const isUpdating = updatingOrderStatus === order.id;
                            const actionLabel = order.action_labels[action] || action;
                            
                            return (
                              <Button
                                key={action}
                                size="sm"
                                variant={action === 'cancel' ? 'destructive' : 
                                        action === 'complete' ? 'default' : 'outline'}
                                className={`text-xs h-6 px-2 ${
                                  action === 'cancel' ? 'bg-red-500 hover:bg-red-600' :
                                  action === 'complete' ? 'bg-green-500 hover:bg-green-600' :
                                  'border-blue-500 text-blue-600 hover:bg-blue-50'
                                }`}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOrderStatusChange(order.id, action);
                                }}
                                disabled={isUpdating}
                              >
                                {isUpdating ? (
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                ) : (
                                  <>
                                    {action === 'cancel' && <XCircle className="h-3 w-3 mr-1" />}
                                    {action === 'complete' && <CheckCheck className="h-3 w-3 mr-1" />}
                                    {action === 'request_revision' && <RotateCcw className="h-3 w-3 mr-1" />}
                                    {actionLabel}
                                  </>
                                )}
                              </Button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500 text-center">Нет совместных заказов</p>
              )}
            </CardContent>
          </Card>
        </div>
        
        {/* Основной чат */}
        <Card className="h-[80vh] flex flex-col flex-1 md:col-span-3">
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

                  </div>
                </div>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="p-4 pt-0 overflow-y-auto flex-1" ref={messagesContainerRef}>
            {/* Блок с заказами между креатором и клиентом */}
            {clientOrders.length > 0 && (
              <div className="mb-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
                <h4 className="font-medium mb-2 flex items-center">
                  <Package className="h-4 w-4 mr-2" />
                  Заказы с этим креатором
                </h4>
                <div className="space-y-2">
                  {clientOrders
                    .filter(order => ['in_progress', 'on_review', 'completed'].includes(order.status))
                    .map((order) => (
                      <div 
                        key={order.id}
                        className="p-3 rounded border bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
                        onClick={() => goToOrderDetails(order.id)}
                      >
                        <p className="font-medium truncate">{order.title}</p>
                        <div className="flex justify-between items-center mt-1">
                          <div>
                            <span className={`text-xs font-medium px-2 py-1 rounded ${order.status === 'completed' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : order.status === 'on_review' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400' : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'}`}>
                              {getOrderStatusText(order.status)}
                            </span>
                          </div>
                          <span className="text-xs font-medium">{order.budget} ₽</span>
                        </div>
                      </div>
                    ))}
                  {clientOrders.filter(order => ['in_progress', 'on_review', 'completed'].includes(order.status)).length === 0 && (
                    <p className="text-sm text-gray-500 text-center">Нет принятых или выполненных заказов</p>
                  )}
                </div>
              </div>
            )}
            
            {/* Блок с сообщениями */}
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
              {messages.map((message, index) => (
                <div key={message.id} className="relative">
                  {shouldDisplayTimeSeparator(message, index) && (
                    <div className="flex justify-center my-4">
                      <span className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-500 px-3 py-1 rounded-full">
                        {formatMessageDate(message.created_at)}
                      </span>
                    </div>
                  )}
                  
                  {/* Разные стили для системных и обычных сообщений */}
                  {message.is_system_message ? (
                    <div className="text-center my-4">
                      <div className="inline-block bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 px-4 py-2 rounded-full text-sm">
                        <p className="text-gray-800 dark:text-gray-200">{message.content}</p>
                      
                        {/* Показываем название заказа, если это сообщение об отклике */}
                        {message.content.includes("откликнулся на заказ") && chatOrder && (
                          <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded text-sm">
                            <p className="font-medium">Заказ: {chatOrder.title}</p>
                            <p className="text-xs text-gray-500">Статус: {getOrderStatusText(chatOrder.status)}</p>
                          </div>
                        )}
                        
                        {/* Кнопки для клиента (принять/отклонить) если это системное сообщение об отклике и пользователь - клиент */}
                        {message.content.includes("откликнулся на заказ") && 
                        chatOrder &&
                        user?.id === chat.client.id &&
                        chatOrder.status === "in_progress" && (
                        <div className="mt-3 flex justify-center space-x-2">
                        <Button 
                        variant="default" 
                        size="sm"
                        className="bg-green-500 hover:bg-green-600"
                        onClick={() => chatOrder && handleOrderStatusChange(chatOrder.id, "on_review")}
                        disabled={processingStatus}
                        >
                        Принять отклик
                        </Button>
                        <Button 
                        variant="outline" 
                        size="sm"
                        className="text-red-500 hover:bg-red-100 hover:text-red-600"
                        onClick={() => chatOrder && handleOrderStatusChange(chatOrder.id, "published")}
                        disabled={processingStatus}
                        >
                        Отклонить
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className={`flex w-full ${isCurrentUserSender(message) ? 'justify-end' : 'justify-start'}`}>
                      <div 
                        className={`inline-block max-w-[85%] ${
                          isCurrentUserSender(message) 
                            ? 'bg-blue-100 dark:bg-blue-900/30' 
                            : 'bg-gray-100 dark:bg-gray-800'
                        } rounded-lg p-3 relative message-bubble`}
                        style={{ width: 'auto' }}
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
                    </div>
                  )}
                </div>
              ))}
            </div>
            
            <div ref={messagesEndRef} />
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
    </div>
  );
};

export default ChatInterface;