require('dotenv').config();

const express = require('express');
const corsMiddleware = require('./middleware/cors');

const animeRoutes = require('./routes/animeRoutes');
const animeContentRoutes = require('./routes/animeContentRoutes');
const episodeContentRoutes = require('./routes/episodeContentRoutes');
const sitemapRoutes = require('./routes/sitemapRoutes');
const { connectDB } = require('./utils/db');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(corsMiddleware);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

if (process.env.NODE_ENV !== 'production') {
  app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
  });
}

// Root route
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Anime Streaming API is running!',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    endpoints: {
      root: '/',
      sitemap: '/sitemap.xml',
      health: '/api/health',
      status: '/api/status',
      popular: '/api/anime/popular',
      trending: '/api/anime/trending',
      top100: '/api/anime/top100',
      latest: '/api/anime/latest',
      search: '/api/anime/search?q=YOUR_QUERY',
      details: '/api/anime/details/ANIME_ID',
      animeContentGet: '/api/content/anime/ANIME_ID',
      animeContentUpsert: 'POST /api/content/anime',
      animeContentDelete: 'DELETE /api/content/anime/ANIME_ID',
      episodeContentGet: '/api/content/episode/ANIME_ID/EPISODE_NUMBER',
      episodeContentUpsert: 'POST /api/content/episode',
      episodeContentDelete: 'DELETE /api/content/episode/ANIME_ID/EPISODE_NUMBER',
    },
  });
});

// Placeholder image endpoint
app.get('/api/placeholder/:width/:height', (req, res) => {
  const { width, height } = req.params;

  const w = Math.min(Math.max(parseInt(width) || 300, 50), 1000);
  const h = Math.min(Math.max(parseInt(height) || 400, 50), 1000);

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
  res.setHeader('Cache-Control', 'public, max-age=86400');
  res.send(svg);
});

// Routes
app.use('/api/anime', animeRoutes);
app.use('/api/content/anime', animeContentRoutes);
app.use('/api/content/episode', episodeContentRoutes);
app.use('/', sitemapRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    message: 'Anime API is running!',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    environment: process.env.NODE_ENV || 'development',
  });
});

// API status endpoint
app.get('/api/status', (req, res) => {
  res.json({
    success: true,
    api: 'Anime Streaming API',
    version: '1.0.0',
    status: 'operational',
    timestamp: new Date().toISOString(),
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
    suggestion: 'Visit / for API information or /sitemap.xml for sitemap',
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server Error:', {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    timestamp: new Date().toISOString(),
  });

  const isDevelopment = process.env.NODE_ENV !== 'production';

  res.status(err.status || 500).json({
    success: false,
    error: isDevelopment ? err.message : 'Internal server error',
    timestamp: new Date().toISOString(),
    path: req.path,
    ...(isDevelopment && { stack: err.stack }),
  });
});

process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received. Shutting down gracefully...');
  process.exit(0);
});

async function startServer() {
  try {
    await connectDB();

    app.listen(PORT, () => {
      console.log(`🚀 Anime Streaming API Server started successfully!`);
      console.log(`📡 Server running on port ${PORT}`);
      console.log(`🌐 API Base URL: http://localhost:${PORT}/api`);
      console.log(`🗺️ Sitemap: http://localhost:${PORT}/sitemap.xml`);
      console.log(`🏥 Health check: http://localhost:${PORT}/api/health`);
      console.log(`📊 Status check: http://localhost:${PORT}/api/status`);
      console.log(`📖 API Info: http://localhost:${PORT}/api/anime/info`);
      console.log(`⚡ Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🕐 Started at: ${new Date().toISOString()}`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error.message);
    process.exit(1);
  }
}

startServer();