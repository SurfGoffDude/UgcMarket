import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useCreatorProfile } from '@/hooks/useCreatorProfile';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Loader2, Trash2, AlertCircle, Plus, Upload } from 'lucide-react';
import apiClient from '@/api/client';
import { useToast } from '@/components/ui/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import { LockIcon, UnlockIcon } from "lucide-react";

const profileFormSchema = z.object({
  // Общие поля
  first_name: z.string().max(30, 'Слишком длинное имя').optional(),
  last_name: z.string().max(30, 'Слишком длинная фамилия').optional(),
  username: z.string().max(30, 'Слишком длинное имя пользователя').optional(),
  phone: z.string().max(20, 'Слишком длинный номер телефона').optional(),
  bio: z.string().max(500, 'Слишком длинное описание').optional(),
  location: z.string().max(100, 'Слишком длинное название локации').optional(),
  avatar: z.instanceof(File).optional().nullable(),
  
  // Специфические поля для CreatorProfile
  specialization: z.string().max(255, 'Слишком длинная специализация').optional(),
  experience: z.string().max(255, 'Слишком длинное описание опыта').optional(),
  available_for_hire: z.boolean().default(true),
  social_links: z.array(z.object({
    platform: z.string().min(1, "Платформа не может быть пустой"),
    url: z.string().url("Неверный формат URL"),
  })).default([]),
  
  // Другие поля CreatorProfile, как rating и verified будут read-only
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

const CreatorProfileEditPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { creator, loading, error, reload } = useCreatorProfile(id);
  const { user: currentUser } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const { toast } = useToast();
  
  // Состояние для управления превью аватара
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  
  // Состояние для управления формой

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      first_name: '',
      last_name: '',
      username: '',
      phone: '',
      bio: '',
      location: '',
      avatar: null,
      specialization: '',
      experience: '',
      available_for_hire: true,
      social_links: [],
    }
  });
  
  // Получаем методы для работы с массивами полей
  const { fields: socialFields, append: appendSocial, remove: removeSocial } = useFieldArray({
    control: form.control,
    name: 'social_links'
  });

  // Проверка авторизации пользователя
  useEffect(() => {
    if (creator && currentUser && creator.user?.id !== currentUser.id) {
      navigate(`/creators/${id}`);
    }
  }, [creator, currentUser, id, navigate]);

  // Заполнение формы данными профиля
  useEffect(() => {
    if (creator) {
      form.reset({
        first_name: creator.user?.first_name || '',
        last_name: creator.user?.last_name || '',
        username: creator.user?.username || '',
        phone: creator.user?.phone || '',
        bio: creator.bio || creator.user?.bio || '',
        location: creator.location || creator.user?.location || '',
        avatar: null, // Файл не может быть загружен из API
        specialization: creator.specialization || '',
        experience: creator.experience || '',
        available_for_hire: creator.available_for_hire !== undefined ? creator.available_for_hire : true,
        social_links: creator.social_links || [],
      });
      
      // Установка превью аватара, если он есть
      if (creator.user?.avatar) {
        setAvatarPreview(creator.user.avatar);
      }
    }
  }, [creator, form]);

  // Обработчик изменения файла аватара
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      form.setValue('avatar', file);
      
      // Создаем URL для превью
      const fileReader = new FileReader();
      fileReader.onload = (e) => {
        if (e.target?.result) {
          setAvatarPreview(e.target.result as string);
        }
      };
      fileReader.readAsDataURL(file);
    }
  };
  


  const onSubmit = async (data: ProfileFormValues) => {
    setIsSubmitting(true);
    setApiError(null);
    try {
      // Получаем данные из формы
      const { 
      first_name, last_name, username, phone, 
      bio, location, avatar, social_links,
      specialization, experience, available_for_hire,
        ...otherData 
      } = data;
      
      // Формируем объект с полями User только если они изменились
      const userFields: Record<string, any> = {};
      
      if (creator?.user?.first_name !== first_name && first_name !== undefined) {
        userFields.first_name = first_name;
      }
      
      if (creator?.user?.last_name !== last_name && last_name !== undefined) {
        userFields.last_name = last_name;
      }
      
      if (creator?.user?.phone !== phone && phone !== undefined) {
        userFields.phone = phone;
      }
      
      // Обновляем bio в модели User
      if (creator?.user?.bio !== bio && bio !== undefined) {
        userFields.bio = bio;
      }
      
      // Обновляем location в модели User
      if (creator?.user?.location !== location && location !== undefined) {
        userFields.location = location;
      }
      
      // Не отправляем username, если он не изменился
      if (creator?.user?.username !== username && username !== undefined && username.trim() !== '') {
        userFields.username = username;
      }

      // Создаем FormData для отправки файлов
      const formData = new FormData();
      
      // Формируем данные для обновления CreatorProfile
      const creatorProfileData: Record<string, any> = {
        ...otherData,
        bio, // Поле bio для CreatorProfile
        location_write: location || '', // location_write с пустой строкой по умолчанию
        social_links: social_links || [],
        specialization,
        experience,
        available_for_hire
      };
      
      // Добавляем поля User только если есть изменения
      if (Object.keys(userFields).length > 0) {
        creatorProfileData.user = userFields;
      }
      
      // Преобразуем данные в FormData
      Object.entries(creatorProfileData).forEach(([key, value]) => {
        if (key === 'social_links' || key === 'user') {
          formData.append(key, JSON.stringify(value));
        } else if (key === 'available_for_hire') {
          formData.append(key, value ? 'true' : 'false');
        } else {
          formData.append(key, value === null ? '' : String(value));
        }
      });
      
      // Вариант с аватаром - тестируем другой подход
      if (avatar) {
        // Добавляем аватар как "avatar" (DRF основной корень) и как "user.avatar" (вложенный объект)
        formData.append('avatar', avatar);
        formData.append('user.avatar', avatar);
      }
      
      console.log('[DEBUG] Отправка данных профиля:', {
        formData: Array.from(formData.entries()).reduce((obj, [key, value]) => {
          obj[key] = value;
          return obj;
        }, {} as Record<string, any>),
        creatorProfileData
      });
      
      // Отправляем обновление профиля креатора
      await apiClient.patch(`creator-profiles/${id}/`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      // Показываем уведомление об успехе
      toast({
        title: 'Профиль обновлен',
        description: 'Ваш профиль был успешно обновлен',
        variant: 'default',
      });
      
      // Выполняем обновление данных профиля перед переходом
      await reload();
      
      // Возвращаемся на страницу профиля
      if (id) {
        navigate(`/creators/${id}?updated=true`);
      } else {
        navigate(`/creator-profile?updated=true`);
      }
    } catch (err: any) {
      console.error('Ошибка при обновлении профиля:', err);
      
      // Обрабатываем ошибку и показываем уведомление
      console.log('Детали ошибки:', err.response?.data);
      
      let errorMessage = 'Произошла ошибка при обновлении профиля';
      
      // Попытка извлечения сообщения об ошибке в разных форматах
      if (err.response?.data) {
        const data = err.response.data;
        
        if (typeof data === 'string') {
          errorMessage = data;
        } else if (data.detail) {
          errorMessage = data.detail;
        } else {
          // Попытка извлечь текст ошибки из вложенных полей
          const errors: string[] = [];
          
          // Обрабатываем ошибки во вложенных объектах, например user.username
          Object.entries(data).forEach(([key, value]) => {
            if (typeof value === 'string') {
              errors.push(`${key}: ${value}`);
            } else if (Array.isArray(value)) {
              errors.push(`${key}: ${value.join(', ')}`);
            } else if (typeof value === 'object' && value !== null) {
              // Для вложенных объектов (например, user)
              Object.entries(value).forEach(([nestedKey, nestedValue]) => {
                if (Array.isArray(nestedValue)) {
                  errors.push(`${key}.${nestedKey}: ${nestedValue.join(', ')}`);
                } else {
                  errors.push(`${key}.${nestedKey}: ${nestedValue}`);
                }
              });
            }
          });
          
          if (errors.length > 0) {
            errorMessage = errors.join('\n');
          }
        }
      }
      
      setApiError(errorMessage);
      
      toast({
        title: 'Ошибка',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-screen"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>;
  }

  if (error) {
    return <div className="text-red-500 text-center mt-10">{error}</div>;
  }
  
  if (apiError) {
    return (
      <div className="container mx-auto p-4 max-w-2xl">
        <Card className="mb-5 border-red-300 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-5 w-5 text-red-500" />
              <div className="font-semibold text-red-700">Ошибка при обновлении профиля</div>
            </div>
            <div className="mt-2 text-red-600 whitespace-pre-line">{apiError}</div>
            <Button 
              onClick={() => setApiError(null)} 
              variant="outline" 
              className="mt-4"
            >
              Попробовать снова
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Редактирование профиля</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              
              {/* Аватар */}
              <div className="flex flex-col items-center">
                <div className="mb-4">
                  <Avatar className="w-24 h-24">
                    <AvatarImage src={avatarPreview || undefined} alt="Аватар" />
                    <AvatarFallback>
                      {creator?.user?.first_name?.[0] || creator?.user?.username?.[0] || '?'}
                    </AvatarFallback>
                  </Avatar>
                </div>
                <Label htmlFor="avatar" className="cursor-pointer flex items-center gap-2 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 rounded-md text-sm font-medium">
                  <Upload className="h-4 w-4" />
                  Загрузить аватар
                </Label>
                <input
                  id="avatar"
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="sr-only"
                />
                <FormDescription className="text-xs mt-2 text-center">
                  Рекомендуемый размер: 200x200 пикселей
                </FormDescription>
              </div>
              
              <Separator className="my-4" />
              
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Имя пользователя</FormLabel>
                      <FormControl>
                        <Input placeholder="Имя пользователя" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="first_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Имя</FormLabel>
                        <FormControl>
                          <Input placeholder="Имя" {...field} />
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
                          <Input placeholder="Фамилия" {...field} />
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
                        <Input placeholder="Телефон" {...field} />
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
                        <Textarea placeholder="Расскажите о себе и своей деятельности" {...field} rows={4} />
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
                        <Input placeholder="Ваше местоположение" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {/* Поля профиля креатора */}
                <FormField
                  control={form.control}
                  name="specialization"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Специализация</FormLabel>
                      <FormControl>
                        <Input placeholder="Ваша специализация" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="experience"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Опыт работы</FormLabel>
                      <FormControl>
                        <Input placeholder="Ваш опыт работы" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="available_for_hire"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                      <FormControl>
                        <div className="flex items-center gap-3">
                          <Button
                            type="button"
                            variant={field.value ? "outline" : "default"}
                            size="icon"
                            className={`h-9 w-9 rounded-full ${!field.value ? 'bg-primary text-white' : 'text-muted-foreground'}`}
                            onClick={() => field.onChange(false)}
                          >
                            <LockIcon className="h-4 w-4" />
                          </Button>
                          <Button
                            type="button"
                            variant={!field.value ? "outline" : "default"}
                            size="icon"
                            className={`h-9 w-9 rounded-full ${field.value ? 'bg-primary text-white' : 'text-muted-foreground'}`}
                            onClick={() => field.onChange(true)}
                          >
                            <UnlockIcon className="h-4 w-4" />
                          </Button>
                        </div>
                      </FormControl>
                      <FormLabel className="font-normal cursor-pointer">
                        {field.value ? "Доступен для найма" : "Недоступен для найма"}
                      </FormLabel>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <Separator className="my-4" />
                
                {/* Социальные сети */}
                <div>
                  <FormLabel className="block mb-2">Социальные сети</FormLabel>
                  <div className="space-y-2">
                    {socialFields.map((field, index) => (
                      <div key={field.id} className="flex items-end gap-2">
                        <FormField
                          control={form.control}
                          name={`social_links.${index}.platform`}
                          render={({ field }) => (
                            <FormItem className="flex-1">
                              <FormControl>
                                <Input placeholder="Платформа (e.g. GitHub)" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name={`social_links.${index}.url`}
                          render={({ field }) => (
                            <FormItem className="flex-1">
                              <FormControl>
                                <Input placeholder="URL" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <Button type="button" variant="destructive" size="icon" onClick={() => removeSocial(index)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="mt-2"
                    onClick={() => appendSocial({ platform: '', url: '' })}
                  >
                    Добавить ссылку
                  </Button>
                </div>
              </div>

              <Button type="submit" disabled={isSubmitting} className="w-full">
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Сохранить изменения
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
};

export default CreatorProfileEditPage;