/**
 * Компонент ключевых показателей эффективности
 * 
 * Отображает линейные графики основных метрик в сравнении с предыдущим периодом
 */
import React, { useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceArea
} from 'recharts';
import { Badge } from '@/components/ui/badge';

interface PerformanceMetricsProps {
  dateRange: {
    from: Date;
    to: Date;
  };
}

/**
 * Генерация демо-данных для показателей эффективности
 * 
 * @param {Date} from - Начальная дата
 * @param {Date} to - Конечная дата
 * @returns {Object} Объект с данными
 */
const generatePerformanceData = (from: Date, to: Date) => {
  const diffTime = Math.abs(to.getTime() - from.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  // Определяем интервалы в зависимости от диапазона дат
  const dataPoints = diffDays <= 30 ? 10 : diffDays <= 90 ? 12 : 12;
  
  const randomTrend = (base: number, volatility: number, trend: number) => {
    return Array(dataPoints).fill(0).map((_, index) => {
      const trendFactor = 1 + (trend * index / (dataPoints - 1));
      const randomFactor = 1 + (Math.random() * volatility * 2 - volatility);
      return Math.round(base * trendFactor * randomFactor);
    });
  };
  
  // Генерируем данные с общими тенденциями
  const completionRateData = randomTrend(85, 0.05, 0.08); // Растет
  const satisfactionScoreData = randomTrend(90, 0.03, 0.05); // Медленный рост
  const avgResponseTimeData = randomTrend(12, 0.1, -0.1); // Снижается (это хорошо для времени отклика)
  const avgOrderValueData = randomTrend(25000, 0.1, 0.15); // Хороший рост
  
  // Создаем массив данных
  const data = Array(dataPoints).fill(0).map((_, index) => {
    const pointDate = new Date(from);
    pointDate.setDate(from.getDate() + Math.round(index * diffDays / (dataPoints - 1)));
    
    const formattedDate = new Intl.DateTimeFormat('ru-RU', { 
      day: '2-digit',
      month: 'short'
    }).format(pointDate);
    
    return {
      date: formattedDate,
      completionRate: completionRateData[index],
      satisfactionScore: satisfactionScoreData[index],
      avgResponseTime: avgResponseTimeData[index],
      avgOrderValue: avgOrderValueData[index]
    };
  });
  
  // Расчет роста показателей
  const getGrowth = (data: number[]) => {
    const lastValue = data[data.length - 1];
    const firstValue = data[0];
    return ((lastValue - firstValue) / firstValue * 100).toFixed(1);
  };
  
  const performanceGrowth = {
    completionRate: getGrowth(completionRateData),
    satisfactionScore: getGrowth(satisfactionScoreData),
    avgResponseTime: getGrowth(avgResponseTimeData),
    avgOrderValue: getGrowth(avgOrderValueData)
  };
  
  return { data, performanceGrowth };
};

/**
 * Форматирование значения в соответствии с типом метрики
 * 
 * @param {string} metricType - Тип метрики
 * @param {number} value - Значение для форматирования
 * @returns {string} Отформатированное значение
 */
const formatMetricValue = (metricType: string, value: number) => {
  switch(metricType) {
    case 'completionRate':
    case 'satisfactionScore':
      return `${value}%`;
    case 'avgResponseTime':
      return `${value} ч`;
    case 'avgOrderValue':
      return new Intl.NumberFormat('ru-RU', {
        style: 'currency',
        currency: 'RUB',
        maximumFractionDigits: 0
      }).format(value);
    default:
      return value.toString();
  }
};

/**
 * Компонент ключевых показателей эффективности
 * 
 * @param {PerformanceMetricsProps} props - Свойства компонента
 * @returns {JSX.Element} Компонент показателей эффективности
 */
const PerformanceMetrics: React.FC<PerformanceMetricsProps> = ({ dateRange }) => {
  const { data, performanceGrowth } = generatePerformanceData(dateRange.from, dateRange.to);
  
  // Состояние для выбора активной метрики
  const [activeMetric, setActiveMetric] = useState<string>('completionRate');
  
  // Конфигурация метрик
  const metrics = [
    {
      id: 'completionRate',
      name: 'Коэффициент завершения',
      description: 'Процент успешно выполненных заказов',
      color: '#3b82f6',
      suffix: '%',
      growth: performanceGrowth.completionRate,
      isPositive: parseFloat(performanceGrowth.completionRate) > 0
    },
    {
      id: 'satisfactionScore',
      name: 'Оценка удовлетворенности',
      description: 'Средний рейтинг удовлетворенности клиентов',
      color: '#22c55e',
      suffix: '%',
      growth: performanceGrowth.satisfactionScore,
      isPositive: parseFloat(performanceGrowth.satisfactionScore) > 0
    },
    {
      id: 'avgResponseTime',
      name: 'Среднее время отклика',
      description: 'Среднее время ответа на запросы клиентов',
      color: '#f97316',
      suffix: ' ч',
      growth: performanceGrowth.avgResponseTime,
      isPositive: parseFloat(performanceGrowth.avgResponseTime) < 0  // Для времени отклика уменьшение - положительно
    },
    {
      id: 'avgOrderValue',
      name: 'Средняя стоимость заказа',
      description: 'Средняя сумма оплаты за заказ',
      color: '#a855f7',
      suffix: ' ₽',
      growth: performanceGrowth.avgOrderValue,
      isPositive: parseFloat(performanceGrowth.avgOrderValue) > 0
    }
  ];
  
  // Получение активной метрики
  const activeMetricConfig = metrics.find(metric => metric.id === activeMetric) || metrics[0];
  
  // Получение текущего и предыдущего значения метрики
  const currentValue = data[data.length - 1][activeMetric as keyof typeof data[0]] as number;
  const previousValue = data[0][activeMetric as keyof typeof data[0]] as number;
  
  // Кастомный тултип для графика
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 shadow-md border border-gray-100 rounded-md">
          <p className="font-medium">{label}</p>
          <p className="text-sm">
            <span className="font-semibold" style={{ color: activeMetricConfig.color }}>
              {formatMetricValue(activeMetric, payload[0].value)}
            </span>
          </p>
        </div>
      );
    }
    return null;
  };
  
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {metrics.map((metric) => (
          <button
            key={metric.id}
            onClick={() => setActiveMetric(metric.id)}
            className={`text-left p-4 rounded-lg transition-all ${
              metric.id === activeMetric 
                ? 'bg-gray-100 border-2 border-gray-200 shadow-sm' 
                : 'bg-white border border-gray-200 hover:bg-gray-50'
            }`}
          >
            <div className="flex items-start justify-between">
              <h4 className="text-sm font-medium mb-1">{metric.name}</h4>
              <Badge 
                variant="outline" 
                className={`${
                  metric.isPositive 
                    ? 'bg-green-100 text-green-800 border-green-200' 
                    : 'bg-red-100 text-red-800 border-red-200'
                }`}
              >
                {metric.isPositive ? '+' : ''}{metric.growth}%
              </Badge>
            </div>
            <p className="text-xs text-gray-500 mb-2">{metric.description}</p>
            <p className="text-xl font-bold" style={{ color: metric.color }}>
              {formatMetricValue(metric.id, currentValue)}
            </p>
          </button>
        ))}
      </div>
      
      <div className="bg-gray-50 p-4 rounded-lg">
        <div className="mb-4">
          <h3 className="text-lg font-medium">{activeMetricConfig.name}</h3>
          <p className="text-sm text-gray-500">{activeMetricConfig.description}</p>
        </div>
        
        <ResponsiveContainer width="100%" height={300}>
          <LineChart
            data={data}
            margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis 
              dataKey="date" 
              tick={{ fontSize: 12 }} 
              tickLine={false}
              axisLine={{ stroke: '#e5e7eb' }}
            />
            <YAxis
              tickFormatter={(value) => formatMetricValue(activeMetric, value)}
              width={60}
              tick={{ fontSize: 12 }}
              tickLine={false}
              axisLine={false}
              domain={['dataMin - 5', 'dataMax + 5']}
            />
            <Tooltip content={<CustomTooltip />} />
            <Line
              type="monotone"
              dataKey={activeMetric}
              stroke={activeMetricConfig.color}
              strokeWidth={2}
              dot={{ r: 4, fill: activeMetricConfig.color }}
              activeDot={{ r: 6, fill: activeMetricConfig.color }}
            />
            
            {/* Фоновая область для отображения тренда */}
            <ReferenceArea
              x1={data[0].date}
              x2={data[data.length - 1].date}
              y1={Math.min(previousValue, currentValue)}
              y2={Math.max(previousValue, currentValue)}
              fill={activeMetricConfig.isPositive ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)'}
              fillOpacity={0.3}
            />
          </LineChart>
        </ResponsiveContainer>
        
        <div className="flex justify-between items-center mt-4 text-sm text-gray-500">
          <div>
            {new Intl.DateTimeFormat('ru-RU', { 
              day: 'numeric', month: 'long', year: 'numeric' 
            }).format(dateRange.from)}
          </div>
          <div>
            {new Intl.DateTimeFormat('ru-RU', { 
              day: 'numeric', month: 'long', year: 'numeric' 
            }).format(dateRange.to)}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PerformanceMetrics;