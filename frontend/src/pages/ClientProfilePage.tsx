import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  User as UserIcon,
  Mail,
  Phone,
  MapPin,
  Edit,
  Save,
  X,
  Loader2,
  AlertCircle,
  Clock,
  FileText,
  PlusCircle,
  Heart
} from 'lucide-react';

// Импортируем наш тип пользователя
import { User } from '@/types/user';

import { useAuth } from '@/contexts/AuthContext';
import { useClientProfile } from '@/hooks/useApi';
import { useFavorites } from '@/hooks/useFavorites';
import apiClient from '@/api/client';
import CreatorCard from '@/components/CreatorCard';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { toast } from '@/components/ui/use-toast';
import { Skeleton } from '@/components/ui/skeleton';

/**
 * Интерфейс пользовательского профиля
 */
interface UserProfile {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  full_name: string;
  avatar: string | null;
  phone: string;
  bio: string;
  is_verified: boolean;
  user_type: string;
  location?: string;
}

/**
 * Интерфейс заказа
 */
interface Order {
  id: number;
  title: string;
  description: string;
  budget: number;
  deadline: string;
  status: string;
  created_at: string;
  updated_at: string;
  tags?: Array<{id: number, name: string}>;
}

/**
 * Схема валидации формы профиля
 */
const profileFormSchema = z.object({
  first_name: z.string().min(2, { message: 'Имя должно содержать минимум 2 символа' }),
  last_name: z.string().min(2, { message: 'Фамилия должна содержать минимум 2 символа' }),
  phone: z.string().optional(),
  bio: z.string().optional(),
  location: z.string().optional()
});

/**
 * Тип для данных формы профиля
 */
type ProfileFormValues = z.infer<typeof profileFormSchema>;

/**
 * Компонент страницы профиля клиента
 */
const ClientProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const { user, updateUser, isAuthenticated } = useAuth();
  
  // Используем новый хук для получения данных профиля клиента
  const { client, loading: isClientLoading, error: clientError, reload: reloadClient } = useClientProfile();
  
  // Хук для работы с избранными креаторами
  const { favorites, loading: favoritesLoading, error: favoritesError } = useFavorites();
  
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState<boolean>(false);
  const [orderError, setOrderError] = useState<Error | null>(null);
  
  // Проверяем тип пользователя и перенаправляем креаторов на их профиль
  useEffect(() => {
    if (user) {
      // Добавляем отладочный вывод данных пользователя
      
      // Если пользователь является креатором, перенаправляем на страницу профиля креатора
      const isCreator = user && 
        (user as any)?.has_creator_profile === true;
      
      
      if (isCreator) {
        navigate('/creator-profile');
      }
    } else {
    }
  }, [user, navigate]);
  
  // Загрузка заказов пользователя
  useEffect(() => {
    const fetchUserOrders = async () => {
      if (!user) return;
      
      try {
        setLoadingOrders(true);
        setOrderError(null);
        
        const response = await apiClient.get('/orders/my-orders/');
        setOrders(response.data.results || []);
      } catch (err) {
        console.error('Ошибка при загрузке заказов:', err);
        setOrderError(err instanceof Error ? err : new Error('Ошибка при загрузке заказов'));
      } finally {
        setLoadingOrders(false);
      }
    };
    
    fetchUserOrders();
  }, [user]);
  
  // Инициализируем форму с использованием react-hook-form и zod для валидации
  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      first_name: '',
      last_name: '',
      phone: '',
      bio: '',
      location: ''
    }
  });
  
  // Функция для безопасного приведения объекта к нужному типу
  const safeProfile = (profile: UserProfile | null): UserProfile => {
    return profile || {
      id: 0,
      username: '',
      email: '',
      first_name: '',
      last_name: '',
      full_name: '',
      avatar: null,
      phone: '',
      bio: '',
      is_verified: false,
      user_type: 'client',
    };
  };
  
  // Обновляем профиль при получении данных от API
  useEffect(() => {
    // Если данные клиента получены, обновляем профиль
    if (client) {
      const userProfile = {
        id: client.id || user?.id || 1,
        username: client.user?.username || user?.username || '',
        email: client.user?.email || user?.email || '',
        first_name: client.user?.first_name || user?.first_name || '',
        last_name: client.user?.last_name || user?.last_name || '',
        full_name: client.user?.full_name || `${client.user?.first_name || ''} ${client.user?.last_name || ''}`.trim() || 'Пользователь',
        avatar: client.user?.avatar || user?.avatar || null,
        phone: client.user?.phone || user?.phone || '',
        bio: client.user?.bio || user?.bio || '',
        is_verified: client.user?.is_verified || user?.is_verified || true,
        user_type: 'client',
        location: client.user?.location || user?.location || '',
      };
      
      setProfile(userProfile);
      
      // Обновляем значения формы
      form.reset({
        first_name: userProfile.first_name,
        last_name: userProfile.last_name,
        phone: userProfile.phone,
        bio: userProfile.bio,
        location: userProfile.location
      });
    } else if (user && !isClientLoading) {
      // Если данные клиента не получены, но есть данные пользователя, создаем базовый профиль
      const basicProfile = {
        id: user.id || 1,
        username: user.username || '',
        email: user.email || '',
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        full_name: `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'Пользователь',
        avatar: user.avatar || null,
        phone: user.phone || '',
        bio: user.bio || '',
        is_verified: user.is_verified || false,
        user_type: 'client',
        location: user.location || '',
      };
      
      setProfile(basicProfile);
      
      // Обновляем значения формы
      form.reset({
        first_name: basicProfile.first_name,
        last_name: basicProfile.last_name,
        phone: basicProfile.phone,
        bio: basicProfile.bio,
        location: basicProfile.location
      });
    }
  }, [user, client, isClientLoading, form]);
  
  // Логика работы с формой редактирования
  const handleEditClick = () => setIsEditing(true);
  
  const handleCancelEdit = () => {
    // Сбросить форму к текущим значениям профиля
    if (profile) {
      form.reset({
        first_name: profile.first_name,
        last_name: profile.last_name,
        phone: profile.phone,
        bio: profile.bio,
        location: profile.location
      });
    }
    setIsEditing(false);
  };
  
  // Обработчик отправки формы для react-hook-form
  const onSubmit = async (data: ProfileFormValues) => {
    try {
      // Отправляем запрос на обновление данных через API
      // Используем ID профиля из состояния профиля или ID из клиентских данных
      const profileId = profile?.id || client?.id;
      if (!profileId) {
        throw new Error('Не удалось определить ID профиля');
      }
      await apiClient.patch(`client-profiles/${profileId}/`, data);
      
      // Обновляем локальное состояние профиля
      if (profile) {
        const updatedProfile = {
          ...profile,
          ...data
        };
        setProfile(updatedProfile);
      }
      
      setIsEditing(false);
      
      // Обновляем данные профиля через API
      const reloadResult = await reloadClient();
      
      // Обновляем данные пользователя в контексте авторизации если нужно
      if (user && reloadResult) {
        // Если user.updateUser доступен, используем его для обновления данных пользователя
        if (updateUser) {
          // Создаем обновленного пользователя на основе текущих данных и новых данных из формы
          const updatedUser = {
            ...user,
            first_name: data.first_name || user.first_name,
            last_name: data.last_name || user.last_name,
            phone: data.phone || user.phone,
            bio: data.bio || user.bio,
            location: data.location || user.location
          };
          updateUser(updatedUser);
        }
      }
      
      // Уведомление об успешном обновлении
      toast({
        title: 'Профиль обновлен',
        description: 'Ваши данные были успешно сохранены',
      });
    } catch (err) {
      toast({
        variant: "destructive",
        title: 'Ошибка обновления',
        description: 'Не удалось обновить профиль',
      });
    }
  };
  
  // Перенаправление на страницу входа, если пользователь не авторизован
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);
  
  if (!isAuthenticated) {
    return null; // Показываем ничего, пока происходит перенаправление
  }
  
  // Если происходит загрузка данных, показываем индикатор
  if (isClientLoading) {
    return (
      <div className="container py-8">
        <div className="flex items-center justify-center h-[60vh]">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-purple-600" />
            <p className="mt-2 text-gray-600">Загрузка профиля...</p>
          </div>
        </div>
      </div>
    );
  }
  
  // Если произошла ошибка, показываем сообщение об ошибке
  if (clientError) {
    return (
      <div className="container py-8">
        <Alert className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Ошибка</AlertTitle>
          <AlertDescription>{clientError.message || 'Не удалось загрузить профиль клиента'}</AlertDescription>
        </Alert>
        
        <Button variant="outline" onClick={() => reloadClient()}>
          Повторить попытку
        </Button>
      </div>
    );
  }
  
  const profileData = safeProfile(profile);
  
  return (
    <div className="container py-8">
      <div className="max-w-4xl mx-auto">
        {/* Профиль пользователя */}
        <div className="flex flex-col md:flex-row items-start gap-6 mb-8">
          {/* Аватар и основная информация */}
          <div className="w-full md:w-1/3">
            <Card>
              <CardContent className="pt-6 flex flex-col items-center text-center">
                <Avatar className="h-24 w-24 mb-4">
                  {profileData.avatar ? (
                    <AvatarImage src={profileData.avatar} alt={profileData.full_name} />
                  ) : (
                    <AvatarFallback>
                      {profileData.first_name?.charAt(0) || profileData.username?.charAt(0) || 'U'}
                    </AvatarFallback>
                  )}
                </Avatar>
                
                <h2 className="text-xl font-semibold mb-1">{profileData.full_name || profileData.username}</h2>
                
                {profileData.is_verified && (
                  <Badge className="mb-2 bg-green-500">Верифицирован</Badge>
                )}
                
                <div className="w-full space-y-3 mt-4">
                  <div className="flex items-center text-sm text-gray-600">
                    <UserIcon className="h-5 w-5" />
                    <span>ID: #{client?.id}</span>
                  </div>
                  
                  <div className="flex items-center text-sm text-gray-600">
                    <Mail className="mr-2 h-4 w-4" />
                    <span>{profileData.email}</span>
                  </div>
                  
                  {profileData.phone && (
                    <div className="flex items-center text-sm text-gray-600">
                      <Phone className="mr-2 h-4 w-4" />
                      <span>{profileData.phone}</span>
                    </div>
                  )}
                  
                  {profileData.location && (
                    <div className="flex items-center text-sm text-gray-600">
                      <MapPin className="mr-2 h-4 w-4" />
                      <span>{profileData.location}</span>
                    </div>
                  )}
                </div>
                
                {!isEditing && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="mt-4 w-full"
                    onClick={handleEditClick}
                  >
                    <Edit className="mr-2 h-4 w-4" />
                    Редактировать профиль
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>
          
          {/* Форма редактирования профиля или подробная информация */}
          <div className="w-full md:w-2/3">
            <Card>
              <CardHeader>
                <CardTitle>{isEditing ? 'Редактировать профиль' : 'Информация о пользователе'}</CardTitle>
                <CardDescription>
                  {isEditing 
                    ? 'Измените свои персональные данные' 
                    : 'Детальная информация о вашем профиле'}
                </CardDescription>
              </CardHeader>
              
              <CardContent>
                {isEditing ? (
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="first_name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Имя</FormLabel>
                              <FormControl>
                                <Input {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="last_name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Фамилия</FormLabel>
                              <FormControl>
                                <Input {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <FormField
                        control={form.control}
                        name="phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Телефон</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="location"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Местоположение</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="bio"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>О себе</FormLabel>
                            <FormControl>
                              <Textarea {...field} rows={3} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    
                      <div className="flex justify-end space-x-2 pt-2">
                        <Button 
                          variant="outline" 
                          onClick={handleCancelEdit}
                          type="button"
                        >
                          <X className="mr-2 h-4 w-4" />
                          Отмена
                        </Button>
                        <Button 
                          type="submit"
                        >
                          <Save className="mr-2 h-4 w-4" />
                          Сохранить
                        </Button>
                      </div>
                    </form>
                  </Form>
                ) : (
                  <div className="space-y-4">
                    {profileData.bio ? (
                      <div>
                        <h3 className="text-sm font-medium text-gray-500 mb-1">О себе</h3>
                        <p className="text-gray-800">{profileData.bio}</p>
                      </div>
                    ) : (
                      <div className="text-gray-500 italic">
                        Добавьте информацию о себе, редактируя профиль
                      </div>
                    )}
                    
                    <Separator />
                    
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 mb-2">Статистика аккаунта</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-gray-50 p-3 rounded-md">
                          <p className="text-sm text-gray-500">Тип аккаунта</p>
                          <p className="font-medium">Клиент</p>
                        </div>
                        <div className="bg-gray-50 p-3 rounded-md">
                          <p className="text-sm text-gray-500">Дата регистрации</p>
                          <p className="font-medium">01.06.2025</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
        
        {/* Табы с разделами профиля */}
        <Tabs defaultValue="orders" className="mt-6">
          <TabsList className="grid grid-cols-4 mb-6">
            <TabsTrigger value="orders">Мои заказы</TabsTrigger>
            <TabsTrigger value="favorites">
              <Heart className="h-4 w-4 mr-1" />
              Избранные
            </TabsTrigger>
            <TabsTrigger value="reviews">Отзывы</TabsTrigger>
            <TabsTrigger value="settings">Настройки</TabsTrigger>
          </TabsList>
          
          <TabsContent value="orders">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div>
                  <CardTitle>Мои заказы</CardTitle>
                  <CardDescription>История ваших заказов и текущие проекты</CardDescription>
                </div>
                <Button 
                  variant="default" 
                  className="bg-[#282D4E] hover:bg-[#363c68]"
                  asChild
                >
                  <Link to="/create-order">
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Создать заказ
                  </Link>
                </Button>
              </CardHeader>
              
              <CardContent>
                <div className="space-y-4">
                  {loadingOrders && (
                    <div className="space-y-4">
                      {[1, 2].map((i) => (
                        <div key={i} className="border rounded-lg p-4">
                          <Skeleton className="h-6 w-1/3 mb-2" />
                          <Skeleton className="h-4 w-1/2 mb-4" />
                          <Skeleton className="h-10 w-full" />
                          <div className="flex justify-between mt-4">
                            <Skeleton className="h-4 w-1/4" />
                            <Skeleton className="h-4 w-1/4" />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {!loadingOrders && orderError && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>Ошибка</AlertTitle>
                      <AlertDescription>
                        Не удалось загрузить ваши заказы. Пожалуйста, попробуйте позже.
                      </AlertDescription>
                    </Alert>
                  )}
                  
                  {!loadingOrders && !orderError && orders.length > 0 ? (
                    <div className="divide-y">
                      {orders.map((order) => (
                        <div key={order.id} className="py-4 first:pt-0 last:pb-0">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div>
                              <Link 
                                to={`/orders/${order.id}`}
                                className="font-semibold text-lg text-[#282D4E] hover:underline"
                              >
                                {order.title}
                              </Link>
                              <div className="text-sm text-gray-500 mt-1">
                                Создан: {new Date(order.created_at).toLocaleDateString('ru-RU')}
                              </div>
                            </div>
                            <div className="flex items-center">
                              <Badge 
                                variant={order.status === 'completed' ? 'default' : 
                                       order.status === 'in_progress' ? 'default' : 
                                       order.status === 'draft' ? 'outline' : 'secondary'}
                                className={`
                                  ${order.status === 'published' ? 'bg-[#282D4E]' : ''} 
                                  ${order.status === 'completed' ? 'bg-green-600 text-white' : ''}
                                `}
                              >
                                {order.status === 'published' ? 'Опубликован' : 
                                 order.status === 'draft' ? 'Черновик' : 
                                 order.status === 'in_progress' ? 'В работе' : 
                                 order.status === 'completed' ? 'Выполнен' : 
                                 order.status}
                              </Badge>
                              {order.budget && (
                                <span className="ml-4 text-sm font-medium">
                                  {order.budget.toLocaleString('ru-RU')} ₽
                                </span>
                              )}
                            </div>
                          </div>
                          {order.tags && order.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {order.tags.map(tag => (
                                <Badge key={tag.id} variant="outline" className="text-xs">
                                  {tag.name}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    !loadingOrders && !orderError && (
                      <div className="text-center py-8 text-gray-500">
                        <p>У вас пока нет заказов</p>
                        <Button 
                          className="mt-4 bg-[#282D4E] hover:bg-[#363c68]"
                          asChild
                        >
                          <Link to="/create-order">
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Создать заказ
                          </Link>
                        </Button>
                      </div>
                    )
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="favorites">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Heart className="h-5 w-5 mr-2 text-red-500" />
                  Избранные креаторы
                </CardTitle>
                <CardDescription>
                  Креаторы, которые вы добавили в избранное
                </CardDescription>
              </CardHeader>
              
              <CardContent>
                {favoritesLoading ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[...Array(6)].map((_, i) => (
                      <div key={i} className="space-y-3">
                        <Skeleton className="h-48 w-full rounded-lg" />
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-4 w-1/2" />
                      </div>
                    ))}
                  </div>
                ) : favoritesError ? (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Ошибка</AlertTitle>
                    <AlertDescription>
                      Не удалось загрузить список избранных креаторов. Попробуйте обновить страницу.
                    </AlertDescription>
                  </Alert>
                ) : favorites.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {favorites.map((favorite) => (
                      <div key={favorite.id} className="relative">
                        <CreatorCard 
                          creator={{
                            id: favorite.creator.id,
                            user: favorite.creator.user,
                            creator_name: favorite.creator.creator_name,
                            bio: favorite.creator.bio,
                            categories: favorite.creator.categories,
                            rating: favorite.creator.rating,
                            reviews_count: favorite.creator.reviews_count,
                            services_count: favorite.creator.services_count,
                            base_price: favorite.creator.base_price,
                            location: favorite.creator.location,
                            is_online: favorite.creator.is_online,
                            response_time: favorite.creator.response_time,
                            completion_rate: favorite.creator.completion_rate
                          }}
                          useLink={true}
                          showDetailedProfile={false}
                          hideButtons={user?.has_creator_profile || false}
                        />
                        <div className="absolute top-2 right-2 bg-white dark:bg-gray-800 rounded-full p-1 shadow-sm">
                          <Badge variant="outline" className="text-xs text-gray-500">
                            Добавлен {new Date(favorite.created_at).toLocaleDateString('ru-RU')}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Heart className="h-16 w-16 mx-auto text-gray-300 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                      Нет избранных креаторов
                    </h3>
                    <p className="text-gray-500 dark:text-gray-400 mb-6">
                      Начните добавлять креаторов в избранное, чтобы легко находить их позже
                    </p>
                    <Button asChild variant="default" className="bg-[#282D4E] hover:bg-[#363c68]">
                      <Link to="/catalog-creators">
                        Посмотреть каталог креаторов
                      </Link>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="reviews">
            <Card>
              <CardHeader>
                <CardTitle>Отзывы</CardTitle>
                <CardDescription>
                  Отзывы, которые вы оставили креаторам
                </CardDescription>
              </CardHeader>
              
              <CardContent>
                <div className="text-center py-8 text-gray-500">
                  <p>У вас пока нет отзывов</p>
                  <p className="text-sm mt-2">После завершения заказа, вы сможете оставить отзыв исполнителю</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="settings">
            <Card>
              <CardHeader>
                <CardTitle>Настройки аккаунта</CardTitle>
                <CardDescription>
                  Управляйте настройками безопасности и уведомлений
                </CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <h3 className="font-medium">Безопасность</h3>
                  <Button variant="outline" size="sm">
                    Изменить пароль
                  </Button>
                </div>
                
                <Separator />
                
                <div className="space-y-2">
                  <h3 className="font-medium">Уведомления</h3>
                  <div className="flex items-center justify-between">
                    <span>Email-уведомления</span>
                    <div className="flex items-center">
                      <Badge variant="outline">Включены</Badge>
                    </div>
                  </div>
                </div>
                
                <Separator />
                
                <div className="pt-2">
                  <Button variant="destructive" size="sm">
                    Удалить аккаунт
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default ClientProfilePage;