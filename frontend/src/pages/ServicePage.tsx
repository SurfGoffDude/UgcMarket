
import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { Star, Clock, RotateCcw, ArrowLeft, Play, Eye, Heart, MessageSquare, Shield, Award } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import ReviewCard from '@/components/ReviewCard';

const serviceData = {
  1: {
    id: 1,
    creatorId: 1,
    creatorName: 'Анна Креативная',
    creatorAvatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b47c?w=150&h=150&fit=crop&crop=face',
    creatorRating: 4.9,
    title: 'Танцевальное видео с продуктом',
    coverImage: 'https://images.unsplash.com/photo-1574631149069-8bd0e57b9c1b?w=800&h=400&fit=crop',
    price: 5000,
    duration: '2-3 дня',
    revisions: 2,
    description: 'Создам вирусное танцевальное видео с естественной интеграцией вашего продукта. Использую актуальные тренды и музыку для максимального охвата аудитории.',
    includes: [
      'Сценарий и концепция видео',
      'Съемка в HD качестве',
      'Базовый монтаж с переходами',
      'Музыкальное сопровождение',
      'Хештеги и описание для поста',
      '2 варианта финального видео'
    ],
    requirements: [
      'Предоставить продукт для съемки',
      'Техническое задание с пожеланиями',
      'Логотип в векторном формате (при необходимости)',
      'Примеры желаемого стиля'
    ],
    examples: [
      {
        id: 1,
        title: 'Танцевальный челлендж для Nike',
        thumbnail: 'https://images.unsplash.com/photo-1574631149069-8bd0e57b9c1b?w=300&h=300&fit=crop',
        views: '2.1M',
        likes: '150K'
      },
      {
        id: 2,
        title: 'Спортивная одежда Adidas',
        thumbnail: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=300&h=300&fit=crop',
        views: '1.8M',
        likes: '120K'
      },
      {
        id: 3,
        title: 'Летняя коллекция H&M',
        thumbnail: 'https://images.unsplash.com/photo-1594736797933-d0501ba2fe65?w=300&h=300&fit=crop',
        views: '950K',
        likes: '85K'
      }
    ],
    faq: [
      {
        question: 'Могу ли я получить дополнительные ревизии?',
        answer: 'Да, дополнительные ревизии доступны за отдельную плату - 500₽ за каждую.'
      },
      {
        question: 'В каком формате будет готовое видео?',
        answer: 'Предоставлю видео в формате MP4, 1080p, оптимизированное для TikTok и Instagram.'
      },
      {
        question: 'Можете ли вы снять видео с моим продуктом удаленно?',
        answer: 'Да, если продукт можно отправить почтой. Также можем обсудить компенсацию доставки.'
      },
      {
        question: 'Включены ли права на использование музыки?',
        answer: 'Использую только лицензионную музыку или треки без авторских прав.'
      }
    ],
    reviews: [
      {
        id: 1,
        clientName: 'Мария К.',
        rating: 5,
        date: '2 недели назад',
        text: 'Анна создала потрясающее видео для нашего бренда! Видео набрало более миллиона просмотров и принесло отличные результаты. Очень довольны сотрудничеством.',
        service: 'Танцевальное видео с продуктом'
      },
      {
        id: 2,
        clientName: 'Владимир С.',
        rating: 5,
        date: '3 недели назад',
        text: 'Профессиональный подход и креативная подача. Видео получилось стильным и запоминающимся. Рекомендую!',
        service: 'Танцевальное видео с продуктом'
      },
      {
        id: 3,
        clientName: 'Екатерина Л.',
        rating: 4,
        date: '1 месяц назад',
        text: 'Хорошее качество съемки и интересная концепция. Единственное - хотелось бы чуть быстрее получить результат.',
        service: 'Танцевальное видео с продуктом'
      }
    ]
  }
};

const ServicePage = () => {
  const { creatorId, serviceId } = useParams();
  const service = serviceData[Number(serviceId) as keyof typeof serviceData];

  if (!service) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900">
        <main className="pt-16">
          <div className="container mx-auto px-4 py-16 text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Услуга не найдена</h1>
            <Link to="/" className="text-purple-600 hover:text-purple-700">
              Вернуться на главную
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="relative h-64 md:h-80">
        <img 
          src={service.coverImage} 
          alt={service.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>
        
        {/* Back Button */}
        <Link 
          to={`/creator/${service.creatorId}`}
          className="absolute top-4 left-4 bg-white/90 hover:bg-white rounded-full p-2 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-900" />
        </Link>

        {/* Service Title */}
        <div className="absolute bottom-6 left-6 text-white">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">{service.title}</h1>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <img 
                src={service.creatorAvatar} 
                alt={service.creatorName}
                className="w-8 h-8 rounded-full border-2 border-white"
              />
              <span className="font-semibold">{service.creatorName}</span>
            </div>
            <div className="flex items-center space-x-1">
              <Star className="w-4 h-4 text-yellow-400 fill-current" />
              <span>{service.creatorRating}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 -mt-8 relative z-10">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Service Details */}
            <Card>
              <CardHeader>
                <CardTitle>Описание услуги</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <p className="text-gray-700 leading-relaxed">{service.description}</p>
                
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Что входит в услугу:</h3>
                  <ul className="space-y-2">
                    {service.includes.map((item, index) => (
                      <li key={index} className="flex items-start space-x-2">
                        <div className="w-2 h-2 bg-purple-600 rounded-full mt-2"></div>
                        <span className="text-gray-700">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Требования к заказчику:</h3>
                  <ul className="space-y-2">
                    {service.requirements.map((item, index) => (
                      <li key={index} className="flex items-start space-x-2">
                        <div className="w-2 h-2 bg-orange-500 rounded-full mt-2"></div>
                        <span className="text-gray-700">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>

            {/* Examples */}
            <Card>
              <CardHeader>
                <CardTitle>Примеры работ</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {service.examples.map((example) => (
                    <div key={example.id} className="group cursor-pointer bg-white rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow">
                      <div className="relative">
                        <img 
                          src={example.thumbnail} 
                          alt={example.title}
                          className="w-full h-32 object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors duration-300 flex items-center justify-center">
                          <div className="bg-white/90 rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                            <Play className="w-4 h-4 text-gray-900" />
                          </div>
                        </div>
                      </div>
                      <div className="p-3">
                        <h4 className="font-medium text-gray-900 text-sm mb-1">{example.title}</h4>
                        <div className="flex items-center justify-between text-xs text-gray-600">
                          <div className="flex items-center space-x-1">
                            <Eye className="w-3 h-3" />
                            <span>{example.views}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Heart className="w-3 h-3" />
                            <span>{example.likes}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* FAQ */}
            <Card>
              <CardHeader>
                <CardTitle>Часто задаваемые вопросы</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {service.faq.map((item, index) => (
                    <div key={index} className="border-b border-gray-200 last:border-0 pb-4 last:pb-0">
                      <h4 className="font-semibold text-gray-900 mb-2">{item.question}</h4>
                      <p className="text-gray-700">{item.answer}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Reviews */}
            <Card>
              <CardHeader>
                <CardTitle>Отзывы об этой услуге</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {service.reviews.map((review) => (
                    <ReviewCard key={review.id} review={review} />
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Order Card */}
            <Card className="sticky top-6">
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-3xl font-bold text-purple-600">
                      {service.price.toLocaleString()}₽
                    </span>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center space-x-2">
                        <Clock className="w-4 h-4 text-gray-500" />
                        <span className="text-gray-600">Срок выполнения</span>
                      </div>
                      <span className="font-semibold">{service.duration}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center space-x-2">
                        <RotateCcw className="w-4 h-4 text-gray-500" />
                        <span className="text-gray-600">Ревизии</span>
                      </div>
                      <span className="font-semibold">{service.revisions}</span>
                    </div>
                  </div>

                  <div className="space-y-3 pt-4 border-t">
                    <Button 
                      size="lg" 
                      className="w-full rounded-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                    >
                      Заказать услугу
                    </Button>
                    <Button 
                      variant="outline" 
                      size="lg" 
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
            <Card>
              <CardContent className="p-6">
                <div className="text-center">
                  <img 
                    src={service.creatorAvatar} 
                    alt={service.creatorName}
                    className="w-16 h-16 rounded-full mx-auto mb-3"
                  />
                  <h3 className="font-semibold text-gray-900 mb-1">{service.creatorName}</h3>
                  <div className="flex items-center justify-center space-x-1 mb-3">
                    <Star className="w-4 h-4 text-yellow-500 fill-current" />
                    <span className="font-semibold">{service.creatorRating}</span>
                  </div>
                  <Link 
                    to={`/creator/${service.creatorId}`}
                    className="text-purple-600 hover:text-purple-700 text-sm font-medium"
                  >
                    Посмотреть профиль
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ServicePage;
