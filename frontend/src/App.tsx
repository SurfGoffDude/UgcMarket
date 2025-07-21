/**
 * Главный компонент приложения
 * 
 * Обеспечивает настройку маршрутизации, провайдеров контекста и регистрацию Service Worker
 * для поддержки push-уведомлений
 */
import React from "react";
import { useEffect } from "react";
import "./App.css";
import { Routes, Route } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Layout from "@/components/Layout";
import ProtectedRoute from "@/components/ProtectedRoute";

// Страницы
import Index from "@/pages/Index";
import CatalogPage from "@/pages/CatalogPage";
import CreatorProfilePage from "@/pages/CreatorProfilePage";
import CreatorProfileEditPage from "@/pages/CreatorProfileEditPage";
import ServicePage from "@/pages/ServicePage";
import CreateOrder from "@/pages/CreateOrder";
import NotFound from "@/pages/NotFound";
import LoginPage from "@/pages/LoginPage";
import RegisterPage from "@/pages/RegisterPage";
import EmailVerificationPage from "@/pages/EmailVerificationPage";
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
import TagAddPage from "@/pages/TagAddPage";
import PortfolioDetailPage from "@/pages/PortfolioDetailPage";
import ServiceDetailPage from "@/pages/ServiceDetailPage";
import CatalogOrdersPage from "@/pages/CatalogOrdersPage";
import OrderResponsePage from "@/pages/OrderResponsePage";
import CreatorOrdersPage from "@/pages/CreatorOrdersPage";

// Новые страницы для уведомлений и чатов
import NotificationsPage from "@/pages/NotificationsPage";
import NotificationSettingsPage from "@/pages/NotificationSettingsPage";
import ChatsListPage from "@/pages/ChatsListPage";
import HowItWorksPage from "@/pages/HowItWorksPage";
import ChatPage from "@/pages/ChatPage";

// Система уведомлений
import { NotificationsProvider } from "@/contexts/NotificationsContext";

// Регистрация Service Worker
import * as serviceWorkerRegistration from "./serviceWorkerRegistration";

const queryClient = new QueryClient();



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

      },
      onUpdate: (registration) => {

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
          <ToastContainer position="top-right" autoClose={5000} hideProgressBar={false} />
          <Toaster />
          <Sonner />
          <Layout>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/how-it-works" element={<HowItWorksPage />} />
                <Route path="/catalog-creators" element={<ProtectedRoute><CatalogPage /></ProtectedRoute>} />
                <Route path="/creator-profile" element={<ProtectedRoute><CreatorProfilePage /></ProtectedRoute>} />
                <Route path="/creators/:id" element={<ProtectedRoute><CreatorProfilePage /></ProtectedRoute>} />
                <Route path="/creators/:id/edit" element={<ProtectedRoute><CreatorProfileEditPage /></ProtectedRoute>} />
                <Route path="/creators/:id/reviews" element={<ProtectedRoute><CreatorReviews /></ProtectedRoute>} />
                <Route path="/creators/:creatorId/service/:serviceId" element={<ProtectedRoute><ServicePage /></ProtectedRoute>} />
                <Route path="/create-order" element={<ProtectedRoute><CreateOrder /></ProtectedRoute>} />
                
                {/* Страницы аутентификации */}
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/email-verification" element={<EmailVerificationPage />} />
                <Route path="/client-profile" element={<ProtectedRoute><ClientProfilePage /></ProtectedRoute>} />
                
                {/* Страницы заказов */}
                <Route path="/catalog-orders" element={<ProtectedRoute><CatalogOrdersPage /></ProtectedRoute>} />
                <Route path="/orders" element={<ProtectedRoute><OrdersPage /></ProtectedRoute>} />
                <Route path="/creator-orders" element={<ProtectedRoute><CreatorOrdersPage /></ProtectedRoute>} />
                <Route path="/orders/:id" element={<ProtectedRoute><OrderDetailPage /></ProtectedRoute>} />
                <Route path="/orders/:id/delivery" element={<ProtectedRoute><OrderDeliveryPage /></ProtectedRoute>} />
                <Route path="/orders/:id/respond" element={<ProtectedRoute><OrderResponsePage /></ProtectedRoute>} />
                
                {/* Страницы сообщений */}
                <Route path="/messages" element={<ProtectedRoute><MessagesPage /></ProtectedRoute>} />
                
                {/* Страницы чатов */}
                <Route path="/chats" element={<ProtectedRoute><ChatsListPage /></ProtectedRoute>} />
                <Route path="/chats/:id" element={<ProtectedRoute><ChatPage /></ProtectedRoute>} />
                
                {/* Страницы уведомлений */}
                <Route path="/notifications" element={<ProtectedRoute><NotificationsPage /></ProtectedRoute>} />
                <Route path="/notifications/settings" element={<ProtectedRoute><NotificationSettingsPage /></ProtectedRoute>} />
                
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="/profile/edit" element={<ProtectedRoute><ProfileEditPage /></ProtectedRoute>} />
                <Route path="/creators/:id/edit" element={<ProtectedRoute><CreatorProfileEditPage /></ProtectedRoute>} />
                <Route path="/tags/add" element={<ProtectedRoute><TagAddPage /></ProtectedRoute>} />
                <Route path="/services/add" element={<ProtectedRoute><ServiceAddPage /></ProtectedRoute>} />
                <Route path="/portfolio/add" element={<ProtectedRoute><PortfolioAddPage /></ProtectedRoute>} />
                <Route path="/portfolio/:id" element={<ProtectedRoute><PortfolioDetailPage /></ProtectedRoute>} />
                <Route path="/services/:id" element={<ProtectedRoute><ServiceDetailPage /></ProtectedRoute>} />
                <Route path="*" element={<NotFound />} />
            </Routes>
          </Layout>
        </NotificationsProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
