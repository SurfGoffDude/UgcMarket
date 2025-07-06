import React from 'react';
import { Link } from 'react-router-dom';
import { Clock, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

// Тип для данных услуги из API
interface Service {
  id: number;
  title: string;
  description: string;
  price: string;
  estimated_time: string; // Устаревшее поле, оставлено для совместимости
  estimated_time_value?: number; // Количество единиц времени
  estimated_time_unit?: string; // Единица измерения времени (hour, day, week, month, year)
  allows_modifications: boolean;
  modifications_price: string | null;
  creator_username: string;
  creator_profile: number;
}

interface ServiceCardProps {
  service: Service;
}

/**
 * Форматирует время выполнения услуги с учетом новых полей
 * @param service - данные услуги
 * @returns отформатированное время выполнения
 */
const formatEstimatedTime = (service: Service): string => {
  // Если есть новые поля, используем их
  if (service.estimated_time_value && service.estimated_time_unit) {
    const value = service.estimated_time_value;
    const unit = service.estimated_time_unit;
    
    // Функция для правильного склонения в зависимости от количества
    const getUnitText = (): string => {
      switch (unit) {
        case 'hour':
          return value === 1 ? 'час' : value < 5 ? 'часа' : 'часов';
        case 'day':
          return value === 1 ? 'день' : value < 5 ? 'дня' : 'дней';
        case 'week':
          return value === 1 ? 'неделя' : value < 5 ? 'недели' : 'недель';
        case 'month':
          return value === 1 ? 'месяц' : value < 5 ? 'месяца' : 'месяцев';
        case 'year':
          return value === 1 ? 'год' : value < 5 ? 'года' : 'лет';
        default:
          return '';
      }
    };
    
    return `${value} ${getUnitText()}`;
  } 
  
  // Если нет новых полей, используем старое поле
  return service.estimated_time || 'Не указано';
};

const ServiceCard: React.FC<ServiceCardProps> = ({ service }) => {

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-shadow duration-300">
      <h3 className="font-semibold text-gray-900 mb-2">{service.title}</h3>
      <p className="text-gray-600 text-sm mb-4 break-words">{service.description}</p>
      
      <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
        <div className="flex items-center space-x-1">
          <Clock className="w-4 h-4" />
          <span>
            {formatEstimatedTime(service)}
          </span>
        </div>
        <div className="flex items-center space-x-1">
          <RotateCcw className="w-4 h-4" />
          <span>{service.allows_modifications ? 'Правки разрешены' : 'Без правок'}</span>
        </div>
      </div>
      
      <div className="flex items-center justify-between">
        <div>
          <span className="text-xs text-gray-500">от</span>
          <div className="text-lg font-bold text-[#E95C4B]">
            {parseFloat(service.price).toLocaleString('ru-RU')}₽
          </div>
        </div>
        <Link to={`/services/${service.id}`}>
          <Button size="sm" className="rounded-full bg-[#E95C4B] hover:bg-[#d54538]">
            Подробнее
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default ServiceCard;