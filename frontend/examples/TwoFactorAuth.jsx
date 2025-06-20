import React, { useState, useEffect } from 'react';
import axios from 'axios';

/**
 * Компонент настройки и управления двухфакторной аутентификацией
 *
 * Этот компонент предоставляет полный интерфейс для:
 * - Проверки статуса 2FA
 * - Настройки 2FA (получение QR-кода и активация)
 * - Отключения 2FA
 * - Генерации новых резервных кодов
 */
const TwoFactorAuthSetup = () => {
  // Состояния
  const [loading, setLoading] = useState(true);
  const [isEnabled, setIsEnabled] = useState(false);
  const [setupData, setSetupData] = useState(null);
  const [verificationCode, setVerificationCode] = useState('');
  const [backupCodes, setBackupCodes] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [step, setStep] = useState('status'); // status, setup, activate, disable, backup

  // При монтировании компонента проверяем статус 2FA
  useEffect(() => {
    checkStatus();
  }, []);

  /**
   * Проверка текущего статуса 2FA
   */
  const checkStatus = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/security/2fa/status/');
      setIsEnabled(response.data.is_enabled);
      setLoading(false);
    } catch (err) {
      setError('Ошибка при получении статуса 2FA');
      setLoading(false);
    }
  };

  /**
   * Начало процесса настройки 2FA
   */
  const startSetup = async () => {
    setError('');
    setSuccess('');
    setLoading(true);
    
    try {
      const response = await axios.post('/api/security/2fa/setup/');
      setSetupData(response.data);
      setStep('setup');
      setLoading(false);
    } catch (err) {
      setError('Ошибка при настройке 2FA');
      setLoading(false);
    }
  };

  /**
   * Подтверждение и активация 2FA с введенным кодом
   */
  const verifyAndActivate = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    
    try {
      const response = await axios.post('/api/security/2fa/verify_and_activate/', {
        code: verificationCode
      });
      
      setIsEnabled(true);
      setBackupCodes(response.data.backup_codes);
      setStep('backup');
      setSuccess('Двухфакторная аутентификация успешно активирована');
      setLoading(false);
      setVerificationCode('');
    } catch (err) {
      setError(err.response?.data?.error || 'Ошибка при активации 2FA');
      setLoading(false);
    }
  };

  /**
   * Отключение 2FA
   */
  const disable2FA = async () => {
    setError('');
    setSuccess('');
    setLoading(true);
    
    try {
      const response = await axios.post('/api/security/2fa/disable/', {
        code: verificationCode
      });
      
      setIsEnabled(false);
      setStep('status');
      setSuccess('Двухфакторная аутентификация отключена');
      setVerificationCode('');
      setLoading(false);
    } catch (err) {
      setError(err.response?.data?.error || 'Ошибка при отключении 2FA');
      setLoading(false);
    }
  };

  /**
   * Генерация новых резервных кодов
   */
  const generateNewBackupCodes = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    
    try {
      const response = await axios.post('/api/security/2fa/new_backup_codes/', {
        code: verificationCode
      });
      
      setBackupCodes(response.data.backup_codes);
      setStep('backup');
      setSuccess('Сгенерированы новые резервные коды');
      setVerificationCode('');
      setLoading(false);
    } catch (err) {
      setError(err.response?.data?.error || 'Ошибка при генерации резервных кодов');
      setLoading(false);
    }
  };

  /**
   * Показ статуса 2FA и доступных действий
   */
  const renderStatus = () => (
    <div className="two-factor-status">
      <h3>Двухфакторная аутентификация</h3>
      <p>
        Статус: <strong>{isEnabled ? 'Активирована' : 'Не активирована'}</strong>
      </p>
      
      {isEnabled ? (
        <>
          <p>
            Двухфакторная аутентификация повышает безопасность вашего аккаунта.
            При каждом входе вам потребуется вводить код из приложения-аутентификатора.
          </p>
          <div className="button-group">
            <button 
              className="btn btn-warning" 
              onClick={() => setStep('disable')}
            >
              Отключить 2FA
            </button>
            <button 
              className="btn btn-secondary" 
              onClick={() => setStep('new-backup')}
            >
              Новые резервные коды
            </button>
          </div>
        </>
      ) : (
        <>
          <p>
            Двухфакторная аутентификация добавляет дополнительный слой защиты вашего аккаунта.
            После активации при каждом входе вам потребуется вводить код из приложения-аутентификатора.
          </p>
          <button 
            className="btn btn-primary" 
            onClick={startSetup} 
            disabled={loading}
          >
            {loading ? 'Загрузка...' : 'Настроить двухфакторную аутентификацию'}
          </button>
        </>
      )}
    </div>
  );

  /**
   * Экран настройки 2FA с QR-кодом
   */
  const renderSetup = () => (
    <div className="two-factor-setup">
      <h3>Настройка двухфакторной аутентификации</h3>
      
      <div className="setup-steps">
        <div className="step">
          <h4>1. Установите приложение-аутентификатор</h4>
          <p>
            Если у вас еще нет, установите приложение-аутентификатор, например:
          </p>
          <ul>
            <li>Google Authenticator</li>
            <li>Microsoft Authenticator</li>
            <li>Authy</li>
          </ul>
        </div>
        
        <div className="step">
          <h4>2. Отсканируйте QR-код</h4>
          <p>
            Откройте приложение и отсканируйте этот QR-код:
          </p>
          <div className="qr-code">
            {setupData?.qr_code && (
              <img 
                src={`data:image/png;base64,${setupData.qr_code}`} 
                alt="QR-код для настройки 2FA" 
              />
            )}
          </div>
          <p className="text-muted">
            Или введите код вручную: <strong>{setupData?.secret_key}</strong>
          </p>
        </div>
        
        <div className="step">
          <h4>3. Введите код для подтверждения</h4>
          <p>
            Введите 6-значный код из приложения-аутентификатора:
          </p>
          <form onSubmit={verifyAndActivate}>
            <div className="form-group">
              <input
                type="text"
                className="form-control code-input"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="Введите 6-значный код"
                required
                pattern="[0-9]{6}"
                maxLength="6"
              />
            </div>
            <div className="button-group">
              <button 
                type="submit" 
                className="btn btn-success" 
                disabled={loading || verificationCode.length !== 6}
              >
                {loading ? 'Проверка...' : 'Активировать'}
              </button>
              <button 
                type="button" 
                className="btn btn-link" 
                onClick={() => setStep('status')}
                disabled={loading}
              >
                Отмена
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );

  /**
   * Экран с резервными кодами
   */
  const renderBackupCodes = () => (
    <div className="backup-codes">
      <h3>Резервные коды восстановления</h3>
      <div className="alert alert-warning">
        <strong>Важно!</strong> Сохраните эти коды в надежном месте. 
        Они потребуются для входа в аккаунт, если вы потеряете доступ к приложению-аутентификатору.
      </div>
      
      <div className="codes-container">
        <ul className="backup-codes-list">
          {backupCodes.map((code, index) => (
            <li key={index}>
              <code>{code}</code>
            </li>
          ))}
        </ul>
      </div>
      
      <div className="button-group">
        <button 
          className="btn btn-primary" 
          onClick={() => {
            setStep('status');
            checkStatus();
          }}
        >
          Готово
        </button>
        <button 
          className="btn btn-secondary" 
          onClick={() => {
            navigator.clipboard.writeText(backupCodes.join('\n'));
            setSuccess('Коды скопированы в буфер обмена');
          }}
        >
          Копировать коды
        </button>
      </div>
    </div>
  );

  /**
   * Форма отключения 2FA
   */
  const renderDisable = () => (
    <div className="disable-2fa">
      <h3>Отключение двухфакторной аутентификации</h3>
      <p>Для отключения 2FA введите текущий код из приложения-аутентификатора:</p>
      
      <div className="form-group">
        <input
          type="text"
          className="form-control code-input"
          value={verificationCode}
          onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
          placeholder="Введите 6-значный код"
          pattern="[0-9]{6}"
          maxLength="6"
        />
      </div>
      
      <div className="button-group">
        <button 
          className="btn btn-danger" 
          onClick={disable2FA} 
          disabled={loading || verificationCode.length !== 6}
        >
          {loading ? 'Выполняется...' : 'Отключить 2FA'}
        </button>
        <button 
          className="btn btn-link" 
          onClick={() => {
            setStep('status');
            setVerificationCode('');
          }}
          disabled={loading}
        >
          Отмена
        </button>
      </div>
    </div>
  );

  /**
   * Форма генерации новых резервных кодов
   */
  const renderNewBackup = () => (
    <div className="new-backup-codes">
      <h3>Генерация новых резервных кодов</h3>
      <p>Для генерации новых резервных кодов введите текущий код из приложения-аутентификатора:</p>
      
      <form onSubmit={generateNewBackupCodes}>
        <div className="form-group">
          <input
            type="text"
            className="form-control code-input"
            value={verificationCode}
            onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            placeholder="Введите 6-значный код"
            required
            pattern="[0-9]{6}"
            maxLength="6"
          />
        </div>
        
        <div className="button-group">
          <button 
            type="submit" 
            className="btn btn-primary" 
            disabled={loading || verificationCode.length !== 6}
          >
            {loading ? 'Генерация...' : 'Получить новые коды'}
          </button>
          <button 
            type="button"
            className="btn btn-link" 
            onClick={() => {
              setStep('status');
              setVerificationCode('');
            }}
            disabled={loading}
          >
            Отмена
          </button>
        </div>
      </form>
    </div>
  );

  /**
   * Основной рендер компонента
   */
  return (
    <div className="two-factor-auth-container">
      {error && (
        <div className="alert alert-danger">
          {error}
          <button 
            type="button" 
            className="close" 
            onClick={() => setError('')}
          >
            &times;
          </button>
        </div>
      )}
      
      {success && (
        <div className="alert alert-success">
          {success}
          <button 
            type="button" 
            className="close" 
            onClick={() => setSuccess('')}
          >
            &times;
          </button>
        </div>
      )}
      
      {loading && step === 'status' ? (
        <div className="text-center">
          <div className="spinner-border" role="status">
            <span className="sr-only">Загрузка...</span>
          </div>
        </div>
      ) : (
        <>
          {step === 'status' && renderStatus()}
          {step === 'setup' && renderSetup()}
          {step === 'backup' && renderBackupCodes()}
          {step === 'disable' && renderDisable()}
          {step === 'new-backup' && renderNewBackup()}
        </>
      )}
    </div>
  );
};

export default TwoFactorAuthSetup;