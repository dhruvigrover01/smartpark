require('dotenv').config();
const express = require('express');
const
 http    = 
require
(
'http'
);
const
 { Server } = 
require
(
'socket.io'
);
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const connectDB = require('./config/db');

const authRoutes    = require('./routes/auth');
const parkingRoutes = require('./routes/parking');
const bookingRoutes = require('./routes/bookings');
const userRoutes    = require('./routes/users');

connectDB();

const app = express();

const
 httpServer = http.
createServer
(app);
 

const
 io = 
new
Server
(httpServer, {

  cors: {

    origin: [
'http://localhost:5173',
'https://smartpark-green.vercel.app'
],

    credentials: 
true
,

  }

});

io.
on
(
'connection'
, (socket) => {

  socket.
on
(
'disconnect'
, () => {});

});
 

app.
set
(
'io'
, io);
// ── Security middleware ──
app.use(helmet());
app.use(cors({
  origin: [
    'http://localhost:5173',
    'https://smartpark-green.vercel.app'
  ],
  credentials: true
}));
app.use(express.json({ limit: '10kb' }));
app.use(morgan(process.env.NODE_ENV === 'development' ? 'dev' : 'combined'));

// ── Global rate limiter ──
app.use('/api/', rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 200,
  message: { error: 'Too many requests, please try again later.' },
}));

// ── Routes ──
app.use('/api/auth',    authRoutes);
app.use('/api/parking', parkingRoutes);
app.use('/api/bookings',bookingRoutes);
app.use('/api/users',   userRoutes);

// ── Health check ──
app.get('/api/health', (_, res) => res.json({ status: 'ok', env: process.env.NODE_ENV }));

// ── 404 handler ──
app.use((req, res) => res.status(404).json({ error: 'Route not found' }));

// ── Global error handler ──
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error',
  });
});

const PORT = process.env.PORT || 5000;
httpServer.
listen
(PORT, () => console.
log
(
`🚀 SmartPark API running on port ${PORT}`
));
