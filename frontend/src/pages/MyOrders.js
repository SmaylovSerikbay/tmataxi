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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userType]);

  const loadOrders = async () => {
    try {
      const tgUser = getTelegramUser();
      if (!tgUser) {
        navigate('/');
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
          console.error('Error loading driver orders:', error);
        }
      } else {
        try {
          const passengerId = localStorage.getItem('passengerId');
          if (passengerId) {
            ordersData = await getPassengerOrders(passengerId);
          }
        } catch (error) {
          console.error('Error loading passenger orders:', error);
        }
      }

      setOrders(ordersData);
    } catch (error) {
      console.error('Error loading orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'pending': return 'Ожидает';
      case 'accepted': return 'Принят';
      case 'rejected': return 'Отклонен';
      case 'in-progress': return 'В пути';
      case 'completed': return 'Завершен';
      case 'cancelled': return 'Отменен';
      default: return status;
    }
  };

  const getStatusClass = (status) => {
    switch (status) {
      case 'pending': return 'status-pending';
      case 'accepted': return 'status-accepted';
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
        <button className="btn-back" onClick={() => navigate('/')}>Назад</button>
        <h2>Мои заказы</h2>
        <div style={{ width: '40px' }}></div>
      </div>

      {orders.length === 0 ? (
        <div className="no-orders">
          <p>У вас пока нет активных заказов</p>
          <div className="form-section">
            <button className="btn btn-primary" onClick={() => navigate(userType === 'driver' ? '/driver' : '/order')}>
              {userType === 'driver' ? 'Перейти в панель таксиста' : 'Создать новый заказ'}
            </button>
          </div>
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
                <strong>Откуда:</strong> {order.from?.city || order.from_city}, {order.from?.address || order.from_address}
              </div>
              <div className="order-info">
                <strong>Куда:</strong> {order.to?.city || order.to_city}, {order.to?.address || order.to_address}
              </div>
              <div className="order-info">
                <strong>Дата:</strong> {new Date(order.date).toLocaleString('ru-RU')}
              </div>
              {order.driver && (
                <div className="order-info">
                  <strong>Таксист:</strong> {order.driver.name} ({order.driver.carModel || order.driver.car_model}, {order.driver.carNumber || order.driver.car_number})
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
