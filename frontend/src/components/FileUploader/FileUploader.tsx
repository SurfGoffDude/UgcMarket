import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { useUploadFileMutation } from '../../api/storageApi';
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
      formData.append('file', file);

      // Обновляем прогресс
      setUploadProgress(prev => ({ ...prev, [fileName]: 0 }));
      
      // Добавляем флаг temporary, если необходимо
      if (temporary) {
        formData.append('temporary', 'true');
      }
      
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
  
  // Настройка dropzone
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: async (acceptedFiles) => {
      // Сбрасываем ошибки при новой загрузке
      setErrors([]);
      
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
            <p>Перетащите файлы сюда или нажмите для выбора</p>
            <p className="file-uploader__hint">
              {allowMultiple 
                ? `Максимум ${maxFiles} файлов, до ${Math.round(maxSize / (1024 * 1024))}МБ каждый` 
                : `До ${Math.round(maxSize / (1024 * 1024))}МБ`}
            </p>
          </div>
        )}
      </div>

      {errors.length > 0 && (
        <div className="file-uploader__errors">
          {errors.map((error, index) => (
            <div key={index} className="file-uploader__error">
              {error}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FileUploader;
