import React, { useState, useEffect } from 'react';
import { createOrder, registerPassenger } from '../utils/api';
import { getTelegramUser } from '../utils/telegram';

function PassengerOrder({ user }) {
  const [loading, setLoading] = useState(false);
  const [currency, setCurrency] = useState('KZT'); 
  const [formData, setFormData] = useState({
    fromCity: '',
    fromAddress: '',
    toCity: '',
    toAddress: '',
    date: new Date().toISOString().split('T')[0],
    time: '12:00',
    passengersCount: 1,
    luggage: false,
    phone: '',
    comment: '',
    price: ''
  });

  useEffect(() => {
    const tgUser = getTelegramUser();
    if (tgUser && window.Telegram?.WebApp) {
      const tg = window.Telegram.WebApp;
      if (tg.initDataUnsafe?.user?.phone_number) {
        setFormData(prev => ({ ...prev, phone: tg.initDataUnsafe.user.phone_number }));
      }
    }
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const toggleCurrency = () => {
    setCurrency(prev => prev === 'KZT' ? 'UZS' : 'KZT');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const tgUser = getTelegramUser();
      if (!tgUser) {
        alert('Ошибка: Запустите приложение через Telegram');
        return;
      }

      const phoneToSubmit = formData.phone || `@${tgUser.username}` || 'No Phone';

      const passenger = await registerPassenger(
        tgUser.id.toString(),
        `${tgUser.first_name} ${tgUser.last_name || ''}`.trim(),
        phoneToSubmit
      );

      localStorage.setItem('passengerId', passenger.id || passenger._id);

      const orderDate = new Date(`${formData.date}T${formData.time}`);
      await createOrder({
        passengerId: passenger.id || passenger._id,
        from: {
          city: formData.fromCity,
          address: formData.fromAddress
        },
        to: {
          city: formData.toCity,
          address: formData.toAddress
        },
        date: orderDate.toISOString(),
        passengersCount: parseInt(formData.passengersCount),
        luggage: formData.luggage,
        phone: phoneToSubmit,
        comment: formData.comment,
        price: parseFloat(formData.price),
        currency: currency
      });

      if (window.Telegram?.WebApp) {
        window.Telegram.WebApp.HapticFeedback.notificationOccurred('success');
        window.Telegram.WebApp.showAlert('Заказ создан успешно!');
      } else {
        alert('Заказ создан!');
      }
      
      // Reset form
      setFormData(prev => ({
        ...prev,
        fromCity: '',
        fromAddress: '',
        toCity: '',
        toAddress: '',
        price: '',
        comment: ''
      }));
      
    } catch (error) {
      console.error('Error creating order:', error);
      if (window.Telegram?.WebApp) {
        window.Telegram.WebApp.HapticFeedback.notificationOccurred('error');
      }
      alert('Ошибка: ' + (error.response?.data?.error || error.message));
    } finally {
      setLoading(false);
    }
  };

  const currencySymbol = currency === 'KZT' ? '₸' : 'сум';

  return (
    <div>
      <div className="page-header">
        <h2>Новый заказ</h2>
      </div>

      <form onSubmit={handleSubmit} className="order-form">
        <div className="form-section">
          <h3>Маршрут</h3>
          <div className="input-group">
            <label>Откуда</label>
            <input
              type="text"
              name="fromCity"
              value={formData.fromCity}
              onChange={handleChange}
              required
              placeholder="Город отправления"
            />
          </div>
          <div className="input-group">
            <label>Адрес</label>
            <input
              type="text"
              name="fromAddress"
              value={formData.fromAddress}
              onChange={handleChange}
              required
              placeholder="Улица, дом"
            />
          </div>
          
          <div className="input-group">
            <label>Куда</label>
            <input
              type="text"
              name="toCity"
              value={formData.toCity}
              onChange={handleChange}
              required
              placeholder="Город назначения"
            />
          </div>
          <div className="input-group">
            <label>Адрес</label>
            <input
              type="text"
              name="toAddress"
              value={formData.toAddress}
              onChange={handleChange}
              required
              placeholder="Улица, дом"
            />
          </div>
        </div>

        <div className="form-section">
          <h3>Детали поездки</h3>
          <div className="input-group">
            <label>Дата</label>
            <input
              type="date"
              name="date"
              value={formData.date}
              onChange={handleChange}
              required
              min={new Date().toISOString().split('T')[0]}
            />
          </div>
          <div className="input-group">
            <label>Время</label>
            <input
              type="time"
              name="time"
              value={formData.time}
              onChange={handleChange}
              required
            />
          </div>
          
          <div className="input-group">
            <label>Пассажиров</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginLeft: 'auto' }}>
              <button 
                type="button" 
                onClick={() => setFormData(p => ({...p, passengersCount: Math.max(1, p.passengersCount - 1)}))} 
                style={{ 
                  width: '36px', 
                  height: '36px', 
                  borderRadius: '8px',
                  background: 'rgba(255, 255, 255, 0.1)',
                  color: 'var(--link-color)',
                  fontSize: '20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: 'none',
                  cursor: 'pointer',
                  fontWeight: '600'
                }}
              >
                −
              </button>
              <span style={{ fontSize: '17px', minWidth: '24px', textAlign: 'center', fontWeight: '600' }}>
                {formData.passengersCount}
              </span>
              <button 
                type="button" 
                onClick={() => setFormData(p => ({...p, passengersCount: Math.min(8, p.passengersCount + 1)}))} 
                style={{ 
                  width: '36px', 
                  height: '36px', 
                  borderRadius: '8px',
                  background: 'rgba(255, 255, 255, 0.1)',
                  color: 'var(--link-color)',
                  fontSize: '20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: 'none',
                  cursor: 'pointer',
                  fontWeight: '600'
                }}
              >
                +
              </button>
            </div>
          </div>

          <div className="checkbox-group">
            <input
              type="checkbox"
              name="luggage"
              checked={formData.luggage}
              onChange={handleChange}
            />
            <label>Нужен багажник</label>
          </div>
        </div>
        
        <div className="form-section">
          <h3>Стоимость</h3>
          <div className="input-group">
            <label>Валюта</label>
            <button 
              type="button" 
              onClick={toggleCurrency} 
              style={{ 
                marginLeft: 'auto',
                background: 'none',
                border: 'none',
                color: 'var(--link-color)',
                fontSize: '17px',
                fontWeight: '400',
                cursor: 'pointer',
                padding: 0
              }}
            >
              {currency === 'KZT' ? '₸ Тенге' : 'сум UZS'} ⇄
            </button>
          </div>
          <div className="input-group">
            <label>Ваша цена</label>
            <input
              type="number"
              name="price"
              value={formData.price}
              onChange={handleChange}
              required
              min="0"
              step="100"
              placeholder={`0 ${currencySymbol}`}
              style={{ fontWeight: '600', color: '#34C759', textAlign: 'right' }}
            />
          </div>
        </div>

        <div className="form-section">
          <div className="input-group textarea-group">
            <label>Комментарий</label>
            <textarea
              name="comment"
              value={formData.comment}
              onChange={handleChange}
              placeholder="Дополнительная информация (необязательно)"
              style={{ minHeight: '100px' }}
            />
          </div>
        </div>

        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? 'Создание...' : 'Создать заказ'}
        </button>
      </form>
    </div>
  );
}

export default PassengerOrder;
