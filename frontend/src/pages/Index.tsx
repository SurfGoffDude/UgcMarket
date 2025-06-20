
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
        {/* Hero Section */}
        <section id="hero">
          <HeroSection />
        </section>
        
        {/* Features Section */}
        <section id="features">
          <FeaturesSection />
        </section>
        
        {/* Popular Categories */}
        <section id="categories" className="py-16 bg-gray-50 dark:bg-gray-900">
          <PopularCategories />
        </section>
        
        {/* How It Works */}
        <section id="how-it-works" className="py-16 bg-white dark:bg-gray-800">
          <HowItWorks />
        </section>
        
        {/* Testimonials */}
        <section id="testimonials">
          <TestimonialsSection />
        </section>
        
        {/* Top Creators */}
        <section id="top-creators" className="py-16 bg-gray-50 dark:bg-gray-900">
          <TopCreators />
        </section>
        
        {/* New Orders */}
        <section id="new-orders" className="py-16 bg-white dark:bg-gray-800">
          <NewOrders />
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
