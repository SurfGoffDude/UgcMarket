/**
 * Компонент для предпросмотра заказа перед публикацией
 * 
 * Позволяет пользователю увидеть, как будет выглядеть заказ после публикации.
 */
import React from 'react';
import { Calendar, Clock, DollarSign, Tag, Link as LinkIcon, Globe, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

interface Reference {
  url: string;
  description?: string;
}

interface OrderPreviewProps {
  title: string;
  description: string;
  contentType: string;
  deadline: string;
  budget: string;
  privacy: string;
  references: string[];
  tags?: { id: string; name: string }[];
  onEdit: () => void;
  onPublish: () => void;
}

/**
 * Компонент предпросмотра заказа
 * 
 * @param {OrderPreviewProps} props - Свойства компонента
 * @returns {JSX.Element} Компонент предпросмотра заказа
 */
const OrderPreview: React.FC<OrderPreviewProps> = ({ 
  title, 
  description,
  contentType,
  deadline,
  budget,
  privacy,
  references,
  tags = [],
  onEdit,
  onPublish
}) => {
  // Функция для форматирования даты
  const formatDate = (dateString: string): string => {
    if (!dateString) return 'Не указано';
    
    try {
      const date = new Date(dateString);
      return new Intl.DateTimeFormat('ru-RU', { 
        day: 'numeric', 
        month: 'long', 
        year: 'numeric' 
      }).format(date);
    } catch (error) {
      return dateString;
    }
  };
  
  // Функция для форматирования бюджета
  const formatBudget = (budgetValue: string): string => {
    if (!budgetValue) return 'По договоренности';
    
    try {
      const number = parseFloat(budgetValue);
      return new Intl.NumberFormat('ru-RU', {
        style: 'currency',
        currency: 'RUB',
        maximumFractionDigits: 0
      }).format(number);
    } catch (error) {
      return budgetValue;
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <Card className="overflow-hidden border-0 shadow-lg">
        <CardHeader className="bg-[#E95C4B] text-white p-8">
          <div className="mb-4 flex justify-between items-center">
            <Badge variant="secondary" className="bg-white/20 hover:bg-white/30">
              {privacy === 'open' ? 'Открытый заказ' : 'Приватный заказ'}
            </Badge>
            
            <Badge variant="secondary" className="bg-white/20 hover:bg-white/30">
              Черновик
            </Badge>
          </div>
          
          <CardTitle className="text-3xl font-bold mb-4">{title || 'Без названия'}</CardTitle>
          
          <div className="flex flex-wrap gap-3">
            {contentType && (
              <Badge variant="outline" className="text-white border-white/40 bg-white/10">
                {contentType}
              </Badge>
            )}
            

          </div>
        </CardHeader>
        
        <CardContent className="p-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {deadline && (
              <div className="flex items-center gap-3">
                <div className="bg-[#FCF5F4] p-3 rounded-full">
                  <Calendar className="h-5 w-5 text-[#E95C4B]" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Срок выполнения</p>
                  <p className="font-medium">{formatDate(deadline)}</p>
                </div>
              </div>
            )}
            
            <div className="flex items-center gap-3">
              <div className="bg-[#FCF5F4] p-3 rounded-full">
                <DollarSign className="h-5 w-5 text-[#E95C4B]" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Бюджет</p>
                <p className="font-medium">{formatBudget(budget)}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="bg-[#FCF5F4] p-3 rounded-full">
                {privacy === 'open' ? (
                  <Globe className="h-5 w-5 text-[#E95C4B]" />
                ) : (
                  <Users className="h-5 w-5 text-[#E95C4B]" />
                )}
              </div>
              <div>
                <p className="text-sm text-gray-500">Видимость</p>
                <p className="font-medium">
                  {privacy === 'open' ? 'Для всех креаторов' : 'По приглашению'}
                </p>
              </div>
            </div>
          </div>
          
          <div className="mb-8">
            <h2 className="text-lg font-semibold mb-4">Описание задачи</h2>
            <div className="bg-gray-50 p-4 rounded-lg">
              {description ? (
                <p className="whitespace-pre-wrap">{description}</p>
              ) : (
                <p className="text-gray-500 italic">Описание не добавлено</p>
              )}
            </div>
          </div>
          
          {tags && tags.length > 0 && (
            <div className="mb-8">
              <h2 className="text-lg font-semibold mb-4">Теги</h2>
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <Badge key={tag.id} variant="secondary" className="py-1.5">
                    <Tag className="h-3.5 w-3.5 mr-1.5" />
                    {tag.name}
                  </Badge>
                ))}
              </div>
            </div>
          )}
          
          {references && references.length > 0 && (
            <div className="mb-8">
              <h2 className="text-lg font-semibold mb-4">Референсы и материалы</h2>
              <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                {references.map((ref, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <LinkIcon className="h-4 w-4 text-gray-400" />
                    <a 
                      href={ref} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline truncate"
                    >
                      {ref}
                    </a>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
        
        <Separator />
        
        <CardFooter className="p-6 flex justify-between">
          <Button
            variant="outline"
            onClick={onEdit}
          >
            Вернуться к редактированию
          </Button>
          
          <Button
            onClick={onPublish}
            className="bg-[#E95C4B] hover:bg-[#d54538] text-white"
          >
            Опубликовать заказ
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default OrderPreview;