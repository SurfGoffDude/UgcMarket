import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Calendar, 
  Clock, 
  DollarSign, 
  FileText, 
  MessageSquare, 
  Star, 
  CheckCircle, 
  AlertCircle, 
  User, 
  Briefcase, 
  Settings, 
  LogOut,
  Plus,
  Search,
  Bell,
  Filter,
  ArrowRight,
  ChevronDown,
  BarChart2,
  TrendingUp,
  Users as UsersIcon,
  CreditCard,
  HelpCircle,
  Shield
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

// Mock data
const userData = {
  id: 'user123',
  name: 'Алексей Иванов',
  email: 'alexey@example.com',
  avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
  role: 'client', // 'client' or 'creator'
  stats: {
    completedOrders: 12,
    totalSpent: 125000,
    activeOrders: 3,
    rating: 4.8,
  },
  notifications: [
    { id: 1, type: 'message', text: 'Новое сообщение от Марии', time: '10 мин назад', read: false },
    { id: 2, type: 'order', text: 'Ваш заказ #12345 выполнен', time: '2 часа назад', read: false },
    { id: 3, type: 'update', text: 'Обновление платформы: новые функции', time: '1 день назад', read: true },
  ]
};

const activeOrders = [
  {
    id: 'ORD-12345',
    title: 'Монтаж видео о путешествии на Бали',
    creator: {
      name: 'Мария Видеографова',
      avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b47c?w=150&h=150&fit=crop&crop=face'
    },
    price: 15000,
    deadline: '2023-12-15',
    status: 'in_progress', // 'in_progress', 'review', 'completed', 'disputed'
    progress: 65,
    updated: '2 часа назад'
  },
  {
    id: 'ORD-12344',
    title: 'Создание логотипа для кафе',
    creator: {
      name: 'Иван Дизайнеров',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face'
    },
    price: 25000,
    deadline: '2023-12-18',
    status: 'in_progress',
    progress: 30,
    updated: '1 день назад'
  },
  {
    id: 'ORD-12343',
    title: 'Написание статьи о технологиях',
    creator: {
      name: 'Екатерина Копирайтерова',
      avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face'
    },
    price: 8000,
    deadline: '2023-12-10',
    status: 'review',
    progress: 100,
    updated: '10 минут назад'
  }
];

const completedOrders = [
  {
    id: 'ORD-12342',
    title: 'Озвучка рекламного ролика',
    creator: {
      name: 'Анна Дикторова',
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&h=150&fit=crop&crop=face'
    },
    price: 12000,
    completedDate: '2023-11-28',
    rating: 5,
    review: 'Отличная работа, спасибо!'
  },
  {
    id: 'ORD-12341',
    title: 'Дизайн визиток',
    creator: {
      name: 'Дмитрий Художников',
      avatar: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150&h=150&fit=crop&crop=face'
    },
    price: 5000,
    completedDate: '2023-11-20',
    rating: 4,
    review: 'Хороший дизайн, но пришлось немного доработать.'
  }
];

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState('active');
  const [unreadNotifications, setUnreadNotifications] = useState(
    userData.notifications.filter(n => !n.read).length
  );

  const markAllAsRead = () => {
    setUnreadNotifications(0);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'in_progress':
        return <Badge className="bg-blue-100 text-blue-800">В работе</Badge>;
      case 'review':
        return <Badge className="bg-yellow-100 text-yellow-800">На проверке</Badge>;
      case 'completed':
        return <Badge className="bg-green-100 text-green-800">Завершен</Badge>;
      case 'disputed':
        return <Badge className="bg-red-100 text-red-800">Спор</Badge>;
      default:
        return <Badge variant="outline">Статус неизвестен</Badge>;
    }
  };

  const renderOrderCard = (order: any) => (
    <Card key={order.id} className="mb-4 hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center space-x-3 mb-2">
              <h3 className="font-medium text-lg">{order.title}</h3>
              {getStatusBadge(order.status)}
            </div>
            
            <div className="flex items-center space-x-4 text-sm text-gray-600 mb-3">
              <div className="flex items-center">
                <User className="w-4 h-4 mr-1 text-gray-500" />
                <span>{order.creator.name}</span>
              </div>
              <div className="flex items-center">
                <DollarSign className="w-4 h-4 mr-1 text-gray-500" />
                <span>{order.price.toLocaleString()} ₽</span>
              </div>
              <div className="flex items-center">
                <Calendar className="w-4 h-4 mr-1 text-gray-500" />
                <span>До {new Date(order.deadline).toLocaleDateString('ru-RU')}</span>
              </div>
            </div>

            {'progress' in order && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Прогресс выполнения</span>
                  <span className="font-medium">{order.progress}%</span>
                </div>
                <Progress value={order.progress} className="h-2" />
              </div>
            )}

            {'rating' in order && (
              <div className="flex items-center mt-2">
                {[...Array(5)].map((_, i) => (
                  <Star 
                    key={i} 
                    className={`w-4 h-4 ${i < order.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} 
                  />
                ))}
                <span className="ml-2 text-sm text-gray-600">{order.review}</span>
              </div>
            )}
          </div>
          
          <div className="flex flex-col space-y-2">
            <Button asChild variant="outline" className="justify-start">
              <Link to={`/chat/${order.id}`} className="flex items-center">
                <MessageSquare className="w-4 h-4 mr-2" />
                Чат
              </Link>
            </Button>
            <Button asChild>
              <Link to={`/orders/${order.id}`} className="flex items-center">
                <FileText className="w-4 h-4 mr-2" />
                Детали заказа
              </Link>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">Личный кабинет</h1>
            
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="w-5 h-5" />
                {unreadNotifications > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 flex items-center justify-center bg-red-500 text-white text-xs rounded-full">
                    {unreadNotifications}
                  </span>
                )}
              </Button>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center space-x-2">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={userData.avatar} alt={userData.name} />
                      <AvatarFallback>{userData.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <span className="hidden md:inline">{userData.name}</span>
                    <ChevronDown className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuItem asChild>
                    <Link to="/profile" className="cursor-pointer">
                      <User className="w-4 h-4 mr-2" />
                      Профиль
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/settings" className="cursor-pointer">
                      <Settings className="w-4 h-4 mr-2" />
                      Настройки
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/help" className="cursor-pointer">
                      <HelpCircle className="w-4 h-4 mr-2" />
                      Помощь
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/logout" className="cursor-pointer text-red-600">
                      <LogOut className="w-4 h-4 mr-2" />
                      Выйти
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <aside className="lg:col-span-1 space-y-6">
            {/* Profile Summary */}
            <Card>
              <CardContent className="p-6">
                <div className="flex flex-col items-center text-center">
                  <Avatar className="h-20 w-20 mb-4">
                    <AvatarImage src={userData.avatar} alt={userData.name} />
                    <AvatarFallback>{userData.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <h2 className="text-xl font-semibold">{userData.name}</h2>
                  <p className="text-sm text-gray-500 mb-4">{userData.email}</p>
                  <Button variant="outline" size="sm" className="w-full">
                    Редактировать профиль
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Статистика</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Briefcase className="w-5 h-5 mr-2 text-blue-500" />
                    <span>Завершено заказов</span>
                  </div>
                  <span className="font-medium">{userData.stats.completedOrders}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <DollarSign className="w-5 h-5 mr-2 text-green-500" />
                    <span>Всего потрачено</span>
                  </div>
                  <span className="font-medium">{userData.stats.totalSpent.toLocaleString()} ₽</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Star className="w-5 h-5 mr-2 text-yellow-400 fill-current" />
                    <span>Рейтинг</span>
                  </div>
                  <div className="flex items-center">
                    <span className="font-medium mr-1">{userData.stats.rating}</span>
                    <Star className="w-4 h-4 text-yellow-400 fill-current" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Быстрые действия</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="outline" className="w-full justify-start" onClick={() => navigate('/create-order')}>
                  <Plus className="w-4 h-4 mr-2" />
                  Создать заказ
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <CreditCard className="w-4 h-4 mr-2" />
                  Пополнить баланс
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Shield className="w-4 h-4 mr-2" />
                  Безопасность
                </Button>
              </CardContent>
            </Card>
          </aside>

          {/* Main Content */}
          <main className="lg:col-span-3">
            {/* Welcome Card */}
            <Card className="mb-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-100">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Добро пожаловать, {userData.name.split(' ')[0]}!</h2>
                    <p className="text-gray-600 max-w-2xl">
                      У вас {userData.stats.activeOrders} активных заказа. 
                      {userData.stats.activeOrders > 0 
                        ? 'Следите за их выполнением в разделе ниже.' 
                        : 'Создайте новый заказ, чтобы начать работу.'}
                    </p>
                  </div>
                  <div className="mt-4 md:mt-0">
                    <Button className="bg-blue-600 hover:bg-blue-700">
                      <Plus className="w-4 h-4 mr-2" />
                      Новый заказ
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Активные заказы</p>
                      <p className="text-2xl font-bold">{userData.stats.activeOrders}</p>
                    </div>
                    <div className="p-3 rounded-full bg-blue-100 text-blue-600">
                      <Briefcase className="w-6 h-6" />
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Завершено</p>
                      <p className="text-2xl font-bold">{userData.stats.completedOrders}</p>
                    </div>
                    <div className="p-3 rounded-full bg-green-100 text-green-600">
                      <CheckCircle className="w-6 h-6" />
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Всего потрачено</p>
                      <p className="text-2xl font-bold">{userData.stats.totalSpent.toLocaleString()} ₽</p>
                    </div>
                    <div className="p-3 rounded-full bg-purple-100 text-purple-600">
                      <DollarSign className="w-6 h-6" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Orders Section */}
            <Card>
              <CardHeader className="border-b border-gray-200">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                  <div>
                    <CardTitle>Мои заказы</CardTitle>
                    <CardDescription>
                      Управляйте своими заказами и отслеживайте их статус
                    </CardDescription>
                  </div>
                  <div className="mt-4 md:mt-0
                  ">
                    <div className="flex space-x-2">
                      <div className="relative">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                        <Input
                          type="search"
                          placeholder="Поиск заказов..."
                          className="pl-8 w-full md:w-[200px] lg:w-[300px]"
                        />
                      </div>
                      <Button variant="outline">
                        <Filter className="w-4 h-4 mr-2" />
                        Фильтры
                      </Button>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <Tabs defaultValue="active" className="w-full">
                  <TabsList className="w-full justify-start rounded-none border-b bg-transparent p-0">
                    <TabsTrigger 
                      value="active" 
                      className="relative py-4 px-6 data-[state=active]:shadow-none rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-transparent"
                      onClick={() => setActiveTab('active')}
                    >
                      Активные
                      {activeOrders.length > 0 && (
                        <span className="ml-2 rounded-full bg-blue-100 px-2 py-0.5 text-xs text-blue-800">
                          {activeOrders.length}
                        </span>
                      )}
                    </TabsTrigger>
                    <TabsTrigger 
                      value="completed" 
                      className="relative py-4 px-6 data-[state=active]:shadow-none rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-transparent"
                      onClick={() => setActiveTab('completed')}
                    >
                      Завершенные
                    </TabsTrigger>
                    <TabsTrigger 
                      value="drafts" 
                      className="relative py-4 px-6 data-[state=active]:shadow-none rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-transparent"
                      onClick={() => setActiveTab('drafts')}
                    >
                      Черновики
                    </TabsTrigger>
                  </TabsList>
                  
                  <div className="p-6">
                    <TabsContent value="active" className="m-0">
                      {activeOrders.length > 0 ? (
                        activeOrders.map(order => renderOrderCard(order))
                      ) : (
                        <div className="text-center py-12">
                          <Briefcase className="mx-auto h-12 w-12 text-gray-400" />
                          <h3 className="mt-2 text-lg font-medium text-gray-900">Нет активных заказов</h3>
                          <p className="mt-1 text-gray-500">Создайте свой первый заказ, чтобы начать работу</p>
                          <div className="mt-6">
                            <Button onClick={() => navigate('/create-order')}>
                              <Plus className="w-4 h-4 mr-2" />
                              Создать заказ
                            </Button>
                          </div>
                        </div>
                      )}
                    </TabsContent>
                    
                    <TabsContent value="completed" className="m-0">
                      {completedOrders.length > 0 ? (
                        completedOrders.map(order => renderOrderCard(order))
                      ) : (
                        <div className="text-center py-12">
                          <CheckCircle className="mx-auto h-12 w-12 text-gray-400" />
                          <h3 className="mt-2 text-lg font-medium text-gray-900">Нет завершенных заказов</h3>
                          <p className="mt-1 text-gray-500">Здесь будут отображаться ваши завершенные заказы</p>
                        </div>
                      )}
                    </TabsContent>
                    
                    <TabsContent value="drafts" className="m-0">
                      <div className="text-center py-12">
                        <FileText className="mx-auto h-12 w-12 text-gray-400" />
                        <h3 className="mt-2 text-lg font-medium text-gray-900">Нет черновиков</h3>
                        <p className="mt-1 text-gray-500">Создайте черновик заказа, чтобы продолжить позже</p>
                        <div className="mt-6">
                          <Button variant="outline">
                            <Plus className="w-4 h-4 mr-2" />
                            Создать черновик
                          </Button>
                        </div>
                      </div>
                    </TabsContent>
                  </div>
                </Tabs>
              </CardContent>
            </Card>
          </main>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
