import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { initTelegramWebApp } from './utils/telegram';
import PassengerOrder from './pages/PassengerOrder';
import DriverPanel from './pages/DriverPanel';
import MyOrders from './pages/MyOrders';
import Profile from './pages/Profile';
import BottomNavigation from './components/BottomNavigation';
import './App.css';

// Layout component to wrap pages with BottomNavigation
const Layout = ({ children }) => {
  return (
    <>
      <div className="content-container">
        {children}
      </div>
      <BottomNavigation />
    </>
  );
};

function App() {
  const [user, setUser] = useState(null);
  // Persistent user type state
  const [userType, setUserType] = useState(() => {
    return localStorage.getItem('userType') || 'passenger';
  });

  useEffect(() => {
    localStorage.setItem('userType', userType);
  }, [userType]);

  useEffect(() => {
    initTelegramWebApp();
    
    if (window.Telegram?.WebApp) {
      const tg = window.Telegram.WebApp;
      tg.ready();
      tg.expand();
      
      const userData = tg.initDataUnsafe?.user;
      if (userData) {
        setUser({
          id: userData.id,
          firstName: userData.first_name,
          lastName: userData.last_name,
          username: userData.username
        });
      }
    }
  }, []);

  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={
            <Layout>
              {userType === 'passenger' ? (
                <PassengerOrder user={user} />
              ) : (
                <DriverPanel user={user} />
              )}
            </Layout>
          } />
          
          <Route path="/my-orders" element={
            <Layout>
              <MyOrders user={user} userType={userType} />
            </Layout>
          } />
          
          <Route path="/profile" element={
            <Layout>
              <Profile user={user} userType={userType} setUserType={setUserType} />
            </Layout>
          } />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
