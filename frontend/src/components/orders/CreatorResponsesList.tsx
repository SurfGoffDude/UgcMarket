import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  User,
  CheckCircle,
  Clock,
  MessageSquare,
  Star
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from '@/components/ui/dialog';
import {
  Alert,
  AlertDescription,
  AlertTitle
} from '@/components/ui/alert';
import apiClient from '@/api/client';
import axios from 'axios';
import { formatDistanceToNow } from 'date-fns';
import { ru } from 'date-fns/locale';

/**
 * Интерфейс для объекта отклика креатора на заказ
 */
interface CreatorResponse {
  id: number;
  order: number;
  creator: {
    id: number;
    username: string;
    avatar?: string;
    rating: number;
    completed_orders_count: number;
  };
  message: string;
  price_offer: number | null;
  delivery_time_offer: number | null;
  status: string;
  created_at: string;
}

/**
 * Интерфейс для пропсов компонента списка откликов
 */
interface CreatorResponsesListProps {
  orderId: number;
  canSelectCreator: boolean;
}

/**
 * Компонент для отображения списка откликов на заказ
 */
const CreatorResponsesList: React.FC<CreatorResponsesListProps> = ({ orderId, canSelectCreator }) => {
  const [responses, setResponses] = useState<CreatorResponse[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState<boolean>(false);
  const [selectedCreatorId, setSelectedCreatorId] = useState<number | null>(null);
  const [processingSelect, setProcessingSelect] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Статусы откликов на русском языке
  const getResponseStatus = (status: string): string => {
    const statusMap: Record<string, string> = {
      'pending': 'Ожидает рассмотрения',
      'accepted': 'Принят',
      'rejected': 'Отклонен'
    };
    return statusMap[status] || status;
  };

  // Загрузка откликов на заказ
  useEffect(() => {
    const fetchResponses = async () => {
      setLoading(true);
      try {
        const response = await axios.get(`/api/order-responses/`, {
          params: { order_id: orderId }
        });
        setResponses(response.data.results || response.data);
        setError(null);
      } catch (err) {
        setError('Ошибка при загрузке откликов креаторов');

      } finally {
        setLoading(false);
      }
    };

    fetchResponses();
  }, [orderId]);

  // Выбор креатора для выполнения заказа
  const selectCreator = async () => {
    if (!selectedCreatorId) return;
    
    setProcessingSelect(true);
    try {
      // Используем корректный URL с snake_case как на бэкенде
      // Добавляем токен авторизации к запросу
      await apiClient.post(
        `orders/${orderId}/select_creator/`,
        { creator_id: selectedCreatorId }
      );
      
      // Обновляем статус откликов
      setResponses(prevResponses => 
        prevResponses.map(response => ({
          ...response,
          status: response.creator.id === selectedCreatorId ? 'accepted' : 'rejected'
        }))
      );
      
      setSuccessMessage('Креатор успешно назначен на заказ');
      setShowConfirmDialog(false);
      
      // Редирект на страницу заказа или обновление данных не нужен,
      // т.к. компонент уже находится внутри страницы заказа
      // и родительский компонент может обновить данные своим способом
    } catch (err) {
      setError('Ошибка при назначении креатора');

    } finally {
      setProcessingSelect(false);
    }
  };

  // Открытие диалога подтверждения
  const openConfirmDialog = (creatorId: number) => {
    setSelectedCreatorId(creatorId);
    setShowConfirmDialog(true);
  };

  // Если загружаем данные
  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, index) => (
          <Card key={`skeleton-${index}`}>
            <CardHeader>
              <div className="flex items-center">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="ml-3">
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-4 w-24 mt-1" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Skeleton className="h-20 w-full" />
            </CardContent>
            <CardFooter>
              <Skeleton className="h-10 w-32" />
            </CardFooter>
          </Card>
        ))}
      </div>
    );
  }

  // Если произошла ошибка
  if (error) {
    return (
      <Alert variant="destructive" className="mb-6">
        <AlertTitle>Ошибка</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  // Если нет откликов
  if (responses.length === 0) {
    return (
      <div className="text-center py-10">
        <MessageSquare className="h-12 w-12 mx-auto text-gray-400" />
        <p className="mt-2 text-lg font-medium">Ещё нет откликов</p>
        <p className="text-gray-500">
          Когда креаторы откликнутся на ваш заказ, они появятся здесь
        </p>
      </div>
    );
  }

  // Успешное сообщение после выбора креатора
  if (successMessage) {
    return (
      <Alert className="mb-6 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
        <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
        <AlertTitle>Успешно</AlertTitle>
        <AlertDescription>{successMessage}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div>
      <div className="space-y-6">
        {responses.map((response) => (
          <Card key={response.id} className={
            response.status === 'accepted' 
              ? 'border-green-500 dark:border-green-700' 
              : response.status === 'rejected'
                ? 'border-gray-300 dark:border-gray-700 opacity-70'
                : ''
          }>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center">
                  <div className="h-10 w-10 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden flex items-center justify-center">
                    {response.creator.avatar ? (
                      <img 
                        src={response.creator.avatar} 
                        alt={response.creator.username} 
                        className="h-full w-full object-cover" 
                      />
                    ) : (
                      <User size={24} className="text-gray-500" />
                    )}
                  </div>
                  <div className="ml-3">
                    <CardTitle className="text-md font-medium">
                      {response.creator.username}
                    </CardTitle>
                    <CardDescription className="flex items-center text-xs">
                      <Star size={12} className="text-yellow-500 mr-1" />
                      {response.creator.rating.toFixed(1)} • {response.creator.completed_orders_count} заказов
                    </CardDescription>
                  </div>
                </div>
                <Badge variant={
                  response.status === 'accepted' 
                    ? 'outline' 
                    : response.status === 'rejected'
                      ? 'destructive'
                      : 'secondary'
                }>
                  {getResponseStatus(response.status)}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                    {response.message}
                  </p>
                </div>
                <div className="flex flex-wrap gap-4">
                  {response.price_offer !== null && (
                    <div className="bg-gray-100 dark:bg-gray-800 rounded-md px-3 py-1 flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-600 dark:text-green-400 mr-1">
                        <line x1="12" y1="2" x2="12" y2="22"></line>
                        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                      </svg>
                      <span className="text-sm">
                        Предложенная цена: {response.price_offer} ₽
                      </span>
                    </div>
                  )}
                  {response.delivery_time_offer !== null && (
                    <div className="bg-gray-100 dark:bg-gray-800 rounded-md px-3 py-1 flex items-center">
                      <Clock size={16} className="text-blue-600 dark:text-blue-400 mr-1" />
                      <span className="text-sm">
                        Срок выполнения: {response.delivery_time_offer} дней
                      </span>
                    </div>
                  )}
                  <div className="bg-gray-100 dark:bg-gray-800 rounded-md px-3 py-1 flex items-center">
                    <Clock size={16} className="text-gray-600 dark:text-gray-400 mr-1" />
                    <span className="text-sm">
                      Отклик создан {formatDistanceToNow(new Date(response.created_at), {
                        addSuffix: true,
                        locale: ru
                      })}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <div className="flex justify-between w-full">
                {canSelectCreator && response.status === 'pending' && (
                  <Button 
                    onClick={() => openConfirmDialog(response.creator.id)}
                  >
                    <CheckCircle size={16} className="mr-2" />
                    Выбрать креатора
                  </Button>
                )}
                
                <Button 
                  variant="outline"
                  onClick={() => window.open(`/creators/${response.creator.id}`, '_blank')}
                  className="ml-auto"
                >
                  <User size={16} className="mr-2" />
                  Профиль креатора
                </Button>
              </div>
            </CardFooter>
          </Card>
        ))}
      </div>

      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Подтверждение выбора креатора</DialogTitle>
            <DialogDescription>
              Вы уверены, что хотите выбрать этого креатора для выполнения заказа?
              После подтверждения другие отклики будут отклонены, а статус заказа изменится на "В работе".
            </DialogDescription>
          </DialogHeader>
          
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline" disabled={processingSelect}>
                Отмена
              </Button>
            </DialogClose>
            <Button 
              onClick={selectCreator} 
              disabled={processingSelect}
            >
              {processingSelect ? 'Обработка...' : 'Подтвердить выбор'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CreatorResponsesList;