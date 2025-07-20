import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/api/client';
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
  // Профиль креатора. Теги могут быть как id, так и строковыми именами
  interface CreatorProfile { id: number; tags: (number | string)[] }
  const { data: profileData, isPending: profilePending } = useQuery<CreatorProfile>({
    queryKey: ['creator-profile-me'],
    queryFn: async () => {
      const res = await apiClient.get<CreatorProfile>('creator-profiles/me/?detail=true');
      return res.data;
    },
    retry: false,
  });

  const [selected, setSelected] = useState<number[]>([]);

  

  // Получить все теги
  interface Tag { id: number; name: string; category: any; type?: string }

  

  const { data: allTags = [], isPending, isError } = useQuery<Tag[]>({
    queryKey: ['tags'],
    queryFn: async () => {
      try {
        // Добавляем параметр type=creator для фильтрации на бэкенде
        const res = await apiClient.get('tags/', { params: { type: 'creator' } });
        const payload = res.data;
        if (Array.isArray(payload)) return payload as Tag[];
        return (payload?.results ?? []) as Tag[];
      } catch (e: any) {
        if (e?.response?.status === 404) {
          // Бэк вернул 404 — считаем, что тегов нет
          return [];
        }
        throw e; // Прочие ошибки отдадим react-query
      }
    },
    retry: false,
  });

  // Когда и профиль, и список тегов загружены  // Дополнительная фильтрация на стороне клиента
  const tags = React.useMemo(() => {
    // Выводим в консоль первый тег для анализа структуры

    
    // Фильтруем только теги с типом creator, строго
    return allTags.filter(tag => {
      // Строгая проверка - только type='creator'
      return tag.type === 'creator';
    });
  }, [allTags]);

  // Когда и профиль, и список тегов загружены — конвертируем теги из профиля (имена/id) в id
  useEffect(() => {
    if (!profileData?.tags || tags.length === 0) return;

    const profileTags = profileData.tags;
    const selectedIds = tags
      .filter(tag => {
        if (typeof profileTags[0] === 'number') {
          return (profileTags as number[]).includes(tag.id);
        }
        // Если в профиле теги как строки, сравниваем по имени
        return (profileTags as string[]).includes(tag.name);
      })
      .map(tag => tag.id);

    setSelected(selectedIds);
  }, [profileData, tags]);

  const {
    mutate: saveTags,
    isPending: isSaving
  } = useMutation({
    mutationFn: async () => {
      await apiClient.patch('creator-profiles/me/', { tags: selected });
    },
    onSuccess: () => {
      toast({ title: 'Теги обновлены' });
      // Инвалидируем профиль
      queryClient.invalidateQueries({ queryKey: ['creator-profile-me'] });
      navigate(-1);
    },
    onError: () => toast({ title: 'Ошибка', variant: 'destructive' }),
  });

  const MAX = 10;
  const toggle = (id: number) => {
    setSelected(prev => {
      if (prev.includes(id)) return prev.filter(t => t !== id);
      if (prev.length >= MAX) {
        toast({ title: `Можно выбрать не более ${MAX} тегов`, variant: 'destructive' });
        return prev;
      }
      return [...prev, id];
    });
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
      {/* Дополнительная отладочная информация для анализа тегов */}
      {(() => {
        // Выводим всю информацию о тегах для анализа

        return null;
      })()}
      
      <div className="flex flex-col gap-4">
        {Object.entries(
          // Без фильтрации, чтобы видеть все теги
          tags.reduce<Record<string, Tag[]>>((acc, t) => {
            const catKey = typeof t.category === 'object' ? JSON.stringify(t.category) : String(t.category);
            if (!acc[catKey]) {
              acc[catKey] = [];
            }
            // Проверка на дубликаты по id
            if (!acc[catKey].some(item => item.id === t.id)) {
              acc[catKey].push(t);
            }
            return acc;
          }, {})
        ).map(([cat, list]) => (
          <Card key={cat} className="p-4 mb-4 break-inside-avoid">
            <h2 className="font-semibold mb-2">
              {(() => {
                try {
                  // Извлекаем только название категории
                  const catStr = String(cat); // Приводим к строке для безопасной работы
                  
                  // Если это JSON-строка объекта, пробуем парсить
                  if (catStr && typeof catStr === 'string' && catStr.startsWith('{')) {
                    try {
                      const parsed = JSON.parse(catStr);
                      // Извлекаем читаемое имя без id
                      return parsed.name || 'Без категории';
                    } catch (e) {
                      return 'Неизвестная категория';
                    }
                  }
                  
                  // Если это простая строка
                  if (cat !== null && typeof cat === 'string' && catStr && !catStr.startsWith('{')) {
                    return cat;
                  }
                  
                  return 'Без категории';
                } catch {
                  return 'Без категории';
                }
              })()}
            </h2>
            <div className="flex flex-wrap gap-2">
              {list.map(tag => (
                <label key={tag.id} className="flex items-center gap-2 cursor-pointer">
                  <Checkbox checked={selected.includes(tag.id)} onCheckedChange={() => toggle(tag.id)} />
                  <span>{tag.name}</span>
                </label>
              ))}
            </div>
          </Card>
        ))}
      </div>

      <div className="flex gap-2 mt-6">
        <Button onClick={() => navigate(-1)} variant="outline">Отмена</Button>
        <div>
          <p className="text-sm text-gray-500 mb-2">Выбрано: {selected.length} тегов. Всего тегов с типом creator: {tags.length}</p>
          <Button
            className="mt-2"
            onClick={() => saveTags()}
            disabled={isPending || isSaving}
            variant="default"
          >
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Сохранить выбранные теги
          </Button>
        </div>
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
