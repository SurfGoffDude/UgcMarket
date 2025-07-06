import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, HelpCircle, Info, Loader2, Plus, Upload, X } from "lucide-react";
import { useState, useEffect, useRef, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Input } from '@/components/ui/input';
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
import { FileUploader } from '@/components/FileUploader/FileUploader';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

/**
 * Схема валидации формы добавления работы в портфолио
 */
const formSchema = z.object({
  title: z.string().min(3, "Минимум 3 символа").max(255, "Максимум 255 символов"),
  description: z.string().min(10, "Минимум 10 символов"),
  // Поля для файлов добавляем отдельно, так как они не обрабатываются стандартно через react-hook-form
  external_url: z.string().url("Введите корректную ссылку").optional().or(z.literal('')),
});

/**
 * Определяем тип данных формы на основе схемы
 */
type FormData = z.infer<typeof formSchema>;

/**
 * Интерфейс для дополнительных изображений
 */
interface AdditionalImage {
  id: number;
  file: File;
  preview: string;
  caption: string;
}

/**
 * Страница добавления работы в портфолио креатора
 */
const PortfolioAddPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [creatorId, setCreatorId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [additionalImages, setAdditionalImages] = useState<AdditionalImage[]>([]);
  const [additionalFileIds, setAdditionalFileIds] = useState<string[]>([]);
  const [portfolioItemsCount, setPortfolioItemsCount] = useState<number>(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Максимально допустимое количество работ в портфолио
  const MAX_PORTFOLIO_ITEMS = 10;
  
  // Определяем поддерживаемые форматы файлов
  const acceptedFileTypes = {
    // Используем конкретные MIME-типы вместо общих категорий
    'image/jpeg': ['.jpg', '.jpeg'],
    'image/png': ['.png'],
    'image/webp': ['.webp'],
    'image/gif': ['.gif'],
    'image/svg+xml': ['.svg'],
  };
  
  /**
   * Инициализация формы с настройкой валидации
   */
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      description: '',
      external_url: '',
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
          
          // Получаем количество работ в портфолио
          const portfolioRes = await apiClient.get(`/portfolio/?creator_profile=${creatorData.id}`);
          const portfolioCount = portfolioRes.data.count || 0;
          setPortfolioItemsCount(portfolioCount);
          
          // Проверяем, достигнут ли лимит работ
          if (portfolioCount >= MAX_PORTFOLIO_ITEMS) {
            toast({
              title: 'Достигнут лимит',
              description: `Вы уже добавили максимальное количество работ (${MAX_PORTFOLIO_ITEMS}) в ваше портфолио.`,
              variant: 'default',
            });
          }
        } else {
          toast({
            title: 'Ошибка',
            description: 'Профиль креатора не найден. Сначала создайте профиль креатора.',
            variant: 'destructive',
          });
          navigate('/profile/edit');
        }
      } catch (err) {

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
   * Обработчик выбора файла обложки через стандартный input
   */
  const handleCoverImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      
      // Проверяем тип файла
      const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
      if (!validTypes.includes(file.type)) {
        toast({
          title: 'Ошибка',
          description: 'Недопустимый формат файла! Поддерживаемые форматы: JPG, PNG, WEBP, GIF',
          variant: 'destructive',
        });
        return;
      }
      
      // Проверяем размер файла (макс. 10МБ)
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: 'Ошибка',
          description: 'Файл слишком большой! Максимальный размер: 10MB',
          variant: 'destructive',
        });
        return;
      }
      
      // Устанавливаем файл и создаем URL для предпросмотра
      setCoverFile(file);
      const fileURL = URL.createObjectURL(file);
      setCoverPreview(fileURL);
      
      console.log('Выбран файл обложки:', file.name, 'размер:', (file.size / (1024 * 1024)).toFixed(2) + 'MB');
    }
  };

  /**
   * Обработчик успешной загрузки обложки
   */
  const handleCoverUploadComplete = useCallback((fileIds: string[]) => {
    if (fileIds.length > 0) {
      // Получаем информацию о загруженном файле
      apiClient.get(`/files/${fileIds[0]}/`)
        .then(response => {
          const fileData = response.data;
          setCoverFile(new File([], fileData.filename, { type: fileData.mimetype }));
          setCoverPreview(fileData.url);
          toast({
            title: 'Успешно',
            description: 'Обложка успешно загружена'
          });
        })
        .catch(err => {
          toast({
            title: 'Ошибка',
            description: 'Не удалось получить информацию о загруженном файле',
            variant: 'destructive',
          });
        });
    }
  }, []);

  /**
   * Загружаем файл на сервер с указанием ID портфолио
   */
  const uploadFileWithPortfolioId = async (file: File, portfolioItemId: number, order: number = 0, caption: string = '') => {
    try {
      console.log(`Начало загрузки файла для portfolio_item=${portfolioItemId}, order=${order}`);
      
      // Проверка параметров перед формированием FormData
      if (!portfolioItemId) {
        console.error('Ошибка: portfolio_item не указан или равен 0');
        throw new Error('portfolio_item не указан');
      }
      
      if (!file || !(file instanceof File)) {
        console.error('Ошибка: файл не передан или неверного типа', file);
        throw new Error('Файл не передан или неверного типа');
      }
      
      // Создаем FormData для отправки файла
      const formData = new FormData();
      
      // Сначала добавляем основные поля
      formData.append('portfolio_item', String(portfolioItemId));
      formData.append('order', String(order));
      
      if (caption) {
        formData.append('caption', caption);
      }
      
      // Добавляем файл под названием 'image' - это критически важно!
      formData.append('image', file, file.name);
      
      // Для отладки выводим содержимое FormData
      console.log('Содержимое FormData для загрузки файла:');
      for (const pair of formData.entries()) {
        console.log(pair[0] + ': ' + (pair[1] instanceof File ? `[File: ${(pair[1] as File).name}, ${(pair[1] as File).type}, ${(pair[1] as File).size} bytes]` : pair[1]));
      }
      
      // Проверка, что formData не пуста
      let hasEntries = false;
      for (const _ of formData.entries()) {
        hasEntries = true;
        break;
      }
      
      if (!hasEntries) {
        console.error('Ошибка: FormData пустой');
        throw new Error('FormData пустой');
      }
      
      console.log('Отправляем POST запрос на /portfolio-images/ с данными:', {
        'portfolio_item': portfolioItemId,
        'order': order,
        'caption': caption,
        'image': `[File: ${file.name}, ${file.type}, ${file.size} bytes]`
      });
      
      // Проверим тип данных в консоли
      console.log('Тип portfolio_item:', typeof portfolioItemId);
      
      // Отправляем запрос на загрузку изображения портфолио
      // НЕ устанавливаем заголовок Content-Type вручную,
      // позволим axios автоматически установить правильный заголовок для multipart/form-data
      // с правильной границей (boundary)
      const response = await apiClient.post('/portfolio-images/', formData);
      
      console.log('Успешная загрузка файла:', response.data);
      return response.data;
      
    } catch (error: any) {
      console.error('Ошибка при загрузке файла:', error);
      
      // Подробная информация об ошибке для отладки
      if (error.response) {
        console.error('Ответ сервера:', {
          data: error.response.data,
          status: error.response.status,
          headers: error.response.headers,
        });
      } else if (error.request) {
        console.error('Запрос был отправлен, но ответ не получен', error.request);
      } else {
        console.error('Ошибка при настройке запроса', error.message);
      }
      
      throw error;
    }
  };

  /**
   * Обработчик успешной загрузки дополнительных файлов
   */
  const handleAdditionalFilesSelect = (files: File[]) => {
    // Создаем превью для выбранных файлов
    const newImages = files.map((file, index) => {
      const preview = URL.createObjectURL(file);
      return {
        id: Date.now() + index, // Временный уникальный ID
        file,
        preview,
        caption: ''
      };
    });
    
    setAdditionalImages(prev => [...prev, ...newImages]);
  };

  /**
   * Обработчик удаления дополнительного изображения
   */
  const handleRemoveAdditionalImage = (id: number) => {
    const updatedImages = additionalImages.filter(img => img.id !== id);
    
    // Освобождаем URL объекта для избежания утечки памяти
    const removedImage = additionalImages.find(img => img.id === id);
    if (removedImage) {
      URL.revokeObjectURL(removedImage.preview);
    }
    
    setAdditionalImages(updatedImages);
  };

  /**
   * Обработчик изменения подписи к дополнительному изображению
   */
  const handleCaptionChange = (id: number, caption: string) => {
    setAdditionalImages(
      additionalImages.map(img => 
        img.id === id ? { ...img, caption } : img
      )
    );
  };

  /**
   * Функция очистки URL объектов при размонтировании компонента
   */
  useEffect(() => {
    return () => {
      if (coverPreview) {
        URL.revokeObjectURL(coverPreview);
      }
      additionalImages.forEach(img => {
        URL.revokeObjectURL(img.preview);
      });
    };
  }, [coverPreview, additionalImages]);

  /**
   * Обработчик отправки формы
   */
  const onSubmit = async (data: FormData) => {
    if (!creatorId) {
      toast({
        title: 'Ошибка',
        description: 'Профиль креатора не найден',
        variant: 'destructive'
      });
      return;
    }
    
    if (!coverFile) {
      toast({
        title: 'Ошибка',
        description: 'Необходимо загрузить обложку работы',
        variant: 'destructive'
      });
      return;
    }
    
    // Проверка валидности файла обложки
    console.log('Тип файла обложки:', coverFile.type);
    
    // Список допустимых типов изображений
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/svg+xml'];
    
    if (!allowedTypes.includes(coverFile.type)) {
      toast({
        title: 'Ошибка',
        description: `Неподдерживаемый формат файла обложки: ${coverFile.type}. Поддерживаются только: ${allowedTypes.join(', ')}`,
        variant: 'destructive'
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // 1. Создаем FormData для отправки основных данных и обложки
      // Создаем новый FormData
      const formData = new FormData();
      
      // Добавляем основные поля
      // Не передаём creator_profile, так как он устанавливается автоматически в perform_create
      formData.append('title', data.title);
      formData.append('description', data.description);
      
      // Проверяем объект файла обложки перед добавлением
      console.log('Информация о файле обложки:', {
        name: coverFile.name,
        type: coverFile.type,
        size: coverFile.size,
        lastModified: coverFile.lastModified
      });
      
      // Создаем новый File-объект с корректными MIME-типами для гарантии правильной передачи
      const coverFileObject = new File([coverFile], coverFile.name, { type: coverFile.type });
      console.log('Создан File-объект для обложки с явным MIME-типом');
      
      // Отправляем файл обложки
      formData.append('cover_image', coverFileObject);
      
      // Передаем изображения как элементы массива uploaded_images[]
      // Для ListField нужно использовать формат имени поля с индексами
      // Добавляем обложку как первый элемент массива
      formData.append('uploaded_images[0]', coverFileObject);
      
      if (data.external_url) {
        formData.append('external_url', data.external_url);
      }
      
      // Для отладки выведем содержимое FormData
      console.log('Отправка элемента портфолио. Данные:');
      for (const pair of formData.entries()) {
        console.log(pair[0] + ': ' + (pair[0] === 'cover_image' ? 
          `[File: ${(pair[1] as File).name}, ${(pair[1] as File).type}, ${(pair[1] as File).size} bytes]` : 
          pair[1]));
      }
      
      // Используем apiClient для отправки данных
      console.log('Отправляем запрос через apiClient на /portfolio/...');
      const response = await apiClient.post('/portfolio/', formData);
      
      console.log('Ответ от сервера при создании портфолио:', response.data);
      
      // Получаем ID созданного элемента портфолио
      const portfolioItemId = response.data.id;
      console.log(`Получен ID портфолио: ${portfolioItemId}`);
      
      // Загружаем дополнительные изображения с указанием portfolio_item_id
      if (additionalImages.length > 0) {
        console.log(`Загрузка ${additionalImages.length} дополнительных изображений...`);
        
        // Используем функцию uploadFileWithPortfolioId
        const uploadPromises = additionalImages.map((img, idx) => {
          const orderNum = idx + 1;
          console.log(`Загрузка файла ${img.file.name} с order=${orderNum} и portfolio_item=${portfolioItemId}`);
          return uploadFileWithPortfolioId(img.file, portfolioItemId, orderNum, img.caption);
        });
        
        try {
          // Загружаем все изображения параллельно
          const results = await Promise.all(uploadPromises);
          console.log('Результаты загрузки дополнительных изображений:', results);
        } catch (uploadError) {
          console.error('Ошибка загрузки дополнительных изображений:', uploadError);
          // Показываем предупреждение, но не блокируем успешное создание портфолио
          toast({
            title: 'Предупреждение',
            description: 'Работа создана, но некоторые дополнительные изображения не были загружены',
            variant: 'default'
          });
        }
      }
      
      // Показываем уведомление об успехе
      toast({
        title: 'Успешно',
        description: 'Работа добавлена в портфолио',
        variant: 'default'
      });
      
      // Перенаправляем на страницу профиля
      navigate('/creator-profile');
    } catch (error: any) {
      let errorMessage = 'Не удалось добавить работу в портфолио';
      
      if (error.response) {
        console.error('Ошибка от сервера:', error.response);
        console.error('Статус ошибки:', error.response.status);
        console.error('Заголовки ответа:', error.response.headers);
        
        if (error.response.data) {
          console.error('Детали ошибки:', error.response.data);
          
          // Формируем сообщение об ошибке на основе ответа сервера
          const errorData = error.response.data;
          errorMessage = Object.entries(errorData)
            .map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(', ') : value}`)
            .join('; ');
        }
      } else if (error.request) {
        console.error('Ошибка запроса:', error.request);
      } else {
        console.error('Ошибка:', error.message);
      }
      

      toast({
        title: 'Ошибка',
        description: errorMessage,
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto py-12 max-w-2xl">
      <div className="flex items-center mb-6">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-2xl font-semibold ml-4">Добавление работы в портфолио</h1>
      </div>
      
      {/* Информация о лимите работ в портфолио */}
      {portfolioItemsCount > 0 && (
        <div className="mb-6 p-4 border rounded bg-muted">
          <div className="flex items-center gap-2">
            <Info className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">Информация о портфолио</p>
              <p className="text-sm text-muted-foreground">
                Добавлено работ: <span className={portfolioItemsCount >= MAX_PORTFOLIO_ITEMS ? "text-destructive font-medium" : ""}>{portfolioItemsCount}</span> из {MAX_PORTFOLIO_ITEMS} возможных
                {portfolioItemsCount >= MAX_PORTFOLIO_ITEMS && (
                  <span className="block mt-1 text-destructive">Достигнут лимит работ в портфолио. Удалите некоторые работы, чтобы добавить новые.</span>
                )}
              </p>
            </div>
          </div>
        </div>
      )}

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
                      <FormLabel>Название работы</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Введите название работы" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Описание работы</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          placeholder="Опишите вашу работу"
                          className="min-h-[120px]"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormItem>
                  <FormLabel>Обложка работы</FormLabel>
                  <FormDescription>
                    Загрузите основное изображение для работы
                  </FormDescription>
                  
                  <div className="mt-2">
                    {coverPreview ? (
                      <div className="relative border rounded aspect-video w-full overflow-hidden">
                        <img 
                          src={coverPreview} 
                          alt="Обложка" 
                          className="w-full h-full object-contain"
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          className="absolute top-2 right-2 h-8 w-8"
                          onClick={() => {
                            setCoverFile(null);
                            setCoverPreview(null);
                          }}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ) : (
                      <div className="file-uploader">
                        <div className="file-uploader__header">
                          <h3 className="file-uploader__title">Обложка работы</h3>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button variant="ghost" size="sm" className="file-uploader__info-button">
                                  <HelpCircle className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent className="file-uploader__tooltip-content" side="top">
                                <div className="file-uploader__info-content">
                                  <p><strong>Поддерживаемые форматы:</strong> JPG, PNG, WEBP, GIF</p>
                                  <p><strong>Максимальный размер:</strong> 10MB</p>
                                </div>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                        <label 
                          className="file-uploader__dropzone" 
                          htmlFor="cover-image-input"
                        >
                          <div className="file-uploader__content">
                            <Upload className="h-12 w-12 text-muted-foreground mb-2" />
                            <p>Перетащите файл сюда или кликните для выбора</p>
                            <p className="file-uploader__hint">Максимальный размер: 10MB</p>
                            <p className="file-uploader__formats">Поддерживаемые форматы: JPG, PNG, WEBP, GIF</p>
                          </div>
                          <input
                            id="cover-image-input"
                            type="file"
                            accept=".jpg,.jpeg,.png,.webp,.gif,image/jpeg,image/png,image/webp,image/gif"
                            className="hidden"
                            onChange={handleCoverImageSelect}
                          />
                        </label>
                      </div>
                    )}
                  </div>
                </FormItem>
                
                <FormField
                  control={form.control}
                  name="external_url"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Внешняя ссылка (необязательно)</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          placeholder="https://example.com/my-work" 
                          type="url"
                        />
                      </FormControl>
                      <FormDescription>
                        Ссылка на работу на внешнем ресурсе
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="space-y-3">
                  <FormLabel className="block">Дополнительные изображения</FormLabel>
                  <FormDescription>
                    Добавьте дополнительные изображения и файлы для демонстрации работы (до 5 файлов, макс. 10MB на файл)
                  </FormDescription>
                  
                  {/* Загрузка дополнительных файлов (без загрузки на сервер) */}
                  {additionalImages.length < 5 && (
                    <div className="file-uploader">
                      <div className="file-uploader__header">
                        <h3 className="file-uploader__title">Дополнительные файлы</h3>
                      </div>
                      <label 
                        className="file-uploader__dropzone" 
                        htmlFor="additional-files-input"
                      >
                        <div className="file-uploader__content">
                          <Upload className="h-12 w-12 text-muted-foreground mb-2" />
                          <p>Перетащите файлы сюда или кликните для выбора</p>
                          <p className="file-uploader__hint">Максимум {5 - additionalImages.length} файл(ов), до 10MB каждый</p>
                          <p className="file-uploader__formats">Поддерживаемые форматы: JPG, PNG, WEBP, GIF, SVG</p>
                        </div>
                        <input
                          id="additional-files-input"
                          type="file"
                          multiple={true}
                          accept=".jpg,.jpeg,.png,.webp,.gif,.svg,image/jpeg,image/png,image/webp,image/gif,image/svg+xml"
                          className="hidden"
                          onChange={(e) => {
                            if (e.target.files && e.target.files.length > 0) {
                              const filesToAdd = Array.from(e.target.files).slice(0, 5 - additionalImages.length);
                              handleAdditionalFilesSelect(filesToAdd);
                            }
                          }}
                        />
                      </label>
                    </div>
                  )}
                  
                  {/* Список загруженных дополнительных изображений */}
                  {additionalImages.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      {additionalImages.map((img) => (
                        <div 
                          key={img.id}
                          className="border rounded p-3 relative"
                        >
                          <div className="relative w-full h-32 mb-2">
                            <img 
                              src={img.preview} 
                              alt={`Изображение ${img.id}`}
                              className="w-full h-full object-contain"
                            />
                            <Button
                              type="button"
                              variant="destructive"
                              size="icon"
                              className="absolute top-1 right-1 h-6 w-6"
                              onClick={() => handleRemoveAdditionalImage(img.id)}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                          <Input
                            placeholder="Подпись к изображению"
                            value={img.caption}
                            onChange={(e) => handleCaptionChange(img.id, e.target.value)}
                            className="text-xs"
                          />
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {additionalImages.length >= 5 && (
                    <div className="flex items-center justify-center p-3 bg-muted rounded">
                      <Info className="h-4 w-4 mr-2 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">Достигнут лимит количества файлов (5)</span>
                    </div>
                  )}
                </div>

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
                  ) : 'Добавить работу'}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default PortfolioAddPage;