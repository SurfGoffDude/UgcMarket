/**
 * Компонент графика доходов
 * 
 * Отображает линейный график доходов за выбранный период времени
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
  AreaChart,
  Area
} from 'recharts';

interface RevenueChartProps {
  dateRange: {
    from: Date;
    to: Date;
  };
}

/**
 * Форматирование числа в денежный формат
 * 
 * @param {number} value - Значение для форматирования
 * @returns {string} Отформатированное значение в формате валюты
 */
const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    maximumFractionDigits: 0
  }).format(value);
};

/**
 * Генерация демо-данных на основе диапазона дат
 * 
 * @param {Date} from - Начальная дата
 * @param {Date} to - Конечная дата
 * @returns {Array} Массив данных для графика
 */
const generateDemoData = (from: Date, to: Date) => {
  // Определяем, какую степень детализации использовать на основе диапазона дат
  const diffTime = Math.abs(to.getTime() - from.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  // Для разных периодов используем разные группировки
  let data = [];
  let dateFormat = "";
  
  if (diffDays <= 31) {
    // Ежедневные данные для коротких периодов
    dateFormat = "daily";
    
    // Генерируем данные для каждого дня
    const currentDate = new Date(from);
    while (currentDate <= to) {
      const day = currentDate.getDate();
      const month = currentDate.getMonth() + 1;
      const formattedDate = `${day < 10 ? '0' + day : day}.${month < 10 ? '0' + month : month}`;
      
      // Базовое значение с небольшой случайностью
      const baseValue = 15000 + Math.random() * 10000;
      const randomMultiplier = 0.8 + Math.random() * 0.4; // Между 0.8 и 1.2
      
      data.push({
        date: formattedDate,
        revenue: Math.round(baseValue * randomMultiplier),
        expenses: Math.round((baseValue * randomMultiplier) * 0.4),
        profit: Math.round((baseValue * randomMultiplier) * 0.6)
      });
      
      currentDate.setDate(currentDate.getDate() + 1);
    }
  } else if (diffDays <= 90) {
    // Еженедельные данные для средних периодов
    dateFormat = "weekly";
    
    // Генерируем данные по неделям
    const currentDate = new Date(from);
    let week = 1;
    while (currentDate <= to) {
      const endOfWeek = new Date(currentDate);
      endOfWeek.setDate(endOfWeek.getDate() + 6);
      
      const startDay = currentDate.getDate();
      const startMonth = currentDate.getMonth() + 1;
      const endDay = endOfWeek.getDate();
      const endMonth = endOfWeek.getMonth() + 1;
      
      const formattedDate = `${startDay}-${endDay}.${endMonth}`;
      
      // Значение растет с каждой неделей с небольшой случайностью
      const baseValue = (80000 + (week * 5000)) * (0.9 + Math.random() * 0.2);
      
      data.push({
        date: formattedDate,
        revenue: Math.round(baseValue),
        expenses: Math.round(baseValue * 0.4),
        profit: Math.round(baseValue * 0.6)
      });
      
      currentDate.setDate(currentDate.getDate() + 7);
      week++;
    }
  } else {
    // Ежемесячные данные для длинных периодов
    dateFormat = "monthly";
    
    // Генерируем данные по месяцам
    const startYear = from.getFullYear();
    const startMonth = from.getMonth();
    const endYear = to.getFullYear();
    const endMonth = to.getMonth();
    
    const monthNames = [
      'Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн',
      'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек'
    ];
    
    for (let year = startYear; year <= endYear; year++) {
      const monthStart = (year === startYear) ? startMonth : 0;
      const monthEnd = (year === endYear) ? endMonth : 11;
      
      for (let month = monthStart; month <= monthEnd; month++) {
        const formattedDate = `${monthNames[month]} ${year}`;
        
        // Сезонные вариации с ростом тренда
        let seasonalFactor = 1;
        // Лето - пик активности
        if (month >= 5 && month <= 7) seasonalFactor = 1.3;
        // Зима - спад активности
        else if (month === 11 || month <= 1) seasonalFactor = 0.8;
        
        // Годовой рост
        const yearFactor = 1 + (year - startYear) * 0.2;
        
        const baseRevenue = 120000 * seasonalFactor * yearFactor * (0.9 + Math.random() * 0.2);
        
        data.push({
          date: formattedDate,
          revenue: Math.round(baseRevenue),
          expenses: Math.round(baseRevenue * 0.4),
          profit: Math.round(baseRevenue * 0.6)
        });
      }
    }
  }
  
  return { data, dateFormat };
};

/**
 * Компонент графика доходов
 * 
 * @param {RevenueChartProps} props - Свойства компонента
 * @returns {JSX.Element} Компонент графика доходов
 */
const RevenueChart: React.FC<RevenueChartProps> = ({ dateRange }) => {
  // Генерация демо-данных на основе диапазона дат
  const { data, dateFormat } = generateDemoData(dateRange.from, dateRange.to);
  
  // Настройка отображаемых данных
  const [visibleSeries, setVisibleSeries] = useState({
    revenue: true,
    expenses: true,
    profit: true
  });
  
  // Обработчик переключения видимости серий
  const handleSeriesToggle = (series: 'revenue' | 'expenses' | 'profit') => {
    setVisibleSeries(prev => ({
      ...prev,
      [series]: !prev[series]
    }));
  };
  
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-4 mb-2">
        <button
          className={`px-3 py-1 text-sm rounded-full flex items-center gap-2 ${
            visibleSeries.revenue 
              ? 'bg-blue-100 text-blue-700' 
              : 'bg-gray-100 text-gray-500'
          }`}
          onClick={() => handleSeriesToggle('revenue')}
        >
          <span className="h-2 w-2 rounded-full bg-blue-500"></span>
          Доход
        </button>
        <button
          className={`px-3 py-1 text-sm rounded-full flex items-center gap-2 ${
            visibleSeries.expenses 
              ? 'bg-red-100 text-red-700' 
              : 'bg-gray-100 text-gray-500'
          }`}
          onClick={() => handleSeriesToggle('expenses')}
        >
          <span className="h-2 w-2 rounded-full bg-red-500"></span>
          Расходы
        </button>
        <button
          className={`px-3 py-1 text-sm rounded-full flex items-center gap-2 ${
            visibleSeries.profit 
              ? 'bg-green-100 text-green-700' 
              : 'bg-gray-100 text-gray-500'
          }`}
          onClick={() => handleSeriesToggle('profit')}
        >
          <span className="h-2 w-2 rounded-full bg-green-500"></span>
          Прибыль
        </button>
      </div>
      
      <ResponsiveContainer width="100%" height={350}>
        <AreaChart
          data={data}
          margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
        >
          <defs>
            <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="colorExpenses" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8} />
              <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#22c55e" stopOpacity={0.8} />
              <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis 
            dataKey="date" 
            tick={{ fontSize: 12 }} 
            tickLine={false}
            axisLine={{ stroke: '#e5e7eb' }}
          />
          <YAxis 
            tickFormatter={(value) => formatCurrency(value)} 
            tick={{ fontSize: 12 }}
            tickLine={false}
            axisLine={false}
            width={80}
          />
          <Tooltip
            formatter={(value: number) => formatCurrency(value)}
            labelFormatter={(label) => `Дата: ${label}`}
          />
          
          {visibleSeries.revenue && (
            <Area 
              type="monotone" 
              dataKey="revenue" 
              stroke="#3b82f6" 
              fillOpacity={1} 
              fill="url(#colorRevenue)" 
              name="Доход"
            />
          )}
          
          {visibleSeries.expenses && (
            <Area 
              type="monotone" 
              dataKey="expenses" 
              stroke="#ef4444" 
              fillOpacity={1} 
              fill="url(#colorExpenses)" 
              name="Расходы"
            />
          )}
          
          {visibleSeries.profit && (
            <Area 
              type="monotone" 
              dataKey="profit" 
              stroke="#22c55e" 
              fillOpacity={1} 
              fill="url(#colorProfit)" 
              name="Прибыль"
            />
          )}
        </AreaChart>
      </ResponsiveContainer>
      
      <div className="grid grid-cols-3 gap-4 pt-2">
        <div className="p-3 bg-blue-50 rounded-lg">
          <p className="text-xs text-blue-700">Общий доход</p>
          <p className="text-xl font-bold">
            {formatCurrency(data.reduce((sum, item) => sum + item.revenue, 0))}
          </p>
        </div>
        <div className="p-3 bg-red-50 rounded-lg">
          <p className="text-xs text-red-700">Общие расходы</p>
          <p className="text-xl font-bold">
            {formatCurrency(data.reduce((sum, item) => sum + item.expenses, 0))}
          </p>
        </div>
        <div className="p-3 bg-green-50 rounded-lg">
          <p className="text-xs text-green-700">Общая прибыль</p>
          <p className="text-xl font-bold">
            {formatCurrency(data.reduce((sum, item) => sum + item.profit, 0))}
          </p>
        </div>
      </div>
    </div>
  );
};

export default RevenueChart;