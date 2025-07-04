
import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Search, User, Plus, LogIn, Menu, X, Moon, Sun, LogOut, Settings, Package, MessageSquare, Bell } from 'lucide-react';
import Logo from '@/components/ui/logo/Logo';
import NotificationIndicator from './notifications/NotificationIndicator';
import NotificationsMenu from './notifications/NotificationsMenu';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const navLinks = [
  { name: 'Я клиент', path: '/catalog-creators' },
  { name: 'Я креатор', path: '/catalog-orders' },
  { name: 'Как это работает', path: '#how-it-works' },
  { name: 'Блог', path: '/blog' },
];

const Header = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [notificationsAnchorEl, setNotificationsAnchorEl] = useState<HTMLElement | null>(null);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
    document.body.style.overflow = !isMenuOpen ? 'hidden' : 'auto';
  };

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
  };
  return (
    <header className={`sticky top-0 z-50 transition-all duration-300 ${
      isScrolled ? 'bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200/50 dark:border-gray-800/50 shadow-sm' : 'bg-white dark:bg-gray-900 border-b border-transparent'
    }`}>
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center">
            <button 
              onClick={toggleMenu}
              className="mr-4 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 md:hidden"
              aria-label="Toggle menu"
            >
              {isMenuOpen ? (
                <X className="w-5 h-5 text-gray-700 dark:text-gray-300" />
              ) : (
                <Menu className="w-5 h-5 text-gray-700 dark:text-gray-300" />
              )}
            </button>
            <Link to="/" className="flex items-center space-x-2">
              <Logo variant="small" />
              <span className="text-xl font-bold text-primary">
                UGC Market
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-1">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`px-4 py-2 text-sm font-medium rounded-full transition-colors ${
                  location.pathname === link.path
                    ? 'text-[#E95C4B] dark:text-[#E95C4B] bg-[#E95C4B]/10 dark:bg-[#E95C4B]/20'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
              >
                {link.name}
              </Link>
            ))}
          </nav>

          {/* Right side actions */}
          <div className="flex items-center space-x-3">
            {/* Кнопка создания заказа (только для клиентов) */}
            {isAuthenticated && user && !user.has_creator_profile && (
              <div className="hidden md:block">
                <Link to="/create-order">
                  <Button className="rounded-full bg-[#E95C4B] hover:bg-[#d54538]">
                    <Plus className="w-4 h-4 mr-2" />
                    Создать заказ
                  </Button>
                </Link>
              </div>
            )}
            
            {/* Индикатор уведомлений */}
            {isAuthenticated && (
              <div className="mx-1">
                <NotificationIndicator 
                  onClick={(e: React.MouseEvent<HTMLElement>) => {
                    setNotificationsAnchorEl(e.currentTarget);
                  }} 
                />
                <NotificationsMenu 
                  anchorEl={notificationsAnchorEl}
                  open={Boolean(notificationsAnchorEl)}
                  onClose={() => setNotificationsAnchorEl(null)}
                />
              </div>
            )}
            
            <button 
              onClick={toggleDarkMode}
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              aria-label={isDarkMode ? 'Переключить на светлую тему' : 'Переключить на темную тему'}
            >
              {isDarkMode ? (
                <Sun className="w-5 h-5 text-yellow-400" />
              ) : (
                <Moon className="w-5 h-5 text-gray-700 dark:text-gray-300" />
              )}
            </button>
            
            {/* Старая кнопка "Создать заказ" удалена, перенесена в верхний блок */}
            
            {/* Показываем кнопки входа и регистрации только для неавторизованных пользователей */}
            {!isAuthenticated ? (
              <div className="hidden md:flex items-center space-x-2">
                <Link to="/login">
                  <Button variant="ghost" className="rounded-full">
                    Войти
                  </Button>
                </Link>
                <Link to="/register">
                  <Button className="rounded-full bg-[#E95C4B]">
                    Регистрация
                  </Button>
                </Link>
              </div>
            ) : (
              // Дропдаун меню для авторизованных пользователей
              <DropdownMenu>
                <DropdownMenuTrigger className="ml-2 outline-none">
                  <div className="w-9 h-9 rounded-full bg-[#E95C4B] hover:bg-[#d54538] flex items-center justify-center text-white font-medium cursor-pointer transition-colors">
                    {user?.first_name?.[0] || user?.username?.[0] || <User className="w-4 h-4" />}
                  </div>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    {user?.full_name || user?.username || 'Аккаунт'}
                    <div className="text-xs font-normal text-gray-500 mt-1 truncate">{user?.email}</div>
                  </DropdownMenuLabel>
                  <DropdownMenuLabel>Мой аккаунт</DropdownMenuLabel>
                  <DropdownMenuItem 
                    onClick={() => {
                      // Отладочный вывод для проверки данных пользователя

                      // Навигация в зависимости от наличия профиля креатора
                      navigate((user as any)?.creator_profile_id ? '/creator-profile' : '/client-profile');
                    }} 
                    className="cursor-pointer">
                    <User className="mr-2 h-4 w-4" />
                    <span>Мой профиль</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/orders')} className="cursor-pointer">
                    <Package className="mr-2 h-4 w-4" />
                    <span>Мои заказы</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/messages')} className="cursor-pointer">
                    <MessageSquare className="mr-2 h-4 w-4" />
                    <span>Сообщения</span>
                  </DropdownMenuItem>
                  <DropdownMenuLabel className="font-medium text-sm">
                    Привет, {user?.username}!
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to="/notifications">
                      <Bell className="w-4 h-4 mr-2" />
                      Уведомления
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/notifications/settings">
                      <Settings className="w-4 h-4 mr-2" />
                      Настройки уведомлений
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={logout} className="cursor-pointer text-red-600 focus:text-red-600">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Выйти</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>

        {/* Mobile Search */}
        <div className="mt-3 md:hidden">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input 
              placeholder="Поиск креаторов, услуг..."
              className="pl-10 pr-4 py-2 w-full rounded-full border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800"
            />
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="md:hidden overflow-hidden bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800"
          >
            <div className="container mx-auto px-4 py-4 space-y-4">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={toggleMenu}
                  className={`block px-4 py-3 text-base font-medium rounded-lg ${
                    location.pathname === link.path
                      ? 'text-[#E95C4B] dark:text-[#E95C4B] bg-[#E95C4B]/10 dark:bg-[#E95C4B]/20'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
                >
                  {link.name}
                </Link>
              ))}
              <div className="pt-2 space-y-2">
                {!isAuthenticated ? (
                  <>
                    <Link to="/login" className="block" onClick={toggleMenu}>
                      <Button variant="outline" className="w-full justify-center">
                        Войти
                      </Button>
                    </Link>
                    <Link to="/register" className="block" onClick={toggleMenu}>
                      <Button className="w-full justify-center bg-[#E95C4B] hover:bg-[#d54538]">
                        Создать аккаунт
                      </Button>
                    </Link>
                  </>
                ) : (
                  <>
                    <Link 
                      to={(user as any)?.creator_profile_id ? "/creator-profile" : "/client-profile"} 
                      className="block" 
                      onClick={toggleMenu}
                    >
                      <Button className="w-full justify-center">
                        <User className="w-4 h-4 mr-2" />
                        Мой профиль
                      </Button>
                    </Link>
                    <Link to="/orders" className="block" onClick={toggleMenu}>
                      <Button variant="outline" className="w-full justify-center">
                        <Package className="w-4 h-4 mr-2" />
                        Мои заказы
                      </Button>
                    </Link>
                    <Link to="/messages" className="block" onClick={toggleMenu}>
                      <Button variant="outline" className="w-full justify-center">
                        <MessageSquare className="w-4 h-4 mr-2" />
                        Сообщения
                      </Button>
                    </Link>
                    <Link to="/notifications" className="block" onClick={toggleMenu}>
                      <Button variant="outline" className="w-full justify-center">
                        <Bell className="w-4 h-4 mr-2" />
                        Уведомления
                      </Button>
                    </Link>
                    <Link to="/notifications/settings" className="block" onClick={toggleMenu}>
                      <Button variant="outline" className="w-full justify-center">
                        <Settings className="w-4 h-4 mr-2" />
                        Настройки уведомлений
                      </Button>
                    </Link>
                    <Button 
                      onClick={() => { logout(); toggleMenu(); }}
                      variant="destructive" 
                      className="w-full justify-center"
                    >
                      <LogOut className="w-4 h-4 mr-2" />
                      Выйти
                    </Button>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};

export default Header;
