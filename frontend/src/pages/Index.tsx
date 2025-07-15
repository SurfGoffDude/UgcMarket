
import React from 'react';
import HeroSection from '@/components/HeroSection';
import FeaturesSection from '@/components/FeaturesSection';
import PopularCategories from '@/components/PopularCategories';
import HowItWorks from '@/components/HowItWorks';
import TestimonialsSection from '@/components/TestimonialsSection';
import TopCreators from '@/components/TopCreators';
import NewOrders from '@/components/NewOrders';
import CallToAction from '@/components/CallToAction';

const Index = () => {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <main>
        {/* 0. Первый блок */}
        <section id="hero">
          <HeroSection />
        </section>
        
        {/* 1. Как это работает */}
        <section id="how-it-works" className="py-16 bg-white dark:bg-gray-800">
          <HowItWorks />
        </section>
        
        {/* 2. Популярные категории */}
        <section id="categories" className="py-16 bg-gray-50 dark:bg-gray-900">
          <PopularCategories />
        </section>
        
        {/* 3. Популярные креаторы */}
        <section id="top-creators" className="py-16 bg-white dark:bg-gray-800">
          <TopCreators />
        </section>
        
        {/* 4. Свежие заказы */}
        <section id="new-orders" className="py-16 bg-gray-50 dark:bg-gray-900">
          <NewOrders />
        </section>
        
        {/* 5. Почему выбирают нас */}
        <section id="features">
          <FeaturesSection />
        </section>
        
        {/* 6. Отзывы клиентов */}
        <section id="testimonials">
          <TestimonialsSection />
        </section>
        
        {/* Call to Action */}
        <section id="cta">
          <CallToAction />
        </section>
      </main>
    </div>
  );
};

export default Index;
