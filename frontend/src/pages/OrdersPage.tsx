/**
 * Страница для работы с заказами
 * 
 * Отображает список заказов пользователя с возможностью фильтрации
 * и детального просмотра каждого заказа.
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Card, Button, Badge, 
  Tabs, TabsList, TabsTrigger, TabsContent,
  Skeleton
} from '@/components/ui';
import { Calendar, Clock, FileText, Package } from 'lucide-react';
import { useApiContext } from '@/contexts/ApiContext';
import { Order, OrderStatus } from '@/types';
import api from '@/lib/api';

/**
 * Компонент отображения статуса заказа
 */
const OrderStatusBadge: React.FC<{ status: OrderStatus }> = ({ status }) => {
  const statusMap: Record<OrderStatus, { label: string, variant: 'default' | 'outline' | 'secondary' | 'destructive' | 'success' }> = {
    'pending': { label: 'Ожидает оплаты', variant: 'outline' },
    'paid': { label: 'Оплачен', variant: 'secondary' },
    'in_progress': { label: 'В работе', variant: 'default' },
    'delivered': { label: 'Выполнен', variant: 'success' },
    'completed': { label: 'Завершен', variant: 'success' },
    'cancelled': { label: 'Отменен', variant: 'destructive' },
    'disputed': { label: 'Спор', variant: 'destructive' }
  };

  const { label, variant } = statusMap[status] || { label: status, variant: 'outline' };

  return <Badge variant={variant}>{label}</Badge>;
};

/**
 * Компонент карточки заказа для списка
 */
const OrderCard: React.FC<{ order: Order }> = ({ order }) => {
  return (
    <Card className="overflow-hidden mb-4 hover:shadow-md transition-shadow">
      <div className="flex flex-col p-4">
        <div className="flex justify-between items-center mb-2">
          <Link to={`/orders/${order.id}`} className="text-lg font-semibold hover:underline">
            Заказ #{order.id} - {order.service.title}
          </Link>
          <OrderStatusBadge status={order.status} />
        </div>
        
        <div className="flex flex-col sm:flex-row justify-between text-sm text-muted-foreground mb-3">
          <div className="flex items-center">
            <Calendar className="h-4 w-4 mr-1" />
            <span>Создан: {new Date(order.created_at).toLocaleDateString('ru-RU')}</span>
          </div>
          <div className="flex items-center mt-1 sm:mt-0">
            <Clock className="h-4 w-4 mr-1" />
            <span>Срок: {new Date(order.delivery_date).toLocaleDateString('ru-RU')}</span>
          </div>
        </div>

        <div className="mt-2 flex justify-between items-center">
          <div>
            <div className="text-sm font-medium">Стоимость: {order.total_price} ₽</div>
          </div>
          <Link to={`/orders/${order.id}`}>
            <Button variant="outline" size="sm">
              <FileText className="h-4 w-4 mr-1" /> Подробнее
            </Button>
          </Link>
        </div>
      </div>
    </Card>
  );
};

/**
 * Основной компонент страницы заказов
 */
const OrdersPage: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const [activeTab, setActiveTab] = useState<string>("all");
  const { user, isAuthenticated } = useApiContext();
  const navigate = useNavigate();

  // Загрузка заказов при монтировании компонента
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: location.pathname } });
      return;
    }

    const fetchOrders = async () => {
      try {
        setLoading(true);
        const { results } = await api.getOrders();
        setOrders(results);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Ошибка при загрузке заказов'));
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [isAuthenticated, navigate]);

  // Фильтрация заказов по статусу
  const getFilteredOrders = (tab: string): Order[] => {
    if (tab === 'all') return orders;
    if (tab === 'active') return orders.filter(order => ['paid', 'in_progress'].includes(order.status));
    if (tab === 'completed') return orders.filter(order => ['delivered', 'completed'].includes(order.status));
    if (tab === 'other') return orders.filter(order => ['pending', 'cancelled', 'disputed'].includes(order.status));
    return orders;
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Мои заказы</h1>
        <Button onClick={() => navigate('/create-order')}>
          <Package className="h-4 w-4 mr-2" /> Создать заказ
        </Button>
      </div>

      <Tabs defaultValue="all" className="mb-6" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full sm:w-auto">
          <TabsTrigger value="all">Все</TabsTrigger>
          <TabsTrigger value="active">Активные</TabsTrigger>
          <TabsTrigger value="completed">Завершенные</TabsTrigger>
          <TabsTrigger value="other">Другие</TabsTrigger>
        </TabsList>
        
        <TabsContent value={activeTab}>
          {loading ? (
            <>
              {Array.from({ length: 3 }).map((_, i) => (
                <Card key={i} className="mb-4 p-4">
                  <div className="space-y-3">
                    <Skeleton className="h-6 w-3/4" />
                    <div className="flex justify-between">
                      <Skeleton className="h-4 w-1/4" />
                      <Skeleton className="h-4 w-1/4" />
                    </div>
                    <div className="flex justify-between items-center">
                      <Skeleton className="h-5 w-1/3" />
                      <Skeleton className="h-8 w-24" />
                    </div>
                  </div>
                </Card>
              ))}
            </>
          ) : error ? (
            <div className="text-center p-4">
              <p className="text-red-500 mb-2">Ошибка при загрузке заказов</p>
              <Button variant="outline" onClick={() => window.location.reload()}>
                Попробовать снова
              </Button>
            </div>
          ) : getFilteredOrders(activeTab).length > 0 ? (
            getFilteredOrders(activeTab).map((order) => (
              <OrderCard key={order.id} order={order} />
            ))
          ) : (
            <div className="text-center p-8">
              <Package className="h-12 w-12 mx-auto mb-2 text-muted-foreground" />
              <h3 className="text-lg font-medium mb-1">Нет заказов</h3>
              <p className="text-muted-foreground mb-4">
                {activeTab === 'all' ? 'У вас пока нет заказов. Создайте свой первый заказ!' : 'В этой категории нет заказов'}
              </p>
              {activeTab === 'all' && (
                <Button onClick={() => navigate('/services')}>
                  Выбрать услугу
                </Button>
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default OrdersPage;
