import React, { useEffect } from 'react';
import { Search, MessageSquare, CheckCircle, Zap, ArrowRight } from 'lucide-react';
import { Button } from './ui/button';
import { motion, useAnimation } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { useNavigate } from 'react-router-dom';

const steps = [
  {
    icon: Search,
    title: 'Найдите идеального креатора',
    description: 'Используйте фильтры для поиска креаторов по нише, платформе и бюджету',
    color: 'from-[var(--primary-600)] to-[var(--accent-600)]'
  },
  {
    icon: MessageSquare,
    title: 'Обсудите детали',
    description: 'Свяжитесь с креатором через встроенный чат для обсуждения деталей проекта',
    color: 'from-[var(--secondary-500)] to-[var(--secondary-300)]'
  },
  {
    icon: CheckCircle,
    title: 'Оплатите безопасно',
    description: 'Внесите предоплату, которая будет заморожена до выполнения работы',
    color: 'from-[var(--success-500)] to-[var(--success-300)]'
  },
  {
    icon: Zap,
    title: 'Получите контент',
    description: 'Примите работу и получите готовый контент в согласованные сроки',
    color: 'from-[var(--warning-500)] to-[var(--warning-300)]'
  }
];

const HowItWorks = () => {
  const navigate = useNavigate();
  const controls = useAnimation();
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });
  
  const handleStartSearch = () => {
    navigate('/catalog');
  };

  useEffect(() => {
    if (inView) {
      controls.start('visible');
    }
  }, [controls, inView]);

  const container = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.3,
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
    <section id="how-it-works" className="py-16 bg-gray-50 dark:bg-gray-900 overflow-hidden">
      <div className="container mx-auto px-4">
        <motion.div 
          className="text-center mb-12"
          initial="hidden"
          animate={inView ? "visible" : "hidden"}
          variants={fadeInUp}
        >
          <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Как это работает
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Простой и безопасный способ найти профессиональных создателей контента
          </p>
        </motion.div>
        
        <motion.div 
          className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12"
          ref={ref}
          initial="hidden"
          animate={controls}
          variants={container}
        >
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <motion.div 
                key={index} 
                variants={item}
                className="group relative"
              >
                <div className="h-full bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 relative z-10">
                  <div 
                    className={`w-12 h-12 bg-gradient-to-r ${step.color} rounded-xl flex items-center justify-center mb-4 transition-transform duration-300 group-hover:scale-110`}
                  >
                    <Icon className="w-6 h-6 text-[#E95C4B] dark:text-gray-900" />
                  </div>
                  <div className="flex items-center mb-2">
                    <span className="w-8 h-8 bg-[var(--primary-100)] dark:bg-[var(--primary-900/50)] text-primary dark:text-[var(--primary-400)] rounded-full flex items-center justify-center font-bold mr-3 transition-colors">
                      {index + 1}
                    </span>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {step.title}
                    </h3>
                  </div>
                  <p className="text-gray-600 dark:text-gray-300 pl-11">
                    {step.description}
                  </p>
                </div>
                <div className="absolute inset-0 bg-gradient-to-r from-[var(--primary-500)] to-[var(--accent-500)] rounded-2xl opacity-0 group-hover:opacity-10 transition-opacity duration-300 -z-0"></div>
              </motion.div>
            );
          })}
        </motion.div>

        <motion.div 
          className="text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ delay: 0.8, duration: 0.6 }}
        >
          <Button 
            className="group bg-gradient-to-r from-[var(--primary-600)] to-[var(--accent-600)] hover:from-[var(--primary-700)] hover:to-[var(--accent-700)] px-8 py-6 text-lg rounded-full hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-300"
            size="lg"
            onClick={handleStartSearch}
          >
            Начать поиск креаторов
            <ArrowRight className="w-5 h-5 ml-2 transition-transform duration-300 group-hover:translate-x-1" />
          </Button>
        </motion.div>
      </div>
    </section>
  );
};

export default HowItWorks;
