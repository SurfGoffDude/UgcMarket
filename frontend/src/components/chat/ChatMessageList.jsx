import React, { useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import ChatMessage from './ChatMessage';

/**
 * Компонент для отображения списка сообщений чата с автопрокруткой
 */
const ChatMessageList = ({ 
  messages, 
  currentUser, 
  readMessages = {}, 
  onMarkRead,
  isLoadingMore = false,
  hasMore = false,
  onLoadMore
}) => {
  const messagesEndRef = useRef(null);
  const containerRef = useRef(null);
  const prevMessagesLengthRef = useRef(0);
  
  // Автопрокрутка вниз при добавлении новых сообщений
  useEffect(() => {
    // Если количество сообщений увеличилось, прокручиваем вниз
    if (messages.length > prevMessagesLengthRef.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
    prevMessagesLengthRef.current = messages.length;
  }, [messages]);

  // Обработчик прокрутки для загрузки старых сообщений
  const handleScroll = (e) => {
    if (!hasMore || isLoadingMore) return;
    
    const container = e.currentTarget;
    // Если прокрутили вверх до определенного порога, загружаем старые сообщения
    if (container.scrollTop < 150) {
      onLoadMore();
    }
  };
  
  // Проверка, прочитано ли сообщение
  const isMessageRead = (messageId) => {
    return readMessages[messageId] || false;
  };
  
  // Сортировка сообщений по времени
  const sortedMessages = [...messages].sort(
    (a, b) => new Date(a.timestamp) - new Date(b.timestamp)
  );
  
  return (
    <div 
      className="chat-message-list-container" 
      ref={containerRef}
      onScroll={hasMore ? handleScroll : undefined}
    >
      {isLoadingMore && (
        <div className="loading-messages">
          <div className="spinner"></div>
          <span>Загрузка сообщений...</span>
        </div>
      )}
      
      <div className="chat-message-list">
        {sortedMessages.map((message) => (
          <ChatMessage
            key={message.id}
            message={message}
            currentUser={currentUser}
            isRead={isMessageRead(message.id)}
            onMarkRead={onMarkRead}
          />
        ))}
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
};

ChatMessageList.propTypes = {
  messages: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.number.isRequired,
      thread_id: PropTypes.number.isRequired,
      sender: PropTypes.shape({
        id: PropTypes.number.isRequired,
        username: PropTypes.string.isRequired
      }).isRequired,
      content: PropTypes.string,
      timestamp: PropTypes.string.isRequired,
      attachments: PropTypes.array
    })
  ).isRequired,
  currentUser: PropTypes.shape({
    id: PropTypes.number.isRequired,
    username: PropTypes.string.isRequired
  }).isRequired,
  readMessages: PropTypes.object,
  onMarkRead: PropTypes.func,
  isLoadingMore: PropTypes.bool,
  hasMore: PropTypes.bool,
  onLoadMore: PropTypes.func
};

export default ChatMessageList;
