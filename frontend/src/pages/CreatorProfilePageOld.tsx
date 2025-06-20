import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
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
  FileText,
  Briefcase,
  Star,
  Calendar,
  Globe,
  Instagram,
  Github,
  Linkedin,
  Twitter,
  Plus,
  Image
} from 'lucide-react';
import * as z from 'zod';

import { useAuth } from '@/contexts/AuthContext';
import { useCreatorProfile } from '@/hooks/useCreatorProfile';
import apiClient from '@/api/client';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { toast } from '@/components/ui/use-toast';
import { Progress } from '@/components/ui/progress';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

// Схемы валидации форм
const skillSchema = z.object({
  name: z.string().min(1, 'Название навыка обязательно')
});

const portfolioItemSchema = z.object({
  title: z.string().min(1, 'Название работы обязательно'),
  description: z.string().min(1, 'Описание работы обязательно'),
  category: z.string().optional(),
  image: z.any().optional()
});

const serviceSchema = z.object({
  title: z.string().min(1, 'Название услуги обязательно'),
  description: z.string().min(1, 'Описание услуги обязательно'),
  price: z.string().refine((val) => !Number.isNaN(parseFloat(val)), {
    message: 'Цена должна быть числом'
  })
});

const socialLinksSchema = z.object({
  website: z.string().url({ message: 'Некорректный URL' }).optional().or(z.literal('')),
  twitter: z.string().url({ message: 'Некорректный URL' }).optional().or(z.literal('')),
  instagram: z.string().url({ message: 'Некорректный URL' }).optional().or(z.literal('')),
  linkedin: z.string().url({ message: 'Некорректный URL' }).optional().or(z.literal('')),
  github: z.string().url({ message: 'Некорректный URL' }).optional().or(z.literal(''))
});

// Типы для форм
type SkillFormValues = z.infer<typeof skillSchema>;
type PortfolioItemFormValues = z.infer<typeof portfolioItemSchema>;
type ServiceFormValues = z.infer<typeof serviceSchema>;
type SocialLinksFormValues = z.infer<typeof socialLinksSchema>;

/**
 * Компонент страницы профиля креатора
 * 
 * Отображает все данные профиля креатора: основную информацию,
 * портфолио, навыки, рейтинг, отзывы и настройки.
 */
// Функция для отображения текстового описания уровня навыка
const getSkillLevelText = (level: number): string => {
  switch (level) {
    case 0:
      return 'Не указан';
    case 1:
      return 'Начальный';
    case 2:
      return 'Средний';
    case 3:
      return 'Продвинутый';
    case 4:
      return 'Высокий';
    case 5:
      return 'Эксперт';
    default:
      return `Уровень ${level}`;
  }
};

const CreatorProfilePage = () => {
  const navigate = useNavigate();
  const { id } = useParams(); // Получаем id из URL
  const { isAuthenticated, user } = useAuth();
  // Если id отсутствует (маршрут /creator-profile), вызываем хук без параметра для получения собственного профиля
  // Иначе используем id из URL для получения конкретного профиля
  const { creator, loading, error, reload } = useCreatorProfile(!id ? undefined : id);
  const [activeTab, setActiveTab] = useState('profile');
  const [isOwnProfile, setIsOwnProfile] = useState(false);
  
  // Состояния для модальных окон
  const [isAddSkillDialogOpen, setIsAddSkillDialogOpen] = useState(false);
  const [isAddSocialDialogOpen, setIsAddSocialDialogOpen] = useState(false);
  const [isAddPortfolioDialogOpen, setIsAddPortfolioDialogOpen] = useState(false);
  const [isAddServiceDialogOpen, setIsAddServiceDialogOpen] = useState(false);
  
  // Состояния для форм загрузки файлов
  const [portfolioImage, setPortfolioImage] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  
  // Проверка наличия ошибок
  useEffect(() => {
    if (error) {
      console.error('Ошибка загрузки профиля креатора:', error);
    }
  }, [error]);

  // Если пользователь не авторизован - перенаправляем на страницу входа
  useEffect(() => {
    if (!isAuthenticated && !loading) {
      navigate('/login');
    }
  }, [isAuthenticated, loading, navigate]);

  // Функция для создания профиля креатора
  const createCreatorProfile = async () => {
    try {
      // Отправляем запрос на создание профиля
      await apiClient.post('creator-profiles/', {
        // Минимальные данные для создания профиля
        title: `Профиль ${user?.first_name || ''} ${user?.last_name || ''}`.trim(),
        available_for_hire: true
      });
      
      toast({
        title: "Профиль создан",
        description: "Ваш профиль креатора успешно создан. Теперь вы можете добавить дополнительную информацию.",
      });
      
      // Обновляем данные профиля
      reload();
    } catch (error) {
      console.error("Ошибка при создании профиля креатора:", error);
      toast({
        title: "Ошибка",
        description: "Не удалось создать профиль креатора. Пожалуйста, попробуйте снова позже.",
        variant: "destructive",
      });
    }
  };
  
  // Функция для обновления статуса доступности креатора
  const toggleAvailability = async (value: boolean) => {
    try {
      if (creator) {
        await apiClient.patch(`creator-profiles/${creator.id}/update_status/`, {
          available_for_hire: value
        });
        toast({
          title: "Статус обновлен",
          description: value ? "Теперь вы доступны для заказов" : "Вы отметили, что не доступны для заказов",
        });
        reload();
      }
    } catch (error) {
      console.error("Ошибка при обновлении статуса:", error);
      toast({
        title: "Ошибка",
        description: "Не удалось обновить статус доступности",
        variant: "destructive",
      });
    }
  };

  // Функция для добавления навыков
  const addSkill = async (data: SkillFormValues) => {
    try {
      setIsUploading(true);
      if (!creator) {
        throw new Error("Профиль креатора не найден");
      }

      // Получаем текущие навыки
      const currentSkills = creator.skills || [];
      
      // Проверяем, есть ли уже такой навык
      const skillExists = currentSkills.some(
        (skill) => skill.name.toLowerCase() === data.name.toLowerCase()
      );

      if (skillExists) {
        toast({
          title: "Внимание",
          description: `Навык "${data.name}" уже добавлен в ваш профиль`,
          variant: "default",
        });
        setIsAddSkillDialogOpen(false);
        return;
      }

      // Формируем новый массив навыков
      const updatedSkills = [...currentSkills, { name: data.name, level: 1 }];

      // Обновляем профиль
      await apiClient.patch(`creator-profiles/${creator.id}/`, {
        skills: updatedSkills.map(skill => {
          // Проверяем тип навыка и правильно формируем объект
          if ('skill' in skill && skill.skill) {
            return { name: skill.skill.name, level: skill.level };
          } else if ('name' in skill) {
            return { name: skill.name, level: skill.level || 1 };
          } 
          return { name: 'Неизвестный навык', level: 1 };
        })
      });

      toast({
        title: "Навык добавлен",
        description: `Навык "${data.name}" успешно добавлен в ваш профиль`,
      });

      // Перезагружаем данные профиля
      reload();
      setIsAddSkillDialogOpen(false);
    } catch (error) {
      console.error("Ошибка при добавлении навыка:", error);
      toast({
        title: "Ошибка",
        description: "Не удалось добавить навык. Пожалуйста, попробуйте позже.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };
  
  // Функция для добавления соцсетей
  const updateSocialLinks = async (data: SocialLinksFormValues) => {
    try {
      setIsUploading(true);
      if (!creator) {
        throw new Error("Профиль креатора не найден");
      }
      
      // Фильтруем пустые ссылки и преобразуем в формат массива объектов
      const socialLinksArray = Object.entries(data)
        .filter(([_, value]) => value && value.trim() !== '')
        .map(([name, url]) => ({ name, url }));

      // Обновляем профиль креатора
      await apiClient.patch(`creator-profiles/${creator.id}/`, {
        social_links: socialLinksArray
      });

      toast({
        title: "Социальные сети обновлены",
        description: "Ссылки на ваши социальные сети успешно обновлены"
      });

      reload();
      setIsAddSocialDialogOpen(false);
    } catch (error) {
      console.error("Ошибка при обновлении социальных сетей:", error);
      toast({
        title: "Ошибка",
        description: "Не удалось обновить ссылки на социальные сети",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
    }
  };
  
  // Функция для добавления работы в портфолио
  const addPortfolioItem = async (data: PortfolioItemFormValues) => {
    try {
      setIsUploading(true);
      if (!creator) {
        throw new Error("Профиль креатора не найден");
      }
      
      // Создаем новую работу в портфолио
      const formData = new FormData();
      formData.append('title', data.title);
      formData.append('description', data.description);
      if (data.category) formData.append('category', data.category);
      if (portfolioImage) formData.append('image', portfolioImage);
      
      // Связываем с текущим профилем креатора
      formData.append('creator_profile', creator.id.toString());
      
      // Отправляем запрос на создание новой работы
      await apiClient.post('portfolio/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      toast({
        title: "Работа добавлена",
        description: `${data.title} успешно добавлена в ваше портфолио`,
      });
      
      // Сбрасываем загруженное изображение
      setPortfolioImage(null);
      
      // Обновляем профиль
      reload();
      setIsAddPortfolioDialogOpen(false);
    } catch (error) {
      console.error("Ошибка при добавлении работы в портфолио:", error);
      toast({
        title: "Ошибка",
        description: "Не удалось добавить работу в портфолио",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
    }
  };
  
  // Функция для добавления услуги
  const addService = async (data: ServiceFormValues) => {
    try {
      setIsUploading(true);
      if (!creator) {
        throw new Error("Профиль креатора не найден");
      }
      
      // Создаем новую услугу
      const response = await apiClient.post('/services/', {
        title: data.title,
        description: data.description,
        price: parseFloat(data.price),
        creator_profile: creator.id
      });
      
      toast({
        title: "Услуга добавлена",
        description: `${data.title} успешно добавлена в ваш список услуг`,
      });
      
      // Обновляем профиль
      reload();
      setIsAddServiceDialogOpen(false);
    } catch (error) {
      console.error("Ошибка при добавлении услуги:", error);
      toast({
        title: "Ошибка",
        description: "Не удалось добавить услугу",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
    }
  };
  
  // Функция для обработки загрузки изображения
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setPortfolioImage(e.target.files[0]);
    }
  };
  
  // Инициализация формы для добавления навыка
  const skillForm = useForm<SkillFormValues>({
    resolver: zodResolver(skillSchema),
    defaultValues: {
      name: ""
    }
  });
  
  // Инициализация формы для социальных сетей
  const socialLinksForm = useForm<SocialLinksFormValues>({
    resolver: zodResolver(socialLinksSchema),
    defaultValues: {
      website: "",
      twitter: "",
      instagram: "",
      linkedin: "",
      github: ""
    }
  });
  
  // Инициализация формы для добавления работы в портфолио
  const portfolioItemForm = useForm<PortfolioItemFormValues>({
    resolver: zodResolver(portfolioItemSchema),
    defaultValues: {
      title: "",
      description: "",
      category: ""
    }
  });
  
  // Инициализация формы для добавления услуги
  const serviceForm = useForm<ServiceFormValues>({
    resolver: zodResolver(serviceSchema),
    defaultValues: {
      title: "",
      description: "",
      price: ""
    }
  });

  // Если идет загрузка - показываем индикатор
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Загрузка профиля...</p>
        </div>
      </div>
    );
  }

  // Если есть ошибка - показываем сообщение об ошибке
  if (error) {
    return (
      <Alert variant="destructive" className="max-w-4xl mx-auto mt-8">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Ошибка загрузки профиля</AlertTitle>
        <AlertDescription>
          {error.message || "Не удалось загрузить профиль. Пожалуйста, попробуйте позже."}
        </AlertDescription>
      </Alert>
    );
  }

  // Если профиль не найден, предлагаем его создать
  if (!creator) {
    return (
      <div className="max-w-4xl mx-auto p-4 md:p-8">
        {user && user.has_creator_profile ? (
          <Alert className="mb-6" variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Проблема с профилем креатора</AlertTitle>
            <AlertDescription>
              У вас должен быть профиль креатора, но он не найден. Это может быть вызвано ошибкой на сервере или проблемой с данными.
              <div className="mt-4">
                <Button variant="outline" onClick={createCreatorProfile}>
                  Создать профиль заново
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        ) : (
          <Alert className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Профиль креатора не найден</AlertTitle>
            <AlertDescription>
              У вас пока нет профиля креатора. Создайте профиль, чтобы начать предлагать свои услуги.
              <div className="mt-4">
                <Button onClick={createCreatorProfile}>
                  Создать профиль креатора
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        )}
        
        <Card>
          <CardHeader>
            <CardTitle>Что такое профиль креатора?</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4">
              Профиль креатора позволяет вам:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Размещать свои работы в портфолио</li>
              <li>Получать заказы от клиентов</li>
              <li>Устанавливать стоимость своих услуг</li>
              <li>Участвовать в тендерах на проекты</li>
              <li>Получать рейтинг и отзывы от клиентов</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Если профиль найден - отображаем его
  return (
    <>
    <div className="pb-12">
      {/* Верхняя секция с фоном и аватаром */}
      <div className="relative h-48 bg-gradient-to-r from-slate-800 to-slate-700">
        <div className="absolute -bottom-16 left-8">
          <Avatar className="h-32 w-32 border-4 border-white">
            <AvatarImage src={creator.user?.avatar || ""} alt={creator.user?.username || ""} />
            <AvatarFallback className="text-3xl">
              {creator.user?.username?.charAt(0).toUpperCase() || "U"}
            </AvatarFallback>
          </Avatar>
        </div>
      </div>

      <Card className="w-full mb-6">
        <CardHeader>
          <CardTitle>О креаторе</CardTitle>
        </CardHeader>
        <CardContent>
          {creator.user?.bio ? (
            <div className="prose max-w-none">{creator.user.bio}</div>
          ) : (
            <div className="text-gray-500">Пользователь не добавил информацию о себе</div>
          )}
          {/* Личная информация */}
          <div className="mt-6 space-y-4">
            <div className="flex items-center">
              <User className="h-4 w-4 mr-2 text-gray-500" />
              <span>
                {creator.user?.first_name && creator.user?.last_name
                  ? `${creator.user.first_name} ${creator.user.last_name}`
                  : creator.user?.username || "Имя не указано"}
              </span>
            </div>

            {creator.user?.email && (
              <div className="flex items-center">
                <Mail className="h-4 w-4 mr-2 text-gray-500" />
                <span>{creator.user.email}</span>
              </div>
            )}

            {creator.created_at && (
              <div className="flex items-center">
                <Calendar className="h-4 w-4 mr-2 text-gray-500" />
                <span>На платформе с {new Date(creator.created_at).toLocaleDateString()}</span>
              </div>
            )}

            <div className="pt-2">
              <Button
                variant={creator.available_for_hire ? "outline" : "default"}
                onClick={() => toggleAvailability(!creator.available_for_hire)}
              >
                {creator.available_for_hire ? "Отключить доступность" : "Включить доступность"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Основной контент */}
      <div className="container mx-auto mt-20 px-4">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Левая колонка: статус, навыки, соцсети */}
          <div className="w-full md:w-1/3 space-y-6">
            {/* Плашка статуса доступности */}
            <Badge variant={creator.available_for_hire ? "default" : "outline"}>
              {creator.available_for_hire ? "Доступен для заказов" : "Не принимает заказы"}
            </Badge>
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Навыки</CardTitle>
              </CardHeader>
              <CardContent>
                {creator.skills && creator.skills.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {creator.skills.map((skill, index) => (
                      <Badge key={index} variant="secondary">
                        {('skill' in skill && skill.skill?.name) || ('name' in skill && skill.name) || 'Неизвестный навык'}
                        {('level' in skill ? ` (${skill.level})` : '')}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4 text-gray-500">
                    <p>Навыки не указаны</p>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="mt-2" 
                      onClick={() => setIsAddSkillDialogOpen(true)}
                    >
                      <Edit className="mr-2 h-4 w-4" />
                      Добавить навыки
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Социальные сети</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {/* Отрисовываем ссылки, поддерживая как новый (массив объектов) так и старый (объект) формат */}
                  {Array.isArray(creator.social_links) && creator.social_links.length > 0 && (
                    creator.social_links.map((link) => {
                      const Icon = (() => {
                        switch (link.name) {
                          case 'instagram':
                            return Instagram;
                          case 'github':
                            return Github;
                          case 'linkedin':
                            return Linkedin;
                          case 'twitter':
                            return Twitter;
                          case 'website':
                            return Globe;
                          default:
                            return Globe;
                        }
                      })();
                      return (
                        <a
                          key={link.name}
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center text-blue-600 hover:underline"
                        >
                          <Icon className="h-4 w-4 mr-2" />
                          <span>{link.name.charAt(0).toUpperCase() + link.name.slice(1)}</span>
                        </a>
                      );
                    })
                  )}
                  {/* Старый формат объекта */}
                  {creator.social_links && !Array.isArray(creator.social_links) && creator.social_links.instagram && (
                    <a href={creator.social_links.instagram} target="_blank" rel="noopener noreferrer" className="flex items-center text-blue-600 hover:underline">
                      <Instagram className="h-4 w-4 mr-2" />
                      <span>Instagram</span>
                    </a>
                  )}
                  
                  {creator.social_links && !Array.isArray(creator.social_links) && creator.social_links.github && (
                    <a href={creator.social_links.github} target="_blank" rel="noopener noreferrer" className="flex items-center text-blue-600 hover:underline">
                      <Github className="h-4 w-4 mr-2" />
                      <span>GitHub</span>
                    </a>
                  )}
                  
                  {creator.social_links && !Array.isArray(creator.social_links) && creator.social_links.linkedin && (
                    <a href={creator.social_links.linkedin} target="_blank" rel="noopener noreferrer" className="flex items-center text-blue-600 hover:underline">
                      <Linkedin className="h-4 w-4 mr-2" />
                      <span>LinkedIn</span>
                    </a>
                  )}
                  
                  {creator.social_links && !Array.isArray(creator.social_links) && creator.social_links.twitter && (
                    <a href={creator.social_links.twitter} target="_blank" rel="noopener noreferrer" className="flex items-center text-blue-600 hover:underline">
                      <Twitter className="h-4 w-4 mr-2" />
                      <span>Twitter</span>
                    </a>
                  )}
                  
                  {((Array.isArray(creator.social_links) && creator.social_links.length > 0) || (!Array.isArray(creator.social_links) && Object.keys(creator.social_links).length > 0)) && (
                     <Button 
                       size="sm" 
                       variant="outline" 
                       className="mt-2"
                       onClick={() => setIsAddSocialDialogOpen(true)}
                     >
                       <Edit className="mr-2 h-4 w-4" />
                       Добавить соцсети
                     </Button>
                   )}
                   {(!creator.social_links || (Array.isArray(creator.social_links) && creator.social_links.length === 0) || (!Array.isArray(creator.social_links) && Object.keys(creator.social_links).length === 0)) && (
                    <div className="text-center py-4 text-gray-500">
                      <p>Социальные сети не указаны</p>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="mt-2"
                        onClick={() => setIsAddSocialDialogOpen(true)}
                      >
                        <Edit className="mr-2 h-4 w-4" />
                        Добавить соцсети
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Биография */}
          <div className="md:w-2/3">
            <Tabs defaultValue="portfolio">
              <TabsList className="grid grid-cols-3">
                <TabsTrigger value="portfolio">Портфолио</TabsTrigger>
                <TabsTrigger value="services">Услуги</TabsTrigger>
                <TabsTrigger value="reviews">Отзывы</TabsTrigger>
              </TabsList>
              <TabsContent value="portfolio">
                <Card>
                  <CardHeader>
                    <CardTitle>Портфолио</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {creator.portfolio_items && creator.portfolio_items.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {creator.portfolio_items.map((item, index) => (
                          <div key={index} className="rounded-lg overflow-hidden border">
                            {(item.cover_image || item.image) && (
                              <img 
                                src={item.cover_image || item.image} 
                                alt={item.title} 
                                className="w-full h-48 object-cover"
                              />
                            )}
                            <div className="p-4">
                              <h3 className="font-medium">{item.title}</h3>
                              <p className="text-sm text-gray-500 mt-1">{item.description}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <FileText className="mx-auto h-12 w-12 opacity-30" />
                        <p className="mt-2">В портфолио пока нет работ</p>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="mt-4"
                          onClick={() => setIsAddPortfolioDialogOpen(true)}
                        >
                          <Edit className="mr-2 h-4 w-4" />
                          Добавить работу
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="services">
                <Card>
                  <CardHeader>
                    <CardTitle>Услуги</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {creator.services && creator.services.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {creator.services.map((svc, index) => (
                          <div key={index} className="rounded-lg border p-4 flex flex-col justify-between">
                            <div>
                              <h3 className="font-medium text-lg">{svc.title}</h3>
                              <p className="text-sm text-gray-500 mt-1 line-clamp-3">{svc.description}</p>
                            </div>
                            <div className="mt-4 flex items-center justify-between">
                              <span className="text-primary font-semibold">{svc.price} ₽</span>
                              <Button size="sm" variant="outline" onClick={() => navigate(`/services/${svc.slug}`)}>
                                Подробнее
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <p>Услуг пока нет</p>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="mt-4"
                          onClick={() => setIsAddServiceDialogOpen(true)}
                        >
                          <Edit className="mr-2 h-4 w-4" />
                          Добавить услугу
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="reviews">
                <Card>
                  <CardHeader>
                    <CardTitle>Отзывы клиентов</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-8 text-gray-500">
                      <Star className="mx-auto h-12 w-12 opacity-30" />
                      <p className="mt-2">Пока нет отзывов</p>
                      <p className="text-sm mt-2">Отзывы появятся после выполнения заказов</p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>

    {/* Диалог для добавления навыка */}
    <Dialog open={isAddSkillDialogOpen} onOpenChange={setIsAddSkillDialogOpen}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Добавить навык</DialogTitle>
        </DialogHeader>
        <Form {...skillForm}>
          <form onSubmit={skillForm.handleSubmit(addSkill)} className="space-y-4">
            <FormField
              control={skillForm.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Название навыка</FormLabel>
                  <FormControl>
                    <Input placeholder="Например: React, JavaScript, Photoshop" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => setIsAddSkillDialogOpen(false)} 
                disabled={isUploading}
                type="button"
              >
                Отмена
              </Button>
              <Button type="submit" disabled={isUploading}>
                {isUploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Сохранить
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
    
    {/* Диалог для добавления социальных сетей */}
    <Dialog open={isAddSocialDialogOpen} onOpenChange={setIsAddSocialDialogOpen}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Управление социальными сетями</DialogTitle>
          <DialogDescription>
            Добавьте ссылки на ваши профили в социальных сетях
          </DialogDescription>
        </DialogHeader>
        <Form {...socialLinksForm}>
          <form onSubmit={socialLinksForm.handleSubmit(updateSocialLinks)} className="space-y-4">
            <FormField
              control={socialLinksForm.control}
              name="website"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Сайт</FormLabel>
                  <FormControl>
                    <div className="flex items-center">
                      <Globe className="mr-2 h-4 w-4 text-gray-500" />
                      <Input placeholder="https://yourwebsite.com" {...field} />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={socialLinksForm.control}
              name="twitter"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Twitter</FormLabel>
                  <FormControl>
                    <div className="flex items-center">
                      <Twitter className="mr-2 h-4 w-4 text-gray-500" />
                      <Input placeholder="https://twitter.com/username" {...field} />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={socialLinksForm.control}
              name="instagram"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Instagram</FormLabel>
                  <FormControl>
                    <div className="flex items-center">
                      <Instagram className="mr-2 h-4 w-4 text-gray-500" />
                      <Input placeholder="https://instagram.com/username" {...field} />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={socialLinksForm.control}
              name="linkedin"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>LinkedIn</FormLabel>
                  <FormControl>
                    <div className="flex items-center">
                      <Linkedin className="mr-2 h-4 w-4 text-gray-500" />
                      <Input placeholder="https://linkedin.com/in/username" {...field} />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={socialLinksForm.control}
              name="github"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>GitHub</FormLabel>
                  <FormControl>
                    <div className="flex items-center">
                      <Github className="mr-2 h-4 w-4 text-gray-500" />
                      <Input placeholder="https://github.com/username" {...field} />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => setIsAddSocialDialogOpen(false)} 
                disabled={isUploading}
                type="button"
              >
                Отмена
              </Button>
              <Button type="submit" disabled={isUploading}>
                {isUploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Сохранить
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
    
    {/* Диалог для добавления работы в портфолио */}
    <Dialog open={isAddPortfolioDialogOpen} onOpenChange={setIsAddPortfolioDialogOpen}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Добавить работу в портфолио</DialogTitle>
          <DialogDescription>
            Заполните данные о вашей работе и загрузите изображение
          </DialogDescription>
        </DialogHeader>
        <Form {...portfolioItemForm}>
          <form onSubmit={portfolioItemForm.handleSubmit(addPortfolioItem)} className="space-y-4">
            <FormField
              control={portfolioItemForm.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Название работы</FormLabel>
                  <FormControl>
                    <Input placeholder="Укажите название работы" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={portfolioItemForm.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Описание</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Опишите вашу работу, использованные технологии и достигнутые результаты" className="h-20" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={portfolioItemForm.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Категория</FormLabel>
                  <FormControl>
                    <Input placeholder="Например: Дизайн, Разработка, Маркетинг" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="space-y-2">
              <FormLabel>Изображение</FormLabel>
              <div className="flex items-center gap-4">
                <Input 
                  type="file" 
                  accept="image/*" 
                  onChange={handleImageChange} 
                  className="max-w-xs"
                />
                {portfolioImage && (
                  <div className="text-sm text-green-600 flex items-center gap-1">
                    <Image className="w-4 h-4" />
                    Изображение выбрано: {portfolioImage.name}
                  </div>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => {
                  setIsAddPortfolioDialogOpen(false);
                  setPortfolioImage(null);
                }} 
                disabled={isUploading}
                type="button"
              >
                Отмена
              </Button>
              <Button type="submit" disabled={isUploading}>
                {isUploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Сохранить
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
    
    {/* Диалог для добавления услуги */}
    <Dialog open={isAddServiceDialogOpen} onOpenChange={setIsAddServiceDialogOpen}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Добавить новую услугу</DialogTitle>
          <DialogDescription>
            Заполните информацию о вашей услуге и её стоимости
          </DialogDescription>
        </DialogHeader>
        <Form {...serviceForm}>
          <form onSubmit={serviceForm.handleSubmit(addService)} className="space-y-4">
            <FormField
              control={serviceForm.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Название услуги</FormLabel>
                  <FormControl>
                    <Input placeholder="Название вашей услуги" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={serviceForm.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Описание</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Подробное описание вашей услуги" className="h-20" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={serviceForm.control}
              name="price"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Цена (в рублях)</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="Например: 1000" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => setIsAddServiceDialogOpen(false)} 
                disabled={isUploading}
                type="button"
              >
                Отмена
              </Button>
              <Button type="submit" disabled={isUploading}>
                {isUploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Сохранить
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
    </>
  );
};

export default CreatorProfilePage;
