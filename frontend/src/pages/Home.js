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

  return (
    <div>
      <div className="home-header">
        <h1>🚕 TMATAXI</h1>
        <p style={{ color: 'var(--hint-color)' }}>Выберите режим работы</p>
      </div>

      <div className="form-section">
        <h3>Меню</h3>
        <button className="btn" onClick={handlePassengerClick}>
          👤 Я пассажир
        </button>
        <button className="btn" onClick={handleDriverClick}>
          🚖 Я таксист
        </button>
      </div>

      {user && (
        <div className="form-section">
          <h3>Личный кабинет</h3>
          <button className="btn" onClick={() => navigate('/my-orders')}>
            📦 Мои заказы
          </button>
        </div>
      )}
    </div>
  );
}

export default Home;
