const express = require('express');
const router = express.Router();
const supabase = require('../utils/supabase');

// Регистрация/обновление таксиста
router.post('/register', async (req, res) => {
  try {
    if (!supabase) {
      return res.status(500).json({ error: 'Supabase not configured' });
    }

    const { telegramId, name, phone, carModel, carNumber } = req.body;
    
    // Проверяем, существует ли таксист
    const { data: existing } = await supabase
      .from('drivers')
      .select('*')
      .eq('telegram_id', telegramId)
      .single();
    
    let driver;
    
    if (existing) {
      // Обновляем существующего таксиста
      const { data, error } = await supabase
        .from('drivers')
        .update({ 
          name, 
          phone, 
          car_model: carModel, 
          car_number: carNumber 
        })
        .eq('telegram_id', telegramId)
        .select()
        .single();
      
      if (error) throw error;
      driver = data;
    } else {
      // Создаем нового таксиста
      const { data, error } = await supabase
        .from('drivers')
        .insert({ 
          telegram_id: telegramId, 
          name, 
          phone, 
          car_model: carModel, 
          car_number: carNumber 
        })
        .select()
        .single();
      
      if (error) throw error;
      driver = data;
    }

    res.json(driver);
  } catch (error) {
    console.error('Error in /register:', error);
    res.status(500).json({ error: error.message });
  }
});

// Получить информацию о таксисте
router.get('/:telegramId', async (req, res) => {
  try {
    if (!supabase) {
      return res.status(500).json({ error: 'Supabase not configured' });
    }

    const { data: driver, error } = await supabase
      .from('drivers')
      .select('*')
      .eq('telegram_id', req.params.telegramId)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ error: 'Driver not found' });
      }
      throw error;
    }

    res.json(driver);
  } catch (error) {
    console.error('Error in GET /:telegramId:', error);
    res.status(500).json({ error: error.message });
  }
});

// Установить статус онлайн/офлайн
router.patch('/:driverId/status', async (req, res) => {
  try {
    if (!supabase) {
      return res.status(500).json({ error: 'Supabase not configured' });
    }

    const { isOnline } = req.body;
    const { data: driver, error } = await supabase
      .from('drivers')
      .update({ is_online: isOnline })
      .eq('id', req.params.driverId)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ error: 'Driver not found' });
      }
      throw error;
    }

    res.json(driver);
  } catch (error) {
    console.error('Error in PATCH /:driverId/status:', error);
    res.status(500).json({ error: error.message });
  }
});

// Обновить местоположение таксиста
router.patch('/:driverId/location', async (req, res) => {
  try {
    if (!supabase) {
      return res.status(500).json({ error: 'Supabase not configured' });
    }

    const { city, coordinates } = req.body;
    const { data: driver, error } = await supabase
      .from('drivers')
      .update({ 
        current_location_city: city,
        current_location_lat: coordinates?.lat,
        current_location_lng: coordinates?.lng
      })
      .eq('id', req.params.driverId)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ error: 'Driver not found' });
      }
      throw error;
    }

    res.json(driver);
  } catch (error) {
    console.error('Error in PATCH /:driverId/location:', error);
    res.status(500).json({ error: error.message });
  }
});

// Получить заказы таксиста
router.get('/:driverId/orders', async (req, res) => {
  try {
    if (!supabase) {
      return res.status(500).json({ error: 'Supabase not configured' });
    }

    const { data: orders, error } = await supabase
      .from('orders')
      .select(`
        *,
        passengers:passenger_id (
          id,
          name,
          phone
        )
      `)
      .eq('driver_id', req.params.driverId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;

    // Преобразуем данные для совместимости с фронтендом
    const formattedOrders = orders.map(order => ({
      ...order,
      passenger: order.passengers,
      from: {
        city: order.from_city,
        address: order.from_address,
        coordinates: {
          lat: order.from_lat,
          lng: order.from_lng
        }
      },
      to: {
        city: order.to_city,
        address: order.to_address,
        coordinates: {
          lat: order.to_lat,
          lng: order.to_lng
        }
      },
      passengersCount: order.passengers_count,
      _id: order.id
    }));

    res.json(formattedOrders);
  } catch (error) {
    console.error('Error in GET /:driverId/orders:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
