const express = require('express');
const router = express.Router();
const supabase = require('../utils/supabase');

// Регистрация/обновление пассажира
router.post('/register', async (req, res) => {
  try {
    if (!supabase) {
      return res.status(500).json({ error: 'Supabase not configured' });
    }

    const { telegramId, name, phone } = req.body;
    
    // Проверяем, существует ли пассажир
    const { data: existing } = await supabase
      .from('passengers')
      .select('*')
      .eq('telegram_id', telegramId)
      .single();
    
    let passenger;
    
    if (existing) {
      // Обновляем существующего пассажира
      const { data, error } = await supabase
        .from('passengers')
        .update({ name, phone })
        .eq('telegram_id', telegramId)
        .select()
        .single();
      
      if (error) throw error;
      passenger = data;
    } else {
      // Создаем нового пассажира
      const { data, error } = await supabase
        .from('passengers')
        .insert({ telegram_id: telegramId, name, phone })
        .select()
        .single();
      
      if (error) throw error;
      passenger = data;
    }

    res.json(passenger);
  } catch (error) {
    console.error('Error in /register:', error);
    res.status(500).json({ error: error.message });
  }
});

// Получить информацию о пассажире
router.get('/:telegramId', async (req, res) => {
  try {
    if (!supabase) {
      return res.status(500).json({ error: 'Supabase not configured' });
    }

    const { data: passenger, error } = await supabase
      .from('passengers')
      .select('*')
      .eq('telegram_id', req.params.telegramId)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ error: 'Passenger not found' });
      }
      throw error;
    }

    res.json(passenger);
  } catch (error) {
    console.error('Error in GET /:telegramId:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
