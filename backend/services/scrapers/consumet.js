// backend/services/scrapers/consumet.js
const axios = require('axios');

class ConsumetService {
  constructor() {
    this.baseUrl = 'https://api.consumet.org';
    this.timeout = 15000;
  }

  async makeRequest(endpoint, retries = 3) {
    for (let i = 0; i < retries; i++) {
      try {
        const response = await axios.get(`${this.baseUrl}${endpoint}`, {
          timeout: this.timeout,
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
          }
        });
        return response.data;
      } catch (error) {
        console.error(`Consumet API Error for ${endpoint} (attempt ${i + 1}):`, error.message);
        if (i === retries - 1) throw error;
        await this.delay(1000 * (i + 1)); // Exponential backoff
      }
    }
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // GogoAnime provider methods
  async getGogoAnimePopular(page = 1) {
    try {
      const data = await this.makeRequest(`/anime/gogoanime/popular?page=${page}`);
      return data.results?.map(anime => ({
        id: `gogo-${anime.id}`,
        title: anime.title,
        image: anime.image,
        link: `#gogo-${anime.id}`,
        year: anime.releaseDate || 'Unknown',
        status: anime.status || 'Unknown',
        genres: anime.genres || [],
        source: 'gogoanime'
      })) || [];
    } catch (error) {
      console.error('Error fetching GogoAnime popular:', error.message);
      return [];
    }
  }

  async getGogoAnimeRecent(page = 1) {
    try {
      const data = await this.makeRequest(`/anime/gogoanime/recent-episodes?page=${page}`);
      return data.results?.map(anime => ({
        id: `gogo-recent-${anime.id}`,
        title: anime.title,
        image: anime.image,
        episode: `Episode ${anime.episodeNumber}`,
        episodeNumber: anime.episodeNumber,
        link: `#gogo-${anime.id}`,
        source: 'gogoanime'
      })) || [];
    } catch (error) {
      console.error('Error fetching GogoAnime recent:', error.message);
      return [];
    }
  }

  async searchGogoAnime(query) {
    try {
      const data = await this.makeRequest(`/anime/gogoanime/${encodeURIComponent(query)}`);
      return data.results?.map(anime => ({
        id: `gogo-${anime.id}`,
        title: anime.title,
        image: anime.image,
        link: `#gogo-${anime.id}`,
        year: anime.releaseDate || 'Unknown',
        status: anime.status || 'Unknown',
        genres: anime.genres || [],
        description: anime.description || '',
        source: 'gogoanime'
      })) || [];
    } catch (error) {
      console.error('Error searching GogoAnime:', error.message);
      return [];
    }
  }

  async getGogoAnimeDetails(id) {
    try {
      const cleanId = id.replace(/^gogo-/, '').replace(/^gogo-search-/, '').replace(/^gogo-recent-/, '');
      const data = await this.makeRequest(`/anime/gogoanime/info/${cleanId}`);
      
      return {
        id: `gogo-${data.id}`,
        title: data.title,
        alternativeTitles: data.otherName ? data.otherName.split(', ') : [],
        image: data.image,
        description: data.description || 'No description available',
        year: data.releaseDate || 'Unknown',
        status: data.status || 'Unknown',
        genres: data.genres || [],
        totalEpisodes: data.totalEpisodes || 0,
        episodes: data.episodes?.map(ep => ({
          id: ep.id,
          number: ep.number,
          title: `Episode ${ep.number}`,
          url: ep.url
        })) || [],
        type: data.type || 'TV',
        source: 'gogoanime'
      };
    } catch (error) {
      console.error('Error fetching GogoAnime details:', error.message);
      return null;
    }
  }

  // Zoro provider methods
  async getZoroPopular(page = 1) {
    try {
      const data = await this.makeRequest(`/anime/zoro/popular?page=${page}`);
      return data.results?.map(anime => ({
        id: `zoro-${anime.id}`,
        title: anime.title,
        image: anime.image,
        link: `#zoro-${anime.id}`,
        year: 'Unknown',
        status: 'Unknown',
        genres: anime.genres || [],
        source: 'zoro'
      })) || [];
    } catch (error) {
      console.error('Error fetching Zoro popular:', error.message);
      return [];
    }
  }

  async getZoroRecent(page = 1) {
    try {
      const data = await this.makeRequest(`/anime/zoro/recent-episodes?page=${page}`);
      return data.results?.map(anime => ({
        id: `zoro-recent-${anime.id}`,
        title: anime.title,
        image: anime.image,
        episode: `Episode ${anime.episodeNumber || 'Latest'}`,
        episodeNumber: anime.episodeNumber || 1,
        link: `#zoro-${anime.id}`,
        source: 'zoro'
      })) || [];
    } catch (error) {
      console.error('Error fetching Zoro recent:', error.message);
      return [];
    }
  }

  async searchZoro(query) {
    try {
      const data = await this.makeRequest(`/anime/zoro/${encodeURIComponent(query)}`);
      return data.results?.map(anime => ({
        id: `zoro-${anime.id}`,
        title: anime.title,
        image: anime.image,
        link: `#zoro-${anime.id}`,
        year: 'Unknown',
        status: 'Unknown',
        genres: anime.genres || [],
        source: 'zoro'
      })) || [];
    } catch (error) {
      console.error('Error searching Zoro:', error.message);
      return [];
    }
  }

  // Combined methods for multiple providers
  async getPopularAnime() {
    try {
      const [gogoResults, zoroResults] = await Promise.allSettled([
        this.getGogoAnimePopular(1),
        this.getZoroPopular(1)
      ]);

      const combined = [];
      
      if (gogoResults.status === 'fulfilled') {
        combined.push(...gogoResults.value.slice(0, 10));
      }
      
      if (zoroResults.status === 'fulfilled') {
        combined.push(...zoroResults.value.slice(0, 10));
      }

      return combined;
    } catch (error) {
      console.error('Error getting popular anime:', error.message);
      return [];
    }
  }

  async getRecentEpisodes() {
    try {
      const [gogoResults, zoroResults] = await Promise.allSettled([
        this.getGogoAnimeRecent(1),
        this.getZoroRecent(1)
      ]);

      const combined = [];
      
      if (gogoResults.status === 'fulfilled') {
        combined.push(...gogoResults.value.slice(0, 12));
      }
      
      if (zoroResults.status === 'fulfilled') {
        combined.push(...zoroResults.value.slice(0, 8));
      }

      return combined;
    } catch (error) {
      console.error('Error getting recent episodes:', error.message);
      return [];
    }
  }

  async searchAnime(query) {
    try {
      const [gogoResults, zoroResults] = await Promise.allSettled([
        this.searchGogoAnime(query),
        this.searchZoro(query)
      ]);

      const combined = [];
      
      if (gogoResults.status === 'fulfilled') {
        combined.push(...gogoResults.value);
      }
      
      if (zoroResults.status === 'fulfilled') {
        combined.push(...zoroResults.value);
      }

      return combined;
    } catch (error) {
      console.error('Error searching anime:', error.message);
      return [];
    }
  }

  async getAnimeDetails(id) {
    try {
      if (id.includes('gogo')) {
        return await this.getGogoAnimeDetails(id);
      }
      return null;
    } catch (error) {
      console.error('Error getting anime details:', error.message);
      return null;
    }
  }

  async getEpisodeStreamingLinks(animeId, episodeId) {
    try {
      if (animeId.includes('gogo')) {
        const data = await this.makeRequest(`/anime/gogoanime/watch/${episodeId}`);
        return {
          sources: data.sources?.map(source => ({
            url: source.url,
            quality: source.quality || 'default',
            isM3U8: source.isM3U8 || false
          })) || [],
          download: data.download || null
        };
      }
      return { sources: [], download: null };
    } catch (error) {
      console.error('Error getting streaming links:', error.message);
      return { sources: [], download: null };
    }
  }
}

module.exports = new ConsumetService();