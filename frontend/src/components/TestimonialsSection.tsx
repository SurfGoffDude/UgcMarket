import React from 'react';
import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { Star, StarHalf, Quote } from 'lucide-react';

const testimonials = [
  {
    id: 1,
    name: 'Анна Ковалева',
    role: 'Владелец бренда косметики',
    avatar: 'https://randomuser.me/api/portraits/women/44.jpg',
    content: 'Сотрудничаю с креаторами на этой платформе уже больше года. Нашла постоянных подрядчиков, которые создают качественный контент для моего бренда. Очень удобно, что все в одном месте!',
    rating: 5
  },
  {
    id: 2,
    name: 'Максим Петров',
    role: 'Маркетолог в IT-компании',
    avatar: 'https://randomuser.me/api/portraits/men/32.jpg',
    content: 'Отличная платформа для поиска талантливых создателей контента. Особенно радует система безопасных платежей и прозрачность сделок. Рекомендую!',
    rating: 4.5
  },
  {
    id: 3,
    name: 'Елена Смирнова',
    role: 'Бренд-менеджер',
    avatar: 'https://randomuser.me/api/portraits/women/68.jpg',
    content: 'Использую платформу для поиска блогеров и создания UGC-контента. Очень удобный интерфейс и большой выбор исполнителей на любой бюджет.',
    rating: 5
  },
  {
    id: 4,
    name: 'Дмитрий Иванов',
    role: 'Основатель стартапа',
    avatar: 'https://randomuser.me/api/portraits/men/75.jpg',
    content: 'Как стартап, мы ценим возможность находить креативных людей по доступным ценам. Платформа помогла нам запустить несколько успешных рекламных кампаний.',
    rating: 4
  }
];

const TestimonialsSection = () => {
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });

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

  const renderStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    
    for (let i = 1; i <= 5; i++) {
      if (i <= fullStars) {
        stars.push(<Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />);
      } else if (i === fullStars + 1 && hasHalfStar) {
        stars.push(<StarHalf key={i} className="w-5 h-5 text-yellow-400 fill-current" />);
      } else {
        stars.push(<Star key={i} className="w-5 h-5 text-gray-300 fill-current" />);
      }
    }
    
    return stars;
  };

  return (
    <section className="py-16 bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4">
        <motion.div 
          className="text-center mb-12"
          initial="hidden"
          animate={inView ? "show" : "hidden"}
          variants={fadeInUp}
        >
          <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Отзывы клиентов
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Что говорят о нас заказчики и креаторы
          </p>
        </motion.div>
        
        <motion.div 
          ref={ref}
          className="grid md:grid-cols-2 gap-8"
          initial="hidden"
          animate={inView ? "show" : "hidden"}
          variants={container}
        >
          {testimonials.map((testimonial) => (
            <motion.div
              key={testimonial.id}
              className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm hover:shadow-lg transition-shadow duration-300"
              variants={item}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-4">
                  <img 
                    src={testimonial.avatar} 
                    alt={testimonial.name}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white">
                      {testimonial.name}
                    </h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {testimonial.role}
                    </p>
                  </div>
                </div>
                <div className="flex items-center">
                  {renderStars(testimonial.rating)}
                </div>
              </div>
              <div className="relative pl-4 border-l-2 border-purple-200 dark:border-purple-800">
                <Quote className="absolute -left-1 top-0 w-4 h-4 text-purple-400" />
                <p className="text-gray-600 dark:text-gray-300 italic mt-2 pl-4">
                  {testimonial.content}
                </p>
              </div>
            </motion.div>
          ))}
        </motion.div>
        
        <motion.div 
          className="mt-12 text-center"
          initial="hidden"
          animate={inView ? "show" : "hidden"}
          variants={fadeInUp}
        >
          <button className="px-6 py-3 bg-white dark:bg-gray-800 text-purple-600 dark:text-purple-400 font-medium rounded-full border-2 border-purple-600 dark:border-purple-500 hover:bg-purple-50 dark:hover:bg-gray-700 transition-colors duration-300">
            Оставить отзыв
          </button>
        </motion.div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
