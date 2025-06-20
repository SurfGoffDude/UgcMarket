/**
 * Компонент воронки конверсии
 * 
 * Отображает воронку конверсии от просмотра до завершения заказа
 */
import React from 'react';
import {
  ResponsiveContainer,
  FunnelChart,
  Funnel,
  Cell,
  Tooltip,
  LabelList
} from 'recharts';
import { ChevronDown } from 'lucide-react';

/**
 * Данные для воронки конверсии
 */
const funnelData = [
  { 
    name: 'Просмотры', 
    value: 1000, 
    color: '#4f46e5',
    conversionRate: null // Начальная точка
  },
  { 
    name: 'Клики', 
    value: 620, 
    color: '#6366f1',
    conversionRate: 62 // 620 / 1000 * 100
  },
  { 
    name: 'Запросы', 
    value: 320, 
    color: '#8b5cf6',
    conversionRate: 51.6 // 320 / 620 * 100
  },
  { 
    name: 'Обсуждения', 
    value: 180, 
    color: '#a855f7',
    conversionRate: 56.3 // 180 / 320 * 100
  },
  { 
    name: 'Заказы', 
    value: 95, 
    color: '#d946ef',
    conversionRate: 52.8 // 95 / 180 * 100
  },
  { 
    name: 'Завершения', 
    value: 82, 
    color: '#ec4899',
    conversionRate: 86.3 // 82 / 95 * 100
  }
];

/**
 * Кастомный тултип для воронки конверсии
 */
const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    
    return (
      <div className="bg-white p-3 shadow-md border border-gray-100 rounded-md">
        <p className="font-medium">{data.name}</p>
        <p className="text-sm">
          <span className="font-semibold">{data.value}</span> пользователей
        </p>
        {data.conversionRate !== null && (
          <p className="text-xs text-gray-600">
            Конверсия: <span className="font-medium">{data.conversionRate.toFixed(1)}%</span> с предыдущего шага
          </p>
        )}
        <p className="text-xs text-gray-600">
          <span className="font-medium">{(data.value / funnelData[0].value * 100).toFixed(1)}%</span> от начального трафика
        </p>
      </div>
    );
  }

  return null;
};

/**
 * Кастомные метки для воронки конверсии
 */
const renderLabel = ({ 
  name, 
  value, 
  x, 
  y, 
  width, 
  height, 
  index, 
  toNextData 
}: any) => {
  return (
    <g>
      <text 
        x={x + width / 2} 
        y={y + height / 2 - 12}
        textAnchor="middle" 
        fill="#fff" 
        fontWeight="bold"
        fontSize={14}
      >
        {value}
      </text>
      <text 
        x={x + width / 2} 
        y={y + height / 2 + 12}
        textAnchor="middle" 
        fill="#fff" 
        fontSize={13}
      >
        {name}
      </text>
    </g>
  );
};

/**
 * Компонент воронки конверсии
 * 
 * @returns {JSX.Element} Компонент с воронкой
 */
const ConversionFunnel: React.FC = () => {
  return (
    <div className="h-[450px] flex flex-col">
      <ResponsiveContainer width="100%" height="90%">
        <FunnelChart>
          <Tooltip content={<CustomTooltip />} />
          <Funnel
            dataKey="value"
            data={funnelData}
            isAnimationActive={true}
          >
            <LabelList
              position="center"
              fill="#fff"
              stroke="none"
              content={renderLabel}
            />
            {funnelData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Funnel>
        </FunnelChart>
      </ResponsiveContainer>
      
      {/* Шаги конверсии с показателями */}
      <div className="grid grid-cols-3 md:grid-cols-6 gap-2 mt-4">
        {funnelData.map((step, index) => (
          <div key={`step-${index}`} className="flex flex-col items-center">
            {index > 0 && (
              <div className="flex items-center justify-center mb-1">
                <ChevronDown size={14} className="text-gray-400" />
                <span className="text-xs font-semibold text-gray-500">
                  {step.conversionRate !== null && `${step.conversionRate.toFixed(1)}%`}
                </span>
              </div>
            )}
            <div
              className="h-2 w-full rounded-full mb-1"
              style={{ backgroundColor: step.color }}
            />
            <span className="text-xs text-center">
              {(step.value / funnelData[0].value * 100).toFixed(1)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ConversionFunnel;