const cors = require('cors');

const corsOptions = {
  origin: function (origin, callback) {
    // Permite requests fără origin (mobile, curl, Postman)
    if (!origin) return callback(null, true);

    const allowed =
      // Localhost development
      origin.startsWith('http://localhost') ||
      origin.startsWith('http://127.0.0.1') ||
      // Orice deployment Vercel (preview + production)
      origin.endsWith('.vercel.app') ||
      // Domeniu custom când îl ai
      origin === 'https://animeleveling.com' ||
      origin === 'https://www.animeleveling.com' ||
      // Din env var
      origin === process.env.FRONTEND_URL;

    if (allowed) {
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