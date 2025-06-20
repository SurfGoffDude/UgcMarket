/**
 * Страница настроек уведомлений пользователя
 */
import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Switch,
  FormControlLabel,
  Divider,
  Button,
  Alert,
  Snackbar,
  CircularProgress,
  Paper,
} from '@mui/material';
import {
  useGetNotificationSettingsQuery,
  useUpdateNotificationSettingsMutation,
} from '../api/notificationsApi';
import { usePushNotificationsSubscription } from '../hooks/usePushNotificationsSubscription.ts';
import { NotificationSettings } from '../types/notifications';

/**
 * Компонент страницы настроек уведомлений
 */
const NotificationSettingsPage: React.FC = () => {
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error'>('success');

  // Получение текущих настроек пользователя
  const { data: settingsData, isLoading, error } = useGetNotificationSettingsQuery({});
  
  // Приведение данных к правильному типу
  const settings = settingsData as NotificationSettings | undefined;
  
  // Мутация для обновления настроек
  const [updateSettings, { isLoading: isUpdating }] = useUpdateNotificationSettingsMutation();
  
  // Хук для управления подпиской на push-уведомления
  const { 
    isSubscribed, 
    isSubscribing,
    isPushSupported, 
    subscribeUserToPush, 
    unsubscribeUserFromPush 
  } = usePushNotificationsSubscription();

  // Обработчик изменения настроек
  const handleSettingChange = async (field: string, value: boolean) => {
    if (!settings) return;
    
    try {
      // Обновление push подписки если включаются или выключаются push уведомления
      if (field === 'push_notifications') {
        if (value && isPushSupported && !isSubscribed) {
          await subscribeUserToPush();
        } else if (!value && isSubscribed) {
          await unsubscribeUserFromPush();
        }
      }
      
      // Обновление настроек в базе данных
      await updateSettings({
        id: settings.id,
        [field]: value,
      });
      
      // Показ уведомления об успешном обновлении
      setSnackbarMessage('Настройки успешно обновлены');
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
    } catch (error) {
      console.error('Ошибка при обновлении настроек:', error);
      setSnackbarMessage('Ошибка при обновлении настроек');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    }
  };

  // Закрытие снэкбара
  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };

  // Если данные загружаются
  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  // Если произошла ошибка при загрузке данных
  if (error || !settings) {
    return (
      <Alert severity="error" sx={{ m: 2 }}>
        Не удалось загрузить настройки уведомлений. Пожалуйста, попробуйте позже.
      </Alert>
    );
  }

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', p: 2 }}>
      <Typography variant="h4" gutterBottom>
        Настройки уведомлений
      </Typography>

      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Общие настройки
          </Typography>
          
          <FormControlLabel
            control={
              <Switch
                checked={settings.email_notifications}
                onChange={(e) => handleSettingChange('email_notifications', e.target.checked)}
                disabled={isUpdating}
              />
            }
            label="Получать уведомления по электронной почте"
          />
          
          <Divider sx={{ my: 2 }} />
          
          <FormControlLabel
            control={
              <Switch
                checked={settings.push_notifications}
                onChange={(e) => handleSettingChange('push_notifications', e.target.checked)}
                disabled={isUpdating || !isPushSupported || isSubscribing}
              />
            }
            label={
              isPushSupported 
                ? "Получать push-уведомления в браузере" 
                : "Push-уведомления не поддерживаются этим браузером"
            }
          />
          
          {isSubscribing && (
            <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
              <CircularProgress size={20} sx={{ mr: 1 }} />
              <Typography variant="body2" color="text.secondary">
                Настройка push-уведомлений...
              </Typography>
            </Box>
          )}
          
          {!isPushSupported && settings.push_notifications && (
            <Alert severity="info" sx={{ mt: 2 }}>
              Для получения push-уведомлений необходимо разрешить уведомления в браузере.
              При первом включении этой функции браузер запросит ваше разрешение.
            </Alert>
          )}
        </CardContent>
      </Card>

      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          Детальные настройки уведомлений
        </Typography>
        
        <Typography variant="subtitle2" sx={{ mb: 2 }}>
          Выберите типы уведомлений, которые вы хотите получать по email и в браузере:
        </Typography>

        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
          <Box sx={{ width: { xs: '100%', md: 'calc(50% - 12px)' } }}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold' }}>
                  Заказы
                </Typography>
                
                <FormControlLabel
                  control={
                    <Switch
                      disabled={!settings.email_notifications || isUpdating}
                      checked={settings.order_email}
                      onChange={(e) => handleSettingChange('order_email', e.target.checked)}
                    />
                  }
                  label="Email-уведомления"
                />
                
                <br />
                
                <FormControlLabel
                  control={
                    <Switch
                      disabled={!settings.push_notifications || isUpdating || !isPushSupported}
                      checked={settings.order_push}
                      onChange={(e) => handleSettingChange('order_push', e.target.checked)}
                    />
                  }
                  label="Push-уведомления"
                />
                
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  Уведомления о новых заказах, их статусе и изменениях
                </Typography>
              </CardContent>
            </Card>
          </Box>
          
          <Box sx={{ width: { xs: '100%', md: 'calc(50% - 12px)' } }}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold' }}>
                  Сообщения
                </Typography>
                
                <FormControlLabel
                  control={
                    <Switch
                      disabled={!settings.email_notifications || isUpdating}
                      checked={settings.message_email}
                      onChange={(e) => handleSettingChange('message_email', e.target.checked)}
                    />
                  }
                  label="Email-уведомления"
                />
                
                <br />
                
                <FormControlLabel
                  control={
                    <Switch
                      disabled={!settings.push_notifications || isUpdating || !isPushSupported}
                      checked={settings.message_push}
                      onChange={(e) => handleSettingChange('message_push', e.target.checked)}
                    />
                  }
                  label="Push-уведомления"
                />
                
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  Уведомления о новых сообщениях от пользователей и службы поддержки
                </Typography>
              </CardContent>
            </Card>
          </Box>
          
          <Box sx={{ width: { xs: '100%', md: 'calc(50% - 12px)' } }}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold' }}>
                  Финансы
                </Typography>
                
                <FormControlLabel
                  control={
                    <Switch
                      disabled={!settings.email_notifications || isUpdating}
                      checked={settings.payment_email}
                      onChange={(e) => handleSettingChange('payment_email', e.target.checked)}
                    />
                  }
                  label="Email-уведомления"
                />
                
                <br />
                
                <FormControlLabel
                  control={
                    <Switch
                      disabled={!settings.push_notifications || isUpdating || !isPushSupported}
                      checked={settings.payment_push}
                      onChange={(e) => handleSettingChange('payment_push', e.target.checked)}
                    />
                  }
                  label="Push-уведомления"
                />
                
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  Уведомления о платежах, поступлениях средств и других финансовых операциях
                </Typography>
              </CardContent>
            </Card>
          </Box>
          
          <Box sx={{ width: { xs: '100%', md: 'calc(50% - 12px)' } }}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold' }}>
                  Отзывы
                </Typography>
                
                <FormControlLabel
                  control={
                    <Switch
                      disabled={!settings.email_notifications || isUpdating}
                      checked={settings.review_email}
                      onChange={(e) => handleSettingChange('review_email', e.target.checked)}
                    />
                  }
                  label="Email-уведомления"
                />
                
                <br />
                
                <FormControlLabel
                  control={
                    <Switch
                      disabled={!settings.push_notifications || isUpdating || !isPushSupported}
                      checked={settings.review_push}
                      onChange={(e) => handleSettingChange('review_push', e.target.checked)}
                    />
                  }
                  label="Push-уведомления"
                />
                
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  Уведомления о новых отзывах на ваши услуги и оценках
                </Typography>
              </CardContent>
            </Card>
          </Box>
          
          <Box sx={{ width: '100%' }}>
            <Card>
              <CardContent>
                <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold' }}>
                  Системные уведомления
                </Typography>
                
                <FormControlLabel
                  control={
                    <Switch
                      disabled={!settings.email_notifications || isUpdating}
                      checked={settings.system_email}
                      onChange={(e) => handleSettingChange('system_email', e.target.checked)}
                    />
                  }
                  label="Email-уведомления"
                />
                
                <br />
                
                <FormControlLabel
                  control={
                    <Switch
                      disabled={!settings.push_notifications || isUpdating || !isPushSupported}
                      checked={settings.system_push}
                      onChange={(e) => handleSettingChange('system_push', e.target.checked)}
                    />
                  }
                  label="Push-уведомления"
                />
                
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  Важные информационные сообщения от администрации, обновления платформы и системные уведомления
                </Typography>
              </CardContent>
            </Card>
          </Box>
        </Box>
      </Paper>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={4000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleSnackbarClose} severity={snackbarSeverity}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default NotificationSettingsPage;
