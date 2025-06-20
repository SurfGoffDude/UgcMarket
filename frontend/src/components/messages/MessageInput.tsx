/**
 * Компонент ввода сообщения (MessageInput)
 * 
 * Позволяет писать и отправлять новые сообщения,
 * а также прикреплять файлы к сообщению.
 */

import React, { useState, useRef } from 'react';
import { Button, Textarea } from '@/components/ui';
import { Send, Paperclip } from 'lucide-react';
import { UploadedFile } from '@/types';
import api from '@/lib/api';
import { useToast } from '@/components/ui/use-toast';

interface MessageInputProps {
  threadId: number;
  onSendMessage: (content: string, fileIds: number[]) => Promise<void>;
  disabled?: boolean;
}

const MessageInput: React.FC<MessageInputProps> = ({ threadId, onSendMessage, disabled = false }) => {
  const [message, setMessage] = useState('');
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Обработка нажатия Enter (для отправки сообщения)
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Отправка сообщения
  const handleSendMessage = async () => {
    if ((!message.trim() && files.length === 0) || disabled) return;

    try {
      const fileIds = files.map(file => file.id);
      await onSendMessage(message, fileIds);
      setMessage('');
      setFiles([]);
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось отправить сообщение",
        variant: "destructive",
      });
    }
  };

  // Открытие окна выбора файла
  const handleAttachClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // Загрузка файла
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (!selectedFiles || selectedFiles.length === 0) return;
    
    setUploading(true);
    
    try {
      const newFiles: UploadedFile[] = [];
      
      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i];
        // Проверка размера файла (макс. 10MB)
        if (file.size > 10 * 1024 * 1024) {
          toast({
            title: "Файл слишком большой",
            description: `${file.name} превышает максимальный размер 10MB`,
            variant: "destructive",
          });
          continue;
        }
        
        const uploadedFile = await api.uploadFile(file, 'message');
        newFiles.push(uploadedFile);
      }
      
      setFiles(prev => [...prev, ...newFiles]);
      
      // Очищаем input, чтобы можно было загрузить тот же файл снова
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      
    } catch (error) {
      toast({
        title: "Ошибка загрузки",
        description: "Не удалось загрузить файл",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  // Удаление загруженного файла
  const handleRemoveFile = (id: number) => {
    setFiles(prev => prev.filter(file => file.id !== id));
  };

  return (
    <div className="p-3 border-t">
      {/* Предпросмотр загруженных файлов */}
      {files.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2">
          {files.map((file) => (
            <div 
              key={file.id} 
              className="bg-muted text-sm px-2 py-1 rounded flex items-center"
            >
              <span className="truncate max-w-[150px]">{file.name}</span>
              <button 
                onClick={() => handleRemoveFile(file.id)} 
                className="ml-1 text-muted-foreground hover:text-destructive"
              >
                &times;
              </button>
            </div>
          ))}
        </div>
      )}
      
      <div className="flex items-end gap-2">
        <Textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Напишите сообщение..."
          className="resize-none flex-1"
          rows={1}
          disabled={disabled || uploading}
        />
        
        <div className="flex gap-2">
          <Button 
            size="icon" 
            variant="outline" 
            type="button" 
            onClick={handleAttachClick}
            disabled={disabled || uploading}
          >
            <Paperclip className="h-4 w-4" />
          </Button>
          <Button 
            size="icon" 
            type="button" 
            onClick={handleSendMessage}
            disabled={(!message.trim() && files.length === 0) || disabled || uploading}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
        
        <input
          type="file"
          multiple
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
          accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.zip,.rar"
        />
      </div>
    </div>
  );
};

export default MessageInput;
