/**
 * Страница каталога креаторов
 */

import React from 'react';
import { Loader2 } from 'lucide-react';

import CreatorCard from '@/components/CreatorCard';
import { useCreatorsList } from '@/hooks/useSearchApi';
import { Button } from '@/components/ui/button';

const CatalogPage: React.FC = () => {
  const { creators, loading, error, refetch } = useCreatorsList();

  return (
    <div className="bg-gray-50 dark:bg-gray-950 min-h-screen">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <header className="mb-8">
          <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 dark:text-gray-100 sm:text-5xl md:text-6xl">
            Каталог Креаторов
          </h1>
          <p className="mt-3 max-w-md mx-auto text-base text-gray-500 dark:text-gray-400 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
            Найдите лучших создателей контента для вашего проекта.
          </p>
        </header>

        <main>
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-12 w-12 animate-spin text-purple-600" />
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-red-500 mb-4">Произошла ошибка при загрузке данных.</p>
              <Button variant="outline" onClick={() => refetch()}>
                Попробовать снова
              </Button>
            </div>
          ) : creators.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">Креаторы пока не найдены.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {creators.map((creator) => (
                <CreatorCard key={creator.id} creator={creator} />
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default CatalogPage;
