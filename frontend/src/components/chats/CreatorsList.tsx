import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Card, 
  CardContent,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MessageSquare } from 'lucide-react';

/**
 * Интерфейс для участника чата в списке (креатор или клиент)
 */
interface ChatParticipant {
  id: number;
  username: string;
  avatar?: string | null;
  role: 'creator' | 'client';
  chat_id: string; // формат: "{id_креатора}-{id_клиента}"
}

/**
 * Компонент для отображения списка доступных участников чата
 */
const CreatorsList: React.FC = () => {
  const [participants, setParticipants] = useState<ChatParticipant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { isAuthenticated, user, token } = useAuth();

  /**
   * Загружает список доступных участников чата при монтировании компонента
   */
  useEffect(() => {
    const fetchChatParticipants = async () => {
      try {
        // Проверка авторизации с использованием useAuth
        console.log('Статус авторизации:', { isAuthenticated, token: !!token });
        
        if (!isAuthenticated || !token) {
          console.error('Нет токена или пользователь не авторизован');
          setError('Требуется авторизация');
          setLoading(false);
          return;
        }
        
        console.log('Запрашиваем список чатов с токеном');
        // Запрашиваем список участников чата
        const response = await axios.get('/api/chats/', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        console.log('API Response:', response.data);
        
        if (response.data && response.data.chat_participants) {
          console.log('Получены участники чата:', response.data.chat_participants.length);
          setParticipants(response.data.chat_participants);
        } else {
          // Обратная совместимость со старым форматом API
          if (response.data && response.data.creators) {
            console.log('Получены креаторы (старый формат):', response.data.creators.length);
            const creatorsAsParticipants = response.data.creators.map((creator: any) => ({
              ...creator,
              role: 'creator'
            }));
            setParticipants(creatorsAsParticipants);
          } else {
            console.log('Нет данных о чатах');
            setParticipants([]);
          }
        }
        
        setLoading(false);
      } catch (err: any) {
        console.error('Ошибка при загрузке списка чатов:', err);
        
        // Проверка на 401 ошибку
        if (err.response && err.response.status === 401) {
          setError('Требуется авторизация');
        } else {
          setError('Ошибка при загрузке данных');
        }
        
        setLoading(false);
      }
    };

    fetchChatParticipants();
  }, [isAuthenticated, token]);

  /**
   * Открывает чат с участником по его chat_id
   * @param chatId - ID чата в формате "{id_креатора}-{id_клиента}"
   */
  const openChat = (chatId: string) => {
    navigate(`/chats/${chatId}`);
  };

  /**
   * Получает инициалы из имени пользователя для аватара
   * @param username - имя пользователя
   * @returns первые две буквы имени
   */
  const getInitials = (username: string): string => {
    return username.slice(0, 2).toUpperCase();
  };

  return (
    <div className="w-full">
      {loading && (
        <div className="space-y-4">
          {Array(3).fill(0).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="ml-4">
                    <Skeleton className="h-4 w-40" />
                    <Skeleton className="h-3 w-24 mt-2" />
                  </div>
                </div>
                <Skeleton className="h-8 w-24" />
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {!loading && participants.length > 0 && (
        <div className="space-y-3">
          {participants.map(participant => (
            <Card key={participant.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center">
                  <Avatar className="h-12 w-12">
                    {participant.avatar ? (
                      <AvatarImage src={participant.avatar} alt={participant.username} />
                    ) : (
                      <AvatarFallback>{getInitials(participant.username)}</AvatarFallback>
                    )}
                  </Avatar>
                  <div className="ml-4">
                    <h3 className="text-lg font-medium">{participant.username}</h3>
                    <p className="text-sm text-gray-500">{participant.role === 'creator' ? 'Креатор' : 'Клиент'}</p>
                  </div>
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => openChat(participant.chat_id)}
                  className="flex items-center"
                >
                  <MessageSquare className="mr-1 h-4 w-4" />
                  Написать
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {!loading && participants.length === 0 && !error && (
        <div className="text-center py-10">
          <p className="text-gray-500 dark:text-gray-400">У вас пока нет активных чатов</p>
          <Button 
            variant="outline" 
            className="mt-4"
            onClick={() => navigate('/catalog-creators')}
          >
            Найти креаторов в каталоге
          </Button>
        </div>
      )}

      {error && (
        <div className="text-center py-10">
          <p className="text-red-500">{error}</p>
          <Button 
            variant="outline" 
            className="mt-4"
            onClick={() => {
              setError(null);
              setLoading(true);
              window.location.reload();
            }}
          >
            Попробовать снова
          </Button>
        </div>
      )}
    </div>
  );
};

export default CreatorsList;