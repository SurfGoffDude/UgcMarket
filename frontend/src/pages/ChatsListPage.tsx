import React from 'react';
import CreatorsList from '@/components/chats/CreatorsList';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';

/**
 * Страница списка чатов
 * 
 * Отображает список доступных креаторов, с которыми у пользователя есть чаты
 */
const ChatsListPage: React.FC = () => {
  return (
    <>
      
      <div className="container mx-auto px-4 py-6 max-w-5xl">
        <Card>
          <CardHeader>
            <CardTitle>Мои чаты</CardTitle>
            <CardDescription>
              Общайтесь с креаторами в рамках заказов или по другим вопросам
            </CardDescription>
          </CardHeader>
          <CardContent>
            <CreatorsList />
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default ChatsListPage;