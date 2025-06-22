import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import apiClient from '@/api/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Loader2, ArrowLeft, Edit, ShoppingCart } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

interface ServiceImage {
  id: number;
  image: string;
  caption: string;
}

interface Service {
  id: number;
  title: string;
  description: string;
  price: string;
  estimated_time: string;
  allows_modifications: boolean;
  modifications_price: string | null;
  creator_username: string;
  creator_profile: number;
  images: ServiceImage[];
}

const ServiceDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [service, setService] = useState<Service | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isOrdering, setIsOrdering] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  useEffect(() => {
    const fetchService = async () => {
      try {
        const response = await apiClient.get(`/services/${id}/`);
        setService(response.data);
        if (response.data.images && response.data.images.length > 0) {
          setSelectedImage(response.data.images[0].image);
        }
      } catch (error) {
        console.error('Ошибка при загрузке услуги:', error);
        toast({
          title: 'Ошибка',
          description: 'Не удалось загрузить информацию об услуге.',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchService();
  }, [id]);

  const handleOrder = async (withModifications: boolean) => {
    if (!user) {
      toast({
        title: 'Требуется авторизация',
        description: 'Пожалуйста, войдите в систему, чтобы сделать заказ.',
        variant: 'destructive',
      });
      navigate('/login');
      return;
    }

    setIsOrdering(true);
    try {
      await apiClient.post('/orders/', {
        service: service?.id,
        with_modifications: withModifications,
      });
      toast({
        title: 'Успех!',
        description: 'Заказ успешно создан и ожидает подтверждения от исполнителя.',
      });
      navigate('/orders');
    } catch (error: any) {
      console.error('Ошибка при создании заказа:', error);
      toast({
        title: 'Ошибка',
        description: error.response?.data?.detail || 'Не удалось создать заказ.',
        variant: 'destructive',
      });
    } finally {
      setIsOrdering(false);
    }
  };

  if (isLoading) {
    return <div className="flex justify-center items-center h-screen"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  if (!service) {
    return <div className="text-center py-10">Услуга не найдена.</div>;
  }

  const isOwner = user && user.id === service.creator_profile;

  return (
    <div className="container mx-auto max-w-6xl py-8">
      <div className="flex justify-between items-center mb-4">
        <Button variant="ghost" onClick={() => navigate(-1)}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Назад к услугам
        </Button>
        {isOwner && (
          <Button variant="outline" onClick={() => navigate(`/services/edit/${service.id}`)}>
            <Edit className="mr-2 h-4 w-4" />
            Редактировать
          </Button>
        )}
      </div>

      <Card>
        <CardContent className="p-6 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-2 space-y-6">
            {/* Image Gallery */}
            {service.images && service.images.length > 0 && (
              <div className="space-y-4">
                <div className="aspect-video w-full overflow-hidden rounded-lg border">
                  <img
                    src={selectedImage || service.images[0].image}
                    alt={service.title}
                    className="object-cover w-full h-full transition-transform duration-300 hover:scale-105"
                  />
                </div>
                {service.images.length > 1 && (
                  <div className="grid grid-cols-5 gap-2">
                    {service.images.map((img) => (
                      <button
                        key={img.id}
                        onClick={() => setSelectedImage(img.image)}
                        className={`aspect-square w-full overflow-hidden rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 transition-all ${selectedImage === img.image ? 'ring-2 ring-primary ring-offset-2' : 'opacity-70 hover:opacity-100'}`}>
                        <img
                          src={img.image}
                          alt={img.caption || `Image for ${service.title}`}
                          className="object-cover w-full h-full"
                        />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="space-y-2 pt-4">
              <h1 className="text-3xl font-bold tracking-tight">{service.title}</h1>
              <p className="text-lg text-muted-foreground">
                от <span className="font-semibold text-primary cursor-pointer hover:underline" onClick={() => navigate(`/creators/${service.creator_profile}`)}>{service.creator_username}</span>
              </p>
            </div>
            <Separator />
            <div>
              <h2 className="text-xl font-semibold mb-2">Описание услуги</h2>
              <p className="text-muted-foreground whitespace-pre-wrap leading-relaxed">{service.description}</p>
            </div>
          </div>

          <div className="md:col-span-1 space-y-6">
            <Card className="bg-secondary/50 sticky top-24">
              <CardHeader>
                <CardTitle>Детали заказа</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Стоимость</span>
                  <span className="font-bold text-xl">{parseFloat(service.price).toLocaleString('ru-RU')} ₽</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Срок выполнения</span>
                  <span className="font-semibold">{service.estimated_time}</span>
                </div>
                <Separator />
                <Button 
                  className="w-full"
                  onClick={() => handleOrder(false)}
                  disabled={isOrdering || isOwner}
                >
                  {isOrdering ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ShoppingCart className="mr-2 h-4 w-4" />}
                  Заказать без правок
                </Button>
                {service.allows_modifications && service.modifications_price && (
                  <Button 
                    variant="outline" 
                    className="w-full" 
                    onClick={() => handleOrder(true)}
                    disabled={isOrdering || isOwner}
                  >
                    {isOrdering ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Edit className="mr-2 h-4 w-4" />}
                    Заказать с правками (+{(parseFloat(service.modifications_price) - parseFloat(service.price)).toLocaleString('ru-RU')} ₽)
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ServiceDetailPage;
