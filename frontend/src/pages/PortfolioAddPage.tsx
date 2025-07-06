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
  const uploadFileWithPortfolioId = async (file: File, portfolioItemId: number, order: number, caption?: string) => {
    try {
      if (!file) {
        throw new Error('Файл не найден');
      }

      const formData = new FormData();
      // Сначала добавляем основные поля
      formData.append('image', file);
      formData.append('portfolio_item', String(portfolioItemId));
      formData.append('order', String(order));
      // Добавляем caption, если он есть
      if (caption && caption.trim()) {
        formData.append('caption', caption);
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
      
      // Явно указываем Content-Type: multipart/form-data для корректной отправки файлов
      const response = await apiClient.post('/portfolio-images/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      return response.data;
      
    } catch (error: any) {
      setIsSubmitting(false);
      console.error('Ошибка от сервера:', error);
      console.error('Статус ошибки:', error.response?.status);
      console.error('Заголовки ответа:', error.response?.headers);
      console.error('Детали ошибки:', error.response?.data);
      
      // Более подробный вывод ошибок для каждого поля
      if (error.response?.data) {
        if (error.response.data.cover_image) {
          console.error('Детальная ошибка cover_image:', JSON.stringify(error.response.data.cover_image));
        }
        if (error.response.data.uploaded_images) {
          console.error('Детальная ошибка uploaded_images:', JSON.stringify(error.response.data.uploaded_images));
        }
        // Вывести весь ответ как JSON для удобства анализа
        console.error('Полный ответ сервера как JSON:', JSON.stringify(error.response.data));
      }
      
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

      
      // Создаем новый File-объект с корректными MIME-типами для гарантии правильной передачи
      const coverFileObject = new File([coverFile], coverFile.name, { type: coverFile.type });
      
      // Отправляем только файл обложки
      // Изменяем подход: не передаем обложку в uploaded_images
      formData.append('cover_image', coverFileObject);
      
      // Теперь отправляем только основные данные и обложку
      
      if (data.external_url) {
        formData.append('external_url', data.external_url);
      }
      

      const allFields = [];
      for (const pair of formData.entries()) {
        allFields.push(pair[0]);

      }

      
      // Используем apiClient для отправки данных с явным указанием Content-Type
      const response = await apiClient.post('/portfolio/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data', // Явно указываем тип контента для корректной отправки файлов
        },
      });
      
      // Получаем ID созданного элемента портфолио
      const portfolioItemId = response.data.id;
      
      // Загружаем дополнительные изображения с указанием portfolio_item_id
      if (additionalImages.length > 0) {
        
        // Устанавливаем индикатор загрузки дополнительных изображений
        setIsSubmitting(true);
        toast({
          title: 'Загрузка',
          description: `Загружаем ${additionalImages.length} дополнительных изображений...`,
          variant: 'default'
        });
        
        // Используем функцию uploadFileWithPortfolioId
        const uploadPromises = additionalImages.map((img, idx) => {
          const orderNum = idx + 1;
          return uploadFileWithPortfolioId(img.file, portfolioItemId, orderNum, img.caption);
        });
        
        try {
          // Загружаем все изображения параллельно И ДОЖИДАЕМСЯ РЕЗУЛЬТАТА
          const results = await Promise.all(uploadPromises);
          
          // Показываем уведомление об успехе ПОСЛЕ завершения загрузки всех изображений
          toast({
            title: 'Успешно',
            description: 'Работа и все дополнительные изображения добавлены в портфолио',
            variant: 'default'
          });
          
          // Перенаправляем на страницу профиля ТОЛЬКО после успешной загрузки всех изображений
          navigate('/creator-profile');
        } catch (uploadError) {
          console.error('Ошибка загрузки дополнительных изображений:', uploadError);
          // Показываем подробное предупреждение о проблеме с загрузкой изображений
          toast({
            title: 'Предупреждение',
            description: 'Основная работа создана, но некоторые дополнительные изображения не были загружены. Пожалуйста, повторите попытку позже.',
            variant: 'destructive'
          });
          
          // Даже при ошибке загрузки дополнительных изображений, основная работа создана, перенаправляем пользователя
          navigate('/creator-profile');
        }
      } else {
        // Если дополнительных изображений нет, сразу показываем уведомление об успехе
        toast({
          title: 'Успешно',
          description: 'Работа добавлена в портфолио',
          variant: 'default'
        });
        
        // Перенаправляем на страницу профиля ТОЛЬКО после успешной загрузки всех изображений
        navigate('/creator-profile');
      }
      

      toast({
        title: 'Ошибка',
        description: 'Не удалось создать портфолио',
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