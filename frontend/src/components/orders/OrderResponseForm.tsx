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
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import {
  User,
  Package,
  DollarSign,
  Clock,
  AlertCircle,
  Loader2,
  Tag,
  CheckCircle,
} from 'lucide-react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import axios from 'axios';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { useAuth } from '@/contexts/AuthContext';

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
  client: {
    id: number;
    username: string;
    avatar?: string;
  };
  tags: string[];
  is_private: boolean;
}

/**
 * Схема валидации формы отклика
 */
const responseFormSchema = z.object({
  message: z.string()
    .min(10, { message: "Сообщение должно содержать минимум 10 символов" })
    .max(2000, { message: "Сообщение не должно превышать 2000 символов" }),
  priceOffer: z.string()
    .refine(val => !val || !isNaN(Number(val)), { message: "Цена должна быть числом" })
    .transform(val => val ? Number(val) : null)
    .optional(),
  deliveryTimeOffer: z.string()
    .refine(val => !val || !isNaN(Number(val)), { message: "Срок должен быть числом" })
    .transform(val => val ? Number(val) : null)
    .optional(),
});

type ResponseFormValues = z.infer<typeof responseFormSchema>;

/**
 * Компонент формы отклика на заказ
 */
const OrderResponseForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [success, setSuccess] = useState<boolean>(false);
  const [alreadyResponded, setAlreadyResponded] = useState<boolean>(false);

  // Определение формы с валидацией
  const form = useForm<ResponseFormValues>({
    resolver: zodResolver(responseFormSchema),
    defaultValues: {
      message: '',
      priceOffer: 0,
      deliveryTimeOffer: 0,
    },
  });

  // Получаем данные заказа и проверяем возможность отклика
  useEffect(() => {
    const fetchOrderDetails = async () => {
      if (!id) return;

      setLoading(true);
      try {
        // Получаем информацию о заказе
        const orderResponse = await axios.get(`/api/orders/${id}/`);
        setOrder(orderResponse.data);

        // Проверяем, откликался ли уже креатор на этот заказ
        const responsesResponse = await axios.get('/api/order-responses/', {
          params: { order_id: id, creator_id: user?.id }
        });

        if (responsesResponse.data.results && responsesResponse.data.results.length > 0) {
          setAlreadyResponded(true);
        }

        setError(null);
      } catch (err) {

        setError('Не удалось загрузить информацию о заказе');
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchOrderDetails();
    } else {
      setError('Необходимо авторизоваться, чтобы откликнуться на заказ');
    }
  }, [id, user]);

  // Функция для отправки отклика
  const onSubmit = async (values: ResponseFormValues) => {
    if (!order || !user) return;

    setSubmitting(true);
    try {
      await axios.post('/api/order-responses/', {
        order: order.id,
        message: values.message,
        price_offer: values.priceOffer,
        delivery_time_offer: values.deliveryTimeOffer,
      });

      setSuccess(true);
      setSubmitting(false);
      // Задержка перед редиректом, чтобы пользователь увидел сообщение об успехе
      setTimeout(() => {
        navigate(`/orders/${id}`);
      }, 2000);
    } catch (err) {

      setError('Произошла ошибка при отправке отклика. Пожалуйста, попробуйте еще раз.');
      setSubmitting(false);
    }
  };

  // Отображаем скелет загрузки
  if (loading) {
    return (
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-3/4" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-40 w-full mb-6" />
            <Skeleton className="h-20 w-full mb-4" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          </CardContent>
          <CardFooter>
            <Skeleton className="h-10 w-32" />
          </CardFooter>
        </Card>
      </div>
    );
  }

  // Отображаем сообщение об ошибке
  if (error) {
    return (
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Ошибка</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
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

  // Отображаем сообщение об успехе
  if (success) {
    return (
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        <Alert className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
          <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
          <AlertTitle>Отклик отправлен успешно!</AlertTitle>
          <AlertDescription>
            Ваш отклик был отправлен клиенту. Вы будете перенаправлены на страницу заказа.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Проверяем, откликался ли уже пользователь на этот заказ
  if (alreadyResponded) {
    return (
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Вы уже откликнулись на этот заказ</AlertTitle>
          <AlertDescription>
            Вы уже оставили отклик на этот заказ. Вы можете просмотреть свой отклик на странице заказа.
          </AlertDescription>
        </Alert>
        <div className="flex justify-center mt-6">
          <Button onClick={() => navigate(`/orders/${id}`)}>
            Перейти к заказу
          </Button>
        </div>
      </div>
    );
  }

  // Основной рендеринг формы отклика
  return (
    <div className="container mx-auto px-4 py-6 max-w-4xl">
      {order && (
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Откликнуться на заказ</CardTitle>
            <CardDescription>
              Оставьте свое предложение для заказа: {order.title}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-md">
              <h3 className="text-lg font-medium mb-2">Информация о заказе</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500 flex items-center">
                    <User size={16} className="mr-1" />
                    Клиент: {order.client.username}
                  </p>
                  <p className="text-sm text-gray-500 flex items-center mt-1">
                    <DollarSign size={16} className="mr-1" />
                    Бюджет: {order.budget} ₽
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 flex items-center">
                    <Clock size={16} className="mr-1" />
                    Срок выполнения: {order.delivery_time || 'Не указан'} дней
                  </p>
                  <p className="text-sm text-gray-500 flex items-center mt-1">
                    <Tag size={16} className="mr-1" />
                    Теги: {order.tags.length > 0 
                      ? order.tags.map((tag, index) => (
                          <Badge key={index} variant="outline" className="ml-1">{tag}</Badge>
                        ))
                      : 'Не указаны'}
                  </p>
                </div>
              </div>
            </div>

            <Separator />

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="message"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Сообщение клиенту</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Опишите ваш опыт и почему вы подходите для этого заказа..."
                          className="min-h-32"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="priceOffer"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Предложение по цене (₽)</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <DollarSign className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                            <Input 
                              placeholder="Укажите вашу цену"
                              className="pl-10"
                              type="number"
                              {...field} 
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                        <p className="text-xs text-gray-500 mt-1">
                          Бюджет клиента: {order.budget} ₽
                        </p>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="deliveryTimeOffer"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Предложение по сроку (дни)</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Clock className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                            <Input 
                              placeholder="Укажите срок в днях"
                              className="pl-10"
                              type="number"
                              {...field} 
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                        <p className="text-xs text-gray-500 mt-1">
                          Срок клиента: {order.delivery_time || 'Не указан'} дней
                        </p>
                      </FormItem>
                    )}
                  />
                </div>

                <div className="flex gap-3">
                  <Button type="submit" disabled={submitting}>
                    {submitting ? (
                      <>
                        <Loader2 className="animate-spin h-4 w-4 mr-2" />
                        Отправка...
                      </>
                    ) : (
                      'Отправить отклик'
                    )}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => navigate(-1)}>
                    Отмена
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default OrderResponseForm;