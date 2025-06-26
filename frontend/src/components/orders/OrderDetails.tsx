import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from '@/components/ui/tabs';
import {
  Alert,
  AlertDescription,
  AlertTitle
} from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import {
  Calendar,
  DollarSign,
  User,
  Tag,
  Clock,
  MessageSquare,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';
import axios from 'axios';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { useAuth } from '@/contexts/AuthContext';
import CreatorResponsesList from './CreatorResponsesList';

/**
 * Интерфейс для объекта заказа
 */
interface Order {
  id: number;
  title: string;
  description: string;
  requirements: string;
  budget: number;
  deadline: string;
  delivery_time: number;
  status: string;
  created_at: string;
  updated_at: string;
  client: {
    id: number;
    username: string;
    avatar?: string;
  };
  creator?: {
    id: number;
    username: string;
    avatar?: string;
  };
  tags: string[];
  responses_count: number;
  is_private: boolean;
}

/**
 * Компонент для отображения деталей заказа
 */
const OrderDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>('details');
  const [statusUpdateLoading, setStatusUpdateLoading] = useState<boolean>(false);

  // Функция для получения статусов заказов на русском языке
  const getStatusText = (status: string): string => {
    const statusMap: Record<string, string> = {
      'awaiting_response': 'Ожидает отклика',
      'in_progress': 'В работе',
      'on_review': 'На проверке',
      'completed': 'Завершен',
      'cancelled': 'Отменен'
    };
    return statusMap[status] || status;
  };

  // Функция для определения цвета бейджа статуса
  const getStatusVariant = (status: string): string => {
    const variantMap: Record<string, string> = {
      'awaiting_response': 'secondary',
      'in_progress': 'default',
      'on_review': 'warning',
      'completed': 'success',
      'cancelled': 'destructive'
    };
    return variantMap[status] || 'default';
  };

  // Загрузка данных о заказе
  useEffect(() => {
    const fetchOrderDetails = async () => {
      setLoading(true);
      try {
        const response = await axios.get(`/api/orders/${id}/`);
        setOrder(response.data);
        setError(null);
      } catch (err) {
        setError('Ошибка при загрузке информации о заказе');
        console.error('Ошибка при загрузке информации о заказе:', err);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchOrderDetails();
    }
  }, [id]);

  // Проверка, является ли текущий пользователь клиентом этого заказа
  const isClient = user && order && user.id === order.client.id;
  
  // Проверка, является ли текущий пользователь креатором этого заказа
  const isCreator = user && order && order.creator && user.id === order.creator.id;

  // Функция для изменения статуса заказа
  const updateOrderStatus = async (newStatus: string) => {
    if (!order) return;
    
    setStatusUpdateLoading(true);
    try {
      let endpoint = '';
      
      switch (newStatus) {
        case 'on_review':
          endpoint = `/api/orders/${order.id}/submit-for-review/`;
          break;
        case 'completed':
          endpoint = `/api/orders/${order.id}/complete/`;
          break;
        default:
          throw new Error('Неподдерживаемый статус');
      }
      
      const response = await axios.post(endpoint);
      setOrder(prevOrder => ({
        ...prevOrder!,
        status: newStatus,
        updated_at: new Date().toISOString()
      }));
      
    } catch (err) {
      alert('Произошла ошибка при обновлении статуса заказа');
      console.error('Ошибка при обновлении статуса заказа:', err);
    } finally {
      setStatusUpdateLoading(false);
    }
  };

  // Функция для перехода к чату с креатором
  const goToChat = async () => {
    if (!order || !order.creator) return;
    
    try {
      // Получаем или создаем чат для данного заказа
      const response = await axios.get(`/api/chats/order_chats/`, {
        params: { order_id: order.id }
      });
      
      if (response.data && response.data.length > 0) {
        // Переходим к первому чату из списка
        navigate(`/chats/${response.data[0].id}`);
      } else {
        // Если чат не найден, показываем ошибку
        alert('Чат с креатором не найден');
      }
    } catch (err) {
      console.error('Ошибка при поиске чата:', err);
      alert('Ошибка при поиске чата с креатором');
    }
  };

  // Рендерим скелетон загрузки, если данные еще загружаются
  if (loading) {
    return (
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        <Card className="overflow-hidden">
          <CardHeader>
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-5 w-1/2 mt-2" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-40 w-full mb-6" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
            </div>
            <Skeleton className="h-10 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  // Рендерим сообщение об ошибке, если не удалось загрузить данные
  if (error || !order) {
    return (
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Ошибка</AlertTitle>
          <AlertDescription>
            {error || 'Не удалось загрузить информацию о заказе'}
          </AlertDescription>
        </Alert>
        <div className="flex justify-center mt-6">
          <Button 
            variant="outline" 
            onClick={() => navigate(-1)}
          >
            Вернуться назад
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-4xl">
      <Card className="overflow-hidden">
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-2xl">{order.title}</CardTitle>
              <CardDescription className="mt-1 flex items-center gap-2">
                <User size={14} />
                Клиент: {order.client.username}
                {order.is_private && (
                  <Badge variant="outline" className="ml-2">Приватный заказ</Badge>
                )}
              </CardDescription>
            </div>
            <div className="flex flex-col items-end gap-2">
              <Badge variant={getStatusVariant(order.status) as any} className="px-3 py-1 text-sm">
                {getStatusText(order.status)}
              </Badge>
              <span className="text-xs text-gray-500">
                {format(new Date(order.created_at), "d MMMM yyyy", { locale: ru })}
              </span>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <Tabs defaultValue="details" value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="details">Детали заказа</TabsTrigger>
              {(isClient || isCreator) && (
                <TabsTrigger value="responses">
                  Отклики креаторов {order.responses_count > 0 && `(${order.responses_count})`}
                </TabsTrigger>
              )}
            </TabsList>
            
            <TabsContent value="details">
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium mb-2">Описание</h3>
                  <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                    {order.description}
                  </p>
                </div>
                
                <Separator />
                
                <div>
                  <h3 className="text-lg font-medium mb-2">Требования</h3>
                  <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                    {order.requirements || 'Требования не указаны'}
                  </p>
                </div>
                
                <Separator />
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-lg font-medium mb-2">Информация о заказе</h3>
                    <ul className="space-y-2">
                      <li className="flex items-center">
                        <DollarSign size={18} className="text-green-600 mr-2" />
                        <span>Бюджет: {order.budget} ₽</span>
                      </li>
                      <li className="flex items-center">
                        <Calendar size={18} className="text-blue-600 mr-2" />
                        <span>
                          Дедлайн: {order.deadline ? format(new Date(order.deadline), "d MMMM yyyy", { locale: ru }) : 'Не указан'}
                        </span>
                      </li>
                      <li className="flex items-center">
                        <Clock size={18} className="text-yellow-600 mr-2" />
                        <span>Время выполнения: {order.delivery_time || 'Не указано'} дней</span>
                      </li>
                    </ul>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-medium mb-2">Теги</h3>
                    {order.tags.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {order.tags.map((tag, index) => (
                          <Badge key={index} variant="secondary">
                            <Tag size={12} className="mr-1" />{tag}
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500">Теги не указаны</p>
                    )}
                  </div>
                </div>
                
                {order.creator && (
                  <>
                    <Separator />
                    <div>
                      <h3 className="text-lg font-medium mb-2">Креатор</h3>
                      <div className="flex items-center gap-3">
                        <div className="h-12 w-12 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden flex items-center justify-center">
                          {order.creator.avatar ? (
                            <img 
                              src={order.creator.avatar} 
                              alt={order.creator.username} 
                              className="h-full w-full object-cover" 
                            />
                          ) : (
                            <User size={24} className="text-gray-500" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium">{order.creator.username}</p>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={goToChat}
                            className="mt-1"
                          >
                            <MessageSquare size={14} className="mr-1" />
                            Перейти к чату
                          </Button>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="responses">
              {isClient && (
                <CreatorResponsesList 
                  orderId={order.id}
                  canSelectCreator={order.status === 'awaiting_response'} 
                />
              )}
              {isCreator && (
                <div className="text-center py-10">
                  <p>Вы можете видеть только свой отклик на этот заказ.</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
        
        <CardFooter className="flex-col items-stretch gap-4 sm:flex-row sm:items-center">
          {isClient && order.status === 'on_review' && (
            <Button 
              onClick={() => updateOrderStatus('completed')}
              disabled={statusUpdateLoading}
              className="w-full sm:w-auto"
            >
              <CheckCircle size={16} className="mr-2" />
              Принять работу
            </Button>
          )}
          
          {isCreator && order.status === 'in_progress' && (
            <Button 
              onClick={() => updateOrderStatus('on_review')}
              disabled={statusUpdateLoading}
              className="w-full sm:w-auto"
            >
              <AlertCircle size={16} className="mr-2" />
              Отправить на проверку
            </Button>
          )}

          {!order.creator && !isClient && order.status === 'awaiting_response' && !order.is_private && (
            <Button 
              onClick={() => navigate(`/orders/${order.id}/respond`)}
              className="w-full sm:w-auto"
            >
              Откликнуться на заказ
            </Button>
          )}
          
          {(isClient || isCreator) && order.creator && (
            <Button 
              variant="outline" 
              onClick={goToChat}
              className="w-full sm:w-auto"
            >
              <MessageSquare size={16} className="mr-2" />
              Перейти к чату
            </Button>
          )}
          
          <Button 
            variant="ghost" 
            onClick={() => navigate(-1)}
            className="w-full sm:w-auto"
          >
            Назад
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default OrderDetails;