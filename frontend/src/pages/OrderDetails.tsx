import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Clock, DollarSign, User, Calendar, FileText, MessageSquare, Check, X, Star, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';

// Mock data - in a real app, this would come from an API
const orderData = {
  1: {
    id: 1,
    title: 'Монтаж видео для YouTube канала о путешествиях',
    description: 'Ищу опытного видеомонтажера для создания динамичного и увлекательного видео о моем путешествии по Бали. У меня есть 2 часа отснятого материала, из которого нужно сделать ролик длительностью 10-12 минут.\n\nЧто нужно сделать:\n- Выбрать лучшие моменты\n- Добавить плавные переходы\n- Откорректировать цветокоррекцию\n- Добавить титры и логотип\n- Подобрать фоновую музыку\n\nСтиль: динамичный, вдохновляющий, с акцентом на природу и местную культуру.',
    budget: '15000',
    deadline: '2023-12-15',
    createdAt: '2023-11-25',
    status: 'active',
    category: 'Видео',
    subcategory: 'Монтаж',
    platform: 'YouTube',
    privacy: 'open',
    client: {
      id: 1,
      name: 'Алексей Иванов',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
      rating: 4.8,
      completedOrders: 24,
    },
    files: [
      { id: 1, name: 'bali_footage_1.mp4', size: '1.2 GB' },
      { id: 2, name: 'bali_footage_2.mp4', size: '890 MB' },
      { id: 3, name: 'reference_video.mp4', size: '350 MB' },
    ],
    proposals: [
      {
        id: 1,
        creator: {
          id: 101,
          name: 'Мария Видеографова',
          avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b47c?w=150&h=150&fit=crop&crop=face',
          rating: 4.9,
          completedOrders: 156,
        },
        price: '18000',
        days: 5,
        message: 'Здравствуйте! Я профессиональный видеомонтажер с опытом работы более 5 лет. Уже работала над подобными проектами о путешествиях. Предлагаю создать динамичный ролик с акцентом на эмоции и красоту местности. Готова сделать 3 варианта нарезки на выбор.',
        createdAt: '2023-11-26T14:30:00',
      },
      {
        id: 2,
        creator: {
          id: 102,
          name: 'Иван Киношников',
          avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face',
          rating: 4.7,
          completedOrders: 89,
        },
        price: '12000',
        days: 7,
        message: 'Привет! Вижу, что нужен монтаж видео о путешествии. У меня есть опыт работы с travel-контентом. Могу предложить интересные визуальные эффекты и цветокоррекцию в стиле популярных travel-блогеров.',
        createdAt: '2023-11-26T16:45:00',
      },
    ],
  },
};

const OrderDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showProposalForm, setShowProposalForm] = useState(false);
  const [proposalData, setProposalData] = useState({
    price: '',
    days: '',
    message: '',
  });

  const order = orderData[Number(id) as keyof typeof orderData];

  if (!order) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-16 text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Заказ не найден</h1>
          <Button onClick={() => navigate('/')}>Вернуться на главную</Button>
        </div>
      </div>
    );
  }

  const handleInputChange = (field: string, value: string) => {
    setProposalData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmitProposal = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate API call
    setTimeout(() => {
      setIsSubmitting(false);
      setShowProposalForm(false);
      toast({
        title: "Отклик отправлен!",
        description: "Ваше предложение успешно отправлено заказчику.",
      });
      
      // Reset form
      setProposalData({ price: '', days: '', message: '' });
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => navigate(-1)}
                className="flex items-center space-x-2"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Назад</span>
              </Button>
              <h1 className="text-xl font-semibold text-gray-900">Детали заказа</h1>
            </div>
            <Badge variant="outline" className="border-green-200 text-green-800 bg-green-50">
              {order.status === 'active' ? 'Активен' : 'Завершен'}
            </Badge>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Order Details */}
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">{order.title}</CardTitle>
                <div className="flex items-center space-x-4 text-sm text-gray-500 mt-2">
                  <div className="flex items-center">
                    <Clock className="w-4 h-4 mr-1" />
                    <span>Размещен {new Date(order.createdAt).toLocaleDateString('ru-RU')}</span>
                  </div>
                  <div className="flex items-center">
                    <DollarSign className="w-4 h-4 mr-1" />
                    <span>Бюджет: {order.budget} ₽</span>
                  </div>
                  <div className="flex items-center">
                    <Calendar className="w-4 h-4 mr-1" />
                    <span>Срок до: {new Date(order.deadline).toLocaleDateString('ru-RU')}</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="prose max-w-none">
                  <h3 className="text-lg font-semibold mb-2">Описание заказа</h3>
                  <p className="whitespace-pre-line text-gray-700">{order.description}</p>
                </div>

                <div className="mt-6">
                  <h3 className="text-lg font-semibold mb-3">Файлы</h3>
                  <div className="space-y-2">
                    {order.files.map((file) => (
                      <div key={file.id} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                        <div className="flex items-center">
                          <FileText className="w-5 h-5 text-gray-400 mr-3" />
                          <div>
                            <p className="text-sm font-medium text-gray-900">{file.name}</p>
                            <p className="text-xs text-gray-500">{file.size}</p>
                          </div>
                        </div>
                        <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700">
                          Скачать
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Client Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">О заказчике</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-4">
                  <img 
                    src={order.client.avatar} 
                    alt={order.client.name}
                    className="w-16 h-16 rounded-full"
                  />
                  <div>
                    <h3 className="font-semibold text-lg">{order.client.name}</h3>
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <div className="flex items-center">
                        <Star className="w-4 h-4 text-yellow-400 fill-current mr-1" />
                        <span>{order.client.rating}</span>
                      </div>
                      <span>•</span>
                      <span>{order.client.completedOrders} завершенных заказов</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Proposals */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Предложения ({order.proposals.length})</CardTitle>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-blue-600 hover:bg-blue-50"
                    onClick={() => setShowProposalForm(!showProposalForm)}
                  >
                    {showProposalForm ? 'Скрыть форму' : 'Оставить отклик'}
                  </Button>
                </div>
              </CardHeader>
              
              {showProposalForm && (
                <CardContent className="border-b">
                  <form onSubmit={handleSubmitProposal} className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-1">
                          Ваша цена (₽)
                        </label>
                        <Input
                          id="price"
                          type="number"
                          value={proposalData.price}
                          onChange={(e) => handleInputChange('price', e.target.value)}
                          required
                        />
                      </div>
                      <div>
                        <label htmlFor="days" className="block text-sm font-medium text-gray-700 mb-1">
                          Срок выполнения (дней)
                        </label>
                        <Input
                          id="days"
                          type="number"
                          value={proposalData.days}
                          onChange={(e) => handleInputChange('days', e.target.value)}
                          required
                        />
                      </div>
                    </div>
                    <div>
                      <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
                        Ваше предложение
                      </label>
                      <Textarea
                        id="message"
                        rows={4}
                        value={proposalData.message}
                        onChange={(e) => handleInputChange('message', e.target.value)}
                        placeholder="Опишите ваше предложение, опыт работы с подобными задачами и почему вы лучший кандидат..."
                        required
                      />
                    </div>
                    <div className="flex justify-end space-x-3 pt-2">
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => setShowProposalForm(false)}
                        disabled={isSubmitting}
                      >
                        Отмена
                      </Button>
                      <Button 
                        type="submit" 
                        disabled={isSubmitting}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        {isSubmitting ? 'Отправка...' : 'Отправить предложение'}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              )}

              <CardContent className="divide-y">
                {order.proposals.length > 0 ? (
                  order.proposals.map((proposal) => (
                    <div key={proposal.id} className="py-4 first:pt-0 last:pb-0">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-4">
                          <img 
                            src={proposal.creator.avatar} 
                            alt={proposal.creator.name}
                            className="w-12 h-12 rounded-full mt-1"
                          />
                          <div>
                            <div className="flex items-center space-x-2">
                              <h4 className="font-medium">{proposal.creator.name}</h4>
                              <div className="flex items-center text-yellow-400">
                                <Star className="w-4 h-4 fill-current" />
                                <span className="text-sm text-gray-600 ml-1">{proposal.creator.rating}</span>
                              </div>
                            </div>
                            <p className="text-sm text-gray-500 mt-1">
                              {new Date(proposal.createdAt).toLocaleDateString('ru-RU')}
                            </p>
                            <p className="mt-2 text-gray-700">{proposal.message}</p>
                            <div className="flex items-center space-x-4 mt-3 text-sm">
                              <div className="flex items-center text-gray-600">
                                <DollarSign className="w-4 h-4 mr-1" />
                                <span className="font-medium">{proposal.price} ₽</span>
                              </div>
                              <div className="flex items-center text-gray-600">
                                <Clock className="w-4 h-4 mr-1" />
                                <span>{proposal.days} дней</span>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <Button variant="outline" size="sm" className="flex items-center">
                            <MessageSquare className="w-4 h-4 mr-2" />
                            Чат
                          </Button>
                          <Button size="sm" className="bg-green-600 hover:bg-green-700">
                            <Check className="w-4 h-4 mr-2" />
                            Выбрать
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-8 text-center">
                    <MessageSquare className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                    <h3 className="text-lg font-medium text-gray-900 mb-1">Пока нет откликов</h3>
                    <p className="text-gray-500 max-w-md mx-auto">
                      Будьте первым, кто оставит отклик на этот заказ
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Order Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Детали заказа</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">Бюджет</span>
                  <span className="font-medium">{order.budget} ₽</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Срок сдачи</span>
                  <span className="font-medium">
                    {new Date(order.deadline).toLocaleDateString('ru-RU')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Категория</span>
                  <span className="font-medium">{order.category}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Подкатегория</span>
                  <span className="font-medium">{order.subcategory}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Платформа</span>
                  <span className="font-medium">{order.platform}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Тип заказа</span>
                  <span className="font-medium">
                    {order.privacy === 'open' ? 'Открытый' : 'По приглашению'}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="space-y-3">
              <Button className="w-full bg-blue-600 hover:bg-blue-700">
                <MessageSquare className="w-4 h-4 mr-2" />
                Написать заказчику
              </Button>
              <Button variant="outline" className="w-full">
                <User className="w-4 h-4 mr-2" />
                Просмотреть профиль
              </Button>
            </div>

            {/* Report */}
            <div className="text-center">
              <Button variant="ghost" size="sm" className="text-gray-500 hover:text-gray-700">
                <Flag className="w-4 h-4 mr-2" />
                Пожаловаться на заказ
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetails;
