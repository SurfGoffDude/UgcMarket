import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Star, CheckCircle, ArrowRight, User } from 'lucide-react';
import { Button } from './ui/button';
import { useInView } from 'react-intersection-observer';
import { useNavigate } from 'react-router-dom';
import { fetchTopCreators } from '@/api/creatorsApi';
import { Creator } from '@/types/creators';

// Временные моковые данные для запасного варианта
const mockCreators = [
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
    platform: 'YouTube',
    followers: '650K',
    rating: 4.7,
    reviewCount: 321,
    minPrice: 6000,
    tags: ['Монтаж', 'Постобработка', 'Эффекты'],
    isOnline: true,
    topService: 'Монтаж и постобработка видео любой сложности'
  }
];

const TopCreators = () => {
  const navigate = useNavigate();
  const [ref, inView] = useInView({
    triggerOnce: false,
    threshold: 0.1
  });
  
  const [creators, setCreators] = useState<Creator[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Загружаем данные о топ-креаторах при монтировании компонента
  useEffect(() => {
    const loadTopCreators = async () => {
      setIsLoading(true);
      try {
        const data = await fetchTopCreators(4); // Получаем 4 лучших креатора
        setCreators(data.map(creator => ({
          ...creator,
          // Добавляем поля для совместимости с отображением
          display_name: `${creator.user?.first_name || ''} ${creator.user?.last_name || ''}`.trim() || creator.user?.username || 'Креатор',
          username: creator.user?.username || '',
          min_price: creator.price_range?.min || 3000,
          tags_display: creator.specializations || [],
          top_service: creator.bio || 'Профессиональные услуги в сфере контента'
        })));
      } catch (error) {
        console.error('Ошибка при загрузке топ-креаторов:', error);
        // Используем моковые данные в случае ошибки
        setCreators(mockCreators as unknown as Creator[]);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadTopCreators();
  }, []);
  
  // Переход на страницу всех креаторов
  const handleShowAllCreators = () => {
    navigate('/catalog/creators');
  };
  
  // Переход на страницу профиля креатора
  const handleCreatorProfile = (id: number) => {
    navigate(`/creators/${id}`);
  };

  return (
    <section className="py-16 bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4" ref={ref}>
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Топовые креаторы
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300">
            Лучшие профессионалы для создания вашего контента
          </p>
        </div>
        
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: inView ? 1 : 0 }}
          transition={{ staggerChildren: 0.1 }}
        >
          {isLoading ? (
            // Отображаем скелетоны загрузки
            Array.from({ length: 4 }).map((_, index) => (
              <motion.div key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: inView ? 1 : 0, y: inView ? 0 : 20 }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                className="h-full"
              >
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg h-full animate-pulse overflow-hidden border border-gray-100 dark:border-gray-700">
                  <div className="p-6">
                    <div className="flex items-center">
                      <div className="w-14 h-14 rounded-full bg-gray-200 dark:bg-gray-700 mr-4"></div>
                      <div>
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24 mb-2"></div>
                        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
                      </div>
                    </div>
                    <div className="mt-4 h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
                    <div className="mt-2 h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                    <div className="mt-4 flex flex-wrap">
                      <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-16 mr-2 mb-2"></div>
                      <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-20 mr-2 mb-2"></div>
                    </div>
                  </div>
                  <div className="mt-auto p-6 pt-0 border-t border-gray-100 dark:border-gray-700">
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-8 mb-1"></div>
                        <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
                      </div>
                      <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))
          ) : (
            // Отображаем реальных креаторов
            creators.map((creator, index) => (
              <motion.div 
                key={creator.id} 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: inView ? 1 : 0, y: inView ? 0 : 20 }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                className="h-full"
              >
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg hover:shadow-xl transition-shadow duration-300 flex flex-col h-full overflow-hidden border border-gray-100 dark:border-gray-700">
                  <div className="p-6">
                    <div className="flex items-center mb-4">
                      <div className="relative">
                        {creator.avatar ? (
                          <img 
                            src={creator.avatar} 
                            alt={creator.display_name || 'Креатор'} 
                            className="w-14 h-14 rounded-full object-cover border-2 border-white dark:border-gray-700 shadow-sm"
                          />
                        ) : (
                          <div className="w-14 h-14 rounded-full bg-gray-200 dark:bg-gray-700 border-2 border-white dark:border-gray-700 shadow-sm flex items-center justify-center">
                            <User className="w-6 h-6 text-gray-500 dark:text-gray-400" />
                          </div>
                        )}
                        {creator.is_online && (
                          <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-white dark:border-gray-800"></div>
                        )}
                      </div>
                      <div className="ml-4">
                        <div className="flex items-center">
                          <h3 className="font-bold text-gray-900 dark:text-white">{creator.display_name}</h3>
                          {creator.is_verified && <CheckCircle className="w-4 h-4 ml-1.5 text-primary" />}
                        </div>
                        <p className="text-gray-500 dark:text-gray-400 text-sm">@{creator.username}</p>
                      </div>
                    </div>
                    
                    <p className="text-gray-900 dark:text-gray-100 font-medium text-sm mb-2 line-clamp-2">
                      {creator.top_service}
                    </p>
                    
                    <div className="flex items-center mb-4">
                      <div className="flex items-center mr-4">
                        <Star className="w-4 h-4 text-yellow-500 mr-1" />
                        <span className="text-gray-700 dark:text-gray-200 font-medium">{creator.rating}</span>
                        <span className="text-gray-500 dark:text-gray-400 text-xs ml-1">({creator.reviews_count || 0})</span>
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap gap-1.5">
                      {creator.tags_display && creator.tags_display.length > 0 ? creator.tags_display.slice(0, 3).map((tag, tagIndex) => (
                        <span 
                          key={tagIndex} 
                          className="text-xs px-2.5 py-1 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200">
                          {tag}
                        </span>
                      )) : (
                        <span className="text-xs px-2.5 py-1 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200">
                          Контент-креатор
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="mt-auto p-6 pt-0">
                    <div className="border-t border-gray-100 dark:border-gray-700 pt-4">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">от</p>
                          <p className="text-lg font-bold text-primary dark:text-[var(--primary-400)]">{creator.min_price?.toLocaleString() || '3000'} ₽</p>
                        </div>
                        <Button 
                          size="sm" 
                          className="rounded-full bg-[#E95C4B] hover:bg-[#d54538]" 
                          onClick={() => handleCreatorProfile(creator.id)}
                        >
                          Заказать <ArrowRight className="w-4 h-4 ml-1.5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))
          )}
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
            onClick={handleShowAllCreators}
          >
            Показать всех креаторов
          </Button>
        </motion.div>
      </div>
    </section>
  );
};

export default TopCreators;