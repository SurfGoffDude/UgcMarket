/**
 * Страница "Как это работает" - подробное руководство по использованию платформы
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Search, 
  MessageSquare, 
  CheckCircle, 
  Zap, 
  User, 
  Package, 
  DollarSign, 
  Clock,
  ArrowRight,
  Star,
  Shield,
  Users,
  Target,
  FileText,
  Camera,
  Settings
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

const HowItWorksPage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Заголовок страницы */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
            Как это работает
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            Полное руководство по использованию платформы UgcMarket для успешного сотрудничества между клиентами и креаторами
          </p>
        </div>

        {/* Основные шаги */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-8">
            Основные шаги работы
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: Search,
                title: "Найдите идеального креатора",
                description: "Используйте фильтры для поиска креаторов по нише, платформе и бюджету",
                color: "from-[#3D8BFF] to-[#E95C4B]"
              },
              {
                icon: MessageSquare,
                title: "Обсудите детали",
                description: "Свяжитесь с креатором через встроенный чат для обсуждения деталей проекта",
                color: "from-[#E95C4B] to-[#3D8BFF]"
              },
              {
                icon: CheckCircle,
                title: "Оплатите безопасно",
                description: "Внесите предоплату, которая будет заморожена до выполнения работы",
                color: "from-[#3D8BFF] to-[#E95C4B]"
              },
              {
                icon: Zap,
                title: "Получите контент",
                description: "Примите работу и получите готовый контент в согласованные сроки",
                color: "from-[#E95C4B] to-[#3D8BFF]"
              }
            ].map((step, index) => (
              <Card key={index} className="relative overflow-hidden group hover:shadow-lg transition-all duration-300">
                <CardHeader className="text-center">
                  <div className={`w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r ${step.color} flex items-center justify-center`}>
                    <step.icon className="w-8 h-8 text-white" />
                  </div>
                  <div className="flex items-center justify-center mb-2">
                    <Badge variant="outline" className="mr-2">
                      Шаг {index + 1}
                    </Badge>
                  </div>
                  <CardTitle className="text-lg">{step.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-center">
                    {step.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Разделы для разных ролей */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-16">
          {/* Для креаторов */}
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="flex items-center text-2xl">
                <User className="w-6 h-6 mr-2 text-[#E95C4B]" />
                Для креаторов
              </CardTitle>
              <CardDescription>
                Пошаговое руководство для создателей контента
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h4 className="font-semibold mb-3 flex items-center">
                  <Settings className="w-4 h-4 mr-2" />
                  1. Заполнение профиля
                </h4>
                <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300 ml-6">
                  <li>• Основная информация: имя, контакты, биография</li>
                  <li>• Специализация и опыт работы</li>
                  <li>• Портфолио с лучшими работами</li>
                  <li>• Услуги с ценами и сроками</li>
                  <li>• Ссылки на социальные сети</li>
                </ul>
              </div>
              
              <Separator />
              
              <div>
                <h4 className="font-semibold mb-3 flex items-center">
                  <Search className="w-4 h-4 mr-2" />
                  2. Поиск заказов
                </h4>
                <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300 ml-6">
                  <li>• Просматривайте каталог заказов</li>
                  <li>• Используйте фильтры по бюджету и тегам</li>
                  <li>• Изучайте требования клиентов</li>
                  <li>• Откликайтесь на подходящие заказы</li>
                </ul>
              </div>
              
              <Separator />
              
              <div>
                <h4 className="font-semibold mb-3 flex items-center">
                  <Package className="w-4 h-4 mr-2" />
                  3. Управление заказами
                </h4>
                <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300 ml-6">
                  <li>• Отслеживайте статусы заказов</li>
                  <li>• Общайтесь с клиентами через чат</li>
                  <li>• Загружайте готовые работы</li>
                  <li>• Получайте оплату после принятия</li>
                </ul>
              </div>
              
              <div className="pt-4">
                <Link to="/catalog-orders">
                  <Button className="w-full">
                    Найти заказы
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Для клиентов */}
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="flex items-center text-2xl">
                <Target className="w-6 h-6 mr-2 text-[#3D8BFF]" />
                Для клиентов
              </CardTitle>
              <CardDescription>
                Руководство для заказчиков контента
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h4 className="font-semibold mb-3 flex items-center">
                  <Search className="w-4 h-4 mr-2" />
                  1. Поиск креаторов
                </h4>
                <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300 ml-6">
                  <li>• Используйте фильтры по специализации</li>
                  <li>• Изучайте портфолио креаторов</li>
                  <li>• Читайте отзывы других клиентов</li>
                  <li>• Сравнивайте цены и сроки</li>
                </ul>
              </div>
              
              <Separator />
              
              <div>
                <h4 className="font-semibold mb-3 flex items-center">
                  <FileText className="w-4 h-4 mr-2" />
                  2. Создание заказа
                </h4>
                <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300 ml-6">
                  <li>• Подробно опишите задачу</li>
                  <li>• Укажите бюджет и сроки</li>
                  <li>• Прикрепите референсы и ТЗ</li>
                  <li>• Добавьте релевантные теги</li>
                </ul>
              </div>
              
              <Separator />
              
              <div>
                <h4 className="font-semibold mb-3 flex items-center">
                  <Users className="w-4 h-4 mr-2" />
                  3. Работа с исполнителями
                </h4>
                <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300 ml-6">
                  <li>• Получайте отклики от креаторов</li>
                  <li>• Выбирайте лучшее предложение</li>
                  <li>• Общайтесь через встроенный чат</li>
                  <li>• Принимайте работу или запрашивайте доработки</li>
                </ul>
              </div>
              
              <div className="pt-4">
                <Link to="/catalog-creators">
                  <Button className="w-full" variant="outline">
                    Найти креаторов
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Ключевые функции */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-8">
            Ключевые функции платформы
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: MessageSquare,
                title: "Система чатов",
                description: "Встроенная система сообщений для общения между клиентами и креаторами с возможностью отправки файлов"
              },
              {
                icon: Shield,
                title: "Безопасные платежи",
                description: "Система эскроу защищает средства клиентов и гарантирует оплату креаторам после выполнения работы"
              },
              {
                icon: Star,
                title: "Система отзывов",
                description: "Рейтинги и отзывы помогают выбрать надежных исполнителей и качественных клиентов"
              },
              {
                icon: Camera,
                title: "Портфолио",
                description: "Креаторы могут демонстрировать свои лучшие работы для привлечения новых клиентов"
              },
              {
                icon: Clock,
                title: "Отслеживание статусов",
                description: "Полная прозрачность процесса выполнения заказов с уведомлениями о всех изменениях"
              },
              {
                icon: DollarSign,
                title: "Гибкие тарифы",
                description: "Креаторы устанавливают собственные цены, а клиенты могут договариваться о стоимости"
              }
            ].map((feature, index) => (
              <Card key={index} className="text-center hover:shadow-lg transition-shadow duration-300">
                <CardHeader>
                  <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-gradient-to-r from-[#E95C4B] to-[#3D8BFF] flex items-center justify-center">
                    <feature.icon className="w-6 h-6 text-white" />
                  </div>
                  <CardTitle className="text-lg">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>{feature.description}</CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Советы для успешного сотрудничества */}
        <Card className="mb-16">
          <CardHeader>
            <CardTitle className="text-2xl text-center">
              Советы для успешного сотрудничества
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h4 className="font-semibold text-lg mb-4 text-[#E95C4B]">Для креаторов:</h4>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start">
                    <CheckCircle className="w-4 h-4 mr-2 mt-0.5 text-green-500 flex-shrink-0" />
                    Заполните профиль полностью - это увеличивает доверие клиентов
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="w-4 h-4 mr-2 mt-0.5 text-green-500 flex-shrink-0" />
                    Регулярно обновляйте портфолио новыми работами
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="w-4 h-4 mr-2 mt-0.5 text-green-500 flex-shrink-0" />
                    Быстро отвечайте на сообщения - это влияет на рейтинг
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="w-4 h-4 mr-2 mt-0.5 text-green-500 flex-shrink-0" />
                    Будьте честны в сроках - лучше указать реальный срок
                  </li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-lg mb-4 text-[#3D8BFF]">Для клиентов:</h4>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start">
                    <CheckCircle className="w-4 h-4 mr-2 mt-0.5 text-green-500 flex-shrink-0" />
                    Подробно описывайте задачу - это поможет получить качественные отклики
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="w-4 h-4 mr-2 mt-0.5 text-green-500 flex-shrink-0" />
                    Прикрепляйте референсы - визуальные примеры помогают креаторам
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="w-4 h-4 mr-2 mt-0.5 text-green-500 flex-shrink-0" />
                    Устанавливайте реальный бюджет, соответствующий сложности задачи
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="w-4 h-4 mr-2 mt-0.5 text-green-500 flex-shrink-0" />
                    Общайтесь с креатором - обсуждайте детали в процессе работы
                  </li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Call to Action */}
        <div className="text-center">
          <Card className="bg-gradient-to-r from-[#E95C4B] to-[#3D8BFF] text-white">
            <CardContent className="py-12">
              <h3 className="text-3xl font-bold mb-4">
                Готовы начать?
              </h3>
              <p className="text-xl mb-8 opacity-90">
                Присоединяйтесь к тысячам креаторов и клиентов, которые уже используют нашу платформу
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link to="/catalog-creators">
                  <Button size="lg" variant="secondary" className="min-w-48">
                    Я ищу креатора
                  </Button>
                </Link>
                <Link to="/catalog-orders">
                  <Button size="lg" className="min-w-48 bg-white/20 text-white border-white/30 hover:bg-white hover:text-[#E95C4B] backdrop-blur-sm">
                    Я креатор
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default HowItWorksPage;