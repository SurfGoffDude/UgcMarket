import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Card, CardContent } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import apiClient from '@/api/client';
import type { AxiosError } from 'axios';

// Схема валидации формы добавления навыка
const formSchema = z.discriminatedUnion('skillMode', [
  z.object({
    skillMode: z.literal('existing'),
    existingSkillId: z.string().min(1, "Выберите навык из списка"),
    newSkillName: z.string().optional(),
    newSkillDescription: z.string().optional(),
    editSkillName: z.string().optional(),
    editSkillDescription: z.string().optional(),
  }),
  z.object({
    skillMode: z.literal('new'),
    existingSkillId: z.string().optional(),
    newSkillName: z.string().min(2, "Минимум 2 символа").max(100, "Максимум 100 символов"),
    newSkillDescription: z.string().max(500, "Максимум 500 символов").optional(),
    editSkillName: z.string().optional(),
    editSkillDescription: z.string().optional(),
  }),
]);

// Схема для редактирования
const editSchema = z.object({
  skillMode: z.enum(['existing', 'new']),
  existingSkillId: z.string().optional(),
  newSkillName: z.string().optional(),
  newSkillDescription: z.string().optional(),
  editSkillName: z.string().min(2, "Минимум 2 символа").max(100, "Максимум 100 символов"),
  editSkillDescription: z.string().max(500, "Максимум 500 символов").optional(),
});

// Определяем тип данных формы на основе схемы
type FormData = z.infer<typeof formSchema>;

// Тип для навыка
type Skill = {
  id: number;
  name: string;
  description?: string;
};

// Страница добавления навыка в профиль креатора
const SkillAddPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [creatorId, setCreatorId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [isEditingExisting, setIsEditingExisting] = useState(false);
  const [editingSkill, setEditingSkill] = useState<Skill | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);

  // Функция для отмены текущих запросов
  const cancelPendingRequests = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  }, []);

  // Функция для безопасного вызова API с отменой предыдущих запросов
  const safeApiCall = useCallback(async <T,>(apiCall: (signal: AbortSignal) => Promise<T>): Promise<T | null> => {
    cancelPendingRequests();
    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      return await apiCall(controller.signal);
    } catch (err: unknown) {
      const error = err as Error;
      if (error.name !== 'AbortError') {
        throw error;
      }
      return null;
    } finally {
      if (abortControllerRef.current === controller) {
        abortControllerRef.current = null;
      }
    }
  }, [cancelPendingRequests]);

  // Инициализация формы
  const form = useForm<FormData>({
    resolver: zodResolver(isEditingExisting ? editSchema : formSchema),
    defaultValues: {
      skillMode: 'existing',
      existingSkillId: '',
      newSkillName: '',
      newSkillDescription: '',
      editSkillName: '',
      editSkillDescription: ''
    },
    mode: 'onChange',
  });

  // Загружаем ID профиля креатора и список доступных навыков
  useEffect(() => {
    const fetchData = async () => {
      if (!user?.id) return;

      setIsLoading(true);
      try {
        // Загружаем профиль креатора
        const creatorResponse = await safeApiCall(
          signal => apiClient.get(`/creator-profiles/?user=${user.id}`, { signal })
        );

        if (creatorResponse && creatorResponse.data.results && creatorResponse.data.results.length > 0) {
          const creatorData = creatorResponse.data.results[0];
          setCreatorId(creatorData.id);

          // Загружаем список навыков
          const skillsResponse = await safeApiCall(
            signal => apiClient.get('/skills/', { signal })
          );

          if (skillsResponse) {
            setSkills(skillsResponse.data.results || []);
          }
        }
      } catch (error) {
        const err = error as AxiosError;
        toast({
          title: 'Ошибка загрузки данных',
          description: err.message,
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();

    // Отменяем все запросы при размонтировании
    return () => {
      cancelPendingRequests();
    };
  }, [user?.id, safeApiCall, cancelPendingRequests]);

  // Обработчик отправки формы
  const onSubmit = async (data: FormData) => {
    console.log('Отправка формы:', data);
    console.log('Ошибки формы:', form.formState.errors);
    if (!creatorId) {
      toast({
        title: 'Ошибка',
        description: 'ID профиля креатора не найден',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      console.log('Режим формы:', data.skillMode, 'Редактирование:', isEditingExisting);
      // Добавим логирование creatorId для отладки
      console.log('Идентификатор профиля креатора:', creatorId);

      if (isEditingExisting && editingSkill?.id) {
        // Редактируем существующий навык
        const response = await safeApiCall(signal =>
          apiClient.patch<Skill>(
            `/skills/${editingSkill.id}/`,
            {
              name: data.editSkillName?.trim() || editingSkill.name,
              description: data.editSkillDescription?.trim() || editingSkill.description || undefined,
            },
            { signal }
          )
        );

        if (response?.data) {
          // Обновляем навык в списке без дополнительного запроса
          const updatedSkills = skills.map(skill => 
            skill.id === editingSkill.id ? response.data : skill
          );
          setSkills(updatedSkills);
          setEditingSkill(null);
          setIsEditingExisting(false);
          
          toast({
            title: 'Успех!',
            description: 'Навык успешно обновлен',
          });
          
          // Перенаправляем пользователя обратно на страницу профиля
          navigate('/creator-profile');
        }
      } else if (data.skillMode === 'new') {
        // Проверяем, что имя навыка заполнено
        if (!data.newSkillName?.trim()) {
          toast({
            title: 'Ошибка',
            description: 'Введите название навыка',
            variant: 'destructive',
          });
          return;
        }

        // Создаем новый навык
        console.log('Создаем новый навык:', {
          name: data.newSkillName?.trim(),
          description: data.newSkillDescription?.trim() || undefined
        });
        
        try {
          const response = await apiClient.post(
            '/skills/',
            {
              name: data.newSkillName?.trim() || '',
              description: data.newSkillDescription?.trim() || undefined,
            },
            { signal: abortControllerRef.current?.signal }
          );

          console.log('Успешно создан навык:', response.data);
          
          if (response?.data?.id) {
            // После создания навыка, добавляем его в профиль креатора
            try {
              // Добавляем более подробный лог пайлоада
              const creatorSkillPayload = { 
                skill_id: response.data.id, // Исправлено имя поля: skill -> skill_id
                creator_profile: Number(creatorId) // Явное преобразование в число
              };
              console.log('Отправляем пайлоад для добавления навыка в профиль:', creatorSkillPayload);
              const addResult = await apiClient.post(
                '/creator-skills/',
                creatorSkillPayload
              );
              console.log('Навык добавлен в профиль:', addResult.data);
            } catch (addError) {
              console.error('Ошибка при добавлении навыка в профиль:', addError);
              
              // Детальный анализ ошибки Axios
              if (addError && typeof addError === 'object' && 'response' in addError) {
                const axiosError = addError as AxiosError;
                console.error('Детали ошибки:', {
                  status: axiosError.response?.status,
                  statusText: axiosError.response?.statusText,
                  data: axiosError.response?.data,
                  headers: axiosError.response?.headers
                });
                
                // Выводим отдельно все поля ошибки для отладки
                if (axiosError.response?.data) {
                  console.log('Данные ошибки 400:', JSON.stringify(axiosError.response.data));
                  
                  // Проверяем наличие non_field_errors и других конкретных полей
                  if (typeof axiosError.response.data === 'object') {
                    Object.entries(axiosError.response.data).forEach(([key, value]) => {
                      console.log(`Поле ошибки ${key}:`, value);
                    });
                  }
                }
                
                // Отображаем детали ошибки в toast
                let errorDetail = '';
                
                if (axiosError.response?.data) {
                  if (typeof axiosError.response.data === 'object') {
                    // Если есть non_field_errors, показываем их в первую очередь
                    if ('non_field_errors' in axiosError.response.data) {
                      errorDetail = Array.isArray(axiosError.response.data.non_field_errors)
                        ? axiosError.response.data.non_field_errors.join(', ')
                        : String(axiosError.response.data.non_field_errors);
                    } else {
                      // Иначе собираем все ошибки
                      errorDetail = Object.entries(axiosError.response.data)
                        .map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(', ') : value}`)
                        .join('; ');
                    }
                  } else {
                    errorDetail = String(axiosError.response.data);
                  }
                } else {
                  errorDetail = axiosError.message;
                }
                  
                toast({
                  title: 'Ошибка при добавлении навыка в профиль',
                  description: `Код: ${axiosError.response?.status || ''}. Детали: ${errorDetail}`,
                  variant: 'destructive',
                });
              } else {
                toast({
                  title: 'Ошибка при добавлении навыка в профиль',
                  description: addError instanceof Error ? addError.message : 'Неизвестная ошибка',
                  variant: 'destructive',
                });
              }
            }

            toast({
              title: 'Успех!',
              description: 'Навык успешно создан и добавлен в профиль',
            });
            navigate('/creator-profile');
          }
        } catch (createError) {
          console.error('Ошибка при создании навыка:', createError);
          toast({
            title: 'Ошибка при создании навыка',
            description: createError instanceof Error ? createError.message : 'Неизвестная ошибка',
            variant: 'destructive',
          });
        }
      } else if (data.existingSkillId) {
        // Добавляем существующий навык
        try {
          // Проверяем и логируем пайлоад
          const payload = { 
            skill_id: Number(data.existingSkillId), // Исправлено имя поля: skill -> skill_id
            creator_profile: Number(creatorId) // Явное преобразование в число
          };
          console.log('Пайлоад для добавления существующего навыка:', payload);
          
          const response = await apiClient.post(
            '/creator-skills/',
            payload,
            { signal: abortControllerRef.current?.signal }
          );

          if (response?.data) {
            toast({
              title: 'Успех!',
              description: 'Навык добавлен в профиль',
            });
            navigate('/creator-profile');
          }
        } catch (error) {
          // Обработка ошибок при добавлении существующего навыка
          console.error('Ошибка при добавлении существующего навыка:', error);
          
          // Детальный анализ ошибки Axios
          if (error && typeof error === 'object' && 'response' in error) {
            const axiosError = error as AxiosError;
            console.error('Детали ошибки:', {
              status: axiosError.response?.status,
              statusText: axiosError.response?.statusText,
              data: axiosError.response?.data,
            });
            
            const errorDetail = axiosError.response?.data && typeof axiosError.response.data === 'object'
              ? JSON.stringify(axiosError.response.data)
              : axiosError.message;
                
            toast({
              title: 'Ошибка при добавлении навыка',
              description: `Код: ${axiosError.response?.status || ''}. Детали: ${errorDetail}`,
              variant: 'destructive',
            });
          } else {
            toast({
              title: 'Ошибка при добавлении навыка',
              description: error instanceof Error ? error.message : 'Неизвестная ошибка',
              variant: 'destructive',
            });
          }
        }
      }
    } catch (error) {
      const err = error as AxiosError<{ detail?: string }>;
      console.error('Ошибка при сохранении навыка:', error);
      
      let errorMessage = 'Произошла ошибка при сохранении';
      if (err.response?.data?.detail) {
        errorMessage = err.response.data.detail;
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      toast({
        title: 'Ошибка',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Переключение между режимами (выбор существующего/создание нового)
  const skillMode = form.watch('skillMode');
  const existingSkillId = form.watch('existingSkillId');

  // Находим выбранный навык для отображения его данных
  const selectedSkill = useMemo(() => 
    skills.find(skill => skill.id.toString() === existingSkillId) || null,
    [skills, existingSkillId]
  );

  // Обновляем поля редактирования при выборе навыка
  useEffect(() => {
    if (selectedSkill) {
      setEditingSkill(selectedSkill);
      form.setValue('editSkillName', selectedSkill.name);
      form.setValue('editSkillDescription', selectedSkill.description || '');
      setIsEditingExisting(false);
    }
  }, [selectedSkill, form]);

  // Если загрузка, показываем индикатор
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-12 max-w-xl">
      <div className="flex items-center mb-6">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-2xl font-semibold ml-2">
          {isEditingExisting 
            ? `Редактирование: ${selectedSkill?.name || 'Навык'}` 
            : skillMode === 'new' 
              ? 'Создать новый навык' 
              : 'Добавить навык в профиль'}
        </h1>
      </div>

      <Card>
        <CardContent className="pt-6">
          <Form {...form}>
            <form onSubmit={(e) => {
                console.log('Начало отправки формы');
                form.handleSubmit(onSubmit)(e);
              }} 
              className="space-y-6">
              <FormField
                control={form.control}
                name="skillMode"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel>Режим</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="flex flex-col space-y-1"
                        disabled={isEditingExisting}
                      >
                        <FormItem className="flex items-center space-x-3 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="existing" />
                          </FormControl>
                          <FormLabel className="font-normal">
                            Выбрать существующий навык
                          </FormLabel>
                        </FormItem>
                        <FormItem className="flex items-center space-x-3 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="new" />
                          </FormControl>
                          <FormLabel className="font-normal">
                            Создать новый навык
                          </FormLabel>
                        </FormItem>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {skillMode === 'existing' && (
                <div key="existing-skill-section">
                  <FormField
                    control={form.control}
                    name="existingSkillId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Выберите навык</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Выберите навык из списка" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {skills.map((skill) => (
                              <SelectItem
                                key={skill.id}
                                value={skill.id.toString()}
                              >
                                {skill.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {selectedSkill && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-medium">
                          {isEditingExisting ? 'Редактирование навыка' : 'Информация о навыке'}
                        </h3>
                        {!isEditingExisting && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setIsEditingExisting(true)}
                          >
                            Редактировать
                          </Button>
                        )}
                      </div>
                      
                      {isEditingExisting ? (
                        <div className="space-y-4">
                          <FormField
                            control={form.control}
                            name="editSkillName"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Название навыка</FormLabel>
                                <FormControl>
                                  <Input
                                    placeholder="Введите название навыка"
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="editSkillDescription"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Описание</FormLabel>
                                <FormControl>
                                  <Textarea
                                    placeholder="Введите описание навыка"
                                    className="min-h-[100px]"
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <div className="flex justify-end space-x-2">
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => setIsEditingExisting(false)}
                            >
                              Отмена
                            </Button>
                            <Button type="submit" disabled={isSubmitting}>
                              {isSubmitting ? (
                                <>
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  Сохранение...
                                </>
                              ) : (
                                'Сохранить изменения'
                              )}
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="p-4 border rounded-md">
                          <h4 className="font-medium">{selectedSkill.name}</h4>
                          {selectedSkill.description && (
                            <p className="text-sm text-muted-foreground mt-2">
                              {selectedSkill.description}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {skillMode === 'new' && (
                <div key="new-skill-section">
                  <FormField
                    control={form.control}
                    name="newSkillName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Название навыка</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Введите название навыка"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="newSkillDescription"
                    render={({ field }) => (
                      <FormItem className="mt-4">
                        <FormLabel>Описание (необязательно)</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Введите описание навыка"
                            className="min-h-[100px]"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}

              {!isEditingExisting && (
                <div className="flex justify-end space-x-4 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate(-1)}
                    disabled={isSubmitting}
                  >
                    Назад
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {skillMode === 'new' ? 'Создание...' : 'Добавление...'}
                      </>
                    ) : skillMode === 'new' ? (
                      'Создать новый навык'
                    ) : (
                      'Добавить навык в профиль'
                    )}
                  </Button>
                </div>
              )}
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
};

export default SkillAddPage;