import React from 'react';
import { useNavigate } from 'react-router-dom';
import './Home.css';

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
        <h1>Междугороднее такси</h1>
      </div>

      <div className="home-buttons">
        <button className="btn btn-passenger" onClick={handlePassengerClick}>
          Я пассажир
        </button>
        <button className="btn btn-driver" onClick={handleDriverClick}>
          Я таксист
        </button>
      </div>

      {user && (
        <div className="home-actions">
          <button className="btn btn-secondary" onClick={() => navigate('/my-orders')}>
            Мои заказы
          </button>
        </div>
      )}
    </div>
  );
}

export default Home;
