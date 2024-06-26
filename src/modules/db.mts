import sqlite3 from "sqlite3";

// Create an in-memory SQLite database
const db = new sqlite3.Database(":memory:");

// Create tables for users, events, and tickets, and events_logs.
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL
    )
  `);
  db.run(`CREATE TABLE IF NOT EXISTS event_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  userId INTEGER,
  eventId INTEGER,
  notificationDate TEXT,
  message TEXT,
  createdAt TEXT DEFAULT CURRENT_TIMESTAMP
);`);
  db.run(`
    CREATE TABLE IF NOT EXISTS events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      date TEXT NOT NULL,
      category TEXT NOT NULL,
      availableSeats INTEGER NOT NULL
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS tickets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      seat TEXT NOT NULL,
      price REAL NOT NULL,
      eventId INTEGER,
      userId INTEGER,
      FOREIGN KEY(eventId) REFERENCES events(id),
      FOREIGN KEY(userId) REFERENCES users(id)
    )
  `);
});

export default db;
