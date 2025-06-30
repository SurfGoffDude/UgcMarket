/**
 * Общие типы данных для использования в приложении
 * 
 * Содержит базовые интерфейсы и типы, используемые в различных
 * модулях приложения.
 */

/**
 * Загруженный файл
 */
export interface UploadedFile {
  id: number;
  name: string;
  file: string; // URL к файлу
  url?: string; // Алиас для поля file для совместимости с интерфейсом
  size: number;
  file_type: string;
  content_type: string;
  uploaded_at: string;
  uploaded_by?: number; // ID пользователя
}

/**
 * Пагинированный ответ API
 */
export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

/**
 * Общий интерфейс для ответов API с ошибками
 */
export interface ApiError {
  status: number;
  message: string;
  errors?: Record<string, string[]>;
}
