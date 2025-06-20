import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { formatDistanceToNow } from 'date-fns';
import { ru } from 'date-fns/locale';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFileDownload, faCheck, faCheckDouble } from '@fortawesome/free-solid-svg-icons';

/**
 * Компонент для отображения одного сообщения в чате с поддержкой вложений
 */
const ChatMessage = ({ 
  message, 
  currentUser, 
  onMarkRead, 
  isRead = false,
  highlightUnread = false
}) => {
  const [timeAgo, setTimeAgo] = useState('');
  const isOwnMessage = message.sender.id === currentUser.id;

  // Обновляем относительное время каждую минуту
  useEffect(() => {
    const updateTimeAgo = () => {
      try {
        const createdAt = new Date(message.timestamp);
        setTimeAgo(formatDistanceToNow(createdAt, { addSuffix: true, locale: ru }));
      } catch (error) {
        console.error('Ошибка парсинга даты:', error);
        setTimeAgo('');
      }
    };

    updateTimeAgo();
    const interval = setInterval(updateTimeAgo, 60000);

    return () => clearInterval(interval);
  }, [message.timestamp]);

  // Отметка сообщения как прочитанное, если сообщение не наше и еще не отмечено как прочитанное
  useEffect(() => {
    if (!isOwnMessage && !isRead && onMarkRead) {
      onMarkRead(message.id);
    }
  }, [isOwnMessage, isRead, message.id, onMarkRead]);

  /**
   * Вспомогательная функция для получения имени файла без расширения
   * @param {string} filename - имя файла с расширением
   * @returns {string} - имя файла без расширения
   */
  const getFileNameWithoutExtension = (filename) => {
    return filename.split('.').slice(0, -1).join('.');
  };

  /**
   * Вспомогательная функция для получения расширения файла
   * @param {string} filename - имя файла с расширением
   * @returns {string} - расширение файла
   */
  const getFileExtension = (filename) => {
    return filename.split('.').pop();
  };

  /**
   * Рендеринг вложения сообщения
   * @param {Object} attachment - объект вложения
   * @returns {JSX.Element} - компонент вложения
   */
  const renderAttachment = (attachment) => {
    const { file_type, file_name, file_url } = attachment;
    
    if (file_type.startsWith('image/')) {
      return (
        <div className="message-attachment message-image" key={attachment.id}>
          <a href={file_url} target="_blank" rel="noopener noreferrer">
            <img 
              src={file_url} 
              alt={getFileNameWithoutExtension(file_name)}
              loading="lazy"
            />
          </a>
        </div>
      );
    }
    
    return (
      <div className="message-attachment message-file" key={attachment.id}>
        <a 
          href={file_url} 
          className="file-download-link" 
          target="_blank" 
          rel="noopener noreferrer"
          download={file_name}
        >
          <div className="file-extension">{getFileExtension(file_name).toUpperCase()}</div>
          <div className="file-details">
            <div className="file-name" title={file_name}>
              {file_name}
            </div>
            <div className="file-size">
              {attachment.file_size ? `${Math.round(attachment.file_size / 1024)} КБ` : ''}
            </div>
          </div>
          <div className="download-icon">
            <FontAwesomeIcon icon={faFileDownload} />
          </div>
        </a>
      </div>
    );
  };

  /**
   * Статус прочтения сообщения
   * @returns {JSX.Element|null} - иконка статуса прочтения
   */
  const renderReadStatus = () => {
    if (!isOwnMessage) return null;
    
    return (
      <span className="message-read-status">
        <FontAwesomeIcon 
          icon={isRead ? faCheckDouble : faCheck} 
          className={isRead ? 'read' : ''}
        />
      </span>
    );
  };

  return (
    <div className={`message-container ${isOwnMessage ? 'own-message' : 'other-message'} ${highlightUnread && !isRead && !isOwnMessage ? 'unread-message' : ''}`}>
      {!isOwnMessage && (
        <div className="message-author">
          {message.sender.username}
        </div>
      )}
      
      <div className="message-bubble">
        {message.content && (
          <div className="message-text">{message.content}</div>
        )}
        
        {message.attachments && message.attachments.length > 0 && (
          <div className="message-attachments">
            {message.attachments.map(attachment => renderAttachment(attachment))}
          </div>
        )}
        
        <div className="message-meta">
          <span className="message-time">{timeAgo}</span>
          {renderReadStatus()}
        </div>
      </div>
    </div>
  );
};

ChatMessage.propTypes = {
  message: PropTypes.shape({
    id: PropTypes.number.isRequired,
    thread_id: PropTypes.number.isRequired,
    sender: PropTypes.shape({
      id: PropTypes.number.isRequired,
      username: PropTypes.string.isRequired
    }).isRequired,
    content: PropTypes.string,
    timestamp: PropTypes.string.isRequired,
    attachments: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.number.isRequired,
        file_name: PropTypes.string.isRequired,
        file_type: PropTypes.string.isRequired,
        file_size: PropTypes.number,
        file_url: PropTypes.string.isRequired
      })
    )
  }).isRequired,
  currentUser: PropTypes.shape({
    id: PropTypes.number.isRequired,
    username: PropTypes.string.isRequired
  }).isRequired,
  onMarkRead: PropTypes.func,
  isRead: PropTypes.bool,
  highlightUnread: PropTypes.bool
};

export default ChatMessage;
