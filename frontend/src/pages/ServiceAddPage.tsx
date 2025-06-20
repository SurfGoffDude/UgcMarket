import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import apiClient from '@/api/client';
import { Loader2 } from 'lucide-react';

/**
 * Схема валидации формы добавления услуги
 */
const formSchema = z.object({
  title: z.string().min(5, "Минимум 5 символов").max(200, "Максимум 200 символов"),
  description: z.string().min(10, "Минимум 10 символов").max(5000, "Максимум 5000 символов"),
  price: z.string()
    .min(1, "Введите стоимость услуги")
    .refine(val => !isNaN(parseFloat(val)) && parseFloat(val) >= 0, {
      message: "Стоимость должна быть положительным числом",
    }),
  is_active: z.boolean().default(true),
});

/**
 * Определяем тип данных формы на основе схемы
 */
type FormData = z.infer<typeof formSchema>;

/**
 * Страница добавления услуги в профиль креатора
 */
const ServiceAddPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [creatorId, setCreatorId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  /**
   * Инициализация формы с настройкой валидации
   */
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      description: '',
      price: '',
      is_active: true,
    },
  });

  /**
   * Загружаем ID профиля креатора при монтировании компонента
   */
  useEffect(() => {
    const fetchData = async () => {
      if (!user?.id) return;
      
      setIsLoading(true);
      try {
        // Получаем ID профиля креатора текущего пользователя
        const creatorRes = await apiClient.get(`/creator-profiles/?user=${user.id}`);
        const creatorData = Array.isArray(creatorRes.data.results) 
          ? creatorRes.data.results[0] 
          : creatorRes.data;
        
        if (creatorData) {
          setCreatorId(creatorData.id);
        } else {
          toast({
            title: 'Ошибка',
            description: 'Профиль креатора не найден. Сначала создайте профиль креатора.',
            variant: 'destructive',
          });
          navigate('/profile/edit');
        }
      } catch (err) {
        console.error('Ошибка при загрузке данных:', err);
        toast({
          title: 'Ошибка',
          description: 'Не удалось загрузить необходимые данные',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [user?.id, navigate]);

  /**
   * Обработчик отправки формы
   */
  const onSubmit = async (data: FormData) => {
    if (!creatorId) {
      toast({
        title: 'Ошибка',
        description: 'Не найден профиль креатора',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      // Преобразуем данные формы для отправки на сервер
      const serviceData = {
        creator_profile: creatorId,
        title: data.title,
        description: data.description,
        price: parseFloat(data.price),
        is_active: data.is_active
      };

      // Создаем новую услугу
      await apiClient.post('/services/', serviceData);

      toast({
        title: 'Успешно',
        description: 'Услуга успешно добавлена',
      });

      // Возвращаемся на страницу профиля
      navigate(-1);
    } catch (err: any) {
      console.error('Ошибка при сохранении услуги:', err);
      toast({
        title: 'Ошибка',
        description: err?.response?.data?.detail || 'Не удалось добавить услугу',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto py-12 max-w-xl">
      <div className="flex items-center mb-6">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-2xl font-semibold ml-4">Добавление услуги</h1>
      </div>

      {isLoading ? (
        <div className="flex justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
        </div>
      ) : (
        <Card>
          <CardContent className="pt-6">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Название услуги</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Введите название услуги" />
                      </FormControl>
                      <FormDescription>
                        Короткое и понятное название услуги
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Описание услуги</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          placeholder="Подробно опишите, что включает в себя ваша услуга"
                          className="min-h-[150px]"
                        />
                      </FormControl>
                      <FormDescription>
                        Подробное описание услуги, условия выполнения, сроки и т.д.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Стоимость услуги (₽)</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          type="number" 
                          placeholder="0.00" 
                          min="0" 
                          step="0.01" 
                        />
                      </FormControl>
                      <FormDescription>
                        Укажите стоимость в рублях
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="is_active"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>
                          Услуга активна и доступна для заказа
                        </FormLabel>
                        <FormDescription>
                          Снимите галочку, если хотите временно скрыть услугу
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />

                <Button 
                  type="submit" 
                  disabled={isSubmitting || isLoading}
                  className="w-full"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Сохранение...
                    </>
                  ) : 'Добавить услугу'}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ServiceAddPage;