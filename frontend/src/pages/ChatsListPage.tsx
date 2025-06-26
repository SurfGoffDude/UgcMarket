import React from 'react';
import ChatsList from '@/components/chats/ChatsList';
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
 * Отображает список всех чатов текущего пользователя
 */
const ChatsListPage: React.FC = () => {
  return (
    <>
      
      <div className="container mx-auto px-4 py-6 max-w-5xl">
        <Card>
          <CardHeader>
            <CardTitle>Мои чаты</CardTitle>
            <CardDescription>
              Общайтесь с клиентами и креаторами в рамках заказов
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ChatsList />
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default ChatsListPage;