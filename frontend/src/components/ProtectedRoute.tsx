import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Компонент для защиты маршрутов, требующих авторизации
 * 
 * Проверяет, авторизован ли пользователь, и если нет, перенаправляет на страницу входа
 * с параметром reason=auth_required, который указывает на необходимость авторизации
 * 
 * @param {React.ReactNode} children - Дочерние компоненты, которые будут отображены, если пользователь авторизован
 * @returns {React.ReactElement} - Защищенный маршрут или перенаправление на страницу входа
 */
interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  // Если идет загрузка данных аутентификации, разрешаем доступ к странице
  // Это предотвратит мигание загрузчика и позволит компоненту отрендериться
  // Когда загрузка завершится, компонент перерендерится с актуальным состоянием авторизации
  if (loading) {
    return <>{children}</>;
  }

  // Если пользователь не авторизован, перенаправляем на страницу входа
  // с параметром reason=auth_required
  if (!isAuthenticated) {
    return <Navigate to="/login?reason=auth_required" replace />;
  }

  // Если пользователь авторизован, отображаем защищенный контент
  return <>{children}</>;
};

export default ProtectedRoute;
