import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, X, Upload, Loader2 } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const additionalFileInputRef = useRef<HTMLInputElement>(null);
  
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
   * Обработчик выбора файла обложки
   */
  const handleCoverSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      
      // Проверка типа файла
      if (!file.type.startsWith('image/')) {
        toast({
          title: 'Ошибка',
          description: 'Пожалуйста, выберите изображение',
          variant: 'destructive',
        });
        return;
      }
      
      setCoverFile(file);
      setCoverPreview(URL.createObjectURL(file));
    }
  };

  /**
   * Обработчик выбора дополнительных изображений
   */
  const handleAdditionalImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      
      // Проверка типа файла
      if (!file.type.startsWith('image/')) {
        toast({
          title: 'Ошибка',
          description: 'Пожалуйста, выберите изображение',
          variant: 'destructive',
        });
        return;
      }
      
      // Создаем уникальный ID для изображения
      const newId = Date.now();
      
      // Добавляем в список дополнительных изображений
      setAdditionalImages([
        ...additionalImages,
        {
          id: newId,
          file,
          preview: URL.createObjectURL(file),
          caption: ''
        }
      ]);
      
      // Сбрасываем значение input'а для возможности выбора того же файла
      if (additionalFileInputRef.current) {
        additionalFileInputRef.current.value = '';
      }
    }
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
        description: 'Не найден профиль креатора',
        variant: 'destructive',
      });
      return;
    }

    if (!coverFile) {
      toast({
        title: 'Ошибка',
        description: 'Пожалуйста, выберите обложку для работы',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      // Создаем FormData для отправки файлов
      const formData = new FormData();
      formData.append('creator_profile', creatorId.toString());
      formData.append('title', data.title);
      formData.append('description', data.description);
      formData.append('cover_image', coverFile);
      
      if (data.external_url) {
        formData.append('external_url', data.external_url);
      }

      // Создаем элемент портфолио
      const portfolioResponse = await apiClient.post('/portfolio-items/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      // Получаем ID созданного элемента портфолио
      const portfolioItemId = portfolioResponse.data.id;

      // Если есть дополнительные изображения, загружаем их
      if (additionalImages.length > 0) {
        for (const [index, img] of additionalImages.entries()) {
          const imageData = new FormData();
          imageData.append('portfolio_item', portfolioItemId);
          imageData.append('image', img.file);
          imageData.append('caption', img.caption || '');
          imageData.append('order', index.toString());

          await apiClient.post('/portfolio-images/', imageData, {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
          });
        }
      }

      toast({
        title: 'Успешно',
        description: 'Работа добавлена в портфолио',
      });

      // Возвращаемся на страницу профиля
      navigate(-1);
    } catch (err: any) {
      console.error('Ошибка при сохранении работы:', err);
      toast({
        title: 'Ошибка',
        description: err?.response?.data?.detail || 'Не удалось добавить работу в портфолио',
        variant: 'destructive',
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
                      <div className="relative w-full h-56 mb-4">
                        <img 
                          src={coverPreview} 
                          alt="Предпросмотр обложки" 
                          className="w-full h-full object-contain border rounded"
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          className="absolute top-2 right-2"
                          onClick={() => {
                            setCoverFile(null);
                            setCoverPreview(null);
                          }}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full h-56 flex flex-col items-center justify-center gap-2"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <Upload className="h-8 w-8 text-gray-400" />
                        <span>Нажмите для загрузки изображения</span>
                      </Button>
                    )}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleCoverSelect}
                    />
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
                    Добавьте дополнительные изображения для демонстрации работы
                  </FormDescription>
                  
                  {/* Список загруженных дополнительных изображений */}
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

                  {/* Кнопка для добавления дополнительных изображений */}
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full flex items-center justify-center gap-2"
                    onClick={() => additionalFileInputRef.current?.click()}
                  >
                    <Plus className="h-4 w-4" />
                    Добавить изображение
                  </Button>
                  <input
                    ref={additionalFileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleAdditionalImageSelect}
                  />
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