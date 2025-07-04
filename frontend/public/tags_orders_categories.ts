/**
 * Категории тегов для заказов
 * Организовано для удобного выбора пользователем при создании заказа
 */

export interface TagCategory {
  id: string;
  name: string;
  emoji: string;
  tags: Tag[];
}

export interface Tag {
  id: string;
  name: string;
}

export const tagCategories: TagCategory[] = [
  {
    id: "content_format",
    name: "Форматы и типы контента",
    emoji: "🎥",
    tags: [
      { id: "photo", name: "Фото" },
      { id: "vertical_video", name: "Вертикальные видео" },
      { id: "horizontal_video", name: "Горизонтальные видео" },
      { id: "voiced_video", name: "Видео с озвучкой" },
      { id: "3d_animation", name: "3D анимация" },
      { id: "2d_animation", name: "2D анимация" },
      { id: "motion", name: "Моушен" },
      { id: "mobile_shooting", name: "Мобильная съемка" },
      { id: "professional_shooting", name: "Профессиональная съемка" }
    ]
  },
  {
    id: "content_type",
    name: "Содержание контента",
    emoji: "🧠",
    tags: [
      { id: "scenarios", name: "Сценарии" },
      { id: "product_testing", name: "Тестирует продукт/Обзоры" },
      { id: "selections", name: "Подборки" },
      { id: "subtitles", name: "Субтитры" },
      { id: "fashion", name: "Мода" },
      { id: "beauty", name: "Красота и уход" },
      { id: "fitness_sports", name: "Фитнес и Спорт" },
      { id: "health_wellness", name: "Здоровье и wellness" },
      { id: "transport", name: "Транспорт" },
      { id: "adult_content", name: "18+" },
      { id: "food_drinks", name: "Еда и напитки" },
      { id: "home_interior", name: "Дом и интерьер" },
      { id: "children_parenting", name: "Дети и материнство" },
      { id: "travel_tourism", name: "Путешествия и туризм" },
      { id: "tech_gadgets", name: "Техника и гаджеты" },
      { id: "education_courses", name: "Образование и курсы" },
      { id: "entertainment_hobbies", name: "Развлечения и хобби" },
      { id: "animals_pets", name: "Животные и питомцы" },
      { id: "business_finance", name: "Бизнес и финансы" },
      { id: "art_creativity", name: "Искусство и творчество" },
      { id: "books_literature", name: "Книги и литература" },
      { id: "tech_ai", name: "Технологии и ИИ" },
      { id: "services", name: "Услуги и сервисы" }
    ]
  }
];

/**
 * Получить тег по его ID
 */
export const getTagById = (tagId: string): Tag | undefined => {
  for (const category of tagCategories) {
    const tag = category.tags.find(t => t.id === tagId);
    if (tag) return tag;
  }
  return undefined;
};

/**
 * Получить все теги в виде плоского списка
 */
export const getAllTags = (): Tag[] => {
  return tagCategories.flatMap(category => category.tags);
};
