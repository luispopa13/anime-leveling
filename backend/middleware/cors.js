// backend/middleware/cors.js
const cors = require('cors');

const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  'http://127.0.0.1:3000',
  'https://anime-leveling.vercel.app',      // Vercel preview URL
  'https://animeleveling.com',              // domeniu custom (când îl ai)
  'https://www.animeleveling.com',
  process.env.FRONTEND_URL,                 // fallback din env
].filter(Boolean);

const corsOptions = {
  origin: function (origin, callback) {
    // Permite requests fără origin (mobile, curl, Postman)
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`CORS blocked: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  optionsSuccessStatus: 200,
};

module.exports = cors(corsOptions);