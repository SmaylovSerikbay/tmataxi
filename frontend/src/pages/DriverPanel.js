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

  const openMaps = (order) => {
    const from = `${order.from?.city || order.from_city || ''} ${order.from?.address || order.from_address || ''}`.trim();
    const to = `${order.to?.city || order.to_city || ''} ${order.to?.address || order.to_address || ''}`.trim();
    const q = encodeURIComponent(`${from} -> ${to}`.trim());
    const url = `https://www.google.com/maps/search/?api=1&query=${q}`;
    if (window.Telegram?.WebApp?.openLink) {
      window.Telegram.WebApp.openLink(url);
    } else {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

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
      <div className="ds-empty">
        <div className="ds-emptyTitle">Загрузка…</div>
        <div className="ds-emptyText">Подготавливаем ленту заказов</div>
      </div>
    );
  }

  if (!driver) {
    return (
      <div>
        <div className="page-header">
          <h2>Заказы</h2>
        </div>
        <div className="ds-empty">
          <div className="ds-emptyTitle">Вы не зарегистрированы как водитель</div>
          <div className="ds-emptyText">Откройте «Профиль» → «Стать водителем»</div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <h2>Заказы</h2>
        <div className="ds-right">
          <button
            className={`ds-pill ${isOnline ? 'ds-pillOn' : 'ds-pillOff'}`}
            onClick={handleToggleOnline}
          >
            {isOnline ? 'Онлайн' : 'Офлайн'}
          </button>
        </div>
      </div>

      {!isOnline && (
        <div className="ds-empty">
          <div className="ds-emptyTitle">Вы офлайн</div>
          <div className="ds-emptyText">Включите «Онлайн», чтобы получать новые заказы</div>
        </div>
      )}

      {isOnline && (
        <div className="ds-section">
          <div className="ds-sectionTitle">Доступные</div>
          {orders.length === 0 ? (
            <div className="ds-empty">
              <div className="ds-emptyTitle">Ищем заказы…</div>
              <div className="ds-emptyText">Обновляется автоматически</div>
            </div>
          ) : (
            <div className="ds-stack">
              {orders.map((order) => {
                const currencyLabel = order.currency === 'UZS' ? 'сум' : '₸';
                const passengers = order.passengersCount || order.passengers_count;
                const timeLabel = new Date(order.date).toLocaleTimeString('ru-RU', {
                  hour: '2-digit',
                  minute: '2-digit',
                });

                return (
                  <div key={order._id || order.id} className="ds-card ds-cardFlat">
                    <div className="ds-orderMeta">
                      <div className="ds-price">
                        {order.price} {currencyLabel}
                      </div>
                      <div className="ds-badge ds-badgeWarn">{timeLabel}</div>
                    </div>

                    <div className="ds-cardPad">
                      <div className="ds-routeTitle">
                        {order.from?.city || order.from_city}
                        <span className="ds-routeArrow">→</span>
                        {order.to?.city || order.to_city}
                      </div>
                      <div className="ds-routeSub">
                        {(order.from?.address || order.from_address) ?? '—'} • {(order.to?.address || order.to_address) ?? '—'}
                      </div>
                    </div>

                    <div className="ds-mutedBox">
                      👥 {passengers} • {order.luggage ? '🧳 багаж' : 'без багажа'}
                    </div>

                    {order.comment && <div className="ds-mutedBox">“{order.comment}”</div>}

                    <div className="ds-actions">
                      <button className="ds-btn ds-btnSuccess" onClick={() => handleAcceptOrder(order._id || order.id)}>
                        Принять
                      </button>
                    <button className="ds-btn ds-btnGhost" type="button" onClick={() => openMaps(order)}>
                      Маршрут
                    </button>
                    <button className="ds-btn ds-btnDanger" onClick={() => handleRejectOrder(order._id || order.id)}>
                      Скрыть
                    </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default DriverPanel;
