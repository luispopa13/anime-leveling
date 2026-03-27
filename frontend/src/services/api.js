// services/api.js
// Cache in memorie pentru sesiunea curenta (supravietuieste navigarii React)
const _memCache = new Map();
const _MEM_TTL = {
  homepage: 20 * 60 * 1000,
  details : 4  * 60 * 60 * 1000,
  search  : 3  * 60 * 1000,
};
function _memGet(key, ttl) {
  const h = _memCache.get(key);
  if (h && Date.now() - h.ts < ttl) return h.data;
  _memCache.delete(key);
  return null;
}
function _memSet(key, data) { _memCache.set(key, { data, ts: Date.now() }); }

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

class AnimeAPI {
  constructor() {
    this.timeout = 15000;
  }

  async fetchWithErrorHandling(url, options = {}) {
    try {
      const response = await fetch(url, {
        ...options,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `HTTP error! status: ${response.status}`);
      }

      return data.success ? data.data : [];
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }

  // Popular anime (all-time)
  async getPopular(page = 1, perPage = 20) {
    const key = `popular_${page}_${perPage}`;
    const hit = _memGet(key, _MEM_TTL.homepage);
    if (hit) return hit;
    const data = await this.fetchWithErrorHandling(`${API_BASE_URL}/anime/popular?page=${page}&perPage=${perPage}`);
    if (data) _memSet(key, data);
    return data;
  }

  // Trending anime
  async getTrending(page = 1, perPage = 20) {
    const key = `trending_${page}_${perPage}`;
    const hit = _memGet(key, _MEM_TTL.homepage);
    if (hit) return hit;
    const data = await this.fetchWithErrorHandling(`${API_BASE_URL}/anime/trending?page=${page}&perPage=${perPage}`);
    if (data) _memSet(key, data);
    return data;
  }

  // Top 100 anime
  async getTop100(page = 1, perPage = 50) {
    return this.fetchWithErrorHandling(
      `${API_BASE_URL}/anime/top100?page=${page}&perPage=${perPage}`
    );
  }

  // Popular this season
  async getPopularThisSeason(page = 1, perPage = 20) {
    return this.fetchWithErrorHandling(
      `${API_BASE_URL}/anime/season/popular?page=${page}&perPage=${perPage}`
    );
  }

  // Upcoming next season
  async getUpcomingNextSeason(page = 1, perPage = 20) {
    return this.fetchWithErrorHandling(
      `${API_BASE_URL}/anime/season/upcoming?page=${page}&perPage=${perPage}`
    );
  }

  // Latest anime
  async getLatest(page = 1, perPage = 20) {
    return this.fetchWithErrorHandling(
      `${API_BASE_URL}/anime/latest?page=${page}&perPage=${perPage}`
    );
  }

  // Recently updated
  async getRecentlyUpdated(page = 1, perPage = 20) {
    return this.fetchWithErrorHandling(
      `${API_BASE_URL}/anime/recently-updated?page=${page}&perPage=${perPage}`
    );
  }

  // Upcoming anime (general)
  async getUpcoming(page = 1, perPage = 20) {
    return this.fetchWithErrorHandling(
      `${API_BASE_URL}/anime/upcoming?page=${page}&perPage=${perPage}`
    );
  }

  // Search anime — cache 3 min
  async search(query, page = 1, perPage = 25) {
    const key = `search_${query}_${page}_${perPage}`;
    const hit = _memGet(key, _MEM_TTL.search);
    if (hit) return hit;
    const encodedQuery = encodeURIComponent(query);
    const data = await this.fetchWithErrorHandling(`${API_BASE_URL}/anime/search?q=${encodedQuery}&page=${page}&perPage=${perPage}`);
    if (data) _memSet(key, data);
    return data;
  }

  // Get anime details — cache 4 ore
  async getDetails(id) {
    const key = `details_${id}`;
    const hit = _memGet(key, _MEM_TTL.details);
    if (hit) return hit;
    const data = await this.fetchWithErrorHandling(`${API_BASE_URL}/anime/details/${id}`);
    if (data) _memSet(key, data);
    return data;
  }

  // Get anime by genre
  async getByGenre(genre, page = 1, perPage = 20) {
    return this.fetchWithErrorHandling(
      `${API_BASE_URL}/anime/genre/${encodeURIComponent(genre)}?page=${page}&perPage=${perPage}`
    );
  }

  // Get anime by year
  async getByYear(year, page = 1, perPage = 20) {
    return this.fetchWithErrorHandling(
      `${API_BASE_URL}/anime/year/${year}?page=${page}&perPage=${perPage}`
    );
  }

  // Get anime by season and year
  async getBySeason(season, year, page = 1, perPage = 20) {
    return this.fetchWithErrorHandling(
      `${API_BASE_URL}/anime/season/${season}/${year}?page=${page}&perPage=${perPage}`
    );
  }

  // Get all categories at once
  async getAllCategories(perPage = 20) {
    return this.fetchWithErrorHandling(
      `${API_BASE_URL}/anime/all-categories?perPage=${perPage}`
    );
  }

  // Get episodes for an anime
  async getEpisodes(animeId) {
    const cleanId = animeId.toString().replace(/^(anilist-|\D*)/, '');

    try {
      // FIX: backend route should be /anime/episodes/:id
      return this.fetchWithErrorHandling(`${API_BASE_URL}/anime/episodes/${cleanId}`);
    } catch (error) {
      console.error('Error fetching episodes:', error);

      // Fallback: create placeholder episodes based on anime details
      try {
        const animeDetails = await this.getDetails(animeId);
        if (animeDetails && animeDetails.totalEpisodes > 0) {
          const episodes = Array.from(
            { length: Math.min(animeDetails.totalEpisodes, 50) },
            (_, index) => ({
              id: `${cleanId}-episode-${index + 1}`,
              number: index + 1,
              title: `Episode ${index + 1}`,
              description: null,
              image: animeDetails.image,
              duration: animeDetails.duration ? animeDetails.duration * 60 : null,
              airDate: null,
              url: null,
            })
          );

          return { episodes, totalEpisodes: animeDetails.totalEpisodes };
        }
      } catch (fallbackError) {
        console.error('Fallback also failed:', fallbackError);
      }

      return { episodes: [], totalEpisodes: 0 };
    }
  }

  // WATCH PROGRESS MANAGEMENT
  async updateWatchProgress(animeId, episodeNumber, currentTime, duration = 1, userId = null) {
    const cleanId = animeId.toString().replace(/^(anilist-|\D*)/, '');
    const safeDuration = duration > 0 ? duration : 1;
    const progress = Math.min((currentTime / safeDuration) * 100, 100);
    const isCompleted = progress > 90;

    try {
      const progressKey = `watch_progress_${cleanId}`;
      const savedProgress = JSON.parse(localStorage.getItem(progressKey) || '{}');

      savedProgress[episodeNumber] = {
        currentTime,
        duration,
        progress,
        completed: isCompleted,
        lastWatched: Date.now(),
        started: true,
      };

      localStorage.setItem(progressKey, JSON.stringify(savedProgress));
    } catch (localStorageError) {
      console.warn('LocalStorage not available:', localStorageError);
    }

    try {
      const response = await fetch(`${API_BASE_URL}/anime/progress`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          animeId: cleanId,
          episodeNumber,
          currentTime,
          duration,
          progress,
          completed: isCompleted,
          userId,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to update progress');
      }

      return data;
    } catch (error) {
      console.error('Progress sync failed:', error);
      return { success: false };
    }
  }
}

export const animeAPI = new AnimeAPI();