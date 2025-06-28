import React, { useState, FormEvent, KeyboardEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, X, Eye, Check, Tag as TagIcon } from 'lucide-react';

import OrderPreview from '@/components/OrderPreview';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';

import { useToast } from '@/hooks/use-toast';
import { createCustomOrder } from '@/api/ordersApi';
import { tagCategories, Tag as OrderTag, TagCategory } from '../../public/tags_orders_categories';

/**
 * Страница создания нового заказа.
 * Исправлены ошибки линтера и компиляции TypeScript/TSX.
 * Обновлено для использования тегов из статического файла.
 */
const CreateOrder: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  // preview toggle
  const [isPreviewMode, setIsPreviewMode] = useState(false);

  // input helpers
  const [referenceInput, setReferenceInput] = useState('');

  // выбранная категория тегов
  const [activeCategory, setActiveCategory] = useState<string>(tagCategories[0].id);

  // основной стейт формы
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    deadline: '',
    budget: '',
    is_private: false,
    target_creator: null as number | null,
    tags: [] as string[],
    references: [] as string[],
  });

  /* ---------------------------- helpers ---------------------------- */
  const handleInputChange = <K extends keyof typeof formData>(field: K, value: typeof formData[K]) =>
    setFormData((prev) => ({ ...prev, [field]: value }));

  const addReference = () => {
    const trimmed = referenceInput.trim();
    if (!trimmed) return;
    handleInputChange('references', [...formData.references, trimmed]);
    setReferenceInput('');
  };

  const removeReference = (idx: number) =>
    handleInputChange(
      'references',
      formData.references.filter((_, i) => i !== idx),
    );

  const togglePreview = () => setIsPreviewMode((p) => !p);

  /* --------------------------- submit --------------------------- */
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    try {
      const payload = {
        title: formData.title,
        description: formData.description,
        tags_ids: formData.tags
          .map(tagId => parseInt(tagId))
          .filter(tagId => !isNaN(tagId) && tagId > 0), // преобразуем в number[] и фильтруем недопустимые значения
        budget: Number(formData.budget) || 0,
        deadline: formData.deadline,
        is_private: formData.is_private,
        target_creator_id: formData.target_creator,
        references: formData.references,
      };

      const newOrder = await createCustomOrder(payload);

      toast({
        title: 'Заказ успешно создан!',
        description: 'Ваш заказ опубликован и доступен для откликов.',
      });
      navigate(`/orders/${newOrder.id}`);
    } catch (err: any) {
      console.error(err);
      toast({
        title: 'Ошибка при создании заказа',
        description: err?.message ?? 'Попробуйте позже.',
        variant: 'destructive',
      });
    }
  };

  /* --------------------------- derived --------------------------- */
  const selectedTags: OrderTag[] = formData.tags
    .map((id) => tagCategories.flatMap((c) => c.tags).find((t) => t.id === id))
    .filter(Boolean) as OrderTag[];
    
  // Ищем категорию тегов по ID
  const findCategoryById = (id: string) => tagCategories.find((cat) => cat.id === id);
  
  // Обработчик выбора тега
  const handleTagSelect = (tag: OrderTag) => {
    if (formData.tags.includes(tag.id)) {
      // Если тег уже выбран, удалить его
      handleInputChange('tags', formData.tags.filter((id) => id !== tag.id));
    } else {
      // Иначе добавить тег
      handleInputChange('tags', [...formData.tags, tag.id]);
    }
  };
  
  // Функция проверки, выбран ли тег
  const isTagSelected = (tagId: string) => formData.tags.includes(tagId);

  // Функция для отображения тега со значком check, если выбран
  const preventDefault = () => {};

  /* --------------------------- render --------------------------- */
  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="container mx-auto py-8">
        {isPreviewMode ? (
          <OrderPreview
            title={formData.title}
            description={formData.description}
            contentType=""
            deadline={formData.deadline}
            budget={formData.budget}
            privacy={formData.is_private ? 'private' : 'open'}
            references={formData.references}
            tags={selectedTags}
            onEdit={togglePreview}
            onPublish={() => {
              // Создаем пустое событие для вызова handleSubmit
              const syntheticEvent = { preventDefault } as FormEvent;
              handleSubmit(syntheticEvent);
            }}
          />
        ) : (
          <>
            {/* Header */}
            <div className="bg-white border-b border-gray-200">
              <div className="container mx-auto px-4 py-4 flex items-center space-x-4">
                <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
                  <ArrowLeft className="w-4 h-4 mr-1" />
                  Назад
                </Button>
                <h1 className="text-xl font-bold">Создать новый заказ</h1>
              </div>
            </div>

            {/* Form */}
            <div className="container mx-auto px-4 py-8">
              <form onSubmit={handleSubmit} className="space-y-8 max-w-4xl mx-auto">
                {/* Основная информация */}
                <section className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 space-y-4">
                  <h2 className="text-xl font-semibold text-gray-900">Основная информация</h2>

                  <div className="mb-4">
                    <Label htmlFor="title" className="block mb-2 font-medium">Название заказа*</Label>
                    <Input
                      id="title"
                      placeholder="Введите название заказа"
                      value={formData.title}
                      onChange={(e) => handleInputChange('title', e.target.value)}
                      required
                    />
                  </div>

                  <div className="mb-4">
                    <Label htmlFor="description" className="block mb-2 font-medium">Описание*</Label>
                    <Textarea
                      id="description"
                      placeholder="Детально опишите что вам нужно..."
                      rows={5}
                      value={formData.description}
                      onChange={(e) => handleInputChange('description', e.target.value)}
                      required
                      className="resize-none"
                    />
                  </div>
                </section>
                
                {/* Категории и теги */}
                <section className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 space-y-4 mb-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">Категории и теги</h2>
                  
                  <div className="mb-6">
                    <h3 className="text-sm font-medium mb-2">Выберите категорию:</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                      {tagCategories.map((cat) => (
                        <button
                          key={cat.id}
                          type="button"
                          className={`flex items-center gap-1 p-2 rounded-lg border text-sm transition-colors
                            ${activeCategory === cat.id 
                              ? 'bg-primary text-white border-primary' 
                              : 'bg-gray-50 hover:bg-gray-100 border-gray-200'}
                          `}
                          onClick={() => setActiveCategory(cat.id)}
                        >
                          <span className="text-lg">{cat.emoji}</span>
                          <span>{cat.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  <Tabs value={activeCategory} onValueChange={setActiveCategory} className="w-full">
                    
                    {tagCategories.map((category) => (
                      <TabsContent key={category.id} value={category.id} className="space-y-3">
                        <div className="flex flex-wrap gap-2">
                          {category.tags.map((tag) => (
                            <Badge 
                              key={tag.id}
                              variant={isTagSelected(tag.id) ? "default" : "outline"}
                              className={`cursor-pointer px-3 py-1 ${isTagSelected(tag.id) ? 'bg-primary text-white' : 'bg-gray-100 hover:bg-gray-200'}`}
                              onClick={() => handleTagSelect(tag)}
                            >
                              {isTagSelected(tag.id) && <Check className="w-3 h-3 mr-1" />}
                              {tag.name}
                            </Badge>
                          ))}
                        </div>
                      </TabsContent>
                    ))}
                  </Tabs>
                  
                  {selectedTags.length > 0 && (
                    <div className="mt-4">
                      <Label className="block mb-2 font-medium">Выбранные теги:</Label>
                      <div className="flex flex-wrap gap-2">
                        {selectedTags.map((tag) => (
                          <Badge 
                            key={tag.id} 
                            className="bg-primary flex items-center gap-1 group"
                          >
                            {tag.name}
                            <X 
                              className="w-3 h-3 cursor-pointer opacity-60 group-hover:opacity-100" 
                              onClick={() => handleInputChange('tags', formData.tags.filter(id => id !== tag.id))}
                            />
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </section>
                
                {/* Сроки и бюджет */}
                <section className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 space-y-4">
                  <h2 className="text-xl font-semibold text-gray-900">Сроки и бюджет</h2>
                  
                  <div className="mb-4">
                    <Label htmlFor="deadline" className="block mb-2 font-medium">Срок выполнения</Label>
                    <Input
                      id="deadline"
                      type="date"
                      value={formData.deadline}
                      onChange={(e) => handleInputChange('deadline', e.target.value)}
                    />
                  </div>

                  <div className="mb-4">
                    <Label htmlFor="budget" className="block mb-2 font-medium">Бюджет (₽)</Label>
                    <Input
                      id="budget"
                      type="number"
                      placeholder="Укажите бюджет в рублях"
                      value={formData.budget}
                      onChange={(e) => handleInputChange('budget', e.target.value)}
                    />
                  </div>
                </section>

                {/* Референсы */}
                <section className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 space-y-4">
                  <h2 className="text-xl font-semibold text-gray-900">Референсы (ссылки на примеры)</h2>
                  
                  <div className="flex space-x-2">
                    <Input
                      value={referenceInput}
                      onChange={(e) => setReferenceInput(e.target.value)}
                      placeholder="https://example.com"
                      onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addReference();
                        }
                      }}
                      className="flex-1"
                    />
                    <Button type="button" size="icon" onClick={addReference}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  {formData.references.length > 0 && (
                    <div className="space-y-2 mt-3">
                      {formData.references.map((ref, i) => (
                        <div key={i} className="flex justify-between items-center bg-gray-50 p-2 rounded-md">
                          <a href={ref} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline truncate">
                            {ref}
                          </a>
                          <Button type="button" variant="ghost" size="sm" onClick={() => removeReference(i)}>
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </section>

                {/* Приватность */}
                <section className="space-y-4 bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                  <h2 className="text-xl font-semibold text-gray-900">Настройки приватности</h2>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="is_private"
                      checked={formData.is_private}
                      onCheckedChange={(checked) => handleInputChange('is_private', Boolean(checked))}
                    />
                    <Label htmlFor="is_private">Приватный заказ</Label>
                  </div>

                  {formData.is_private && (
                    <div>
                      <Label htmlFor="target_creator" className="block mb-2 font-medium">ID креатора*</Label>
                      <Input
                        id="target_creator"
                        type="number"
                        placeholder="ID креатора"
                        value={formData.target_creator ?? ''}
                        onChange={(e) => handleInputChange('target_creator', e.target.value ? Number(e.target.value) : null)}
                      />
                    </div>
                  )}
                </section>

                {/* Кнопки */}
                <div className="flex space-x-4">
                  <Button type="button" variant="outline" onClick={() => navigate(-1)} className="flex-1">
                    Отмена
                  </Button>
                  <Button type="button" variant="secondary" onClick={togglePreview} className="flex-1">
                    <Eye className="mr-2 h-4 w-4" />
                    Предпросмотр
                  </Button>
                  <Button type="submit" className="flex-1 btn-gradient">
                    Опубликовать заказ
                  </Button>
                </div>
              </form>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default CreateOrder;