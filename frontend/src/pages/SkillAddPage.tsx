import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
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
import { Loader2 } from 'lucide-react';

/**
 * Схема валидации формы добавления навыка
 */
const formSchema = z.object({
  skillMode: z.enum(['existing', 'new']),
  existingSkillId: z.string().optional().refine(
    (val) => val !== undefined && val !== "" || val === undefined,
    { message: "Выберите навык из списка" }
  ),
  newSkillName: z.string().min(2, "Минимум 2 символа").max(100, "Максимум 100 символов").optional(),
  newSkillDescription: z.string().max(500, "Максимум 500 символов").optional(),
  level: z.string().refine((val) => ["1", "2", "3", "4", "5"].includes(val), {
    message: "Укажите уровень владения навыком (от 1 до 5)",
  }),
});

/**
 * Определяем тип данных формы на основе схемы
 */
type FormData = z.infer<typeof formSchema>;

/**
 * Страница добавления навыка в профиль креатора
 */
const SkillAddPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [creatorId, setCreatorId] = useState<number | null>(null);
  const [skills, setSkills] = useState<Array<{ id: number, name: string }>>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  /**
   * Инициализация формы с настройкой валидации
   */
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      skillMode: 'existing',
      existingSkillId: '',
      newSkillName: '',
      newSkillDescription: '',
      level: '3',
    },
  });

  /**
   * Загружаем ID профиля креатора и список доступных навыков при монтировании компонента
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
        }

        // Получаем список всех доступных навыков
        const skillsRes = await apiClient.get('/skills/');
        setSkills(skillsRes.data.results || []);
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
  }, [user?.id]);

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

    setIsSubmitting(true);
    try {
      let skillId: number;

      // Если выбран вариант создания нового навыка
      if (data.skillMode === 'new' && data.newSkillName) {
        // Создаем новый навык
        const newSkillRes = await apiClient.post('/skills/', {
          name: data.newSkillName,
          description: data.newSkillDescription || ''
        });
        skillId = newSkillRes.data.id;
      } else if (data.skillMode === 'existing' && data.existingSkillId) {
        // Используем существующий навык
        skillId = parseInt(data.existingSkillId, 10);
      } else {
        throw new Error('Не указан навык');
      }

      // Создаем связь навыка с профилем креатора
      await apiClient.post('/creator-skills/', {
        creator_profile: creatorId,
        skill: skillId,
        level: parseInt(data.level, 10)
      });

      toast({
        title: 'Успешно',
        description: 'Навык добавлен в профиль',
      });

      // Возвращаемся на страницу профиля
      navigate(-1);
    } catch (err: any) {
      console.error('Ошибка при сохранении навыка:', err);
      toast({
        title: 'Ошибка',
        description: err?.response?.data?.detail || 'Не удалось добавить навык',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Переключение между режимами (выбор существующего/создание нового)
  const skillMode = form.watch('skillMode');

  return (
    <div className="container mx-auto py-12 max-w-xl">
      <div className="flex items-center mb-6">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-2xl font-semibold ml-4">Добавление навыка</h1>
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
                  name="skillMode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Выберите действие</FormLabel>
                      <FormControl>
                        <RadioGroup
                          defaultValue={field.value}
                          onValueChange={field.onChange}
                          className="flex flex-col space-y-1"
                        >
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="existing" id="existing" />
                            <label htmlFor="existing" className="text-sm font-medium">
                              Выбрать существующий навык
                            </label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="new" id="new" />
                            <label htmlFor="new" className="text-sm font-medium">
                              Создать новый навык
                            </label>
                          </div>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {skillMode === 'existing' && (
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
                              <SelectValue placeholder="Выберите навык" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {skills.map((skill) => (
                              <SelectItem key={skill.id} value={String(skill.id)}>
                                {skill.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                {skillMode === 'new' && (
                  <>
                    <FormField
                      control={form.control}
                      name="newSkillName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Название навыка</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Введите название навыка" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="newSkillDescription"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Описание навыка (необязательно)</FormLabel>
                          <FormControl>
                            <Textarea
                              {...field}
                              placeholder="Краткое описание навыка"
                              className="min-h-[80px]"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </>
                )}

                <FormField
                  control={form.control}
                  name="level"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Уровень владения навыком</FormLabel>
                      <FormControl>
                        <RadioGroup
                          defaultValue={field.value}
                          onValueChange={field.onChange}
                          className="flex space-x-4"
                        >
                          <div className="flex flex-col items-center">
                            <RadioGroupItem value="1" id="level1" />
                            <label htmlFor="level1" className="text-xs">1</label>
                          </div>
                          <div className="flex flex-col items-center">
                            <RadioGroupItem value="2" id="level2" />
                            <label htmlFor="level2" className="text-xs">2</label>
                          </div>
                          <div className="flex flex-col items-center">
                            <RadioGroupItem value="3" id="level3" />
                            <label htmlFor="level3" className="text-xs">3</label>
                          </div>
                          <div className="flex flex-col items-center">
                            <RadioGroupItem value="4" id="level4" />
                            <label htmlFor="level4" className="text-xs">4</label>
                          </div>
                          <div className="flex flex-col items-center">
                            <RadioGroupItem value="5" id="level5" />
                            <label htmlFor="level5" className="text-xs">5</label>
                          </div>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
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
                  ) : 'Добавить навык'}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default SkillAddPage;