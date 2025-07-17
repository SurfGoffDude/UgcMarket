/**
 * Страница заказов креатора
 * 
 * Отображает заказы креатора в двух колонках:
 * - Заказы в работе (статусы 'in_progress', 'revision', 'paid')
 * - Выполненные заказы (статусы 'delivered', 'completed')
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Card, Button, Badge, 
  Skeleton, 
  Separator
} from '@/components/ui';
import { Calendar, Clock, FileText, Package, CheckCircle2, Hourglass } from 'lucide-react';
import { useApiContext } from '@/contexts/ApiContext';
import { useAuth } from '@/contexts/AuthContext';
import { Order, OrderStatus } from '@/types/orders';
import { getCreatorOrders } from '@/api/ordersApi';

/**
 * Компонент отображения статуса заказа
 */
const OrderStatusBadge: React.FC<{ status: OrderStatus }> = ({ status }) => {
  // Определяем доступные варианты для Badge
  type BadgeVariant = 'default' | 'outline' | 'secondary' | 'destructive';
  
  const statusMap: Record<OrderStatus, { label: string, variant: BadgeVariant }> = {
    'pending': { label: 'Ожидает оплаты', variant: 'outline' },
    'paid': { label: 'Оплачен', variant: 'secondary' },
    'in_progress': { label: 'В работе', variant: 'default' },
    'delivered': { label: 'Выполнен', variant: 'default' },
    'completed': { label: 'Завершен', variant: 'default' },
    'cancelled': { label: 'Отменен', variant: 'destructive' },
    'disputed': { label: 'Спор', variant: 'destructive' },
    'revision': { label: 'На доработке', variant: 'secondary' },
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
            {order.service?.title || `Заказ #${order.id}`}
          </Link>
          <OrderStatusBadge status={order.status} />
        </div>
        
        <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground mb-2">
          <div className="flex items-center">
            <Calendar className="h-4 w-4 mr-1" />
            <span>Создан: {new Date(order.created_at).toLocaleDateString()}</span>
          </div>
          <div className="flex items-center">
            <Clock className="h-4 w-4 mr-1" />
            <span>Срок: {new Date(order.delivery_date).toLocaleDateString()}</span>
          </div>
        </div>
        
        <div className="flex justify-between items-center">
          <div className="font-medium">
            {order.price ? `${order.price} ₽` : 'Цена не указана'}
          </div>
          <Button variant="outline" asChild>
            <Link to={`/orders/${order.id}`}>
              <FileText className="h-4 w-4 mr-2" />
              Детали
            </Link>
          </Button>
        </div>
      </div>
    </Card>
  );
};

/**
 * Компонент колонки заказов
 */
const OrdersColumn: React.FC<{ 
  title: string, 
  icon: React.ReactNode, 
  orders: Order[], 
  isLoading: boolean, 
  error: string | null 
}> = ({ title, icon, orders, isLoading, error }) => {
  return (
    <div className="w-full">
      <div className="flex items-center mb-4">
        {icon}
        <h2 className="text-xl font-bold ml-2">{title}</h2>
      </div>
      
      {isLoading ? (
        <>
          {Array.from({ length: 2 }).map((_, i) => (
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
      ) : orders.length > 0 ? (
        orders.map((order) => (
          <OrderCard key={order.id} order={order} />
        ))
      ) : (
        <div className="text-center p-8">
          <Package className="h-12 w-12 mx-auto mb-2 text-muted-foreground" />
          <h3 className="text-lg font-medium mb-1">Нет заказов</h3>
          <p className="text-muted-foreground mb-4">
            В этой категории нет заказов
          </p>
        </div>
      )}
    </div>
  );
};

/**
 * Основной компонент страницы заказов креатора
 */
const CreatorOrdersPage: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth(); // Получаем пользователя из контекста авторизации
  
  // Загрузка заказов креатора при загрузке компонента
  useEffect(() => {
    const fetchOrders = async () => {
      // Если пользователь не загружен, просто показываем индикатор загрузки
      if (!user) {
        return;
      }
      
      setIsLoading(true);
      
      try {
        // Передаем ID пользователя для корректного запроса к API
        // Параметр target_creator передается внутри метода getCreatorOrders
        const data = await getCreatorOrders(user.id);
        
        setOrders(data);
        setError(null);
      } catch (err) {
        console.error('Ошибка при загрузке заказов креатора:', err);
        setError('Не удалось загрузить заказы. Пожалуйста, попробуйте позже.');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchOrders();
  }, [user]); // Добавляем зависимость от пользователя
  
  // Фильтрация заказов в работе (статус "in_progress" или "revision")
  const inProgressOrders = orders.filter(
    order => order.status === 'in_progress' || order.status === 'revision' || order.status === 'paid'
  );
  
  // Фильтрация выполненных заказов (статусы "delivered" и "completed")
  const completedOrders = orders.filter(
    order => order.status === 'delivered' || order.status === 'completed'
  );
  
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Мои заказы как креатора</h1>
        <p className="text-muted-foreground mt-2">
          Управляйте заказами, над которыми вы работаете как креатор
        </p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <OrdersColumn 
          title="Заказы в работе" 
          icon={<Hourglass className="h-6 w-6 text-blue-500" />}
          orders={inProgressOrders}
          isLoading={isLoading}
          error={error}
        />
        
        <div className="hidden lg:block">
          <Separator orientation="vertical" className="h-full" />
        </div>
        
        <OrdersColumn 
          title="Выполненные заказы"
          icon={<CheckCircle2 className="h-6 w-6 text-green-500" />}
          orders={completedOrders}
          isLoading={isLoading}
          error={error}
        />
      </div>
    </div>
  );
};

export default CreatorOrdersPage;