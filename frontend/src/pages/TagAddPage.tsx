import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2 } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';


/**
 * Страница добавления тегов к профилю креатора
 * 1. Загружает все доступные теги через GET /api/tags/
 * 2. Отмечает уже выбранные теги (creator.tags)
 * 3. Позволяет выбрать/снять чекбоксы и отправить PATCH /api/creator-profiles/me/ с полем tags
 *
 * Формат запроса на сохранение:
 * {
 *    "tags": [1, 2, 3]
 * }
 */
const TagAddPage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Запрос текущего профиля ("me") чтобы получить уже выбранные теги
  interface CreatorProfile { id: number; tags: number[] }
  const { data: profileData, isPending: profilePending } = useQuery<CreatorProfile>({
    queryKey: ['creator-profile-me'],
    queryFn: async () => {
      const res = await axios.get<CreatorProfile>('/api/creator-profiles/me/');
      return res.data;
    },
    retry: false,
  });

  const [selected, setSelected] = useState<number[]>([]);

  // Когда пришли данные профиля – проставляем выбранные теги
  useEffect(() => {
    if (profileData) {
      setSelected(profileData.tags || []);
    }
  }, [profileData]);

  // Получить все теги
  interface Tag { id: number; name: string }

  const { data: tags = [], isPending, isError } = useQuery<Tag[]>({
    queryKey: ['tags'],
    queryFn: async () => {
      const res = await axios.get('/api/tags/');
      const payload = res.data;
      // API может возвращать либо массив, либо пагинационный объект { results: [] }
      if (Array.isArray(payload)) return payload as Tag[];
      return (payload?.results ?? []) as Tag[];
    },
    retry: false,
  });

  const {
    mutate: saveTags,
    isPending: isSaving
  } = useMutation({
    mutationFn: async () => {
      await axios.patch('/api/creator-profiles/me/', { tags: selected });
    },
    onSuccess: () => {
      toast({ title: 'Теги обновлены' });
      // Инвалидируем профиль
      queryClient.invalidateQueries({ queryKey: ['creator-profile-me'] });
      navigate(-1);
    },
    onError: () => toast({ title: 'Ошибка', variant: 'destructive' }),
  });

  const toggle = (id: number) => {
    setSelected(prev => prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]);
  };

  if (isPending) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 md:p-6 max-w-2xl">
      <h1 className="text-2xl font-bold mb-4">Выберите теги</h1>
      <Card className="p-4 space-y-2">
        {tags?.map(tag => (
          <label key={tag.id} className="flex items-center gap-2 cursor-pointer">
            <Checkbox checked={selected.includes(tag.id)} onCheckedChange={() => toggle(tag.id)} />
            <span>{tag.name}</span>
          </label>
        ))}
      </Card>

      <div className="flex gap-2 mt-6">
        <Button onClick={() => navigate(-1)} variant="outline">Отмена</Button>
        <Button onClick={() => saveTags()} disabled={isSaving}>
          {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}Сохранить
        </Button>
      </div>

      {/* Выбранные */}
      {selected.length > 0 && (
        <div className="mt-6">
          <h2 className="font-medium mb-2">Будут добавлены:</h2>
          <div className="flex flex-wrap gap-2">
            {selected.map(id => {
              const tagName = tags?.find(t => t.id === id)?.name || id;
              return <Badge key={id} variant="outline">#{tagName}</Badge>;
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default TagAddPage;
