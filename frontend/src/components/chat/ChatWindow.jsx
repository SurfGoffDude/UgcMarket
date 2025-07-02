import React, { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import ChatMessageList from './ChatMessageList';
import ChatInput from './ChatInput';
import websocketService from '../../utils/websocketService';
import { useApi } from '../../hooks/useApi';
import Button from '../ui/Button';

/**
 * Основной компонент чата, объединяющий список сообщений и ввод
 */
const ChatWindow = ({ threadId, orderInfo = null }) => {
  const [messages, setMessages] = useState([]);
  const [readMessages, setReadMessages] = useState({});
  const [typingUsers, setTypingUsers] = useState({});
  const [isConnected, setIsConnected] = useState(false);
  const [isJoined, setIsJoined] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMoreMessages, setHasMoreMessages] = useState(false);
  const [error, setError] = useState(null);
  
  const { user } = useSelector(state => state.auth);
  const api = useApi();
  
  /**
   * Инициализация чата - загрузка истории сообщений и подключение WebSocket
   */
  const initializeChat = useCallback(async () => {
    if (!threadId || !user) return;
    
    try {
      setIsLoading(true);
      
      // 1. Получаем историю сообщений с сервера
      const response = await api.get(`/api/messaging/threads/${threadId}/messages/`, {
        params: { page: 1, page_size: 20 }
      });
      
      setMessages(response.data.results || []);
      setHasMoreMessages(!!response.data.next);
      setPage(1);
      
      // 2. Получаем информацию о прочитанных сообщениях
      const readResponse = await api.get(`/api/messaging/threads/${threadId}/reads/`);
      
      // Преобразование массива прочтений в объект { message_id: true }
      const reads = {};
      if (readResponse.data && Array.isArray(readResponse.data)) {
        readResponse.data.forEach(read => {
          reads[read.message] = true;
        });
      }
      setReadMessages(reads);
      
      // 3. Подключаемся к WebSocket, если не подключены
      if (!websocketService.isConnected()) {
        // Получение JWT токена из локального хранилища
        const token = localStorage.getItem('access_token');
        
        if (!token) {
          throw new Error('Не найден токен доступа');
        }
        
        // Формируем WebSocket URL
        const wsUrl = process.env.NODE_ENV === 'production' 
          ? `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/ws/chat/`
          : `ws://${window.location.host}/ws/chat/`;
          
        // Подключаемся к WebSocket
        await websocketService.connect(token, wsUrl);
        setIsConnected(true);
      }
      
      // 4. Настраиваем обработчики событий WebSocket
      setupWebSocketHandlers();
      
      // 5. Присоединяемся к треду чата
      if (websocketService.isConnected() && !isJoined) {
        websocketService.joinThread(threadId);
        setIsJoined(true);
      }
      
    } catch (err) {
      console.error('Ошибка инициализации чата:', err);
      setError('Не удалось загрузить чат. Пожалуйста, попробуйте позже.');
    } finally {
      setIsLoading(false);
    }
  }, [threadId, user, api, isJoined]);
  
  /**
   * Загрузка более старых сообщений
   */
  const loadMoreMessages = useCallback(async () => {
    if (!threadId || !hasMoreMessages || isLoadingMore) return;
    
    try {
      setIsLoadingMore(true);
      
      const nextPage = page + 1;
      const response = await api.get(`/api/messaging/threads/${threadId}/messages/`, {
        params: { page: nextPage, page_size: 20 }
      });
      
      if (response.data.results && response.data.results.length > 0) {
        // Добавляем старые сообщения в начало массива
        setMessages(prevMessages => [...response.data.results, ...prevMessages]);
        setHasMoreMessages(!!response.data.next);
        setPage(nextPage);
      } else {
        setHasMoreMessages(false);
      }
      
    } catch (err) {
      console.error('Ошибка при загрузке истории сообщений:', err);
    } finally {
      setIsLoadingMore(false);
    }
  }, [threadId, api, page, hasMoreMessages, isLoadingMore]);
  
  /**
   * Настройка обработчиков событий WebSocket
   */
  const setupWebSocketHandlers = useCallback(() => {
    // Обработка нового сообщения
    websocketService.addEventListener('new_message', (data) => {
      const message = data.message;
      
      // Проверка, что сообщение относится к текущему треду
      if (message.thread_id === threadId) {
        setMessages(prevMessages => {
          // Проверяем, нет ли уже такого сообщения
          const messageExists = prevMessages.some(msg => msg.id === message.id);
          if (messageExists) return prevMessages;
          
          return [...prevMessages, message];
        });
      }
    });
    
    // Обработка прочтения сообщения
    websocketService.addEventListener('message_read', (data) => {
      if (data.thread_id === threadId) {
        setReadMessages(prev => ({
          ...prev,
          [data.message_id]: true
        }));
      }
    });
    
    // Обработка статуса набора текста
    websocketService.addEventListener('typing', (data) => {
      if (data.thread_id === threadId && data.user_id !== user.id) {
        setTypingUsers(prev => ({
          ...prev,
          [data.user_id]: data.is_typing
        }));
      }
    });
    
    // Обработка отключения WebSocket
    websocketService.addEventListener('onDisconnect', () => {
      setIsConnected(false);
      setIsJoined(false);
    });
    
  }, [threadId, user]);
  
  /**
   * Отправка сообщения
   */
  const handleSendMessage = useCallback((threadId, content) => {
    if (!isConnected) {
      setError('Нет подключения к серверу');
      return;
    }
    
    try {
      websocketService.sendMessage(threadId, content);
    } catch (err) {
      console.error('Ошибка при отправке сообщения:', err);
      setError('Не удалось отправить сообщение');
    }
  }, [isConnected]);
  
  /**
   * Отправка вложения
   */
  const handleSendAttachment = useCallback((threadId, content, attachment) => {
    if (!isConnected) {
      setError('Нет подключения к серверу');
      return;
    }
    
    try {
      websocketService.uploadAttachment(threadId, content, attachment);
    } catch (err) {
      console.error('Ошибка при отправке вложения:', err);
      setError('Не удалось отправить вложение');
    }
  }, [isConnected]);
  
  /**
   * Отправка статуса набора текста
   */
  const handleTyping = useCallback((isTyping) => {
    if (!isConnected || !isJoined) return;
    
    try {
      websocketService.sendTypingStatus(threadId, isTyping);
    } catch (err) {
      console.error('Ошибка при отправке статуса набора:', err);
    }
  }, [isConnected, isJoined, threadId]);
  
  /**
   * Отметка сообщения как прочитанного
   */
  const handleMarkRead = useCallback((messageId) => {
    if (!isConnected || !isJoined) return;
    
    try {
      // Проверяем, не отмечали ли мы сообщение раньше
      if (!readMessages[messageId]) {
        websocketService.markMessageAsRead(threadId, messageId);
      }
    } catch (err) {
      console.error('Ошибка при отметке прочтения:', err);
    }
  }, [isConnected, isJoined, threadId, readMessages]);
  
  // Подключение к чату при монтировании компонента
  useEffect(() => {
    if (!isLoading && threadId && user) {
      initializeChat();
    }
    
    // Отключение от чата при размонтировании
    return () => {
      if (isJoined && threadId) {
        websocketService.leaveThread(threadId);
        setIsJoined(false);
      }
    };
  }, [threadId, user, initializeChat, isJoined]);
  
  // Рендеринг индикатора набора текста
  const renderTypingIndicator = () => {
    const typingUsersCount = Object.values(typingUsers).filter(Boolean).length;
    
    if (typingUsersCount === 0) return null;
    
    return (
      <div className="typing-indicator">
        <span className="typing-dots">
          <span className="dot"></span>
          <span className="dot"></span>
          <span className="dot"></span>
        </span>
        <span className="typing-text">печатает...</span>
      </div>
    );
  };
  
  // Рендеринг информации о заказе (если она предоставлена)
  /**
   * Изменение статуса заказа креатором (с "опубликованный" на "в процессе")
   */
  const handleStartOrder = useCallback(async () => {
    if (!orderInfo || !orderInfo.id) return;
    
    try {
      const response = await api.post(`/api/orders/${orderInfo.id}/start_order/`);
      
      if (response.status === 200) {
        toast.success('Вы начали работу над заказом');
        // Обновляем информацию о заказе
        if (orderInfo.onStatusChange) {
          orderInfo.onStatusChange('in_progress');
        }
      }
    } catch (err) {
      console.error('Ошибка при изменении статуса заказа:', err);
      toast.error(err.response?.data?.error || 'Не удалось изменить статус заказа');
    }
  }, [api, orderInfo]);

  /**
   * Завершение заказа клиентом (с "в процессе" на "завершен")
   */
  const handleCompleteOrder = useCallback(async () => {
    if (!orderInfo || !orderInfo.id) return;
    
    try {
      const response = await api.post(`/api/orders/${orderInfo.id}/complete_order/`);
      
      if (response.status === 200) {
        toast.success('Заказ успешно завершен');
        // Обновляем информацию о заказе
        if (orderInfo.onStatusChange) {
          orderInfo.onStatusChange('completed');
        }
      }
    } catch (err) {
      console.error('Ошибка при завершении заказа:', err);
      toast.error(err.response?.data?.error || 'Не удалось завершить заказ');
    }
  }, [api, orderInfo]);

  // Рендеринг информации о заказе (если она предоставлена)
  const renderOrderInfo = () => {
    if (!orderInfo) return null;
    
    // Определяем, является ли текущий пользователь клиентом или креатором заказа
    const isClient = user && orderInfo.client_id === user.id;
    const isCreator = user && orderInfo.creator_id === user.id;
    
    // Определяем, нужно ли показывать кнопки управления статусом
    const showStartButton = isCreator && orderInfo.status === 'published';
    const showCompleteButton = isClient && orderInfo.status === 'in_progress';
    
    return (
      <div className="chat-order-info">
        <div className="order-title">
          Заказ #{orderInfo.id} - {orderInfo.title}
        </div>
        
        <div className="order-status-controls">
          {orderInfo.status && (
            <div className={`order-status status-${orderInfo.status.toLowerCase()}`}>
              {orderInfo.status_display}
            </div>
          )}
          
          {/* Кнопки управления статусом */}
          <div className="order-status-actions">
            {showStartButton && (
              <Button 
                variant="primary" 
                onClick={handleStartOrder}
                size="sm"
              >
                Начать работу
              </Button>
            )}
            
            {showCompleteButton && (
              <Button 
                variant="success" 
                onClick={handleCompleteOrder}
                size="sm"
              >
                Завершить заказ
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  };
  
  return (
    <div className="chat-window">
      {renderOrderInfo()}
      
      {isLoading ? (
        <div className="chat-loading">
          <div className="spinner"></div>
          <span>Загрузка чата...</span>
        </div>
      ) : error ? (
        <div className="chat-error">
          <p>{error}</p>
          <button 
            type="button" 
            onClick={() => {
              setError(null);
              initializeChat();
            }}
          >
            Повторить
          </button>
        </div>
      ) : (
        <>
          <ChatMessageList
            messages={messages}
            currentUser={user}
            readMessages={readMessages}
            onMarkRead={handleMarkRead}
            isLoadingMore={isLoadingMore}
            hasMore={hasMoreMessages}
            onLoadMore={loadMoreMessages}
          />
          
          {renderTypingIndicator()}
          
          <ChatInput
            onSendMessage={handleSendMessage}
            onSendAttachment={handleSendAttachment}
            onTyping={handleTyping}
            threadId={threadId}
            disabled={!isConnected || !isJoined}
          />
        </>
      )}
    </div>
  );
};

ChatWindow.propTypes = {
  threadId: PropTypes.number.isRequired,
  orderInfo: PropTypes.shape({
    id: PropTypes.number.isRequired,
    title: PropTypes.string.isRequired,
    status: PropTypes.string,
    status_display: PropTypes.string,
    client_id: PropTypes.number,
    creator_id: PropTypes.number,
    onStatusChange: PropTypes.func
  })
};

export default ChatWindow;
