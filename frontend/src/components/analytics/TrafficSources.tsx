/**
 * Компонент источников трафика
 * 
 * Отображает горизонтальную диаграмму с распределением трафика по источникам
 */
import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LabelList
} from 'recharts';

/**
 * Данные по источникам трафика
 */
const trafficData = [
  { name: 'Прямые переходы', value: 35, color: '#4f46e5' },
  { name: 'Поисковые системы', value: 28, color: '#8b5cf6' },
  { name: 'Социальные сети', value: 22, color: '#ec4899' },
  { name: 'Реферальные ссылки', value: 10, color: '#06b6d4' },
  { name: 'Другое', value: 5, color: '#6b7280' },
];

/**
 * Кастомный тултип для диаграммы
 */
const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 shadow-md border border-gray-100 rounded-md">
        <p className="font-medium">{payload[0].name}</p>
        <p className="text-sm">
          <span className="font-semibold">{payload[0].value}%</span> пользователей
        </p>
      </div>
    );
  }

  return null;
};

/**
 * Компонент источников трафика
 * 
 * @returns {JSX.Element} Компонент с горизонтальной диаграммой
 */
const TrafficSources: React.FC = () => {
  // Сортируем данные по убыванию значения
  const sortedData = [...trafficData].sort((a, b) => b.value - a.value);
  
  return (
    <div className="h-[350px] flex flex-col">
      <ResponsiveContainer width="100%" height="80%">
        <BarChart
          layout="vertical"
          data={sortedData}
          margin={{ top: 20, right: 30, left: 80, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
          <XAxis type="number" domain={[0, 'dataMax + 10']} />
          <YAxis 
            dataKey="name" 
            type="category" 
            tick={{ fontSize: 12 }} 
            width={80}
          />
          <Tooltip content={<CustomTooltip />} />
          {sortedData.map((entry, index) => (
            <Bar 
              key={`bar-${index}`} 
              dataKey="value" 
              fill={entry.color} 
              background={{ fill: '#f3f4f6' }}
              radius={[0, 4, 4, 0]}
              barSize={24}
            >
              <LabelList 
                dataKey="value" 
                position="right" 
                formatter={(value: number) => `${value}%`} 
                style={{ fill: '#374151', fontWeight: 500, fontSize: 12 }}
              />
            </Bar>
          ))}
        </BarChart>
      </ResponsiveContainer>
      
      <div className="flex flex-wrap justify-center gap-4 mt-6">
        {sortedData.map((entry, index) => (
          <div key={`legend-${index}`} className="flex items-center">
            <div 
              className="h-3 w-3 rounded-full mr-2" 
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-sm">{entry.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TrafficSources;