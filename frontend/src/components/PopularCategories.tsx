
import React from 'react';
import { Video, Mic, Music, Scissors, Image, Youtube } from 'lucide-react';

const categories = [
  { icon: Video, name: 'Видео от блогеров', count: '2,500+', color: 'from-red-500 to-pink-500' },
  { icon: Mic, name: 'Озвучка', count: '1,200+', color: 'from-blue-500 to-purple-500' },
  { icon: Music, name: 'Музыка для Reels', count: '800+', color: 'from-green-500 to-teal-500' },
  { icon: Scissors, name: 'Монтаж', count: '1,800+', color: 'from-yellow-500 to-orange-500' },
  { icon: Image, name: 'Интро и анимация', count: '950+', color: 'from-purple-500 to-indigo-500' },
  { icon: Youtube, name: 'Обложки для YouTube', count: '650+', color: 'from-pink-500 to-rose-500' },
];

const PopularCategories = () => {
  return (
    <section className="py-16 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Популярные категории
          </h2>
          <p className="text-xl text-gray-600">
            Найдите нужный тип контента для вашего бренда
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
          {categories.map((category, index) => {
            const IconComponent = category.icon;
            return (
              <div key={index} className="group cursor-pointer">
                <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 hover:border-gray-200 transform hover:-translate-y-2">
                  <div className={`w-12 h-12 bg-gradient-to-r ${category.color} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                    <IconComponent className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2 text-sm leading-tight">
                    {category.name}
                  </h3>
                  <p className="text-gray-500 text-xs">
                    {category.count} услуг
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default PopularCategories;
