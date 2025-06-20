/**
 * Компонент распределения заказов по категориям
 * 
 * Отображает круговую диаграмму с распределением заказов по типам контента
 */
import React, { useState } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend
} from 'recharts';

/**
 * Данные для диаграммы распределения по категориям
 * Представляет распределение заказов по типам контента
 */
const categoryData = [
  { name: 'Видео', value: 45, color: '#4f46e5' },
  { name: 'Монтаж', value: 25, color: '#8b5cf6' },
  { name: 'Музыка/Звук', value: 10, color: '#a855f7' },
  { name: 'Дизайн', value: 15, color: '#ec4899' },
  { name: 'Фотография', value: 5, color: '#06b6d4' }
];

/**
 * Кастомный лейбл для сегментов диаграммы
 */
const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, index, value }: any) => {
  const RADIAN = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  // Отображаем процент только для сегментов с процентом >= 10%
  return percent >= 0.1 ? (
    <text 
      x={x} 
      y={y} 
      fill="white" 
      textAnchor="middle" 
      dominantBaseline="central"
      fontSize={12}
      fontWeight="bold"
    >
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  ) : null;
};

/**
 * Кастомный tooltip для диаграммы
 */
const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 shadow-md border border-gray-100 rounded-md">
        <p className="font-medium">{payload[0].name}</p>
        <p className="text-sm">
          <span className="font-semibold">{payload[0].value}</span> заказов
        </p>
        <p className="text-xs text-gray-600">{`${(payload[0].payload.percent * 100).toFixed(1)}% от общего числа`}</p>
      </div>
    );
  }

  return null;
};

/**
 * Компонент распределения по категориям
 * 
 * @returns {JSX.Element} Компонент с круговой диаграммой
 */
const CategoryDistribution: React.FC = () => {
  // Расчет процентного соотношения для каждой категории
  const totalValue = categoryData.reduce((sum, item) => sum + item.value, 0);
  const dataWithPercent = categoryData.map(item => ({
    ...item,
    percent: item.value / totalValue
  }));
  
  return (
    <div className="h-[350px] flex flex-col items-center">
      <ResponsiveContainer width="100%" height="85%">
        <PieChart>
          <Pie
            data={dataWithPercent}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={renderCustomizedLabel}
            outerRadius={90}
            innerRadius={45}
            fill="#8884d8"
            dataKey="value"
            paddingAngle={3}
            stroke="#fff"
            strokeWidth={2}
          >
            {dataWithPercent.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
        </PieChart>
      </ResponsiveContainer>
      
      <div className="w-full flex flex-wrap justify-center items-center gap-4 mt-4">
        {dataWithPercent.map((entry, index) => (
          <div key={`legend-${index}`} className="flex items-center">
            <div 
              className="h-3 w-3 rounded-full mr-2" 
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-sm">
              {entry.name} ({entry.value})
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CategoryDistribution;