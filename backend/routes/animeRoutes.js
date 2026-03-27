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
router.get('/watch-options/:animeId/:episodeNumber', animeController.getEpisodeWatchOptions);
router.post('/progress', animeController.updateWatchProgress);

router.get('/info', (req, res) => {
  res.json({
    success: true,
    message: 'Anime API Routes Information',
    endpoints: {
      categories: {
        popular: '/api/anime/popular',
        trending: '/api/anime/trending',
        top100: '/api/anime/top100',
        latest: '/api/anime/latest',
        recentlyUpdated: '/api/anime/recently-updated',
        upcoming: '/api/anime/upcoming',
      },
      seasonal: {
        popularThisSeason: '/api/anime/season/popular',
        upcomingNextSeason: '/api/anime/season/upcoming',
        seasonYear: '/api/anime/season/{season}/{year}',
      },
      search: {
        search: '/api/anime/search?q={query}',
        details: '/api/anime/details/{id}',
      },
      utility: {
        allCategories: '/api/anime/all-categories',
        episodes: '/api/anime/episodes/{id}',
        watchOptions: '/api/anime/watch-options/{animeId}/{episodeNumber}',
        progress: '/api/anime/progress',
      },
    },
  });
});

module.exports = router;