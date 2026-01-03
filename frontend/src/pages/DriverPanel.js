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
      // Filter out orders already accepted by others if API doesn't do it
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

  if (loading) return <div className="container"><p style={{textAlign:'center', marginTop:20}}>Загрузка...</p></div>;

  if (!driver) {
    return (
      <div style={{ padding: 20, textAlign: 'center' }}>
        <h3>Вы не зарегистрированы как водитель</h3>
        <p>Перейдите в профиль, чтобы зарегистрироваться.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <h2>Лента заказов</h2>
        <div style={{ marginLeft: 'auto' }}>
            <button
            className={`btn ${isOnline ? 'btn-online' : 'btn-offline'}`}
            onClick={handleToggleOnline}
            style={{ 
                padding: '4px 12px', 
                fontSize: '12px', 
                height: 'auto', 
                minHeight: '30px',
                width: 'auto',
                borderRadius: '15px'
            }}
            >
            {isOnline ? '🟢 Онлайн' : '🔴 Офлайн'}
            </button>
        </div>
      </div>

      {!isOnline && (
        <div className="no-orders" style={{ marginTop: 40 }}>
           <p>Вы офлайн. Включите статус "Онлайн", чтобы видеть заказы.</p>
        </div>
      )}

      {isOnline && (
        <div className="orders-list">
          {orders.length === 0 ? (
            <div className="no-orders" style={{ marginTop: 40 }}>
              <p>Поиск заказов...</p>
            </div>
          ) : (
            orders.map(order => (
              <div key={order._id || order.id} className="order-card">
                <div className="order-header">
                  <span className="order-price">{order.price} {order.currency || '₸'}</span>
                  <span className="status-badge">
                     {new Date(order.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                  </span>
                </div>
                <div className="order-info">
                  <strong>Откуда:</strong> {order.from?.city || order.from_city}
                </div>
                <div className="order-info">
                  <strong>Куда:</strong> {order.to?.city || order.to_city}
                </div>
                <div className="order-info">
                   {order.passengersCount} пас. {order.luggage ? '• 🧳 Багаж' : ''}
                </div>
                {order.comment && (
                  <div className="order-info" style={{ fontStyle: 'italic', marginTop: 4 }}>
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
