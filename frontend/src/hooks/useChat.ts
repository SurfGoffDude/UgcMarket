import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Хук для работы с чатами
 * 
 * Предоставляет методы для создания чата, открытия существующего чата и т.д.
 */
export const useChat = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { user, token } = useAuth();

  /**
   * Функция для открытия чата с креатором
   * 
   * Если чат с креатором уже существует, перенаправляет на него
   * Если нет, создает новый чат и затем перенаправляет
   * 
   * @param creatorId - ID креатора, с которым нужно открыть чат
   */
  const openChatWithCreator = async (creatorId: string | number) => {
    if (!user) {
      toast.error('Необходимо войти в систему для отправки сообщений');
      navigate('/login');
      return;
    }

    setLoading(true);

    try {
      // Сначала проверяем, существует ли уже чат с этим креатором
      const existingChatsResponse = await axios.get('/api/chats/', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      // В новом формате API возвращает список участников чатов (креаторы и клиенты)
      const { chat_participants = [] } = existingChatsResponse.data;
      
      // Проверяем, есть ли уже этот креатор в списке участников
      const existingParticipant = chat_participants.find(
        (participant: any) => participant.id === Number(creatorId) && participant.role === 'creator'
      );

      if (existingParticipant && existingParticipant.chat_id) {
        // Если креатор найден, переходим на чат с ним
        navigate(`/chats/${existingParticipant.chat_id}`);
      } else {
        // Если чата нет, создаем новый
        const response = await axios.post('/api/chats/', {
          creator: creatorId,
          client: user.id
        }, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        // Формируем chat_id в формате {creator_id}-{client_id}
        const chatId = `${creatorId}-${user.id}`;
        
        // Перенаправляем на новый чат
        navigate(`/chats/${chatId}`);
        toast.success('Чат успешно создан');
      }
    } catch (error) {
      console.error('Ошибка при открытии чата:', error);
      toast.error('Ошибка при открытии чата');
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    openChatWithCreator
  };
};
