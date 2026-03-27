// backend/controllers/animeController.js
const animeService = require('../services/animeService');

const getPaginationParams = (req) => {
  const page = parseInt(req.query.page, 10) || 1;
  const perPage = Math.min(parseInt(req.query.perPage, 10) || 20, 100);
  return { page, perPage };
};

const sendResponse = (res, result, defaultMessage = 'Operation successful') => {
  if (result.success) {
    return res.json({
      success: true,
      message: defaultMessage,
      ...result,
    });
  }

  return res.status(500).json({
    success: false,
    message: result.error || 'An error occurred',
    data: result.data || null,
  });
};

exports.getPopularAnime = async (req, res) => {
  const { page, perPage } = getPaginationParams(req);
  const result = await animeService.getPopularAnime(page, perPage);
  sendResponse(res, result, 'Popular anime fetched successfully');
};

exports.getTrendingAnime = async (req, res) => {
  const { page, perPage } = getPaginationParams(req);
  const result = await animeService.getTrendingAnime(page, perPage);
  sendResponse(res, result, 'Trending anime fetched successfully');
};

exports.getPopularThisSeason = async (req, res) => {
  const { page, perPage } = getPaginationParams(req);
  const result = await animeService.getPopularThisSeason(page, perPage);
  sendResponse(res, result, 'Popular anime this season fetched successfully');
};

exports.getUpcomingNextSeason = async (req, res) => {
  const { page, perPage } = getPaginationParams(req);
  const result = await animeService.getUpcomingNextSeason(page, perPage);
  sendResponse(res, result, 'Upcoming anime next season fetched successfully');
};

exports.getTop100Anime = async (req, res) => {
  const { page, perPage } = getPaginationParams(req);
  const result = await animeService.getTop100Anime(page, Math.min(perPage, 100));
  sendResponse(res, result, 'Top 100 anime fetched successfully');
};

exports.getLatestAnime = async (req, res) => {
  const { page, perPage } = getPaginationParams(req);
  const result = await animeService.getLatestAnime(page, perPage);
  sendResponse(res, result, 'Latest anime fetched successfully');
};

exports.getRecentlyUpdated = async (req, res) => {
  const { page, perPage } = getPaginationParams(req);
  const result = await animeService.getRecentlyUpdated(page, perPage);
  sendResponse(res, result, 'Recently updated anime fetched successfully');
};

exports.getUpcomingAnime = async (req, res) => {
  const { page, perPage } = getPaginationParams(req);
  const result = await animeService.getUpcomingAnime(page, perPage);
  sendResponse(res, result, 'Upcoming anime fetched successfully');
};

exports.searchAnime = async (req, res) => {
  const { page, perPage } = getPaginationParams(req);
  const query = req.query.q || '';
  const result = await animeService.searchAnime(query, page, perPage);
  sendResponse(res, result, 'Anime search completed successfully');
};

exports.getAnimeDetails = async (req, res) => {
  const { id } = req.params;
  const result = await animeService.getAnimeDetails(id);
  sendResponse(res, result, 'Anime details fetched successfully');
};

exports.getAnimeByGenre = async (req, res) => {
  const { page, perPage } = getPaginationParams(req);
  const { genre } = req.params;
  const result = await animeService.getAnimeByGenre(genre, page, perPage);
  sendResponse(res, result, 'Anime by genre fetched successfully');
};

exports.getAnimeByYear = async (req, res) => {
  const { page, perPage } = getPaginationParams(req);
  const { year } = req.params;
  const result = await animeService.getAnimeByYear(parseInt(year, 10), page, perPage);
  sendResponse(res, result, 'Anime by year fetched successfully');
};

exports.getAnimeBySeasonYear = async (req, res) => {
  const { page, perPage } = getPaginationParams(req);
  const { season, year } = req.params;
  const result = await animeService.getAnimeBySeasonYear(
    season.toUpperCase(),
    parseInt(year, 10),
    page,
    perPage
  );
  sendResponse(res, result, 'Anime by season/year fetched successfully');
};

exports.getAllCategories = async (req, res) => {
  const perPage = Math.min(parseInt(req.query.perPage, 10) || 20, 100);
  const result = await animeService.getAllCategories(perPage);
  sendResponse(res, result, 'All categories fetched successfully');
};

exports.getEpisodes = async (req, res) => {
  const { id } = req.params;
  const result = await animeService.getEpisodes(id);
  sendResponse(res, result, 'Episodes fetched successfully');
};

exports.getEpisodeWatchOptions = async (req, res) => {
  const { animeId, episodeNumber } = req.params;
  const result = await animeService.getEpisodeWatchOptions(animeId, episodeNumber);
  sendResponse(res, result, 'Watch options fetched successfully');
};

exports.updateWatchProgress = async (req, res) => {
  const animeId = req.body.animeId || req.body.id || null;
  const { episodeNumber, currentTime, duration, progress, completed, userId } = req.body;

  if (!episodeNumber) {
    return res.status(400).json({
      success: false,
      message: 'episodeNumber is required',
    });
  }

  const result = await animeService.updateWatchProgress(animeId, episodeNumber, {
    currentTime,
    duration,
    progress,
    completed,
    userId,
  });

  sendResponse(res, result, 'Watch progress updated successfully');
};