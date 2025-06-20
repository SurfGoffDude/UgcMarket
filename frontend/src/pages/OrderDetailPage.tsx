/**
 * Страница детального просмотра заказа
 *
 * Отображает полную информацию о заказе, статус, историю изменений,
 * доставленные файлы и позволяет выполнять действия в зависимости от статуса.
 * Поддерживает все этапы жизненного цикла заказа: принятие, доставку,
 * завершение и запрос доработки.
 */

import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// UI-компоненты
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/components/ui/use-toast';

// Иконки
import {
  AlertCircle,
  Clock,
  Calendar,
  FileText,
  MessageSquare,
  CheckCircle,
  Play,
  RotateCcw,
  Upload,
  X,
} from 'lucide-react';

import api from '@/lib/api';
import { useApiContext } from '@/contexts/ApiContext';
import { OrderDelivery, TimelineEvent } from '@/types/orders';
import ReviewForm from '@/components/ReviewForm';
import { Review } from '@/types/review';
import ReviewCard from '@/components/ReviewCard';

/* -------------------------------------------------------------------------- */
/* Вспомогательные UI-компоненты                                              */
/* -------------------------------------------------------------------------- */

const OrderStatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const statusMap: Record<
    string,
    { label: string; variant: 'default' | 'outline' | 'secondary' | 'destructive' }
  > = {
    pending: { label: 'Ожидает оплаты', variant: 'outline' },
    paid: { label: 'Оплачен', variant: 'secondary' },
    in_progress: { label: 'В работе', variant: 'default' },
    delivered: { label: 'Выполнен', variant: 'secondary' },
    completed: { label: 'Завершен', variant: 'default' },
    cancelled: { label: 'Отменен', variant: 'destructive' },
    disputed: { label: 'Спор', variant: 'destructive' },
  };

  const { label, variant } = statusMap[status] || { label: status, variant: 'outline' };

  return <Badge variant={variant}>{label}</Badge>;
};

const OrderTimeline: React.FC<{ events: TimelineEvent[] }> = ({ events }) => (
  <div className="relative space-y-8 before:absolute before:left-[15px] before:h-full before:w-0.5 before:bg-gray-200">
    {events.map((event, idx) => (
      <div key={idx} className="relative flex items-start space-x-3">
        <div className="flex h-7 w-7 items-center justify-center rounded-full">
          {event.status === 'completed' ? (
            <CheckCircle className="h-7 w-7 text-green-500" />
          ) : event.status === 'current' ? (
            <div className="h-3.5 w-3.5 rounded-full bg-primary" />
          ) : (
            <div className="h-3.5 w-3.5 rounded-full border-2 border-gray-300" />
          )}
        </div>
        <div>
          <p className="text-sm font-medium">{event.description}</p>
          <time className="block text-xs text-muted-foreground">
            {new Date(event.timestamp).toLocaleString('ru-RU')}
          </time>
          {event.additional_info && (
            <p className="mt-2 text-sm text-muted-foreground">{event.additional_info}</p>
          )}
        </div>
      </div>
    ))}
  </div>
);

const DeliveryFiles: React.FC<{ deliveries: OrderDelivery[] }> = ({ deliveries }) => {
  if (!deliveries?.length) {
    return (
      <div className="p-8 text-center">
        <FileText className="mx-auto mb-2 h-12 w-12 text-muted-foreground" />
        <p className="text-muted-foreground">Пока нет доставленных файлов</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {deliveries.map((delivery) => (
        <div key={delivery.id} className="rounded-lg bg-muted p-4">
          <div className="mb-3 flex items-start justify-between">
            <div>
              <p className="text-sm font-medium">
                Доставлено: {new Date(delivery.created_at).toLocaleString('ru-RU')}
              </p>
              <p className="text-sm text-muted-foreground">От: {delivery.created_by.full_name}</p>
            </div>
          </div>

          {delivery.message && <p className="mb-4 text-sm">{delivery.message}</p>}

          <div className="grid gap-2 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {delivery.files.map((file) => (
              <div key={file.id} className="flex items-center rounded-md border p-2">
                <FileText className="mr-2 h-4 w-4" />
                <div className="overflow-hidden">
                  <a
                    href={file.file}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block truncate text-sm font-medium hover:underline"
                  >
                    {file.name}
                  </a>
                  <p className="text-xs text-muted-foreground">
                    {(file.size / 1024).toFixed(1)} КБ
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/* Основной компонент                                                         */
/* -------------------------------------------------------------------------- */

const OrderDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useApiContext();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const orderId = Number(id);

  /* UI-состояния */
  const [activeTab, setActiveTab] = useState<'details' | 'files' | 'history' | 'review'>('details');
  const [revisionReason, setRevisionReason] = useState('');
  const [completeReason, setCompleteReason] = useState('');
  const [cancelReason, setCancelReason] = useState('');
  const [disputeReason, setDisputeReason] = useState('');
  const [showRevisionDialog, setShowRevisionDialog] = useState(false);
  const [showCompleteDialog, setShowCompleteDialog] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [showDisputeDialog, setShowDisputeDialog] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);

  /* ------------------------------ Загрузка данных -------------------------- */
  const {
    data: order,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['order', id],
    queryFn: () => api.getOrder(orderId),
    enabled: !!id && isAuthenticated,
  });

  /* ------------------------------ Мутации ---------------------------------- */
  const acceptMutation = useMutation({
    mutationFn: (orderId: number) => api.acceptOrder(orderId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['order', id] });
      toast({ title: 'Заказ принят в работу', description: 'Вы можете начать выполнение заказа.' });
    },
    onError: (e: any) =>
      toast({
        title: 'Ошибка принятия заказа',
        description: e?.message ?? 'Произошла ошибка при принятии заказа',
        variant: 'destructive',
      }),
  });

  const revisionMutation = useMutation({
    mutationFn: (vars: { orderId: number; reason: string }) =>
      api.requestRevision(vars.orderId, vars.reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['order', id] });
      setShowRevisionDialog(false);
      setRevisionReason('');
      toast({
        title: 'Запрос на доработку отправлен',
        description: 'Исполнитель получит уведомление о необходимости внести правки.',
      });
    },
    onError: (e: any) =>
      toast({
        title: 'Ошибка запроса на доработку',
        description: e?.message ?? 'Произошла ошибка при запросе доработки',
        variant: 'destructive',
      }),
  });

  const completeMutation = useMutation({
    mutationFn: (vars: { orderId: number; reason?: string }) =>
      api.completeOrder(vars.orderId, vars.reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['order', id] });
      setShowCompleteDialog(false);
      setCompleteReason('');
      toast({
        title: 'Заказ успешно завершен',
        description: 'Благодарим за использование нашего сервиса!',
      });
    },
    onError: (e: any) =>
      toast({
        title: 'Ошибка завершения заказа',
        description: e?.message ?? 'Произошла ошибка при завершении заказа',
        variant: 'destructive',
      }),
  });

  const cancelMutation = useMutation({
    mutationFn: (vars: { orderId: number; reason: string }) =>
      api.cancelOrder(vars.orderId, vars.reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['order', id] });
      setShowCancelDialog(false);
      setCancelReason('');
      toast({
        title: 'Заказ успешно отменен',
        description: 'Заказ был отменен. При необходимости вы можете связаться со службой поддержки.',
      });
    },
    onError: (e: any) =>
      toast({
        title: 'Ошибка при отмене заказа',
        description: e?.message ?? 'Произошла ошибка при отмене заказа',
        variant: 'destructive',
      }),
  });

  const disputeMutation = useMutation({
    mutationFn: (vars: { orderId: number; reason: string }) =>
      api.openDispute(vars.orderId, vars.reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['order', id] });
      setShowDisputeDialog(false);
      setDisputeReason('');
      toast({
        title: 'Спор открыт',
        description: 'Ваш спор открыт. Служба поддержки свяжется с вами в ближайшее время.',
      });
    },
    onError: (e: any) =>
      toast({
        title: 'Ошибка при открытии спора',
        description: e?.message ?? 'Произошла ошибка при открытии спора',
        variant: 'destructive',
      }),
  });

  /* ------------------------------ Обработчики ------------------------------ */
  const handleAcceptOrder = () => order && acceptMutation.mutate(order.id);

  const handleRequestRevision = () => {
    if (!order) return;
    if (!revisionReason.trim()) {
      toast({
        title: 'Необходимо указать причину',
        description: 'Пожалуйста, опишите причину запроса на доработку',
      });
      return;
    }
    revisionMutation.mutate({ orderId: order.id, reason: revisionReason.trim() });
  };

  const handleCompleteOrder = () =>
    order && completeMutation.mutate({ orderId: order.id, reason: completeReason.trim() || undefined });

  const handleCancelOrder = () => {
    if (!order) return;
    if (!cancelReason.trim()) {
      toast({
        title: 'Необходимо указать причину',
        description: 'Пожалуйста, опишите причину отмены заказа',
      });
      return;
    }
    cancelMutation.mutate({ orderId: order.id, reason: cancelReason.trim() });
  };

  const handleOpenDispute = () => {
    if (!order) return;
    if (!disputeReason.trim()) {
      toast({
        title: 'Необходимо указать причину',
        description: 'Пожалуйста, опишите причину открытия спора',
      });
      return;
    }
    disputeMutation.mutate({ orderId: order.id, reason: disputeReason.trim() });
  };

  /* ------------------------------ Доступные действия ----------------------- */
  const getOrderActions = () => {
    if (!order || !user) return [];
    const isCreator = user.id === order.service.creator.user.id;
    const isClient = user.id === order.buyer.id;

    const actions: { label: string; icon: React.ReactNode; onClick: () => void }[] = [];

    if (isClient) {
      // Действия для клиента в зависимости от статуса заказа
      if (order.status === 'pending') {
        actions.push({
          label: 'Оплатить',
          icon: <CheckCircle className="mr-2 h-4 w-4" />,
          onClick: () => navigate(`/orders/${order.id}/payment`),
        });

        // Возможность отмены заказа в статусе "ожидает оплаты"
        actions.push({
          label: 'Отменить заказ',
          icon: <X className="mr-2 h-4 w-4" />,
          onClick: () => setShowCancelDialog(true),
        });
      }

      if (order.status === 'delivered') {
        actions.push({
          label: 'Принять работу',
          icon: <CheckCircle className="mr-2 h-4 w-4" />,
          onClick: () => setShowCompleteDialog(true),
        });
        actions.push({
          label: 'Запросить доработку',
          icon: <RotateCcw className="mr-2 h-4 w-4" />,
          onClick: () => setShowRevisionDialog(true),
        });
      }

      // Возможность открыть спор для клиента для ряда статусов
      if (['paid', 'in_progress', 'delivered'].includes(order.status)) {
        actions.push({
          label: 'Открыть спор',
          icon: <AlertCircle className="mr-2 h-4 w-4" />,
          onClick: () => setShowDisputeDialog(true),
        });
      }
    }

    if (isCreator) {
      if (order.status === 'paid') {
        actions.push({
          label: 'Принять заказ',
          icon: <Play className="mr-2 h-4 w-4" />,
          onClick: handleAcceptOrder,
        });
      }
      if (order.status === 'in_progress') {
        actions.push({
          label: 'Доставить результат',
          icon: <Upload className="mr-2 h-4 w-4" />,
          onClick: () => navigate(`/orders/${order.id}/delivery`),
        });
      }
    }

    /* Общая кнопка чата */
    actions.push({
      label: 'Сообщения',
      icon: <MessageSquare className="mr-2 h-4 w-4" />,
      onClick: () => navigate(`/messages?order=${order.id}`),
    });

    return actions;
  };

  /* ------------------------------ Скелетон / ошибка ------------------------ */
  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="p-6">
          <div className="space-y-4">
            <Skeleton className="h-8 w-1/3" />
            <Skeleton className="h-6 w-1/4" />
            <Separator />
            <div className="grid gap-4 md:grid-cols-2">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-4 w-full" />
              ))}
            </div>
          </div>
        </Card>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="p-6 text-center">
          <h2 className="mb-2 text-xl font-semibold">
            {error ? 'Ошибка при загрузке заказа' : 'Заказ не найден'}
          </h2>
          <p className="mb-4 text-muted-foreground">
            {error instanceof Error ? error.message : 'Не удалось найти запрашиваемый заказ'}
          </p>
          <Button onClick={() => navigate('/orders')}>Вернуться к заказам</Button>
        </Card>
      </div>
    );
  }

  /* ------------------------------ Основной рендер -------------------------- */
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Хедер */}
      <header className="mb-6 flex flex-col justify-between lg:flex-row">
        <div>
          <div className="mb-2 flex items-center gap-3">
            <h1 className="text-2xl font-bold">Заказ #{order.id}</h1>
            <OrderStatusBadge status={order.status} />
          </div>
          <h2 className="mb-2 text-xl font-medium">{order.service.title}</h2>
          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
            <span className="flex items-center">
              <Calendar className="mr-1 h-4 w-4" />
              Создан:{' '}
              {new Date(order.created_at).toLocaleDateString('ru-RU', { dateStyle: 'medium' })}
            </span>
            <span className="flex items-center">
              <Clock className="mr-1 h-4 w-4" />
              Срок:{' '}
              {new Date(order.delivery_date).toLocaleDateString('ru-RU', { dateStyle: 'medium' })}
            </span>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2 lg:mt-0">
          {getOrderActions().map((a) => (
            <Button key={a.label} variant="outline" onClick={a.onClick}>
              {a.icon}
              {a.label}
            </Button>
          ))}
        </div>
      </header>

      {/* Контент */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Детали заказа / файлы / история */}
        <Card className="p-6 lg:col-span-2">
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
            <TabsList className="mb-4">
              <TabsTrigger value="details">Детали</TabsTrigger>
              <TabsTrigger value="files">Файлы {order.deliveries?.length > 0 ? `(${order.deliveries.length})` : ''}</TabsTrigger>
              <TabsTrigger value="history">История</TabsTrigger>
              {(order.status === 'completed' || order.review) && (
                <TabsTrigger value="review">Отзыв</TabsTrigger>
              )}
            </TabsList>

            <TabsContent value="details" className="space-y-4">
              <div>
                <h3 className="mb-2 font-medium">Сервис:</h3>
                <Link to={`/services/${order.service.slug}`} className="text-primary hover:underline">
                  {order.service.title}
                </Link>
                <p className="mt-1 text-sm text-muted-foreground">
                  Категория: {order.service.category.name}
                </p>
              </div>

              <Separator />

              <div>
                <h3 className="mb-2 font-medium">Требования к заказу:</h3>
                <p className="text-sm">{order.requirements}</p>
              </div>

              <Separator />

              <div>
                <h3 className="mb-2 font-medium">Выбранные опции:</h3>
                {order.selected_options?.length ? (
                  <ul className="list-inside list-disc text-sm">
                    {order.selected_options.map((o) => (
                      <li key={o.id}>
                        {o.name} — {o.price} ₽
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-muted-foreground">Дополнительные опции не выбраны</p>
                )}
              </div>

              <Separator />

              <div>
                <h3 className="font-medium">Стоимость:</h3>
                <div className="flex flex-col text-sm">
                  <span>Базовая цена: {order.price} ₽</span>
                  {order.selected_options?.length > 0 && (
                    <span>
                      Опции:{' '}
                      {order.selected_options.reduce((s, o) => s + o.price, 0)}
                      ₽
                    </span>
                  )}
                  <span className="mt-1 font-medium">Итого: {order.total_price} ₽</span>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="files">
              <DeliveryFiles deliveries={order.deliveries || []} />
            </TabsContent>

            <TabsContent value="history">
              <OrderTimeline events={order.timeline_events || []} />
            </TabsContent>

            <TabsContent value="review">
              <Card className="p-4">
                <h3 className="text-lg font-medium mb-4">Отзыв о заказе</h3>

                {order.review ? (
                  // Отображение существующего отзыва
                  <ReviewCard review={order.review as Review} />
                ) : (
                  // Отображение формы для создания отзыва
                  <div>
                    {showReviewForm ? (
                      <ReviewForm
                        orderId={orderId}
                        onSuccess={() => {
                          setShowReviewForm(false);
                          queryClient.invalidateQueries({ queryKey: ['order', orderId] });
                        }}
                      />
                    ) : (
                      <div className="text-center py-6">
                        <p className="text-gray-600 mb-4">
                          Заказ успешно завершен! Поделитесь вашими впечатлениями о выполненной работе и помогите другим клиентам.
                        </p>
                        <Button onClick={() => setShowReviewForm(true)}>
                          Оставить отзыв
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </Card>
            </TabsContent>
          </Tabs>
        </Card>

        {/* Боковая панель */}
        <Card className="p-6">
          <h3 className="mb-4 font-medium">Информация о участниках</h3>

          {/* Исполнитель */}
          <section className="mb-6">
            <h4 className="mb-2 text-sm font-medium text-muted-foreground">Исполнитель:</h4>
            <div className="flex items-center">
              <div className="mr-3 flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                {order.service.creator.user.avatar ? (
                  <img
                    src={order.service.creator.user.avatar}
                    alt={order.service.creator.user.full_name}
                    className="h-10 w-10 rounded-full object-cover"
                  />
                ) : (
                  <span className="font-medium">
                    {order.service.creator.user.first_name[0]}
                    {order.service.creator.user.last_name[0]}
                  </span>
                )}
              </div>
              <div>
                <Link
                  to={`/creators/${order.service.creator.id}`}
                  className="font-medium hover:underline"
                >
                  {order.service.creator.user.full_name}
                </Link>
                <p className="text-xs text-muted-foreground">
                  {order.service.creator.specialization}
                </p>
              </div>
            </div>
          </section>

          {/* Заказчик */}
          <section>
            <h4 className="mb-2 text-sm font-medium text-muted-foreground">Заказчик:</h4>
            <div className="flex items-center">
              <div className="mr-3 flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                {order.buyer.avatar ? (
                  <img
                    src={order.buyer.avatar}
                    alt={order.buyer.full_name}
                    className="h-10 w-10 rounded-full object-cover"
                  />
                ) : (
                  <span className="font-medium">
                    {order.buyer.first_name[0]}
                    {order.buyer.last_name[0]}
                  </span>
                )}
              </div>
              <div>
                <p className="font-medium">{order.buyer.full_name}</p>
                <p className="text-xs text-muted-foreground">Клиент</p>
              </div>
            </div>
          </section>

          <Separator className="my-6" />

          <Button
            variant="outline"
            className="w-full"
            onClick={() => navigate(`/messages?order=${order.id}`)}
          >
            <MessageSquare className="mr-2 h-4 w-4" /> Перейти в чат
          </Button>
        </Card>
      </div>

      {/* Диалог: запрос доработки */}
      <AlertDialog open={showRevisionDialog} onOpenChange={setShowRevisionDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Запрос доработки</AlertDialogTitle>
            <AlertDialogDescription>
              Укажите, что необходимо доработать в заказе. Эта информация будет передана
              исполнителю.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Textarea
            value={revisionReason}
            onChange={(e) => setRevisionReason(e.target.value)}
            placeholder="Опишите детали, которые требуют доработки…"
            className="mb-4 min-h-[120px]"
          />
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRequestRevision}
              disabled={!revisionReason.trim() || revisionMutation.isPending}
            >
              {revisionMutation.isPending ? 'Отправка…' : 'Отправить запрос'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Диалог: завершение заказа */}
      <AlertDialog open={showCompleteDialog} onOpenChange={setShowCompleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Завершение заказа</AlertDialogTitle>
            <AlertDialogDescription>
              Завершение заказа означает, что вы полностью удовлетворены результатом.
              Вы можете оставить отзыв об исполнителе при желании.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Textarea
            value={completeReason}
            onChange={(e) => setCompleteReason(e.target.value)}
            placeholder="Отзыв о работе (необязательно)…"
            className="min-h-[100px] mb-4"
          />
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction onClick={handleCompleteOrder} disabled={completeMutation.isPending}>
              {completeMutation.isPending ? 'Завершение…' : 'Завершить заказ'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Диалоговое окно для отмены заказа */}
      <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Отмена заказа</AlertDialogTitle>
            <AlertDialogDescription>
              Вы уверены, что хотите отменить заказ?
              Это действие нельзя будет отменить. Пожалуйста, укажите причину отмены.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Textarea
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
            placeholder="Причина отмены заказа..."
            className="min-h-[100px] mb-4"
          />
          <AlertDialogFooter>
            <AlertDialogCancel>Вернуться к заказу</AlertDialogCancel>
            <AlertDialogAction onClick={handleCancelOrder} disabled={cancelMutation.isPending}>
              {cancelMutation.isPending ? 'Отмена заказа...' : 'Отменить заказ'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Диалоговое окно для открытия спора */}
      <AlertDialog open={showDisputeDialog} onOpenChange={setShowDisputeDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Открытие спора</AlertDialogTitle>
            <AlertDialogDescription>
              Спор открывается в случае серьезных разногласий между клиентом и исполнителем.
              Пожалуйста, подробно опишите проблему, чтобы служба поддержки могла помочь вам разрешить её.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Textarea
            value={disputeReason}
            onChange={(e) => setDisputeReason(e.target.value)}
            placeholder="Подробно опишите причину спора..."
            className="min-h-[150px] mb-4"
          />
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction onClick={handleOpenDispute} disabled={disputeMutation.isPending}>
              {disputeMutation.isPending ? 'Открытие спора...' : 'Открыть спор'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default OrderDetailPage;
