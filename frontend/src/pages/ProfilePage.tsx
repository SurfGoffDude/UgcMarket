import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User,
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

import { useApiContext } from '@/contexts/ApiContext';
import { useClientProfile } from '@/hooks/useApi'; // Импортируем новый хук
import api from '@/lib/api';
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
 * Компонент страницы профиля пользователя
 */
const ProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const { user, refreshUser, isAuthenticated } = useApiContext();
  
  // Используем новый хук для получения данных профиля клиента
  const { client, loading: isClientLoading, error: clientError, reload: reloadClient } = useClientProfile();
  
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editForm, setEditForm] = useState<Partial<UserProfile>>({});
  
  // Функция для безопасного приведения объекта user к типу UserProfile
  const getUserProfile = (userData: any): UserProfile => {
    return {
      id: userData?.id || 0,
      username: userData?.username || '',
      email: userData?.email || '',
      first_name: userData?.first_name || '',
      last_name: userData?.last_name || '',
      full_name: userData?.full_name || `${userData?.first_name || ''} ${userData?.last_name || ''}`.trim(),
      avatar: userData?.avatar || null,
      phone: userData?.phone || '',
      bio: userData?.bio || '',
      is_verified: userData?.is_verified || false,
      user_type: userData?.user_type || 'client',
      location: userData?.location || '',
    };
  };
  
  // Загрузка данных профиля
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setIsLoading(true);
        setError(null);
        if (isAuthenticated) {
          // Если у нас уже есть данные пользователя из контекста
          if (user) {
            const profileData = getUserProfile(user);
            setProfile(profileData);
            setEditForm({
              first_name: profileData.first_name,
              last_name: profileData.last_name,
              phone: profileData.phone,
              bio: profileData.bio || '',
              location: profileData.location || ''
            });
          } else {
            // Если данных в контексте нет, получаем их через API
            const userData = await api.getCurrentUser();
            const profileData = getUserProfile(userData);
            setProfile(profileData);
            setEditForm({
              first_name: profileData.first_name,
              last_name: profileData.last_name,
              phone: profileData.phone,
              bio: profileData.bio || '',
              location: profileData.location || ''
            });
          }
        } else {
          // Если пользователь не аутентифицирован, перенаправляем на страницу входа
          navigate('/login');
        }
      } catch (err) {
        console.error('Ошибка при загрузке профиля:', err);
        setError('Не удалось загрузить данные профиля.');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchProfile();
  }, [isAuthenticated, user, navigate]);
  
  // Обработка изменения полей формы
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setEditForm(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Сохранение профиля
  const handleSaveProfile = async () => {
    try {
      setIsLoading(true);
      // Здесь будет вызов API для обновления профиля
      // Для реального API здесь будет:
      // await api.updateProfile(profile?.id || 0, editForm);
      
      console.log('Данные для обновления:', editForm);
      
      // Обновляем локальное состояние
      if (profile) {
        setProfile({
          ...profile,
          ...editForm
        });
      }
      
      await refreshUser(); // Обновляем данные пользователя в контексте
      setIsEditing(false);
      toast({
        title: "Профиль обновлен",
        description: "Ваши данные успешно сохранены",
      });
    } catch (err) {
      console.error('Ошибка при обновлении профиля:', err);
      toast({
        variant: "destructive",
        title: "Ошибка",
        description: "Не удалось обновить профиль",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Показываем лоадер при загрузке
  if (isLoading && !profile) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="w-10 h-10 text-purple-600 animate-spin" />
          <p className="text-gray-600 dark:text-gray-400">Загрузка профиля...</p>
        </div>
      </div>
    );
  }
  
  // Показываем ошибку, если не удалось загрузить данные
  if (error) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900 p-6">
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Ошибка</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <Button onClick={() => navigate('/')} variant="outline">
          Вернуться на главную
        </Button>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-900 min-h-screen">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6 text-gray-900 dark:text-white">Личный кабинет</h1>
        
        {/* Профиль пользователя */}
        <Card className="mb-8">
          <CardHeader>
            <div className="flex justify-between">
              <CardTitle>Информация о профиле</CardTitle>
              {!isEditing ? (
                <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Редактировать
                </Button>
              ) : (
                <div className="flex space-x-2">
                  <Button variant="default" size="sm" onClick={handleSaveProfile} disabled={isLoading}>
                    {isLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                    Сохранить
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setIsEditing(false)} disabled={isLoading}>
                    <X className="h-4 w-4 mr-2" />
                    Отмена
                  </Button>
                </div>
              )}
            </div>
            <CardDescription>
              Ваши персональные данные и контактная информация
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            <div className="flex flex-col md:flex-row gap-6">
              {/* Аватар */}
              <div className="flex flex-col items-center space-y-3">
                <Avatar className="h-32 w-32">
                  {profile?.avatar ? (
                    <AvatarImage src={profile.avatar} alt={profile.full_name} />
                  ) : (
                    <AvatarFallback className="text-3xl">
                      {profile?.first_name?.[0]}{profile?.last_name?.[0]}
                    </AvatarFallback>
                  )}
                </Avatar>
                
                <Badge variant={profile?.user_type === 'creator' ? 'secondary' : 'default'} className={profile?.user_type === 'creator' ? 'bg-purple-600 hover:bg-purple-700 text-white' : ''}>
                  {profile?.user_type === 'creator' ? 'Креатор' : 'Клиент'}
                </Badge>
                
                {profile?.is_verified && (
                  <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300">Верифицирован</Badge>
                )}
              </div>
              
              {/* Форма с информацией */}
              <div className="flex-1 space-y-4">
                {isEditing ? (
                  // Режим редактирования
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          Имя
                        </label>
                        <Input
                          name="first_name"
                          value={editForm.first_name || ''}
                          onChange={handleInputChange}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          Фамилия
                        </label>
                        <Input
                          name="last_name"
                          value={editForm.last_name || ''}
                          onChange={handleInputChange}
                          className="mt-1"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Телефон
                      </label>
                      <Input
                        name="phone"
                        value={editForm.phone || ''}
                        onChange={handleInputChange}
                        className="mt-1"
                      />
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Местоположение
                      </label>
                      <Input
                        name="location"
                        value={editForm.location || ''}
                        onChange={handleInputChange}
                        className="mt-1"
                      />
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        О себе
                      </label>
                      <Textarea
                        name="bio"
                        value={editForm.bio || ''}
                        onChange={handleInputChange}
                        className="mt-1"
                        rows={4}
                      />
                    </div>
                  </div>
                ) : (
                  // Режим просмотра
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Логин</p>
                        <p className="font-medium flex items-center">
                          <User className="h-4 w-4 mr-2 text-gray-500" />
                          {profile?.username}
                        </p>
                      </div>
                      
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">ФИО</p>
                        <p className="font-medium">
                          {profile?.full_name}
                        </p>
                      </div>
                    </div>
                    
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Email</p>
                      <p className="font-medium flex items-center">
                        <Mail className="h-4 w-4 mr-2 text-gray-500" />
                        {profile?.email}
                      </p>
                    </div>
                    
                    {profile?.phone && (
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Телефон</p>
                        <p className="font-medium flex items-center">
                          <Phone className="h-4 w-4 mr-2 text-gray-500" />
                          {profile.phone}
                        </p>
                      </div>
                    )}
                    
                    {profile?.location && (
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Местоположение</p>
                        <p className="font-medium flex items-center">
                          <MapPin className="h-4 w-4 mr-2 text-gray-500" />
                          {profile.location}
                        </p>
                      </div>
                    )}
                    
                    {profile?.bio && (
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">О себе</p>
                        <p className="font-medium">{profile.bio}</p>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Вкладки с дополнительной информацией */}
        <Tabs defaultValue="orders" className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="orders">Заказы</TabsTrigger>
            {profile?.user_type === 'creator' && (
              <TabsTrigger value="services">Мои услуги</TabsTrigger>
            )}
            <TabsTrigger value="settings">Настройки</TabsTrigger>
          </TabsList>
          
          <TabsContent value="orders">
            <Card>
              <CardHeader>
                <CardTitle>История заказов</CardTitle>
                <CardDescription>
                  Здесь отображаются все ваши заказы
                </CardDescription>
              </CardHeader>
              
              <CardContent>
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <FileText className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                  <p className="text-lg font-medium">У вас пока нет заказов</p>
                  <p className="mt-1">Здесь будет отображаться история ваших заказов</p>
                  <Button variant="outline" className="mt-4" onClick={() => navigate('/catalog')}>
                    Перейти в каталог услуг
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          {profile?.user_type === 'creator' && (
            <TabsContent value="services">
              <Card>
                <CardHeader>
                  <CardTitle>Мои услуги</CardTitle>
                  <CardDescription>
                    Управляйте предлагаемыми вами услугами
                  </CardDescription>
                </CardHeader>
                
                <CardContent>
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    <Clock className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                    <p className="text-lg font-medium">У вас пока нет услуг</p>
                    <p className="mt-1">Создайте свою первую услугу, чтобы начать получать заказы</p>
                    <Button className="mt-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
                      Создать услугу
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          )}
          
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

export default ProfilePage;
