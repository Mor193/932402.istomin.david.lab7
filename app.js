const express = require('express');
const {
  getAllEvents,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent
} = require('./database');

const app = express();
const PORT = 3000;

app.use(express.json());


function isValidIsoDate(dateString) {
  if (typeof dateString !== 'string') return false;
  const isoRegex = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}(:\d{2}(\.\d{1,3})?)?(Z|[+-]\d{2}:?\d{2})?)?$/;
  if (!isoRegex.test(dateString)) return false;

  const parsed = new Date(dateString);
  return !isNaN(parsed.getTime());
}


app.get('/api/events', async (req, res) => {
  try {
    const { after } = req.query;

    if (after) {
      if (!isValidIsoDate(after)) {
        return res.status(400).json({
          error: 'Некорректный формат даты в параметре after. Используйте формат ISO 8601 (например, 2026-10-01).'
        });
      }
    }

    const events = await getAllEvents(after);
    return res.json(events);
  } catch (err) {
    return res.status(500).json({ error: 'Ошибка сервера при получении событий', details: err.message });
  }
});


app.get('/api/events/:id', async (req, res) => {
  try {
    const event = await getEventById(req.params.id);
    if (!event) {
      return res.status(404).json({ error: 'Событие не найдено' });
    }
    return res.json(event);
  } catch (err) {
    return res.status(500).json({ error: 'Ошибка сервера при получении события', details: err.message });
  }
});


app.post('/api/events', async (req, res) => {
  try {
    const { event_name, date, location } = req.body;

    if (!event_name || typeof event_name !== 'string' || event_name.trim() === '') {
      return res.status(400).json({ error: 'Поле event_name обязательно и не должно быть пустым' });
    }

    if (!date || !isValidIsoDate(date)) {
      return res.status(400).json({
        error: 'Некорректный формат даты. Дата должна соответствовать формату ISO 8601 (например, 2026-12-31T18:00:00Z).'
      });
    }

    
    const eventDate = new Date(date);
    const now = new Date();
    if (eventDate <= now) {
      return res.status(400).json({
        error: 'Дата события должна быть в будущем'
      });
    }

    const newEvent = await createEvent(event_name.trim(), date, location);
    return res.status(201).json(newEvent);
  } catch (err) {
    return res.status(500).json({ error: 'Ошибка сервера при создании события', details: err.message });
  }
});


app.put('/api/events/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { event_name, date, location } = req.body;

    if (!event_name || typeof event_name !== 'string' || event_name.trim() === '') {
      return res.status(400).json({ error: 'Поле event_name обязательно и не должно быть пустым' });
    }

    if (!date || !isValidIsoDate(date)) {
      return res.status(400).json({
        error: 'Некорректный формат даты. Дата должна соответствовать формату ISO 8601.'
      });
    }

    const updatedEvent = await updateEvent(id, event_name.trim(), date, location);
    if (!updatedEvent) {
      return res.status(404).json({ error: 'Событие не найдено' });
    }

    return res.json(updatedEvent);
  } catch (err) {
    return res.status(500).json({ error: 'Ошибка сервера при обновлении события', details: err.message });
  }
});


app.delete('/api/events/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const isDeleted = await deleteEvent(id);

    if (!isDeleted) {
      return res.status(404).json({ error: 'Событие не найдено' });
    }

    return res.json({ message: `Событие с ID ${id} успешно удалено` });
  } catch (err) {
    return res.status(500).json({ error: 'Ошибка сервера при удалении события', details: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Сервер запущен на http://localhost:${PORT}`);
});