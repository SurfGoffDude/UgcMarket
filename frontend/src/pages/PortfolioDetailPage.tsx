import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, Eye, Heart, Link as LinkIcon, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import apiClient from '@/api/client';
import { toast } from '@/components/ui/use-toast';

/**
 * Интерфейс для изображений портфолио
 */
interface PortfolioImage {
  id: number;
  portfolio_item: number;
  image?: string;           // Поле для URL изображения (как ожидалось)
  image_url?: string;       // Альтернативное название поля с URL
  url?: string;            // Ещё один возможный вариант
  caption?: string;
  order?: number;
}

/**
 * Интерфейс для работы портфолио
 */
interface PortfolioItem {
  id: number;
  title: string;
  description: string;
  cover_image?: string;           // Стандартное поле
  cover_image_url?: string;      // Поле, фактически используемое API
  external_url?: string;
  created_at: string;
  updated_at: string;
  creator_profile: number;
  images: PortfolioImage[];
  stats?: {
    views?: number;
    likes?: number;
    comments?: number;
  };
}

/**
 * Страница детального просмотра работы из портфолио
 */
const PortfolioDetailPage = () => {
  const { id } = useParams<{ id: string }>(); // Получаем ID работы из URL
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [portfolioItem, setPortfolioItem] = useState<PortfolioItem | null>(null);
  const [portfolioImages, setPortfolioImages] = useState<PortfolioImage[]>([]);
  const [currentImageIndex, setCurrentImageIndex] = useState<number>(0);
  
  // Загрузка данных о работе и дополнительных изображениях
  useEffect(() => {
    const fetchPortfolioData = async () => {
      if (!id) return;
      
      setIsLoading(true);
      setError(null);
      try {
        // Получаем данные о работе
        const response = await apiClient.get(`portfolio/${id}/`);
        setPortfolioItem(response.data);
        
        // Загружаем дополнительные изображения для работы
        const imagesResponse = await apiClient.get(`portfolio-images/?portfolio_item=${id}`);
        
        // Подробный вывод структуры первого изображения для отладки
        if (imagesResponse.data.results && imagesResponse.data.results.length > 0) {
          const firstImage = imagesResponse.data.results[0];
        } else if (Array.isArray(imagesResponse.data) && imagesResponse.data.length > 0) {
          const firstImage = imagesResponse.data[0];
        }
        
        // Обрабатываем разные форматы API ответа (массив или объект с results)
        let imagesArray: PortfolioImage[] = [];
        if (Array.isArray(imagesResponse.data)) {
          imagesArray = imagesResponse.data;
        } else if (imagesResponse.data.results && Array.isArray(imagesResponse.data.results)) {
          imagesArray = imagesResponse.data.results;
        }
        
        setPortfolioImages(imagesArray);
        
        // Вызываем эндпоинт для увеличения счетчика просмотров (если такой есть)
        try {
          await apiClient.post(`portfolio/${id}/view/`);
        } catch (viewError) {
          // Если эндпоинта для просмотров нет, игнорируем ошибку
        }
      } catch (err: any) {
        setError(err?.response?.data?.detail || 'Не удалось загрузить информацию о работе');
        toast({
          title: 'Ошибка',
          description: 'Не удалось загрузить информацию о работе',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchPortfolioData();
  }, [id]);
  
  // Форматирование даты
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('ru-RU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(date);
  };
  
  // Получаем общее количество изображений (основное + дополнительные)
  const getTotalImagesCount = (): number => {
    return portfolioImages.length + 1; // +1 для основного изображения
  };
  
  // Переход к следующему изображению
  const nextImage = () => {
    const totalImages = getTotalImagesCount();
    if (totalImages > 1) {
      setCurrentImageIndex((currentImageIndex + 1) % totalImages);
    }
  };
  
  // Переход к предыдущему изображению
  const prevImage = () => {
    const totalImages = getTotalImagesCount();
    if (totalImages > 1) {
      setCurrentImageIndex((currentImageIndex - 1 + totalImages) % totalImages);
    }
  };
  
  // Получение текущего изображения
  const getCurrentImage = (): string => {
    if (!portfolioItem) return '';
    
    // Если индекс 0, показываем основное изображение, иначе изображение из галереи
    if (currentImageIndex === 0) {
      // Проверяем наличие обложки в разных полях
      
      // Приоритет полей: cover_image_url, cover_image
      if (portfolioItem.cover_image_url) {
        return portfolioItem.cover_image_url;
      }
      
      if (portfolioItem.cover_image) {
        return portfolioItem.cover_image;
      }
      
      return 'https://via.placeholder.com/800x600?text=Изображение+недоступно';
    } else {
      // Получаем изображение из массива дополнительных изображений
      const imageIndex = currentImageIndex - 1; // -1, т.к. индекс 0 - это основное изображение
      if (portfolioImages && portfolioImages[imageIndex]) {
        const image = portfolioImages[imageIndex];
  
        
        // Проверяем разные возможные поля для URL изображения
        if (image.image_url) {
  
          return image.image_url;
        }
        
        if (image.url) {
  
          return image.url;
        }
        
        if (image.image) {
  
          return image.image;
        }
        
        // Пробуем найти поле, которое похоже на URL изображения
        for (const [key, value] of Object.entries(image)) {
          if (typeof value === 'string' && (
            key.includes('image') || 
            key.includes('url') || 
            key.includes('photo') || 
            key.includes('file')
          )) {
  
            return value;
          }
        }
        

      }
    }
    
    return 'https://via.placeholder.com/800x600?text=Изображение+недоступно';
  };
  
  // Получение подписи к текущему изображению
  const getCurrentCaption = (): string => {
    if (!portfolioItem) return '';
    
    if (currentImageIndex === 0) {
      return portfolioItem.title;
    } else {
      const imageIndex = currentImageIndex - 1;
      if (portfolioImages && portfolioImages[imageIndex]) {
        return portfolioImages[imageIndex].caption || '';
      }
    }
    
    return '';
  };
  
  // Форматирование числа (1K, 1M и т.д.)
  const formatNumber = (num?: number): string => {
    if (num === undefined) return '0';
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    } else if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
    return num.toString();
  };
  
  // Рендеринг загрузки
  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 flex justify-center items-center min-h-[60vh]">
        <Loader2 className="animate-spin mr-2" />
        <span>Загрузка...</span>
      </div>
    );
  }
  
  // Рендеринг ошибки
  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center text-red-500">
          <h2 className="text-xl font-semibold mb-2">Ошибка</h2>
          <p>{error}</p>
          <Button 
            variant="outline" 
            className="mt-4" 
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Назад
          </Button>
        </div>
      </div>
    );
  }
  
  // Рендеринг содержимого страницы
  if (!portfolioItem) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Работа не найдена</h2>
          <Button 
            variant="outline" 
            className="mt-4" 
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Назад
          </Button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Кнопка "Назад" */}
      <Button 
        variant="ghost" 
        className="mb-4" 
        onClick={() => navigate(-1)}
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Назад
      </Button>
      
      <Card className="rounded-xl overflow-hidden shadow-lg">
        <CardContent className="p-0">
          {/* Блок с основной информацией */}
          <div className="p-6">
            <h1 className="text-2xl font-semibold mb-2">{portfolioItem.title}</h1>
            
            {/* Дата публикации и статистика */}
            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-4">
              <div className="flex items-center">
                <Calendar className="mr-1 h-4 w-4" />
                <span>{portfolioItem.created_at ? formatDate(portfolioItem.created_at) : 'Дата не указана'}</span>
              </div>
              <div className="flex items-center">
                <Eye className="mr-1 h-4 w-4" />
                <span>{formatNumber(portfolioItem.stats?.views)}</span>
              </div>
              <div className="flex items-center">
                <Heart className="mr-1 h-4 w-4" />
                <span>{formatNumber(portfolioItem.stats?.likes)}</span>
              </div>
            </div>
          </div>
          
          {/* Блок с изображением */}
          <div className="relative bg-gray-100">
            <img 
              src={getCurrentImage()} 
              alt={portfolioItem.title}
              className="w-full max-h-[70vh] object-contain mx-auto"
            />
            
            {/* Навигация по изображениям */}
            {portfolioImages.length > 0 && (
              <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2">
                {/* Индикатор для основного изображения */}
                <button 
                  className={`w-3 h-3 rounded-full ${currentImageIndex === 0 ? 'bg-purple-600' : 'bg-gray-300'}`}
                  onClick={() => setCurrentImageIndex(0)}
                  title="Основное изображение"
                />
                
                {/* Индикаторы для дополнительных изображений */}
                {portfolioImages.map((_, idx) => (
                  <button 
                    key={idx}
                    className={`w-3 h-3 rounded-full ${currentImageIndex === idx + 1 ? 'bg-purple-600' : 'bg-gray-300'}`}
                    onClick={() => setCurrentImageIndex(idx + 1)}
                    title={`Изображение ${idx + 1}`}
                  />
                ))}
              </div>
            )}
            
            {/* Кнопки вперед/назад если есть дополнительные изображения */}
            {portfolioImages.length > 0 && (
              <>
                <button 
                  className="absolute top-1/2 left-4 -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-2"
                  onClick={prevImage}
                >
                  <ArrowLeft className="h-5 w-5" />
                </button>
                <button 
                  className="absolute top-1/2 right-4 -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-2"
                  onClick={nextImage}
                >
                  <ArrowLeft className="h-5 w-5 transform rotate-180" />
                </button>
              </>
            )}
            
            {/* Подпись к изображению */}
            {getCurrentCaption() && (
              <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white p-2 text-center">
                {getCurrentCaption()}
              </div>
            )}
          </div>
          
          {/* Описание работы */}
          <div className="p-6">
            <h2 className="text-xl font-semibold mb-4">Описание</h2>
            <div className="whitespace-pre-line">
              {portfolioItem.description || 'Описание отсутствует'}
            </div>
            
            {/* Внешняя ссылка */}
            {portfolioItem.external_url && (
              <div className="mt-6">
                <a 
                  href={portfolioItem.external_url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center hover:text-purple-600 transition-colors"
                >
                  <LinkIcon className="mr-2 h-5 w-5" /> 
                  Посмотреть работу на внешнем ресурсе
                </a>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PortfolioDetailPage;
