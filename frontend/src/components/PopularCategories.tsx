
import React, { useState } from 'react';
import { Video, Mic, Camera, Film, Box, Image, LayoutPanelTop, Smartphone, Video as VideoIcon, Tag, Play, Scissors, Youtube } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useFilter } from '@/contexts/FilterContext';
import { fetchPopularCategories, PopularCategory } from '@/api/tagsApi';

// Маппинг иконок категорий
const CategoryIcons: Record<string, React.ElementType> = {
  photo: Camera,
  vertical_video: Video,
  horizontal_video: Film,
  voice_video: Mic,
  animation_3d: Box,
  animation_2d: Play, 
  motion: LayoutPanelTop,
  mobile_shooting: Smartphone,
  professional_shooting: VideoIcon,
  video: Video,
  voiceover: Mic,
  music: Mic,
  editing: Scissors,
  animation: Image,
  thumbnails: Youtube
};

// Статичные категории из tags.md - раздел "Форматы и типы контента"
const contentFormatCategories: PopularCategory[] = [
  { id: 1, name: 'Фото', count: '120+ услуг', icon: 'Camera', color: 'from-[#4B8BE9] to-[#3874D6]', filter: 'photo', slug: 'photo' },
  { id: 2, name: 'Вертикальные видео', count: '200+ услуг', icon: 'Video', color: 'from-[#E95C4B] to-[#D5453B]', filter: 'vertical_video', slug: 'vertical_video' },
  { id: 3, name: 'Горизонтальные видео', count: '150+ услуг', icon: 'Film', color: 'from-[#48A675] to-[#3D8F64]', filter: 'horizontal_video', slug: 'horizontal_video' },
  { id: 4, name: 'Видео с озвучкой', count: '90+ услуг', icon: 'Mic', color: 'from-[#E9A64B] to-[#D69038]', filter: 'voice_video', slug: 'voice_video' },
  { id: 5, name: '3D анимация', count: '60+ услуг', icon: 'Box', color: 'from-[#9C4BE9] to-[#8438D5]', filter: 'animation_3d', slug: 'animation_3d' },
  { id: 6, name: '2D анимация', count: '80+ услуг', icon: 'Play', color: 'from-[#E94B9C] to-[#D53884]', filter: 'animation_2d', slug: 'animation_2d' },
  { id: 7, name: 'Моушен', count: '70+ услуг', icon: 'LayoutPanelTop', color: 'from-[#4BE9C8] to-[#38D5B6]', filter: 'motion', slug: 'motion' },
  { id: 8, name: 'Мобильная съемка', count: '110+ услуг', icon: 'Smartphone', color: 'from-[#E9C84B] to-[#D5B638]', filter: 'mobile_shooting', slug: 'mobile_shooting' },
  { id: 9, name: 'Профессиональная съемка', count: '85+ услуг', icon: 'VideoIcon', color: 'from-[#4BCDE9] to-[#38BBD5]', filter: 'professional_shooting', slug: 'professional_shooting' }
];

const PopularCategories = () => {
  const navigate = useNavigate();
  // Доступ к контексту фильтров
  const { setFilterTag, updateFilters } = useFilter();
  // Используем статичные категории из раздела "Форматы и типы контента" из tags.md
  const [categories] = useState<PopularCategory[]>(contentFormatCategories);
  const [isLoading] = useState(false);

  const handleCategoryClick = (filter: string) => {
    // Вместо редиректа по URL устанавливаем фильтр через контекст
    // Идентификатор категории "formats" для фильтров по форматам контента
    const categoryId = "formats";
    
    // Сначала сбрасываем все предыдущие фильтры по тегам
    updateFilters({ tags: { } });
    
    // Затем устанавливаем выбранный тег
    setFilterTag(categoryId, filter, true);
    
    // Перенаправляем на страницу каталога креаторов
    navigate('/catalog-creators/');
  };
  
  return (
    <section className="py-16 bg-white dark:bg-gray-900">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Популярные категории
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300">
            Найдите нужный тип контента для вашего бренда
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
          {isLoading ? (
            // Отображаем скелетоны загрузки для категорий
            Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="group">
                <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-gray-700 animate-pulse">
                  <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-xl mb-4"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                </div>
              </div>
            ))
          ) : (
            // Отображаем загруженные категории
            categories.map((category, index) => {
              // Определяем компонент иконки из маппинга или используем Tag как запасной вариант
              const IconComponent = CategoryIcons[category.filter || 'default'] || Tag;
              return (
                <div key={index} className="group cursor-pointer" onClick={() => handleCategoryClick(category.filter || category.slug)}>
                  <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 dark:border-gray-700 hover:border-gray-200 dark:hover:border-gray-600 transform hover:-translate-y-2">
                    <div className={`w-12 h-12 bg-gradient-to-r ${category.color || 'from-[#E95C4B] to-[#d54538]'} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 shadow-md`}>
                      <IconComponent className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-2 text-sm leading-tight">
                      {category.name}
                    </h3>
                    <p className="text-gray-500 dark:text-gray-400 text-xs">
                      {typeof category.count === 'number' ? `${category.count}+ услуг` : category.count}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </section>
  );
};

export default PopularCategories;
