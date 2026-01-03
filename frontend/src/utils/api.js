import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || (process.env.NODE_ENV === 'production' ? '/api' : 'http://localhost:3000/api');

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Регистрация пассажира
export const registerPassenger = async (telegramId, name, phone) => {
  const response = await api.post('/passengers/register', {
    telegramId,
    name,
    phone,
  });
  return response.data;
};

// Регистрация таксиста
export const registerDriver = async (telegramId, name, phone, carModel, carNumber) => {
  const response = await api.post('/drivers/register', {
    telegramId,
    name,
    phone,
    carModel,
    carNumber,
  });
  return response.data;
};

// Создать заказ
export const createOrder = async (orderData) => {
  const response = await api.post('/orders/create', orderData);
  return response.data;
};

// Получить заказы пассажира
export const getPassengerOrders = async (passengerId) => {
  const response = await api.get(`/orders/passenger/${passengerId}`);
  return response.data;
};

// Получить доступные заказы
export const getAvailableOrders = async (driverId) => {
  const response = await api.get('/orders/available', { params: driverId ? { driverId } : {} });
  return response.data;
};

// Принять заказ
export const acceptOrder = async (orderId, driverId) => {
  const response = await api.post(`/orders/${orderId}/accept`, { driverId });
  return response.data;
};

// Отклонить заказ
export const rejectOrder = async (orderId, driverId) => {
  const response = await api.post(`/orders/${orderId}/reject`, driverId ? { driverId } : {});
  return response.data;
};

// Обновить статус заказа
export const updateOrderStatus = async (orderId, status) => {
  const response = await api.patch(`/orders/${orderId}/status`, { status });
  return response.data;
};

// Получить информацию о таксисте
export const getDriver = async (telegramId) => {
  const response = await api.get(`/drivers/${telegramId}`);
  return response.data;
};

// Установить статус таксиста
export const setDriverStatus = async (driverId, isOnline) => {
  const response = await api.patch(`/drivers/${driverId}/status`, { isOnline });
  return response.data;
};

// Получить заказы таксиста
export const getDriverOrders = async (driverId) => {
  const response = await api.get(`/drivers/${driverId}/orders`);
  return response.data;
};

