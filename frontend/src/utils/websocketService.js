/**
 * WebSocketService - сервис для работы с WebSocket соединением в чате
 * Обеспечивает управление подключением, переподключениями, отправкой и получением сообщений
 */

class WebSocketService {
  constructor() {
    this.socketRef = null;
    this.callbacks = {};
    this.connected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectTimeout = null;
    this.url = null;
    this.authToken = null;
  }

  /**
   * Инициализация WebSocket соединения
   * @param {string} authToken - JWT токен авторизации
   * @param {string} wsUrl - базовый URL для WebSocket (без параметров)
   * @returns {Promise} Промис, который резолвится при успешном подключении
   */
  connect(authToken, wsUrl = null) {
    return new Promise((resolve, reject) => {
      // Сохраняем токен для переподключения
      this.authToken = authToken;
      
      // Используем предоставленный URL или по умолчанию
      this.url = wsUrl || `${window.location.protocol === 'https:' ? 'wss' : 'ws'}://${window.location.host}/ws/chat/`;

      // Добавляем токен авторизации
      const connectionUrl = `${this.url}?token=${authToken}`;
      
      // Закрываем существующее соединение, если есть
      if (this.socketRef) {
        this.socketRef.close();
      }
      
      // Создаем новое соединение
      this.socketRef = new WebSocket(connectionUrl);
      
      // Настраиваем обработчики событий
      this.socketRef.onopen = () => {
        console.log('WebSocket соединение установлено');
        this.connected = true;
        this.reconnectAttempts = 0;
        resolve();
      };
      
      this.socketRef.onclose = (e) => {
        console.log('WebSocket соединение закрыто (код:', e.code, ')');
        this.connected = false;
        
        // Пытаемся переподключиться только при неожиданном закрытии соединения
        if (!e.wasClean && this.reconnectAttempts < this.maxReconnectAttempts) {
          this.attemptReconnect();
        }

        // Вызываем обработчик при отключении
        if (this.callbacks.onDisconnect) {
          this.callbacks.onDisconnect(e);
        }
      };
      
      this.socketRef.onerror = (err) => {
        console.error('WebSocket ошибка:', err);
        reject(err);
      };
      
      this.socketRef.onmessage = (e) => {
        this.handleMessage(e.data);
      };
    });
  }

  /**
   * Попытка переподключения при разрыве соединения
   */
  attemptReconnect() {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }

    this.reconnectAttempts += 1;
    const delay = Math.min(5000 * Math.pow(2, this.reconnectAttempts - 1), 60000);
    
    console.log(`Попытка переподключения ${this.reconnectAttempts}/${this.maxReconnectAttempts} через ${delay}мс`);
    
    this.reconnectTimeout = setTimeout(() => {
      if (this.authToken) {
        this.connect(this.authToken, this.url)
          .catch(() => console.log('Ошибка при попытке переподключения'));
      }
    }, delay);
  }
  
  /**
   * Обработка входящих сообщений
   * @param {string} data - данные в формате JSON
   */
  handleMessage(data) {
    const parsedData = JSON.parse(data);
    const messageType = parsedData.type;
    
    // Вызов соответствующего обработчика по типу сообщения
    if (this.callbacks[messageType]) {
      this.callbacks[messageType](parsedData);
    }
    
    // Дополнительно вызываем общий обработчик для всех сообщений
    if (this.callbacks.onMessage) {
      this.callbacks.onMessage(parsedData);
    }
  }
  
  /**
   * Отправка команды на сервер через WebSocket
   * @param {string} command - имя команды
   * @param {Object} data - данные команды
   */
  sendCommand(command, data) {
    if (!this.connected) {
      console.error('Нельзя отправить команду: WebSocket не подключен');
      throw new Error('Соединение не установлено');
    }
    
    const message = {
      command,
      data
    };
    
    this.socketRef.send(JSON.stringify(message));
  }
  
  /**
   * Присоединение к треду чата
   * @param {number} threadId - идентификатор треда
   */
  joinThread(threadId) {
    this.sendCommand('join_thread', { thread_id: threadId });
  }
  
  /**
   * Выход из треда чата
   * @param {number} threadId - идентификатор треда
   */
  leaveThread(threadId) {
    this.sendCommand('leave_thread', { thread_id: threadId });
  }
  
  /**
   * Отправка сообщения в тред
   * @param {number} threadId - идентификатор треда
   * @param {string} content - текст сообщения
   */
  sendMessage(threadId, content) {
    this.sendCommand('new_message', {
      thread_id: threadId,
      content
    });
  }
  
  /**
   * Загрузка вложения с сообщением
   * @param {number} threadId - идентификатор треда
   * @param {string} content - текст сообщения
   * @param {Object} attachment - объект вложения {file_data, filename}
   */
  uploadAttachment(threadId, content, attachment) {
    this.sendCommand('upload_attachment', {
      thread_id: threadId,
      content,
      attachment
    });
  }
  
  /**
   * Отправка статуса о наборе текста
   * @param {number} threadId - идентификатор треда
   * @param {boolean} isTyping - индикатор печати
   */
  sendTypingStatus(threadId, isTyping) {
    this.sendCommand('typing', {
      thread_id: threadId,
      is_typing: isTyping
    });
  }
  
  /**
   * Отметить сообщение как прочитанное
   * @param {number} threadId - идентификатор треда
   * @param {number} messageId - идентификатор сообщения
   */
  markMessageAsRead(threadId, messageId) {
    this.sendCommand('mark_read', {
      thread_id: threadId,
      message_id: messageId
    });
  }
  
  /**
   * Регистрация обработчика для определенного типа сообщения
   * @param {string} messageType - тип сообщения или имя события
   * @param {Function} callback - функция обработчик
   */
  addEventListener(messageType, callback) {
    this.callbacks[messageType] = callback;
  }
  
  /**
   * Удаление обработчика для определенного типа сообщения
   * @param {string} messageType - тип сообщения или имя события
   */
  removeEventListener(messageType) {
    delete this.callbacks[messageType];
  }
  
  /**
   * Закрытие WebSocket соединения
   */
  disconnect() {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    
    if (this.socketRef) {
      this.socketRef.close();
      this.socketRef = null;
      this.connected = false;
    }
  }
  
  /**
   * Проверка активности соединения
   * @returns {boolean} - состояние соединения
   */
  isConnected() {
    return this.connected && this.socketRef && this.socketRef.readyState === WebSocket.OPEN;
  }
}

// Экспорт синглтона сервиса
export default new WebSocketService();
