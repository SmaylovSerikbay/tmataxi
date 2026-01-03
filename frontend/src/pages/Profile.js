import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { registerDriver, getDriver } from '../utils/api';
import { getTelegramUser } from '../utils/telegram';

const ChevronRight = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
);

function Profile({ user, userType, setUserType }) {
  const navigate = useNavigate();
  const [driver, setDriver] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const [isRegistering, setIsRegistering] = useState(false);
  const [formData, setFormData] = useState({
    carModel: '',
    carNumber: ''
  });

  useEffect(() => {
    loadDriverData();
  }, []);

  const loadDriverData = async () => {
    const tgUser = getTelegramUser();
    if (!tgUser) {
      setLoading(false);
      return;
    }

    try {
      const driverData = await getDriver(tgUser.id.toString());
      setDriver(driverData);
    } catch (error) {
      console.log('Not a driver yet');
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterDriver = async (e) => {
    e.preventDefault();
    const tgUser = getTelegramUser();
    if (!tgUser) return;

    try {
      const driverData = await registerDriver(
        tgUser.id.toString(),
        `${tgUser.first_name} ${tgUser.last_name || ''}`.trim(),
        tgUser.phone_number || '',
        formData.carModel,
        formData.carNumber
      );
      setDriver(driverData);
      setIsRegistering(false);
      setUserType('driver');
      navigate('/');
      if (window.Telegram?.WebApp) {
        window.Telegram.WebApp.HapticFeedback.notificationOccurred('success');
      }
    } catch (error) {
      alert('Ошибка регистрации: ' + error.message);
    }
  };

  const toggleUserType = () => {
    const newType = userType === 'passenger' ? 'driver' : 'passenger';
    setUserType(newType);
    navigate('/');
    if (window.Telegram?.WebApp) {
      window.Telegram.WebApp.HapticFeedback.impactOccurred('light');
    }
  };

  const getInitials = (name) => {
    return name ? name.charAt(0).toUpperCase() : 'U';
  };

  const displayName = user ? (user.firstName || user.username || 'User') : 'Guest';
  const displayUsername = user?.username ? `@${user.username}` : '';

  if (loading) {
    return (
      <div className="ds-empty">
        <div className="ds-emptyTitle">Загрузка…</div>
        <div className="ds-emptyText">Открываем профиль</div>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <h2>Профиль</h2>
      </div>

      <div className="ds-profile">
        <div className="ds-avatar">{getInitials(displayName)}</div>
        <div className="ds-name">{displayName}</div>
        {displayUsername && <div className="ds-username">{displayUsername}</div>}
      </div>

      <div className="ds-section">
        <div className="ds-sectionTitle">Режим</div>
        <div className="ds-card ds-cardFlat">
          <button type="button" className="ds-row ds-rowBtn" onClick={toggleUserType}>
            <div className="ds-rowLabel">{userType === 'passenger' ? 'Пассажир' : 'Водитель'}</div>
            <div className="ds-rowValue">
              <span className="ds-link">Сменить</span>
              <span className="ds-chevron"><ChevronRight /></span>
            </div>
          </button>
        </div>
      </div>

      {userType === 'driver' && driver && (
        <div className="ds-section">
          <div className="ds-sectionTitle">Водитель</div>
          <div className="ds-card ds-cardFlat">
            <div className="ds-row">
              <div className="ds-rowLabel">Авто</div>
              <div className="ds-rowValue">{driver.carModel || driver.car_model}</div>
            </div>
            <div className="ds-row">
              <div className="ds-rowLabel">Номер</div>
              <div className="ds-rowValue">{driver.carNumber || driver.car_number}</div>
            </div>
            {driver.phone && (
              <div className="ds-row">
                <div className="ds-rowLabel">Телефон</div>
                <div className="ds-rowValue">{driver.phone}</div>
              </div>
            )}
          </div>
        </div>
      )}

      {!driver && (
        <div className="ds-section">
          <div className="ds-sectionTitle">Стать водителем</div>
          {!isRegistering ? (
            <div className="ds-card ds-cardFlat">
              <button type="button" className="ds-row ds-rowBtn" onClick={() => setIsRegistering(true)}>
                <div className="ds-rowLabel">Регистрация</div>
                <div className="ds-rowValue">
                  <span className="ds-link">Открыть</span>
                  <span className="ds-chevron"><ChevronRight /></span>
                </div>
              </button>
            </div>
          ) : (
            <form onSubmit={handleRegisterDriver}>
              <div className="ds-card ds-cardFlat">
                <div className="ds-row">
                  <div className="ds-rowLabel">Авто</div>
                  <input
                    className="ds-input"
                    type="text"
                    placeholder="Toyota Camry"
                    value={formData.carModel}
                    onChange={(e) => setFormData({ ...formData, carModel: e.target.value })}
                    required
                    autoFocus
                  />
                </div>
                <div className="ds-row">
                  <div className="ds-rowLabel">Номер</div>
                  <input
                    className="ds-input"
                    type="text"
                    placeholder="A123BC01"
                    value={formData.carNumber}
                    onChange={(e) => setFormData({ ...formData, carNumber: e.target.value.toUpperCase() })}
                    required
                    maxLength="12"
                  />
                </div>
                <div className="ds-actions">
                  <button type="submit" className="ds-btn ds-btnPrimary">
                    Сохранить
                  </button>
                  <button type="button" className="ds-btn ds-btnDanger" onClick={() => setIsRegistering(false)}>
                    Отмена
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>
      )}

      <div className="ds-section">
        <div className="ds-sectionTitle">О приложении</div>
        <div className="ds-card ds-cardFlat">
          <div className="ds-row">
            <div className="ds-rowLabel">Версия</div>
            <div className="ds-rowValue">1.0.0</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Profile;
