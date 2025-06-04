// backend/controllers/animeController.js
const animeService = require('../services/animeService');

// Helper function to get pagination parameters
const getPaginationParams = (req) => {
  const page = parseInt(req.query.page) || 1;
  const perPage = Math.min(parseInt(req.query.perPage) || 20, 100); // Max 100 per page
  return { page, perPage };
};

// Helper function to send response
const sendResponse = (res, result, defaultMessage = 'Operation successful') => {
  if (result.success) {
    res.json({
      success: true,
      message: defaultMessage,
      ...result
    });
  } else {
    res.status(500).json({
      success: false,
      message: result.error || 'An error occurred',
      data: result.data || null
    });
  }
};

exports.getPopularAnime = async (req, res) => {
  try {
    const { page, perPage } = getPaginationParams(req);
    const result = await animeService.getPopularAnime(page, perPage);
    sendResponse(res, result, 'Popular anime fetched successfully');
  } catch (err) {
    console.error('Controller error - getPopularAnime:', err);
    res.status(500).json({ 
      success: false,
      message: 'Failed to fetch popular anime',
      error: err.message 
    });
  }
};

exports.getTrendingAnime = async (req, res) => {
  try {
    const { page, perPage } = getPaginationParams(req);
    const result = await animeService.getTrendingAnime(page, perPage);
    sendResponse(res, result, 'Trending anime fetched successfully');
  } catch (err) {
    console.error('Controller error - getTrendingAnime:', err);
    res.status(500).json({ 
      success: false,
      message: 'Failed to fetch trending anime',
      error: err.message 
    });
  }
};

exports.getPopularThisSeason = async (req, res) => {
  try {
    const { page, perPage } = getPaginationParams(req);
    const result = await animeService.getPopularThisSeason(page, perPage);
    sendResponse(res, result, 'Popular anime this season fetched successfully');
  } catch (err) {
    console.error('Controller error - getPopularThisSeason:', err);
    res.status(500).json({ 
      success: false,
      message: 'Failed to fetch season popular anime',
      error: err.message 
    });
  }
};

exports.getUpcomingNextSeason = async (req, res) => {
  try {
    const { page, perPage } = getPaginationParams(req);
    const result = await animeService.getUpcomingNextSeason(page, perPage);
    sendResponse(res, result, 'Upcoming anime next season fetched successfully');
  } catch (err) {
    console.error('Controller error - getUpcomingNextSeason:', err);
    res.status(500).json({ 
      success: false,
      message: 'Failed to fetch upcoming season anime',
      error: err.message 
    });
  }
};

exports.getTop100Anime = async (req, res) => {
  try {
    const { page, perPage } = getPaginationParams(req);
    const result = await animeService.getTop100Anime(page, Math.min(perPage, 100));
    sendResponse(res, result, 'Top 100 anime fetched successfully');
  } catch (err) {
    console.error('Controller error - getTop100Anime:', err);
    res.status(500).json({ 
      success: false,
      message: 'Failed to fetch top 100 anime',
      error: err.message 
    });
  }
};

exports.getRecentlyUpdated = async (req, res) => {
  try {
    const { page, perPage } = getPaginationParams(req);
    const result = await animeService.getRecentlyUpdated(page, perPage);
    sendResponse(res, result, 'Recently updated anime fetched successfully');
  } catch (err) {
    console.error('Controller error - getRecentlyUpdated:', err);
    res.status(500).json({ 
      success: false,
      message: 'Failed to fetch recently updated anime',
      error: err.message 
    });
  }
};

exports.getUpcomingAnime = async (req, res) => {
  try {
    const { page, perPage } = getPaginationParams(req);
    const result = await animeService.getUpcomingAnime(page, perPage);
    sendResponse(res, result, 'Upcoming anime fetched successfully');
  } catch (err) {
    console.error('Controller error - getUpcomingAnime:', err);
    res.status(500).json({ 
      success: false,
      message: 'Failed to fetch upcoming anime',
      error: err.message 
    });
  }
};

exports.getLatestAnime = async (req, res) => {
  try {
    const { page, perPage } = getPaginationParams(req);
    const result = await animeService.getLatestAnime(page, perPage);
    sendResponse(res, result, 'Latest anime fetched successfully');
  } catch (err) {
    console.error('Controller error - getLatestAnime:', err);
    res.status(500).json({ 
      success: false,
      message: 'Failed to fetch latest anime',
      error: err.message 
    });
  }
};

exports.searchAnime = async (req, res) => {
  try {
    const query = req.query.q;
    const { page, perPage } = getPaginationParams(req);
    
    if (!query || query.trim() === '') {
      return res.status(400).json({ 
        success: false,
        message: 'Search query parameter "q" is required',
        data: [] 
      });
    }

    const result = await animeService.searchAnime(query, page, perPage);
    sendResponse(res, result, `Search results for "${query}"`);
  } catch (err) {
    console.error('Controller error - searchAnime:', err);
    res.status(500).json({ 
      success: false,
      message: 'Search failed',
      error: err.message 
    });
  }
};

exports.getAnimeDetails = async (req, res) => {
  try {
    const id = req.params.id;
    
    if (!id) {
      return res.status(400).json({ 
        success: false,
        message: 'Anime ID is required',
        data: null 
      });
    }

    const result = await animeService.getAnimeDetails(id);
    if (result.success) {
      res.json({
        success: true,
        message: 'Anime details fetched successfully',
        data: result.data
      });
    } else {
      res.status(404).json({
        success: false,
        message: result.error || 'Anime not found',
        data: null
      });
    }
  } catch (err) {
    console.error('Controller error - getAnimeDetails:', err);
    res.status(500).json({ 
      success: false,
      message: 'Failed to fetch anime details',
      error: err.message 
    });
  }
};

exports.getAllCategories = async (req, res) => {
  try {
    const perPage = Math.min(parseInt(req.query.perPage) || 20, 50);
    const result = await animeService.getAllCategories(perPage);
    sendResponse(res, result, 'All categories fetched successfully');
  } catch (err) {
    console.error('Controller error - getAllCategories:', err);
    res.status(500).json({ 
      success: false,
      message: 'Failed to fetch all categories',
      error: err.message 
    });
  }
};

exports.getAnimeByGenre = async (req, res) => {
  try {
    const genre = req.params.genre;
    const { page, perPage } = getPaginationParams(req);
    
    if (!genre) {
      return res.status(400).json({ 
        success: false,
        message: 'Genre parameter is required',
        data: [] 
      });
    }

    const result = await animeService.getAnimeByGenre(genre, page, perPage);
    sendResponse(res, result, `Anime in ${genre} genre fetched successfully`);
  } catch (err) {
    console.error('Controller error - getAnimeByGenre:', err);
    res.status(500).json({ 
      success: false,
      message: 'Failed to fetch anime by genre',
      error: err.message 
    });
  }
};

exports.getEpisodes = async (req, res) => {
  const id = req.params.id;
  const result = await animeService.getEpisodes(id);
  res.json(result);
};

exports.getStreamingUrl = async (req, res) => {
  const { animeId, episodeNumber } = req.params;
  const result = await animeService.getStreamingUrl(animeId, episodeNumber);
  res.json(result);
};

exports.updateWatchProgress = async (req, res) => {
  const { animeId, episodeNumber, progress } = req.body;
  // Optional: Save to DB
  res.json({ success: true });
};

exports.getAnimeByYear = async (req, res) => {
  try {
    const year = parseInt(req.params.year);
    const { page, perPage } = getPaginationParams(req);
    
    if (!year || year < 1960 || year > new Date().getFullYear() + 2) {
      return res.status(400).json({ 
        success: false,
        message: 'Valid year parameter is required',
        data: [] 
      });
    }

    const result = await animeService.getAnimeByYear(year, page, perPage);
    sendResponse(res, result, `Anime from ${year} fetched successfully`);
  } catch (err) {
    console.error('Controller error - getAnimeByYear:', err);
    res.status(500).json({ 
      success: false,
      message: 'Failed to fetch anime by year',
      error: err.message 
    });
  }
};

exports.getAnimeBySeasonYear = async (req, res) => {
  try {
    const { season, year } = req.params;
    const { page, perPage } = getPaginationParams(req);
    
    const validSeasons = ['WINTER', 'SPRING', 'SUMMER', 'FALL'];
    const yearNum = parseInt(year);
    
    if (!validSeasons.includes(season.toUpperCase()) || !yearNum) {
      return res.status(400).json({ 
        success: false,
        message: 'Valid season (winter/spring/summer/fall) and year are required',
        data: [] 
      });
    }

    const result = await animeService.getAnimeBySeasonYear(season.toUpperCase(), yearNum, page, perPage);
    sendResponse(res, result, `Anime from ${season} ${year} fetched successfully`);
  } catch (err) {
    console.error('Controller error - getAnimeBySeasonYear:', err);
    res.status(500).json({ 
      success: false,
      message: 'Failed to fetch anime by season and year',
      error: err.message 
    });
  }
};