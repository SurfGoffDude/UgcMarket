/**
 * Главный компонент приложения
 * 
 * Обеспечивает настройку маршрутизации, провайдеров контекста и регистрацию Service Worker
 * для поддержки push-уведомлений
 */
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Routes, Route } from "react-router-dom";
import { useEffect } from "react";
import Layout from "@/components/Layout";

// Страницы
import Index from "@/pages/Index";
import CatalogPage from "@/pages/CatalogPage";
import CreatorProfilePage from "@/pages/CreatorProfilePage";
import ServicePage from "@/pages/ServicePage";
import CreateOrder from "@/pages/CreateOrder";
import NotFound from "@/pages/NotFound";
import LoginPage from "@/pages/LoginPage";
import RegisterPage from "@/pages/RegisterPage";
import ClientProfilePage from "@/pages/ClientProfilePage";
import OrdersPage from "@/pages/OrdersPage";
import OrderDetailPage from "@/pages/OrderDetailPage";
import OrderDeliveryPage from "@/pages/OrderDeliveryPage";
import MessagesPage from "@/pages/MessagesPage";
import CreatorReviews from "@/pages/CreatorReviews";
import ProfileEditPage from "@/pages/ProfileEditPage";
import SkillAddPage from "@/pages/SkillAddPage";
import ServiceAddPage from "@/pages/ServiceAddPage";
import PortfolioAddPage from "@/pages/PortfolioAddPage";
import PortfolioDetailPage from "@/pages/PortfolioDetailPage";

// Новые страницы для уведомлений
import NotificationsPage from "@/pages/NotificationsPage";
import NotificationSettingsPage from "@/pages/NotificationSettingsPage";

// Система уведомлений
import { NotificationsProvider } from "@/contexts/NotificationsContext";

// Регистрация Service Worker
import * as serviceWorkerRegistration from "./serviceWorkerRegistration";

const queryClient = new QueryClient();

console.log('Rendering App component');

/**
 * Главный компонент приложения
 * Включает все провайдеры и маршрутизацию 
 */
const App = () => {
  // Регистрация Service Worker при запуске приложения
  useEffect(() => {
    // Регистрируем Service Worker для получения push-уведомлений
    serviceWorkerRegistration.register({
      onSuccess: (registration) => {
        console.log('Service Worker успешно зарегистрирован:', registration);
      },
      onUpdate: (registration) => {
        console.log('Обнаружена новая версия Service Worker:', registration);
      },
    });
    
    // Отмена регистрации при размонтировании (для разработки)
    return () => {
      if (process.env.NODE_ENV !== 'production') {
        serviceWorkerRegistration.unregister();
      }
    };
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <NotificationsProvider>
          <Toaster />
          <Sonner />
          <Layout>
            <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/catalog" element={<CatalogPage />} />
                <Route path="/creator-profile" element={<CreatorProfilePage />} />
                <Route path="/creators/:id" element={<CreatorProfilePage />} />
                <Route path="/creators/:id/reviews" element={<CreatorReviews />} />
                <Route path="/creators/:creatorId/service/:serviceId" element={<ServicePage />} />
                <Route path="/create-order" element={<CreateOrder />} />
                
                {/* Страницы аутентификации */}
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/client-profile" element={<ClientProfilePage />} />
                
                {/* Страницы заказов */}
                <Route path="/orders" element={<OrdersPage />} />
                <Route path="/orders/:id" element={<OrderDetailPage />} />
                <Route path="/orders/:id/delivery" element={<OrderDeliveryPage />} />
                
                {/* Страницы сообщений */}
                <Route path="/messages" element={<MessagesPage />} />
                
                {/* Страницы уведомлений */}
                <Route path="/notifications" element={<NotificationsPage />} />
                <Route path="/notifications/settings" element={<NotificationSettingsPage />} />
                
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="/profile/edit" element={<ProfileEditPage />} />
                <Route path="/skills/add" element={<SkillAddPage />} />
                <Route path="/services/add" element={<ServiceAddPage />} />
                <Route path="/portfolio/add" element={<PortfolioAddPage />} />
                <Route path="/portfolio/:id" element={<PortfolioDetailPage />} />
                <Route path="*" element={<NotFound />} />
            </Routes>
          </Layout>
        </NotificationsProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
