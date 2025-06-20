import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Upload, Plus, X, Eye } from 'lucide-react';
import OrderPreview from '@/components/OrderPreview';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';

/**
 * Страница создания нового заказа
 * 
 * Включает функции редактирования и предпросмотра заказа перед публикацией
 */
const CreateOrder = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Состояние для переключения между редактированием и предпросмотром
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    contentType: '',
    platform: '',
    deadline: '',
    budget: '',
    privacy: 'open',
    references: [] as string[]
  });

  const [referenceInput, setReferenceInput] = useState('');

  const contentTypes = [
    'Видео',
    'Монтаж',
    'Музыка/Звук',
    'Дизайн',
    'Анимация',
    'Фотография',
    'Копирайтинг',
    'Voice-over'
  ];

  const platforms = [
    'YouTube',
    'TikTok',
    'Instagram',
    'Telegram',
    'VK',
    'Twitch',
    'Facebook',
    'Другое'
  ];

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const addReference = () => {
    if (referenceInput.trim()) {
      setFormData(prev => ({
        ...prev,
        references: [...prev.references, referenceInput.trim()]
      }));
      setReferenceInput('');
    }
  };

  const removeReference = (index: number) => {
    setFormData(prev => ({
      ...prev,
      references: prev.references.filter((_, i) => i !== index)
    }));
  };

  /**
   * Переключение между режимом редактирования и предпросмотра
   */
  const handlePreviewToggle = () => {
    setIsPreviewMode(!isPreviewMode);
  };

  /**
   * Обработка отправки формы
   */
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.description || !formData.contentType || !formData.platform) {
      toast({
        title: "Ошибка",
        description: "Заполните обязательные поля: название, описание, тип контента и платформа",
        variant: "destructive"
      });
      return;
    }
    
    // В реальном приложении здесь будет отправка данных на сервер
    console.log('Отправка данных заказа:', formData);
    
    toast({
      title: "Успешно",
      description: "Ваш заказ успешно опубликован!",
    });
    
    navigate('/orders');
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="container mx-auto py-8">
        {isPreviewMode ? (
          <OrderPreview 
            title={formData.title}
            description={formData.description}
            contentType={formData.contentType}
            platform={formData.platform}
            deadline={formData.deadline}
            budget={formData.budget}
            privacy={formData.privacy}
            references={formData.references}
            onEdit={handlePreviewToggle}
            onPublish={() => {
              const fakeEvent = { preventDefault: () => {} };
              handleSubmit(fakeEvent as React.FormEvent);
            }}
          />
        ) : (
          <div>
            {/* Header */}
            <div className="bg-white border-b border-gray-200">
              <div className="container mx-auto px-4 py-4">
                <div className="flex items-center space-x-4">
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => navigate(-1)}
                    className="flex items-center space-x-2"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Назад</span>
                  </Button>
                  <h1 className="text-xl font-bold">Создать новый заказ</h1>
                </div>
              </div>
            </div>

            {/* Form */}
            <div className="container mx-auto px-4 py-8">
              <form onSubmit={handleSubmit} className="space-y-8 max-w-4xl mx-auto">
                {/* Основная информация */}
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                  <h2 className="text-xl font-semibold text-gray-900 mb-6">Основная информация</h2>
                  
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="title" className="text-sm font-medium">
                        Название заказа <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="title"
                        value={formData.title}
                        onChange={(e) => handleInputChange('title', e.target.value)}
                        placeholder="Краткое и ясное название заказа"
                        className="mt-1"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="description" className="text-sm font-medium">
                        Описание задачи <span className="text-red-500">*</span>
                      </Label>
                      <Textarea
                        id="description"
                        value={formData.description}
                        onChange={(e) => handleInputChange('description', e.target.value)}
                        placeholder="Опишите детали задачи, требования и ожидания"
                        className="mt-1 min-h-[150px]"
                      />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="contentType" className="text-sm font-medium">
                          Тип контента <span className="text-red-500">*</span>
                        </Label>
                        <Select 
                          value={formData.contentType}
                          onValueChange={(value) => handleInputChange('contentType', value)}
                        >
                          <SelectTrigger id="contentType" className="mt-1">
                            <SelectValue placeholder="Выберите тип контента" />
                          </SelectTrigger>
                          <SelectContent>
                            {contentTypes.map((type) => (
                              <SelectItem key={type} value={type}>{type}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div>
                        <Label htmlFor="platform" className="text-sm font-medium">
                          Платформа <span className="text-red-500">*</span>
                        </Label>
                        <Select 
                          value={formData.platform}
                          onValueChange={(value) => handleInputChange('platform', value)}
                        >
                          <SelectTrigger id="platform" className="mt-1">
                            <SelectValue placeholder="Выберите платформу" />
                          </SelectTrigger>
                          <SelectContent>
                            {platforms.map((platform) => (
                              <SelectItem key={platform} value={platform}>{platform}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="deadline" className="text-sm font-medium">
                          Срок выполнения
                        </Label>
                        <Input
                          id="deadline"
                          type="date"
                          value={formData.deadline}
                          onChange={(e) => handleInputChange('deadline', e.target.value)}
                          className="mt-1"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="budget" className="text-sm font-medium">
                          Бюджет (₽)
                        </Label>
                        <Input
                          id="budget"
                          type="number"
                          value={formData.budget}
                          onChange={(e) => handleInputChange('budget', e.target.value)}
                          placeholder="Укажите бюджет"
                          className="mt-1"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Референсы */}
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                  <h2 className="text-xl font-semibold text-gray-900 mb-6">Референсы и материалы</h2>
                  
                  <div className="space-y-4">
                    <div className="flex space-x-2">
                      <Input
                        value={referenceInput}
                        onChange={(e) => setReferenceInput(e.target.value)}
                        placeholder="Добавьте ссылки на референсы или материалы"
                        className="flex-1"
                      />
                      <Button 
                        type="button"
                        onClick={addReference}
                        size="icon"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    {formData.references.length > 0 && (
                      <div className="space-y-2">
                        {formData.references.map((ref, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded-md"
                          >
                            <a 
                              href={ref} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline truncate"
                            >
                              {ref}
                            </a>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeReference(index)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Приватность */}
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                  <h2 className="text-xl font-semibold text-gray-900 mb-6">Настройки публикации</h2>
                  
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="open"
                        checked={formData.privacy === 'open'}
                        onCheckedChange={(checked) => handleInputChange('privacy', checked ? 'open' : 'private')}
                      />
                      <Label htmlFor="open" className="text-sm">
                        Открытый заказ - все креаторы могут откликнуться
                      </Label>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="private"
                        checked={formData.privacy === 'private'}
                        onCheckedChange={(checked) => handleInputChange('privacy', checked ? 'private' : 'open')}
                      />
                      <Label htmlFor="private" className="text-sm">
                        По приглашению - только выбранные креаторы
                      </Label>
                    </div>
                  </div>
                </div>

                {/* Кнопки */}
                <div className="flex space-x-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate(-1)}
                    className="flex-1"
                  >
                    Отмена
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={handlePreviewToggle}
                    className="flex-1"
                  >
                    <Eye className="mr-2 h-4 w-4" />
                    Предпросмотр
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1 btn-gradient"
                  >
                    Опубликовать заказ
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CreateOrder;