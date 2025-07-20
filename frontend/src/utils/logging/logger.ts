/**
 * Централизованная система логирования для UgcMarket frontend.
 * Создает иерархическую структуру логов: дата/пользователь/frontend/компонент.json
 */

export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARNING = 'WARNING',
  ERROR = 'ERROR',
  CRITICAL = 'CRITICAL'
}

export enum ErrorCode {
  // Аутентификация
  AUTH_LOGIN_FAILED = 'AUTH_001',
  AUTH_LOGOUT_FAILED = 'AUTH_002',
  AUTH_TOKEN_EXPIRED = 'AUTH_003',
  AUTH_PERMISSION_DENIED = 'AUTH_004',
  
  // API запросы
  API_REQUEST_FAILED = 'API_001',
  API_RESPONSE_ERROR = 'API_002',
  API_NETWORK_ERROR = 'API_003',
  API_TIMEOUT = 'API_004',
  
  // Пользовательский интерфейс
  UI_FORM_VALIDATION_ERROR = 'UI_001',
  UI_COMPONENT_ERROR = 'UI_002',
  UI_NAVIGATION_ERROR = 'UI_003',
  
  // Данные
  DATA_PARSING_ERROR = 'DATA_001',
  DATA_VALIDATION_ERROR = 'DATA_002',
  DATA_STORAGE_ERROR = 'DATA_003',
  
  // Файлы
  FILE_UPLOAD_ERROR = 'FILE_001',
  FILE_SIZE_ERROR = 'FILE_002',
  FILE_TYPE_ERROR = 'FILE_003',
  
  // Система
  UNKNOWN_ERROR = 'SYS_001',
  SUCCESS = 'SUCCESS'
}

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  component: string;
  message: string;
  error_code: ErrorCode;
  user_id: string;
  extra_data: Record<string, any>;
  url?: string;
  user_agent?: string;
}

class UgcLogger {
  private static instance: UgcLogger;
  private baseEndpoint: string;

  private constructor() {
    // Используем window.location для определения базового URL API
    this.baseEndpoint = window.location.origin.includes('localhost') 
      ? 'http://localhost:8000' 
      : window.location.origin;
  }

  public static getInstance(): UgcLogger {
    if (!UgcLogger.instance) {
      UgcLogger.instance = new UgcLogger();
    }
    return UgcLogger.instance;
  }

  private getUserId(): string {
    try {
      const user = localStorage.getItem('user');
      if (user) {
        const userData = JSON.parse(user);
        return userData.id?.toString() || 'anonymous';
      }
      return 'anonymous';
    } catch {
      return 'anonymous';
    }
  }

  private createLogEntry(
    level: LogLevel,
    component: string,
    message: string,
    errorCode: ErrorCode = ErrorCode.SUCCESS,
    extraData: Record<string, any> = {}
  ): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      level,
      component,
      message,
      error_code: errorCode,
      user_id: this.getUserId(),
      extra_data: extraData,
      url: window.location.href,
      user_agent: navigator.userAgent
    };
  }

  private async sendLogToBackend(logEntry: LogEntry): Promise<void> {
    try {
      // Отправляем лог на backend для сохранения в файловую систему
      const response = await fetch(`${this.baseEndpoint}/api/logs/frontend/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token') || localStorage.getItem('authToken')}`
        },
        body: JSON.stringify(logEntry)
      });

      if (!response.ok) {
        // Fallback: сохраняем в localStorage если backend недоступен
        this.saveToLocalStorage(logEntry);
      }
    } catch (error) {
      // Fallback: сохраняем в localStorage
      this.saveToLocalStorage(logEntry);
    }
  }

  private saveToLocalStorage(logEntry: LogEntry): void {
    try {
      const key = `ugc_logs_${new Date().toISOString().split('T')[0]}`;
      const existingLogs = JSON.parse(localStorage.getItem(key) || '[]');
      existingLogs.push(logEntry);
      
      // Ограничиваем количество логов в localStorage (последние 100)
      if (existingLogs.length > 100) {
        existingLogs.splice(0, existingLogs.length - 100);
      }
      
      localStorage.setItem(key, JSON.stringify(existingLogs));
    } catch (error) {
      // Если даже localStorage не работает, выводим в консоль как последний fallback
      console.error('Failed to save log:', logEntry, error);
    }
  }

  public async log(
    level: LogLevel,
    component: string,
    message: string,
    errorCode: ErrorCode = ErrorCode.SUCCESS,
    extraData: Record<string, any> = {}
  ): Promise<void> {
    const logEntry = this.createLogEntry(level, component, message, errorCode, extraData);
    await this.sendLogToBackend(logEntry);
  }

  // Удобные методы для разных уровней логирования
  public async debug(component: string, message: string, extraData: Record<string, any> = {}): Promise<void> {
    await this.log(LogLevel.DEBUG, component, message, ErrorCode.SUCCESS, extraData);
  }

  public async info(component: string, message: string, extraData: Record<string, any> = {}): Promise<void> {
    await this.log(LogLevel.INFO, component, message, ErrorCode.SUCCESS, extraData);
  }

  public async warning(
    component: string, 
    message: string, 
    errorCode: ErrorCode = ErrorCode.UNKNOWN_ERROR,
    extraData: Record<string, any> = {}
  ): Promise<void> {
    await this.log(LogLevel.WARNING, component, message, errorCode, extraData);
  }

  public async error(
    component: string, 
    message: string, 
    errorCode: ErrorCode = ErrorCode.UNKNOWN_ERROR,
    extraData: Record<string, any> = {}
  ): Promise<void> {
    await this.log(LogLevel.ERROR, component, message, errorCode, extraData);
  }

  public async critical(
    component: string, 
    message: string, 
    errorCode: ErrorCode = ErrorCode.UNKNOWN_ERROR,
    extraData: Record<string, any> = {}
  ): Promise<void> {
    await this.log(LogLevel.CRITICAL, component, message, errorCode, extraData);
  }

  // Специальные методы для логирования пользовательских действий
  public async logUserAction(
    action: string,
    component: string,
    success: boolean = true,
    extraData: Record<string, any> = {}
  ): Promise<void> {
    const level = success ? LogLevel.INFO : LogLevel.ERROR;
    const errorCode = success ? ErrorCode.SUCCESS : ErrorCode.UNKNOWN_ERROR;
    const message = `Пользователь выполнил действие: ${action}`;
    
    await this.log(level, component, message, errorCode, extraData);
  }

  public async logApiCall(
    endpoint: string,
    method: string,
    success: boolean,
    responseStatus?: number,
    extraData: Record<string, any> = {}
  ): Promise<void> {
    const level = success ? LogLevel.INFO : LogLevel.ERROR;
    const errorCode = success ? ErrorCode.SUCCESS : ErrorCode.API_REQUEST_FAILED;
    const message = `API вызов: ${method} ${endpoint}`;
    
    const logData = {
      ...extraData,
      endpoint,
      method,
      response_status: responseStatus
    };
    
    await this.log(level, 'api_service', message, errorCode, logData);
  }

  public async logFormSubmission(
    formName: string,
    success: boolean,
    validationErrors?: Record<string, string[]>,
    extraData: Record<string, any> = {}
  ): Promise<void> {
    const level = success ? LogLevel.INFO : LogLevel.ERROR;
    const errorCode = success ? ErrorCode.SUCCESS : ErrorCode.UI_FORM_VALIDATION_ERROR;
    const message = `Отправка формы: ${formName}`;
    
    const logData = {
      ...extraData,
      form_name: formName,
      validation_errors: validationErrors
    };
    
    await this.log(level, 'forms', message, errorCode, logData);
  }

  // Метод для отправки накопленных логов из localStorage на backend
  public async flushLocalLogs(): Promise<void> {
    const today = new Date().toISOString().split('T')[0];
    const key = `ugc_logs_${today}`;
    
    try {
      const logs = localStorage.getItem(key);
      if (logs) {
        const logEntries = JSON.parse(logs);
        
        for (const logEntry of logEntries) {
          await this.sendLogToBackend(logEntry);
        }
        
        // Очищаем localStorage после успешной отправки
        localStorage.removeItem(key);
      }
    } catch (error) {
      console.error('Failed to flush local logs:', error);
    }
  }
}

// Глобальный экземпляр логгера
export const logger = UgcLogger.getInstance();

// Удобные функции для быстрого использования
export const logDebug = (component: string, message: string, extraData: Record<string, any> = {}) => {
  return logger.debug(component, message, extraData);
};

export const logInfo = (component: string, message: string, extraData: Record<string, any> = {}) => {
  return logger.info(component, message, extraData);
};

export const logWarning = (
  component: string, 
  message: string, 
  errorCode: ErrorCode = ErrorCode.UNKNOWN_ERROR,
  extraData: Record<string, any> = {}
) => {
  return logger.warning(component, message, errorCode, extraData);
};

export const logError = (
  component: string, 
  message: string, 
  errorCode: ErrorCode = ErrorCode.UNKNOWN_ERROR,
  extraData: Record<string, any> = {}
) => {
  return logger.error(component, message, errorCode, extraData);
};

export const logCritical = (
  component: string, 
  message: string, 
  errorCode: ErrorCode = ErrorCode.UNKNOWN_ERROR,
  extraData: Record<string, any> = {}
) => {
  return logger.critical(component, message, errorCode, extraData);
};

export const logUserAction = (
  action: string,
  component: string,
  success: boolean = true,
  extraData: Record<string, any> = {}
) => {
  return logger.logUserAction(action, component, success, extraData);
};

export const logApiCall = (
  endpoint: string,
  method: string,
  success: boolean,
  responseStatus?: number,
  extraData: Record<string, any> = {}
) => {
  return logger.logApiCall(endpoint, method, success, responseStatus, extraData);
};

export const logFormSubmission = (
  formName: string,
  success: boolean,
  validationErrors?: Record<string, string[]>,
  extraData: Record<string, any> = {}
) => {
  return logger.logFormSubmission(formName, success, validationErrors, extraData);
};