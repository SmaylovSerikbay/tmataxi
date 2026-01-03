import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getPassengerOrders, getDriverOrders, getDriver } from '../utils/api';
import { getTelegramUser } from '../utils/telegram';
import './MyOrders.css';

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
        // Пока используем временное решение - получаем все заказы и фильтруем
        // В реальном приложении нужно сохранять passengerId после регистрации
        try {
          // Пытаемся получить passengerId из localStorage
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
      <div className="container">
        <p>Загрузка...</p>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="page-header">
        <h2>Мои заказы</h2>
        <button className="btn-back" onClick={() => navigate('/')}>← Назад</button>
      </div>

      {orders.length === 0 ? (
        <div className="no-orders">
          <p>У вас пока нет заказов</p>
          <button className="btn" onClick={() => navigate(userType === 'driver' ? '/driver' : '/order')}>
            {userType === 'driver' ? 'Перейти в панель таксиста' : 'Создать заказ'}
          </button>
        </div>
      ) : (
        <div className="orders-list">
          {orders.map(order => (
            <div key={order._id} className="order-card">
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
                <strong>📍 Откуда:</strong> {order.from.city}, {order.from.address}
              </div>
              <div className="order-info">
                <strong>📍 Куда:</strong> {order.to.city}, {order.to.address}
              </div>
              <div className="order-info">
                <strong>📅 Дата:</strong> {new Date(order.date).toLocaleString('ru-RU')}
              </div>
              {order.driver && (
                <div className="order-info">
                  <strong>🚗 Таксист:</strong> {order.driver.name} ({order.driver.carModel}, {order.driver.carNumber})
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

