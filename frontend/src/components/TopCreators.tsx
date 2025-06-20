
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
    <section className="py-16 bg-gradient-to-b from-white to-gray-50">
      <div className="container mx-auto px-4">
        <motion.div 
          className="text-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: inView ? 1 : 0, y: inView ? 0 : 20 }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Популярные креаторы
          </h2>
          <p className="text-xl text-gray-600">
            Топовые создатели контента с высоким рейтингом
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
              <div className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 h-full flex flex-col">
                <div className="p-6 pb-0">
                  <div className="flex items-start space-x-4 mb-4">
                    <div className="relative">
                      <img 
                        src={creator.avatar} 
                        alt={creator.name}
                        className="w-16 h-16 rounded-full object-cover border-2 border-white shadow-sm"
                      />
                      {creator.isOnline && (
                        <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-white"></div>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-bold text-lg text-gray-900">{creator.name}</h3>
                          <p className="text-sm text-gray-500">@{creator.username}</p>
                        </div>
                        <div className="flex items-center bg-yellow-50 text-yellow-700 text-xs font-medium px-2 py-1 rounded-full">
                          <Star className="w-3 h-3 mr-1 fill-current" />
                          {creator.rating}
                        </div>
                      </div>
                      <div className="mt-1">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {creator.platform}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                    {creator.topService}
                  </p>
                  
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {creator.tags.map((tag, i) => (
                      <span key={i} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
                
                <div className="mt-auto p-6 pt-0">
                  <div className="border-t border-gray-100 pt-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-xs text-gray-500">от</p>
                        <p className="text-lg font-bold text-purple-600">{creator.minPrice.toLocaleString()} ₽</p>
                      </div>
                      <Button size="sm" className="rounded-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
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
            className="rounded-full border-2 border-purple-100 text-purple-700 hover:bg-purple-50 hover:border-purple-200 px-8 py-6 text-base"
          >
            Показать всех креаторов
          </Button>
        </motion.div>
      </div>
    </section>
  );
};

export default TopCreators;
