import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { Button } from './ui/button';
import { useInView } from 'react-intersection-observer';
import { useNavigate } from 'react-router-dom';
import { fetchTopCreators } from '@/api/creatorsApi';
import { Creator } from '@/types/creators';
import { useAuth } from '@/contexts/AuthContext';
import CreatorCard from './CreatorCard';

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
  
  // Получаем состояние авторизации и информацию о пользователе из AuthContext
  const { isAuthenticated, user } = useAuth();

  // Загружаем данные о топ-креаторах при монтировании компонента
  useEffect(() => {
    const loadTopCreators = async () => {
      setIsLoading(true);
      try {
        // Проверяем авторизацию перед выполнением API-запроса
        if (isAuthenticated) {
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
        } else {
          // Если пользователь не авторизован, используем моковые данные
          console.log('Пользователь не авторизован, используем моковые данные для TopCreators');
          setCreators(mockCreators as unknown as Creator[]);
        }
      } catch (error) {
        console.error('Ошибка при загрузке топ-креаторов:', error);
        // Используем моковые данные в случае ошибки
        setCreators(mockCreators as unknown as Creator[]);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadTopCreators();
  }, [isAuthenticated]);
  
  // Переход на страницу всех креаторов
  const handleShowAllCreators = () => {
    navigate('/catalog-creators');
  };
  
  // Переход на страницу профиля креатора
  const handleCreatorProfile = (id: number) => {
    navigate(`/creators/${id}`);
  };

  // Анимации для элементов
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.4 }
    }
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
          variants={containerVariants}
          initial="hidden"
          animate={inView ? "visible" : "hidden"}
        >
          {isLoading ? (
            // Заглушки для загрузки
            Array(4).fill(0).map((_, index) => (
              <motion.div 
                key={`skeleton-${index}`} 
                variants={itemVariants}
                className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 h-96 animate-pulse"
              />
            ))
          ) : (
            // Отображаем креаторов с использованием CreatorCard
            creators.map((creator) => (
              <motion.div 
                key={creator.id} 
                variants={itemVariants}
                onClick={() => handleCreatorProfile(Number(creator.id))}
                className="cursor-pointer"
              >
                <CreatorCard creator={creator} hideButtons={user?.has_creator_profile || false} />
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