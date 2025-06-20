import React, { useState, useMemo } from 'react';
import { 
  useGetFilesQuery, 
  useDeleteFileMutation,
  useLazyGetSignedUrlQuery,
  type FileMetadata
} from '../../api/storageApi';
// явно указываем полный путь для импорта
import FilePreview from '../../components/FilePreview/FilePreview';
import './FileGallery.css';

interface FileGalleryProps {
  userId?: string;
  fileType?: string;
  refreshInterval?: number;
  onFileSelect?: (file: FileMetadata) => void;
  onFileDelete?: (fileId: number) => void;
  className?: string;
  pageSize?: number;
}

/**
 * Компонент для отображения галереи загруженных файлов с возможностью просмотра, 
 * удаления и получения подписанных URL.
 * 
 * @param userId - ID пользователя для фильтрации файлов (только для админов)
 * @param fileType - Тип файла для фильтрации (например, 'image/', 'application/pdf')
 * @param refreshInterval - Интервал обновления списка файлов в миллисекундах
 * @param onFileSelect - Callback, вызываемый при выборе файла
 * @param onFileDelete - Callback, вызываемый после удаления файла
 * @param className - Дополнительные CSS-классы
 * @param pageSize - Размер страницы для пагинации
 */
export const FileGallery: React.FC<FileGalleryProps> = ({
  userId,
  fileType,
  refreshInterval,
  onFileSelect,
  onFileDelete,
  className = '',
  pageSize = 10
}) => {
  const [page, setPage] = useState(1);
  const [selectedFile, setSelectedFile] = useState<FileMetadata | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  
  // Запрос на получение списка файлов
  const { 
    data: filesData, 
    isLoading, 
    isFetching, 
    error 
  } = useGetFilesQuery(
    { 
      page, 
      file_type: fileType,
      page_size: pageSize
    }, 
    { pollingInterval: refreshInterval }
  );
  
  // Мутация для удаления файла
  const [deleteFile, { isLoading: isDeleting }] = useDeleteFileMutation();
  
  // Хук для получения подписанного URL
  const [getSignedUrl] = useLazyGetSignedUrlQuery();
  
  // Массив файлов или пустой массив, если данные еще не загружены
  const files = useMemo(() => filesData?.results || [], [filesData]);
  
  // Общее количество страниц
  const totalPages = useMemo(() => {
    if (filesData?.count && pageSize) {
      return Math.ceil(filesData.count / pageSize);
    }
    return 1;
  }, [filesData, pageSize]);
  
  // Обработчик для просмотра файла по подписанному URL
  const handleViewFile = async (fileId: number) => {
    try {
      const response = await getSignedUrl({ fileId });
      
      if (response.data) {
        setPreviewUrl(response.data.signed_url);
      }
    } catch (error) {
      console.error('Ошибка при получении подписанного URL:', error);
    }
  };
  
  // Обработчик удаления файла
  const handleDeleteFile = async (fileId: number) => {
    if (window.confirm('Вы действительно хотите удалить этот файл?')) {
      try {
        await deleteFile(fileId);
        if (selectedFile && selectedFile.id === fileId) {
          setSelectedFile(null);
          setPreviewUrl(null);
        }
        if (onFileDelete) onFileDelete(fileId);
      } catch (error) {
        console.error('Ошибка при удалении файла:', error);
      }
    }
  };
  
  // Обработчик выбора файла
  const handleFileSelect = (file: FileMetadata) => {
    setSelectedFile(file);
    if (onFileSelect) {
      onFileSelect(file);
    }
    
    // Для изображений используем обычный URL, для других файлов - получаем подписанный
    if (file.file_type.startsWith('image/')) {
      setPreviewUrl(file.url);
    } else {
      getSignedUrl({ fileId: file.id })
        .unwrap()
        .then((response) => {
          setPreviewUrl(response.signed_url);
        })
        .catch((err) => {
          console.error('Ошибка при получении подписанного URL:', err);
          setPreviewUrl(null);
        });
    }
  };
  
  // Переход на предыдущую страницу
  const handlePrevPage = () => {
    if (page > 1) {
      setPage(page - 1);
    }
  };
  
  // Переход на следующую страницу
  const handleNextPage = () => {
    if (page < totalPages) {
      setPage(page + 1);
    }
  };

  return (
    <div className={`file-gallery ${className}`}>
      <div className="file-gallery__header">
        <h3>Файлы {fileType ? `(${fileType})` : ''}</h3>
        {(isLoading || isFetching) && <div className="file-gallery__loading">Загрузка...</div>}
      </div>
      
      {error ? (
        <div className="file-gallery__error">
          Произошла ошибка при загрузке файлов.
        </div>
      ) : (
        <>
          {files.length === 0 ? (
            <div className="file-gallery__empty">
              {isLoading ? 'Загрузка файлов...' : 'Файлы не найдены.'}
            </div>
          ) : (
            <div className="file-gallery__grid">
              {files.map((file) => (
                <div 
                  key={file.id} 
                  className={`file-gallery__item ${selectedFile?.id === file.id ? 'file-gallery__item--selected' : ''}`}
                  onClick={() => handleFileSelect(file)}
                >
                  <div className="file-gallery__item-content">
                    {file.file_type.startsWith('image/') ? (
                      <img 
                        src={file.thumbnail_url || file.url} 
                        alt={file.file_name} 
                        className="file-gallery__thumbnail"
                      />
                    ) : (
                      <div className="file-gallery__file-icon">
                        {file.file_type.split('/')[1]?.toUpperCase() || 'FILE'}
                      </div>
                    )}
                    <div className="file-gallery__file-name">{file.file_name}</div>
                    <div className="file-gallery__file-size">
                      {(file.file_size / 1024).toFixed(1)} KB
                    </div>
                  </div>
                  <button 
                    className="file-gallery__delete-btn" 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteFile(file.id);
                    }}
                    disabled={isDeleting}
                  >
                    Удалить
                  </button>
                </div>
              ))}
            </div>
          )}
          
          {/* Пагинация */}
          {totalPages > 1 && (
            <div className="file-gallery__pagination">
              <button 
                onClick={handlePrevPage} 
                disabled={page === 1 || isLoading}
                className="file-gallery__pagination-btn"
              >
                &laquo; Предыдущая
              </button>
              <span className="file-gallery__pagination-info">
                Страница {page} из {totalPages}
              </span>
              <button 
                onClick={handleNextPage} 
                disabled={page === totalPages || isLoading}
                className="file-gallery__pagination-btn"
              >
                Следующая &raquo;
              </button>
            </div>
          )}
        </>
      )}
      
      {/* Предпросмотр выбранного файла */}
      {selectedFile && previewUrl && (
        <div className="file-gallery__preview-container">
          <h4>Предпросмотр файла</h4>
          <FilePreview 
            url={previewUrl}
            fileName={selectedFile.file_name}
            fileType={selectedFile.file_type}
          />
        </div>
      )}
    </div>
  );
};

export default FileGallery;
