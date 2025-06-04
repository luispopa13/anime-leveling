// backend/services/animeService.js
const AniList = require('./scrapers/AniList');
const gogo = require('./scrapers/gogoanime');
const zoro = require('./scrapers/zoro');

exports.getEpisodeStreams = async (animeId, episodeId) => {
  try {
    // Try Gogoanime first
    const gogoData = await gogo.fetchEpisodeSources(episodeId);
    if (gogoData?.sources?.length > 0) {
      return {
        success: true,
        source: 'gogoanime',
        data: gogoData,
      };
    }

    // Fallback to Zoro if Gogo fails
    const zoroData = await zoro.getSourcesZoro(episodeId);
    if (zoroData?.sources?.length > 0) {
      return {
        success: true,
        source: 'zoro',
        data: zoroData,
      };
    }

    return { success: false, error: 'No valid streams found.' };
  } catch (err) {
    console.error('Error in getEpisodeStreams:', err.message);
    return { success: false, error: 'Failed to fetch episode streams.' };
  }
};

class AnimeService {
  constructor() {
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes cache
  }

  // Cache helper methods
  getCacheKey(method, ...args) {
    return `${method}_${args.join('_')}`;
  }

  getFromCache(key) {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }
    this.cache.delete(key);
    return null;
  }

  setCache(key, data) {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  // Popular anime (all-time)
  async getPopularAnime(page = 1, perPage = 20) {
    const cacheKey = this.getCacheKey('popular', page, perPage);
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    try {
      console.log(`Fetching popular anime - page: ${page}, perPage: ${perPage}`);
      const result = await AniList.getAllTimePopular(page, perPage);
      
      const response = {
        success: true,
        data: result.results || [],
        pageInfo: result.pageInfo || {},
        total: result.results?.length || 0
      };

      this.setCache(cacheKey, response);
      return response;
    } catch (error) {
      console.error('Error in getPopularAnime:', error);
      return { 
        success: false, 
        data: [], 
        error: error.message,
        pageInfo: {}
      };
    }
  }

  // Trending anime
  async getTrendingAnime(page = 1, perPage = 20) {
    const cacheKey = this.getCacheKey('trending', page, perPage);
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    try {
      console.log(`Fetching trending anime - page: ${page}, perPage: ${perPage}`);
      const result = await AniList.getTrendingAnime(page, perPage);
      
      const response = {
        success: true,
        data: result.results || [],
        pageInfo: result.pageInfo || {},
        total: result.results?.length || 0
      };

      this.setCache(cacheKey, response);
      return response;
    } catch (error) {
      console.error('Error in getTrendingAnime:', error);
      return { 
        success: false, 
        data: [], 
        error: error.message,
        pageInfo: {}
      };
    }
  }

  // Popular this season - Enhanced with better error handling
  async getPopularThisSeason(page = 1, perPage = 20) {
    const cacheKey = this.getCacheKey('popularSeason', page, perPage);
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    try {
      console.log(`Fetching popular this season - page: ${page}, perPage: ${perPage}`);
      const result = await AniList.getPopularThisSeason(page, perPage);
      
      // Ensure we have valid data
      if (!result || (!result.results && !result.data)) {
        console.warn('No results found for popular this season');
        return {
          success: true,
          data: [],
          pageInfo: {},
          total: 0,
          message: 'No anime found for current season'
        };
      }

      const animeData = result.results || result.data || [];
      const response = {
        success: true,
        data: animeData,
        pageInfo: result.pageInfo || {},
        total: animeData.length,
        season: this.getCurrentSeason()
      };

      this.setCache(cacheKey, response);
      console.log(`Popular this season loaded: ${animeData.length} items`);
      return response;
    } catch (error) {
      console.error('Error in getPopularThisSeason:', error);
      return { 
        success: false, 
        data: [], 
        error: error.message,
        pageInfo: {}
      };
    }
  }

  // Upcoming next season
  async getUpcomingNextSeason(page = 1, perPage = 20) {
    const cacheKey = this.getCacheKey('upcomingSeason', page, perPage);
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    try {
      console.log(`Fetching upcoming next season - page: ${page}, perPage: ${perPage}`);
      const result = await AniList.getUpcomingNextSeason(page, perPage);
      
      const response = {
        success: true,
        data: result.results || [],
        pageInfo: result.pageInfo || {},
        total: result.results?.length || 0,
        nextSeason: this.getNextSeason()
      };

      this.setCache(cacheKey, response);
      return response;
    } catch (error) {
      console.error('Error in getUpcomingNextSeason:', error);
      return { 
        success: false, 
        data: [], 
        error: error.message,
        pageInfo: {}
      };
    }
  }

  // Top 100 anime - Enhanced
  async getTop100Anime(page = 1, perPage = 100) {
    const cacheKey = this.getCacheKey('top100', page, perPage);
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    try {
      console.log(`Fetching top 100 anime - page: ${page}, perPage: ${perPage}`);
      const result = await AniList.getTop100Anime(page, perPage);
      
      const response = {
        success: true,
        data: result.results || [],
        pageInfo: result.pageInfo || {},
        total: result.results?.length || 0
      };

      this.setCache(cacheKey, response);
      return response;
    } catch (error) {
      console.error('Error in getTop100Anime:', error);
      return { 
        success: false, 
        data: [], 
        error: error.message,
        pageInfo: {}
      };
    }
  }

  // Recently updated anime
  async getRecentlyUpdated(page = 1, perPage = 20) {
    const cacheKey = this.getCacheKey('recentlyUpdated', page, perPage);
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    try {
      console.log(`Fetching recently updated - page: ${page}, perPage: ${perPage}`);
      const result = await AniList.getRecentlyUpdated(page, perPage);
      
      const response = {
        success: true,
        data: result.results || [],
        pageInfo: result.pageInfo || {},
        total: result.results?.length || 0
      };

      this.setCache(cacheKey, response);
      return response;
    } catch (error) {
      console.error('Error in getRecentlyUpdated:', error);
      return { 
        success: false, 
        data: [], 
        error: error.message,
        pageInfo: {}
      };
    }
  }

  // Upcoming anime (general)
  async getUpcomingAnime(page = 1, perPage = 20) {
    const cacheKey = this.getCacheKey('upcoming', page, perPage);
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    try {
      console.log(`Fetching upcoming anime - page: ${page}, perPage: ${perPage}`);
      const result = await AniList.getUpcomingAnime(page, perPage);
      
      const response = {
        success: true,
        data: result.results || [],
        pageInfo: result.pageInfo || {},
        total: result.results?.length || 0
      };

      this.setCache(cacheKey, response);
      return response;
    } catch (error) {
      console.error('Error in getUpcomingAnime:', error);
      return { 
        success: false, 
        data: [], 
        error: error.message,
        pageInfo: {}
      };
    }
  }

  // Search anime - Enhanced
  async searchAnime(query, page = 1, perPage = 25) {
    try {
      if (!query || query.trim() === '') {
        return { 
          success: false, 
          data: [], 
          error: 'Search query is required',
          pageInfo: {}
        };
      }
      
      const trimmedQuery = query.trim();
      console.log(`Searching anime: "${trimmedQuery}" - page: ${page}, perPage: ${perPage}`);
      
      const result = await AniList.searchAnime(trimmedQuery, page, perPage);
      
      return {
        success: true,
        data: result.results || [],
        pageInfo: result.pageInfo || {},
        query: trimmedQuery,
        total: result.results?.length || 0
      };
    } catch (error) {
      console.error('Error in searchAnime:', error);
      return { 
        success: false, 
        data: [], 
        error: error.message,
        pageInfo: {},
        query: query
      };
    }
  }

  // Get anime details - Enhanced with better error handling
  async getAnimeDetails(id) {
    const cacheKey = this.getCacheKey('details', id);
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    try {
      if (!id) {
        return { 
          success: false, 
          data: null, 
          error: 'Anime ID is required' 
        };
      }

      console.log(`Fetching anime details for ID: ${id}`);
      const result = await AniList.getAnimeDetails(id);
      
      if (!result) {
        return { 
          success: false, 
          data: null, 
          error: 'Anime not found' 
        };
      }

      // Ensure all required fields are present
      const enhancedResult = {
        ...result,
        // Add default values for missing fields
        rating: result.rating || result.score || 'N/A',
        totalEpisodes: result.totalEpisodes || result.episodes || 'Unknown',
        status: result.status || 'Unknown',
        year: result.year || result.startDate?.year || 'Unknown',
        genres: result.genres || [],
        alternativeTitles: result.alternativeTitles || [],
        description: result.description || 'No description available.',
        image: result.image || result.coverImage || null
      };

      const response = {
        success: true,
        data: enhancedResult
      };

      this.setCache(cacheKey, response);
      return response;
    } catch (error) {
      console.error('Error in getAnimeDetails:', error);
      return { 
        success: false, 
        data: null, 
        error: error.message 
      };
    }
  }

  // Get all categories at once - Enhanced
  async getAllCategories(perPage = 20) {
    const cacheKey = this.getCacheKey('allCategories', perPage);
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    try {
      console.log('Fetching all categories...');
      
      // Fetch all categories in parallel
      const [
        popular,
        trending,
        popularSeason,
        upcomingSeason,
        top100
      ] = await Promise.all([
        this.getPopularAnime(1, perPage),
        this.getTrendingAnime(1, perPage),
        this.getPopularThisSeason(1, perPage),
        this.getUpcomingNextSeason(1, perPage),
        this.getTop100Anime(1, Math.min(perPage * 2, 50))
      ]);

      const result = {
        popular: popular.data || [],
        trending: trending.data || [],
        popularThisSeason: popularSeason.data || [],
        upcomingNextSeason: upcomingSeason.data || [],
        top100: top100.data || [],
        metadata: {
          popularSeason: popularSeason.season,
          nextSeason: upcomingSeason.nextSeason,
          lastUpdated: new Date().toISOString()
        }
      };

      const response = {
        success: true,
        data: result
      };

      this.setCache(cacheKey, response);
      return response;
    } catch (error) {
      console.error('Error in getAllCategories:', error);
      return { 
        success: false, 
        data: {}, 
        error: error.message 
      };
    }
  }

  // Latest anime episodes (placeholder for consumet integration)
  async getLatestAnime(page = 1, perPage = 20) {
    try {
      console.log(`Fetching latest anime - page: ${page}, perPage: ${perPage}`);
      // For now, return recently updated anime from AniList
      // Replace with consumet when available
      const result = await this.getRecentlyUpdated(page, perPage);
      
      return {
        ...result,
        note: 'Showing recently updated anime from AniList'
      };
    } catch (error) {
      console.error('Error in getLatestAnime:', error);
      return { 
        success: false, 
        data: [], 
        error: error.message,
        pageInfo: {}
      };
    }
  }

  // Get anime by genre
  async getAnimeByGenre(genre, page = 1, perPage = 20) {
    const cacheKey = this.getCacheKey('byGenre', genre, page, perPage);
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    try {
      console.log(`Fetching anime by genre: ${genre} - page: ${page}, perPage: ${perPage}`);
      const result = await AniList.getAnimeByGenre(genre, page, perPage);
      
      const response = {
        success: true,
        data: result.results || [],
        pageInfo: result.pageInfo || {},
        genre: genre,
        total: result.results?.length || 0
      };

      this.setCache(cacheKey, response);
      return response;
    } catch (error) {
      console.error('Error in getAnimeByGenre:', error);
      return { 
        success: false, 
        data: [], 
        error: error.message,
        pageInfo: {},
        genre: genre
      };
    }
  }

  // Get anime by year
  async getAnimeByYear(year, page = 1, perPage = 20) {
    const cacheKey = this.getCacheKey('byYear', year, page, perPage);
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    try {
      console.log(`Fetching anime by year: ${year} - page: ${page}, perPage: ${perPage}`);
      const result = await AniList.getAnimeByYear(year, page, perPage);
      
      const response = {
        success: true,
        data: result.results || [],
        pageInfo: result.pageInfo || {},
        year: year,
        total: result.results?.length || 0
      };

      this.setCache(cacheKey, response);
      return response;
    } catch (error) {
      console.error('Error in getAnimeByYear:', error);
      return { 
        success: false, 
        data: [], 
        error: error.message,
        pageInfo: {},
        year: year
      };
    }
  }

  // Get anime by season and year
  async getAnimeBySeasonYear(season, year, page = 1, perPage = 20) {
    const cacheKey = this.getCacheKey('bySeasonYear', season, year, page, perPage);
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    try {
      console.log(`Fetching anime by season: ${season} ${year} - page: ${page}, perPage: ${perPage}`);
      const result = await AniList.getAnimeBySeasonYear(season, year, page, perPage);
      
      const response = {
        success: true,
        data: result.results || [],
        pageInfo: result.pageInfo || {},
        season: season,
        year: year,
        total: result.results?.length || 0
      };

      this.setCache(cacheKey, response);
      return response;
    } catch (error) {
      console.error('Error in getAnimeBySeasonYear:', error);
      return { 
        success: false, 
        data: [], 
        error: error.message,
        pageInfo: {},
        season: season,
        year: year
      };
    }
  }

  // Helper methods for season calculations
  getCurrentSeason() {
    const now = new Date();
    const month = now.getMonth() + 1; // getMonth() returns 0-11
    const year = now.getFullYear();

    let season;
    if (month >= 1 && month <= 3) season = 'WINTER';
    else if (month >= 4 && month <= 6) season = 'SPRING';
    else if (month >= 7 && month <= 9) season = 'SUMMER';
    else season = 'FALL';

    return { season, year };
  }

  getNextSeason() {
    const current = this.getCurrentSeason();
    const seasons = ['WINTER', 'SPRING', 'SUMMER', 'FALL'];
    const currentIndex = seasons.indexOf(current.season);
    
    let nextSeason = seasons[(currentIndex + 1) % 4];
    let nextYear = current.year;
    
    if (nextSeason === 'WINTER' && current.season === 'FALL') {
      nextYear += 1;
    }

    return { season: nextSeason, year: nextYear };
  }

  // Clear cache method (useful for development/testing)
  clearCache() {
    this.cache.clear();
    console.log('AnimeService cache cleared');
  }

  // Get cache status
  getCacheStatus() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
      timeout: this.cacheTimeout
    };
  }
}
exports.getStreamingUrl = async (animeId, episodeNumber) => {
  // Real implementation would call a 3rd-party source or use embedded video
  return {
    url: `https://my-anime-streaming.cdn/${animeId}/ep${episodeNumber}.mp4`,
  };
};
module.exports = new AnimeService();