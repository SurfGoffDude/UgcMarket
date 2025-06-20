import React from 'react';
import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { Shield, Zap, Users, CheckCircle, Award, BarChart2 } from 'lucide-react';

const features = [
  {
    icon: Shield,
    title: 'Безопасные сделки',
    description: 'Все платежи защищены системой безопасных платежей. Деньги замораживаются до успешного выполнения заказа.'
  },
  {
    icon: Zap,
    title: 'Быстрый старт',
    description: 'Найдите подходящего креатора и начните сотрудничество в течение нескольких минут после регистрации.'
  },
  {
    icon: Users,
    title: 'Проверенные исполнители',
    description: 'Все креаторы проходят верификацию и имеют рейтинги с отзывами от реальных заказчиков.'
  },
  {
    icon: CheckCircle,
    title: 'Гарантия качества',
    description: 'Если работа не соответствует требованиям, вы можете запросить доработку или вернуть средства.'
  },
  {
    icon: Award,
    title: 'Профессионалы',
    description: 'Только опытные создатели контента с портфолио и подтвержденными навыками.'
  },
  {
    icon: BarChart2,
    title: 'Аналитика эффективности',
    description: 'Получайте детальную аналитику по эффективности контента и вовлеченности аудитории.'
  }
];

const FeaturesSection = () => {
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
    hidden: { opacity: 0, y: 30 },
    show: { 
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
    show: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.8,
        ease: [0.16, 1, 0.3, 1],
      },
    },
  };

  return (
    <section className="py-16 bg-white dark:bg-gray-900">
      <div className="container mx-auto px-4">
        <motion.div 
          className="text-center mb-12"
          initial="hidden"
          animate={inView ? "show" : "hidden"}
          variants={fadeInUp}
        >
          <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Почему выбирают нас
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Все необходимое для успешного сотрудничества с создателями контента
          </p>
        </motion.div>
        
        <motion.div 
          ref={ref}
          className="grid md:grid-cols-2 lg:grid-cols-3 gap-8"
          initial="hidden"
          animate={inView ? "show" : "hidden"}
          variants={container}
        >
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={index}
                className="group bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm hover:shadow-lg transition-shadow duration-300 border border-gray-100 dark:border-gray-700"
                variants={item}
              >
                <div className="w-12 h-12 rounded-xl bg-purple-50 dark:bg-purple-900/50 flex items-center justify-center mb-4 group-hover:bg-purple-100 dark:group-hover:bg-purple-900/70 transition-colors duration-300">
                  <Icon className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  {feature.description}
                </p>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
};

export default FeaturesSection;
