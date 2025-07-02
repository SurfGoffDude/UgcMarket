import React from 'react';
import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { Button } from './ui/button';
import { Zap, ArrowRight } from 'lucide-react';

const CallToAction = () => {
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });

  const container = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
      },
    },
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: [0.16, 1, 0.3, 1],
      },
    },
  };

  return (
    <section className="relative py-16 overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-r from-[var(--primary-600)] to-[var(--accent-600)] opacity-5 dark:opacity-[0.03]"></div>
      
      {/* Decorative elements */}
      <div className="absolute -right-20 -top-20 w-64 h-64 bg-[var(--primary-200)] dark:bg-[var(--primary-900/30)] rounded-full filter blur-3xl opacity-50"></div>
      <div className="absolute -left-20 -bottom-20 w-72 h-72 bg-[var(--accent-200)] dark:bg-[var(--accent-900/30)] rounded-full filter blur-3xl opacity-50"></div>
      
      <div className="container mx-auto px-4 relative z-10">
        <motion.div 
          ref={ref}
          className="text-center max-w-4xl mx-auto py-12 px-6 md:px-12 rounded-2xl bg-white dark:bg-gray-900/50 backdrop-blur-sm border border-gray-100 dark:border-gray-800 shadow-lg"
          initial="hidden"
          animate={inView ? "visible" : "hidden"}
          variants={container}
        >
          <motion.div variants={item} className="inline-flex items-center px-4 py-2 rounded-full bg-[var(--primary-100)] dark:bg-[var(--primary-900/50)] text-primary dark:text-[var(--primary-300)] text-sm font-medium mb-6">
            <Zap className="w-4 h-4 mr-2" />
            Начните прямо сейчас
          </motion.div>
          
          <motion.h2 
            className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6 bg-gradient-to-r from-[var(--primary-600)] via-[var(--accent-600)] to-[var(--secondary-600)] bg-clip-text text-transparent"
            variants={item}
          >
            Готовы найти идеального креатора для вашего бренда?
          </motion.h2>
          
          <motion.p 
            className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto"
            variants={item}
          >
            Присоединяйтесь к тысячам компаний, которые уже нашли идеальных создателей контента на нашей платформе.
          </motion.p>
          
          <motion.div 
            className="flex flex-col sm:flex-row justify-center gap-4"
            variants={item}
          >
            <Button 
              size="lg" 
              className="py-6 px-8 rounded-full shadow-lg bg-gradient-to-r from-[var(--primary-600)] to-[var(--accent-600)] text-white hover:from-[var(--primary-700)] hover:to-[var(--accent-700)] transition-all duration-300"
            >
              Начать бесплатно
              <ArrowRight className="w-5 h-5 ml-2 transition-transform duration-300 group-hover:translate-x-1" />
            </Button>
            
            <Button 
              variant="outline" 
              size="lg" 
              className="rounded-full px-8 py-6 text-lg font-medium border-2 border-[var(--primary-300)] dark:border-[var(--primary-600)] hover:bg-white/90 dark:hover:bg-gray-800/50 transition-all duration-300"
            >
              Узнать больше
            </Button>
          </motion.div>
          
          <motion.div 
            className="mt-8 flex flex-wrap items-center justify-center gap-4 text-sm text-gray-500 dark:text-gray-400"
            variants={item}
          >
            <div className="flex items-center">
              <svg className="w-4 h-4 text-[var(--success-500)] mr-1.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Без скрытых платежей
            </div>
            <div className="hidden sm:block w-px h-4 bg-gray-300 dark:bg-gray-600"></div>
            <div className="flex items-center">
              <svg className="w-4 h-4 text-[var(--success-500)] mr-1.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Гарантия возврата
            </div>
            <div className="hidden sm:block w-px h-4 bg-gray-300 dark:bg-gray-600"></div>
            <div className="flex items-center">
              <svg className="w-4 h-4 text-[var(--success-500)] mr-1.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Круглосуточная поддержка
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

export default CallToAction;
