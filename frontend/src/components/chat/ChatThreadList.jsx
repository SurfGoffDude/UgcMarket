import React, { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import { useSelector } from 'react-redux';
import { useApi } from '../../hooks/useApi';
import { formatDistanceToNow } from 'date-fns';
import { ru } from 'date-fns/locale';

/**
 * Компонент списка тредов чата с возможностью выбора активного треда
 */
const ChatThreadList = ({ onSelectThread, activeThreadId }) => {
  const [threads, setThreads] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [unreadCounts, setUnreadCounts] = useState({});
  
  const { user } = useSelector(state => state.auth);
  const api = useApi();
  
  /**
   * Загрузка списка тредов
   */
  const loadThreads = useCallback(async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      setError(null);
      
      // Получение списка тредов с сервера
      const response = await api.get('/api/messaging/threads/');
      
      if (response.data && Array.isArray(response.data)) {
        setThreads(response.data);
        
        // Загрузка информации о непрочитанных сообщениях для каждого треда
        const unreadResponse = await api.get('/api/messaging/threads/unread/');
        
        if (unreadResponse.data) {
          const counts = {};
          unreadResponse.data.forEach(item => {
            counts[item.thread] = item.unread_count;
          });
          setUnreadCounts(counts);
        }
      }
    } catch (err) {
      console.error('Ошибка при загрузке списка тредов:', err);
      setError('Не удалось загрузить список чатов');
    } finally {
      setLoading(false);
    }
  }, [user, api]);
  
  // Загрузка тредов при монтировании компонента
  useEffect(() => {
    loadThreads();
    
    // Периодическое обновление списка тредов
    const intervalId = setInterval(loadThreads, 30000);
    
    return () => clearInterval(intervalId);
  }, [loadThreads]);
  
  /**
   * Форматирование относительного времени
   */
  const formatRelativeTime = (dateString) => {
    try {
      const date = new Date(dateString);
      return formatDistanceToNow(date, { addSuffix: true, locale: ru });
    } catch (err) {
      return dateString;
    }
  };
  
  /**
   * Получение имени участника треда, который не является текущим пользователем
   */
  const getParticipantName = (thread) => {
    if (!thread.participants || !Array.isArray(thread.participants) || !user) {
      return 'Неизвестный участник';
    }
    
    const otherParticipant = thread.participants.find(p => p.id !== user.id);
    return otherParticipant ? otherParticipant.username : 'Неизвестный участник';
  };
  
  /**
   * Обработка выбора треда чата
   */
  const handleThreadClick = (thread) => {
    if (onSelectThread) {
      onSelectThread(thread);
    }
  };

  return (
    <div className="chat-thread-list">
      <h2 className="thread-list-title">Мои чаты</h2>
      
      {loading && threads.length === 0 && (
        <div className="thread-list-loading">
          <div className="spinner"></div>
          <span>Загрузка чатов...</span>
        </div>
      )}
      
      {error && (
        <div className="thread-list-error">
          <p>{error}</p>
          <button onClick={loadThreads}>Повторить</button>
        </div>
      )}
      
      {threads.length === 0 && !loading && !error && (
        <div className="thread-list-empty">
          У вас пока нет активных чатов
        </div>
      )}
      
      <ul className="thread-list">
        {threads.map(thread => (
          <li
            key={thread.id}
            className={`thread-item ${activeThreadId === thread.id ? 'active' : ''} ${unreadCounts[thread.id] ? 'has-unread' : ''}`}
            onClick={() => handleThreadClick(thread)}
          >
            <div className="thread-avatar">
              {/* Аватар можно добавить в будущем */}
              {getParticipantName(thread).charAt(0).toUpperCase()}
            </div>
            
            <div className="thread-content">
              <div className="thread-header">
                <span className="thread-name">{getParticipantName(thread)}</span>
                <span className="thread-time">{formatRelativeTime(thread.last_message_timestamp)}</span>
              </div>
              
              <div className="thread-preview">
                {thread.last_message ? (
                  <span className="message-preview">
                    {thread.last_message.content || (
                      thread.last_message.has_attachment ? '[Вложение]' : ''
                    )}
                  </span>
                ) : (
                  <span className="no-messages">Нет сообщений</span>
                )}
                
                {unreadCounts[thread.id] > 0 && (
                  <span className="unread-badge">{unreadCounts[thread.id]}</span>
                )}
              </div>
            </div>
            
            {thread.order && (
              <div className="thread-order">
                #{thread.order.id}
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
};

ChatThreadList.propTypes = {
  onSelectThread: PropTypes.func.isRequired,
  activeThreadId: PropTypes.number
};

export default ChatThreadList;
