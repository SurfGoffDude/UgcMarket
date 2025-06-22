import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Star, Clock, RotateCcw, ArrowLeft, Play, Shield, Award, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/components/ui/use-toast';
import ReviewCard from '@/components/ReviewCard';
import { getServiceById } from '@/api/servicesApi';
import { createOrder } from '@/api/ordersApi';
import { Service } from '@/types/services';

const ServicePage = () => {
  const { id } = useParams<{ id: string }>();
  const [service, setService] = useState<Service | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleCreateOrder = async (withModifications: boolean) => {
    if (!service) return;
    setIsSubmitting(true);
    try {
      const payload = {
        service: service.id,
        with_modifications: withModifications,
        modifications_description: withModifications ? 'Требуются правки, детали будут обсуждаться.' : '',
      };
      const newOrder = await createOrder(payload);
      toast({
        title: 'Заказ успешно создан!',
        description: `Ваш заказ #${newOrder.id} был создан и передан исполнителю.`,
      });
      navigate(`/orders/${newOrder.id}`);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Ошибка при создании заказа',
        description: 'Не удалось создать заказ. Пожалуйста, попробуйте снова.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    if (id) {
      getServiceById(id)
        .then(data => {
          setService(data);
          setLoading(false);
        })
        .catch(err => {
          console.error(err);
          setError('Не удалось загрузить услугу.');
          setLoading(false);
        });
    }
  }, [id]);

  if (loading) {
    return <div className="flex justify-center items-center h-screen">Загрузка...</div>;
  }

  if (error) {
    return <div className="flex justify-center items-center h-screen text-red-500">{error}</div>;
  }

  if (!service) {
    return <div className="flex justify-center items-center h-screen">Услуга не найдена</div>;
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="container mx-auto px-4 py-8">
        <Link to="/" className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Назад к услугам
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Service Header */}
            <Card>
              <CardHeader>
                {service.category && <Badge variant="secondary" className="w-fit mb-2">{service.category.name}</Badge>}
                <CardTitle className="text-3xl font-bold text-gray-900">{service.title}</CardTitle>
                <div className="flex items-center space-x-4 text-sm text-gray-600 pt-2">
                  <div className="flex items-center space-x-1">
                    <Clock className="w-4 h-4" />
                    <span>{service.estimated_time}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <RotateCcw className="w-4 h-4" />
                    <span>{service.allows_modifications ? 'Правки доступны' : 'Без правок'}</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="aspect-w-16 aspect-h-9 rounded-lg overflow-hidden mb-6">
                  <img 
                    src={service.thumbnail || 'https://via.placeholder.com/800x400'}
                    alt={service.title} 
                    className="w-full h-full object-cover"
                  />
                </div>
                
                <h3 className="font-semibold text-lg text-gray-900 mb-3">Описание услуги</h3>
                <p className="text-gray-700 leading-relaxed">{service.description}</p>
              </CardContent>
            </Card>

            {/* What's Included (if available) */}
            {/* This part needs to be adapted based on actual data structure */}

            {/* Reviews (if available) */}
            {/* This part needs to be adapted based on actual data structure */}

          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Pricing & Actions */}
            <Card className="sticky top-8">
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="text-3xl font-bold text-gray-900 text-center">
                    {service.price} ₽
                  </div>
                  
                  <div className="space-y-2">
                    <Button 
                      size="lg" 
                      className="w-full bg-purple-600 hover:bg-purple-700"
                      onClick={() => handleCreateOrder(false)}
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? 'Создание...' : 'Заказать без правок'}
                    </Button>
                    {service.allows_modifications && (
                      <Button 
                        size="lg" 
                        variant="outline" 
                        className="w-full"
                        onClick={() => handleCreateOrder(true)}
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? 'Создание...' : `Заказать с правками (+${service.modifications_price} ₽)`}
                      </Button>
                    )}
                  </div>

                  <div className="pt-4 border-t">
                    <Button 
                      variant="ghost"
                      className="w-full rounded-full"
                    >
                      <MessageSquare className="w-4 h-4 mr-2" />
                      Связаться с автором
                    </Button>
                  </div>

                  <div className="flex items-center justify-center space-x-4 pt-4 border-t text-sm text-gray-600">
                    <div className="flex items-center space-x-1">
                      <Shield className="w-4 h-4" />
                      <span>Гарантия качества</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Award className="w-4 h-4" />
                      <span>Проверенный автор</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Creator Info */}
            {service.creator && (
              <Card>
                <CardContent className="p-6">
                  <div className="text-center">
                    <img 
                      src={service.creator.avatar || 'https://via.placeholder.com/150'}
                      alt={service.creator.user.username}
                      className="w-16 h-16 rounded-full mx-auto mb-3"
                    />
                    <h3 className="font-semibold text-gray-900 mb-1">{service.creator.user.username}</h3>
                    <div className="flex items-center justify-center space-x-1 mb-3">
                      <Star className="w-4 h-4 text-yellow-500 fill-current" />
                      <span className="font-semibold">{service.average_rating || 'N/A'}</span>
                    </div>
                    <Link 
                      to={`/creator/${service.creator.id}`}
                      className="text-purple-600 hover:text-purple-700 text-sm font-medium"
                    >
                      Посмотреть профиль
                    </Link>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ServicePage;