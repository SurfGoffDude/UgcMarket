/**
 * Страница аналитики
 * 
 * Отображает различные типы графиков и отчётов для анализа активности, заказов и доходов
 */
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Calendar,
  BarChart2,
  LineChart,
  PieChart,
  Download,
  Filter,
  Users,
  DollarSign,
  ShoppingBag,
  TrendingUp,
  ArrowRight,
  RefreshCcw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import RevenueChart from '@/components/analytics/RevenueChart';
import OrdersOverview from '@/components/analytics/OrdersOverview';
import PerformanceMetrics from '@/components/analytics/PerformanceMetrics';
import TrafficSources from '@/components/analytics/TrafficSources';
import CategoryDistribution from '@/components/analytics/CategoryDistribution';
import ConversionFunnel from '@/components/analytics/ConversionFunnel';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

/**
 * Компонент страницы аналитики
 * 
 * @returns {JSX.Element} Компонент страницы аналитики
 */
const Analytics = () => {
  // Временной период для отображения данных
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>({
    from: new Date(new Date().setMonth(new Date().getMonth() - 3)),
    to: new Date()
  });

  // Периоды времени для селектора
  const timeRanges = [
    { label: 'Последние 7 дней', value: '7d' },
    { label: 'Последние 30 дней', value: '30d' },
    { label: 'Последние 90 дней', value: '90d' },
    { label: 'За год', value: '1y' },
    { label: 'За всё время', value: 'all' }
  ];
  
  // Выбранный период времени
  const [selectedTimeRange, setSelectedTimeRange] = useState('90d');

  // Обработчик изменения периода времени
  const handleTimeRangeChange = (value: string) => {
    setSelectedTimeRange(value);
    
    const now = new Date();
    let from = new Date();
    
    switch(value) {
      case '7d':
        from = new Date(now.setDate(now.getDate() - 7));
        break;
      case '30d':
        from = new Date(now.setDate(now.getDate() - 30));
        break;
      case '90d':
        from = new Date(now.setMonth(now.getMonth() - 3));
        break;
      case '1y':
        from = new Date(now.setFullYear(now.getFullYear() - 1));
        break;
      case 'all':
        from = new Date(2020, 0, 1); // Условная дата начала работы платформы
        break;
      default:
        from = new Date(now.setMonth(now.getMonth() - 3));
    }
    
    setDateRange({ from, to: new Date() });
  };
  
  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="container mx-auto py-8">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">Аналитика</h1>
            <p className="text-muted-foreground mt-1">
              Подробная статистика и метрики вашей активности на платформе
            </p>
          </div>
          
          <div className="flex space-x-4 mt-4 lg:mt-0">
            <Select value={selectedTimeRange} onValueChange={handleTimeRangeChange}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Выберите период" />
              </SelectTrigger>
              <SelectContent>
                {timeRanges.map((range) => (
                  <SelectItem key={range.value} value={range.value}>
                    {range.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Button variant="outline" size="icon">
              <RefreshCcw className="h-4 w-4" />
            </Button>
            
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Экспорт
            </Button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Общий доход</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₽ 458,500</div>
              <div className="text-xs text-muted-foreground">
                <span className="text-emerald-500 font-medium">+12.5%</span> по сравнению с пред. периодом
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Выполненные заказы</CardTitle>
              <ShoppingBag className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">87</div>
              <div className="text-xs text-muted-foreground">
                <span className="text-emerald-500 font-medium">+8.2%</span> по сравнению с пред. периодом
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Новые клиенты</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">24</div>
              <div className="text-xs text-muted-foreground">
                <span className="text-rose-500 font-medium">-3.1%</span> по сравнению с пред. периодом
              </div>
            </CardContent>
          </Card>
        </div>
        
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList>
            <TabsTrigger value="overview">Обзор</TabsTrigger>
            <TabsTrigger value="orders">Заказы</TabsTrigger>
            <TabsTrigger value="clients">Клиенты</TabsTrigger>
            <TabsTrigger value="revenue">Доходы</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Доходы за период</CardTitle>
                <CardDescription>
                  {`${dateRange.from.toLocaleDateString('ru-RU')} - ${dateRange.to.toLocaleDateString('ru-RU')}`}
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-2">
                <RevenueChart dateRange={dateRange} />
              </CardContent>
            </Card>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Распределение по категориям</CardTitle>
                  <CardDescription>
                    Распределение заказов по типам контента
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <CategoryDistribution />
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Источники трафика</CardTitle>
                  <CardDescription>
                    Откуда приходят ваши клиенты
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <TrafficSources />
                </CardContent>
              </Card>
            </div>
            
            <Card>
              <CardHeader>
                <CardTitle>Ключевые показатели эффективности</CardTitle>
                <CardDescription>
                  Динамика основных метрик за период
                </CardDescription>
              </CardHeader>
              <CardContent>
                <PerformanceMetrics dateRange={dateRange} />
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="orders" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Обзор заказов</CardTitle>
                <CardDescription>
                  Статус и динамика заказов за период
                </CardDescription>
              </CardHeader>
              <CardContent>
                <OrdersOverview dateRange={dateRange} />
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Конверсия заказов</CardTitle>
                <CardDescription>
                  Процесс прохождения заказа от создания до завершения
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ConversionFunnel />
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="clients" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Активность клиентов</CardTitle>
                <CardDescription>
                  Рост числа клиентов и их активность
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px] flex items-center justify-center border-2 border-dashed rounded-lg">
                  <div className="text-center">
                    <Users className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
                    <h3 className="text-lg font-medium">В разработке</h3>
                    <p className="text-muted-foreground">
                      Этот раздел находится в разработке и будет доступен в ближайшее время
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="revenue" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Анализ доходов</CardTitle>
                <CardDescription>
                  Подробная разбивка доходов по периодам
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px] flex items-center justify-center border-2 border-dashed rounded-lg">
                  <div className="text-center">
                    <DollarSign className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
                    <h3 className="text-lg font-medium">В разработке</h3>
                    <p className="text-muted-foreground">
                      Этот раздел находится в разработке и будет доступен в ближайшее время
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        
      </div>
    </div>
  );
};

export default Analytics;