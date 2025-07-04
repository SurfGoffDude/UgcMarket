
import React from 'react';
import { motion } from 'framer-motion';
import { Star, CheckCircle, ArrowRight } from 'lucide-react';
import { Button } from './ui/button';
import { useInView } from 'react-intersection-observer';

const creators = [
  {
    id: 1,
    name: 'Анна Креативная',
    username: 'creative_anna',
    avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b47c?w=150&h=150&fit=crop&crop=face',
    platform: 'TikTok',
    followers: '500K',
    rating: 4.9,
    reviewCount: 234,
    minPrice: 5000,
    tags: ['Танцы', 'Лайфстайл', 'Бьюти'],
    isOnline: true,
    topService: 'Создам вирусное видео для вашего продукта с танцевальным трендом'
  },
  {
    id: 2,
    name: 'Максим Голос',
    username: 'voice_max',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
    platform: 'YouTube',
    followers: '1.2M',
    rating: 4.8,
    reviewCount: 456,
    minPrice: 3000,
    tags: ['Озвучка', 'Реклама', 'Аудиокниги'],
    isOnline: false,
    topService: 'Профессиональная озвучка рекламных роликов и презентаций'
  },
  {
    id: 3,
    name: 'Лена Дизайн',
    username: 'design_lena',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face',
    platform: 'Instagram',
    followers: '750K',
    rating: 5.0,
    reviewCount: 189,
    minPrice: 7000,
    tags: ['Дизайн', 'Обложки', 'Брендинг'],
    isOnline: true,
    topService: 'Создание стильных обложек для YouTube и превью для соцсетей'
  },
  {
    id: 4,
    name: 'Артем Монтаж',
    username: 'edit_artem',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
    platform: 'TikTok',
    followers: '300K',
    rating: 4.7,
    reviewCount: 312,
    minPrice: 4000,
    tags: ['Монтаж', 'Эффекты', 'Reels'],
    isOnline: true,
    topService: 'Монтаж динамичных роликов для TikTok и Instagram Reels'
  }
];

const TopCreators = () => {
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.6 } },
  };

  return (
    <section className="py-16 bg-white dark:bg-gray-900">
      <div className="container mx-auto px-4">
        <motion.div 
          className="text-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: inView ? 1 : 0, y: inView ? 0 : 20 }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Популярные креаторы
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Талантливые создатели контента, готовые к сотрудничеству с брендами
          </p>
        </motion.div>

        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
          ref={ref}
          variants={container}
          initial="hidden"
          animate={inView ? "show" : "hidden"}
        >
          {creators.map((creator) => (
            <motion.div key={creator.id} variants={item} className="h-full">
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg hover:shadow-xl transition-shadow duration-300 flex flex-col h-full overflow-hidden border border-gray-100 dark:border-gray-700">
                <div className="p-6 pb-4 flex-grow">
                  <div className="flex items-center text-sm text-[var(--secondary-600)] dark:text-[var(--secondary-400)] mb-3">
                    <div className="relative">
                      <img 
                        src={creator.avatar} 
                        alt={creator.name}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                      {creator.platform === 'YouTube' && (
                        <span className="absolute bottom-0 right-0 bg-[var(--secondary-500)] rounded-full p-0.5">
                          <CheckCircle className="w-3 h-3 text-white" />
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-bold text-lg text-gray-900 dark:text-white">{creator.name}</h3>
                      <p className="text-gray-500 dark:text-gray-400 text-sm">@{creator.username}</p>
                    </div>
                    <div className="flex items-center bg-yellow-50 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 text-xs font-medium px-2 py-1 rounded-full">
                      <Star className="w-3 h-3 mr-1 fill-current" />
                      {creator.rating}
                    </div>
                  </div>
                  
                  {creator.isOnline ? (
                    <div className="mb-3">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[var(--success-100)] dark:bg-[var(--success-900/50)] text-[var(--success-800)] dark:text-[var(--success-300)]">
                        <span className="w-1.5 h-1.5 rounded-full bg-[var(--success-500)] mr-1.5"></span>
                        Онлайн
                      </span>
                    </div>
                  ) : null}
                  
                  <p className="text-gray-600 dark:text-gray-300 text-sm mb-4 line-clamp-2">
                    {creator.topService}
                  </p>
                  
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {creator.tags.map((tag, i) => (
                      <span key={i} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
                
                <div className="mt-auto p-6 pt-0">
                  <div className="border-t border-gray-100 dark:border-gray-700 pt-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">от</p>
                        <p className="text-lg font-bold text-primary dark:text-[var(--primary-400)]">{creator.minPrice.toLocaleString()} ₽</p>
                      </div>
                      <Button size="sm" className="rounded-full bg-[#E95C4B] hover:bg-[#d54538]">
                        Заказать <ArrowRight className="w-4 h-4 ml-1.5" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
        
        <motion.div 
          className="text-center mt-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: inView ? 1 : 0, y: inView ? 0 : 20 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <Button 
            variant="outline" 
            className="rounded-full border-2 border-[var(--primary-100)] dark:border-[var(--primary-800)] text-primary dark:text-[var(--primary-400)] hover:bg-[var(--primary-50)] dark:hover:bg-[var(--primary-900/20)] hover:border-[var(--primary-200)] dark:hover:border-[var(--primary-700)] px-8 py-6 text-base"
          >
            Показать всех креаторов
          </Button>
        </motion.div>
      </div>
    </section>
  );
};

export default TopCreators;
