import React, { useState, useEffect, useCallback } from 'react';
import { getPassengerOrders, getDriverOrders, getDriver } from '../utils/api';
import { getTelegramUser } from '../utils/telegram';

function MyOrders({ user, userType }) {
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

  if (loading) {
    return (
      <div className="ds-empty">
        <div className="ds-emptyTitle">Загрузка…</div>
        <div className="ds-emptyText">Обновляем список заказов</div>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <h2>{userType === 'driver' ? 'Мои заказы' : 'Мои поездки'}</h2>
      </div>

      {orders.length === 0 ? (
        <div className="ds-empty">
          <div className="ds-emptyTitle">Пока пусто</div>
          <div className="ds-emptyText">
            {userType === 'driver' ? 'Принимайте заказы в ленте' : 'Создайте новый заказ на главной'}
          </div>
        </div>
      ) : (
        <div className="ds-section">
          <div className="ds-sectionTitle">История</div>
          <div className="ds-stack">
            {orders.map((order) => {
              const currencyLabel = order.currency === 'UZS' ? 'сум' : '₸';
              const badgeClass =
                order.status === 'accepted'
                  ? 'ds-badgeOk'
                  : order.status === 'pending'
                    ? 'ds-badgeWarn'
                    : '';

              const when = new Date(order.date).toLocaleString('ru-RU', {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              });

              const fromCity = order.from?.city || order.from_city;
              const fromAddr = order.from?.address || order.from_address;
              const toCity = order.to?.city || order.to_city;
              const toAddr = order.to?.address || order.to_address;

              return (
                <div key={order._id || order.id} className="ds-card ds-cardFlat">
                  <div className="ds-orderMeta">
                    <div className="ds-price">
                      {order.price} {currencyLabel}
                    </div>
                    <div className={`ds-badge ${badgeClass}`}>{getStatusText(order.status)}</div>
                  </div>

                  <div className="ds-row">
                    <div className="ds-rowLabel">Откуда</div>
                    <div className="ds-rowValue">
                      {fromCity}
                      {fromAddr ? `, ${fromAddr}` : ''}
                    </div>
                  </div>
                  <div className="ds-row">
                    <div className="ds-rowLabel">Куда</div>
                    <div className="ds-rowValue">
                      {toCity}
                      {toAddr ? `, ${toAddr}` : ''}
                    </div>
                  </div>

                  <div className="ds-mutedBox">🕒 {when}</div>

                  {userType === 'passenger' && order.driver && (
                    <div className="ds-mutedBox">
                      <div>
                        🚕 {order.driver.name} • {order.driver.carModel || order.driver.car_model} •{' '}
                        {order.driver.carNumber || order.driver.car_number}
                      </div>
                      {order.driver.phone && (
                        <div className="ds-mt2">
                          <a className="ds-link" href={`tel:${order.driver.phone}`}>
                            Позвонить водителю
                          </a>
                        </div>
                      )}
                    </div>
                  )}

                  {userType === 'driver' && order.phone && (
                    <div className="ds-mutedBox">
                      <a className="ds-link" href={`tel:${order.phone}`}>
                        Позвонить пассажиру
                      </a>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default MyOrders;
