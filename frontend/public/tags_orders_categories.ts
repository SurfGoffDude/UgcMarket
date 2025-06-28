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
    id: "format",
    name: "Форматы и типы контента",
    emoji: "🎥",
    tags: [
      { id: "blog_vlog", name: "Блог / Влог" },
      { id: "backstage", name: "Бэкстейдж" },
      { id: "instructional_video", name: "Обучающее видео" },
      { id: "product_review", name: "Обзор продукции" },
      { id: "promo_content", name: "Промо контент" },
      { id: "unboxing", name: "Распаковка" },
      { id: "advertising_video", name: "Рекламный ролик" },
      { id: "raw_content", name: "RAW-контент" },
      { id: "screenplay", name: "Сценарий" },
      { id: "screencast", name: "Скринкаст" },
      { id: "slider", name: "Слайдер" },
      { id: "swipe_carousel", name: "Свайп-карусель" },
      { id: "storyboard", name: "Storyboard" },
      { id: "vertical_video", name: "Vertical Video / Вертикальное видео" },
      { id: "pov", name: "POV" },
      { id: "native_integration", name: "Нативная интеграция" },
      { id: "lifestyle", name: "Lifestyle" },
      { id: "interview", name: "Интервью" },
      { id: "podcast", name: "Подкаст" },
      { id: "webinar", name: "Вебинар" },
      { id: "livestream", name: "Прямая трансляция" },
      { id: "testimonial", name: "Отзывы" },
      { id: "case_study", name: "Кейс-стади" },
      { id: "infographic_video", name: "Инфографика-видео" },
      { id: "animated_story", name: "Анимированная история" },
      { id: "reaction_video", name: "Реакция" },
    ]
  },
  {
    id: "platforms",
    name: "Платформы",
    emoji: "📱",
    tags: [
      { id: "instagram", name: "Instagram" },
      { id: "instagram_stories", name: "Instagram Stories" },
      { id: "stories", name: "Stories" },
      { id: "tiktok", name: "Tiktok" },
      { id: "tiktok_video", name: "TikTok видео" },
      { id: "youtube", name: "YouTube" },
      { id: "youtube_shorts", name: "YouTube Shorts" },
      { id: "reels", name: "Reels" },
      { id: "shorts", name: "Shorts" },
      { id: "reels_shorts", name: "Reels Shorts (YouTube Shorts)" },
      { id: "facebook", name: "Facebook" },
      { id: "pinterest", name: "Pinterest" },
      { id: "twitter", name: "Twitter" },
      { id: "linkedin", name: "LinkedIn" },
      { id: "twitch", name: "Twitch" },
      { id: "vk", name: "VK" },
      { id: "amazon", name: "Amazon" },
      { id: "etsy", name: "Etsy" },
      { id: "shopify", name: "Shopify" },
      { id: "behance", name: "Behance" },
      { id: "dribbble", name: "Dribbble" },
      { id: "snapchat", name: "Snapchat" },
      { id: "discord", name: "Discord" },
      { id: "telegram", name: "Telegram" },
      { id: "medium", name: "Medium" },
      { id: "reddit", name: "Reddit" },
      { id: "quora", name: "Quora" },
      { id: "web", name: "Web-сайт" },
    ]
  },
  {
    id: "tools",
    name: "Инструменты и монтаж",
    emoji: "🛠",
    tags: [
      { id: "capcut", name: "CapCut" },
      { id: "canva", name: "Canva" },
      { id: "finalcutpro", name: "Final Cut Pro" },
      { id: "premiere_pro", name: "Premiere Pro" },
      { id: "davinci_resolve", name: "DaVinci Resolve" },
      { id: "mobile_editing", name: "Мобильный монтаж" },
      { id: "pc_editing", name: "ПК монтаж" },
      { id: "editing", name: "Монтаж" },
      { id: "smartphone_shooting", name: "Смартфон съёмка" },
      { id: "camera_shooting", name: "Камера съёмка" },
      { id: "tripod", name: "Штатив" },
      { id: "stabilizer", name: "Стабилизатор" },
      { id: "lavalier", name: "Петличка" },
      { id: "lighting", name: "Освещение" },
      { id: "color_background", name: "Цветной фон" },
      { id: "color_correction", name: "Цветокоррекция" },
      { id: "screen_recording", name: "Запись экрана" },
      { id: "equipment_rental", name: "Аренда оборудования" },
      { id: "greenscreen", name: "Greenscreen" },
      { id: "teleprompter", name: "Телесуфлёр" },
      { id: "slow_motion", name: "Slow Motion" },
      { id: "time_lapse", name: "Time Lapse" },
      { id: "hdr", name: "HDR съёмка" },
      { id: "4k", name: "4K видео" },
      { id: "voiceover_recording", name: "Запись озвучки" },
      { id: "streaming_setup", name: "Streaming setup" },
      { id: "drone_shooting", name: "Съёмка с дрона" },
    ]
  },
  {
    id: "animation",
    name: "Анимация и эффекты",
    emoji: "✨",
    tags: [
      { id: "animation", name: "Анимация" },
      { id: "2d_animation", name: "2D Анимация" },
      { id: "3d_animation", name: "3D Анимация" },
      { id: "motion_design", name: "Motion Design" },
      { id: "logo_reveal", name: "Logo Reveal / Логотип" },
      { id: "lower_thirds", name: "Lower Thirds / Лоуэр треты" },
      { id: "vfx_cgi", name: "VFX / CGI" },
      { id: "saas_design", name: "SaaS-дизайн" },
      { id: "branding", name: "Брендинг" },
      { id: "subtitles", name: "Subtitles / Субтитры" },
      { id: "video_infographics", name: "Видеоинфографика" },
      { id: "kinetic_typography", name: "Кинетическая типографика" },
      { id: "transitions", name: "Переходы" },
      { id: "visual_effects", name: "Визуальные эффекты" },
      { id: "character_animation", name: "Анимация персонажей" },
      { id: "explainer_animation", name: "Explainer Animation" },
      { id: "whiteboard_animation", name: "Whiteboard Animation" },
      { id: "ui_animation", name: "UI Animation" },
      { id: "infographic_animation", name: "Анимация инфографики" },
    ]
  },
  {
    id: "audio",
    name: "Аудио и звук",
    emoji: "🔊",
    tags: [
      { id: "music_beat", name: "Музыка / Бит" },
      { id: "narration", name: "Narration / Озвучка" },
      { id: "voice_over", name: "Озвучка" },
      { id: "sound_design", name: "Саунд-дизайн" },
      { id: "mixing", name: "Сведение" },
      { id: "mastering", name: "Мастеринг" },
      { id: "podcast_editing", name: "Монтаж подкаста" },
      { id: "field_recording", name: "Полевая запись" },
      { id: "foley", name: "Фоли" },
      { id: "sfx", name: "Звуковые эффекты" },
      { id: "audio_cleanup", name: "Чистка звука" },
      { id: "dubbing", name: "Дубляж" },
      { id: "background_music", name: "Фоновая музыка" },
      { id: "music_composing", name: "Написание музыки" },
    ]
  },
  {
    id: "marketing",
    name: "Маркетинговые цели",
    emoji: "📈",
    tags: [
      { id: "attract_traffic", name: "Привлечение трафика" },
      { id: "sales", name: "Продажи" },
      { id: "more_conversions", name: "Больше конверсий" },
      { id: "virality", name: "Виральность" },
      { id: "ambassadors", name: "Амбассадоры" },
      { id: "test_content", name: "Обратная связь / Тестовый контент" },
      { id: "b_roll", name: "B-roll" },
      { id: "cuts", name: "Нарезка" },
      { id: "lead_generation", name: "Лидогенерация" },
      { id: "brand_awareness", name: "Узнаваемость бренда" },
      { id: "retention", name: "Удержание" },
      { id: "engagement", name: "Вовлеченность" },
      { id: "loyalty", name: "Лояльность" },
      { id: "conversion_optimization", name: "Оптимизация конверсий" },
      { id: "remarketing", name: "Ремаркетинг" },
      { id: "ugc", name: "UGC" },
      { id: "pr_campaign", name: "PR кампания" },
      { id: "influencer_marketing", name: "Инфлюенсер маркетинг" },
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
