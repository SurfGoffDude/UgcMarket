/**
 * Компонент списка бесед (ThreadsList)
 * 
 * Отображает список бесед пользователя с возможностью выбора активной беседы
 */

import React from 'react';
import { Thread } from '@/types';
import { Badge } from '@/components/ui/badge';
import { MessageSquare } from 'lucide-react';

interface ThreadsListProps {
  threads: Thread[];
  activeThreadId: number | null;
  onSelectThread: (thread: Thread) => void;
  loading?: boolean;
}

const ThreadsList: React.FC<ThreadsListProps> = ({ 
  threads, 
  activeThreadId, 
  onSelectThread,
  loading = false 
}) => {
  if (loading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="p-3 rounded-lg animate-pulse">
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 rounded-full bg-gray-200" />
              <div className="space-y-2 flex-1">
                <div className="h-4 w-3/4 bg-gray-200 rounded" />
                <div className="h-3 w-1/2 bg-gray-200 rounded" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (threads.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center p-4">
        <MessageSquare className="h-12 w-12 text-muted-foreground mb-2" />
        <h3 className="text-lg font-medium mb-1">Нет активных бесед</h3>
        <p className="text-sm text-muted-foreground">
          Начните новую беседу или перейдите к заказу для общения с креатором
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {threads.map((thread) => (
        <div
          key={thread.id}
          className={`p-3 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors ${
            activeThreadId === thread.id ? 'bg-gray-100' : ''
          }`}
          onClick={() => onSelectThread(thread)}
        >
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              {thread.other_user.avatar ? (
                <img 
                  src={thread.other_user.avatar} 
                  alt={thread.other_user.full_name} 
                  className="h-10 w-10 rounded-full object-cover"
                />
              ) : (
                <span className="font-medium">
                  {thread.other_user.first_name[0]}
                  {thread.other_user.last_name[0]}
                </span>
              )}
            </div>
            <div className="flex-1">
              <div className="flex justify-between items-center">
                <span className="font-medium text-sm">{thread.other_user.full_name}</span>
                <span className="text-xs text-muted-foreground">
                  {new Date(thread.last_message_at).toLocaleDateString('ru-RU')}
                </span>
              </div>
              <div className="flex justify-between items-center mt-1">
                <p className="text-xs text-muted-foreground truncate max-w-[180px]">
                  {thread.last_message ? thread.last_message.content : 'Нет сообщений'}
                </p>
                {thread.unread_count > 0 && (
                  <Badge variant="default" className="text-xs h-5 min-w-[20px] flex items-center justify-center">
                    {thread.unread_count}
                  </Badge>
                )}
              </div>
            </div>
          </div>

          {thread.related_order && (
            <div className="mt-2 text-xs bg-muted p-1 px-2 rounded text-muted-foreground">
              Заказ #{thread.related_order.id}: {thread.related_order.service.title}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default ThreadsList;
