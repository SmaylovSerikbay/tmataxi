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
        <div className="ds-right">
          <button type="button" className="ds-pill" onClick={toggleCurrency}>
            {currency === 'KZT' ? '₸ KZT' : 'сум UZS'} ⇄
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="order-form">
        <div className="ds-section">
          <div className="ds-sectionTitle">Маршрут</div>
          <div className="ds-card ds-cardFlat">
            <div className="ds-row">
              <div className="ds-rowLabel">Откуда</div>
              <input
                className="ds-input"
                type="text"
                name="fromCity"
                value={formData.fromCity}
                onChange={handleChange}
                required
                placeholder="Город"
              />
            </div>
            <div className="ds-row">
              <div className="ds-rowLabel">Адрес</div>
              <input
                className="ds-input"
                type="text"
                name="fromAddress"
                value={formData.fromAddress}
                onChange={handleChange}
                required
                placeholder="Улица, дом"
              />
            </div>
            <div className="ds-row">
              <div className="ds-rowLabel">Куда</div>
              <input
                className="ds-input"
                type="text"
                name="toCity"
                value={formData.toCity}
                onChange={handleChange}
                required
                placeholder="Город"
              />
            </div>
            <div className="ds-row">
              <div className="ds-rowLabel">Адрес</div>
              <input
                className="ds-input"
                type="text"
                name="toAddress"
                value={formData.toAddress}
                onChange={handleChange}
                required
                placeholder="Улица, дом"
              />
            </div>
          </div>
        </div>

        <div className="ds-section">
          <div className="ds-sectionTitle">Детали</div>
          <div className="ds-card ds-cardFlat">
            <div className="ds-row">
              <div className="ds-rowLabel">Дата</div>
              <input
                className="ds-input"
                type="date"
                name="date"
                value={formData.date}
                onChange={handleChange}
                required
                min={new Date().toISOString().split('T')[0]}
              />
            </div>
            <div className="ds-row">
              <div className="ds-rowLabel">Время</div>
              <input
                className="ds-input"
                type="time"
                name="time"
                value={formData.time}
                onChange={handleChange}
                required
              />
            </div>
            <div className="ds-row">
              <div className="ds-rowLabel">Пассажиры</div>
              <div className="ds-stepper">
                <button
                  type="button"
                  className="ds-stepperBtn"
                  onClick={() =>
                    setFormData((p) => ({
                      ...p,
                      passengersCount: Math.max(1, p.passengersCount - 1),
                    }))
                  }
                >
                  −
                </button>
                <div className="ds-stepperValue">{formData.passengersCount}</div>
                <button
                  type="button"
                  className="ds-stepperBtn"
                  onClick={() =>
                    setFormData((p) => ({
                      ...p,
                      passengersCount: Math.min(8, p.passengersCount + 1),
                    }))
                  }
                >
                  +
                </button>
              </div>
            </div>
            <div className="ds-row">
              <div className="ds-rowLabel">Багажник</div>
              <div className="ds-rowValue">
                <input
                  className="ds-check"
                  type="checkbox"
                  name="luggage"
                  checked={formData.luggage}
                  onChange={handleChange}
                />
              </div>
            </div>
          </div>
        </div>
        
        <div className="ds-section">
          <div className="ds-sectionTitle">Цена</div>
          <div className="ds-card ds-cardFlat">
            <div className="ds-row">
              <div className="ds-rowLabel">Ваша цена</div>
              <input
                className="ds-input"
                type="number"
                name="price"
                value={formData.price}
                onChange={handleChange}
                required
                min="0"
                step="100"
                placeholder={`0 ${currencySymbol}`}
              />
            </div>
          </div>
        </div>

        <div className="ds-section">
          <div className="ds-sectionTitle">Комментарий</div>
          <div className="ds-card ds-cardFlat">
            <div className="ds-row ds-textareaWrap">
              <textarea
                className="ds-textarea"
                name="comment"
                value={formData.comment}
                onChange={handleChange}
                placeholder="Дополнительная информация (необязательно)"
              />
            </div>
          </div>
        </div>

        <div className="ds-actions">
          <button type="submit" className="ds-btn ds-btnPrimary" disabled={loading}>
            {loading ? 'Создание…' : 'Создать заказ'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default PassengerOrder;
