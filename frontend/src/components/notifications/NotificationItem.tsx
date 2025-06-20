/**
 * Компонент для отображения отдельного уведомления в списке
 */
import React from 'react';
import { 
  ListItem, 
  ListItemAvatar, 
  Avatar, 
  ListItemText, 
  Typography, 
  IconButton,
  Tooltip,
  Box
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import MarkAsReadIcon from '@mui/icons-material/DoneAll';
import DeleteIcon from '@mui/icons-material/Delete';
import { Notification } from '../../types/notifications';
import { formatDistanceToNow } from 'date-fns';
import { ru } from 'date-fns/locale';
import { useMarkAsReadMutation, useDeleteNotificationMutation } from '../../api/notificationsApi';

// Иконки для разных типов уведомлений
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart'; // Заказы
import MessageIcon from '@mui/icons-material/Message'; // Сообщения
import PaymentIcon from '@mui/icons-material/Payment'; // Платежи
import ReviewsIcon from '@mui/icons-material/RateReview'; // Отзывы
import InfoIcon from '@mui/icons-material/Info'; // Системные

interface NotificationItemProps {
  notification: Notification;
  onClose?: () => void;
}

/**
 * Компонент отображения одного уведомления
 * @param notification - Объект уведомления
 * @param onClose - Опциональная функция для закрытия родительского компонента
 */
const NotificationItem: React.FC<NotificationItemProps> = ({ notification, onClose }) => {
  const navigate = useNavigate();
  const [markAsRead] = useMarkAsReadMutation();
  const [deleteNotification] = useDeleteNotificationMutation();
  
  /**
   * Обработчик клика по уведомлению
   */
  const handleClick = () => {
    // Отмечаем уведомление как прочитанное
    if (!notification.is_read) {
      markAsRead(notification.id);
    }
    
    // Перенаправляем на соответствующую страницу, если указана ссылка
    if (notification.link) {
      navigate(notification.link);
      if (onClose) {
        onClose();
      }
    }
  };
  
  /**
   * Обработчик удаления уведомления
   */
  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    deleteNotification(notification.id);
  };
  
  /**
   * Обработчик отметки уведомления как прочитанного
   */
  const handleMarkAsRead = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!notification.is_read) {
      markAsRead(notification.id);
    }
  };
  
  /**
   * Возвращает иконку в зависимости от типа уведомления
   */
  const getNotificationIcon = () => {
    switch (notification.notification_type) {
      case 'order':
        return <ShoppingCartIcon />;
      case 'message':
        return <MessageIcon />;
      case 'payment':
        return <PaymentIcon />;
      case 'review':
        return <ReviewsIcon />;
      default:
        return <InfoIcon />;
    }
  };
  
  /**
   * Форматирование даты создания уведомления
   */
  const formattedDate = formatDistanceToNow(new Date(notification.created_at), {
    addSuffix: true,
    locale: ru
  });
  
  return (
    <ListItem
      alignItems="flex-start"
      onClick={handleClick}
      sx={{
        bgcolor: notification.is_read ? 'transparent' : 'rgba(144, 202, 249, 0.08)',
        borderRadius: 1,
        mb: 0.5,
        cursor: 'pointer',
        '&:hover': {
          bgcolor: 'rgba(144, 202, 249, 0.15)',
        },
        position: 'relative'
      }}
    >
      <ListItemAvatar>
        <Avatar 
          sx={{ 
            bgcolor: notification.priority === 'high' ? 'error.main' : 
                   notification.priority === 'medium' ? 'warning.main' : 'info.main',
          }}
        >
          {getNotificationIcon()}
        </Avatar>
      </ListItemAvatar>
      <ListItemText
        primary={
          <Typography
            variant="subtitle1"
            fontWeight={notification.is_read ? 'normal' : 'bold'}
          >
            {notification.title}
          </Typography>
        }
        secondary={
          <>
            <Typography
              component="span"
              variant="body2"
              color="text.primary"
              sx={{ display: 'block', mb: 0.5 }}
            >
              {notification.message}
            </Typography>
            <Typography
              component="span"
              variant="caption"
              color="text.secondary"
            >
              {formattedDate}
            </Typography>
          </>
        }
      />
      
      {/* Кнопки действий */}
      <Box sx={{ position: 'absolute', top: 8, right: 8, display: 'flex' }}>
        {!notification.is_read && (
          <Tooltip title="Отметить как прочитанное">
            <IconButton size="small" onClick={handleMarkAsRead} color="primary">
              <MarkAsReadIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        )}
        <Tooltip title="Удалить">
          <IconButton size="small" onClick={handleDelete} color="error">
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>
    </ListItem>
  );
};

export default NotificationItem;
