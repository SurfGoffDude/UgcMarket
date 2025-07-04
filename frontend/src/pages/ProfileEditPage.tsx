import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

/**
 * Страница редактирования профиля креатора
 * Предоставляет форму для редактирования основной информации профиля.
 */
import React from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '@/contexts/AuthContext';
import apiClient from '@/api/client';
import { toast } from '@/components/ui/use-toast';

const schema = z.object({
  first_name: z.string().min(1, 'Введите имя'),
  last_name: z.string().min(1, 'Введите фамилию'),
  bio: z.string().max(500).optional(),
  location: z.string().max(100).optional(),
});

type FormValues = z.infer<typeof schema>;

const ProfileEditPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const creatorIdRef = React.useRef<number | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  // Загрузка текущих данных профиля при монтировании
  React.useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await apiClient.get(`/creator-profiles/?user=${user?.id}`);
        const data = Array.isArray(res.data.results) ? res.data.results[0] : res.data;
        if (data) {
          creatorIdRef.current = data.id;
          reset({
            first_name: data.user.first_name || '',
            last_name: data.user.last_name || '',
            bio: data.user.bio || '',
            location: data.location || '',
          });
        }
      } catch (e) {
        toast({ title: 'Ошибка', description: 'Не удалось загрузить профиль', variant: 'destructive' });
      }
    };
    if (user?.id) fetchProfile();
  }, [user?.id, reset]);

  const onSubmit = async (values: FormValues) => {
    try {
      if (!creatorIdRef.current) throw new Error('creatorId unknown');
      const payload = {
        user: {
          first_name: values.first_name,
          last_name: values.last_name,
          bio: values.bio,
        },
        location_write: values.location, // Используем location_write вместо location для совместимости с обновленным сериализатором
      };

      const response = await apiClient.patch(`/creator-profiles/${creatorIdRef.current}/`, payload);

      toast({ title: 'Успешно', description: 'Профиль обновлён' });
      navigate(-1);
    } catch (e: any) {

      toast({ title: 'Ошибка', description: e?.response?.data?.detail || 'Не удалось сохранить', variant: 'destructive' });
    }
  };

  return (
    <div className="container mx-auto py-12 max-w-xl">
      <div className="flex items-center mb-6">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-2xl font-semibold ml-4">Редактирование профиля</h1>
      </div>

      <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
        <div>
          <label className="block mb-1 text-sm font-medium">Имя</label>
          <Input {...register('first_name')} />
          {errors.first_name && <p className="text-red-500 text-xs mt-1">{errors.first_name.message}</p>}
        </div>

        <div>
          <label className="block mb-1 text-sm font-medium">Фамилия</label>
          <Input {...register('last_name')} />
          {errors.last_name && <p className="text-red-500 text-xs mt-1">{errors.last_name.message}</p>}
        </div>

        <div>
          <label className="block mb-1 text-sm font-medium">Местоположение</label>
          <Input {...register('location')} />
          {errors.location && <p className="text-red-500 text-xs mt-1">{errors.location.message}</p>}
        </div>

        <div>
          <label className="block mb-1 text-sm font-medium">Био</label>
          <Textarea rows={4} {...register('bio')} />
          {errors.bio && <p className="text-red-500 text-xs mt-1">{errors.bio.message}</p>}
        </div>

        <Button type="submit" disabled={isSubmitting}>
          Сохранить
        </Button>
      </form>
    </div>
  );
};

export default ProfileEditPage;
