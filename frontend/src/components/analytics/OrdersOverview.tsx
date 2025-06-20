/**
 * Компонент обзора заказов
 * 
 * Отображает статистику и динамику заказов за период
 */
import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LabelList,
} from 'recharts';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

interface OrdersOverviewProps {
  dateRange: {
    from: Date;
    to: Date;
  };
}

/**
 * Генерация демо-данных для статистики заказов
 * 
 * @param {Date} from - Начальная дата
 * @param {Date} to - Конечная дата
 * @returns {Object} Объект с данными статистики
 */
const generateOrdersData = (from: Date, to: Date) => {
  // Статусы заказов
  const statuses = {
    completed: { count: 82, growth: '+15%', color: 'bg-green-500' },
    inProgress: { count: 34, growth: '+8%', color: 'bg-blue-500' },
    pending: { count: 12, growth: '-3%', color: 'bg-yellow-500' },
    cancelled: { count: 5, growth: '-25%', color: 'bg-red-500' },
  };

  // Конверсия заказов
  const conversionStats = {
    viewed: 187,
    engaged: 142,
    started: 94,
    completed: 82,
  };
  
  // Данные столбчатой диаграммы по месяцам
  const months = ['Янв', 'Фев', 'Март', 'Апр', 'Май', 'Июнь', 'Июль', 'Авг', 'Сент', 'Окт', 'Нояб', 'Дек'];
  const chartData = months.map((month) => {
    const baseValue = 10 + Math.floor(Math.random() * 15);
    return {
      month,
      completed: baseValue,
      cancelled: Math.floor(Math.random() * 3),
      inProgress: Math.floor(Math.random() * 8),
    };
  });
  
  // Популярные типы контента
  const contentTypes = [
    { name: 'Видео', count: 37, percentage: 45 },
    { name: 'Монтаж', count: 24, percentage: 29 },
    { name: 'Дизайн', count: 11, percentage: 13 },
    { name: 'Фотография', count: 6, percentage: 7 },
    { name: 'Другое', count: 5, percentage: 6 },
  ];
  
  return { statuses, conversionStats, chartData, contentTypes };
};

/**
 * Компонент обзора заказов
 * 
 * @param {OrdersOverviewProps} props - Свойства компонента
 * @returns {JSX.Element} Компонент обзора заказов
 */
const OrdersOverview: React.FC<OrdersOverviewProps> = ({ dateRange }) => {
  const { statuses, conversionStats, chartData, contentTypes } = generateOrdersData(dateRange.from, dateRange.to);
  
  return (
    <div className="space-y-8">
      {/* Статистика заказов по статусам */}
      <div>
        <h3 className="font-medium text-lg mb-4">Статус заказов</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-green-700">Выполнено</p>
                <p className="text-2xl font-bold">{statuses.completed.count}</p>
              </div>
              <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">
                {statuses.completed.growth}
              </Badge>
            </div>
          </div>
          
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-blue-700">В работе</p>
                <p className="text-2xl font-bold">{statuses.inProgress.count}</p>
              </div>
              <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-200">
                {statuses.inProgress.growth}
              </Badge>
            </div>
          </div>
          
          <div className="bg-yellow-50 p-4 rounded-lg">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-yellow-700">Ожидает</p>
                <p className="text-2xl font-bold">{statuses.pending.count}</p>
              </div>
              <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-200">
                {statuses.pending.growth}
              </Badge>
            </div>
          </div>
          
          <div className="bg-red-50 p-4 rounded-lg">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-red-700">Отменено</p>
                <p className="text-2xl font-bold">{statuses.cancelled.count}</p>
              </div>
              <Badge variant="outline" className="bg-red-100 text-red-800 border-red-200">
                {statuses.cancelled.growth}
              </Badge>
            </div>
          </div>
        </div>
      </div>
      
      {/* График заказов по месяцам */}
      <div>
        <h3 className="font-medium text-lg mb-4">Динамика заказов по месяцам</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart
            data={chartData}
            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="completed" stackId="a" fill="#22c55e" name="Выполнено">
              <LabelList dataKey="completed" position="top" style={{ fontSize: '10px' }} />
            </Bar>
            <Bar dataKey="inProgress" stackId="a" fill="#3b82f6" name="В работе" />
            <Bar dataKey="cancelled" stackId="a" fill="#ef4444" name="Отменено" />
          </BarChart>
        </ResponsiveContainer>
      </div>
      
      {/* Популярные типы контента */}
      <div>
        <h3 className="font-medium text-lg mb-4">Популярные типы контента</h3>
        <div className="space-y-4">
          {contentTypes.map((type, index) => (
            <div key={index} className="space-y-2">
              <div className="flex justify-between items-center">
                <span>{type.name}</span>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-500">{type.count} заказов</span>
                  <span className="text-sm font-medium">{type.percentage}%</span>
                </div>
              </div>
              <Progress value={type.percentage} className="h-2" />
            </div>
          ))}
        </div>
      </div>
      
      {/* Конверсия заказов */}
      <div>
        <h3 className="font-medium text-lg mb-4">Конверсия заказов</h3>
        <div className="flex items-center">
          <div className="flex-1 text-center">
            <div className="text-2xl font-bold">{conversionStats.viewed}</div>
            <div className="text-sm text-gray-500">Просмотрено</div>
          </div>
          
          <div className="h-0.5 w-4 bg-gray-300"></div>
          
          <div className="flex-1 text-center">
            <div className="text-2xl font-bold">{conversionStats.engaged}</div>
            <div className="text-sm text-gray-500">Интерес</div>
          </div>
          
          <div className="h-0.5 w-4 bg-gray-300"></div>
          
          <div className="flex-1 text-center">
            <div className="text-2xl font-bold">{conversionStats.started}</div>
            <div className="text-sm text-gray-500">Начато</div>
          </div>
          
          <div className="h-0.5 w-4 bg-gray-300"></div>
          
          <div className="flex-1 text-center">
            <div className="text-2xl font-bold">{conversionStats.completed}</div>
            <div className="text-sm text-gray-500">Выполнено</div>
          </div>
        </div>
        
        {/* Процентные соотношения */}
        <div className="flex items-center mt-4">
          <div className="flex-1"></div>
          
          <div className="h-0.5 w-4 bg-gray-100"></div>
          
          <div className="flex-1 text-center">
            <div className="text-sm font-medium text-green-600">
              {Math.round(conversionStats.engaged / conversionStats.viewed * 100)}%
            </div>
          </div>
          
          <div className="h-0.5 w-4 bg-gray-100"></div>
          
          <div className="flex-1 text-center">
            <div className="text-sm font-medium text-green-600">
              {Math.round(conversionStats.started / conversionStats.engaged * 100)}%
            </div>
          </div>
          
          <div className="h-0.5 w-4 bg-gray-100"></div>
          
          <div className="flex-1 text-center">
            <div className="text-sm font-medium text-green-600">
              {Math.round(conversionStats.completed / conversionStats.started * 100)}%
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrdersOverview;