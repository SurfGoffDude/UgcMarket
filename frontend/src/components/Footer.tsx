import React from 'react';
import Logo from '@/components/ui/logo/Logo';

const Footer = () => {
  return (
    <footer className="bg-gray-900 text-white pt-16 pb-8">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Logo and description */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Logo variant="small" />
              <span className="text-2xl font-bold text-white">UGC Market</span>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed">
              Платформа для поиска и заказа качественного UGC-контента от лучших креаторов социальных сетей.
            </p>
          </div>

          {/* Company */}
          <div>
            <h3 className="font-semibold text-white mb-4 text-sm uppercase tracking-wider">Компания</h3>
            <ul className="space-y-2">
              <li><a href="#" className="text-gray-400 hover:text-white transition-colors text-sm inline-block py-1">О нас</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white transition-colors text-sm inline-block py-1">Карьера</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white transition-colors text-sm inline-block py-1">Пресс-центр</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white transition-colors text-sm inline-block py-1">Партнерство</a></li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="font-semibold text-white mb-4 text-sm uppercase tracking-wider">Поддержка</h3>
            <ul className="space-y-2">
              <li><a href="#" className="text-gray-400 hover:text-white transition-colors text-sm inline-block py-1">Справочный центр</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white transition-colors text-sm inline-block py-1">Связаться с нами</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white transition-colors text-sm inline-block py-1">FAQ</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white transition-colors text-sm inline-block py-1">Сообщество</a></li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="font-semibold text-white mb-4 text-sm uppercase tracking-wider">Правовая информация</h3>
            <ul className="space-y-2">
              <li><a href="#" className="text-gray-400 hover:text-white transition-colors text-sm inline-block py-1">Пользовательское соглашение</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white transition-colors text-sm inline-block py-1">Политика конфиденциальности</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white transition-colors text-sm inline-block py-1">Условия оплаты</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white transition-colors text-sm inline-block py-1">Безопасность</a></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-12 pt-8 flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0">
          <p className="text-gray-500 text-sm">
            {new Date().getFullYear()} UGC Market. Все права защищены.
          </p>
          <div className="flex items-center space-x-6">
            <a href="#" className="text-gray-500 hover:text-white text-sm transition-colors">Условия использования</a>
            <a href="#" className="text-gray-500 hover:text-white text-sm transition-colors">Конфиденциальность</a>
            <a href="#" className="text-gray-500 hover:text-white text-sm transition-colors">Файлы cookie</a>
          </div>
          <p className="text-gray-500 text-sm flex items-center">
            Сделано с <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 mx-1 text-red-500">
              <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
            </svg> для креаторов
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
