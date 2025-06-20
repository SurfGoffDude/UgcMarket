import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  FileText
} from 'lucide-react';

// Импортируем наш тип пользователя
import { User } from '@/types/user';

import { useAuth } from '@/contexts/AuthContext';
import { useClientProfile } from '@/hooks/useApi';
import apiClient from '@/api/client';
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
  
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  
  // Проверяем тип пользователя и перенаправляем креаторов на их профиль
  useEffect(() => {
    if (user) {
      // Добавляем отладочный вывод данных пользователя
      console.log('Данные пользователя в ClientProfilePage:', user);
      console.log('Тип пользователя:', (user as any)?.user_type);
      console.log('Имеет профиль креатора:', (user as any)?.has_creator_profile);
      
      // Если пользователь является креатором, перенаправляем на страницу профиля креатора
      const isCreator = user && 
        (user as any)?.has_creator_profile === true;
      
      console.log('Пользователь креатор?', isCreator);
      
      if (isCreator) {
        console.log('Перенаправляем на профиль креатора:', '/creator-profile');
        navigate('/creator-profile');
      }
    } else {
      console.log('Пользователь не найден в ClientProfilePage');
    }
  }, [user, navigate]);
  
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
          <TabsList className="grid grid-cols-3 mb-6">
            <TabsTrigger value="orders">Мои заказы</TabsTrigger>
            <TabsTrigger value="reviews">Отзывы</TabsTrigger>
            <TabsTrigger value="settings">Настройки</TabsTrigger>
          </TabsList>
          
          <TabsContent value="orders">
            <Card>
              <CardHeader>
                <CardTitle>Мои заказы</CardTitle>
                <CardDescription>История ваших заказов и текущие проекты</CardDescription>
              </CardHeader>
              
              <CardContent>
                <div className="space-y-4">
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-100 flex justify-between items-center">
                    <div>
                      <Badge>В процессе</Badge>
                      <h3 className="font-medium mt-1">Дизайн логотипа для компании</h3>
                      <div className="flex items-center text-sm text-gray-600 mt-1">
                        <Clock className="h-3 w-3 mr-1" />
                        <span>Срок до 21.06.2025</span>
                      </div>
                    </div>
                    <Button variant="outline" size="sm">
                      <FileText className="h-4 w-4 mr-1" />
                      Детали
                    </Button>
                  </div>
                  
                  <div className="text-center py-8 text-gray-500">
                    <p>У вас пока нет других заказов</p>
                    <Button className="mt-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
                      Создать заказ
                    </Button>
                  </div>
                </div>
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