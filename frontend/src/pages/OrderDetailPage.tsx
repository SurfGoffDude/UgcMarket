/**
 * Страница детального просмотра заказа
 *
 * Отображает полную информацию о заказе в формате предпросмотра, похожем на CreateOrder.
 * Показывает статус, историю изменений, доставленные файлы и позволяет выполнять действия 
 * в зависимости от статуса. Поддерживает все этапы жизненного цикла заказа: 
 * принятие, доставку, завершение и запрос доработки.
 *
 * Использует компонент OrderDetailView для отображения информации о заказе в стиле предпросмотра.
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from "react-router-dom";
import axios, { AxiosError } from 'axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { 
  Check, 
  Ban, 
  FileText, 
  Send, 
  Loader2, 
  Download, 
  ThumbsUp, 
  ThumbsDown,
  RefreshCw, 
  MessageCircle, 
  AlertTriangle, 
  ArrowLeft
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { getOrder, acceptOrder, deliverOrder, requestRevision, completeOrder, cancelOrder, openDispute } from '@/api/ordersApi';
import { User as UserType } from '@/types/user';
import { Order, OrderStatus } from '@/types/orders';
import { UserProfile } from '@/types/auth';

// Импортируем наш новый компонент для отображения заказа
import OrderDetailView from '@/components/OrderDetailView';

/**
 * Основной компонент страницы детального просмотра заказа
 */
function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Преобразуем ID из параметров URL в число
  const orderId = id ? Number(id) : 0;
  
  /* UI-состояния */
  const [showRevisionDialog, setShowRevisionDialog] = useState(false);
  const [showCompleteDialog, setShowCompleteDialog] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [showDisputeDialog, setShowDisputeDialog] = useState(false);
  const [showDeliverDialog, setShowDeliverDialog] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  
  // Поля для форм диалогов
  const [revisionReason, setRevisionReason] = useState('');
  const [completeReason, setCompleteReason] = useState('');
  const [cancelReason, setCancelReason] = useState('');
  const [disputeReason, setDisputeReason] = useState('');
  const [deliveryMessage, setDeliveryMessage] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [order, setOrder] = useState<Order | null>(null);
  const [isCreator, setIsCreator] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  /* ------------------------------ Загрузка данных -------------------------- */
  const {
    data: orderData,
    isLoading: isLoadingOrder,
    error: errorOrder,
  } = useQuery({
    queryKey: ['order', id],
    queryFn: () => getOrder(orderId),
    enabled: !!id && isAuthenticated,
  });

  // Синхронизация данных из useQuery с локальными состояниями
  useEffect(() => {
    if (orderData) {
      setOrder(orderData);
      // Определяем, является ли текущий пользователь креатором заказа
      setIsCreator(user?.id === orderData.executor?.id);
    }
    
    if (!isLoadingOrder) {
      setIsLoading(false);
    }
    
    if (errorOrder) {
      setError(errorOrder instanceof Error ? errorOrder.message : 'Произошла ошибка при загрузке заказа');
    }
  }, [orderData, isLoadingOrder, errorOrder, user]);

  /* ------------------------------ Мутации ---------------------------------- */
  // Принятие заказа
  const acceptMutation = useMutation({
    mutationFn: (orderId: number) => acceptOrder(orderId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['order', id] });
      toast({ 
        title: 'Заказ принят в работу', 
        description: 'Вы можете начать выполнение заказа.' 
      });
    },
    onError: (e: AxiosError) => toast({
      title: 'Ошибка принятия заказа',
      description: e?.message ?? 'Произошла ошибка при принятии заказа',
      variant: 'destructive',
    }),
  });

  // Запрос на доработку
  const revisionMutation = useMutation({
    mutationFn: ({ orderId, reason }: { orderId: number; reason: string }) => 
      requestRevision(orderId, reason),
    onSuccess: () => {
      setShowRevisionDialog(false);
      setRevisionReason('');
      queryClient.invalidateQueries({ queryKey: ['order', id] });
      toast({ 
        title: 'Запрос на доработку отправлен', 
        description: 'Исполнитель получил ваш запрос.' 
      });
    },
    onError: (e: AxiosError) => toast({
      title: 'Ошибка запроса доработки',
      description: e?.message ?? 'Произошла ошибка при запросе доработки',
      variant: 'destructive',
    }),
  });

  // Завершение заказа
  const completeMutation = useMutation({
    mutationFn: ({ orderId, reason }: { orderId: number; reason: string }) => 
      completeOrder(orderId, reason),
    onSuccess: () => {
      setShowCompleteDialog(false);
      setCompleteReason('');
      queryClient.invalidateQueries({ queryKey: ['order', id] });
      toast({ 
        title: 'Заказ завершен', 
        description: 'Заказ успешно завершен. Благодарим за использование нашего сервиса!' 
      });
    },
    onError: (e: AxiosError) => toast({
      title: 'Ошибка завершения заказа',
      description: e?.message ?? 'Произошла ошибка при завершении заказа',
      variant: 'destructive',
    }),
  });

  // Отмена заказа
  const cancelMutation = useMutation({
    mutationFn: ({ orderId, reason }: { orderId: number; reason: string }) => 
      cancelOrder(orderId, reason),
    onSuccess: () => {
      setShowCancelDialog(false);
      setCancelReason('');
      queryClient.invalidateQueries({ queryKey: ['order', id] });
      toast({ 
        title: 'Заказ отменен', 
        description: 'Заказ был успешно отменен.' 
      });
    },
    onError: (e: AxiosError) => toast({
      title: 'Ошибка отмены заказа',
      description: e?.message ?? 'Произошла ошибка при отмене заказа',
      variant: 'destructive',
    }),
  });

  // Открытие спора
  const disputeMutation = useMutation({
    mutationFn: ({ orderId, reason }: { orderId: number; reason: string }) => 
      openDispute(orderId, reason),
    onSuccess: () => {
      setShowDisputeDialog(false);
      setDisputeReason('');
      queryClient.invalidateQueries({ queryKey: ['order', id] });
      toast({ 
        title: 'Спор открыт', 
        description: 'Спор был успешно открыт. Наши менеджеры рассмотрят его в ближайшее время.' 
      });
    },
    onError: (e: AxiosError) => toast({
      title: 'Ошибка открытия спора',
      description: e?.message ?? 'Произошла ошибка при открытии спора',
      variant: 'destructive',
    }),
  });

  // Доставка заказа
  const deliverMutation = useMutation({
    mutationFn: ({ orderId, message, files }: { orderId: number; message: string; files: File[] }) => {
      const formData = new FormData();
      formData.append('message', message);
      files.forEach(file => formData.append('files', file));
      
      return deliverOrder(orderId, formData);
    },
    onSuccess: () => {
      setShowDeliverDialog(false);
      setDeliveryMessage('');
      setFiles([]);
      queryClient.invalidateQueries({ queryKey: ['order', id] });
      toast({ 
        title: 'Заказ доставлен', 
        description: 'Файлы успешно загружены и отправлены клиенту.' 
      });
    },
    onError: (e: AxiosError) => toast({
      title: 'Ошибка доставки заказа',
      description: e?.message ?? 'Произошла ошибка при доставке заказа',
      variant: 'destructive',
    }),
  });

  /* ------------------------------ Обработчики событий --------------------- */
  
  // Принятие заказа
  const handleAcceptOrder = () => {
    acceptMutation.mutate(orderId);
  };

  // Доставка заказа
  const handleDeliverOrder = () => {
    setShowDeliverDialog(true);
  };

  const handleConfirmDeliver = () => {
    deliverMutation.mutate({
      orderId,
      message: deliveryMessage,
      files,
    });
  };

  // Запрос на доработку
  const handleRequestRevision = () => {
    setShowRevisionDialog(true);
  };

  const handleConfirmRevision = () => {
    revisionMutation.mutate({
      orderId,
      reason: revisionReason,
    });
  };

  // Завершение заказа
  const handleCompleteOrder = () => {
    setShowCompleteDialog(true);
  };

  const handleConfirmComplete = () => {
    if (!order) return;
    
    completeMutation.mutate({ orderId: order.id, reason: completeReason });
    setShowCompleteDialog(false);
  }

  // Отмена заказа
  const handleCancelOrder = () => {
    setShowCancelDialog(true);
  };

  const handleConfirmCancel = () => {
    cancelMutation.mutate({
      orderId,
      reason: cancelReason,
    });
  };

  // Открытие спора
  const handleOpenDispute = () => {
    setShowDisputeDialog(true);
  };

  const handleConfirmDispute = () => {
    disputeMutation.mutate({
      orderId,
      reason: disputeReason,
    });
  };

  // Обработка загрузки файлов
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files));
    }
  };

  // Возврат к списку заказов
  const goBackToOrders = () => {
    navigate('/orders');
  };

  // Переход к чату заказа
  const goToMessages = async () => {
    // Проверка orderId
    if (!orderId) {
      console.error("ID заказа отсутствует или некорректный");
      toast({
        title: "Ошибка перехода в чат",
        description: "Не указан ID заказа",
        variant: "destructive"
      });
      return;
    }
    // Приоритет отдаём access_token, затем authToken, проверяем наличие токенов в консоли
    const accessToken = localStorage.getItem('access_token');
    const authToken = localStorage.getItem('authToken');
    const token = accessToken || authToken;
    


    if (!token) {
      toast({
        title: "Ошибка авторизации",
        description: "Для перехода к чату необходимо авторизоваться",
        variant: "destructive"
      });
      navigate('/login');
      return;
    }

    // Проверяем наличие данных пользователя
    if (!user) {
      toast({
        title: "Ошибка",
        description: "Не удалось получить информацию о пользователе",
        variant: "destructive"
      });
      return;
    }

    const isCreator = user?.user_type === 'Креатор';
    
    // Если у нас нет информации о заказе
    if (!order) {
      toast({
        title: "Ошибка",
        description: "Не удалось получить информацию о заказе",
        variant: "destructive"
      });
      return;
    }
    
    try {
      // Если пользователь креатор, создаем отклик
      if (isCreator && orderId) {

        
        // Получаем тип токена из localStorage, чтобы проверить используем ли мы правильный
        const authToken = localStorage.getItem('authToken');
        const accessToken = localStorage.getItem('access_token');

        
        // Смотрим полные данные запроса для диагностики
        const requestData = {
          price: order.price,
          message: "Я заинтересован в выполнении этого заказа",
          timeframe: 7
        };

        
        const requestHeaders = { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        };

        
        try {
          // Попробуем использовать формат Bearer вместо Bearer, если возникнет 401
          const createResponse = await axios.post(
            `/api/chats/create-for-order-by-id/${orderId}/`, 
            requestData, 
            { 
              headers: {
                Authorization: `Bearer ${token}`, 
                'Content-Type': 'application/json'
              },
              validateStatus: function (status) {

                return true; // Не отклоняем запрос при 401
              }
            }
          );
          

          
          if (createResponse.status === 401) {
            console.error("Ошибка авторизации (401): Проверьте токен");
            setError("Ошибка авторизации. Пожалуйста, попробуйте выйти и войти снова.");
            return;
          }
          
          // Проверяем статус 200 или 201 для успешного создания отклика
          if (createResponse.status === 201 || createResponse.status === 200) {

            
            // Проверяем наличие chat_id в ответе (старый формат API)
            if (createResponse.data && createResponse.data.chat_id) {
              const responseClientId = createResponse.data.client_id;
              const responseCreatorId = createResponse.data.creator_id;

              navigate(`/chats/${responseCreatorId}-${responseClientId}`);
              return;
            }
            
            // Обработка нового формата ответа API - отклик создан, но нужно перенаправить в чат
            if (createResponse.data && createResponse.data.creator && order?.buyer) {
              const creatorId = createResponse.data.creator.id;
              const buyerId = order.buyer.id;

              
              toast({ 
                title: 'Отклик отправлен', 
                description: 'Ваш отклик на заказ успешно отправлен' 
              });
              
              navigate(`/chats/${creatorId}-${buyerId}`);
              return;
            }
            
            // Если нет нужных данных для перехода в чат
            toast({ 
              title: 'Отклик отправлен', 
              description: 'Ваш отклик на заказ успешно отправлен, но не удалось перейти в чат. Пожалуйста, перейдите в раздел чатов вручную.' 
            });
            navigate('/chats');
            return;
          } else {
            const errorMessage = "Не удалось создать отклик на заказ";
            toast({
              title: "Ошибка",
              description: errorMessage,
              variant: "destructive"
            });
            return;
          }
        } catch (error: unknown) {
          const axiosError = error as AxiosError;
          console.error("Ошибка при создании отклика на заказ:", error);
          
          // Если есть данные о существующем отклике в ответе
          // Проверяем, что ошибка содержит ответ с информацией о существующем отклике
          if (axiosError?.response?.data?.response) {
            const responseData = axiosError.response.data as any;
            const existingResponse = responseData.response;

            
            // Проверяем, есть ли в ответе данные чата для перехода
            if (responseData?.chat_id && responseData?.client_id && responseData?.creator_id) {

              navigate(`/chats/${responseData.creator_id}-${responseData.client_id}`);
              return;
            }
            
            // Если в response есть creator, используем эти данные
            if (existingResponse?.creator && order?.buyer) {

              navigate(`/chats/${existingResponse.creator.id}-${order.buyer.id}`);
              return;
            }
            
            // Пробуем получить существующий заказ для получения ID участников
            try {
              const orderResponse = await axios.get(`/api/orders/${existingResponse.order}/`, {
                headers: { Authorization: `Bearer ${token}` }
              });
              
              if (orderResponse.data && orderResponse.data.buyer) {
                // Используем ID текущего пользователя и ID клиента из заказа
                navigate(`/chats/${user.id}-${orderResponse.data.buyer.id}`);
                return;
              } else {
                const errorMessage = "Ошибка при получении данных заказа";
                toast({
                  title: "Ошибка",
                  description: errorMessage,
                  variant: "destructive"
                });
                return;
              }
            } catch (innerError) {
              console.error("Ошибка при получении информации о заказе:", innerError);
            }
          }
        }
      }
      
      // Если пользователь клиент
      if (user && order.buyer && user.id === order.buyer.id) {
        // Клиент обращается к своему заказу, пробуем получить чаты
        try {
          // Для клиента мы можем попробовать получить отклики на этот заказ
          const responsesResponse = await axios.get(`/api/orders/order-responses/?order=${orderId}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          

          
          if (responsesResponse.data && responsesResponse.data.length > 0) {
            // Берем первый отклик
            const firstResponse = responsesResponse.data[0];
            const creatorId = firstResponse.creator.id;
            const clientId = order.buyer.id;
            
            navigate(`/chats/${creatorId}-${clientId}`);
            return;
          } else {
            toast({
              title: "Информация",
              description: "На ваш заказ пока нет откликов от креаторов",
              variant: "default"
            });
            return;
          }
        } catch (responsesError: unknown) {
          const axiosError = responsesError as AxiosError;
          console.error("Ошибка при получении откликов:", responsesError);
        }
      }
      
      // Если мы дошли до этого места, значит нужно больше информации
      toast({
        title: "Ошибка",
        description: "Недостаточно информации для перехода в чат. Пожалуйста, попробуйте позже.",
        variant: "destructive"
      });
    } catch (error: any) {
      console.error("Ошибка при обработке заказа:", error);
      toast({
        title: "Ошибка",
        description: "Произошла ошибка при попытке перехода к чату",
        variant: "destructive"
      });
    }
  };

  // Открытие формы отзыва
  const handleOpenReviewForm = () => {
    setShowReviewForm(true);
  };
  
  /* ------------------------------ Функции проверки разрешений ------------- */
  
  // Проверяет, может ли текущий пользователь принять заказ
  const canAccept = () => {
    if (!order || !user) return false;
    
    return (
      (user as UserType).user_type === 'Креатор' && 
      order.status === 'paid' && 
      (!order.target_creator || order.target_creator.id === user.id && (user as UserType).has_creator_profile)
    );
  };
  
  // Проверяет, может ли текущий пользователь доставить заказ
  const canDeliver = () => {
    if (!order || !user) return false;
    
    return (
      (user as UserType).user_type === 'Креатор' && 
      (order.status === 'in_progress' || order.status === 'revision') && 
      order.executor?.id === user.id && (user as UserType).has_creator_profile
    );
  };
  
  // Проверяет, может ли текущий пользователь запросить доработку
  const canRequestRevision = () => {
    if (!order || !user) return false;
    
    return (
      (user as UserType).user_type === 'Клиент' && 
      order.status === 'delivered' && 
      order.buyer?.id === user.id
    );
  };
  
  // Проверяет, может ли текущий пользователь завершить заказ
  const canComplete = () => {
    if (!order || !user) return false;
    
    return (
      (user as UserType).user_type === 'Клиент' && 
      order.status === 'delivered' && 
      order.buyer?.id === user.id
    );
  };
  
  // Проверяет, может ли текущий пользователь отменить заказ
  const canCancel = () => {
    if (!order || !user) return false;
    
    return (
      // Клиент может отменить заказ в статусе "paid" или "in_progress"
      ((user as UserType).user_type === 'Клиент' && 
       order.buyer?.id === user.id && 
       ['paid', 'in_progress'].includes(order.status)) ||
      // Исполнитель может отменить заказ только в статусе "in_progress"
      ((user as UserType).user_type === 'Креатор' && 
       order.executor?.id === user.id && (user as UserType).has_creator_profile && 
       order.status === 'in_progress')
    );
  };
  
  // Проверяет, может ли текущий пользователь открыть спор
  const canDispute = () => {
    if (!order || !user) return false;
    
    return (
      // И клиент, и исполнитель могут открыть спор для заказа в работе, доставленного или на доработке
      ((user as UserType).user_type === 'Клиент' && 
       order.buyer?.id === user.id && 
       ['in_progress', 'delivered', 'revision'].includes(order.status)) ||
      ((user as UserType).user_type === 'Креатор' && 
       order.executor?.id === user.id && (user as UserType).has_creator_profile && 
       ['in_progress', 'delivered', 'revision'].includes(order.status))
    );
  };
  
  // Проверяет, может ли текущий пользователь оставить отзыв
  const canReview = () => {
    if (!order || !user) return false;
    
    return (
      (user as UserType).user_type === 'Клиент' && 
      order.status === 'completed' && 
      order.buyer?.id === user.id &&
      !order.review // Если отзыв уже оставлен, нельзя оставить еще один
    );
  };

  /* ------------------------------ Рендеринг ----------------------------- */
  
  // Если идет загрузка данных
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="w-10 h-10 animate-spin text-primary" />
          <p className="text-muted-foreground">Загрузка информации о заказе...</p>
        </div>
      </div>
    );
  }

  // Если произошла ошибка при загрузке
  if (error || !order) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="flex flex-col items-center gap-2 text-center max-w-md">
          <AlertTriangle className="w-10 h-10 text-destructive" />
          <h2 className="text-xl font-semibold">Ошибка загрузки данных</h2>
          <p className="text-muted-foreground">
            Не удалось загрузить информацию о заказе. Пожалуйста, проверьте соединение и попробуйте снова.
          </p>
          <Button className="mt-4" onClick={goBackToOrders}>
            Вернуться к списку заказов
          </Button>
        </div>
      </div>
    );
  }

  // Формируем кнопки действий для заказа в зависимости от его статуса и роли пользователя
  const orderActions = (
    <div className="flex flex-wrap gap-2">
      {canAccept() && (
        <Button 
          onClick={handleAcceptOrder}
          disabled={acceptMutation.isPending}
          className="bg-green-600 hover:bg-green-700"
        >
          {acceptMutation.isPending ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Check className="h-4 w-4 mr-2" />
          )}
          Принять заказ
        </Button>
      )}
      
      {canDeliver() && (
        <Button 
          onClick={handleDeliverOrder} 
          disabled={deliverMutation.isPending}
          className="bg-blue-600 hover:bg-blue-700"
        >
          {deliverMutation.isPending ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Send className="h-4 w-4 mr-2" />
          )}
          Доставить заказ
        </Button>
      )}
      
      {canRequestRevision() && (
        <Button 
          onClick={handleRequestRevision}
          disabled={revisionMutation.isPending}
          className="bg-amber-600 hover:bg-amber-700"
        >
          {revisionMutation.isPending ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4 mr-2" />
          )}
          Запросить доработку
        </Button>
      )}
      
      {canComplete() && (
        <Button 
          onClick={handleCompleteOrder}
          disabled={completeMutation.isPending}
          className="bg-emerald-600 hover:bg-emerald-700"
        >
          {completeMutation.isPending ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <ThumbsUp className="h-4 w-4 mr-2" />
          )}
          Завершить заказ
        </Button>
      )}
      
      {canCancel() && (
        <Button 
          onClick={handleCancelOrder}
          disabled={cancelMutation.isPending}
          variant="destructive"
        >
          {cancelMutation.isPending ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Ban className="h-4 w-4 mr-2" />
          )}
          Отменить заказ
        </Button>
      )}
      
      {canDispute() && (
        <Button 
          onClick={handleOpenDispute}
          disabled={disputeMutation.isPending}
          variant="destructive"
        >
          {disputeMutation.isPending ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <AlertTriangle className="h-4 w-4 mr-2" />
          )}
          Открыть спор
        </Button>
      )}
      
      {canReview() && (
        <Button 
          onClick={handleOpenReviewForm}
          className="bg-purple-600 hover:bg-purple-700"
        >
          <ThumbsUp className="h-4 w-4 mr-2" />
          Оставить отзыв
        </Button>
      )}
      
      <Button 
        onClick={goToMessages}
        variant="outline"
      >
        <MessageCircle className="h-4 w-4 mr-2" />
        Сообщения
      </Button>
    </div>
  );

  return (
    <>
      <OrderDetailView
        order={order}
        onViewMessages={goToMessages}
        onBackToList={goBackToOrders}
        actions={orderActions}
      />
      
      {/* Диалоги для действий с заказом */}
      
      {/* Диалог для доставки заказа */}
      <Dialog open={showDeliverDialog} onOpenChange={setShowDeliverDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Доставка заказа</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="delivery-message" className="text-sm font-medium">
                Сообщение к доставке
              </Label>
              <Textarea
                id="delivery-message"
                value={deliveryMessage}
                onChange={(e) => setDeliveryMessage(e.target.value)}
                placeholder="Опишите, что вы выполнили и какие файлы отправляете..."
                className="min-h-[100px]"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="delivery-files" className="text-sm font-medium">
                Файлы для доставки
              </Label>
              <div className="flex items-center gap-2">
                <Input
                  id="delivery-files"
                  type="file"
                  multiple
                  onChange={handleFileChange}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => document.getElementById('delivery-files')?.click()}
                  className="w-full"
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Выбрать файлы
                </Button>
              </div>
              <div className="text-sm text-muted-foreground mt-1">
                {files.length > 0 ? (
                  <div className="space-y-1">
                    <p>Выбрано файлов: {files.length}</p>
                    <ul className="text-xs space-y-1">
                      {files.slice(0, 3).map((file, index) => (
                        <li key={index} className="truncate">{file.name}</li>
                      ))}
                      {files.length > 3 && <li>и ещё {files.length - 3} файл(ов)...</li>}
                    </ul>
                  </div>
                ) : (
                  <p>Файлы не выбраны</p>
                )}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="secondary"
              onClick={() => setShowDeliverDialog(false)}
            >
              Отмена
            </Button>
            <Button 
              onClick={handleConfirmDeliver}
              disabled={!deliveryMessage || files.length === 0 || deliverMutation.isPending}
            >
              {deliverMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Отправить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Диалог для запроса доработки */}
      <Dialog open={showRevisionDialog} onOpenChange={setShowRevisionDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Запрос доработки</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="revision-reason" className="text-sm font-medium">
                Что нужно исправить или доработать?
              </Label>
              <Textarea
                id="revision-reason"
                value={revisionReason}
                onChange={(e) => setRevisionReason(e.target.value)}
                placeholder="Опишите подробно, что нужно исправить в заказе..."
                className="min-h-[120px]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="secondary"
              onClick={() => setShowRevisionDialog(false)}
            >
              Отмена
            </Button>
            <Button 
              onClick={handleConfirmRevision}
              disabled={!revisionReason || revisionMutation.isPending}
            >
              {revisionMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Запросить доработку
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Диалог для завершения заказа */}
      <Dialog open={showCompleteDialog} onOpenChange={setShowCompleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Завершение заказа</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="complete-reason" className="text-sm font-medium">
                Отзыв о работе (необязательно)
              </Label>
              <Textarea
                id="complete-reason"
                value={completeReason}
                onChange={(e) => setCompleteReason(e.target.value)}
                placeholder="Оставьте отзыв о выполненной работе..."
                className="min-h-[100px]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="secondary"
              onClick={() => setShowCompleteDialog(false)}
            >
              Отмена
            </Button>
            <Button 
              onClick={handleConfirmComplete}
              disabled={completeMutation.isPending}
            >
              {completeMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Завершить заказ
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Диалог для отмены заказа */}
      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Отмена заказа</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="cancel-reason" className="text-sm font-medium">
                Причина отмены
              </Label>
              <Textarea
                id="cancel-reason"
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Укажите причину отмены заказа..."
                className="min-h-[100px]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="secondary"
              onClick={() => setShowCancelDialog(false)}
            >
              Отменить
            </Button>
            <Button 
              variant="destructive"
              onClick={handleConfirmCancel}
              disabled={!cancelReason || cancelMutation.isPending}
            >
              {cancelMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Отменить заказ
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Диалог для открытия спора */}
      <Dialog open={showDisputeDialog} onOpenChange={setShowDisputeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Открытие спора</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="dispute-reason" className="text-sm font-medium">
                Причина спора
              </Label>
              <Textarea
                id="dispute-reason"
                value={disputeReason}
                onChange={(e) => setDisputeReason(e.target.value)}
                placeholder="Подробно опишите причину спора и чем вы недовольны..."
                className="min-h-[150px]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="secondary"
              onClick={() => setShowDisputeDialog(false)}
            >
              Отмена
            </Button>
            <Button 
              variant="destructive"
              onClick={handleConfirmDispute}
              disabled={!disputeReason || disputeMutation.isPending}
            >
              {disputeMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Открыть спор
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default OrderDetailPage;
