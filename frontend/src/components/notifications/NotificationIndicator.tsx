/**
 * Компонент индикатора уведомлений для отображения в навигационной панели
 */
import React, { useEffect } from 'react';
import { Badge, IconButton, Tooltip } from '@mui/material';
import NotificationsIcon from '@mui/icons-material/Notifications';
import { useGetUnreadCountQuery } from '../../api/notificationsApi';

// Интерфейс для ответа API с количеством непрочитанных уведомлений
interface UnreadCountResponse {
  unread_count: number;
}

interface NotificationIndicatorProps {
  onClick: (event: React.MouseEvent<HTMLElement>) => void;
}

/**
 * Индикатор непрочитанных уведомлений с количеством
 * @param onClick - Функция обработки клика по индикатору
 */
const NotificationIndicator: React.FC<NotificationIndicatorProps> = ({ onClick }) => {
  // Получение количества непрочитанных уведомлений
  const { 
    data: unreadCountData, 
    isLoading, 
    refetch 
  } = useGetUnreadCountQuery({}, {
    pollingInterval: 60000, // Проверка каждую минуту
  });

  // Количество непрочитанных уведомлений
  const unreadCount = (unreadCountData as UnreadCountResponse)?.unread_count || 0;

  // Проверка непрочитанных уведомлений при монтировании компонента
  useEffect(() => {
    refetch();
  }, [refetch]);

  return (
    <Tooltip title="Уведомления">
      <IconButton
        color="inherit"
        aria-label="Уведомления"
        onClick={onClick}
        sx={{ 
          position: 'relative',
          '&:hover': {
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
          }
        }}
      >
        <Badge 
          badgeContent={unreadCount} 
          color="error"
          max={99}
          overlap="circular"
          invisible={unreadCount === 0 || isLoading}
        >
          <NotificationsIcon />
        </Badge>
      </IconButton>
    </Tooltip>
  );
};

export default NotificationIndicator;
