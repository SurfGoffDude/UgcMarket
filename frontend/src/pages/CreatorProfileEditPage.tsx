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
import { Loader2, Trash2, AlertCircle, Plus, Upload, UserIcon, Heart, XCircle } from 'lucide-react';
import apiClient from '@/api/client';
import { useToast } from '@/components/ui/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import { LockIcon, UnlockIcon } from "lucide-react";
import LocationSelector from '@/components/LocationSelector';
import { cn } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const profileFormSchema = z.object({
  // Общие поля
  first_name: z.string().max(30, 'Слишком длинное имя').optional(),
  last_name: z.string().max(30, 'Слишком длинная фамилия').optional(),
  username: z.string().max(30, 'Слишком длинное имя пользователя').optional(),
  gender: z.enum(['', 'male', 'female', 'other', 'prefer_not_to_say']).optional(),
  phone: z.string().max(20, 'Слишком длинный номер телефона').optional(),
  bio: z.string().max(500, 'Слишком длинное описание').optional(),
  location: z.string().max(100, 'Слишком длинное название локации').optional(),
  avatar: z.instanceof(File).optional().nullable(),
  
  // Специфические поля для CreatorProfile
  specialization: z.string().max(255, 'Слишком длинная специализация').optional(),
  experience: z.string().max(255, 'Слишком длинное описание опыта').optional(),
  average_work_time: z.enum([
    '', 'up_to_24_hours', 'up_to_3_days', 'up_to_10_days', 'up_to_14_days', 
    'up_to_30_days', 'up_to_60_days', 'more_than_60_days'
  ]).optional(),
  available_for_hire: z.boolean().default(true),
  social_links: z.array(
    z.object({
      platform: z.string().min(1, "Платформа не может быть пустой"),
      url: z.string().superRefine(
        (url, ctx) => {
          if (!url) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: "URL не может быть пустым"
            });
            return;
          }
          
          // Получаем информацию о платформе из пути данных
          // Сначала проверим, что ctx.path существует
          if (!ctx.path) {
            const isValidUrl = z.string().url().safeParse(url).success;
            if (!isValidUrl) {
              ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "Некорректный URL"
              });
            }
            return;
          }
          
          // Используем путь для определения платформы
          let platform;
          try {
            // Извлекаем путь до текущего поля url
            const pathStr = String(ctx.path);
            
            // Если путь содержит информацию о платформе, извлекаем её
            // формат пути: social_links.0.url, social_links.1.url, и т.д.
            const indexMatch = pathStr.match(/social_links\.(\d+)\.url/);
            if (indexMatch && indexMatch[1]) {
              // Получаем индекс текущего элемента в массиве
              const index = parseInt(indexMatch[1]);
              
              // Платформу получаем из соседнего элемента массива
              // В качестве временного решения мы можем использовать выбранную платформу
              // из URL. Это не самое надежное решение, но позволит определить большинство платформ
              
              // Определяем платформу по URL
              platform = getPlatformFromUrl(url);
            }
          } catch (e) {
            console.error('Error extracting platform from validation context:', e);
          }
            
          if (!platform) return z.string().url().safeParse(url).success;
          
          // Шаблоны URL для различных платформ
          const urlPatterns = {
            facebook: /^https?:\/\/(www\.)?facebook\.com\/[\w.]+$/i,
            youtube: /^https?:\/\/(www\.)?youtube\.com\/(channel\/UC[\w-]+|@[\w.-]+)$/i,
            twitter: /^https?:\/\/(www\.)?twitter\.com\/[\w]+$/i,
            instagram: /^https?:\/\/(www\.)?instagram\.com\/[\w.]+$/i,
            whatsapp: /^https?:\/\/(www\.)?wa\.me\/\d+$/i,
            tiktok: /^https?:\/\/(www\.)?tiktok\.com\/@[\w.]+$/i,
            linkedin: /^https?:\/\/(www\.)?linkedin\.com\/in\/[\w-]+$/i,
            telegram: /^https?:\/\/(www\.)?t\.me\/[\w]+$/i,
            pinterest: /^https?:\/\/(www\.)?pinterest\.com\/[\w]+$/i,
            reddit: /^https?:\/\/(www\.)?reddit\.com\/user\/[\w]+$/i,
            vkontakte: /^https?:\/\/(www\.)?vk\.com\/[\w.]+$/i,
            dzen: /^https?:\/\/(www\.)?zen\.yandex\.ru\/id\/[\w\d]+$/i,
            twitch: /^https?:\/\/(www\.)?twitch\.tv\/[\w]+$/i
          };
          
          const pattern = urlPatterns[platform as keyof typeof urlPatterns];
          if (!pattern) {
            const isValidUrl = z.string().url().safeParse(url).success;
            if (!isValidUrl) {
              ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "Некорректный URL"
              });
            }
            return;
          }
          
          // Строгая проверка на соответствие шаблону
          const isValid = pattern.test(url);
          if (!isValid) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: `URL не соответствует формату для ${platform}. Правильный формат: ${getUrlPlaceholder(platform)}`
            });
          }
        }
      )
    })
  ).default([]),
  
  // Другие поля CreatorProfile, как rating и verified будут read-only
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

// Функция для получения платформы по URL
const getPlatformFromUrl = (url: string): string | undefined => {
  try {
    const urlLower = url.toLowerCase();
    
    if (urlLower.includes('facebook.com')) return 'facebook';
    if (urlLower.includes('youtube.com')) return 'youtube';
    if (urlLower.includes('twitter.com')) return 'twitter';
    if (urlLower.includes('instagram.com')) return 'instagram';
    if (urlLower.includes('wa.me')) return 'whatsapp';
    if (urlLower.includes('tiktok.com')) return 'tiktok';
    if (urlLower.includes('linkedin.com')) return 'linkedin';
    if (urlLower.includes('t.me')) return 'telegram';
    if (urlLower.includes('pinterest.com')) return 'pinterest';
    if (urlLower.includes('reddit.com')) return 'reddit';
    if (urlLower.includes('vk.com')) return 'vkontakte';
    if (urlLower.includes('zen.yandex.ru') || urlLower.includes('dzen.ru')) return 'dzen';
    if (urlLower.includes('twitch.tv')) return 'twitch';
  } catch (e) {
    console.error('Error determining platform from URL:', e);
  }
  
  return undefined;
};

// Функция для получения подсказки URL в зависимости от выбранной платформы
const getUrlPlaceholder = (platform: string | undefined): string => {
  if (!platform) return "https://...";
  
  switch (platform) {
    case 'facebook':
      return "https://www.facebook.com/username";
    case 'youtube':
      return "https://www.youtube.com/channel/UCxxxxxxxxxxxx или https://www.youtube.com/@username";
    case 'twitter':
      return "https://twitter.com/username";
    case 'instagram':
      return "https://www.instagram.com/username";
    case 'whatsapp':
      return "https://wa.me/номер_в_международном_формате";
    case 'tiktok':
      return "https://www.tiktok.com/@username";
    case 'linkedin':
      return "https://www.linkedin.com/in/username";
    case 'telegram':
      return "https://t.me/username";
    case 'pinterest':
      return "https://www.pinterest.com/username";
    case 'reddit':
      return "https://www.reddit.com/user/username";
    case 'vkontakte':
      return "https://vk.com/username";
    case 'dzen':
      return "https://zen.yandex.ru/id/цифровой_идентификатор";
    case 'twitch':
      return "https://www.twitch.tv/username";
    default:
      return "https://...";
  }
};

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

  // Загружаем данные профиля при монтировании компонента
  useEffect(() => {
    if (creator) {
      // Отладка: выводим данные профиля

      
      // Преобразуем профиль в формат формы
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
        gender: creator.user?.gender || '',
        average_work_time: creator.average_work_time || '',
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
      // Отладка: выводим данные формы перед отправкой

      
      // Получаем данные из формы
      const { 
      first_name, last_name, username, phone, 
      bio, location, avatar, social_links,
      specialization, experience, available_for_hire,
        ...otherData 
      } = data;
      
      // Формируем объект с полями User только если они изменились
      const userFields: Record<string, unknown> = {};
      
      if (creator?.user?.first_name !== first_name && first_name !== undefined) {
        userFields.first_name = first_name;
      }
      
      if (creator?.user?.last_name !== last_name && last_name !== undefined) {
        userFields.last_name = last_name;
      }
      
      if (creator?.user?.phone !== phone && phone !== undefined) {
        userFields.phone = phone;
      }
      
      // Добавляем поля пользователя (User)
      userFields.gender = data.gender || '';

      
      // Обновляем bio в модели User - всегда отправляем bio в поля User
      // Это критично для корректного сохранения
      userFields.bio = bio;
      
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
      
      // Специфические поля для CreatorProfile
      const creatorProfileData = {
        user: userFields,
        ...otherData,
        // Обязательно передаем bio в оба места - и в CreatorProfile, и в User
        bio, 
        // Добавляем другие поля профиля креатора
        specialization,
        experience,
        available_for_hire,
        average_work_time: data.average_work_time || '',
        // Добавляем социальные сети
        social_links
      };
      
      // Отладка: выводим данные CreatorProfile перед отправкой

      
      // Всегда добавляем поля User
      creatorProfileData.user = userFields;
      
      // Преобразуем данные в FormData
    Object.entries(creatorProfileData).forEach(([key, value]) => {
      if (key === 'social_links') {

        formData.append(key, JSON.stringify(value));
      } else if (key === 'user') {
        // Проверка, что объект user не пустой и содержит нужные поля
        if (Object.keys(value as Record<string, unknown>).length > 0) {

          formData.append(key, JSON.stringify(value));
          
          // Для надёжности также передаём user.gender и user.bio как отдельные поля
          const userValue = value as Record<string, unknown>;
          if (userValue.gender !== undefined) {
            formData.append('user.gender', String(userValue.gender));
          }
          
          if (userValue.bio !== undefined) {
            formData.append('user.bio', String(userValue.bio));
          }
        }
      } else if (key === 'available_for_hire') {
        formData.append(key, value ? 'true' : 'false');
      } else {
        formData.append(key, value === null ? '' : String(value));
      }
    });
    
    // Дополнительно проверяем, что gender и bio попадают в запрос
    if (!formData.has('user.gender') && data.gender) {
      formData.append('user.gender', data.gender);
    }
    
    if (!formData.has('user.bio') && bio) {
      formData.append('user.bio', bio);
    }
      
      // Вариант с аватаром - тестируем другой подход
      if (avatar) {
        // Добавляем аватар как "avatar" (DRF основной корень) и как "user.avatar" (вложенный объект)
        formData.append('avatar', avatar);
        formData.append('user.avatar', avatar);
      }

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
    } catch (err: unknown) {
      
      // Обрабатываем ошибку и показываем уведомление
      
      let errorMessage = 'Произошла ошибка при обновлении профиля';
      
      // Попытка извлечения сообщения об ошибке в разных форматах
      // Приводим неизвестную ошибку к типу с известной структурой
      interface AxiosErrorType {
        response?: {
          data?: unknown;
          status?: number;
        };
        message?: string;
      }
      
      const axiosError = err as AxiosErrorType;
      if (axiosError.response && axiosError.response.data) {
        // Обработка ошибок от API
        const responseData = axiosError.response.data;
        if (typeof responseData === 'string') {
          errorMessage = responseData;
        } else if (typeof responseData === 'object' && responseData !== null && 'detail' in responseData && typeof responseData.detail === 'string') {
          errorMessage = responseData.detail;
        } else if (typeof responseData === 'object' && responseData !== null) {     // Попытка извлечь текст ошибки из вложенных полей
          const fieldErrors: Record<string, string> = {};
          
          // Собираем ошибки полей из ответа API
          const errorData = responseData as Record<string, unknown>;
          Object.entries(errorData).forEach(([key, value]) => {
            if (typeof value === 'string') {
              fieldErrors[key] = value;
            } else if (Array.isArray(value)) {
              fieldErrors[key] = value.join(', ');
            } else if (typeof value === 'object' && value !== null) {
              // Для вложенных объектов (например, user)
              Object.entries(value).forEach(([nestedKey, nestedValue]) => {
                if (Array.isArray(nestedValue)) {
                  fieldErrors[nestedKey] = nestedValue.join(', ');
                } else {
                  fieldErrors[nestedKey] = String(nestedValue);
                }
              });
            }
          });
          
          // Устанавливаем ошибки для полей формы
          Object.entries(fieldErrors).forEach(([field, message]) => {
            form.setError(field as keyof typeof data, {
              type: 'manual',
              message: message,
            });
          });
          
          if (Object.keys(fieldErrors).length > 0) {
            errorMessage = 'Пожалуйста, исправьте ошибки в форме';
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
    return <div className="text-red-500 text-center mt-10">{typeof error === 'string' ? error : error instanceof Error ? error.message : 'Произошла ошибка'}</div>;
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
                  name="gender"
                  render={({ field }) => (
                    <div className="space-y-3">
                      <div className="font-medium">Пол</div>
                      <div className="flex gap-3">
                        <Button 
                          type="button" 
                          variant={field.value === 'male' ? 'default' : 'outline'}
                          className={cn(
                            "flex-1 flex items-center justify-center gap-2",
                            field.value === 'male' ? 'bg-blue-500 text-white hover:bg-blue-600' : ''
                          )}
                          onClick={() => {
                            field.onChange('male');
                          }}
                        >
                          <UserIcon className="h-5 w-5" />
                          <span>Мужской</span>
                        </Button>
                        <Button 
                          type="button" 
                          variant={field.value === 'female' ? 'default' : 'outline'}
                          className={cn(
                            "flex-1 flex items-center justify-center gap-2",
                            field.value === 'female' ? 'bg-pink-500 text-white hover:bg-pink-600' : ''
                          )}
                          onClick={() => {
                            field.onChange('female');
                          }}
                        >
                          <Heart className="h-5 w-5" />
                          <span>Женский</span>
                        </Button>
                        <Button 
                          type="button"
                          variant="ghost" 
                          className="w-10 p-0 flex items-center justify-center text-gray-500 hover:text-red-500"
                          onClick={() => {
                            field.onChange('');
                          }}
                        >
                          <XCircle className="h-5 w-5" />
                        </Button>
                      </div>
                      {form.formState.errors.gender && (
                        <p className="text-sm font-medium text-destructive">{form.formState.errors.gender.message}</p>
                      )}
                    </div>
                  )}
                />
                
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
                        <LocationSelector 
                          value={field.value || ''} 
                          onChange={field.onChange}
                          disabled={isSubmitting}
                        />
                      </FormControl>
                      <FormDescription>
                        Выберите местоположение из списка городов России
                      </FormDescription>
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
                  name="average_work_time"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Среднее время работы</FormLabel>
                      <FormControl>
                        <select
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          {...field}
                          value={field.value || ''}
                        >
                          <option value="">Выберите среднее время работы</option>
                          <option value="up_to_24_hours">До 24 часов</option>
                          <option value="up_to_3_days">До 3 дней</option>
                          <option value="up_to_10_days">До 10 дней</option>
                          <option value="up_to_14_days">До 14 дней</option>
                          <option value="up_to_30_days">До 30 дней</option>
                          <option value="up_to_60_days">До 60 дней</option>
                          <option value="more_than_60_days">Более 60 дней</option>
                        </select>
                      </FormControl>
                      <FormDescription>
                        Укажите среднее время выполнения заказа
                      </FormDescription>
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
                                <Select 
                                  value={field.value} 
                                  onValueChange={field.onChange}
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Выберите платформу" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="facebook">Facebook</SelectItem>
                                    <SelectItem value="youtube">YouTube</SelectItem>
                                    <SelectItem value="twitter">Twitter</SelectItem>
                                    <SelectItem value="instagram">Instagram</SelectItem>
                                    <SelectItem value="whatsapp">WhatsApp</SelectItem>
                                    <SelectItem value="tiktok">TikTok</SelectItem>
                                    <SelectItem value="linkedin">LinkedIn</SelectItem>
                                    <SelectItem value="telegram">Telegram</SelectItem>
                                    <SelectItem value="pinterest">Pinterest</SelectItem>
                                    <SelectItem value="reddit">Reddit</SelectItem>
                                    <SelectItem value="vkontakte">ВКонтакте</SelectItem>
                                    <SelectItem value="dzen">Дзен</SelectItem>
                                    <SelectItem value="twitch">Twitch</SelectItem>
                                  </SelectContent>
                                </Select>
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
                                <Input 
                                  placeholder={getUrlPlaceholder(form.watch(`social_links.${index}.platform`))} 
                                  {...field} 
                                />
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