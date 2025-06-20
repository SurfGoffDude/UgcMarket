/**
 * Компонент иконки уведомлений с отображением количества непрочитанных уведомлений
 */
import React, { useEffect } from 'react';
import { Bell } from 'react-feather';
import { Badge, IconButton } from '@mui/material';
import { useGetUnreadCountQuery } from '../api/notificationsApi';

interface NotificationIconProps {
  onClick: () => void;
}

/**
 * Компонент иконки уведомлений с бейджем, показывающим количество непрочитанных уведомлений
 * 
 * @param onClick - функция-обработчик нажатия на иконку
 */
const NotificationIcon: React.FC<NotificationIconProps> = ({ onClick }) => {
  const { data, error, refetch } = useGetUnreadCountQuery();
  
  // Периодическое обновление счетчика уведомлений
  useEffect(() => {
    const intervalId = setInterval(() => {
      refetch();
    }, 60000); // Обновляем каждую минуту
    
    return () => clearInterval(intervalId);
  }, [refetch]);
  
  // Количество непрочитанных уведомлений
  const count = data?.count || 0;
  
  return (
    <IconButton color="inherit" onClick={onClick} aria-label="уведомления">
      <Badge badgeContent={count} color="error" max={99}>
        <Bell size={20} />
      </Badge>
    </IconButton>
  );
};

export default NotificationIcon;
