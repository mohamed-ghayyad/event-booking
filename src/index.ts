import express, { Request, Response, NextFunction } from 'express';
import bodyParser from 'body-parser';
import { validationResult, body } from 'express-validator';
import bcrypt from 'bcrypt';
import db from './modules/db.mjs';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import cron from 'node-cron';

dotenv.config();

declare global {
  namespace Express {
    interface Request {
      user?: { userId: number };
    }
  }
}

const app = express();
app.use(bodyParser.json());
app.use(express.json());

const secretKey = process.env.SECRET_KEY || '*£&$jshdn2832732£$"~!@£$%^&*()_+';

type User = {
  id: number;
  name: string;
  email: string;
  password: string;
};

export const generateToken = (userId: number) => {
  return jwt.sign({ userId }, secretKey, { expiresIn: '1h' });
};

export const verifyToken = (token: string, callback: (err: any, decoded: any) => void) => {
  return jwt.verify(token, secretKey, callback);
};

const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.sendStatus(401);

  verifyToken(token, (err: any, user: any) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
    return;
  });
  return;
};

const validateEvent = [
  body('name').isString().notEmpty().isLength({ max: 100 }).withMessage('Name must be less than 100 characters'),
  body('date').isDate().notEmpty().withMessage('Date must be in the format YYYY-MM-DD'),
  body('availableSeats').isInt({ min: 0, max: 1000 }).notEmpty().withMessage('Available seats must be between 0 and 1000'),
  body('description').isString().notEmpty().isLength({ max: 500 }).withMessage('Description must be less than 500 characters'),
  body('category').isString().notEmpty().custom((value) => {
    if (value !== 'Concert' && value !== 'Conference' && value !== 'Game') {
      throw new Error('Category must be Concert, Conference or Game.');
    }
    return true;
  }),
];

const validateUser = [
  body('name').isString().notEmpty().isLength({ max: 100 }).withMessage('Name must be less than 100 characters'),
  body('email').isEmail().notEmpty().withMessage('Email must be a valid email address'),
  body('password').isString().notEmpty().isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
];

app.post('/auth', (req: Request, res: Response) => {
  const { email, password } = req.body;
  db.get('SELECT * FROM users WHERE email = ?', [email], async (err, user: User) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = generateToken(user.id);
    res.json({ token });
    return;
  });
});

app.post('/users', validateUser, async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { name, email, password } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  const stmt = db.prepare('INSERT INTO users (name, email, password) VALUES (?, ?, ?)');
  stmt.run([name, email, hashedPassword], function (this: any, err: Error) {
    if (err) {
      return res.status(400).json({ error: err.message });
    }
    res.status(201).json({ id: this.lastID });
    return;
  });
  stmt.finalize();
  return;
});

app.post('/events', validateEvent, (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { name, date, category, availableSeats } = req.body;
  const stmt = db.prepare('INSERT INTO events (name, date, category, availableSeats) VALUES (?, ?, ?, ?)');
  stmt.run([name, date, category, availableSeats], function (this: any, err: Error) {
    if (err) {
      return res.status(400).json({ error: err.message });
    }
    res.status(201).json({ id: this.lastID });
    return;
  });
  stmt.finalize();
  return;
});

app.post('/events/:eventId/tickets', authenticateToken, (req: Request, res: Response) => {
  const { seat, price } = req.body;
  const { eventId } = req.params;
  const userId = req.user?.userId;

  db.get('SELECT availableSeats FROM events WHERE id = ?', [eventId], (err: Error, event: any) => {
    if (err) {
      return res.status(400).json({ error: err.message });
    }

    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    db.get('SELECT COUNT(*) as ticketCount FROM tickets WHERE eventId = ?', [eventId], (err: Error, count: any) => {
      if (err) {
        return res.status(400).json({ error: err.message });
      }

      if (count.ticketCount >= event.availableSeats) {
        return res.status(400).json({ error: 'No available seats for this event' });
      }

      const stmt = db.prepare('INSERT INTO tickets (seat, price, eventId, userId) VALUES (?, ?, ?, ?)');
      stmt.run([seat, price, eventId, userId], function (this: any, err: Error) {
        if (err) {
          return res.status(400).json({ error: err.message });
        }
        res.status(201).json({ id: this.lastID });
        return;
      });
      stmt.finalize();
      return;
    });
    return;
  });
});

app.get('/users', (_req: Request, res: Response) => {
  db.all('SELECT * FROM users', (err: Error, rows: any) => {
    if (err) {
      return res.status(400).json({ error: err.message });
    }
    res.json({ users: rows });
    return;
  });
});

app.get('/events', (req: Request, res: Response) => {
  const { category, name, startDate, endDate } = req.query;
  let query = 'SELECT * FROM events WHERE 1=1';
  const params: any[] = [];

  if (category) {
    query += ' AND category = ?';
    params.push(category);
  }

  if (name) {
    query += ' AND name LIKE ?';
    params.push(`%${name}%`);
  }

  if (startDate) {
    query += ' AND date >= ?';
    params.push(startDate);
  }

  if (endDate) {
    query += ' AND date <= ?';
    params.push(endDate);
  }

  db.all(query, params, (err: Error, rows: any) => {
    if (err) {
      return res.status(400).json({ error: err.message });
    }
    res.json({ events: rows });
    return;
  });
});

app.get('/events/:eventId/tickets', (req: Request, res: Response) => {
  const { eventId } = req.params;
  db.all('SELECT * FROM tickets WHERE eventId = ?', [eventId], (err: Error, rows: any) => {
    if (err) {
      return res.status(400).json({ error: err.message });
    }
    res.json({ tickets: rows });
    return;
  });
});

app.put('/events/:eventId/tickets/:ticketId', authenticateToken, (req: Request, res: Response) => {
  const { seat, price } = req.body;
  const { eventId, ticketId } = req.params;
  const stmt = db.prepare('UPDATE tickets SET seat = ?, price = ?, eventId = ? WHERE id = ?');
  stmt.run([seat, price, eventId, ticketId], function (this: any, err: Error) {
    if (err) {
      return res.status(400).json({ error: err.message });
    }
    res.json({ changes: this.changes });
    return;
  });
  stmt.finalize();
});

app.delete('/events/:eventId/tickets/:ticketId', authenticateToken, (req: Request, res: Response) => {
  const { ticketId } = req.params;
  const stmt = db.prepare('DELETE FROM tickets WHERE id = ?');
  stmt.run(ticketId, function (this: any, err: Error) {
    if (err) {
      return res.status(400).json({ error: err.message });
    }
    res.json({ changes: this.changes });
    return;
  });
  stmt.finalize();
});

app.get('/users/me/booked-events', authenticateToken, (req: Request, res: Response) => {
  const userId = req.user?.userId;
  db.all(`
    SELECT events.id, events.name, events.date, events.category
    FROM events
    JOIN tickets ON events.id = tickets.eventId
    WHERE tickets.userId = ?
  `, [userId], (err, rows) => {
    if (err) {
      return res.status(400).json({ error: err.message });
    }
    res.status(200).json({ events: rows });
    return;
  });
});

app.delete('/users/me/booked-events/:eventId', authenticateToken, (req: Request, res: Response) => {
  const { eventId } = req.params;
  const userId = req.user?.userId;
  const stmt = db.prepare('DELETE FROM tickets WHERE eventId = ? AND userId = ?');
  stmt.run([eventId, userId], function (this: any, err: Error) {
    if (err) {
      return res.status(400).json({ error: err.message });
    }
    res.json({ changes: this.changes });
    return;
  });
  stmt.finalize();
  return;
});
// Periodic task to send notifications for upcoming events
cron.schedule('0 0 * * *', () => {
  const notificationDate = new Date();
  notificationDate.setDate(notificationDate.getDate() + 1); // Set to notify 1 day before the event
  const formattedDate = notificationDate.toISOString().split('T')[0];

  db.all(`
    SELECT users.id AS userId, users.email, events.id AS eventId, events.name, events.date
    FROM events
    JOIN tickets ON events.id = tickets.eventId
    JOIN users ON tickets.userId = users.id
    WHERE events.date = ?
  `, [formattedDate], (err, rows) => {
    if (err) {
      console.error('Error fetching upcoming events:', err.message);
      return;
    }

    rows.forEach((row: any) => {
      const message = `Reminder: You have an upcoming event "${row.name}" on ${row.date}.`;
      // Send notification to user (this could be an email, SMS, etc.)
      console.log(`Sending notification to ${row.email}: ${message}`);

      // Log the notification event
      const stmt = db.prepare('INSERT INTO event_logs (userId, eventId, notificationDate, message) VALUES (?, ?, ?, ?)');
      stmt.run([row.userId, row.eventId, formattedDate, message], function (this: any, err: Error) {
        if (err) {
          console.error('Error logging event notification:', err.message);
        }
      });
      stmt.finalize();
    });
  });
});

app.listen(3000, () => {
  console.log('Event Service is running on http://localhost:3000');
});

export default app;
