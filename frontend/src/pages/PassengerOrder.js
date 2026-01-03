import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createOrder, registerPassenger } from '../utils/api';
import { getTelegramUser } from '../utils/telegram';

function PassengerOrder({ user }) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [currency, setCurrency] = useState('KZT'); // 'KZT' or 'UZS'
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
      tg.MainButton.text = "Создать заказ";
      tg.MainButton.show();
      
      tg.MainButton.onClick(() => {
         // We can't easily trigger form submit from outside, 
         // so we rely on the in-form button for now or use a ref.
         // Better to hide MainButton if we use in-app button, OR attach handler.
         // For now, let's just use our custom button to be safe and consistent.
         tg.MainButton.hide();
      });

      if (tg.initDataUnsafe?.user?.phone_number) {
        setFormData(prev => ({ ...prev, phone: tg.initDataUnsafe.user.phone_number }));
      }
    }
    
    // Auto-register check
    if (tgUser) {
      const autoRegister = async () => {
        try {
          await registerPassenger(
            tgUser.id.toString(),
            `${tgUser.first_name} ${tgUser.last_name || ''}`.trim(),
            tgUser.phone_number || ''
          );
        } catch (error) {
           // Ignore errors here, will handle on submit
        }
      };
      autoRegister();
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

      // 1. Ensure passenger exists
      const passenger = await registerPassenger(
        tgUser.id.toString(),
        `${tgUser.first_name} ${tgUser.last_name || ''}`.trim(),
        phoneToSubmit
      );

      localStorage.setItem('passengerId', passenger.id || passenger._id);

      // 2. Create Order
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

      // 3. Success feedback
      if (window.Telegram?.WebApp) {
        window.Telegram.WebApp.HapticFeedback.notificationOccurred('success');
      }
      navigate('/my-orders');
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
        <button className="btn-back" onClick={() => navigate('/')}>Назад</button>
        <h2>Новый заказ</h2>
        <div style={{ width: '40px' }}></div>
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
              placeholder="Город"
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
          
          {/* Separator / Arrow visual could go here */}
          
          <div className="input-group">
            <label>Куда</label>
            <input
              type="text"
              name="toCity"
              value={formData.toCity}
              onChange={handleChange}
              required
              placeholder="Город"
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
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <button type="button" onClick={() => setFormData(p => ({...p, passengersCount: Math.max(1, p.passengersCount - 1)}))} style={{ fontSize: '20px', padding: '0 10px', color: 'var(--link-color)' }}>−</button>
                <span style={{ fontSize: '17px', minWidth: '20px', textAlign: 'center' }}>{formData.passengersCount}</span>
                <button type="button" onClick={() => setFormData(p => ({...p, passengersCount: Math.min(8, p.passengersCount + 1)}))} style={{ fontSize: '20px', padding: '0 10px', color: 'var(--link-color)' }}>+</button>
            </div>
          </div>

          <div className="checkbox-group">
            <input
              type="checkbox"
              name="luggage"
              checked={formData.luggage}
              onChange={handleChange}
            />
            <label style={{ width: 'auto' }}>Нужен багажник</label>
          </div>
        </div>
        
        <div className="form-section">
           <h3>Стоимость</h3>
           <div className="input-group">
            <button type="button" onClick={toggleCurrency} style={{ textAlign: 'left', padding: 0, color: 'var(--link-color)', fontSize: '16px' }}>
              {currency === 'KZT' ? 'Валюта: Тенге (₸)' : 'Валюта: Сум (UZS)'}
            </button>
           </div>
           <div className="input-group">
            <label>Предложите цену</label>
            <input
              type="number"
              name="price"
              value={formData.price}
              onChange={handleChange}
              required
              min="0"
              step="100"
              placeholder={`0 ${currencySymbol}`}
              style={{ fontWeight: '600', color: '#34C759' }}
            />
          </div>
        </div>

        <div className="form-section">
          <div className="input-group textarea-group">
            <textarea
              name="comment"
              value={formData.comment}
              onChange={handleChange}
              placeholder="Комментарий к заказу (необязательно)"
              style={{ minHeight: '60px' }}
            />
          </div>
        </div>

        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? 'Создание...' : 'Создать заказ'}
        </button>
        <div style={{ height: '20px' }}></div>
      </form>
    </div>
  );
}

export default PassengerOrder;
