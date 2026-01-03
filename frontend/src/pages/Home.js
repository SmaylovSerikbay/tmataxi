import React from 'react';
import { useNavigate } from 'react-router-dom';
function Home({ user, userType, setUserType }) {
  const navigate = useNavigate();

  const handlePassengerClick = () => {
    setUserType('passenger');
    navigate('/order');
  };

  const handleDriverClick = () => {
    setUserType('driver');
    navigate('/driver');
  };

  const getInitials = (name) => {
    return name ? name.charAt(0).toUpperCase() : 'U';
  };

  const displayName = user ? (user.firstName || user.username || 'User') : 'Guest';
  const displayUsername = user?.username ? `@${user.username}` : '';

  return (
    <div>
      <div className="home-profile">
        <div className="profile-avatar">
          {getInitials(displayName)}
        </div>
        <div className="profile-name">{displayName}</div>
        {displayUsername && <div className="profile-username">{displayUsername}</div>}
      </div>

      <div className="form-section">
        <h3>Меню</h3>
        <button className="btn" onClick={handlePassengerClick}>
          <div className="item-icon" style={{ backgroundColor: '#007AFF' }}>👤</div>
          <span>Я пассажир</span>
          <div className="item-chevron">›</div>
        </button>
        <button className="btn" onClick={handleDriverClick}>
          <div className="item-icon" style={{ backgroundColor: '#FF9500' }}>🚖</div>
          <span>Я таксист</span>
          <div className="item-chevron">›</div>
        </button>
      </div>

      {user && (
        <div className="form-section">
          <h3>Личный кабинет</h3>
          <button className="btn" onClick={() => navigate('/my-orders')}>
            <div className="item-icon" style={{ backgroundColor: '#34C759' }}>📦</div>
            <span>Мои заказы</span>
            <div className="item-chevron">›</div>
          </button>
        </div>
      )}
    </div>
  );
}

export default Home;
