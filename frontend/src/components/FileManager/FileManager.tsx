import React, { useState, useEffect } from 'react';
import { useLazyGetSignedUrlQuery, type FileMetadata, type FileUploadResponse } from '../../api/storageApi';
import FileUploader from '../FileUploader/FileUploader';
import FileGallery from '../FileGallery/FileGallery';
import FilePreview from '../FilePreview/FilePreview';
import './FileManager.css';

interface FileManagerProps {
  acceptedTypes?: Record<string, string[]>; // Типы файлов для загрузки
  maxFileSize?: number; // Максимальный размер файла в байтах
  fileTypeFilter?: string; // Фильтр типов файлов для галереи
  allowMultiple?: boolean; // Разрешить загрузку нескольких файлов
  refreshInterval?: number; // Интервал обновления списка файлов
  className?: string;
}

/**
 * Интегрированный компонент для управления файлами, включающий загрузку,
 * просмотр и получение подписанных URL. Объединяет все другие компоненты для работы с файлами.
 *
 * @param acceptedTypes - Типы файлов, разрешенные для загрузки (формат react-dropzone)
 * @param maxFileSize - Максимальный размер файла в байтах (по умолчанию 10MB)
 * @param fileTypeFilter - Фильтр по типу файлов для галереи
 * @param allowMultiple - Разрешить загрузку нескольких файлов
 * @param refreshInterval - Интервал обновления списка файлов в мс
 * @param className - Дополнительные CSS-классы
 */
export const FileManager: React.FC<FileManagerProps> = ({
  acceptedTypes,
  maxFileSize = 10 * 1024 * 1024, // 10MB по умолчанию
  fileTypeFilter,
  allowMultiple = true,
  refreshInterval = 30000, // Обновлять каждые 30 секунд
  className = '',
}) => {
  const [activeTab, setActiveTab] = useState<'gallery' | 'upload'>('gallery');
  const [selectedFile, setSelectedFile] = useState<FileUploadResponse | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [getSignedUrl] = useLazyGetSignedUrlQuery();
  const [previewExpiresAt, setPreviewExpiresAt] = useState<number | null>(null);

  // Обработчик успешной загрузки файла
  const handleUploadComplete = () => {
    // Переключаемся на галерею после загрузки
    setActiveTab('gallery');
  };

  // Обработчик выбора файла в галерее
  const handleFileSelect = (file: FileUploadResponse) => {
    setSelectedFile(file);
    
    // Для изображений используем обычный URL
    if (file.file_type.startsWith('image/')) {
      setPreviewUrl(file.url);
      setPreviewExpiresAt(null);
    } else {
      // Для других файлов получаем подписанный URL, действительный 1 час
      getSignedUrl({ fileId: file.id, expiresIn: 3600 })
        .unwrap()
        .then((response) => {
          setPreviewUrl(response.signed_url);
          // Вычисляем время истечения как текущее время + 1 час (в секундах)
          const expiresAt = Math.floor(Date.now() / 1000) + 3600;
          setPreviewExpiresAt(expiresAt);
        })
        .catch((err) => {
          console.error('Ошибка при получении подписанного URL:', err);
          setPreviewUrl(null);
          setPreviewExpiresAt(null);
        });
    }
  };

  // Обработчик удаления файла
  const handleFileDelete = () => {
    // Если удален выбранный файл, очищаем текущий предпросмотр
    setSelectedFile(null);
    setPreviewUrl(null);
    setPreviewExpiresAt(null);
  };

  // Функция для форматирования времени истечения срока
  const formatExpiresTime = (timestamp: number) => {
    const date = new Date(timestamp * 1000);
    return date.toLocaleTimeString();
  };

  return (
    <div className={`file-manager ${className}`}>
      <div className="file-manager__header">
        <h2 className="file-manager__title">Управление файлами</h2>
        
        <div className="file-manager__tabs">
          <button 
            className={`file-manager__tab ${activeTab === 'gallery' ? 'file-manager__tab--active' : ''}`} 
            onClick={() => setActiveTab('gallery')}
          >
            Галерея
          </button>
          <button 
            className={`file-manager__tab ${activeTab === 'upload' ? 'file-manager__tab--active' : ''}`}
            onClick={() => setActiveTab('upload')}
          >
            Загрузить
          </button>
        </div>
      </div>

      <div className="file-manager__content">
        {activeTab === 'upload' ? (
          <div className="file-manager__upload-section">
            <FileUploader 
              allowMultiple={allowMultiple}
              maxSize={maxFileSize}
              accept={acceptedTypes}
              onUploadComplete={handleUploadComplete}
            />
          </div>
        ) : (
          <div className="file-manager__gallery-section">
            <FileGallery 
              fileType={fileTypeFilter}
              refreshInterval={refreshInterval}
              onFileSelect={handleFileSelect}
              onFileDelete={handleFileDelete}
            />
          </div>
        )}
      </div>

      {/* Предпросмотр файла */}
      {selectedFile && previewUrl && (
        <div className="file-manager__preview-section">
          <div className="file-manager__preview-header">
            <h3>Предпросмотр файла</h3>
            {previewExpiresAt && (
              <div className="file-manager__preview-expires">
                URL истекает в: {formatExpiresTime(previewExpiresAt)}
              </div>
            )}
          </div>
          
          <FilePreview 
            url={previewUrl} 
            fileName={selectedFile.file_name}
            fileType={selectedFile.file_type}
          />
          
          {!selectedFile.file_type.startsWith('image/') && (
            <div className="file-manager__signed-url-info">
              <p>
                <strong>Этот файл доступен по подписанному URL.</strong>&nbsp;
                Подписанный URL обеспечивает безопасный доступ к файлу на ограниченное время.
              </p>
              <button 
                className="file-manager__refresh-url"
                onClick={() => handleFileSelect(selectedFile)}
              >
                Обновить URL
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default FileManager;
