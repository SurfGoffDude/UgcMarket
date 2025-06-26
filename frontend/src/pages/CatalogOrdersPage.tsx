import React from 'react';
import OrdersList from '@/components/orders/OrdersList';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';

/**
 * Страница каталога заявок
 * 
 * Отображает список доступных заказов для выполнения креаторами
 */
const CatalogOrdersPage: React.FC = () => {
  return (
    <div className="container mx-auto px-4 py-6 max-w-5xl">
      <Card>
        <CardHeader>
          <CardTitle>Каталог заявок</CardTitle>
          <CardDescription>
            Просмотрите доступные заказы и откликнитесь на интересующие вас
          </CardDescription>
        </CardHeader>
        <CardContent>
          <OrdersList 
            showPublicOnly={true} 
            defaultSortOrder="newest"
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default CatalogOrdersPage;