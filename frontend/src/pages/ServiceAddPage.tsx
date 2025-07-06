import { Button } from '@/components/ui/button';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Loader2, Upload, X } from 'lucide-react';
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

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

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
  estimated_time_value: z.number()
    .int("Должно быть целым числом")
    .positive("Должно быть положительным числом")
    .default(1),
  estimated_time_unit: z.enum(["hour", "day", "week", "month", "year"])
    .default("day"),
  allows_modifications: z.boolean().default(true),
  modifications_price: z.string().optional(),
  is_active: z.boolean().default(true),
  images: z.array(z.instanceof(File))
    .optional()
    .refine(files => !files || files.every(file => file.size <= MAX_FILE_SIZE), `Максимальный размер файла 5MB.`)
    .refine(files => !files || files.every(file => ACCEPTED_IMAGE_TYPES.includes(file.type)), "Допустимы только .jpg, .jpeg, .png и .webp форматы."),
}).refine(data => {
  if (data.allows_modifications) {
    const price = parseFloat(data.price);
    const modPrice = data.modifications_price ? parseFloat(data.modifications_price) : null;
    if (modPrice === null || isNaN(modPrice) || modPrice < 0) {
        return false;
    }
    return modPrice > price;
  }
  return true;
}, {
  message: "Стоимость с правками должна быть больше основной цены",
  path: ["modifications_price"],
});

type ServiceFormValues = z.infer<typeof formSchema>;

const ServiceAddPage = () => {
  const { serviceId } = useParams<{ serviceId?: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [creatorId, setCreatorId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(!!serviceId);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  
  const form = useForm<ServiceFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      description: '',
      price: '',
      estimated_time_value: 1,
      estimated_time_unit: 'day',
      allows_modifications: true,
      modifications_price: '',
      is_active: true,
      images: [],
    },
  });

  useEffect(() => {
    const fetchCreatorId = async () => {
      if (user?.id) {
        try {
          const response = await apiClient.get(`/profiles/creator/by-user/${user.id}/`);
          setCreatorId(response.data.id);
        } catch (error) {

        }
      }
    };
    fetchCreatorId();
  }, [user]);

  useEffect(() => {
    const fetchServiceData = async () => {
      if (serviceId) {
        try {
          const response = await apiClient.get(`/services/${serviceId}/`);
          const serviceData = response.data;
          // Обрабатываем данные времени выполнения
          let timeValue = 1;
          let timeUnit = 'day';
          
          // Если есть новые поля, используем их
          if (serviceData.estimated_time_value && serviceData.estimated_time_unit) {
            timeValue = serviceData.estimated_time_value;
            timeUnit = serviceData.estimated_time_unit;
          } 
          // Иначе пытаемся извлечь из старого поля estimated_time (обратная совместимость)
          else if (serviceData.estimated_time) {
            const estimatedTimeStr = serviceData.estimated_time;
            // Попытка извлечь число и единицу из строки типа "3 дня" или "2 часа"
            const matches = estimatedTimeStr.match(/(\d+)\s*([а-яА-Я]+)/i);
            if (matches && matches.length >= 3) {
              const extractedValue = parseInt(matches[1]);
              const extractedUnit = matches[2].toLowerCase();
              if (!isNaN(extractedValue) && extractedValue > 0) {
                timeValue = extractedValue;
                
                // Определяем единицу измерения на основе русского текста
                if (extractedUnit.includes('час')) {
                  timeUnit = 'hour';
                } else if (extractedUnit.includes('ден') || extractedUnit.includes('дн')) {
                  timeUnit = 'day';
                } else if (extractedUnit.includes('недел')) {
                  timeUnit = 'week';
                } else if (extractedUnit.includes('месяц') || extractedUnit.includes('месяц')) {
                  timeUnit = 'month';
                } else if (extractedUnit.includes('год') || extractedUnit.includes('лет')) {
                  timeUnit = 'year';
                }
              }
            }
          }
          
          form.reset({
            title: serviceData.title || '',
            description: serviceData.description || '',
            price: String(serviceData.price) || '',
            estimated_time_value: timeValue,
            estimated_time_unit: timeUnit as "hour" | "day" | "week" | "month" | "year",
            allows_modifications: serviceData.allows_modifications,
            modifications_price: String(serviceData.modifications_price) || '',
            is_active: serviceData.is_active,
          });
          if (serviceData.images && serviceData.images.length > 0) {
            setImagePreviews(serviceData.images.map((img: any) => img.image));
          }
        } catch (error) {
          toast({
            title: 'Ошибка',
            description: 'Не удалось загрузить данные услуги.',
            variant: 'destructive',
          });
        } finally {
          setIsLoading(false);
        }
      }
    };
    fetchServiceData();
  }, [serviceId, form]);

  const onSubmit = async (data: ServiceFormValues) => {
    setIsSubmitting(true);

    const formData = new FormData();
    
    const processedData = {
        ...data,
        price: parseFloat(data.price),
        modifications_price: data.modifications_price ? parseFloat(data.modifications_price) : undefined
    };

    Object.entries(processedData).forEach(([key, value]) => {
      if (key === 'images' && Array.isArray(value)) {
        value.forEach(file => {
          formData.append('uploaded_images', file);
        });
      } else if (value !== null && value !== undefined) {
        formData.append(key, String(value));
      }
    });

    if (!serviceId && creatorId) {
      formData.append('creator_profile', String(creatorId));
    }

    const method = serviceId ? 'patch' : 'post';
    const url = serviceId ? `/services/${serviceId}/` : '/services/';

    try {
      const response = await apiClient[method](url, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      toast({
        title: 'Успех!',
        description: serviceId ? 'Услуга успешно обновлена' : 'Услуга успешно создана',
      });
      navigate(`/services/${response.data.id}`);
    } catch (error: any) {
      const errorDetail = error.response?.data;
      const description = typeof errorDetail === 'string' ? errorDetail : JSON.stringify(errorDetail) || 'Не удалось сохранить услугу';
      toast({
        title: 'Ошибка',
        description: description,
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const allowsModifications = form.watch('allows_modifications');

  return (
    <div className="container mx-auto max-w-4xl py-8">
      <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Назад
      </Button>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : (
        <Card>
          <CardContent className="p-6">
            <h1 className="text-2xl font-bold mb-6">{serviceId ? 'Редактировать услугу' : 'Создать новую услугу'}</h1>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Название услуги</FormLabel>
                      <FormControl>
                        <Input placeholder="Например, 'Разработка логотипа'" {...field} />
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
                      <FormLabel>Подробное описание</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Опишите, что входит в услугу, как проходит работа..." {...field} rows={6}/>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <FormField
                      control={form.control}
                      name="price"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Стоимость (₽)</FormLabel>
                          <FormControl>
                            <Input type="number" placeholder="5000" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="space-y-4">
                      <FormLabel>Примерный срок выполнения</FormLabel>
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="estimated_time_value"
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  min="1"
                                  placeholder="Например: 3" 
                                  value={field.value}
                                  onChange={(e) => {
                                    const value = parseInt(e.target.value);
                                    if (!isNaN(value) && value > 0) {
                                      field.onChange(value);
                                    }
                                  }}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="estimated_time_unit"
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <Select
                                  value={field.value}
                                  onValueChange={field.onChange}
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Выберите единицу" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="hour">Час</SelectItem>
                                    <SelectItem value="day">День</SelectItem>
                                    <SelectItem value="week">Неделя</SelectItem>
                                    <SelectItem value="month">Месяц</SelectItem>
                                    <SelectItem value="year">Год</SelectItem>
                                  </SelectContent>
                                </Select>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                </div>

                <FormField
                  control={form.control}
                  name="allows_modifications"
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
                          Возможность внесения правок
                        </FormLabel>
                        <FormDescription>
                          Разрешить клиенту заказывать услугу с дополнительными правками за отдельную плату.
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />

                {allowsModifications && (
                  <FormField
                    control={form.control}
                    name="modifications_price"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Стоимость с правками (₽)</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="7000" {...field} />
                        </FormControl>
                        <FormDescription>
                          Укажите полную стоимость услуги, если клиент выберет опцию с правками.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                <FormField
                  control={form.control}
                  name="images"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Изображения</FormLabel>
                      <FormControl>
                        <div className="flex flex-col items-center justify-center w-full">
                          <label htmlFor="file-upload" className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-secondary hover:bg-secondary/80">
                            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                              <Upload className="w-10 h-10 mb-3 text-muted-foreground" />
                              <p className="mb-2 text-sm text-muted-foreground"><span className="font-semibold">Нажмите для загрузки</span> или перетащите файлы</p>
                              <p className="text-xs text-muted-foreground">PNG, JPG, WEBP (MAX. 5MB)</p>
                            </div>
                            <Input 
                              id="file-upload" 
                              type="file" 
                              className="hidden" 
                              multiple
                              accept={ACCEPTED_IMAGE_TYPES.join(',')}
                              onChange={(e) => {
                                const files = Array.from(e.target.files || []);
                                const currentFiles = form.getValues('images') || [];
                                const newFiles = [...currentFiles, ...files];
                                form.setValue('images', newFiles, { shouldValidate: true });

                                const previews = newFiles.map(file => URL.createObjectURL(file));
                                setImagePreviews(previews);
                              }}
                            />
                          </label>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {imagePreviews.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {imagePreviews.map((src, index) => (
                      <div key={index} className="relative group">
                        <img src={src} alt={`Preview ${index}`} className="object-cover w-full h-32 rounded-lg" />
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => {
                            const currentFiles = form.getValues('images') || [];
                            const updatedFiles = currentFiles.filter((_, i) => i !== index);
                            form.setValue('images', updatedFiles, { shouldValidate: true });

                            const updatedPreviews = imagePreviews.filter((_, i) => i !== index);
                            setImagePreviews(updatedPreviews);
                          }}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}

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
                  ) : (serviceId ? 'Сохранить изменения' : 'Добавить услугу')}
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
