const express = require('express');
const corsMiddleware = require('./middleware/cors');
require('dotenv').config();

const animeRoutes = require('./routes/animeRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(corsMiddleware);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging middleware (optional - for development)
if (process.env.NODE_ENV !== 'production') {
  app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
  });
}

// Add a root route to fix the "Cannot GET /" error
app.get('/', (req, res) => {
  res.json({ 
    message: 'Anime Streaming API is running!',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    endpoints: {
      popular: '/api/anime/popular',
      trending: '/api/anime/trending',
      top100: '/api/anime/top100',
      latest: '/api/anime/latest',
      search: '/api/anime/search?q=YOUR_QUERY',
      details: '/api/anime/details/ANIME_ID',
      recentlyUpdated: '/api/anime/recently-updated',
      upcoming: '/api/anime/upcoming',
      seasonPopular: '/api/anime/season/popular',
      seasonUpcoming: '/api/anime/season/upcoming',
      byGenre: '/api/anime/genre/GENRE_NAME',
      byYear: '/api/anime/year/YEAR',
      bySeason: '/api/anime/season/SEASON/YEAR',
      allCategories: '/api/anime/all-categories',
      info: '/api/anime/info'
    },
    documentation: {
      parameters: {
        page: 'Page number (default: 1)',
        perPage: 'Items per page (default: 20, max: 100)'
      },
      seasons: ['WINTER', 'SPRING', 'SUMMER', 'FALL'],
      examples: [
        '/api/anime/popular?page=1&perPage=20',
        '/api/anime/search?q=attack%20on%20titan',
        '/api/anime/season/SPRING/2024',
        '/api/anime/genre/Action'
      ]
    }
  });
});

// Placeholder image endpoint for missing anime images
app.get('/api/placeholder/:width/:height', (req, res) => {
  const { width, height } = req.params;
  
  // Validate dimensions
  const w = Math.min(Math.max(parseInt(width) || 300, 50), 1000);
  const h = Math.min(Math.max(parseInt(height) || 400, 50), 1000);
  
  // Create a simple SVG placeholder
  const svg = `
    <svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#374151;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#1f2937;stop-opacity:1" />
        </linearGradient>
      </defs>
      <rect width="100%" height="100%" fill="url(#grad)"/>
      <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="${Math.min(w, h) / 20}" fill="#9CA3AF" text-anchor="middle" dy=".3em">
        No Image Available
      </text>
      <text x="50%" y="60%" font-family="Arial, sans-serif" font-size="${Math.min(w, h) / 30}" fill="#6B7280" text-anchor="middle" dy=".3em">
        ${w} × ${h}
      </text>
    </svg>
  `;
  
  res.setHeader('Content-Type', 'image/svg+xml');
  res.setHeader('Cache-Control', 'public, max-age=86400'); // Cache for 24 hours
  res.send(svg);
});

// Routes
app.use('/api/anime', animeRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'healthy',
    message: 'Anime API is running!', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// API status endpoint
app.get('/api/status', (req, res) => {
  res.json({
    success: true,
    api: 'Anime Streaming API',
    version: '1.0.0',
    status: 'operational',
    endpoints: {
      total: 15,
      available: [
        'GET /api/anime/popular',
        'GET /api/anime/trending', 
        'GET /api/anime/top100',
        'GET /api/anime/latest',
        'GET /api/anime/recently-updated',
        'GET /api/anime/upcoming',
        'GET /api/anime/season/popular',
        'GET /api/anime/season/upcoming',
        'GET /api/anime/season/:season/:year',
        'GET /api/anime/search',
        'GET /api/anime/details/:id',
        'GET /api/anime/genre/:genre',
        'GET /api/anime/year/:year',
        'GET /api/anime/all-categories',
        'GET /api/anime/info'
      ]
    },
    timestamp: new Date().toISOString()
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server Error:', {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    timestamp: new Date().toISOString()
  });
  
  // Don't leak error details in production
  const isDevelopment = process.env.NODE_ENV !== 'production';
  
  res.status(err.status || 500).json({ 
    success: false,
    error: isDevelopment ? err.message : 'Internal server error',
    timestamp: new Date().toISOString(),
    path: req.path,
    ...(isDevelopment && { stack: err.stack })
  });
});

// 404 handler for API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({ 
    success: false,
    error: 'API endpoint not found',
    path: req.path,
    method: req.method,
    timestamp: new Date().toISOString(),
    availableEndpoints: [
      '/api/anime/popular',
      '/api/anime/trending',
      '/api/anime/search?q=QUERY',
      '/api/anime/details/ID',
      '/api/health',
      '/api/status'
    ]
  });
});

// 404 handler for all other routes
app.use('*', (req, res) => {
  res.status(404).json({ 
    success: false,
    error: 'Route not found',
    message: 'The requested resource does not exist',
    path: req.path,
    timestamp: new Date().toISOString(),
    suggestion: 'Visit / for API information or /api/anime/info for endpoint details'
  });
});

// Graceful shutdown handling
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received. Shutting down gracefully...');
  process.exit(0);
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Anime Streaming API Server started successfully!`);
  console.log(`📡 Server running on port ${PORT}`);
  console.log(`🌐 API Base URL: http://localhost:${PORT}/api`);
  console.log(`🏥 Health check: http://localhost:${PORT}/api/health`);
  console.log(`📊 Status check: http://localhost:${PORT}/api/status`);
  console.log(`📖 API Info: http://localhost:${PORT}/api/anime/info`);
  console.log(`⚡ Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🕐 Started at: ${new Date().toISOString()}`);
});