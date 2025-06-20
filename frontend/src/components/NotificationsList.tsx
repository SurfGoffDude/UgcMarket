/**
 * Компонент для отображения списка уведомлений пользователя
 */
import React, { useState } from 'react';
import { 
  Box, 
  Typography, 
  List, 
  ListItem, 
  ListItemText, 
  Divider, 
  Button, 
  IconButton,
  Paper,
  CircularProgress,
  Tooltip 
} from '@mui/material';
import { 
  Check as CheckIcon, 
  Trash2 as TrashIcon, 
  RefreshCw as RefreshIcon,
  X as CloseIcon
} from 'react-feather';
import { formatDistanceToNow } from 'date-fns';
import { ru } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import { 
  useGetNotificationsQuery, 
  useMarkAsReadMutation,
  useDeleteNotificationMutation,
  useMarkAllAsReadMutation,
  useClearAllNotificationsMutation
} from '../api/notificationsApi';
import type { Notification, NotificationFilterParams } from '../types/notifications';

interface NotificationsListProps {
  onClose: () => void;
  maxHeight?: number;
}

/**
 * Компонент отображения списка уведомлений с возможностями управления ими
 * 
 * @param onClose - функция закрытия списка уведомлений
 * @param maxHeight - максимальная высота списка
 */
const NotificationsList: React.FC<NotificationsListProps> = ({ 
  onClose,
  maxHeight = 400
}) => {
  const navigate = useNavigate();
  const [params, setParams] = useState<NotificationFilterParams>({
    page: 1,
    page_size: 10
  });
  
  // Получение списка уведомлений
  const { data, isLoading, isFetching, refetch } = useGetNotificationsQuery(params);
  
  // Мутации для управления уведомлениями
  const [markAsRead] = useMarkAsReadMutation();
  const [deleteNotification] = useDeleteNotificationMutation();
  const [markAllAsRead] = useMarkAllAsReadMutation();
  const [clearAll] = useClearAllNotificationsMutation();
  
  // Обработчик клика по уведомлению
  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.is_read) {
      await markAsRead(notification.id);
    }
    
    if (notification.link) {
      navigate(notification.link);
      onClose();
    }
  };
  
  // Пометить уведомление как прочитанное
  const handleMarkAsRead = async (event: React.MouseEvent, id: number) => {
    event.stopPropagation();
    await markAsRead(id);
  };
  
  // Удалить уведомление
  const handleDelete = async (event: React.MouseEvent, id: number) => {
    event.stopPropagation();
    await deleteNotification(id);
  };
  
  // Пометить все как прочитанные
  const handleMarkAllAsRead = async () => {
    await markAllAsRead();
  };
  
  // Очистить все уведомления
  const handleClearAll = async () => {
    await clearAll();
  };
  
  // Форматирование даты "5 минут назад"
  const formatDate = (dateString: string) => {
    return formatDistanceToNow(new Date(dateString), { addSuffix: true, locale: ru });
  };

  // Получение цвета приоритета
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return '#ef4444';
      case 'medium':
        return '#f59e0b';
      default:
        return '#3b82f6';
    }
  };

  // Получение иконки для типа уведомления
  const getNotificationTypeIcon = (type: string) => {
    switch (type) {
      case 'order':
        return '📋';
      case 'message':
        return '💬';
      case 'payment':
        return '💰';
      case 'review':
        return '⭐';
      default:
        return 'ℹ️';
    }
  };
  
  return (
    <Paper 
      sx={{ 
        width: { xs: '100%', sm: 400 },
        maxHeight: maxHeight,
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        boxShadow: 3
      }}
    >
      {/* Заголовок */}
      <Box 
        sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          borderBottom: 1,
          borderColor: 'divider',
          p: 2,
          bgcolor: 'primary.main',
          color: 'white'
        }}
      >
        <Typography variant="h6">Уведомления</Typography>
        <Box>
          <IconButton 
            size="small" 
            onClick={() => refetch()} 
            sx={{ color: 'white', mr: 1 }}
          >
            <RefreshIcon size={18} />
          </IconButton>
          <IconButton 
            size="small" 
            onClick={onClose} 
            sx={{ color: 'white' }}
          >
            <CloseIcon size={18} />
          </IconButton>
        </Box>
      </Box>
      
      {/* Контейнер списка */}
      <Box 
        sx={{ 
          overflow: 'auto',
          flex: 1
        }}
      >
        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        ) : data?.results.length === 0 ? (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <Typography color="textSecondary">Нет уведомлений</Typography>
          </Box>
        ) : (
          <List sx={{ p: 0 }}>
            {data?.results.map((notification, index) => (
              <React.Fragment key={notification.id}>
                {index > 0 && <Divider />}
                <ListItem 
                  sx={{ 
                    cursor: 'pointer',
                    bgcolor: notification.is_read ? 'transparent' : 'action.hover',
                    transition: 'background-color 0.2s',
                    '&:hover': {
                      bgcolor: 'action.selected',
                    },
                    borderLeft: 3,
                    borderColor: getPriorityColor(notification.priority),
                    pl: 2
                  }}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography component="span" sx={{ fontSize: 20 }}>
                          {getNotificationTypeIcon(notification.notification_type)}
                        </Typography>
                        <Typography variant="subtitle1" sx={{ fontWeight: notification.is_read ? 'normal' : 'bold' }}>
                          {notification.title}
                        </Typography>
                      </Box>
                    }
                    secondary={
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          {notification.message}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                          {formatDate(notification.created_at)}
                        </Typography>
                      </Box>
                    }
                  />
                  <Box sx={{ ml: 1, display: 'flex', flexDirection: 'column', gap: 1 }}>
                    {!notification.is_read && (
                      <Tooltip title="Отметить как прочитанное">
                        <IconButton 
                          size="small" 
                          onClick={(e) => handleMarkAsRead(e, notification.id)}
                        >
                          <CheckIcon size={16} />
                        </IconButton>
                      </Tooltip>
                    )}
                    <Tooltip title="Удалить">
                      <IconButton 
                        size="small"
                        onClick={(e) => handleDelete(e, notification.id)}
                      >
                        <TrashIcon size={16} />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </ListItem>
              </React.Fragment>
            ))}
          </List>
        )}
      </Box>
      
      {/* Нижняя панель действий */}
      <Box 
        sx={{ 
          display: 'flex', 
          justifyContent: 'space-between',
          p: 1.5,
          borderTop: 1,
          borderColor: 'divider'
        }}
      >
        <Button 
          size="small" 
          disabled={isLoading || isFetching || !data?.results.length}
          onClick={handleMarkAllAsRead}
        >
          Прочитано всё
        </Button>
        <Button 
          size="small" 
          disabled={isLoading || isFetching || !data?.results.length}
          onClick={handleClearAll}
          color="error"
        >
          Очистить все
        </Button>
      </Box>
      
      {/* Ссылка на страницу уведомлений */}
      <Box 
        sx={{ 
          borderTop: 1,
          borderColor: 'divider',
          p: 1,
          bgcolor: 'action.hover',
          textAlign: 'center'
        }}
      >
        <Button 
          size="small" 
          onClick={() => {
            navigate('/notifications');
            onClose();
          }}
        >
          Все уведомления
        </Button>
        <Button 
          size="small" 
          sx={{ ml: 1 }}
          onClick={() => {
            navigate('/settings/notifications');
            onClose();
          }}
        >
          Настройки
        </Button>
      </Box>
    </Paper>
  );
};

export default NotificationsList;
