const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');
require('dotenv').config();

let bot = null;
let notifyDriverAboutNewOrder = () => {};

if (process.env.TELEGRAM_BOT_TOKEN) {
  bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: true });

  // Команда /start
  bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    const options = {
      reply_markup: {
        inline_keyboard: [
          [{ text: '🚖 Открыть приложение', web_app: { url: process.env.WEB_APP_URL || 'http://localhost:3001' } }]
        ]
      }
    };
    
    bot.sendMessage(chatId, 'Добро пожаловать в междугороднее такси! Нажмите кнопку ниже, чтобы открыть приложение.', options);
  });

  // Отправка уведомления таксисту о новом заказе
  notifyDriverAboutNewOrder = function(driverTelegramId, order) {
    if (!bot) return;
    
    const currency = order.currency || 'KZT';
    const currencyLabel = currency === 'UZS' ? 'сум' : '₸';

    const message = `
🚗 Новый заказ!

📍 Откуда: ${order.from.city}, ${order.from.address}
📍 Куда: ${order.to.city}, ${order.to.address}
📅 Дата: ${new Date(order.date).toLocaleString('ru-RU')}
👥 Пассажиров: ${order.passengersCount}
💰 Цена: ${order.price} ${currencyLabel}
📞 Телефон: ${order.phone}
${order.comment ? `💬 Комментарий: ${order.comment}` : ''}
    `;

    const options = {
      reply_markup: {
        inline_keyboard: [
          [
            { text: '✅ Принять', callback_data: `accept_${order._id}` },
            { text: '❌ Отклонить', callback_data: `reject_${order._id}` }
          ]
        ]
      }
    };

    bot.sendMessage(driverTelegramId, message, options).catch(err => {
      console.error('Error sending message to driver:', err);
    });
  };

  // Обработка callback от кнопок
  bot.on('callback_query', async (query) => {
    const chatId = query.message.chat.id;
    const data = query.data;
    const telegramId = query.from.id.toString();

    try {
      // Answer immediately to avoid "query is too old" errors
      await bot.answerCallbackQuery(query.id, { text: '⏳ Обрабатываю…' });

      if (data.startsWith('accept_')) {
        const orderId = data.replace('accept_', '');
        
        // Получаем информацию о таксисте
        const apiUrl = process.env.API_URL
          ? process.env.API_URL.replace(/\/$/, '')
          : (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');
        const driverResponse = await axios.get(`${apiUrl}/api/drivers/${telegramId}`);
        const driver = driverResponse.data;

        if (!driver || !driver.id) {
          await bot.editMessageText('⚠️ Ошибка: таксист не найден', { 
            chat_id: chatId, 
            message_id: query.message.message_id 
          });
          return;
        }

        // Принимаем заказ через API
        await axios.post(`${apiUrl}/api/orders/${orderId}/accept`, {
          driverId: driver.id
        });

        await bot.editMessageText('✅ Заказ принят! Откройте приложение для деталей.', { 
          chat_id: chatId, 
          message_id: query.message.message_id 
        });
      } else if (data.startsWith('reject_')) {
        const orderId = data.replace('reject_', '');
        
        // Отклоняем заказ
        const apiUrl = process.env.API_URL
          ? process.env.API_URL.replace(/\/$/, '')
          : (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');

        // Need driverId to dismiss only for this driver
        const driverResponse = await axios.get(`${apiUrl}/api/drivers/${telegramId}`);
        const driver = driverResponse.data;
        if (!driver || !driver.id) {
          await bot.editMessageText('⚠️ Ошибка: таксист не найден', { 
            chat_id: chatId, 
            message_id: query.message.message_id 
          });
          return;
        }

        await axios.post(`${apiUrl}/api/orders/${orderId}/reject`, { driverId: driver.id });

        await bot.editMessageText('❌ Скрыто. Этот заказ больше не будет показываться вам.', { 
          chat_id: chatId, 
          message_id: query.message.message_id 
        });
      }
    } catch (error) {
      console.error('Error handling callback:', error);
      try {
        await bot.answerCallbackQuery(query.id, { text: 'Произошла ошибка', show_alert: true });
      } catch (e) {}
    }
  });

  console.log('Telegram Bot initialized');
} else {
  console.warn('TELEGRAM_BOT_TOKEN not set. Bot will not be initialized.');
}

module.exports = { bot, notifyDriverAboutNewOrder };
