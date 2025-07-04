
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Play, Star, Users, ArrowRight, Search, Zap, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';

const HeroSection = () => {
  const navigate = useNavigate();
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });

  const handleFindCreators = () => {
    navigate('/catalog');
  };

  const handleCreateOrder = () => {
    window.location.href = '#new-orders';
  };

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
      },
    },
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.6 } },
  };

  return (
    <section className="relative bg-gradient-to-br from-[var(--primary-50)] via-[var(--accent-50)] to-[var(--secondary-50)] dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 py-20 md:py-32 overflow-hidden">
      {/* Background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -right-20 -top-20 w-64 h-64 bg-[var(--primary-200)] dark:bg-[var(--primary-900/30)] rounded-full filter blur-3xl opacity-70 animate-blob"></div>
        <div className="absolute -left-20 -bottom-20 w-72 h-72 bg-[var(--accent-200)] dark:bg-[var(--accent-900/30)] rounded-full filter blur-3xl opacity-70 animate-blob animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[var(--secondary-100)] dark:bg-[var(--secondary-900/20)] rounded-full filter blur-3xl opacity-50 animate-blob animation-delay-4000"></div>
      </div>
      <div className="container mx-auto px-4">
        <div className="relative z-10 grid lg:grid-cols-2 gap-12 items-center">
          <motion.div 
            className="space-y-8"
            ref={ref}
            variants={container}
            initial="hidden"
            animate={inView ? "show" : "hidden"}
          >
            <motion.div className="space-y-4" variants={item}>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-white leading-tight">
                Найдите идеального{' '}
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-[#E95C4B]">
                  UGC-креатора
                </h1>
                {' '}для вашего бренда
              </h1>
              <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-300 leading-relaxed">
                Платформа для поиска талантливых создателей контента и заказа UGC-материалов 
                для вашего бренда. Более 10,000 проверенных креаторов готовы к сотрудничеству.
              </p>
            </motion.div>

            <motion.div className="flex flex-wrap gap-4" variants={item}>
              <Button 
                size="lg" 
                onClick={handleFindCreators}
                className="group rounded-full bg-[#E95C4B] hover:bg-[#d54538] px-8 py-6 text-lg transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5"
              >
                Найти креатора
                <ArrowRight className="w-5 h-5 ml-2 transition-transform duration-300 group-hover:translate-x-1" />
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                onClick={handleCreateOrder}
                className="group rounded-full px-8 py-6 text-lg border-2 border-gray-300 dark:border-gray-600 hover:bg-white/90 dark:hover:bg-gray-800/50 transition-all duration-300"
              >
                <Search className="w-5 h-5 mr-2" />
                Найти заказы
              </Button>
            </motion.div>

            <motion.div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-8" variants={item}>
              <div className="flex items-center space-x-3 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm p-3 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                <div className="p-2 bg-purple-100 dark:bg-purple-900/50 rounded-lg">
                  <Star className="w-5 h-5 text-purple-600 dark:text-purple-400 fill-current" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Рейтинг</p>
                  <p className="font-semibold text-gray-900 dark:text-white">4.9/5</p>
                </div>
              </div>
              <div className="inline-flex items-center bg-white/80 backdrop-blur-sm px-4 py-2 rounded-full shadow-sm space-x-2 text-sm text-primary font-medium border border-[var(--primary-100)]">
                <span className="bg-[var(--primary-100)] rounded-full p-1 flex-shrink-0">
                  <Users className="w-3 h-3 text-primary" />
                </span>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Креаторов</p>
                  <p className="font-semibold text-gray-900 dark:text-white">10,000+</p>
                </div>
              </div>
              <div className="flex items-center space-x-3 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm p-3 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                <div className="p-2 bg-green-100 dark:bg-green-900/50 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Выполнено заказов</p>
                  <p className="font-semibold text-gray-900 dark:text-white">50,000+</p>
                </div>
              </div>
            </motion.div>
          </motion.div>

          <motion.div 
            className="relative"
            initial={{ opacity: 0, x: 50 }}
            animate={{ 
              opacity: inView ? 1 : 0, 
              x: inView ? 0 : 50,
              transition: { 
                duration: 0.8,
                ease: [0.16, 1, 0.3, 1]
              }
            }}
          >
            <div className="relative">
              <div className="absolute -inset-4 bg-gradient-to-r from-[var(--primary-500)] to-[var(--accent-500)] rounded-3xl opacity-20 blur-2xl -z-10"></div>
              <div className="bg-white rounded-2xl shadow-2xl p-8 transform rotate-1 hover:rotate-0 transition-all duration-500 hover:shadow-xl">
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gradient-to-r from-[var(--primary-500)] to-[var(--accent-500)] rounded-full"></div>
                    <div>
                      <h3 className="font-semibold">@creative_anna</h3>
                      <p className="text-sm text-gray-500">UGC Creator</p>
                    </div>
                  </div>
                  <div className="aspect-w-16 aspect-h-9 bg-gray-100 rounded-xl overflow-hidden">
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[var(--primary-100)] to-[var(--secondary-100)]">
                      <Play className="w-12 h-12 text-primary" fill="currentColor" />
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-900">Создам вирусное видео</span>
                    <span className="text-sm font-bold text-primary">от 5 000 ₽</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
