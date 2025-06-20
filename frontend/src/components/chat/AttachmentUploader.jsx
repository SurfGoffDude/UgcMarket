import React, { useState, useRef } from 'react';
import PropTypes from 'prop-types';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPaperclip, faTimes, faFile, faFileImage, faFileAudio, faFileVideo, faFilePdf } from '@fortawesome/free-solid-svg-icons';

/**
 * Компонент для загрузки и предпросмотра вложений в чате
 */
const AttachmentUploader = ({ onAttachmentSelect, onAttachmentRemove }) => {
  const [attachment, setAttachment] = useState(null);
  const [preview, setPreview] = useState(null);
  const fileInputRef = useRef(null);

  /**
   * Определяет иконку для файла на основе его MIME-типа
   * @param {string} fileType - MIME-тип файла
   * @returns {object} - иконка FontAwesome
   */
  const getFileIcon = (fileType) => {
    if (fileType.startsWith('image/')) return faFileImage;
    if (fileType.startsWith('audio/')) return faFileAudio;
    if (fileType.startsWith('video/')) return faFileVideo;
    if (fileType === 'application/pdf') return faFilePdf;
    return faFile;
  };

  /**
   * Конвертирует файл в формат base64
   * @param {File} file - объект файла
   * @returns {Promise<string>} - Promise с данными в формате base64
   */
  const convertFileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
      reader.readAsDataURL(file);
    });
  };

  /**
   * Обработчик выбора файла
   * @param {Event} e - событие выбора файла
   */
  const handleFileChange = async (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      try {
        // Преобразование в base64
        const fileData = await convertFileToBase64(file);
        
        // Создание объекта вложения
        const newAttachment = {
          file_data: fileData,
          filename: file.name,
          fileType: file.type,
          fileSize: file.size
        };
        
        // Создание превью для изображений
        let previewUrl = null;
        if (file.type.startsWith('image/')) {
          previewUrl = URL.createObjectURL(file);
        }
        
        setAttachment(newAttachment);
        setPreview(previewUrl);
        
        // Вызов внешнего обработчика
        onAttachmentSelect(newAttachment);
      } catch (error) {
        console.error('Ошибка при обработке файла:', error);
        alert('Не удалось обработать файл. Пожалуйста, попробуйте другой.');
      }
    }
  };

  /**
   * Обработчик удаления вложения
   */
  const handleRemoveAttachment = () => {
    if (preview) {
      URL.revokeObjectURL(preview);
    }
    
    setAttachment(null);
    setPreview(null);
    
    // Сброс input файла
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    
    // Вызов внешнего обработчика
    onAttachmentRemove();
  };

  /**
   * Открытие диалога выбора файла
   */
  const triggerFileInput = () => {
    fileInputRef.current.click();
  };

  return (
    <div className="attachment-uploader">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        style={{ display: 'none' }}
        accept="image/*, application/pdf, audio/*, video/*, text/plain, application/msword, application/vnd.openxmlformats-officedocument.wordprocessingml.document"
      />
      
      {!attachment ? (
        <button 
          type="button" 
          className="attachment-btn" 
          onClick={triggerFileInput}
          aria-label="Прикрепить файл"
        >
          <FontAwesomeIcon icon={faPaperclip} />
        </button>
      ) : (
        <div className="attachment-preview">
          {preview ? (
            <div className="image-preview">
              <img src={preview} alt={attachment.filename} />
              <button 
                type="button" 
                className="remove-btn" 
                onClick={handleRemoveAttachment}
                aria-label="Удалить вложение"
              >
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>
          ) : (
            <div className="file-preview">
              <FontAwesomeIcon icon={getFileIcon(attachment.fileType)} />
              <span className="file-name">{attachment.filename}</span>
              <button 
                type="button" 
                className="remove-btn" 
                onClick={handleRemoveAttachment}
                aria-label="Удалить вложение"
              >
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

AttachmentUploader.propTypes = {
  onAttachmentSelect: PropTypes.func.isRequired,
  onAttachmentRemove: PropTypes.func.isRequired
};

export default AttachmentUploader;
