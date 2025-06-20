import React, { useState, useEffect } from 'react';
import axios from 'axios';

/**
 * Компонент для отображения истории входов и управления активными сессиями
 *
 * Этот компонент обеспечивает:
 * - Просмотр истории входов в аккаунт
 * - Просмотр и управление активными сессиями
 * - Возможность завершения отдельных сессий или всех, кроме текущей
 */
const SecurityAudit = () => {
  // Состояния
  const [loginHistory, setLoginHistory] = useState([]);
  const [activeSessions, setActiveSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeTab, setActiveTab] = useState('history');
  
  // При монтировании компонента загружаем данные
  useEffect(() => {
    if (activeTab === 'history') {
      fetchLoginHistory();
    } else if (activeTab === 'sessions') {
      fetchActiveSessions();
    }
  }, [activeTab]);

  /**
   * Загрузка истории входов
   */
  const fetchLoginHistory = async (limit = 20) => {
    setLoading(true);
    try {
      const response = await axios.get(`/api/security/security-audit/login_history/?limit=${limit}`);
      setLoginHistory(response.data);
      setLoading(false);
    } catch (err) {
      setError('Ошибка при загрузке истории входов');
      setLoading(false);
    }
  };

  /**
   * Загрузка активных сессий
   */
  const fetchActiveSessions = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/security/security-audit/active_sessions/');
      setActiveSessions(response.data);
      setLoading(false);
    } catch (err) {
      setError('Ошибка при загрузке активных сессий');
      setLoading(false);
    }
  };

  /**
   * Завершение отдельной сессии
   */
  const terminateSession = async (sessionKey) => {
    setLoading(true);
    try {
      const response = await axios.post('/api/security/security-audit/terminate_session/', {
        session_key: sessionKey
      });
      setSuccess(response.data.message || 'Сессия успешно завершена');
      
      // Обновляем список активных сессий
      fetchActiveSessions();
    } catch (err) {
      setError(err.response?.data?.error || 'Ошибка при завершении сессии');
      setLoading(false);
    }
  };

  /**
   * Завершение всех сессий кроме текущей
   */
  const terminateAllOtherSessions = async () => {
    if (!window.confirm('Вы уверены, что хотите завершить все остальные сессии?')) {
      return;
    }
    
    setLoading(true);
    try {
      const response = await axios.post('/api/security/security-audit/terminate_all_other_sessions/');
      setSuccess(`${response.data.message} (${response.data.count})`);
      
      // Обновляем список активных сессий
      fetchActiveSessions();
    } catch (err) {
      setError(err.response?.data?.error || 'Ошибка при завершении сессий');
      setLoading(false);
    }
  };

  /**
   * Форматирование даты к читаемому виду
   */
  const formatDate = (dateString) => {
    const options = { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    };
    return new Date(dateString).toLocaleDateString('ru-RU', options);
  };

  /**
   * Форматирование статуса входа
   */
  const formatStatus = (status) => {
    switch (status) {
      case 'success':
        return <span className="badge badge-success">Успешно</span>;
      case 'failed':
        return <span className="badge badge-danger">Неудача</span>;
      case '2fa_required':
        return <span className="badge badge-warning">Требуется 2FA</span>;
      case '2fa_success':
        return <span className="badge badge-success">2FA успешно</span>;
      case '2fa_failed':
        return <span className="badge badge-danger">2FA неудача</span>;
      default:
        return <span className="badge badge-secondary">{status}</span>;
    }
  };

  /**
   * Отрисовка истории входов
   */
  const renderLoginHistory = () => (
    <div className="login-history">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h3>История входов</h3>
        <button 
          className="btn btn-sm btn-outline-primary" 
          onClick={() => fetchLoginHistory()}
          disabled={loading}
        >
          {loading ? 'Загрузка...' : 'Обновить'}
        </button>
      </div>
      
      {loginHistory.length > 0 ? (
        <div className="table-responsive">
          <table className="table table-striped">
            <thead>
              <tr>
                <th>Дата/Время</th>
                <th>IP-адрес</th>
                <th>Устройство</th>
                <th>Браузер</th>
                <th>ОС</th>
                <th>Статус</th>
              </tr>
            </thead>
            <tbody>
              {loginHistory.map((entry) => (
                <tr key={entry.id}>
                  <td>{formatDate(entry.created_at)}</td>
                  <td>{entry.ip_address}</td>
                  <td>{entry.device_type}</td>
                  <td>{entry.browser}</td>
                  <td>{entry.os}</td>
                  <td>{formatStatus(entry.status)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="alert alert-info">
          История входов пуста
        </div>
      )}
    </div>
  );

  /**
   * Отрисовка активных сессий
   */
  const renderActiveSessions = () => (
    <div className="active-sessions">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h3>Активные сессии</h3>
        <div>
          <button 
            className="btn btn-sm btn-outline-primary mr-2" 
            onClick={() => fetchActiveSessions()}
            disabled={loading}
          >
            {loading ? 'Загрузка...' : 'Обновить'}
          </button>
          <button 
            className="btn btn-sm btn-outline-danger" 
            onClick={terminateAllOtherSessions}
            disabled={loading}
          >
            Завершить все другие сессии
          </button>
        </div>
      </div>
      
      {activeSessions.length > 0 ? (
        <div className="table-responsive">
          <table className="table table-striped">
            <thead>
              <tr>
                <th>Устройство</th>
                <th>IP-адрес</th>
                <th>Браузер</th>
                <th>ОС</th>
                <th>Последняя активность</th>
                <th>Действия</th>
              </tr>
            </thead>
            <tbody>
              {activeSessions.map((session) => (
                <tr key={session.id} className={session.is_current ? 'table-active' : ''}>
                  <td>
                    {session.device_type}
                    {session.is_current && (
                      <span className="badge badge-info ml-2">Текущая</span>
                    )}
                  </td>
                  <td>{session.ip_address}</td>
                  <td>{session.browser}</td>
                  <td>{session.os}</td>
                  <td>{formatDate(session.last_activity)}</td>
                  <td>
                    {!session.is_current && (
                      <button
                        className="btn btn-sm btn-danger"
                        onClick={() => terminateSession(session.session_key)}
                        disabled={loading}
                      >
                        Завершить
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="alert alert-info">
          Нет активных сессий
        </div>
      )}
    </div>
  );
  
  return (
    <div className="security-audit-container">
      {error && (
        <div className="alert alert-danger alert-dismissible fade show">
          {error}
          <button 
            type="button" 
            className="close" 
            onClick={() => setError('')}
          >
            <span>&times;</span>
          </button>
        </div>
      )}
      
      {success && (
        <div className="alert alert-success alert-dismissible fade show">
          {success}
          <button 
            type="button" 
            className="close" 
            onClick={() => setSuccess('')}
          >
            <span>&times;</span>
          </button>
        </div>
      )}
      
      <ul className="nav nav-tabs mb-4">
        <li className="nav-item">
          <a 
            className={`nav-link ${activeTab === 'history' ? 'active' : ''}`}
            href="#history"
            onClick={(e) => {
              e.preventDefault();
              setActiveTab('history');
            }}
          >
            История входов
          </a>
        </li>
        <li className="nav-item">
          <a 
            className={`nav-link ${activeTab === 'sessions' ? 'active' : ''}`}
            href="#sessions"
            onClick={(e) => {
              e.preventDefault();
              setActiveTab('sessions');
            }}
          >
            Активные сессии
          </a>
        </li>
      </ul>
      
      {loading && activeTab !== 'history' && activeTab !== 'sessions' ? (
        <div className="text-center py-4">
          <div className="spinner-border" role="status">
            <span className="sr-only">Загрузка...</span>
          </div>
        </div>
      ) : (
        <>
          {activeTab === 'history' && renderLoginHistory()}
          {activeTab === 'sessions' && renderActiveSessions()}
        </>
      )}
    </div>
  );
};

export default SecurityAudit;