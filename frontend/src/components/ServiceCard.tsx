
import React from 'react';
import { Link } from 'react-router-dom';
import { Clock, RotateCcw, Tags } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

// Тип для моковых данных услуги
interface MockService {
  id: number;
  title: string;
  description: string;
  price: number;
  duration: string;
  revisions: number;
}

// Тип для данных услуги из API
interface APIService {
  id: number | string;
  slug?: string;
  title: string;
  description?: string;
  base_price?: number;
  max_price?: number;
  delivery_time?: string | number;
  revisions?: number;
  creator?: {
    id: number | string;
    username: string;
  };
  category?: {
    id: number | string;
    name: string;
    slug: string;
  };
  tags?: string[];
  is_available?: boolean;
  is_featured?: boolean;
  images?: Array<{
    id: number | string;
    image: string;
    alt?: string;
  }>;
  options?: Array<{
    id: number | string;
    name: string;
    price: number;
  }>;
  created_at?: string;
  updated_at?: string;
}

// Объединенный тип для обоих вариантов
type Service = MockService | APIService;

interface ServiceCardProps {
  service: Service;
  creatorId?: number | string;
}

const ServiceCard: React.FC<ServiceCardProps> = ({ service, creatorId }) => {
  // Адаптеры для получения данных из разных форматов
  const getTitle = (): string => {
    return service.title || '';
  };
  
  const getDescription = (): string => {
    if ('description' in service) return service.description || '';
    return (service as APIService).description || '';
  };
  
  const getPrice = (): number => {
    if ('price' in service) return service.price;
    return (service as APIService).base_price || 0;
  };
  
  const getDuration = (): string => {
    if ('duration' in service) return service.duration;
    const deliveryTime = (service as APIService).delivery_time;
    if (typeof deliveryTime === 'number') return `${deliveryTime} дней`;
    return deliveryTime || '3-5 дней';
  };
  
  const getRevisions = (): number => {
    if ('revisions' in service) return service.revisions;
    return (service as APIService).revisions || 0;
  };
  
  const getServiceUrl = (): string => {
    const serviceId = (service as APIService).slug || service.id;
    const creator = (service as APIService).creator;
    const actualCreatorId = creatorId || (creator ? creator.id : null);
    return `/creator/${actualCreatorId}/service/${serviceId}`;
  };
  
  const getTags = (): string[] => {
    return (service as APIService).tags || [];
  };
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-shadow duration-300">
      <h3 className="font-semibold text-gray-900 mb-2">{getTitle()}</h3>
      <p className="text-gray-600 text-sm mb-4">{getDescription()}</p>
      
      {/* Теги услуги */}
      {getTags().length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {getTags().slice(0, 3).map((tag, index) => (
            <Badge key={index} variant="outline" className="text-xs">
              {tag}
            </Badge>
          ))}
        </div>
      )}
      
      <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
        <div className="flex items-center space-x-1">
          <Clock className="w-4 h-4" />
          <span>{getDuration()}</span>
        </div>
        <div className="flex items-center space-x-1">
          <RotateCcw className="w-4 h-4" />
          <span>{getRevisions()} ревизии</span>
        </div>
      </div>
      
      <div className="flex items-center justify-between">
        <div>
          <span className="text-xs text-gray-500">от</span>
          <div className="text-lg font-bold text-purple-600">
            {getPrice().toLocaleString('ru-RU')}₽
          </div>
        </div>
        {creatorId ? (
          <Link to={getServiceUrl()}>
            <Button size="sm" className="rounded-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
              Подробнее
            </Button>
          </Link>
        ) : (
          <Button size="sm" className="rounded-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
            Заказать
          </Button>
        )}
      </div>
    </div>
  );
};

export default ServiceCard;

