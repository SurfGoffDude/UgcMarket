import React, { useState, useEffect } from 'react';
import { Clock, DollarSign, Calendar, MessageSquare, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { Button } from './ui/button';
import { useNavigate } from 'react-router-dom';
import { fetchLatestPublicOrders } from '@/api/ordersApi';
import { OrderWithDetails } from '@/types/orders';
import { useAuth } from '@/contexts/AuthContext';

// Моковые данные на случай ошибки
const mockOrders = [
  {
    id: 1,
    title: 'Нужен обзор на фитнес-трекер',
    description: 'Требуется блогер для честного обзора фитнес-трекера. Нужно снять 1-2 минуты контента с демонстрацией функций.',
    budget: '5 000 - 10 000 ₽',
    deadline: '3 дня',
    category: 'Обзоры',
    platform: 'TikTok',
    proposals: 12
  },
  {
    id: 2,
    title: 'Съемка рекламы косметики',
    description: 'Ищем бьюти-блогера для съемки рекламного ролика о новой линейке уходовой косметики.',
    budget: '15 000 - 25 000 ₽',
    deadline: '1 неделя',
    category: 'Красота',
    platform: 'Instagram',
    proposals: 8
  },
  {
    id: 3,
    title: 'Озвучка для обучающего видео',
    description: 'Требуется приятный голос для озвучки обучающего курса по фотографии. Длительность ~30 минут.',
    budget: '3 000 - 5 000 ₽',
    deadline: '2 дня',
    category: 'Озвучка',
    platform: 'YouTube',
    proposals: 5
  },
  {
    id: 4,
    title: 'Монтаж видео для бренда одежды',
    description: 'Нужен монтаж 5-7 коротких видео для соцсетей бренда уличной одежды. Исходники предоставим.',
    budget: '8 000 - 12 000 ₽',
    deadline: '5 дней',
    category: 'Монтаж',
    platform: 'TikTok/Reels',
    proposals: 3
  }
];

const NewOrders = () => {
  const navigate = useNavigate();
  const [ref, inView] = useInView({
    triggerOnce: false,
    threshold: 0.1
  });

  const [orders, setOrders] = useState<OrderWithDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Получаем состояние авторизации из AuthContext
  const { isAuthenticated } = useAuth();

  // Загружаем данные о последних публичных заказах при монтировании компонента
  useEffect(() => {
    const loadLatestOrders = async () => {
      setIsLoading(true);
      try {
        // Проверяем авторизацию перед выполнением API-запроса
        if (isAuthenticated) {
          const data = await fetchLatestPublicOrders(4); // Получаем 4 последних публичных заказа
          setOrders(data.results.map(order => ({
            ...order,
            // Форматируем данные для отображения
            budget: order.budget ? 
              typeof order.budget === 'number' 
                ? `${order.budget.toLocaleString()} ₽` 
                : order.budget
              : `${order.price?.toLocaleString() || '0'} ₽`,
            deadline: order.delivery_date ? 
              new Date(order.delivery_date) > new Date() ?
                `${Math.ceil((new Date(order.delivery_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} дней` : 
                'Срок истек'
              : 'Не указан',
            proposals: order.proposals?.length || 0,
            category: order.tags?.length > 0 ? order.tags[0].name : 'Разное'
          })));
        } else {
          // Если пользователь не авторизован, используем моковые данные
          console.log('Пользователь не авторизован, используем моковые данные для NewOrders');
          setOrders(mockOrders as unknown as OrderWithDetails[]);
        }
      } catch (error) {
        console.error('Ошибка при загрузке последних заказов:', error);
        // Используем моковые данные в случае ошибки
        setOrders(mockOrders as unknown as OrderWithDetails[]);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadLatestOrders();
  }, [isAuthenticated]);
  
  // Переход на страницу всех заказов
  const handleViewAllOrders = () => {
    navigate('/orders');
  };
  
  // Переход на страницу деталей заказа
  const handleOrderDetails = (id: number) => {
    navigate(`/orders/${id}`);
  };

  // Анимации
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const fadeInUp = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6
      }
    }
  };

  return (
    <section className="py-16 bg-white dark:bg-gray-950">
      <div className="container mx-auto px-4" ref={ref}>
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Новые заказы
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300">
            Последние опубликованные задания для креаторов
          </p>
        </div>

        <motion.div 
          className="grid grid-cols-2 gap-4 md:gap-6 mb-12"
          variants={containerVariants}
          initial="hidden"
          animate={inView ? "visible" : "hidden"}
        >
          {isLoading ? (
            // Отображаем скелетоны загрузки
            Array.from({ length: 4 }).map((_, index) => (
              <motion.div 
                key={index}
                variants={fadeInUp}
                className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 animate-pulse border border-gray-100 dark:border-gray-700"
              >
                <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-4"></div>
                <div className="flex space-x-4 mb-4">
                  <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
                  <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
                </div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full mb-2"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full mb-2"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-6"></div>
                <div className="flex justify-between mt-6">
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
                  </div>
                  <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-28"></div>
                </div>
              </motion.div>
            ))
          ) : (
            orders.map((order, index) => (
              <motion.div
                key={order.id}
                variants={fadeInUp}
                className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-gray-100 dark:border-gray-700"
              >
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                  {order.title}
                </h3>
                
                <div className="overflow-x-auto whitespace-nowrap flex gap-3 mb-4 pb-1 no-scrollbar">
                  {order.tags && order.tags.length > 0 && order.tags.map((tag, index) => (
                    <div key={index} className="flex items-center text-sm bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 px-3 py-1 rounded-full flex-shrink-0">
                      <span>{tag.name}</span>
                    </div>
                  ))}
                  <div className="flex items-center text-sm bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 px-3 py-1 rounded-full flex-shrink-0">
                    <span>{order.proposals} предложений</span>
                  </div>
                </div>
                
                <p className="text-gray-600 dark:text-gray-300 mb-4 line-clamp-2">
                  {order.description || order.requirements}
                </p>
                
                <div className="flex flex-wrap items-center justify-between mt-6">
                  <div className="space-y-2">
                    <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                      <span className="mr-2">₽</span>
                      <span>{order.budget}</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                      <Clock className="w-4 h-4 mr-2" />
                      <span>До {order.deadline}</span>
                    </div>
                  </div>
                  <Button 
                    variant="outline" 
                    className="group" 
                    onClick={() => handleOrderDetails(order.id)}
                  >
                    Подробнее
                    <ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-1" />
                  </Button>
                </div>
              </motion.div>
            ))
          )}
        </motion.div>
        
        <motion.div 
          className="text-center"
          initial="hidden"
          animate={inView ? "visible" : "hidden"}
          variants={fadeInUp}
        >
          <Button 
            variant="outline" 
            className="px-8 py-6 rounded-full text-base border-2 border-[var(--primary-600)] text-primary hover:bg-[var(--primary-50)] dark:border-[var(--primary-500)] dark:text-[var(--primary-400)] dark:hover:bg-gray-800/70"
            onClick={handleViewAllOrders}
          >
            Смотреть все заказы
          </Button>
        </motion.div>
      </div>
    </section>
  );
};

export default NewOrders;