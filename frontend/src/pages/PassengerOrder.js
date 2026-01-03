import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createOrder, registerPassenger } from '../utils/api';
import { getTelegramUser } from '../utils/telegram';

function PassengerOrder({ user }) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    fromCity: '',
    fromAddress: '',
    toCity: '',
    toAddress: '',
    date: '',
    time: '',
    passengersCount: 1,
    luggage: false,
    phone: '',
    comment: '',
    price: ''
  });

  useEffect(() => {
    const tgUser = getTelegramUser();
    if (tgUser) {
      const autoRegister = async () => {
        try {
          await registerPassenger(
            tgUser.id.toString(),
            `${tgUser.first_name} ${tgUser.last_name || ''}`.trim(),
            tgUser.phone_number || ''
          );
        } catch (error) {
          console.error('Auto-register error:', error);
        }
      };
      autoRegister();
      
      if (window.Telegram?.WebApp) {
        const tg = window.Telegram.WebApp;
        if (tg.initDataUnsafe?.user?.phone_number) {
          setFormData(prev => ({ ...prev, phone: tg.initDataUnsafe.user.phone_number }));
        }
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const tgUser = getTelegramUser();
      if (!tgUser) {
        alert('Ошибка: не удалось получить данные пользователя');
        return;
      }

      const passenger = await registerPassenger(
        tgUser.id.toString(),
        `${tgUser.first_name} ${tgUser.last_name || ''}`.trim(),
        formData.phone || tgUser.phone_number || ''
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
        phone: formData.phone,
        comment: formData.comment,
        price: parseFloat(formData.price)
      });

      alert('Заказ создан успешно!');
      navigate('/my-orders');
    } catch (error) {
      console.error('Error creating order:', error);
      alert('Ошибка при создании заказа: ' + (error.response?.data?.error || error.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <button className="btn-back" onClick={() => navigate('/')}>Назад</button>
        <h2>Новый заказ</h2>
        <div style={{ width: '40px' }}></div>
      </div>

      <form onSubmit={handleSubmit} className="order-form">
        <div className="form-section">
          <h3>Откуда</h3>
          <div className="input-group">
            <label>Город</label>
            <input
              type="text"
              name="fromCity"
              value={formData.fromCity}
              onChange={handleChange}
              required
              placeholder="Москва"
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
        </div>

        <div className="form-section">
          <h3>Куда</h3>
          <div className="input-group">
            <label>Город</label>
            <input
              type="text"
              name="toCity"
              value={formData.toCity}
              onChange={handleChange}
              required
              placeholder="Санкт-Петербург"
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
          <h3>Детали</h3>
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
            <input
              type="number"
              name="passengersCount"
              value={formData.passengersCount}
              onChange={handleChange}
              required
              min="1"
              max="8"
            />
          </div>
          <div className="input-group">
            <label>Цена, ₽</label>
            <input
              type="number"
              name="price"
              value={formData.price}
              onChange={handleChange}
              required
              min="0"
              step="100"
              placeholder="0"
            />
          </div>
          <div className="checkbox-group">
            <input
              type="checkbox"
              name="luggage"
              checked={formData.luggage}
              onChange={handleChange}
            />
            <label style={{ width: 'auto' }}>Есть багаж</label>
          </div>
        </div>

        <div className="form-section">
          <h3>Контакты</h3>
          <div className="input-group">
            <label>Телефон</label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              required
              placeholder="+7 (999) 123-45-67"
            />
          </div>
          <div className="input-group textarea-group">
            <label>Комментарий</label>
            <textarea
              name="comment"
              value={formData.comment}
              onChange={handleChange}
              placeholder="Дополнительная информация"
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
