import React, { useState, useEffect } from 'react';
import './FilePreview.css';

interface FilePreviewProps {
  url: string;
  fileName: string;
  fileType: string;
}

/**
 * Компонент для предпросмотра файлов разных типов, включая файлы с подписанными URL.
 * Поддерживает изображения, видео, аудио, PDF и текстовые файлы.
 * 
 * @param url - URL файла (обычный или подписанный)
 * @param fileName - Имя файла для отображения
 * @param fileType - MIME-тип файла (например 'image/jpeg', 'application/pdf')
 */
const FilePreview: React.FC<FilePreviewProps> = ({ url, fileName, fileType }) => {
  const [textContent, setTextContent] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Для текстовых файлов загружаем их содержимое
  useEffect(() => {
    const isTextFile = fileType.startsWith('text/') || 
      ['application/json', 'application/xml', 'application/javascript', 'text/csv'].includes(fileType);
      
    if (isTextFile) {
      setIsLoading(true);
      setError(null);
      
      fetch(url)
        .then(response => {
          if (!response.ok) {
            throw new Error(`HTTP ошибка: ${response.status}`);
          }
          return response.text();
        })
        .then(text => {
          setTextContent(text);
          setIsLoading(false);
        })
        .catch(err => {
          console.error('Ошибка при загрузке текстового файла:', err);
          setError(`Не удалось загрузить содержимое файла: ${err.message}`);
          setIsLoading(false);
        });
    }
  }, [url, fileType]);

  // Определяем тип содержимого для предпросмотра
  const renderPreviewContent = () => {
    if (isLoading) {
      return <div className="file-preview__loading">Загрузка содержимого...</div>;
    }

    if (error) {
      return <div className="file-preview__error">{error}</div>;
    }

    // Предпросмотр изображений
    if (fileType.startsWith('image/')) {
      return (
        <div className="file-preview__image-container">
          <img src={url} alt={fileName} className="file-preview__image" />
        </div>
      );
    }

    // Предпросмотр видео
    if (fileType.startsWith('video/')) {
      return (
        <div className="file-preview__video-container">
          <video controls className="file-preview__video">
            <source src={url} type={fileType} />
            Ваш браузер не поддерживает воспроизведение видео.
          </video>
        </div>
      );
    }

    // Предпросмотр аудио
    if (fileType.startsWith('audio/')) {
      return (
        <div className="file-preview__audio-container">
          <audio controls className="file-preview__audio">
            <source src={url} type={fileType} />
            Ваш браузер не поддерживает воспроизведение аудио.
          </audio>
          <div className="file-preview__audio-name">{fileName}</div>
        </div>
      );
    }

    // Предпросмотр PDF
    if (fileType === 'application/pdf') {
      return (
        <div className="file-preview__pdf-container">
          <object
            data={url}
            type="application/pdf"
            className="file-preview__pdf"
          >
            <p>
              Невозможно отобразить PDF напрямую. 
              <a href={url} target="_blank" rel="noopener noreferrer">
                Скачать PDF
              </a>
            </p>
          </object>
        </div>
      );
    }

    // Предпросмотр текстовых файлов
    if (textContent !== null) {
      return (
        <div className="file-preview__text-container">
          <pre className="file-preview__text">{textContent}</pre>
        </div>
      );
    }

    // Для других типов файлов просто показываем ссылку для скачивания
    return (
      <div className="file-preview__download">
        <p>Предпросмотр для этого типа файлов недоступен</p>
        <a 
          href={url} 
          download={fileName}
          className="file-preview__download-link"
        >
          Скачать {fileName}
        </a>
      </div>
    );
  };

  return (
    <div className="file-preview">
      <div className="file-preview__header">
        <h4 className="file-preview__filename">{fileName}</h4>
        <span className="file-preview__filetype">{fileType}</span>
      </div>
      <div className="file-preview__content">
        {renderPreviewContent()}
      </div>
    </div>
  );
};

export default FilePreview;
