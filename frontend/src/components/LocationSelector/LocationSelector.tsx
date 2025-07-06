import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Check, ChevronDown, Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import './LocationSelector.css';

interface City {
  country: string;
  region: string;
  city: string;
}

interface LocationSelectorProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  className?: string;
}

/**
 * Компонент для выбора местоположения из списка городов России
 * Поддерживает поиск по городам и отображение в формате "Страна, Регион, Город"
 */
const LocationSelector: React.FC<LocationSelectorProps> = ({
  value,
  onChange,
  disabled = false,
  className = '',
}) => {
  // Загружаем список городов
  const [cities, setCities] = useState<City[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Состояние поиска и выбора
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCity, setSelectedCity] = useState<City | null>(null);

  // Загружаем города при монтировании компонента
  useEffect(() => {
    const loadCities = async () => {
      setLoading(true);
      try {
        const response = await fetch('/cities_russia_from_html.json');
        if (!response.ok) {
          throw new Error('Не удалось загрузить список городов');
        }
        const data: City[] = await response.json();
        setCities(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Неизвестная ошибка при загрузке городов');
      } finally {
        setLoading(false);
      }
    };
    
    loadCities();
  }, []);

  // Устанавливаем выбранный город из значения при загрузке компонента
  useEffect(() => {
    if (!value || !cities.length) return;
    
    // Проверяем, может ли значение быть полным названием города (Страна, Регион, Город)
    const fullCityMatch = cities.find(city => 
      `${city.country}, ${city.region}, ${city.city}` === value
    );
    
    if (fullCityMatch) {
      setSelectedCity(fullCityMatch);
      return;
    }
    
    // Проверяем просто на совпадение с названием города
    const cityMatch = cities.find(city => city.city === value);
    if (cityMatch) {
      setSelectedCity(cityMatch);
      return;
    }
  }, [value, cities]);

  // Фильтруем города по поисковому запросу
  const filteredCities = searchTerm ? cities.filter(city => {
    const fullLocation = `${city.country} ${city.region} ${city.city}`.toLowerCase();
    return fullLocation.includes(searchTerm.toLowerCase());
  }) : cities;
  
  // Ограничиваем результаты для оптимизации рендеринга
  const displayedCities = filteredCities.slice(0, 200);
  
  // Обработчик выбора города
  const handleSelectCity = (city: City) => {
    setSelectedCity(city);
    const locationString = `${city.country}, ${city.region}, ${city.city}`;
    onChange(locationString);
    setIsOpen(false);
    setSearchTerm('');
  };
  
  // Обработчик очистки выбора
  const handleClearSelection = () => {
    setSelectedCity(null);
    onChange('');
  };

  return (
    <div className={cn('location-selector', className)}>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={isOpen}
            className="w-full justify-between"
            disabled={disabled}
          >
            {selectedCity ? (
              <div className="flex items-center justify-between w-full">
                <span className="truncate">
                  {selectedCity.city}, {selectedCity.region}
                </span>
                {!disabled && (
                  <X 
                    className="ml-1 h-4 w-4 shrink-0 opacity-50 hover:opacity-100 cursor-pointer" 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleClearSelection();
                    }}
                  />
                )}
              </div>
            ) : (
              <span className="text-muted-foreground">Выберите местоположение</span>
            )}
            <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0" style={{ width: 'var(--radix-popover-trigger-width)', maxWidth: '400px' }}>
          <div className="p-2 flex items-center border-b">
            <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
            <Input
              placeholder="Поиск города..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="border-none focus-visible:ring-0 focus-visible:ring-offset-0"
            />
          </div>
          {loading ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              Загрузка городов...
            </div>
          ) : error ? (
            <div className="p-4 text-center text-sm text-destructive">
              {error}
            </div>
          ) : displayedCities.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              Городов не найдено
            </div>
          ) : (
            <ScrollArea className="h-72">
              <div className="p-1">
                {displayedCities.map((city, index) => (
                  <div
                    key={`${city.city}-${city.region}-${index}`}
                    className={cn(
                      'relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none',
                      selectedCity && selectedCity.city === city.city && selectedCity.region === city.region
                        ? 'bg-primary text-primary-foreground'
                        : 'hover:bg-muted'
                    )}
                    onClick={() => handleSelectCity(city)}
                  >
                    <div>
                      <div className="font-medium">{city.city}</div>
                      <div className="text-xs text-muted-foreground">
                        {city.region}, {city.country}
                      </div>
                    </div>
                    {selectedCity && selectedCity.city === city.city && selectedCity.region === city.region && (
                      <Check className="ml-auto h-4 w-4" />
                    )}
                  </div>
                ))}
                {filteredCities.length > 200 && (
                  <div className="py-2 px-2 text-center text-xs text-muted-foreground">
                    Показано 200 из {filteredCities.length} результатов. Уточните запрос для более точных результатов.
                  </div>
                )}
              </div>
            </ScrollArea>
          )}
        </PopoverContent>
      </Popover>
    </div>
  );
};

export default LocationSelector;
