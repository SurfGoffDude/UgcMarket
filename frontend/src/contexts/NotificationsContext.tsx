/**
 * Контекст для работы с уведомлениями и WebSocket-подключением
 */
import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from 'react';
import { useDispatch } from 'react-redux';
import { notificationsApi } from '../api/notificationsApi';
import { Notification } from '../types/notifications';
import type { AuthHook } from '../types/auth';
import useAuth from '../hooks/useAuth.ts';

/* Интерфейсы для типизации ответов API */
interface UnreadCountResponse {
  unread_count: number;
}

/* -------------------------------------------------------------------------- */
/* Типы и контекст                                                            */
/* -------------------------------------------------------------------------- */

interface NotificationsContextType {
  showNotificationToast: (notification: Notification) => void;
  unreadCount: number;
  setUnreadCount: React.Dispatch<React.SetStateAction<number>>;
}

const noop = (): void => {};

const NotificationsContext = createContext<NotificationsContextType>({
  showNotificationToast: noop,
  unreadCount: 0,
  setUnreadCount: noop,
});

export const useNotifications = (): NotificationsContextType =>
  useContext(NotificationsContext);

interface NotificationsProviderProps {
  children: React.ReactNode;
}

/* -------------------------------------------------------------------------- */
/* Провайдер                                                                  */
/* -------------------------------------------------------------------------- */

export const NotificationsProvider: React.FC<NotificationsProviderProps> = ({
  children,
}) => {
  const dispatch = useDispatch();
  // Используем useAuth с проверкой наличия необходимых методов
  const auth = useAuth() as AuthHook;
  const { isAuthenticated, user } = auth;

  const [unreadCount, setUnreadCount] = useState(0);
  const [toastNotification, setToastNotification] = useState<Notification | null>(
    null,
  );

  /* ------------------------- helpers ------------------------------------ */

  const showNotificationToast = useCallback((notification: Notification) => {
    setToastNotification(notification);

    const timer = setTimeout(() => setToastNotification(null), 5_000);
    return (): void => clearTimeout(timer);
  }, []);

  const log = (...args: unknown[]): void => {
    if (process.env.NODE_ENV !== 'production') {
      // eslint-disable-next-line no-console

    }
  };

  /* ------------------------- WebSocket ---------------------------------- */

  useEffect(() => {
    if (!isAuthenticated || !user) return undefined;

    // Проверяем наличие метода sub (предотвращаем ошибку hook.sub is not a function)
    try {

    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${wsProtocol}//${window.location.host}/ws/notifications/?token=${localStorage.getItem(
      'authToken',
    )}`;

    const socket = new WebSocket(wsUrl);

    socket.onopen = () => log('WebSocket соединение установлено');

    socket.onmessage = (event) => {
      try {
        const data: { type: string; notification: Notification } = JSON.parse(
          event.data,
        );

        if (data.type === 'notification') {
          /* обновляем список уведомлений */
          dispatch(
            notificationsApi.util.updateQueryData(
              'getNotifications',
              { page: 1, page_size: 10 },
              (draft: any) => {
                draft?.results?.unshift(data.notification);
                draft.count = (draft.count ?? 0) + 1;
              },
            ) as any,
          );

          /* счётчик непрочитанных */
          dispatch(
            notificationsApi.util.updateQueryData(
              'getUnreadCount',
              {},
              (draft: any) => {
                if (draft) {
                  draft.unread_count = (draft.unread_count ?? 0) + 1;
                  setUnreadCount(draft.unread_count);
                }
              },
            ) as any,
          );

          /* тост */
          showNotificationToast(data.notification);
        }
      } catch (error) {
        // eslint-disable-next-line no-console

      }
    };

    socket.onerror = (error) => {
      // eslint-disable-next-line no-console

    };

    socket.onclose = (evt) => {
      log('WebSocket закрыт:', evt.code, evt.reason);
      if (evt.code !== 1000) {
        setTimeout(() => log('Попытка переподключения…'), 3_000);
      }
    };

    return () => socket.close();
    } catch (wsError) {

      return undefined;
    }
  }, [dispatch, isAuthenticated, showNotificationToast, user]);

  /* ------------------ начальное кол-во непрочитанных ------------------- */

  // Используем хук для ленивого запроса непрочитанных уведомлений
  const [getUnreadCount] = notificationsApi.useLazyGetUnreadCountQuery();

  useEffect(() => {
    if (!isAuthenticated) return;

    // Вызываем API для получения непрочитанных уведомлений
    getUnreadCount({}).unwrap()
      .then((data: UnreadCountResponse) => {
        setUnreadCount(data.unread_count ?? 0);
      })
      .catch((error) => {

      });
  }, [getUnreadCount, isAuthenticated]);

  /* ------------------------ style-inject once --------------------------- */

  useEffect(() => {
    const styleEl = document.createElement('style');
    styleEl.textContent = `
      @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to   { transform: translateX(0);   opacity: 1; }
      }`;
    document.head.appendChild(styleEl);

    return () => {
      document.head.removeChild(styleEl);
    };
  }, []);

  /* ---------------------------------------------------------------------- */

  const value: NotificationsContextType = {
    showNotificationToast,
    unreadCount,
    setUnreadCount,
  };

  return (
    <NotificationsContext.Provider value={value}>
      {children}

      {toastNotification && (
        <div
          style={{
            position: 'fixed',
            bottom: 20,
            right: 20,
            width: 300,
            backgroundColor: '#fff',
            borderRadius: 8,
            boxShadow: '0 3px 10px rgba(0,0,0,.2)',
            zIndex: 1_500,
            overflow: 'hidden',
            animation: 'slideIn .3s ease-out',
          }}
        >
          <div
            style={{
              height: 4,
              backgroundColor:
                toastNotification.priority === 'high'
                  ? '#ef4444'
                  : toastNotification.priority === 'medium'
                  ? '#f59e0b'
                  : '#3b82f6',
            }}
          />
          <div style={{ padding: 16 }}>
            <header
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 8,
              }}
            >
              <h4 style={{ margin: 0, fontSize: 16 }}>{toastNotification.title}</h4>
              <button
                type="button"
                onClick={() => setToastNotification(null)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: 18,
                  color: '#666',
                }}
                aria-label="Close notification"
              >
                &times;
              </button>
            </header>
            <p style={{ margin: 0, fontSize: 14 }}>{toastNotification.message}</p>
          </div>
        </div>
      )}
    </NotificationsContext.Provider>
  );
};
