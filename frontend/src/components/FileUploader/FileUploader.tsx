import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { useUploadFileMutation } from '@/api/storageApi';
import { AlertCircle, FileQuestion, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import './FileUploader.css';

interface FileUploaderProps {
  onUploadComplete?: (fileIds: string[]) => void;
  onSuccess?: (result: any) => void;
  onError?: (error: any) => void;
  allowMultiple?: boolean;
  maxFiles?: number;
  maxSize?: number; // в байтах
  accept?: Record<string, string[]>; // формат для react-dropzone
  temporary?: boolean; // загружать временные файлы
  className?: string;
  title?: string; // Заголовок компонента
  showSupportedFormats?: boolean; // Показывать поддерживаемые форматы
  extraData?: Record<string, string | number>; // Дополнительные поля для отправки (например, portfolio_item)
}

/**
 * Компонент для загрузки файлов с поддержкой drag-n-drop и отображением прогресса.
 * 
 * @param onUploadComplete - Callback, вызываемый после успешной загрузки файлов с массивом ID загруженных файлов
 * @param allowMultiple - Разрешить выбор нескольких файлов
 * @param maxFiles - Максимальное количество файлов для загрузки за раз 
 * @param maxSize - Максимальный размер файла в байтах (по умолчанию 10MB)
 * @param accept - Типы принимаемых файлов в формате react-dropzone
 * @param temporary - Если true, файлы будут загружены как временные
 * @param className - Дополнительные CSS-классы
 * @param title - Заголовок компонента
 * @param showSupportedFormats - Показывать поддерживаемые форматы
 */
export const FileUploader: React.FC<FileUploaderProps> = ({
  onUploadComplete,
  onSuccess,
  onError,
  allowMultiple = false,
  maxFiles = 5,
  maxSize = 10 * 1024 * 1024, // 10MB по умолчанию
  accept,
  temporary = false,
  className = '',
  title = 'Загрузка файлов',
  showSupportedFormats = true,
  extraData = {},
}) => {
  const [uploadFile, { isLoading }] = useUploadFileMutation();
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const [errors, setErrors] = useState<string[]>([]);
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([]);
  
  // Сбросить состояние при изменении temporary
  React.useEffect(() => {
    setUploadProgress({});
    setErrors([]);
    setUploadedFiles([]);
  }, [temporary]);

  // Обработчик для загрузки файла
  const handleUpload = useCallback(async (file: File) => {
    try {
      const fileName = file.name;
      // Создаем FormData для отправки файла
      const formData = new FormData();
      formData.append('image', file); // Используем 'image' вместо 'file' согласно сериализатору PortfolioImage

      // Обновляем прогресс
      setUploadProgress(prev => ({ ...prev, [fileName]: 0 }));
      
      // Добавляем флаг temporary, если необходимо
      if (temporary) {
        formData.append('temporary', 'true');
      }
      
      // Добавляем дополнительные поля из extraData
      Object.entries(extraData).forEach(([key, value]) => {
        formData.append(key, value.toString());
      });
      
      // Отправляем файл на сервер
      const result = await uploadFile(formData).unwrap();
      
      // Обновляем прогресс до 100%
      setUploadProgress(prev => ({ ...prev, [fileName]: 100 }));
      
      // Добавляем результат в список загруженных файлов
      setUploadedFiles(prev => [...prev, result.id.toString()]);
      
      // Вызываем коллбэк onSuccess, если он есть
      if (onSuccess) {
        onSuccess(result);
      }
      
      return result.id.toString();
    } catch (error: any) {

      setErrors(prev => [...prev, `Ошибка при загрузке файла ${file.name}: ${error.message || 'Неизвестная ошибка'}`]);
      
      // Вызываем коллбэк onError, если он есть
      if (onError) {
        onError(error);
      }
      
      return null;
    }
  }, [uploadFile, temporary, onSuccess, onError]);
  
  // Форматирует размер файла в читаемый формат
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };
  
  // Форматирует список поддерживаемых форматов файлов
  const formatAcceptedFileTypes = (): string => {
    if (!accept) return 'Все файлы';
    
    const extensions: string[] = [];
    
    Object.entries(accept).forEach(([mime, exts]) => {
      extensions.push(...exts);
    });
    
    return extensions.join(', ');
  };

  // Настройка dropzone
  const { getRootProps, getInputProps, isDragActive, fileRejections } = useDropzone({
    onDrop: async (acceptedFiles, rejectedFiles) => {
      // Сбрасываем ошибки при новой загрузке
      setErrors([]);
      
      // Обработка отклоненных файлов
      if (rejectedFiles.length > 0) {
        const errorMessages: string[] = [];
        rejectedFiles.forEach((file) => {
          file.errors.forEach((err) => {
            if (err.code === 'file-too-large') {
              errorMessages.push(`Файл "${file.file.name}" превышает максимальный размер ${formatFileSize(maxSize)}`);
            } else if (err.code === 'file-invalid-type') {
              errorMessages.push(`Файл "${file.file.name}" имеет неподдерживаемый формат`);
            } else {
              errorMessages.push(`Ошибка загрузки "${file.file.name}": ${err.message}`);
            }
          });
        });
        setErrors(errorMessages);
        
        // Если есть коллбэк onError, вызываем его
        if (onError) {
          onError({ message: errorMessages.join('\n') });
        }
      }
      
      // Ограничиваем количество файлов
      const filesToUpload = acceptedFiles.slice(0, maxFiles);
      
      // Загружаем файлы и получаем массив ID
      const uploadPromises = filesToUpload.map(handleUpload);
      const fileIds = (await Promise.all(uploadPromises)).filter(Boolean) as string[];
      
      // Вызываем callback, если он предоставлен
      if (onUploadComplete && fileIds.length > 0) {
        onUploadComplete(fileIds);
      }
    },
    multiple: allowMultiple,
    maxFiles: maxFiles,
    maxSize: maxSize,
    accept: accept,
    disabled: isLoading,
  });

  return (
    <div className={`file-uploader ${className}`}>
      <div className="file-uploader__header">
        <h3 className="file-uploader__title">{title}</h3>
        {showSupportedFormats && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="sm" className="file-uploader__info-button">
                  <FileQuestion className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent className="file-uploader__tooltip-content" side="top">
                <div className="file-uploader__info-content">
                  <p><strong>Поддерживаемые форматы:</strong> {formatAcceptedFileTypes()}</p>
                  <p><strong>Максимальный размер:</strong> {formatFileSize(maxSize)}</p>
                  <p><strong>Максимум файлов:</strong> {maxFiles}</p>
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>
      
      <div 
        {...getRootProps()} 
        className={`file-uploader__dropzone ${isDragActive ? 'file-uploader__dropzone--active' : ''} ${isLoading ? 'file-uploader__dropzone--disabled' : ''}`}
      >
        <input {...getInputProps()} />
        {isLoading ? (
          <div className="file-uploader__loading">
            <p>Загрузка файлов...</p>
            {Object.entries(uploadProgress).map(([fileName, progress]) => (
              <div key={fileName} className="file-uploader__progress-item">
                <div className="file-uploader__progress-filename">{fileName}</div>
                <div className="file-uploader__progress-bar">
                  <div 
                    className="file-uploader__progress-fill" 
                    style={{ width: `${progress}%` }} 
                  />
                </div>
                <div className="file-uploader__progress-percent">{progress}%</div>
              </div>
            ))}
          </div>
        ) : (
          <div className="file-uploader__content">
            <Upload className="h-12 w-12 text-muted-foreground mb-2" />
            {isDragActive ? (
              <p>Отпустите файлы здесь...</p>
            ) : (
              <>
                <p>Перетащите файлы сюда или кликните для выбора</p>
                <p className="file-uploader__hint">Максимум {maxFiles} файл(ов), до {formatFileSize(maxSize)} каждый</p>
                {accept && <p className="file-uploader__formats">Форматы: {formatAcceptedFileTypes()}</p>}
              </>
            )}
          </div>
        )}
      </div>
      
      {errors.length > 0 && (
        <div className="file-uploader__errors">
          {errors.map((error, index) => (
            <div key={index} className="file-uploader__error">
              <AlertCircle className="h-4 w-4 mr-1" />
              {error}
            </div>
          ))}
        </div>
      )}
      
      {fileRejections.length > 0 && errors.length === 0 && (
        <div className="file-uploader__errors">
          {fileRejections.map(({ file, errors }) => (
            <div key={file.name} className="file-uploader__error">
              <AlertCircle className="h-4 w-4 mr-1" />
              {errors.map(e => `${file.name}: ${e.message}`).join(', ')}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FileUploader;
