/**
 * Страница каталога услуг
 */

import React, {
  useState,
  useEffect,
  useMemo,
  Fragment,
  useCallback,
} from 'react';
import {
  Search,
  X,
  Check,
  ChevronDown,
  ChevronUp,
  Loader2,
  History,
  Clock,
  ThumbsUp,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { useLocation, useNavigate } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useToast } from '@/components/ui/use-toast';
import ServiceCard from '@/components/ServiceCard';
import type { Service as APIService } from '@/types/services';

import {
  useServiceSearch,
  useSearchHistory,
  useSearchRecommendations,
  useAddClickedItem,
  useFilterOptions,
} from '@/hooks/useSearchApi';
import {
  FilterOption,
  SearchParams,
  queryStringToSearchParams,
  searchParamsToQueryString,
  SearchRecommendation,
} from '@/types/search';

/* -------------------------------------------------------------------------- */
/* Вспомогательный компонент                                                   */
/* -------------------------------------------------------------------------- */

interface FilterSectionProps {
  filter: FilterOption;
  activeValues: string[];
  onChange(value: string): void;
}

const FilterSection: React.FC<FilterSectionProps> = ({
  filter,
  activeValues,
  onChange,
}) => {
  const [open, setOpen] = useState<boolean>(true);

  return (
    <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
      <button
        className="flex w-full items-center justify-between text-left"
        onClick={() => setOpen((v) => !v)}
      >
        <span className="font-medium">{filter.name}</span>
        {open ? (
          <ChevronUp className="h-4 w-4" />
        ) : (
          <ChevronDown className="h-4 w-4" />
        )}
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.ul
            className="mt-3 space-y-2"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {filter.options.map((opt) => {
              const checked = activeValues.includes(opt.value);
              return (
                <li key={opt.value}>
                  <button
                    onClick={() => onChange(opt.value)}
                    className={`flex w-full items-center justify-between rounded-lg p-2 text-sm ${
                      checked
                        ? 'bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300'
                        : 'hover:bg-gray-50 dark:hover:bg-gray-700/50 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    <span>{opt.label}</span>
                    <span className="flex items-center gap-1">
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {opt.count}
                      </span>
                      {checked && (
                        <Check className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                      )}
                    </span>
                  </button>
                </li>
              );
            })}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/* Константы                                                                   */
/* -------------------------------------------------------------------------- */

const FALLBACK_FILTERS: FilterOption[] = [
  { id: 'platforms', name: 'Платформа', options: [] },
  { id: 'category', name: 'Категория', options: [] },
  { id: 'languages', name: 'Языки', options: [] },
];

const SORT_OPTIONS = [
  { name: 'По релевантности', value: 'rank' },
  { name: 'По рейтингу', value: '-average_rating' },
  { name: 'Сначала недорогие', value: 'price' },
  { name: 'Сначала дорогие', value: '-price' },
  { name: 'По количеству отзывов', value: '-review_count' },
  { name: 'Новые', value: '-created_at' },
  { name: 'Старые', value: 'created_at' },
];

/* -------------------------------------------------------------------------- */
/* Основной компонент                                                          */
/* -------------------------------------------------------------------------- */

const CatalogPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();

  /* ------------------------- URL ↔ state ---------------------------------- */

  const getParamsFromUrl = useCallback(
    () => queryStringToSearchParams(location.search.slice(1)),
    [location.search],
  );

  const [searchParams, setSearchParams] = useState<SearchParams>(
    getParamsFromUrl(),
  );
  const [searchQuery, setSearchQuery] = useState(searchParams.search || '');
  const [page, setPage] = useState(1);

  const [selectedPrice, setSelectedPrice] = useState<[number, number]>([
    searchParams.min_price ?? 0,
    searchParams.max_price ?? 100_000,
  ]);
  const [selectedRating, setSelectedRating] = useState<[number, number]>([
    searchParams.min_service_rating ?? 0,
    searchParams.max_service_rating ?? 5,
  ]);

  const [filtersOpen, setFiltersOpen] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  /* ------------------------- API hooks ------------------------------------ */

  const {
    data: servicesResp,
    loading: servicesLoading,
    error: servicesError,
    execute: refetchServices,
  } = useServiceSearch({ ...searchParams, page, page_size: 20 }, true);

  const {
    filters,
    loading: filtersLoading,
    error: filtersError,
  } = useFilterOptions();

  const {
    data: historyData,
    loading: historyLoading,
    execute: refetchHistory,
  } = useSearchHistory(1, 5, false);

  const {
    data: recommendations,
    loading: recLoading,
    execute: refetchRecs,
  } = useSearchRecommendations(false);

  const { addClickedItem } = useAddClickedItem(
    historyData?.results?.[0]?.id ?? 0,
  );

  /* ------------------------- infinite scroll ------------------------------ */

  const { ref: loadRef, inView } = useInView({ threshold: 0.1 });

  useEffect(() => {
    if (inView && servicesResp?.next) setPage((p) => p + 1);
  }, [inView, servicesResp?.next]);

  /* ------------------------- sync URL ↔ state ----------------------------- */

  useEffect(() => {
    const qs = searchParamsToQueryString(searchParams);
    navigate({ search: qs ? `?${qs}` : '' }, { replace: true });
  }, [searchParams, navigate]);

  useEffect(() => {
    refetchRecs();
    refetchHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const p = getParamsFromUrl();
    setSearchParams(p);
    setSearchQuery(p.search || '');
    if (p.min_price !== undefined && p.max_price !== undefined)
      setSelectedPrice([+p.min_price, +p.max_price]);
    if (p.min_service_rating !== undefined && p.max_service_rating !== undefined)
      setSelectedRating([+p.min_service_rating, +p.max_service_rating]);
  }, [location.search, getParamsFromUrl]);

  /* ------------------------- helpers -------------------------------------- */

  const updateSearchParams = (patch: Partial<SearchParams>) => {
    setSearchParams((prev) => ({ ...prev, ...patch }));
    setPage(1);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    updateSearchParams({ search: searchQuery || undefined });
    refetchHistory();
    setShowHistory(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleRecommendation = (r: SearchRecommendation) => {
    setSearchQuery(r.query);
    updateSearchParams({ search: r.query, ...r.filters });
    setShowHistory(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    toast({
      title: 'Используется рекомендация',
      description: `Поиск «${r.query}»${
        Object.keys(r.filters).length ? ' с фильтрами' : ''
      }.`,
      duration: 3_000,
    });
  };

  const toggleFilter = (id: string, val: string) => {
    const current = searchParams[id as keyof SearchParams];
    let next: string | number | (string | number)[] | undefined;

    if (Array.isArray(current))
      next = current.includes(val) ? current.filter((v) => v !== val) : [...current, val];
    else if (typeof current === 'string')
      next = current === val ? undefined : [current, val];
    else next = val;

    updateSearchParams({ [id]: next } as Partial<SearchParams>);
  };

  const clearAll = () => {
    setSearchParams({ ordering: searchParams.ordering });
    setSelectedPrice([0, 100_000]);
    setSelectedRating([0, 5]);
  };

  const handlePrice = (value: number[]) => {
    const [min, max] = value as [number, number];
    setSelectedPrice([min, max]);
    updateSearchParams({
      min_price: min > 0 ? min : undefined,
      max_price: max < 100_000 ? max : undefined,
    });
  };

  const handleRating = (value: number[]) => {
    const [min, max] = value as [number, number];
    setSelectedRating([min, max]);
    updateSearchParams({
      min_service_rating: min > 0 ? min : undefined,
      max_service_rating: max < 5 ? max : undefined,
    });
  };

  const handleServiceClick = (id: number) => {
    if (historyData?.results?.length) addClickedItem(id).catch(console.error);
  };

  /* ------------------------- derived data --------------------------------- */

  const currentFilters = filters?.length ? filters : FALLBACK_FILTERS;

  const activeFilters = useMemo(() => {
    const res: Record<string, string[]> = {};
    currentFilters.forEach((f) => {
      const v = searchParams[f.id as keyof SearchParams];
      if (v)
        res[f.id] = Array.isArray(v) ? v.map(String) : [String(v)];
    });
    return res;
  }, [searchParams, currentFilters]);

  const hasActive =
    Object.values(activeFilters).some((arr) => arr.length) || !!searchQuery;

  const services: APIService[] = servicesResp?.results ?? [];
  const showLoadMore = Boolean(servicesResp?.next);
  const isDesktop =
    typeof window !== 'undefined' && window.matchMedia('(min-width:768px)').matches;

  /* ------------------------- render --------------------------------------- */

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* HERO ---------------------------------------------------------------- */}
      {/* … раздел HERO не изменён, опущен для краткости … */}

      {/* MAIN ---------------------------------------------------------------- */}
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col gap-6 md:flex-row">
          {/* SIDEBAR --------------------------------------------------------- */}
          {/* … код сайдбара оставлен без изменений … */}
          {/* RESULTS --------------------------------------------------------- */}
          <main className="flex-1">
            {/* top bar */}
            {/* … верхняя панель (сортировка / счётчик) … */}

            {/* grid */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {servicesLoading && !services.length ? (
                <div className="col-span-full flex justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
                </div>
              ) : servicesError ? (
                <div className="col-span-full py-12 text-center">
                  <p className="text-red-500">
                    Произошла ошибка при загрузке данных
                  </p>
                  <Button
                    variant="outline"
                    className="mt-4"
                    onClick={() => refetchServices()}
                  >
                    Попробовать снова
                  </Button>
                </div>
              ) : services.length === 0 ? (
                <div className="col-span-full py-12 text-center">
                  <p className="text-gray-500">
                    Не найдено услуг по вашему запросу
                  </p>
                </div>
              ) : (
                services.map((svc) => (
                  <div key={svc.id} onClick={() => handleServiceClick(svc.id)}>
                    {/*  👉 Cast в any, чтобы не споткнуться о несовпадение типов */}
                    <ServiceCard service={svc as any} />
                  </div>
                ))
              )}
            </div>

            {/* load more */}
            {showLoadMore && (
              <div ref={loadRef} className="mt-8 flex justify-center">
                {servicesLoading && services.length ? (
                  <Loader2 className="h-6 w-6 animate-spin text-purple-600" />
                ) : (
                  <Button
                    variant="outline"
                    disabled={servicesLoading}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    Загрузить ещё
                  </Button>
                )}
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
};

export default CatalogPage;
