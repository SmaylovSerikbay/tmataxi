import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';
import { 
  getDriver, 
  setDriverStatus, 
  getAvailableOrders, 
  acceptOrder, 
  rejectOrder 
} from '../utils/api';
import { getTelegramUser } from '../utils/telegram';

const API_URL = process.env.REACT_APP_API_URL?.replace('/api', '') || (process.env.NODE_ENV === 'production' ? '' : 'http://localhost:3000');

function DriverPanel({ user }) {
  const [driver, setDriver] = useState(null);
  const [isOnline, setIsOnline] = useState(false);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  // eslint-disable-next-line no-unused-vars
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    const tgUser = getTelegramUser();
    if (!tgUser) {
      setLoading(false);
      return;
    }
    loadDriverData(tgUser.id.toString());
  }, []);

  useEffect(() => {
    if (driver && isOnline) {
      const newSocket = io(API_URL);
      newSocket.emit('driver-online', driver.id || driver._id);
      
      newSocket.on('new-order', (order) => {
        setOrders(prev => [order, ...prev]);
        if (window.Telegram?.WebApp) {
           window.Telegram.WebApp.HapticFeedback.notificationOccurred('success');
        }
      });

      setSocket(newSocket);
      return () => newSocket.disconnect();
    }
  }, [driver, isOnline]);

  useEffect(() => {
    if (isOnline && driver) {
      loadAvailableOrders();
      const interval = setInterval(loadAvailableOrders, 10000);
      return () => clearInterval(interval);
    }
  }, [isOnline, driver]);

  const loadDriverData = async (telegramId) => {
    try {
      const driverData = await getDriver(telegramId);
      setDriver(driverData);
      setIsOnline(driverData.isOnline);
    } catch (error) {
      console.log("Driver not found or error", error);
    } finally {
      setLoading(false);
    }
  };

  const loadAvailableOrders = async () => {
    try {
      const availableOrders = await getAvailableOrders();
      setOrders(availableOrders);
    } catch (error) {
      console.error('Error loading orders:', error);
    }
  };

  const handleToggleOnline = async () => {
    try {
      const newStatus = !isOnline;
      await setDriverStatus(driver.id || driver._id, newStatus);
      setIsOnline(newStatus);
      if (window.Telegram?.WebApp) {
        window.Telegram.WebApp.HapticFeedback.impactOccurred('medium');
      }
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Ошибка при изменении статуса');
    }
  };

  const handleAcceptOrder = async (orderId) => {
    try {
      await acceptOrder(orderId, driver.id || driver._id);
      setOrders(prev => prev.filter(order => order._id !== orderId));
      if (window.Telegram?.WebApp) {
         window.Telegram.WebApp.showAlert('Заказ принят! Перейдите в "Заказы" для деталей.');
         window.Telegram.WebApp.HapticFeedback.notificationOccurred('success');
      } else {
         alert('Заказ принят!');
      }
    } catch (error) {
      console.error('Error accepting order:', error);
      alert('Ошибка: ' + (error.response?.data?.error || error.message));
    }
  };

  const handleRejectOrder = async (orderId) => {
    try {
      await rejectOrder(orderId);
      setOrders(prev => prev.filter(order => order._id !== orderId));
    } catch (error) {
      console.error('Error rejecting order:', error);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '48px 20px', textAlign: 'center', color: 'var(--hint-color)' }}>
        <p style={{ fontSize: '17px', fontWeight: '400' }}>Загрузка...</p>
      </div>
    );
  }

  if (!driver) {
    return (
      <div>
        <div className="page-header">
          <h2>Лента заказов</h2>
        </div>
        <div style={{ padding: '48px 20px', textAlign: 'center' }}>
          <p style={{ fontSize: '17px', color: 'var(--hint-color)', marginBottom: '16px' }}>
            Вы не зарегистрированы как водитель
          </p>
          <p style={{ fontSize: '15px', color: 'var(--hint-color)' }}>
            Перейдите в профиль, чтобы зарегистрироваться
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <h2>Лента заказов</h2>
        <button
          className={`btn ${isOnline ? 'btn-online' : 'btn-offline'}`}
          onClick={handleToggleOnline}
          style={{ 
            padding: '8px 16px', 
            fontSize: '15px', 
            height: 'auto', 
            minHeight: '36px',
            width: 'auto',
            borderRadius: '18px',
            fontWeight: '600',
            margin: 0
          }}
        >
          {isOnline ? '🟢 Онлайн' : '🔴 Офлайн'}
        </button>
      </div>

      {!isOnline && (
        <div className="no-orders" style={{ marginTop: '48px' }}>
          <p style={{ fontSize: '17px', marginBottom: '8px' }}>Вы офлайн</p>
          <p style={{ fontSize: '15px', color: 'var(--hint-color)' }}>
            Включите статус "Онлайн", чтобы видеть заказы
          </p>
        </div>
      )}

      {isOnline && (
        <div className="orders-list">
          {orders.length === 0 ? (
            <div className="no-orders" style={{ marginTop: '48px' }}>
              <p style={{ fontSize: '17px' }}>Поиск заказов...</p>
            </div>
          ) : (
            orders.map(order => (
              <div key={order._id || order.id} className="order-card">
                <div className="order-header">
                  <span className="order-price">
                    {order.price} {order.currency === 'UZS' ? 'сум' : '₸'}
                  </span>
                  <span className="status-badge status-pending">
                    {new Date(order.date).toLocaleTimeString('ru-RU', {hour: '2-digit', minute:'2-digit'})}
                  </span>
                </div>
                
                <div className="order-info">
                  <strong>Откуда:</strong> {order.from?.city || order.from_city}
                </div>
                <div className="order-info" style={{ marginBottom: '4px' }}>
                  {order.from?.address || order.from_address}
                </div>
                
                <div className="order-info">
                  <strong>Куда:</strong> {order.to?.city || order.to_city}
                </div>
                <div className="order-info" style={{ marginBottom: '12px' }}>
                  {order.to?.address || order.to_address}
                </div>
                
                <div style={{ 
                  display: 'flex', 
                  gap: '12px', 
                  alignItems: 'center',
                  padding: '12px',
                  background: 'rgba(255, 255, 255, 0.03)',
                  borderRadius: '8px',
                  marginBottom: '16px'
                }}>
                  <span style={{ fontSize: '15px', color: 'var(--hint-color)' }}>
                    👥 {order.passengersCount || order.passengers_count} пас.
                  </span>
                  {order.luggage && (
                    <span style={{ fontSize: '15px', color: 'var(--hint-color)' }}>
                      🧳 Багаж
                    </span>
                  )}
                </div>
                
                {order.comment && (
                  <div className="order-info" style={{ 
                    fontStyle: 'italic', 
                    color: 'var(--hint-color)',
                    padding: '12px',
                    background: 'rgba(255, 255, 255, 0.03)',
                    borderRadius: '8px',
                    marginBottom: '16px'
                  }}>
                    "{order.comment}"
                  </div>
                )}
                
                <div className="order-actions">
                  <button
                    className="btn btn-accept"
                    onClick={() => handleAcceptOrder(order._id || order.id)}
                  >
                    Принять
                  </button>
                  <button
                    className="btn btn-reject"
                    onClick={() => handleRejectOrder(order._id || order.id)}
                  >
                    Скрыть
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

export default DriverPanel;
