// backend/routes/animeRoutes.js
const express = require('express');
const router = express.Router();
const animeController = require('../controllers/animeController');

// Main category routes
router.get('/popular', animeController.getPopularAnime);
router.get('/trending', animeController.getTrendingAnime);
router.get('/top100', animeController.getTop100Anime);
router.get('/latest', animeController.getLatestAnime);
router.get('/recently-updated', animeController.getRecentlyUpdated);
router.get('/upcoming', animeController.getUpcomingAnime);

// Seasonal routes
router.get('/season/popular', animeController.getPopularThisSeason);
router.get('/season/upcoming', animeController.getUpcomingNextSeason);
router.get('/season/:season/:year', animeController.getAnimeBySeasonYear);

// Search and details
router.get('/search', animeController.searchAnime);
router.get('/details/:id', animeController.getAnimeDetails);

// Filter routes
router.get('/genre/:genre', animeController.getAnimeByGenre);
router.get('/year/:year', animeController.getAnimeByYear);

// Utility routes
router.get('/all-categories', animeController.getAllCategories);
router.get('/episodes/:id', animeController.getEpisodes);
router.get('/stream/:animeId/:episodeNumber', animeController.getStreamingUrl);
router.post('/progress', animeController.updateWatchProgress);

router.get('/info', (req, res) => {
  res.json({
    success: true,
    message: 'Anime API Routes Information',
    endpoints: {
      categories: {
        popular: '/api/anime/popular - Get all-time popular anime',
        trending: '/api/anime/trending - Get currently trending anime',
        top100: '/api/anime/top100 - Get top 100 highest rated anime',
        latest: '/api/anime/latest - Get latest updated anime',
        recentlyUpdated: '/api/anime/recently-updated - Get recently updated anime',
        upcoming: '/api/anime/upcoming - Get upcoming anime'
      },
      seasonal: {
        popularThisSeason: '/api/anime/season/popular - Get popular anime this season',
        upcomingNextSeason: '/api/anime/season/upcoming - Get upcoming anime next season',
        seasonYear: '/api/anime/season/{season}/{year} - Get anime by season and year'
      },
      search: {
        search: '/api/anime/search?q={query} - Search anime by title',
        details: '/api/anime/details/{id} - Get anime details by ID'
      },
      filters: {
        byGenre: '/api/anime/genre/{genre} - Get anime by genre',
        byYear: '/api/anime/year/{year} - Get anime by year'
      },
      utility: {
        allCategories: '/api/anime/all-categories - Get all categories at once',
        info: '/api/anime/info - This endpoint'
      }
    },
    parameters: {
      pagination: {
        page: 'Page number (default: 1)',
        perPage: 'Items per page (default: 20, max: 100)'
      },
      seasons: ['WINTER', 'SPRING', 'SUMMER', 'FALL'],
      example_urls: [
        '/api/anime/popular?page=1&perPage=20',
        '/api/anime/search?q=attack%20on%20titan&page=1',
        '/api/anime/season/SPRING/2024',
        '/api/anime/genre/Action',
        '/api/anime/year/2024'
      ]
    }
  });
});

module.exports = router;