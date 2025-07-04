import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Mail, CheckCircle } from 'lucide-react';

/**
 * Страница с просьбой подтвердить email после регистрации
 * 
 * @returns {JSX.Element} Компонент страницы подтверждения email
 */
const EmailVerificationPage: React.FC = () => {
  // Получаем email пользователя из состояния навигации
  const location = useLocation();
  const email = location.state?.email || 'вашу электронную почту';

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md">
        <div className="text-center">
          <div className="mx-auto h-20 w-20 rounded-full bg-[#f8e9e7] flex items-center justify-center">
            <Mail className="h-10 w-10 text-[#E95C4B]" />
          </div>
          <h2 className="mt-6 text-2xl font-bold text-gray-900 dark:text-white">
            Подтвердите ваш email
          </h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Мы отправили письмо со ссылкой для подтверждения на
            <span className="font-medium block mt-1">{email}</span>
          </p>
        </div>

        <div className="mt-8 space-y-6">
          <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-md">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <CheckCircle className="h-5 w-5 text-[#E95C4B]" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                  Что дальше?
                </h3>
                <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Перейдите на вашу почту</li>
                    <li>Найдите письмо от UGC Market</li>
                    <li>Нажмите кнопку "Подтвердить email" в письме</li>
                    <li>После подтверждения вы сможете полноценно использовать платформу</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <div className="text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Не получили письмо?
            </p>
            <Button
              type="button"
              className="mt-2 w-full bg-[#E95C4B] hover:bg-[#d54538] text-white font-medium rounded-md px-4 py-2"
            >
              Отправить письмо повторно
            </Button>
          </div>

          <div className="text-center mt-4">
            <Link 
              to="/login" 
              className="text-sm font-medium text-[#E95C4B] hover:text-[#d54538] dark:text-[#E95C4B] dark:hover:text-[#d54538]"
            >
              Вернуться на страницу входа
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmailVerificationPage;
