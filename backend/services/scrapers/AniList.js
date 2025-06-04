// backend/services/scrapers/AniList.js
const axios = require('axios');

class AniListService {
  constructor() {
    this.baseUrl = 'https://graphql.anilist.co';
    this.timeout = 15000;
  }

  async makeRequest(query, variables = {}) {
    try {
      const response = await axios.post(this.baseUrl, {
        query,
        variables
      }, {
        timeout: this.timeout,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        }
      });
      
      if (response.data.errors) {
        console.error('GraphQL Errors:', response.data.errors);
        throw new Error(`GraphQL Error: ${response.data.errors[0].message}`);
      }
      
      return response.data;
    } catch (error) {
      console.error('AniList API Error:', error.message);
      throw error;
    }
  }

  // Get the complete media query fragment for detailed information
  getMediaQuery() {
    return `
      id
      title {
        romaji
        english
        native
      }
      coverImage {
        large
        medium
        color
      }
      bannerImage
      averageScore
      meanScore
      popularity
      trending
      favourites
      format
      status
      episodes
      duration
      season
      seasonYear
      startDate {
        year
        month
        day
      }
      endDate {
        year
        month
        day
      }
      genres
      tags {
        name
        rank
        isMediaSpoiler
      }
      studios {
        nodes {
          name
          isAnimationStudio
        }
      }
      description
      trailer {
        id
        site
        thumbnail
      }
      source
      countryOfOrigin
      isAdult
      nextAiringEpisode {
        airingAt
        timeUntilAiring
        episode
      }
      airingSchedule(page: 1, perPage: 5) {
        nodes {
          airingAt
          timeUntilAiring
          episode
        }
      }
      rankings {
        id
        rank
        type
        format
        year
        season
        allTime
        context
      }
      stats {
        scoreDistribution {
          score
          amount
        }
        statusDistribution {
          status
          amount
        }
      }
      siteUrl
    `;
  }

  async getTrendingAnime(page = 1, perPage = 50) {
    const query = `
      query ($page: Int, $perPage: Int) {
        Page(page: $page, perPage: $perPage) {
          pageInfo {
            total
            currentPage
            lastPage
            hasNextPage
          }
          media(type: ANIME, sort: TRENDING_DESC, status_in: [RELEASING, FINISHED]) {
            ${this.getMediaQuery()}
          }
        }
      }
    `;

    try {
      const data = await this.makeRequest(query, { page, perPage });
      return {
        pageInfo: data.data.Page.pageInfo,
        results: data.data.Page.media.map(anime => this.formatAnime(anime, 'anilist-trending'))
      };
    } catch (error) {
      console.error('Error fetching trending anime:', error.message);
      return { pageInfo: null, results: [] };
    }
  }

// Fixed getPopularThisSeason method in AniList.js
async getPopularThisSeason(page = 1, perPage = 50) {
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth() + 1; // 1-12

  // Correct season calculation
  let season, year;
  if (currentMonth >= 1 && currentMonth <= 3) {
    season = 'WINTER';
    year = currentYear;
  } else if (currentMonth >= 4 && currentMonth <= 6) {
    season = 'SPRING';
    year = currentYear;
  } else if (currentMonth >= 7 && currentMonth <= 9) {
    season = 'SUMMER';
    year = currentYear;
  } else { // 10, 11, 12
    season = 'FALL';
    year = currentYear;
  }

  const query = `
    query ($page: Int, $perPage: Int, $season: MediaSeason, $year: Int) {
      Page(page: $page, perPage: $perPage) {
        pageInfo {
          total
          currentPage
          lastPage
          hasNextPage
        }
        media(type: ANIME, sort: POPULARITY_DESC, season: $season, seasonYear: $year, status_in: [RELEASING, FINISHED]) {
          ${this.getMediaQuery()}
        }
      }
    }
  `;

  try {
    console.log(`Fetching Popular This Season: ${season} ${year} (Month: ${currentMonth})`);
    const data = await this.makeRequest(query, { page, perPage, season, year });
    
    const results = data.data.Page.media.map(anime => this.formatAnime(anime, 'anilist-popular-season'));
    console.log(`Found ${results.length} anime for ${season} ${year}`);
    
    // If no results for current season, try fallback
    if (results.length === 0) {
      console.log(`No results for ${season} ${year}, trying fallback...`);
      return await this.getPopularRecentSeason(page, perPage);
    }
    
    return {
      pageInfo: data.data.Page.pageInfo,
      results: results
    };
  } catch (error) {
    console.error('Error fetching popular this season:', error.message);
    
    // Fallback to recent season if main query fails
    try {
      console.log('Falling back to recent season...');
      return await this.getPopularRecentSeason(page, perPage);
    } catch (fallbackError) {
      console.error('Fallback also failed:', fallbackError.message);
      return { pageInfo: null, results: [] };
    }
  }
}

// Enhanced fallback method
async getPopularRecentSeason(page = 1, perPage = 50) {
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth() + 1;
  
  // Define seasons to try in order of preference
  const seasonsToTry = [];
  
  // Current season first
  if (currentMonth >= 1 && currentMonth <= 3) {
    seasonsToTry.push({ season: 'WINTER', year: currentYear });
    seasonsToTry.push({ season: 'FALL', year: currentYear - 1 });
    seasonsToTry.push({ season: 'SUMMER', year: currentYear - 1 });
  } else if (currentMonth >= 4 && currentMonth <= 6) {
    seasonsToTry.push({ season: 'SPRING', year: currentYear });
    seasonsToTry.push({ season: 'WINTER', year: currentYear });
    seasonsToTry.push({ season: 'FALL', year: currentYear - 1 });
  } else if (currentMonth >= 7 && currentMonth <= 9) {
    seasonsToTry.push({ season: 'SUMMER', year: currentYear });
    seasonsToTry.push({ season: 'SPRING', year: currentYear });
    seasonsToTry.push({ season: 'WINTER', year: currentYear });
  } else {
    seasonsToTry.push({ season: 'FALL', year: currentYear });
    seasonsToTry.push({ season: 'SUMMER', year: currentYear });
    seasonsToTry.push({ season: 'SPRING', year: currentYear });
  }

  // Try each season until we get results
  for (const { season, year } of seasonsToTry) {
    try {
      console.log(`Trying season: ${season} ${year}`);
      const result = await this.getPopularBySeasonYear(season, year, page, Math.min(perPage, 25));
      
      if (result.results && result.results.length > 0) {
        console.log(`Successfully loaded ${result.results.length} anime from ${season} ${year}`);
        return result;
      }
    } catch (error) {
      console.error(`Error fetching ${season} ${year}:`, error.message);
      continue;
    }
  }
  
  // If no seasonal results, fall back to all-time popular
  console.log('No seasonal results found, falling back to all-time popular');
  try {
    const fallbackResult = await this.getAllTimePopular(page, Math.min(perPage, 25));
    
    // Mark the results as fallback
    if (fallbackResult.results) {
      fallbackResult.results = fallbackResult.results.map(anime => ({
        ...anime,
        id: anime.id.replace('anilist-all-time-popular', 'anilist-popular-season-fallback'),
        isFallback: true
      }));
    }
    
    return fallbackResult;
  } catch (fallbackError) {
    console.error('All fallback methods failed:', fallbackError.message);
    return { pageInfo: null, results: [] };
  }
}

// Fixed getCurrentSeason helper in animeService.js
getCurrentSeason() {
  const now = new Date();
  const month = now.getMonth() + 1; // getMonth() returns 0-11, so add 1
  const year = now.getFullYear();

  let season;
  if (month >= 1 && month <= 3) season = 'WINTER';
  else if (month >= 4 && month <= 6) season = 'SPRING';
  else if (month >= 7 && month <= 9) season = 'SUMMER';
  else season = 'FALL'; // months 10, 11, 12

  console.log(`Current season determined: ${season} ${year} (Month: ${month})`);
  return { season, year };
}

// Alternative approach: Use AniList's trending in current season
async getTrendingThisSeason(page = 1, perPage = 50) {
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth() + 1;
  
  let season, year;
  if (currentMonth >= 1 && currentMonth <= 3) {
    season = 'WINTER';
    year = currentYear;
  } else if (currentMonth >= 4 && currentMonth <= 6) {
    season = 'SPRING';
    year = currentYear;
  } else if (currentMonth >= 7 && currentMonth <= 9) {
    season = 'SUMMER';
    year = currentYear;
  } else {
    season = 'FALL';
    year = currentYear;
  }

  const query = `
    query ($page: Int, $perPage: Int, $season: MediaSeason, $year: Int) {
      Page(page: $page, perPage: $perPage) {
        pageInfo {
          total
          currentPage
          lastPage
          hasNextPage
        }
        media(type: ANIME, sort: TRENDING_DESC, season: $season, seasonYear: $year, status_in: [RELEASING, FINISHED]) {
          ${this.getMediaQuery()}
        }
      }
    }
  `;

  try {
    console.log(`Fetching Trending This Season: ${season} ${year}`);
    const data = await this.makeRequest(query, { page, perPage, season, year });
    
    return {
      pageInfo: data.data.Page.pageInfo,
      results: data.data.Page.media.map(anime => this.formatAnime(anime, 'anilist-trending-season'))
    };
  } catch (error) {
    console.error('Error fetching trending this season:', error.message);
    return { pageInfo: null, results: [] };
  }
}

  async getAllTimePopular(page = 1, perPage = 50) {
    const query = `
      query ($page: Int, $perPage: Int) {
        Page(page: $page, perPage: $perPage) {
          pageInfo {
            total
            currentPage
            lastPage
            hasNextPage
          }
          media(type: ANIME, sort: POPULARITY_DESC) {
            ${this.getMediaQuery()}
          }
        }
      }
    `;

    try {
      const data = await this.makeRequest(query, { page, perPage });
      return {
        pageInfo: data.data.Page.pageInfo,
        results: data.data.Page.media.map(anime => this.formatAnime(anime, 'anilist-all-time-popular'))
      };
    } catch (error) {
      console.error('Error fetching all time popular anime:', error.message);
      return { pageInfo: null, results: [] };
    }
  }

  async getTop100Anime(page = 1, perPage = 100) {
    const query = `
      query ($page: Int, $perPage: Int) {
        Page(page: $page, perPage: $perPage) {
          pageInfo {
            total
            currentPage
            lastPage
            hasNextPage
          }
          media(type: ANIME, sort: SCORE_DESC, status_in: [FINISHED, RELEASING]) {
            ${this.getMediaQuery()}
          }
        }
      }
    `;

    try {
      const data = await this.makeRequest(query, { page, perPage });
      return {
        pageInfo: data.data.Page.pageInfo,
        results: data.data.Page.media.map(anime => this.formatAnime(anime, 'anilist-top-100'))
      };
    } catch (error) {
      console.error('Error fetching top 100 anime:', error.message);
      return { pageInfo: null, results: [] };
    }
  }

  // Keep the original methods for backward compatibility
  async getPopularAnime(page = 1, perPage = 20) {
    return this.getAllTimePopular(page, perPage);
  }

  async getTopRatedAnime(page = 1, perPage = 20) {
    return this.getTop100Anime(page, perPage);
  }

  async getRecentlyUpdated(page = 1, perPage = 20) {
    const query = `
      query ($page: Int, $perPage: Int) {
        Page(page: $page, perPage: $perPage) {
          pageInfo {
            total
            currentPage
            lastPage
            hasNextPage
          }
          media(type: ANIME, sort: UPDATED_AT_DESC, status: RELEASING) {
            ${this.getMediaQuery()}
          }
        }
      }
    `;

    try {
      const data = await this.makeRequest(query, { page, perPage });
      return {
        pageInfo: data.data.Page.pageInfo,
        results: data.data.Page.media.map(anime => this.formatAnime(anime, 'anilist-recent'))
      };
    } catch (error) {
      console.error('Error fetching recently updated anime:', error.message);
      return { pageInfo: null, results: [] };
    }
  }

  // Add this method to your AniListService class
async getEpisodeStreams(animeId, episodeNumber) {
  try {
    // First get the anime from Consumet's AniList provider
    const searchResponse = await axios.get(`https://api.consumet.org/anime/anilist/${animeId}`);
    
    if (searchResponse.data && searchResponse.data.episodes) {
      const episode = searchResponse.data.episodes.find(ep => ep.number === episodeNumber);
      
      if (episode) {
        // Get streaming links for the episode
        const streamResponse = await axios.get(`https://api.consumet.org/anime/anilist/watch/${episode.id}`);
        return streamResponse.data;
      }
    }
    
    return null;
  } catch (error) {
    console.error('Error fetching episode streams:', error);
    return null;
  }
}

async getAnimeEpisodes(animeId) {
  try {
    const cleanId = animeId.toString().replace('anilist-', '');
    const response = await axios.get(`https://api.consumet.org/anime/anilist/info/${cleanId}`);
    
    return {
      episodes: response.data.episodes || [],
      totalEpisodes: response.data.totalEpisodes || 0
    };
  } catch (error) {
    console.error('Error fetching episodes:', error);
    return { episodes: [], totalEpisodes: 0 };
  }
}

  async getUpcomingAnime(page = 1, perPage = 20) {
    const query = `
      query ($page: Int, $perPage: Int) {
        Page(page: $page, perPage: $perPage) {
          pageInfo {
            total
            currentPage
            lastPage
            hasNextPage
          }
          media(type: ANIME, sort: START_DATE_DESC, status: NOT_YET_RELEASED) {
            ${this.getMediaQuery()}
          }
        }
      }
    `;

    try {
      const data = await this.makeRequest(query, { page, perPage });
      return {
        pageInfo: data.data.Page.pageInfo,
        results: data.data.Page.media.map(anime => this.formatAnime(anime, 'anilist-upcoming'))
      };
    } catch (error) {
      console.error('Error fetching upcoming anime:', error.message);
      return { pageInfo: null, results: [] };
    }
  }

  async searchAnime(query, page = 1, perPage = 25) {
    const searchQuery = `
      query ($search: String, $page: Int, $perPage: Int) {
        Page(page: $page, perPage: $perPage) {
          pageInfo {
            total
            currentPage
            lastPage
            hasNextPage
          }
          media(type: ANIME, search: $search, sort: POPULARITY_DESC) {
            ${this.getMediaQuery()}
          }
        }
      }
    `;

    try {
      const data = await this.makeRequest(searchQuery, { search: query, page, perPage });
      return {
        pageInfo: data.data.Page.pageInfo,
        results: data.data.Page.media.map(anime => this.formatAnime(anime, 'anilist-search'))
      };
    } catch (error) {
      console.error('Error searching anime:', error.message);
      return { pageInfo: null, results: [] };
    }
  }

  async getAnimeDetails(id) {
    const cleanId = id.toString().replace('anilist-', '').replace(/^\D*/, '');
    
    const query = `
      query ($id: Int) {
        Media(id: $id, type: ANIME) {
          ${this.getMediaQuery()}
          relations {
            edges {
              relationType
              node {
                id
                title {
                  romaji
                  english
                }
                coverImage {
                  medium
                }
                format
                status
                averageScore
                startDate {
                  year
                }
              }
            }
          }
          recommendations {
            nodes {
              mediaRecommendation {
                id
                title {
                  romaji
                  english
                }
                coverImage {
                  medium
                }
                averageScore
                format
                status
                startDate {
                  year
                }
              }
            }
          }
          staff {
            edges {
              role
              node {
                name {
                  full
                }
                image {
                  medium
                }
              }
            }
          }
          characters {
            edges {
              role
              voiceActors(language: JAPANESE) {
                name {
                  full
                }
                image {
                  medium
                }
              }
              node {
                name {
                  full
                }
                image {
                  medium
                }
              }
            }
          }
        }
      }
    `;

    try {
      const data = await this.makeRequest(query, { id: parseInt(cleanId) });
      const anime = data.data.Media;
      
      return {
        id: `anilist-${anime.id}`,
        title: anime.title.english || anime.title.romaji || anime.title.native,
        alternativeTitles: [
          anime.title.romaji,
          anime.title.english,
          anime.title.native
        ].filter(title => title && title !== (anime.title.english || anime.title.romaji || anime.title.native)),
        image: anime.coverImage.large || anime.coverImage.medium,
        bannerImage: anime.bannerImage,
        coverColor: anime.coverImage.color,
        description: anime.description ? anime.description.replace(/<[^>]*>/g, '') : 'No description available.',
        rating: anime.averageScore ? (anime.averageScore / 10).toFixed(1) : 'N/A',
        meanScore: anime.meanScore ? (anime.meanScore / 10).toFixed(1) : 'N/A',
        year: anime.startDate?.year || 'Unknown',
        startDate: anime.startDate,
        endDate: anime.endDate,
        status: this.formatStatus(anime.status),
        genres: anime.genres || [],
        totalEpisodes: anime.episodes || 0,
        duration: anime.duration,
        format: anime.format,
        season: anime.season,
        seasonYear: anime.seasonYear,
        popularity: anime.popularity,
        favourites: anime.favourites,
        trending: anime.trending,
        source: anime.source,
        countryOfOrigin: anime.countryOfOrigin,
        isAdult: anime.isAdult,
        studios: anime.studios?.nodes?.filter(studio => studio.isAnimationStudio).map(studio => studio.name) || [],
        allStudios: anime.studios?.nodes?.map(studio => ({
          name: studio.name,
          isAnimationStudio: studio.isAnimationStudio
        })) || [],
        trailer: anime.trailer ? {
          id: anime.trailer.id,
          site: anime.trailer.site,
          thumbnail: anime.trailer.thumbnail
        } : null,
        tags: anime.tags?.filter(tag => !tag.isMediaSpoiler).slice(0, 15).map(tag => ({
          name: tag.name,
          rank: tag.rank
        })) || [],
        nextAiring: anime.nextAiringEpisode ? {
          airingAt: anime.nextAiringEpisode.airingAt,
          timeUntilAiring: anime.nextAiringEpisode.timeUntilAiring,
          episode: anime.nextAiringEpisode.episode
        } : null,
        airingSchedule: anime.airingSchedule?.nodes || [],
        rankings: anime.rankings || [],
        scoreDistribution: anime.stats?.scoreDistribution || [],
        statusDistribution: anime.stats?.statusDistribution || [],
        relations: anime.relations?.edges?.map(edge => ({
          type: edge.relationType,
          id: `anilist-${edge.node.id}`,
          title: edge.node.title.english || edge.node.title.romaji,
          image: edge.node.coverImage.medium,
          format: edge.node.format,
          status: edge.node.status,
          rating: edge.node.averageScore ? (edge.node.averageScore / 10).toFixed(1) : 'N/A',
          year: edge.node.startDate?.year
        })) || [],
        recommendations: anime.recommendations?.nodes?.slice(0, 10).map(rec => ({
          id: `anilist-${rec.mediaRecommendation.id}`,
          title: rec.mediaRecommendation.title.english || rec.mediaRecommendation.title.romaji,
          image: rec.mediaRecommendation.coverImage.medium,
          rating: rec.mediaRecommendation.averageScore ? (rec.mediaRecommendation.averageScore / 10).toFixed(1) : 'N/A',
          format: rec.mediaRecommendation.format,
          status: rec.mediaRecommendation.status,
          year: rec.mediaRecommendation.startDate?.year
        })) || [],
        staff: anime.staff?.edges?.slice(0, 10).map(edge => ({
          role: edge.role,
          name: edge.node.name.full,
          image: edge.node.image.medium
        })) || [],
        characters: anime.characters?.edges?.slice(0, 12).map(edge => ({
          role: edge.role,
          name: edge.node.name.full,
          image: edge.node.image.medium,
          voiceActor: edge.voiceActors?.[0] ? {
            name: edge.voiceActors[0].name.full,
            image: edge.voiceActors[0].image.medium
          } : null
        })) || [],
        siteUrl: anime.siteUrl,
        source: 'anilist'
      };
    } catch (error) {
      console.error('Error fetching anime details:', error.message);
      return null;
    }
  }

  formatAnime(anime, sourcePrefix) {
    return {
      id: `${sourcePrefix}-${anime.id}`,
      title: anime.title.english || anime.title.romaji || anime.title.native,
      alternativeTitles: [
        anime.title.romaji,
        anime.title.english,
        anime.title.native
      ].filter(title => title),
      image: anime.coverImage.large || anime.coverImage.medium,
      bannerImage: anime.bannerImage,
      coverColor: anime.coverImage.color,
      rating: anime.averageScore ? (anime.averageScore / 10).toFixed(1) : 'N/A',
      meanScore: anime.meanScore ? (anime.meanScore / 10).toFixed(1) : 'N/A',
      year: anime.startDate?.year || anime.seasonYear || 'Unknown',
      startDate: anime.startDate,
      endDate: anime.endDate,
      status: this.formatStatus(anime.status),
      genres: anime.genres || [],
      episodes: anime.episodes,
      duration: anime.duration,
      format: anime.format,
      season: anime.season,
      seasonYear: anime.seasonYear,
      popularity: anime.popularity,
      trending: anime.trending,
      favourites: anime.favourites,
      source: anime.source,
      countryOfOrigin: anime.countryOfOrigin,
      isAdult: anime.isAdult,
      studios: anime.studios?.nodes?.filter(studio => studio.isAnimationStudio).map(studio => studio.name) || [],
      description: anime.description ? anime.description.replace(/<[^>]*>/g, '').substring(0, 200) + '...' : '',
      tags: anime.tags?.filter(tag => !tag.isMediaSpoiler).slice(0, 5).map(tag => tag.name) || [],
      nextAiring: anime.nextAiringEpisode ? {
        airingAt: anime.nextAiringEpisode.airingAt,
        timeUntilAiring: anime.nextAiringEpisode.timeUntilAiring,
        episode: anime.nextAiringEpisode.episode
      } : null,
      rankings: anime.rankings || [],
      link: `#anilist-${anime.id}`,
      source: 'anilist'
    };
  }

  formatStatus(status) {
    const statusMap = {
      'FINISHED': 'Completed',
      'RELEASING': 'Ongoing',
      'NOT_YET_RELEASED': 'Upcoming',
      'CANCELLED': 'Cancelled',
      'HIATUS': 'Hiatus'
    };
    return statusMap[status] || status || 'Unknown';
  }

  async getAnimeByGenre(genre, page = 1, perPage = 20) {
    const query = `
      query ($genre: String, $page: Int, $perPage: Int) {
        Page(page: $page, perPage: $perPage) {
          pageInfo {
            total
            currentPage
            lastPage
            hasNextPage
          }
          media(type: ANIME, genre: $genre, sort: POPULARITY_DESC) {
            ${this.getMediaQuery()}
          }
        }
      }
    `;

    try {
      const data = await this.makeRequest(query, { genre, page, perPage });
      return {
        pageInfo: data.data.Page.pageInfo,
        results: data.data.Page.media.map(anime => this.formatAnime(anime, `anilist-genre-${genre.toLowerCase()}`))
      };
    } catch (error) {
      console.error('Error fetching anime by genre:', error.message);
      return { pageInfo: null, results: [] };
    }
  }

  async getAnimeByYear(year, page = 1, perPage = 20) {
    const query = `
      query ($year: Int, $page: Int, $perPage: Int) {
        Page(page: $page, perPage: $perPage) {
          pageInfo {
            total
            currentPage
            lastPage
            hasNextPage
          }
          media(type: ANIME, startDate_greater: $startDate, startDate_lesser: $endDate, sort: POPULARITY_DESC) {
            ${this.getMediaQuery()}
          }
        }
      }
    `;

    try {
      const startDate = year * 10000 + 101; // January 1st of the year
      const endDate = year * 10000 + 1231; // December 31st of the year
      
      const data = await this.makeRequest(query, { 
        startDate, 
        endDate, 
        page, 
        perPage 
      });
      
      return {
        pageInfo: data.data.Page.pageInfo,
        results: data.data.Page.media.map(anime => this.formatAnime(anime, `anilist-year-${year}`))
      };
    } catch (error) {
      console.error('Error fetching anime by year:', error.message);
      return { pageInfo: null, results: [] };
    }
  }

  async getAnimeBySeasonYear(season, year, page = 1, perPage = 20) {
    const query = `
      query ($season: MediaSeason, $year: Int, $page: Int, $perPage: Int) {
        Page(page: $page, perPage: $perPage) {
          pageInfo {
            total
            currentPage
            lastPage
            hasNextPage
          }
          media(type: ANIME, season: $season, seasonYear: $year, sort: POPULARITY_DESC) {
            ${this.getMediaQuery()}
          }
        }
      }
    `;

    try {
      const data = await this.makeRequest(query, { season, year, page, perPage });
      return {
        pageInfo: data.data.Page.pageInfo,
        results: data.data.Page.media.map(anime => this.formatAnime(anime, `anilist-${season.toLowerCase()}-${year}`))
      };
    } catch (error) {
      console.error('Error fetching anime by season and year:', error.message);
      return { pageInfo: null, results: [] };
    }
  }

async getUpcomingNextSeason(page = 1, perPage = 20) {
  // Get next season's upcoming anime
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth() + 1;
  let nextSeason, nextYear;
  
  if (currentMonth >= 1 && currentMonth <= 3) {
    nextSeason = 'SPRING';
    nextYear = currentDate.getFullYear();
  } else if (currentMonth >= 4 && currentMonth <= 6) {
    nextSeason = 'SUMMER';
    nextYear = currentDate.getFullYear();
  } else if (currentMonth >= 7 && currentMonth <= 9) {
    nextSeason = 'FALL';
    nextYear = currentDate.getFullYear();
  } else {
    nextSeason = 'WINTER';
    nextYear = currentDate.getFullYear() + 1;
  }

  const query = `
    query ($page: Int, $perPage: Int, $season: MediaSeason, $year: Int) {
      Page(page: $page, perPage: $perPage) {
        pageInfo {
          total
          currentPage
          lastPage
          hasNextPage
        }
        media(type: ANIME, season: $season, seasonYear: $year, status: NOT_YET_RELEASED, sort: POPULARITY_DESC) {
          ${this.getMediaQuery()}
        }
      }
    }
  `;

  try {
    const data = await this.makeRequest(query, { page, perPage, season: nextSeason, year: nextYear });
    return {
      pageInfo: data.data.Page.pageInfo,
      results: data.data.Page.media.map(anime => this.formatAnime(anime, 'anilist-upcoming-next-season'))
    };
  } catch (error) {
    console.error('Error fetching upcoming next season:', error.message);
    return { pageInfo: null, results: [] };
  }
}
async getAllCategories(perPage = 20) {
  try {
    const [
      trending,
      popularSeason,
      upcomingSeason,
      allTimePopular,
      top100
    ] = await Promise.all([
      this.getTrendingAnime(1, perPage),
      this.getPopularThisSeason(1, perPage),
      this.getUpcomingAnime(1, perPage), // Fixed: was getUpcomingNextSeason
      this.getAllTimePopular(1, perPage),
      this.getTop100Anime(1, perPage)
    ]);

    return {
      trending: trending.results,
      popularThisSeason: popularSeason.results,
      upcomingNextSeason: upcomingSeason.results, // Keep the same property name for consistency
      allTimePopular: allTimePopular.results,
      top100: top100.results
    };
  } catch (error) {
    console.error('Error fetching all categories:', error.message);
    return {
      trending: [],
      popularThisSeason: [],
      upcomingNextSeason: [],
      allTimePopular: [],
      top100: []
    };
  }
}
}

module.exports = new AniListService();