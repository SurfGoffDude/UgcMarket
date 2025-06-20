/**
 * Страница сообщений
 * 
 * Отображает список бесед пользователя и текущую активную беседу
 * с возможностью отправки новых сообщений и загрузки истории.
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Sheet, SheetTrigger, SheetContent } from '@/components/ui/sheet';
import { useToast } from '@/components/ui/use-toast';
import { MessageSquare, Menu } from 'lucide-react';
import { useApiContext } from '@/contexts/ApiContext';
import api from '@/lib/api';
import { Thread, Message } from '@/types';
import ThreadsList from '@/components/messages/ThreadsList';
import MessagesList from '@/components/messages/MessagesList';
import MessageInput from '@/components/messages/MessageInput';

// Компонент заголовка активной беседы
const ThreadHeader: React.FC<{ thread: Thread | null }> = ({ thread }) => {
  if (!thread) return null;

  return (
    <div className="p-3 border-b flex items-center">
      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center mr-3">
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
      <div>
        <p className="font-medium">{thread.other_user.full_name}</p>
        {thread.related_order && (
          <p className="text-xs text-muted-foreground">
            Заказ #{thread.related_order.id}: {thread.related_order.service.title}
          </p>
        )}
      </div>
    </div>
  );
};

/**
 * Основной компонент страницы сообщений
 */
const MessagesPage: React.FC = () => {
  const [threads, setThreads] = useState<Thread[]>([]);
  const [activeThread, setActiveThread] = useState<Thread | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState({
    threads: true,
    messages: false,
  });
  const [error, setError] = useState<Error | null>(null);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);

  const { user, isAuthenticated } = useApiContext();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  // Извлечение параметров запроса (например, order_id для автоматического открытия чата)
  const queryParams = new URLSearchParams(location.search);
  const orderId = queryParams.get('order');

  // Загрузка списка бесед
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: location.pathname } });
      return;
    }

    const fetchThreads = async () => {
      try {
        setLoading(prev => ({ ...prev, threads: true }));
        const response = await api.getThreads();
        setThreads(response.results);
        
        // Если есть orderId в параметрах, найти соответствующую беседу
        if (orderId) {
          const orderThread = response.results.find(
            thread => thread.related_order?.id === Number(orderId)
          );
          if (orderThread) {
            setActiveThread(orderThread);
          }
        } else if (response.results.length > 0) {
          // Установить первую беседу как активную, если нет параметра orderId
          setActiveThread(response.results[0]);
        }
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Ошибка при загрузке бесед'));
        toast({
          title: "Ошибка",
          description: "Не удалось загрузить список бесед",
          variant: "destructive",
        });
      } finally {
        setLoading(prev => ({ ...prev, threads: false }));
      }
    };

    fetchThreads();
  }, [isAuthenticated, navigate, location.pathname, orderId, toast]);

  // Загрузка сообщений при смене активной беседы
  useEffect(() => {
    if (!activeThread) return;

    const fetchMessages = async () => {
      try {
        setLoading(prev => ({ ...prev, messages: true }));
        const response = await api.getMessages(activeThread.id);
        setMessages(response.results);
        
        // Отметить сообщения как прочитанные
        await api.markThreadAsRead(activeThread.id);
        
        // Обновить счетчик непрочитанных в списке бесед
        setThreads(prev => 
          prev.map(thread => 
            thread.id === activeThread.id ? { ...thread, unread_count: 0 } : thread
          )
        );
      } catch (err) {
        toast({
          title: "Ошибка",
          description: "Не удалось загрузить сообщения",
          variant: "destructive",
        });
      } finally {
        setLoading(prev => ({ ...prev, messages: false }));
      }
    };

    fetchMessages();
    // Закрыть мобильный drawer при выборе беседы
    setIsMobileDrawerOpen(false);
  }, [activeThread, toast]);

  // Выбор беседы
  const handleSelectThread = (thread: Thread) => {
    setActiveThread(thread);
  };

  // Отправка сообщения
  const handleSendMessage = async (content: string, fileIds: number[]) => {
    if (!activeThread) return;
    
    try {
      const messageData = {
        content,
        attachment_ids: fileIds
      };
      
      const newMessage = await api.sendMessage(activeThread.id, messageData);
      
      // Добавляем новое сообщение в текущий список
      setMessages(prev => [...prev, newMessage]);
      
      // Обновляем информацию о беседе в списке бесед
      setThreads(prev => 
        prev.map(thread => 
          thread.id === activeThread.id 
            ? { 
                ...thread, 
                last_message: newMessage,
                last_message_at: newMessage.created_at
              } 
            : thread
        ).sort((a, b) => 
          new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime()
        )
      );
    } catch (err) {
      toast({
        title: "Ошибка",
        description: "Не удалось отправить сообщение",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="container mx-auto py-4 md:py-8 px-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Сообщения</h1>
        
        {/* Мобильная кнопка для открытия списка бесед */}
        <div className="md:hidden">
          <Sheet open={isMobileDrawerOpen} onOpenChange={setIsMobileDrawerOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon">
                <Menu className="h-4 w-4" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[280px] p-0">
              <div className="p-3 border-b">
                <h2 className="font-semibold">Беседы</h2>
              </div>
              <div className="overflow-y-auto" style={{ height: 'calc(100vh - 80px)' }}>
                <ThreadsList
                  threads={threads}
                  activeThreadId={activeThread?.id || null}
                  onSelectThread={handleSelectThread}
                  loading={loading.threads}
                />
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {/* Список бесед (скрыт на мобильных) */}
        <div className="hidden md:block md:col-span-1">
          <Card className="h-[calc(100vh-150px)] overflow-hidden flex flex-col">
            <div className="p-3 border-b">
              <h2 className="font-semibold">Беседы</h2>
            </div>
            <div className="flex-1 overflow-y-auto">
              <ThreadsList
                threads={threads}
                activeThreadId={activeThread?.id || null}
                onSelectThread={handleSelectThread}
                loading={loading.threads}
              />
            </div>
          </Card>
        </div>
        
        {/* Окно сообщений активной беседы */}
        <div className="md:col-span-2 lg:col-span-3">
          <Card className="h-[calc(100vh-150px)] overflow-hidden flex flex-col">
            {activeThread ? (
              <>
                <ThreadHeader thread={activeThread} />
                <div className="flex-1 overflow-y-auto">
                  <MessagesList
                    messages={messages}
                    currentUser={user}
                    loading={loading.messages}
                  />
                </div>
                <MessageInput
                  threadId={activeThread.id}
                  onSendMessage={handleSendMessage}
                  disabled={loading.messages}
                />
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center p-4">
                <MessageSquare className="h-16 w-16 text-muted-foreground mb-4" />
                {loading.threads ? (
                  <div className="space-y-2">
                    <Skeleton className="h-6 w-36" />
                    <Skeleton className="h-4 w-52" />
                  </div>
                ) : threads.length > 0 ? (
                  <>
                    <h3 className="text-lg font-medium mb-2">Выберите беседу</h3>
                    <p className="text-muted-foreground">
                      Выберите беседу из списка слева, чтобы начать общение
                    </p>
                    
                    {/* Кнопка для мобильного просмотра на маленьких экранах */}
                    <div className="md:hidden mt-4">
                      <Button onClick={() => setIsMobileDrawerOpen(true)}>
                        Показать беседы
                      </Button>
                    </div>
                  </>
                ) : (
                  <>
                    <h3 className="text-lg font-medium mb-2">Нет активных бесед</h3>
                    <p className="text-muted-foreground">
                      У вас пока нет активных бесед. Создайте заказ или напишите креатору, чтобы начать общение.
                    </p>
                    <Button onClick={() => navigate('/services')} className="mt-4">
                      Просмотреть услуги
                    </Button>
                  </>
                )}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};

export default MessagesPage;
