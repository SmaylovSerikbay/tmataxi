import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { initTelegramWebApp } from './utils/telegram';
import Home from './pages/Home';
import PassengerOrder from './pages/PassengerOrder';
import DriverPanel from './pages/DriverPanel';
import MyOrders from './pages/MyOrders';
import './App.css';

function App() {
  const [user, setUser] = useState(null);
  const [userType, setUserType] = useState(null); // 'passenger' or 'driver'

  useEffect(() => {
    initTelegramWebApp();
    
    // Получаем данные пользователя из Telegram
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
          <Route path="/" element={<Home user={user} userType={userType} setUserType={setUserType} />} />
          <Route path="/order" element={<PassengerOrder user={user} />} />
          <Route path="/driver" element={<DriverPanel user={user} />} />
          <Route path="/my-orders" element={<MyOrders user={user} userType={userType} />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;

