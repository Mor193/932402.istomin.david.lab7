const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'events.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Ошибка подключения к SQLite:', err.message);
  } else {
    console.log('Подключение к базе данных SQLite успешно установлено.');
  }
});


db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      event_name TEXT NOT NULL,
      date TEXT NOT NULL,
      location TEXT
    )
  `);
});


function getAllEvents(afterDate = null) {
  return new Promise((resolve, reject) => {
    let sql = 'SELECT * FROM events';
    const params = [];

    if (afterDate) {
      sql += ' WHERE date > ? ORDER BY date ASC';
      params.push(afterDate);
    } else {
      sql += ' ORDER BY date ASC';
    }

    db.all(sql, params, (err, rows) => {
      if (err) return reject(err);
      resolve(rows);
    });
  });
}


function getEventById(id) {
  return new Promise((resolve, reject) => {
    const sql = 'SELECT * FROM events WHERE id = ?';
    db.get(sql, [id], (err, row) => {
      if (err) return reject(err);
      resolve(row);
    });
  });
}


function createEvent(eventName, date, location) {
  return new Promise((resolve, reject) => {
    const sql = 'INSERT INTO events (event_name, date, location) VALUES (?, ?, ?)';
    db.run(sql, [eventName, date, location || null], function (err) {
      if (err) return reject(err);
      resolve({ id: this.lastID, event_name: eventName, date, location: location || null });
    });
  });
}


function updateEvent(id, eventName, date, location) {
  return new Promise((resolve, reject) => {
    const sql = `
      UPDATE events 
      SET event_name = ?, date = ?, location = ? 
      WHERE id = ?
    `;
    db.run(sql, [eventName, date, location || null, id], function (err) {
      if (err) return reject(err);
      if (this.changes === 0) {
        return resolve(null); 
      }
      resolve({ id: Number(id), event_name: eventName, date, location: location || null });
    });
  });
}


function deleteEvent(id) {
  return new Promise((resolve, reject) => {
    const sql = 'DELETE FROM events WHERE id = ?';
    db.run(sql, [id], function (err) {
      if (err) return reject(err);
      if (this.changes === 0) {
        return resolve(false); 
      }
      resolve(true);
    });
  });
}

module.exports = {
  getAllEvents,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent
};