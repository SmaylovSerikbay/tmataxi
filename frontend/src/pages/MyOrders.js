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
        // Получаем информацию о таксисте по telegramId
        try {
          const driver = await getDriver(tgUser.id.toString());
          if (driver && driver._id) {
            ordersData = await getDriverOrders(driver._id);
          }
        } catch (error) {
          console.error('Error loading driver orders:', error);
        }
      } else {
        // Для пассажира нужно получить passengerId из localStorage или API
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

  if (loading) {
    return (
      <div className="container" style={{ padding: '20px', textAlign: 'center', color: 'var(--hint-color)' }}>
        <p>Загрузка...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <button className="btn-back" onClick={() => navigate('/')}>← Назад</button>
        <h2>Мои заказы</h2>
        <div style={{ width: '60px' }}></div>
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
                <span className="order-price">{order.price} ₽</span>
                <span className={`status-badge status-${order.status}`}>
                  {order.status === 'pending' && 'Ожидает'}
                  {order.status === 'accepted' && 'Принят'}
                  {order.status === 'rejected' && 'Отклонен'}
                  {order.status === 'in-progress' && 'В пути'}
                  {order.status === 'completed' && 'Завершен'}
                  {order.status === 'cancelled' && 'Отменен'}
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
