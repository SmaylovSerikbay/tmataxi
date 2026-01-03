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
      <div style={{ padding: '48px 20px', textAlign: 'center', color: 'var(--hint-color)' }}>
        <p style={{ fontSize: '17px', fontWeight: '400' }}>Загрузка...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <h2>Профиль</h2>
      </div>

      <div className="home-profile">
        <div className="profile-avatar">
          {getInitials(displayName)}
        </div>
        <div className="profile-name">{displayName}</div>
        {displayUsername && <div className="profile-username">{displayUsername}</div>}
      </div>

      <div className="form-section">
        <h3>Режим приложения</h3>
        <button className="btn" onClick={toggleUserType}>
          <span>{userType === 'passenger' ? '👤 Пассажир' : '🚖 Водитель'}</span>
          <div style={{ color: 'var(--link-color)', fontSize: '15px', fontWeight: '400' }}>
            Сменить →
          </div>
        </button>
      </div>

      {userType === 'driver' && driver && (
        <div className="form-section">
          <h3>Данные водителя</h3>
          <div className="menu-item" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '4px' }}>
            <div style={{ fontWeight: '600', fontSize: '17px' }}>{driver.carModel || driver.car_model}</div>
            <div style={{ color: 'var(--hint-color)', fontSize: '15px' }}>
              {driver.carNumber || driver.car_number}
            </div>
            {driver.phone && (
              <div style={{ color: 'var(--hint-color)', fontSize: '15px', marginTop: '4px' }}>
                {driver.phone}
              </div>
            )}
          </div>
        </div>
      )}

      {!driver && (
        <div className="form-section">
          <h3>Стать водителем</h3>
          {!isRegistering ? (
            <button className="btn" onClick={() => setIsRegistering(true)}>
              <span>Зарегистрироваться как водитель</span>
              <div className="item-chevron"><ChevronRight /></div>
            </button>
          ) : (
            <form onSubmit={handleRegisterDriver}>
              <div className="input-group">
                <label>Автомобиль</label>
                <input 
                  type="text" 
                  placeholder="Toyota Camry"
                  value={formData.carModel}
                  onChange={e => setFormData({...formData, carModel: e.target.value})}
                  required
                  autoFocus
                />
              </div>
              <div className="input-group">
                <label>Гос. номер</label>
                <input 
                  type="text" 
                  placeholder="01 777 AAA"
                  value={formData.carNumber}
                  onChange={e => setFormData({...formData, carNumber: e.target.value.toUpperCase()})}
                  required
                  maxLength="12"
                />
              </div>
              <button type="submit" className="btn btn-primary">
                Сохранить и начать работу
              </button>
              <button 
                type="button" 
                className="btn" 
                onClick={() => setIsRegistering(false)}
                style={{ justifyContent: 'center', color: '#FF3B30', fontWeight: '400' }}
              >
                Отмена
              </button>
            </form>
          )}
        </div>
      )}

      <div className="form-section">
        <h3>О приложении</h3>
        <div className="menu-item">
          <span>Версия</span>
          <span style={{ color: 'var(--hint-color)', fontSize: '15px' }}>1.0.0</span>
        </div>
      </div>
    </div>
  );
}

export default Profile;
