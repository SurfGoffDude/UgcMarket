import React, { useState, useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPaperPlane } from '@fortawesome/free-solid-svg-icons';
import AttachmentUploader from './AttachmentUploader';

/**
 * Компонент формы ввода и отправки сообщений чата
 */
const ChatInput = ({ 
  onSendMessage, 
  onSendAttachment, 
  onTyping, 
  threadId, 
  disabled = false,
  placeholder = 'Введите сообщение...' 
}) => {
  const [message, setMessage] = useState('');
  const [attachment, setAttachment] = useState(null);
  const [isTyping, setIsTyping] = useState(false);
  const textareaRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // Авторесайз текстового поля при вводе
  useEffect(() => {
    if (textareaRef.current) {
      // Сохраняем текущую позицию скролла
      const scrollPos = window.pageYOffset;
      
      textareaRef.current.style.height = '0px';
      const scrollHeight = textareaRef.current.scrollHeight;
      
      // Ограничиваем максимальную высоту
      textareaRef.current.style.height = 
        `${Math.min(scrollHeight, 150)}px`;
      
      // Восстанавливаем позицию скролла
      window.scrollTo(0, scrollPos);
    }
  }, [message]);

  // Обработка событий печати для отправки сигналов "typing"
  useEffect(() => {
    if (isTyping) {
      // Если статус не менялся в течение 2 секунд, считаем что пользователь перестал печатать
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      
      typingTimeoutRef.current = setTimeout(() => {
        setIsTyping(false);
        onTyping(false);
      }, 2000);
    }
    
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [isTyping, onTyping]);

  /**
   * Обработчик изменения текста сообщения
   */
  const handleMessageChange = (e) => {
    const value = e.target.value;
    setMessage(value);
    
    // Если пользователь не печатал, отправляем событие начала печати
    if (!isTyping && value.trim().length > 0) {
      setIsTyping(true);
      onTyping(true);
    }
    // Если поле пустое, отправляем событие окончания печати
    else if (isTyping && value.trim().length === 0) {
      setIsTyping(false);
      onTyping(false);
      clearTimeout(typingTimeoutRef.current);
    }
  };

  /**
   * Обработчик нажатия клавиш в текстовом поле
   */
  const handleKeyPress = (e) => {
    // Проверка: Ctrl/Cmd + Enter для отправки сообщения
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      handleSendMessage();
    }
  };

  /**
   * Обработчик отправки сообщения
   */
  const handleSendMessage = () => {
    const trimmedMessage = message.trim();
    
    if (disabled) return;
    
    // Если прикреплено вложение и оно еще не отправлено
    if (attachment && trimmedMessage.length > 0) {
      onSendAttachment(threadId, trimmedMessage, attachment);
      
      // Сброс состояния после отправки
      setMessage('');
      setAttachment(null);
      setIsTyping(false);
      onTyping(false);
      
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      
      // Фокус на текстовое поле после отправки
      textareaRef.current?.focus();
      return;
    }
    
    // Если есть текст сообщения, отправляем только текст
    if (trimmedMessage.length > 0) {
      onSendMessage(threadId, trimmedMessage);
      
      // Сброс состояния после отправки
      setMessage('');
      setIsTyping(false);
      onTyping(false);
      
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      
      // Фокус на текстовое поле после отправки
      textareaRef.current?.focus();
    }
  };

  /**
   * Обработчик выбора вложения
   */
  const handleAttachmentSelect = (attachmentData) => {
    setAttachment(attachmentData);
  };

  /**
   * Обработчик удаления вложения
   */
  const handleAttachmentRemove = () => {
    setAttachment(null);
  };

  return (
    <div className={`chat-input-container ${disabled ? 'disabled' : ''}`}>
      {attachment && (
        <div className="attachment-info">
          <span className="attachment-name">{attachment.filename}</span>
        </div>
      )}
      
      <div className="chat-input-controls">
        <AttachmentUploader
          onAttachmentSelect={handleAttachmentSelect}
          onAttachmentRemove={handleAttachmentRemove}
        />
        
        <textarea
          ref={textareaRef}
          className="chat-input"
          placeholder={placeholder}
          value={message}
          onChange={handleMessageChange}
          onKeyDown={handleKeyPress}
          disabled={disabled}
        />
        
        <button
          type="button"
          className={`send-button ${!message.trim() && !attachment ? 'disabled' : ''}`}
          onClick={handleSendMessage}
          disabled={(!message.trim() && !attachment) || disabled}
          aria-label="Отправить сообщение"
        >
          <FontAwesomeIcon icon={faPaperPlane} />
        </button>
      </div>
      
      <div className="input-help-text">
        Нажмите Ctrl+Enter для отправки
      </div>
    </div>
  );
};

ChatInput.propTypes = {
  onSendMessage: PropTypes.func.isRequired,
  onSendAttachment: PropTypes.func.isRequired,
  onTyping: PropTypes.func.isRequired,
  threadId: PropTypes.number.isRequired,
  disabled: PropTypes.bool,
  placeholder: PropTypes.string
};

export default ChatInput;
