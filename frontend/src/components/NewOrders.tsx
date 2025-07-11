import React from 'react';
import { Clock, DollarSign, Calendar, MessageSquare, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { Button } from './ui/button';

const orders = [
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
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });

  const container = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  const item = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: [0.16, 1, 0.3, 1],
      },
    },
  };

  const fadeInUp = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.8,
        ease: [0.16, 1, 0.3, 1],
      },
    },
  };

  return (
    <section className="py-16 bg-gray-50 dark:bg-gray-800/30">
      <div className="container mx-auto px-4">
        <motion.div 
          className="text-center mb-12"
          initial="hidden"
          animate={inView ? "visible" : "hidden"}
          variants={fadeInUp}
        >
          <h2 className="text-4xl font-bold mb-4 text-[#E95C4B] dark:text-[#E95C4B]">
            Новые заказы
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Свежие заказы от заказчиков, которые ищут таких креаторов, как вы
          </p>
        </motion.div>
        
        <motion.div 
          className="grid md:grid-cols-2 lg:grid-cols-2 gap-6 mb-12"
          ref={ref}
          initial="hidden"
          animate={inView ? "visible" : "hidden"}
          variants={container}
        >
          {orders.map((order) => (
            <motion.div
              key={order.id}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden border border-gray-100 dark:border-gray-700 hover:shadow-xl transition-shadow duration-300"
              variants={item}
            >
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-semibold text-primary dark:text-[var(--primary-400)] mb-4">
                      {order.title}
                    </h3>
                    <div className="flex gap-2 mb-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[var(--primary-100)] text-[var(--primary-800)] dark:bg-[var(--primary-900/50)] dark:text-[var(--primary-300)]">
                        {order.category}
                      </span>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[var(--secondary-100)] text-[var(--secondary-800)] dark:bg-[var(--secondary-900/50)] dark:text-[var(--secondary-300)]">
                        {order.platform}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                    <MessageSquare className="w-4 h-4 mr-1" />
                    <span>{order.proposals}</span>
                  </div>
                </div>
                
                <p className="text-gray-600 dark:text-gray-300 mb-4 line-clamp-2">
                  {order.description}
                </p>
                
                <div className="flex flex-wrap items-center justify-between mt-6">
                  <div className="space-y-2">
                    <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                      <DollarSign className="w-4 h-4 mr-2" />
                      <span>{order.budget}</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                      <Clock className="w-4 h-4 mr-2" />
                      <span>До {order.deadline}</span>
                    </div>
                  </div>
                  <Button variant="outline" className="group">
                    Подробнее
                    <ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-1" />
                  </Button>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
        
        <motion.div 
          className="text-center"
          initial="hidden"
          animate={inView ? "visible" : "hidden"}
          variants={fadeInUp}
        >
          <Button variant="outline" className="px-8 py-6 rounded-full text-base border-2 border-[var(--primary-600)] text-primary hover:bg-[var(--primary-50)] dark:border-[var(--primary-500)] dark:text-[var(--primary-400)] dark:hover:bg-gray-800/70">
            Смотреть все заказы
          </Button>
        </motion.div>
      </div>
    </section>
  );
};

export default NewOrders;
