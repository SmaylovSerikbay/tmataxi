import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import io from 'socket.io-client';
import { 
  registerDriver, 
  getDriver, 
  setDriverStatus, 
  getAvailableOrders, 
  acceptOrder, 
  rejectOrder 
} from '../utils/api';
import { getTelegramUser } from '../utils/telegram';

const API_URL = process.env.REACT_APP_API_URL?.replace('/api', '') || (process.env.NODE_ENV === 'production' ? '' : 'http://localhost:3000');

function DriverPanel({ user }) {
  const navigate = useNavigate();
  const [driver, setDriver] = useState(null);
  const [isOnline, setIsOnline] = useState(false);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    carModel: '',
    carNumber: ''
  });
  // eslint-disable-next-line no-unused-vars
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    const tgUser = getTelegramUser();
    if (!tgUser) {
      alert('Ошибка: не удалось получить данные пользователя');
      navigate('/');
      return;
    }

    loadDriverData(tgUser.id.toString());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (driver && isOnline) {
      // Подключаемся к Socket.io
      const newSocket = io(API_URL);
      newSocket.emit('driver-online', driver.id || driver._id);
      
      newSocket.on('new-order', (order) => {
        setOrders(prev => [order, ...prev]);
      });

      setSocket(newSocket);

      return () => {
        newSocket.disconnect();
      };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [driver, isOnline]);

  useEffect(() => {
      if (isOnline && driver) {
        loadAvailableOrders();
        const interval = setInterval(loadAvailableOrders, 10000);
        return () => clearInterval(interval);
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOnline, driver]);

  const loadDriverData = async (telegramId) => {
    try {
      const driverData = await getDriver(telegramId);
      setDriver(driverData);
      setIsOnline(driverData.isOnline);
      setFormData({
        name: driverData.name || '',
        phone: driverData.phone || '',
        carModel: driverData.carModel || '',
        carNumber: driverData.carNumber || ''
      });
    } catch (error) {
      if (error.response?.status === 404) {
        // Таксист не зарегистрирован - имя и телефон будут из Telegram
        setFormData({
          name: '',
          phone: '',
          carModel: '',
          carNumber: ''
        });
      }
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

  const handleRegister = async (e) => {
    e.preventDefault();
    setRegistering(true);

    try {
      const tgUser = getTelegramUser();
      if (!tgUser) {
        alert('Ошибка: не удалось получить данные пользователя');
        return;
      }
      
      // Автоматически используем данные из Telegram
      const driverData = await registerDriver(
        tgUser.id.toString(),
        `${tgUser.first_name} ${tgUser.last_name || ''}`.trim(),
        tgUser.phone_number || '',
        formData.carModel,
        formData.carNumber
      );
      setDriver(driverData);
    } catch (error) {
      console.error('Error registering driver:', error);
      alert('Ошибка: ' + (error.response?.data?.error || error.message));
    } finally {
      setRegistering(false);
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
      alert('Заказ принят!');
      navigate('/my-orders');
    } catch (error) {
      console.error('Error accepting order:', error);
      alert('Ошибка при принятии заказа: ' + (error.response?.data?.error || error.message));
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
      <div className="container" style={{ padding: '20px', textAlign: 'center', color: 'var(--hint-color)' }}>
        <p>Загрузка...</p>
      </div>
    );
  }

  if (!driver) {
    return (
      <div>
        <div className="page-header">
          <button className="btn-back" onClick={() => navigate('/')}>← Назад</button>
          <h2>Автомобиль</h2>
          <div style={{ width: '60px' }}></div>
        </div>

        <form onSubmit={handleRegister} className="form-section">
          <div className="input-group">
            <label>Модель</label>
            <input
              type="text"
              value={formData.carModel}
              onChange={(e) => setFormData({ ...formData, carModel: e.target.value })}
              required
              placeholder="Toyota Camry"
              autoFocus
            />
          </div>
          <div className="input-group">
            <label>Номер</label>
            <input
              type="text"
              value={formData.carNumber}
              onChange={(e) => setFormData({ ...formData, carNumber: e.target.value.toUpperCase() })}
              required
              placeholder="А123БВ777"
              maxLength="9"
            />
          </div>
          <button type="submit" className="btn btn-primary" disabled={registering}>
            {registering ? 'Сохранение...' : 'Сохранить'}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <button className="btn-back" onClick={() => navigate('/')}>← Назад</button>
        <h2>Таксист</h2>
        <div style={{ width: '60px' }}></div>
      </div>

      <div className="form-section">
        <h3>Водитель</h3>
        <div className="menu-item" style={{ flexDirection: 'column', alignItems: 'flex-start', padding: '12px 16px' }}>
          <div style={{ fontWeight: 600, fontSize: '17px', color: 'var(--text-color)' }}>{driver.name || driver.name}</div>
          <div style={{ color: 'var(--hint-color)', fontSize: '13px', marginTop: '4px' }}>{driver.carModel || driver.car_model} • {driver.carNumber || driver.car_number}</div>
          <div style={{ color: 'var(--hint-color)', fontSize: '13px' }}>{driver.phone}</div>
        </div>
      </div>

      <div className="form-section">
        <h3>Статус</h3>
        <button
          className={`btn ${isOnline ? 'btn-online' : 'btn-offline'}`}
          onClick={handleToggleOnline}
          style={{ justifyContent: 'center' }}
        >
          {isOnline ? '🟢 Вы онлайн' : '🔴 Вы офлайн'}
        </button>
      </div>

      {isOnline && (
        <div className="orders-list">
          <div className="section-header">Доступные заказы</div>
          {orders.length === 0 ? (
            <div className="no-orders">
              <p>Нет доступных заказов</p>
            </div>
          ) : (
            orders.map(order => (
              <div key={order._id || order.id} className="order-card">
                <div className="order-header">
                  <span className="order-price">{order.price} ₽</span>
                  <span className={`status-badge status-${order.status}`}>
                    {order.status === 'pending' ? 'Ожидает' : order.status}
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
                <div className="order-info">
                  <strong>Пассажиров:</strong> {order.passengersCount || order.passengers_count}
                </div>
                {order.luggage && (
                  <div className="order-info">Есть багаж</div>
                )}
                {order.comment && (
                  <div className="order-info">
                    <strong>Комментарий:</strong> {order.comment}
                  </div>
                )}
                {order.status === 'pending' && (
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
                      Отклонить
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      <div className="form-section">
        <button className="btn" onClick={() => navigate('/my-orders')}>
          Мои заказы
        </button>
      </div>
    </div>
  );
}

export default DriverPanel;
