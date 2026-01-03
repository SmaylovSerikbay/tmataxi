import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getPassengerOrders, getDriverOrders, getDriver } from '../utils/api';
import { getTelegramUser } from '../utils/telegram';

function MyOrders({ user, userType }) {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOrders();
    const interval = setInterval(loadOrders, 15000); // Auto-refresh every 15s
    return () => clearInterval(interval);
  }, [userType]);

  const loadOrders = async () => {
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

      // Sort by date desc
      ordersData.sort((a, b) => new Date(b.date) - new Date(a.date));
      setOrders(ordersData);
    } catch (error) {
      console.error('Error loading orders:', error);
    } finally {
      setLoading(false);
    }
  };

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
      case 'completed': return 'status-completed'; // Add css for this
      default: return '';
    }
  };

  if (loading) {
    return (
      <div className="container" style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--hint-color)' }}>
        <p>Загрузка...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <h2>{userType === 'driver' ? 'Взятые заказы' : 'Мои поездки'}</h2>
      </div>

      {orders.length === 0 ? (
        <div className="no-orders" style={{ marginTop: 100 }}>
          <p>История заказов пуста</p>
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
              <div className="order-info">
                <strong>Куда:</strong> {order.to?.city || order.to_city}
              </div>
              <div className="order-info">
                <strong>Дата:</strong> {new Date(order.date).toLocaleString('ru-RU', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </div>
              
              {userType === 'passenger' && order.driver && (
                <div className="driver-info-box" style={{ marginTop: 10, padding: 8, background: 'rgba(255,255,255,0.05)', borderRadius: 8 }}>
                  <div style={{ fontWeight: 600 }}>🚕 Вас везет: {order.driver.name}</div>
                  <div style={{ fontSize: 13, color: 'var(--hint-color)' }}>
                    {order.driver.carModel} • {order.driver.carNumber}
                  </div>
                  <a href={`tel:${order.driver.phone}`} style={{ display: 'block', marginTop: 5, color: '#34C759', textDecoration: 'none' }}>
                    📞 Позвонить водителю
                  </a>
                </div>
              )}

              {userType === 'driver' && (
                 <div className="driver-info-box" style={{ marginTop: 10 }}>
                    <a href={`tel:${order.phone}`} style={{ color: '#34C759', textDecoration: 'none' }}>
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
