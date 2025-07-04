/**
 * Страница для отображения и управления уведомлениями пользователя
 */
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { ru } from 'date-fns/locale';
import { Trash2 as TrashIcon, RefreshCw as RefreshIcon, CheckSquare as CheckSquareIcon, 
         Bell as BellIcon, Settings as SettingsIcon, Check as CheckIcon } from 'lucide-react';

// Импорт компонентов из библиотеки UI
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Label } from '@/components/ui/label';

import {
  useGetNotificationsQuery,
  useMarkAsReadMutation,
  useMarkAllAsReadMutation,
  useClearAllNotificationsMutation
} from '../api/notificationsApi';
import { Notification, NotificationType, NotificationFilterParams } from '../types/notifications';

/**
 * Компонент страницы уведомлений
 */
const NotificationsPage: React.FC = () => {
  // Состояние фильтрации и пагинации
  const [tabValue, setTabValue] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [filterParams, setFilterParams] = useState<NotificationFilterParams>({
    page: 1,
    page_size: pageSize
  });
  
  // Получение данных уведомлений из API
  const { 
    data, 
    isLoading, 
    isFetching, 
    refetch 
  } = useGetNotificationsQuery(filterParams);
  
  // API мутации для управления уведомлениями
  const [markAsRead] = useMarkAsReadMutation();
  const [markAllAsRead, { isLoading: isMarkingAllRead }] = useMarkAllAsReadMutation();
  const [clearAll, { isLoading: isClearingAll }] = useClearAllNotificationsMutation();
  
  // Обновление параметров фильтрации при изменении вкладки или страницы
  useEffect(() => {
    const newFilterParams: NotificationFilterParams = {
      page,
      page_size: pageSize,
    };
    
    if (tabValue === 'unread') {
      newFilterParams.is_read = false;
    } else if (tabValue === 'read') {
      newFilterParams.is_read = true;
    }
    
    setFilterParams(newFilterParams);
  }, [tabValue, page, pageSize]);

  // Обработчики событий
  const handleTabChange = (value: string) => {
    setTabValue(value);
    setPage(1);
  };
  
  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };
  
  const handleMarkAsRead = async (id: number) => {
    try {
      await markAsRead(id).unwrap();
    } catch (error) {

    }
  };
  
  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead().unwrap();
    } catch (error) {

    }
  };
  
  const handleClearAll = async () => {
    if (window.confirm('Вы уверены, что хотите удалить все уведомления?')) {
      try {
        await clearAll().unwrap();
      } catch (error) {

      }
    }
  };
  
  // Форматирование даты для отображения
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return formatDistanceToNow(date, { addSuffix: true, locale: ru });
  };

  // Получение иконки для типа уведомления
  const getNotificationIcon = (type: NotificationType) => {
    switch(type) {
      case 'order':
        return <Badge className="bg-blue-500">Заказ</Badge>;
      case 'message':
        return <Badge className="bg-green-500">Сообщение</Badge>;
      case 'system':
        return <Badge className="bg-purple-500">Система</Badge>;
      case 'payment':
        return <Badge className="bg-yellow-500">Оплата</Badge>;
      default:
        return <Badge>Уведомление</Badge>;
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Уведомления</h1>
        
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isLoading || isFetching}
          >
            <RefreshIcon className="mr-1" size={16} />
            Обновить
          </Button>
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleMarkAllAsRead}
                  disabled={isLoading || isMarkingAllRead}
                >
                  <CheckSquareIcon className="mr-1" size={16} />
                  Прочитано
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Отметить все как прочитанные</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleClearAll}
            disabled={isLoading || isClearingAll}
          >
            <TrashIcon className="mr-1" size={16} />
            Очистить
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            asChild
          >
            <Link to="/notification-settings">
              <SettingsIcon className="mr-1" size={16} />
              Настройки
            </Link>
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <Tabs value={tabValue} onValueChange={handleTabChange}>
            <div className="flex items-center justify-between">
              <TabsList>
                <TabsTrigger value="all">Все</TabsTrigger>
                <TabsTrigger value="unread">Непрочитанные</TabsTrigger>
                <TabsTrigger value="read">Прочитанные</TabsTrigger>
              </TabsList>
              
              <div className="flex items-center gap-2">
                <Label htmlFor="sort-select">Сортировка:</Label>
                <Select
                  defaultValue="newest"
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Выберите сортировку" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">Сначала новые</SelectItem>
                    <SelectItem value="oldest">Сначала старые</SelectItem>
                    <SelectItem value="important">По важности</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <TabsContent value="all" className="pt-4">
              {renderNotificationsList()}
            </TabsContent>
            
            <TabsContent value="unread" className="pt-4">
              {renderNotificationsList()}
            </TabsContent>
            
            <TabsContent value="read" className="pt-4">
              {renderNotificationsList()}
            </TabsContent>
          </Tabs>
        </CardHeader>
      </Card>
    </div>
  );
  
  // Рендер списка уведомлений
  function renderNotificationsList() {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center p-8">
          <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
        </div>
      );
    }
    
    if (!data || !data.results || data.results.length === 0) {
      return (
        <Alert>
          <AlertDescription className="flex flex-col items-center justify-center py-8 text-center">
            <BellIcon size={48} className="mb-4 text-muted-foreground/50" />
            <p className="font-medium mb-2">Нет уведомлений</p>
            <p className="text-muted-foreground text-sm">
              {tabValue === 'all' 
                ? 'У вас пока нет уведомлений.'
                : tabValue === 'unread'
                  ? 'У вас нет непрочитанных уведомлений.'
                  : 'У вас нет прочитанных уведомлений.'
              }
            </p>
          </AlertDescription>
        </Alert>
      );
    }
    
    return (
      <CardContent>
        <div className="space-y-2">
          {data.results.map((notification) => (
            <React.Fragment key={notification.id}>
              <div className={`flex items-start p-4 rounded-md ${notification.is_read ? '' : 'bg-muted/30'}`}>
                <div className="mr-3 mt-1">
                  {getNotificationIcon(notification.type)}
                </div>
                
                <div className="flex-grow">
                  <div className="flex items-start justify-between mb-1">
                    <h5 className="font-medium">
                      {notification.title}
                    </h5>
                  </div>
                  
                  <p className="text-sm mb-2">
                    {notification.message}
                  </p>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-muted-foreground">
                      {formatDate(notification.created_at)}
                    </span>
                    
                    {notification.link && (
                      <Button 
                        variant="outline"
                        size="sm"
                        asChild
                      >
                        <Link to={notification.link}>
                          Подробнее
                        </Link>
                      </Button>
                    )}
                  </div>
                </div>
                
                <div className="ml-4">
                  {!notification.is_read && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon" 
                            onClick={() => handleMarkAsRead(notification.id)}
                          >
                            <CheckIcon size={18} />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Отметить как прочитанное</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                </div>
              </div>
              <Separator />
            </React.Fragment>
          ))}
          
          {/* Пагинация */}
          {data && data.count > pageSize && (
            <div className="flex justify-center py-4">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious 
                      onClick={() => handlePageChange(page > 1 ? page - 1 : 1)}
                      aria-disabled={page === 1}
                      tabIndex={page === 1 ? -1 : undefined}
                      className={page === 1 ? "pointer-events-none opacity-50" : ""}
                    />
                  </PaginationItem>
                  
                  {/* Генерация страниц */}
                  {Array.from({ length: Math.min(5, Math.ceil(data.count / pageSize)) }).map((_, i) => {
                    const pageNum = i + 1;
                    return (
                      <PaginationItem key={pageNum}>
                        <PaginationLink
                          isActive={page === pageNum}
                          onClick={() => handlePageChange(pageNum)}
                        >
                          {pageNum}
                        </PaginationLink>
                      </PaginationItem>
                    );
                  })}
                  
                  <PaginationItem>
                    <PaginationNext 
                      onClick={() => handlePageChange(page < Math.ceil(data.count / pageSize) ? page + 1 : page)}
                      aria-disabled={page >= Math.ceil(data.count / pageSize)}
                      tabIndex={page >= Math.ceil(data.count / pageSize) ? -1 : undefined}
                      className={page >= Math.ceil(data.count / pageSize) ? "pointer-events-none opacity-50" : ""}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </div>
      </CardContent>
    );
  }
};

export default NotificationsPage;