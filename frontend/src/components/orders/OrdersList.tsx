import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Badge,
  Button,
  Skeleton,
} from '@/components/ui';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { CalendarIcon, TagIcon } from 'lucide-react';
import apiClient from '@/api/client';
import { Order, PaginatedResponse } from '@/types';
import OrderFilters, { SelectedTags } from '@/components/orders/OrderFilters';

interface OrdersListProps {
  showPublicOnly?: boolean;
  creatorId?: number;
  clientId?: number;
  orderStatus?: string;
  defaultSortOrder?: 'newest' | 'oldest' | 'price_high' | 'price_low';
}

/**
 * Компонент списка заказов с фильтрацией и сортировкой
 */
const OrdersList: React.FC<OrdersListProps> = ({
  showPublicOnly = false,
  creatorId,
  clientId,
  orderStatus,
  defaultSortOrder = 'newest'
}) => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState(defaultSortOrder);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  // Состояние для тегов и поискового запроса
  const [selectedTags, setSelectedTags] = useState<SelectedTags>({});
  const [searchQuery, setSearchQuery] = useState('');

  // Функция для получения всех выбранных тегов в виде массива
  const getSelectedTagsArray = () => {
    const tagsArray: string[] = [];
    
    // Собираем все выбранные slug'и тегов из всех категорий
    Object.entries(selectedTags).forEach(([categoryId, tagSlugs]) => {

      tagsArray.push(...tagSlugs);
    });
    

    return tagsArray;
  };

  // Загрузка заказов
  const fetchOrders = async (resetPage = false) => {
    try {
      setLoading(true);
      const currentPage = resetPage ? 1 : page;
      
      // Формирование параметров запроса
      const requestParams: Record<string, string | number | boolean | string[]> = {
        page: currentPage
      };
      
      if (showPublicOnly) requestParams.is_private = false;
      if (creatorId) requestParams.creator = creatorId;
      if (clientId) requestParams.client = clientId;
      if (orderStatus) requestParams.status = orderStatus;
      
      // Добавляем параметр поиска, если он задан
      if (searchQuery) requestParams.search = searchQuery;
      
      // Если есть выбранные теги, добавляем их в параметры запроса в виде строки с разделителями
      // Бэкенд ожидает параметр tags с разделенными запятой slug'ами тегов
      const selectedTagsArray = getSelectedTagsArray();
      if (selectedTagsArray.length > 0) {
        const tagsParam = selectedTagsArray.join(',');
        requestParams.tags = tagsParam;

      }
      
      requestParams.ordering = sortOrder === 'newest' ? '-created_at' : 
                              sortOrder === 'oldest' ? 'created_at' : 
                              sortOrder === 'price_high' ? '-budget' : 
                              sortOrder === 'price_low' ? 'budget' : '-created_at';

      const response = await apiClient.get<PaginatedResponse<Order>>('/orders/', { params: requestParams });
      
      // Обработка результата
      const data = response.data as PaginatedResponse<Order>;
      const newOrders = data.results || [];
      const nextPage = data.next !== null;
      if (resetPage || currentPage === 1) {
        setOrders(newOrders);
      } else {
        setOrders(prev => [...prev, ...newOrders]);
      }
      
      setHasMore(nextPage);
      setPage(resetPage ? 2 : currentPage + 1);
      setError(null);
    } catch (err) {

      setError(`Ошибка загрузки заказов: ${err instanceof Error ? err.message : 'Произошла ошибка при выполнении запроса'}`);
    } finally {
      setLoading(false);
    }
  };

  // Загрузка при монтировании и изменении параметров
  useEffect(() => {
    fetchOrders(true);
  }, [showPublicOnly, creatorId, clientId, orderStatus, sortOrder, selectedTags, searchQuery]);
  
  // Обработчик изменения фильтров тегов
  const handleFilterChange = ({ tags, query }: { tags: SelectedTags; query: string }) => {
    setSelectedTags(tags);
    setSearchQuery(query);
    setPage(1); // Сбрасываем страницу на первую при изменении фильтров
    fetchOrders(true); // Обновляем заказы с новыми фильтрами
  };

  // Статус заказа с соответствующим стилем
  const getStatusBadge = (status: Order['status']) => {
    const statusMap: Record<string, { label: string, variant: 'default' | 'outline' | 'secondary' | 'destructive' | 'success' }> = {
      'awaiting_response': { label: 'Ожидает отклика', variant: 'outline' },
      'in_progress': { label: 'В работе', variant: 'default' },
      'completed': { label: 'Завершен', variant: 'success' },
      'cancelled': { label: 'Отменен', variant: 'destructive' }
    };

    const { label, variant } = statusMap[status] || { label: status, variant: 'outline' };
    const statusText = label;
    return <Badge className="bg-green-500 hover:bg-green-600 text-white">{statusText}</Badge>;
  };

  // Показ карточек-заглушек при загрузке
  const renderSkeletons = () => {
    return Array.from({ length: 3 }).map((_, i) => (
      <Card key={`skeleton-${i}`} className="mb-4">
        <CardHeader>
          <Skeleton className="h-6 w-3/4" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Skeleton className="h-5 w-1/3" />
          <Skeleton className="h-9 w-24" />
        </CardFooter>
      </Card>
    ));
  };

  return (
    <div className="space-y-4">
      {/* Компонент фильтрации по тегам */}
      <OrderFilters 
        onFilterChange={handleFilterChange}
        initialFilters={{ tags: selectedTags, query: searchQuery }}
      />
      
      {/* Сортировка */}
      <div className="flex justify-end mb-4">
        <select 
          value={sortOrder}
          onChange={(e) => setSortOrder(e.target.value as any)}
          className="border rounded p-2 text-sm"
        >
          <option value="newest">Сначала новые</option>
          <option value="oldest">Сначала старые</option>
          <option value="price_high">По убыванию цены</option>
          <option value="price_low">По возрастанию цены</option>
        </select>
      </div>

      {/* Список заказов */}
      {loading && orders.length === 0 ? (
        renderSkeletons()
      ) : error ? (
        <div className="text-center p-6">
          <p className="text-red-500 mb-2">{error}</p>
          <Button variant="outline" onClick={() => fetchOrders(true)}>
            Попробовать снова
          </Button>
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center p-8 border rounded-md">
          <h3 className="text-lg font-medium mb-2">Заказы не найдены</h3>
          <p className="text-gray-500">
            {showPublicOnly 
              ? 'В каталоге пока нет доступных заказов' 
              : 'По выбранным критериям не найдено заказов'}
          </p>
        </div>
      ) : (
        <>
          {orders.map(order => (
            <Card 
              key={order.id} 
              className="mb-4 hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => navigate(`/orders/${order.id}`)}
            >
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle className="text-lg">{order.title}</CardTitle>
                  {getStatusBadge(order.status)}
                </div>
              </CardHeader>
              
              <CardContent>
                <p className="text-gray-700 line-clamp-2 mb-3">
                  {order.description}
                </p>
                <div className="flex flex-wrap gap-2 mb-3">
                  {order.tags
                    ?.filter(tag => !tag.type || tag.type === 'order') // Фильтруем по типу 'order' или без типа (для совместимости)
                    .map(tag => (
                      <Badge key={tag.id} variant="outline" className="flex items-center">
                        <TagIcon className="h-3 w-3 mr-1" /> {tag.name}
                      </Badge>
                    ))}
                </div>
                <div className="flex items-center text-sm text-gray-500">
                  <CalendarIcon className="h-4 w-4 mr-1" />
                  <span>
                    {order.created_at && format(new Date(order.created_at), 'dd MMMM yyyy', { locale: ru })}
                  </span>
                </div>
              </CardContent>
              
              <CardFooter className="flex justify-between">
                <div className="font-medium text-green-600">
                  {order.budget ? `${order.budget} ₽` : 'Цена договорная'}
                </div>
                <Button size="sm">
                  Подробнее
                </Button>
              </CardFooter>
            </Card>
          ))}

          {hasMore && (
            <div className="text-center mt-4">
              <Button 
                variant="outline" 
                onClick={() => fetchOrders(false)}
                disabled={loading}
              >
                {loading ? 'Загрузка...' : 'Загрузить еще'}
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default OrdersList;