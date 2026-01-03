import React from 'react';
import { useNavigate } from 'react-router-dom';
import './Home.css';

// Inline Icons components
const UserIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
);

const CarIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"/><circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/><path d="M2 12h12"/></svg>
);

const PackageIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16.5 9.4 7.5 4.21"/><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>
);

const ChevronRight = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
);

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
          <div className="item-icon" style={{ backgroundColor: '#007AFF' }}>
            <UserIcon />
          </div>
          <span>Я пассажир</span>
          <div className="item-chevron"><ChevronRight /></div>
        </button>
        <button className="btn" onClick={handleDriverClick}>
          <div className="item-icon" style={{ backgroundColor: '#FF9500' }}>
            <CarIcon />
          </div>
          <span>Я таксист</span>
          <div className="item-chevron"><ChevronRight /></div>
        </button>
      </div>

      {user && (
        <div className="form-section">
          <h3>Личный кабинет</h3>
          <button className="btn" onClick={() => navigate('/my-orders')}>
            <div className="item-icon" style={{ backgroundColor: '#34C759' }}>
              <PackageIcon />
            </div>
            <span>Мои заказы</span>
            <div className="item-chevron"><ChevronRight /></div>
          </button>
        </div>
      )}
    </div>
  );
}

export default Home;
