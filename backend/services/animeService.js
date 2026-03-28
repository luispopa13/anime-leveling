// backend/services/animeService.js
const AniList = require('./scrapers/AniList');

class AnimeService {
  constructor() {
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
  }

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
      timestamp: Date.now(),
    });
  }

  async getPopularAnime(page = 1, perPage = 20) {
    const cacheKey = this.getCacheKey('popular', page, perPage);
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    try {
      const result = await AniList.getAllTimePopular(page, perPage);

      const response = {
        success: true,
        data: result.results || [],
        pageInfo: result.pageInfo || {},
        total: result.results?.length || 0,
      };

      this.setCache(cacheKey, response);
      return response;
    } catch (error) {
      return {
        success: false,
        data: [],
        error: error.message,
        pageInfo: {},
      };
    }
  }

  async getTrendingAnime(page = 1, perPage = 20) {
    const cacheKey = this.getCacheKey('trending', page, perPage);
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    try {
      const result = await AniList.getTrendingAnime(page, perPage);

      const response = {
        success: true,
        data: result.results || [],
        pageInfo: result.pageInfo || {},
        total: result.results?.length || 0,
      };

      this.setCache(cacheKey, response);
      return response;
    } catch (error) {
      return {
        success: false,
        data: [],
        error: error.message,
        pageInfo: {},
      };
    }
  }

  async getPopularThisSeason(page = 1, perPage = 20) {
    const cacheKey = this.getCacheKey('popularSeason', page, perPage);
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    try {
      const result = await AniList.getPopularThisSeason(page, perPage);
      const animeData = result.results || result.data || [];

      const response = {
        success: true,
        data: animeData,
        pageInfo: result.pageInfo || {},
        total: animeData.length,
        season: this.getCurrentSeason(),
      };

      this.setCache(cacheKey, response);
      return response;
    } catch (error) {
      return {
        success: false,
        data: [],
        error: error.message,
        pageInfo: {},
      };
    }
  }

  async getUpcomingNextSeason(page = 1, perPage = 20) {
    const cacheKey = this.getCacheKey('upcomingSeason', page, perPage);
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    try {
      const result = await AniList.getUpcomingNextSeason(page, perPage);

      const response = {
        success: true,
        data: result.results || [],
        pageInfo: result.pageInfo || {},
        total: result.results?.length || 0,
        nextSeason: this.getNextSeason(),
      };

      this.setCache(cacheKey, response);
      return response;
    } catch (error) {
      return {
        success: false,
        data: [],
        error: error.message,
        pageInfo: {},
      };
    }
  }

  async getTop100Anime(page = 1, perPage = 100) {
    const cacheKey = this.getCacheKey('top100', page, perPage);
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    try {
      const result = await AniList.getTop100Anime(page, perPage);

      const response = {
        success: true,
        data: result.results || [],
        pageInfo: result.pageInfo || {},
        total: result.results?.length || 0,
      };

      this.setCache(cacheKey, response);
      return response;
    } catch (error) {
      return {
        success: false,
        data: [],
        error: error.message,
        pageInfo: {},
      };
    }
  }

  async getRecentlyUpdated(page = 1, perPage = 20) {
    const cacheKey = this.getCacheKey('recentlyUpdated', page, perPage);
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    try {
      const result = await AniList.getRecentlyUpdated(page, perPage);

      const response = {
        success: true,
        data: result.results || [],
        pageInfo: result.pageInfo || {},
        total: result.results?.length || 0,
      };

      this.setCache(cacheKey, response);
      return response;
    } catch (error) {
      return {
        success: false,
        data: [],
        error: error.message,
        pageInfo: {},
      };
    }
  }

  async getUpcomingAnime(page = 1, perPage = 20) {
    const cacheKey = this.getCacheKey('upcoming', page, perPage);
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    try {
      const result = await AniList.getUpcomingAnime(page, perPage);

      const response = {
        success: true,
        data: result.results || [],
        pageInfo: result.pageInfo || {},
        total: result.results?.length || 0,
      };

      this.setCache(cacheKey, response);
      return response;
    } catch (error) {
      return {
        success: false,
        data: [],
        error: error.message,
        pageInfo: {},
      };
    }
  }

  async searchAnime(query, page = 1, perPage = 25) {
    try {
      if (!query || query.trim() === '') {
        return {
          success: false,
          data: [],
          error: 'Search query is required',
          pageInfo: {},
        };
      }

      const trimmedQuery = query.trim();
      const result = await AniList.searchAnime(trimmedQuery, page, perPage);

      return {
        success: true,
        data: result.results || [],
        pageInfo: result.pageInfo || {},
        query: trimmedQuery,
        total: result.results?.length || 0,
      };
    } catch (error) {
      return {
        success: false,
        data: [],
        error: error.message,
        pageInfo: {},
        query,
      };
    }
  }

  async getAnimeDetails(id) {
    const cacheKey = this.getCacheKey('details', id);
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    try {
      if (!id) {
        return {
          success: false,
          data: null,
          error: 'Anime ID is required',
        };
      }

      const result = await AniList.getAnimeDetails(id);

      if (!result) {
        return {
          success: false,
          data: null,
          error: 'Anime not found',
        };
      }

      const enhancedResult = {
        ...result,
        rating: result.rating || result.score || 'N/A',
        totalEpisodes: result.totalEpisodes || result.episodes || 'Unknown',
        status: result.status || 'Unknown',
        year: result.year || result.startDate?.year || 'Unknown',
        genres: result.genres || [],
        alternativeTitles: result.alternativeTitles || [],
        description: result.description || 'No description available.',
        image: result.image || result.coverImage || null,
      };

      const response = {
        success: true,
        data: enhancedResult,
      };

      this.setCache(cacheKey, response);
      return response;
    } catch (error) {
      return {
        success: false,
        data: null,
        error: error.message,
      };
    }
  }

  async getAllCategories(perPage = 20) {
    const cacheKey = this.getCacheKey('allCategories', perPage);
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    const sleep = (ms) => new Promise(r => setTimeout(r, ms));

    try {
      const popular        = await this.getPopularAnime(1, perPage);
      await sleep(400);
      const trending       = await this.getTrendingAnime(1, perPage);
      await sleep(400);
      const popularSeason  = await this.getPopularThisSeason(1, perPage);
      await sleep(400);
      const upcomingSeason = await this.getUpcomingNextSeason(1, perPage);
      await sleep(400);
      const top100         = await this.getTop100Anime(1, Math.min(perPage * 2, 50));

      const result = {
        popular: popular.data || [],
        trending: trending.data || [],
        popularThisSeason: popularSeason.data || [],
        upcomingNextSeason: upcomingSeason.data || [],
        top100: top100.data || [],
        metadata: {
          popularSeason: popularSeason.season,
          nextSeason: upcomingSeason.nextSeason,
          lastUpdated: new Date().toISOString(),
        },
      };

      const response = {
        success: true,
        data: result,
      };

      this.setCache(cacheKey, response);
      return response;
    } catch (error) {
      return {
        success: false,
        data: {},
        error: error.message,
      };
    }
  }

  async getLatestAnime(page = 1, perPage = 20) {
    try {
      const result = await this.getRecentlyUpdated(page, perPage);

      return {
        ...result,
        note: 'Showing recently updated anime from AniList',
      };
    } catch (error) {
      return {
        success: false,
        data: [],
        error: error.message,
        pageInfo: {},
      };
    }
  }

  async getAnimeByGenre(genre, page = 1, perPage = 20) {
    const cacheKey = this.getCacheKey('byGenre', genre, page, perPage);
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    try {
      const result = await AniList.getAnimeByGenre(genre, page, perPage);

      const response = {
        success: true,
        data: result.results || [],
        pageInfo: result.pageInfo || {},
        genre,
        total: result.results?.length || 0,
      };

      this.setCache(cacheKey, response);
      return response;
    } catch (error) {
      return {
        success: false,
        data: [],
        error: error.message,
        pageInfo: {},
        genre,
      };
    }
  }

  async getAnimeByYear(year, page = 1, perPage = 20) {
    const cacheKey = this.getCacheKey('byYear', year, page, perPage);
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    try {
      const result = await AniList.getAnimeByYear(year, page, perPage);

      const response = {
        success: true,
        data: result.results || [],
        pageInfo: result.pageInfo || {},
        year,
        total: result.results?.length || 0,
      };

      this.setCache(cacheKey, response);
      return response;
    } catch (error) {
      return {
        success: false,
        data: [],
        error: error.message,
        pageInfo: {},
        year,
      };
    }
  }

  async getAnimeBySeasonYear(season, year, page = 1, perPage = 20) {
    const cacheKey = this.getCacheKey('bySeasonYear', season, year, page, perPage);
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    try {
      const result = await AniList.getAnimeBySeasonYear(season, year, page, perPage);

      const response = {
        success: true,
        data: result.results || [],
        pageInfo: result.pageInfo || {},
        season,
        year,
        total: result.results?.length || 0,
      };

      this.setCache(cacheKey, response);
      return response;
    } catch (error) {
      return {
        success: false,
        data: [],
        error: error.message,
        pageInfo: {},
        season,
        year,
      };
    }
  }

  async getEpisodes(id) {
    const cacheKey = this.getCacheKey('episodes', id);
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    try {
      const result = await AniList.getAnimeEpisodes(id);

      const episodes = Array.isArray(result.episodes)
        ? result.episodes.map((episode, index) => ({
            id: episode.id || `${id}-episode-${episode.number || index + 1}`,
            number: episode.number || index + 1,
            title: episode.title || `Episode ${episode.number || index + 1}`,
            description: episode.description || null,
            image: episode.image || null,
            airDate: episode.airDate || null,
            duration: episode.duration || null,
          }))
        : [];

      const response = {
        success: true,
        data: {
          episodes,
          totalEpisodes: result.totalEpisodes || episodes.length,
        },
      };

      this.setCache(cacheKey, response);
      return response;
    } catch (error) {
      return {
        success: false,
        data: {
          episodes: [],
          totalEpisodes: 0,
        },
        error: error.message,
      };
    }
  }

  async getEpisodeWatchOptions(animeId, episodeNumber) {
    try {
      const animeDetailsResult = await this.getAnimeDetails(animeId);

      if (!animeDetailsResult.success || !animeDetailsResult.data) {
        return {
          success: false,
          data: [],
          error: 'Anime details not found',
        };
      }

      const anime = animeDetailsResult.data;
      const title = anime.title || anime.romajiTitle || anime.englishTitle || `Anime ${animeId}`;
      const safeTitle = encodeURIComponent(title);
      const safeSearch = encodeURIComponent(`${title} episode ${episodeNumber}`);

      const options = [
        {
          provider: 'Crunchyroll',
          type: 'official-search',
          url: `https://www.crunchyroll.com/search?q=${safeSearch}`,
        },
        {
          provider: 'Netflix',
          type: 'official-search',
          url: `https://www.netflix.com/search?q=${safeTitle}`,
        },
        {
          provider: 'Prime Video',
          type: 'official-search',
          url: `https://www.primevideo.com/search/ref=atv_nb_sr?phrase=${safeTitle}`,
        },
        {
          provider: 'YouTube',
          type: 'search',
          url: `https://www.youtube.com/results?search_query=${safeSearch}`,
        },
      ];

      return {
        success: true,
        data: {
          animeTitle: title,
          episodeNumber: Number(episodeNumber),
          options,
          trailer: anime.trailer || null,
        },
      };
    } catch (error) {
      return {
        success: false,
        data: {
          animeTitle: null,
          episodeNumber: Number(episodeNumber),
          options: [],
          trailer: null,
        },
        error: error.message,
      };
    }
  }

  async updateWatchProgress(animeId, episodeNumber, progressData) {
    try {
      return {
        success: true,
        data: {
          animeId,
          episodeNumber,
          ...progressData,
          updatedAt: new Date().toISOString(),
        },
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        error: error.message,
      };
    }
  }

  getCurrentSeason() {
    const now = new Date();
    const month = now.getMonth() + 1;
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
    const order = ['WINTER', 'SPRING', 'SUMMER', 'FALL'];
    const currentIndex = order.indexOf(current.season);
    const nextIndex = (currentIndex + 1) % order.length;

    return {
      season: order[nextIndex],
      year: current.season === 'FALL' ? current.year + 1 : current.year,
    };
  }
}

module.exports = new AnimeService();