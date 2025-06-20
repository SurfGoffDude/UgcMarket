/**
 * Компонент списка сообщений (MessagesList)
 * 
 * Отображает сообщения в текущей беседе с возможностью отображения файлов
 * и различия между своими сообщениями и сообщениями собеседника.
 */

import React, { useEffect, useRef } from 'react';
import { Message, User } from '@/types';
import { FileText } from 'lucide-react';

interface MessagesListProps {
  messages: Message[];
  currentUser: User | null;
  loading?: boolean;
}

const MessagesList: React.FC<MessagesListProps> = ({ messages, currentUser, loading = false }) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Автопрокрутка к последнему сообщению
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  if (loading) {
    return (
      <div className="flex flex-col space-y-4 p-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div 
            key={i} 
            className={`flex ${i % 2 === 0 ? 'justify-start' : 'justify-end'}`}
          >
            <div className={`rounded-lg p-3 max-w-[80%] animate-pulse ${
              i % 2 === 0 ? 'bg-gray-200' : 'bg-blue-200'
            }`} style={{ width: `${Math.floor(Math.random() * 40) + 20}%` }}>
              <div className="h-4 bg-gray-300 rounded mb-2" />
              <div className="h-3 bg-gray-300 rounded w-1/2" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center p-4">
        <p className="text-muted-foreground">
          Нет сообщений. Начните общение прямо сейчас!
        </p>
      </div>
    );
  }

  // Группировка сообщений по дате
  const groupedMessages: { [key: string]: Message[] } = {};
  messages.forEach(message => {
    const date = new Date(message.created_at).toLocaleDateString('ru-RU');
    if (!groupedMessages[date]) {
      groupedMessages[date] = [];
    }
    groupedMessages[date].push(message);
  });

  return (
    <div className="flex flex-col space-y-6 p-4">
      {Object.entries(groupedMessages).map(([date, dateMessages]) => (
        <div key={date} className="space-y-4">
          <div className="relative flex items-center justify-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200" />
            </div>
            <div className="relative bg-white px-2 text-xs text-muted-foreground">
              {date}
            </div>
          </div>
          
          {dateMessages.map((message) => {
            const isCurrentUser = message.sender.id === currentUser?.id;
            
            return (
              <div 
                key={message.id} 
                className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
              >
                <div className="flex flex-col max-w-[80%]">
                  <div className={`rounded-lg p-3 ${
                    isCurrentUser 
                      ? 'bg-primary text-primary-foreground' 
                      : 'bg-secondary text-secondary-foreground'
                  }`}>
                    <p>{message.content}</p>
                    
                    {/* Файлы вложений */}
                    {message.attachments && message.attachments.length > 0 && (
                      <div className="mt-2 space-y-2">
                        {message.attachments.map((attachment) => (
                          <div 
                            key={attachment.id} 
                            className={`rounded p-2 flex items-center ${
                              isCurrentUser 
                                ? 'bg-primary/80' 
                                : 'bg-secondary/80'
                            }`}
                          >
                            <FileText className="h-4 w-4 mr-2" />
                            <div className="overflow-hidden">
                              <a 
                                href={attachment.file} 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                className="text-sm font-medium hover:underline truncate block"
                              >
                                {attachment.name}
                              </a>
                              <p className="text-xs opacity-70">
                                {(attachment.size / 1024).toFixed(1)} КБ
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  <span className="text-xs text-muted-foreground self-end mt-1">
                    {new Date(message.created_at).toLocaleTimeString('ru-RU', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      ))}
      <div ref={messagesEndRef} /> {/* Якорь для автоскролла */}
    </div>
  );
};

export default MessagesList;
