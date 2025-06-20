/**
 * Выпадающее меню с уведомлениями для отображения в шапке сайта
 */
import React, { useEffect, useState } from 'react';
import { 
  Popover, 
  List, 
  Typography, 
  Button, 
  Box, 
  Divider,
  CircularProgress,
  Alert,
  IconButton,
  Tooltip
} from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import RefreshIcon from '@mui/icons-material/Refresh';
import DeleteSweepIcon from '@mui/icons-material/DeleteSweep';
import DoneAllIcon from '@mui/icons-material/DoneAll';
import { 
  useGetNotificationsQuery, 
  useMarkAllAsReadMutation,
  useClearAllNotificationsMutation
} from '../../api/notificationsApi';
import NotificationItem from './NotificationItem';
import { Notification, PaginatedResponse } from '../../types/notifications';

interface NotificationsMenuProps {
  anchorEl: HTMLElement | null;
  open: boolean;
  onClose: () => void;
}

/**
 * Компонент выпадающего меню с уведомлениями
 * @param anchorEl - Элемент, к которому привязывается меню
 * @param open - Флаг открытия/закрытия меню
 * @param onClose - Функция закрытия меню
 */
const NotificationsMenu: React.FC<NotificationsMenuProps> = ({ 
  anchorEl, 
  open, 
  onClose 
}) => {
  // Локальное состояние для хранения параметров запроса
  const [queryParams, setQueryParams] = useState({
    page: 1,
    page_size: 5,
  });

  // Запрос списка уведомлений
  const { 
    data: notificationsData, 
    isLoading, 
    isError, 
    refetch 
  } = useGetNotificationsQuery(queryParams);

  // Типизация результата запроса
  const notificationsTyped = notificationsData as PaginatedResponse<Notification> | undefined;
  
  // Мутации для действий с уведомлениями
  const [markAllAsRead, { isLoading: isMarkingAllAsRead }] = useMarkAllAsReadMutation();
  const [clearAllNotifications, { isLoading: isClearing }] = useClearAllNotificationsMutation();

  // Обработчик обновления списка уведомлений
  const handleRefresh = () => {
    refetch();
  };

  // Обновление списка при открытии меню
  useEffect(() => {
    if (open) {
      refetch();
    }
  }, [open, refetch]);

  // Обработчик отметки всех уведомлений как прочитанных
  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead(undefined).unwrap();
    } catch (error) {
      console.error('Ошибка при отметке уведомлений как прочитанных:', error);
    }
  };

  // Обработчик удаления всех уведомлений
  const handleClearAll = async () => {
    try {
      await clearAllNotifications(undefined).unwrap();
    } catch (error) {
      console.error('Ошибка при удалении всех уведомлений:', error);
    }
  };

  // Обработчик показа следующей страницы
  const handleNextPage = () => {
    if (notificationsTyped?.next) {
      setQueryParams(prev => ({
        ...prev,
        page: prev.page + 1
      }));
    }
  };

  // Обработчик показа предыдущей страницы
  const handlePrevPage = () => {
    if (notificationsTyped?.previous && queryParams.page > 1) {
      setQueryParams(prev => ({
        ...prev,
        page: prev.page - 1
      }));
    }
  };

  return (
    <Popover
      open={open}
      anchorEl={anchorEl}
      onClose={onClose}
      anchorOrigin={{
        vertical: 'bottom',
        horizontal: 'right',
      }}
      transformOrigin={{
        vertical: 'top',
        horizontal: 'right',
      }}
      PaperProps={{
        sx: {
          width: { xs: '100%', sm: 400 },
          maxWidth: { xs: '100%', sm: 400 },
          maxHeight: 500,
          overflow: 'auto',
          mt: 1,
          boxShadow: 3,
          p: 1
        }
      }}
    >
      {/* Заголовок с действиями */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 1 }}>
        <Typography variant="h6">Уведомления</Typography>
        <Box>
          <Tooltip title="Обновить">
            <IconButton 
              size="small" 
              onClick={handleRefresh} 
              disabled={isLoading}
            >
              <RefreshIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Отметить все как прочитанные">
            <IconButton 
              size="small" 
              onClick={handleMarkAllAsRead} 
              disabled={isLoading || isMarkingAllAsRead}
              color="primary"
            >
              <DoneAllIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Очистить все">
            <IconButton 
              size="small" 
              onClick={handleClearAll} 
              disabled={isLoading || isClearing}
              color="error"
            >
              <DeleteSweepIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>
      
      <Divider sx={{ mb: 1 }} />
      
      {/* Состояние загрузки */}
      {isLoading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
          <CircularProgress size={30} />
        </Box>
      )}
      
      {/* Ошибка */}
      {isError && (
        <Alert severity="error" sx={{ m: 1 }}>
          Не удалось загрузить уведомления
        </Alert>
      )}
      
      {/* Список уведомлений */}
      {!isLoading && !isError && notificationsTyped && (
        <>
          {notificationsTyped.results.length > 0 ? (
            <List sx={{ p: 0 }}>
              {notificationsTyped.results.map((notification) => (
                <NotificationItem 
                  key={notification.id}
                  notification={notification}
                  onClose={onClose}
                />
              ))}
            </List>
          ) : (
            <Box sx={{ p: 3, textAlign: 'center' }}>
              <Typography color="textSecondary">
                У вас нет уведомлений
              </Typography>
            </Box>
          )}
          
          {/* Пагинация */}
          {(notificationsTyped.previous || notificationsTyped.next) && (
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1, px: 1 }}>
              <Button 
                disabled={!notificationsTyped.previous} 
                onClick={handlePrevPage} 
                size="small"
              >
                Назад
              </Button>
              <Button 
                disabled={!notificationsTyped.next} 
                onClick={handleNextPage} 
                size="small"
              >
                Вперед
              </Button>
            </Box>
          )}
        </>
      )}
      
      {/* Кнопка "Все уведомления" */}
      <Box sx={{ mt: 1, textAlign: 'center' }}>
        <Button 
          component={RouterLink} 
          to="/notifications" 
          variant="text" 
          onClick={onClose}
          fullWidth
          size="small"
        >
          Все уведомления
        </Button>
      </Box>
    </Popover>
  );
};

export default NotificationsMenu;
