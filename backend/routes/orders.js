const express = require('express');
const router = express.Router();
const supabase = require('../utils/supabase');
const { body, validationResult } = require('express-validator');
const { notifyDriverAboutNewOrder } = require('../bot');

// Создать новый заказ
router.post('/create', [
  body('passengerId').notEmpty().withMessage('Passenger ID required'),
  body('from.city').notEmpty().withMessage('From city required'),
  body('from.address').notEmpty().withMessage('From address required'),
  body('to.city').notEmpty().withMessage('To city required'),
  body('to.address').notEmpty().withMessage('To address required'),
  body('date').notEmpty().withMessage('Date required'),
  body('phone').notEmpty().withMessage('Phone required'),
  body('price').isNumeric().withMessage('Price must be a number')
], async (req, res) => {
  try {
    if (!supabase) {
      return res.status(500).json({ error: 'Supabase not configured' });
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      passengerId,
      from,
      to,
      date,
      passengersCount = 1,
      luggage = false,
      phone,
      comment = '',
      price
    } = req.body;

    // Создаем заказ
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        passenger_id: passengerId,
        from_city: from.city,
        from_address: from.address,
        from_lat: from.coordinates?.lat,
        from_lng: from.coordinates?.lng,
        to_city: to.city,
        to_address: to.address,
        to_lat: to.coordinates?.lat,
        to_lng: to.coordinates?.lng,
        date: date,
        passengers_count: passengersCount,
        luggage: luggage,
        phone: phone,
        comment: comment,
        price: price,
        status: 'pending'
      })
      .select()
      .single();

    if (orderError) throw orderError;

    // Отправляем заказ всем онлайн таксистам через Telegram
    const { data: onlineDrivers, error: driversError } = await supabase
      .from('drivers')
      .select('*')
      .eq('is_online', true);

    if (!driversError && onlineDrivers) {
      // Socket.io доступен только если сервер запущен (не в serverless)
      const io = req.app.get('io');
      if (io) {
        onlineDrivers.forEach(driver => {
          io.to(`driver-${driver.id}`).emit('new-order', {
            ...order,
            _id: order.id,
            from: { city: order.from_city, address: order.from_address },
            to: { city: order.to_city, address: order.to_address },
            passengersCount: order.passengers_count
          });
        });
      }
      
      // Telegram уведомления
      onlineDrivers.forEach(driver => {
        if (driver.telegram_id) {
          notifyDriverAboutNewOrder(driver.telegram_id, {
            ...order,
            _id: order.id,
            from: { city: order.from_city, address: order.from_address },
            to: { city: order.to_city, address: order.to_address },
            passengersCount: order.passengers_count
          });
        }
      });
    }

    // Форматируем ответ для совместимости
    const formattedOrder = {
      ...order,
      _id: order.id,
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
      passengersCount: order.passengers_count
    };

    res.status(201).json(formattedOrder);
  } catch (error) {
    console.error('Error in POST /create:', error);
    res.status(500).json({ error: error.message });
  }
});

// Получить все заказы (для пассажира)
router.get('/passenger/:passengerId', async (req, res) => {
  try {
    if (!supabase) {
      return res.status(500).json({ error: 'Supabase not configured' });
    }

    const { data: orders, error } = await supabase
      .from('orders')
      .select(`
        *,
        drivers:driver_id (
          id,
          name,
          phone,
          car_model,
          car_number
        )
      `)
      .eq('passenger_id', req.params.passengerId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Форматируем ответ
    const formattedOrders = orders.map(order => ({
      ...order,
      _id: order.id,
      driver: order.drivers ? {
        _id: order.drivers.id,
        name: order.drivers.name,
        phone: order.drivers.phone,
        carModel: order.drivers.car_model,
        carNumber: order.drivers.car_number
      } : null,
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
      passengersCount: order.passengers_count
    }));

    res.json(formattedOrders);
  } catch (error) {
    console.error('Error in GET /passenger/:passengerId:', error);
    res.status(500).json({ error: error.message });
  }
});

// Получить доступные заказы (для таксиста)
router.get('/available', async (req, res) => {
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
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Форматируем ответ
    const formattedOrders = orders.map(order => ({
      ...order,
      _id: order.id,
      passenger: order.passengers ? {
        _id: order.passengers.id,
        name: order.passengers.name,
        phone: order.passengers.phone
      } : null,
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
      passengersCount: order.passengers_count
    }));

    res.json(formattedOrders);
  } catch (error) {
    console.error('Error in GET /available:', error);
    res.status(500).json({ error: error.message });
  }
});

// Принять заказ
router.post('/:orderId/accept', async (req, res) => {
  try {
    if (!supabase) {
      return res.status(500).json({ error: 'Supabase not configured' });
    }

    const { driverId } = req.body;

    // Проверяем, существует ли заказ и доступен ли он
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', req.params.orderId)
      .single();

    if (orderError) {
      if (orderError.code === 'PGRST116') {
        return res.status(404).json({ error: 'Order not found' });
      }
      throw orderError;
    }

    if (order.status !== 'pending') {
      return res.status(400).json({ error: 'Order is not available' });
    }

    // Обновляем заказ
    const { data: updatedOrder, error: updateError } = await supabase
      .from('orders')
      .update({
        driver_id: driverId,
        status: 'accepted'
      })
      .eq('id', req.params.orderId)
      .select()
      .single();

    if (updateError) throw updateError;

    // Уведомляем пассажира через Socket.io (если доступен)
    const io = req.app.get('io');
    if (io) {
      io.emit(`order-${updatedOrder.id}-accepted`, {
        ...updatedOrder,
        _id: updatedOrder.id
      });
    }

    // Форматируем ответ
    const formattedOrder = {
      ...updatedOrder,
      _id: updatedOrder.id,
      from: {
        city: updatedOrder.from_city,
        address: updatedOrder.from_address
      },
      to: {
        city: updatedOrder.to_city,
        address: updatedOrder.to_address
      },
      passengersCount: updatedOrder.passengers_count
    };

    res.json(formattedOrder);
  } catch (error) {
    console.error('Error in POST /:orderId/accept:', error);
    res.status(500).json({ error: error.message });
  }
});

// Отклонить заказ
router.post('/:orderId/reject', async (req, res) => {
  try {
    if (!supabase) {
      return res.status(500).json({ error: 'Supabase not configured' });
    }

    const { data: order, error } = await supabase
      .from('orders')
      .select('*')
      .eq('id', req.params.orderId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ error: 'Order not found' });
      }
      throw error;
    }

    res.json({ message: 'Order rejected', order });
  } catch (error) {
    console.error('Error in POST /:orderId/reject:', error);
    res.status(500).json({ error: error.message });
  }
});

// Обновить статус заказа
router.patch('/:orderId/status', async (req, res) => {
  try {
    if (!supabase) {
      return res.status(500).json({ error: 'Supabase not configured' });
    }

    const { status } = req.body;
    const { data: order, error } = await supabase
      .from('orders')
      .update({ status })
      .eq('id', req.params.orderId)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ error: 'Order not found' });
      }
      throw error;
    }

    // Уведомляем через Socket.io (если доступен)
    const io = req.app.get('io');
    if (io) {
      io.emit(`order-${order.id}-updated`, {
        ...order,
        _id: order.id
      });
    }

    // Форматируем ответ
    const formattedOrder = {
      ...order,
      _id: order.id,
      from: {
        city: order.from_city,
        address: order.from_address
      },
      to: {
        city: order.to_city,
        address: order.to_address
      },
      passengersCount: order.passengers_count
    };

    res.json(formattedOrder);
  } catch (error) {
    console.error('Error in PATCH /:orderId/status:', error);
    res.status(500).json({ error: error.message });
  }
});

// Получить заказ по ID
router.get('/:orderId', async (req, res) => {
  try {
    if (!supabase) {
      return res.status(500).json({ error: 'Supabase not configured' });
    }

    const { data: order, error } = await supabase
      .from('orders')
      .select(`
        *,
        passengers:passenger_id (
          id,
          name,
          phone
        ),
        drivers:driver_id (
          id,
          name,
          phone,
          car_model,
          car_number
        )
      `)
      .eq('id', req.params.orderId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ error: 'Order not found' });
      }
      throw error;
    }

    // Форматируем ответ
    const formattedOrder = {
      ...order,
      _id: order.id,
      passenger: order.passengers ? {
        _id: order.passengers.id,
        name: order.passengers.name,
        phone: order.passengers.phone
      } : null,
      driver: order.drivers ? {
        _id: order.drivers.id,
        name: order.drivers.name,
        phone: order.drivers.phone,
        carModel: order.drivers.car_model,
        carNumber: order.drivers.car_number
      } : null,
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
      passengersCount: order.passengers_count
    };

    res.json(formattedOrder);
  } catch (error) {
    console.error('Error in GET /:orderId:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
