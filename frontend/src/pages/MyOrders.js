import React, { useState, useEffect, useCallback } from 'react';
// eslint-disable-next-line no-unused-vars
import { useNavigate } from 'react-router-dom';
import { getPassengerOrders, getDriverOrders, getDriver } from '../utils/api';
import { getTelegramUser } from '../utils/telegram';

function MyOrders({ user, userType }) {
  // eslint-disable-next-line no-unused-vars
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadOrders = useCallback(async () => {
    try {
      const tgUser = getTelegramUser();
      if (!tgUser) {
        setLoading(false);
        return;
      }

      let ordersData = [];
      if (userType === 'driver') {
        try {
          const driver = await getDriver(tgUser.id.toString());
          if (driver && driver._id) {
            ordersData = await getDriverOrders(driver._id);
          }
        } catch (error) {
          console.log('Driver check failed', error);
        }
      } else {
        try {
          const passengerId = localStorage.getItem('passengerId');
          if (passengerId) {
            ordersData = await getPassengerOrders(passengerId);
          }
        } catch (error) {
          console.error('Passenger orders failed', error);
        }
      }

      ordersData.sort((a, b) => new Date(b.date) - new Date(a.date));
      setOrders(ordersData);
    } catch (error) {
      console.error('Error loading orders:', error);
    } finally {
      setLoading(false);
    }
  }, [userType]);

  useEffect(() => {
    loadOrders();
    const interval = setInterval(loadOrders, 15000);
    return () => clearInterval(interval);
  }, [loadOrders]);

  const getStatusText = (status) => {
    switch (status) {
      case 'pending': return '⏳ Поиск водителя';
      case 'accepted': return '✅ Водитель найден';
      case 'rejected': return '❌ Отменен';
      case 'in-progress': return '🚖 В пути';
      case 'completed': return '🏁 Завершен';
      case 'cancelled': return '⛔ Отменен';
      default: return status;
    }
  };

  const getStatusClass = (status) => {
    switch (status) {
      case 'pending': return 'status-pending';
      case 'accepted': return 'status-accepted';
      case 'completed': return 'status-completed';
      default: return '';
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '48px 20px', textAlign: 'center', color: 'var(--hint-color)' }}>
        <p style={{ fontSize: '15px', fontWeight: '400' }}>Загрузка...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <h2>{userType === 'driver' ? 'Взятые заказы' : 'Мои поездки'}</h2>
      </div>

      {orders.length === 0 ? (
        <div className="no-orders">
          <p style={{ fontSize: '15px', marginBottom: '8px' }}>История заказов пуста</p>
          <p style={{ fontSize: '14px' }}>
            {userType === 'driver' ? 'Принимайте заказы в ленте' : 'Создайте новый заказ'}
          </p>
        </div>
      ) : (
        <div className="orders-list">
          {orders.map(order => (
            <div key={order._id || order.id} className="order-card">
              <div className="order-header">
                <span className="order-price">
                  {order.price} {order.currency === 'UZS' ? 'сум' : '₸'}
                </span>
                <span className={`status-badge ${getStatusClass(order.status)}`}>
                  {getStatusText(order.status)}
                </span>
              </div>
              
              <div className="order-info">
                <strong>Откуда:</strong> {order.from?.city || order.from_city}
              </div>
              <div className="order-info" style={{ marginBottom: '4px', paddingLeft: '12px' }}>
                {order.from?.address || order.from_address}
              </div>
              
              <div className="order-info">
                <strong>Куда:</strong> {order.to?.city || order.to_city}
              </div>
              <div className="order-info" style={{ marginBottom: '12px', paddingLeft: '12px' }}>
                {order.to?.address || order.to_address}
              </div>
              
              <div className="order-info" style={{ 
                fontSize: '14px', 
                color: 'var(--hint-color)',
                marginBottom: '12px'
              }}>
                {new Date(order.date).toLocaleString('ru-RU', { 
                  month: 'short', 
                  day: 'numeric', 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}
              </div>
              
              {userType === 'passenger' && order.driver && (
                <div className="driver-info-box">
                  <div style={{ fontWeight: '500', marginBottom: '8px', fontSize: '15px' }}>
                    🚕 Вас везет: {order.driver.name}
                  </div>
                  <div style={{ fontSize: '14px', color: 'var(--hint-color)', marginBottom: '12px' }}>
                    {order.driver.carModel || order.driver.car_model} • {order.driver.carNumber || order.driver.car_number}
                  </div>
                  <a 
                    href={`tel:${order.driver.phone}`} 
                    style={{ 
                      display: 'inline-block',
                      fontSize: '14px',
                      fontWeight: '500',
                      color: '#4CAF50',
                      textDecoration: 'none',
                      padding: '8px 12px',
                      background: 'rgba(76, 175, 80, 0.15)',
                      borderRadius: '8px'
                    }}
                  >
                    📞 Позвонить водителю
                  </a>
                </div>
              )}

              {userType === 'driver' && order.phone && (
                <div className="driver-info-box">
                  <a 
                    href={`tel:${order.phone}`} 
                    style={{ 
                      display: 'inline-block',
                      fontSize: '14px',
                      fontWeight: '500',
                      color: '#4CAF50',
                      textDecoration: 'none',
                      padding: '8px 12px',
                      background: 'rgba(76, 175, 80, 0.15)',
                      borderRadius: '8px'
                    }}
                  >
                    📞 Позвонить пассажиру
                  </a>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default MyOrders;
