const axios = require('axios');

class AniListAPI {
  constructor() {
    this.baseURL = 'https://graphql.anilist.co';
  }

  async makeRequest(query, variables = {}) {
    try {
      const response = await axios.post(
        this.baseURL,
        { query, variables },
        {
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          timeout: 15000,
        }
      );

      return response.data;
    } catch (error) {
      console.error('AniList request error:', error.response?.data || error.message);
      throw error;
    }
  }

  getMediaQuery() {
    return `
      id
      title {
        romaji
        english
        native
      }
      synonyms
      coverImage {
        large
        medium
        color
      }
      bannerImage
      averageScore
      meanScore
      popularity
      favourites
      trending
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
      description
      source
      countryOfOrigin
      isAdult
      hashtag
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
      trailer {
        id
        site
        thumbnail
      }
      nextAiringEpisode {
        airingAt
        timeUntilAiring
        episode
      }
      airingSchedule(page: 1, perPage: 25) {
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
      externalLinks {
        id
        url
        site
        type
        language
        color
        icon
      }
      siteUrl
    `;
  }

  formatStatus(status) {
    if (!status) return 'Unknown';

    const mapping = {
      FINISHED: 'Finished',
      RELEASING: 'Ongoing',
      NOT_YET_RELEASED: 'Upcoming',
      CANCELLED: 'Cancelled',
      HIATUS: 'Hiatus',
    };

    return mapping[status] || status;
  }

  formatAnime(anime, sourcePrefix) {
    return {
      id: String(anime.id),       // fix: ID consistent fara prefix
      anilistId: anime.id,
      title: anime.title?.english || anime.title?.romaji || anime.title?.native,
      alternativeTitles: [
        anime.title?.romaji,
        anime.title?.english,
        anime.title?.native,
        ...(anime.synonyms || []),
      ].filter(Boolean),
      romajiTitle: anime.title?.romaji || null,
      englishTitle: anime.title?.english || null,
      nativeTitle: anime.title?.native || null,
      synonyms: anime.synonyms || [],
      image: anime.coverImage?.large || anime.coverImage?.medium || null,
      bannerImage: anime.bannerImage || null,
      coverColor: anime.coverImage?.color || null,
      rating: anime.averageScore ? (anime.averageScore / 10).toFixed(1) : 'N/A',
      averageScore: anime.averageScore || null,
      meanScore: anime.meanScore || null,
      year: anime.startDate?.year || anime.seasonYear || 'Unknown',
      startDate: anime.startDate || null,
      endDate: anime.endDate || null,
      status: this.formatStatus(anime.status),
      genres: anime.genres || [],
      totalEpisodes: anime.episodes || 0,
      episodes: anime.episodes || 0,
      duration: anime.duration || null,
      format: anime.format || null,
      season: anime.season || null,
      seasonYear: anime.seasonYear || null,
      popularity: anime.popularity || 0,
      trending: anime.trending || 0,
      favourites: anime.favourites || 0,
      sourceMaterial: anime.source || null,
      source: anime.source || null,
      countryOfOrigin: anime.countryOfOrigin || null,
      isAdult: anime.isAdult || false,
      hashtag: anime.hashtag || null,
      studios:
        anime.studios?.nodes
          ?.filter((studio) => studio.isAnimationStudio)
          .map((studio) => studio.name) || [],
      allStudios:
        anime.studios?.nodes?.map((studio) => ({
          name: studio.name,
          isAnimationStudio: studio.isAnimationStudio,
        })) || [],
      description: anime.description
        ? anime.description.replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]*>/g, '').trim()
        : '',
      tags:
        anime.tags
          ?.filter((tag) => !tag.isMediaSpoiler)
          .map((tag) => ({
            name: tag.name,
            rank: tag.rank,
          })) || [],
      trailer: anime.trailer
        ? {
            id: anime.trailer.id,
            site: anime.trailer.site?.toLowerCase(),
            thumbnail: anime.trailer.thumbnail,
          }
        : null,
      nextAiring: anime.nextAiringEpisode
        ? {
            airingAt: anime.nextAiringEpisode.airingAt,
            timeUntilAiring: anime.nextAiringEpisode.timeUntilAiring,
            episode: anime.nextAiringEpisode.episode,
          }
        : null,
      airingSchedule: anime.airingSchedule?.nodes || [],
      rankings: anime.rankings || [],
      scoreDistribution: anime.stats?.scoreDistribution || [],
      statusDistribution: anime.stats?.statusDistribution || [],
      externalLinks:
        anime.externalLinks?.map((link) => ({
          id: link.id,
          url: link.url,
          site: link.site,
          type: link.type,
          language: link.language,
          color: link.color,
          icon: link.icon,
        })) || [],
      siteUrl: anime.siteUrl,
      sourceProvider: 'anilist',
    };
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
        results: data.data.Page.media.map((anime) => this.formatAnime(anime, 'anilist-trending')),
      };
    } catch (error) {
      console.error('Error fetching trending anime:', error.message);
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
          media(type: ANIME, sort: POPULARITY_DESC, status_in: [RELEASING, FINISHED]) {
            ${this.getMediaQuery()}
          }
        }
      }
    `;

    try {
      const data = await this.makeRequest(query, { page, perPage });
      return {
        pageInfo: data.data.Page.pageInfo,
        results: data.data.Page.media.map((anime) => this.formatAnime(anime, 'anilist-popular')),
      };
    } catch (error) {
      console.error('Error fetching popular anime:', error.message);
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
          media(type: ANIME, sort: SCORE_DESC, status_in: [RELEASING, FINISHED]) {
            ${this.getMediaQuery()}
          }
        }
      }
    `;

    try {
      const data = await this.makeRequest(query, { page, perPage });
      return {
        pageInfo: data.data.Page.pageInfo,
        results: data.data.Page.media.map((anime) => this.formatAnime(anime, 'anilist-top')),
      };
    } catch (error) {
      console.error('Error fetching top anime:', error.message);
      return { pageInfo: null, results: [] };
    }
  }

  async getPopularThisSeason(page = 1, perPage = 50) {
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1;

    let season;
    let year = currentYear;

    if (currentMonth >= 1 && currentMonth <= 3) season = 'WINTER';
    else if (currentMonth >= 4 && currentMonth <= 6) season = 'SPRING';
    else if (currentMonth >= 7 && currentMonth <= 9) season = 'SUMMER';
    else season = 'FALL';

    const query = `
      query ($season: MediaSeason, $seasonYear: Int, $page: Int, $perPage: Int) {
        Page(page: $page, perPage: $perPage) {
          pageInfo {
            total
            currentPage
            lastPage
            hasNextPage
          }
          media(
            type: ANIME
            season: $season
            seasonYear: $seasonYear
            sort: POPULARITY_DESC
          ) {
            ${this.getMediaQuery()}
          }
        }
      }
    `;

    try {
      const data = await this.makeRequest(query, {
        season,
        seasonYear: year,
        page,
        perPage,
      });

      return {
        pageInfo: data.data.Page.pageInfo,
        results: data.data.Page.media.map((anime) => this.formatAnime(anime, 'anilist-season')),
      };
    } catch (error) {
      console.error('Error fetching season anime:', error.message);
      return { pageInfo: null, results: [] };
    }
  }

  async getUpcomingNextSeason(page = 1, perPage = 50) {
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1;

    let season;
    let year = currentYear;

    if (currentMonth >= 1 && currentMonth <= 3) season = 'SPRING';
    else if (currentMonth >= 4 && currentMonth <= 6) season = 'SUMMER';
    else if (currentMonth >= 7 && currentMonth <= 9) season = 'FALL';
    else {
      season = 'WINTER';
      year = currentYear + 1;
    }

    const query = `
      query ($season: MediaSeason, $seasonYear: Int, $page: Int, $perPage: Int) {
        Page(page: $page, perPage: $perPage) {
          pageInfo {
            total
            currentPage
            lastPage
            hasNextPage
          }
          media(
            type: ANIME
            season: $season
            seasonYear: $seasonYear
            sort: POPULARITY_DESC
          ) {
            ${this.getMediaQuery()}
          }
        }
      }
    `;

    try {
      const data = await this.makeRequest(query, {
        season,
        seasonYear: year,
        page,
        perPage,
      });

      return {
        pageInfo: data.data.Page.pageInfo,
        results: data.data.Page.media.map((anime) => this.formatAnime(anime, 'anilist-upcoming-season')),
      };
    } catch (error) {
      console.error('Error fetching next season anime:', error.message);
      return { pageInfo: null, results: [] };
    }
  }

  async getRecentlyUpdated(page = 1, perPage = 50) {
    const query = `
      query ($page: Int, $perPage: Int) {
        Page(page: $page, perPage: $perPage) {
          pageInfo {
            total
            currentPage
            lastPage
            hasNextPage
          }
          media(type: ANIME, sort: UPDATED_AT_DESC) {
            ${this.getMediaQuery()}
          }
        }
      }
    `;

    try {
      const data = await this.makeRequest(query, { page, perPage });
      return {
        pageInfo: data.data.Page.pageInfo,
        results: data.data.Page.media.map((anime) => this.formatAnime(anime, 'anilist-updated')),
      };
    } catch (error) {
      console.error('Error fetching recently updated anime:', error.message);
      return { pageInfo: null, results: [] };
    }
  }

  async getUpcomingAnime(page = 1, perPage = 50) {
    const query = `
      query ($page: Int, $perPage: Int) {
        Page(page: $page, perPage: $perPage) {
          pageInfo {
            total
            currentPage
            lastPage
            hasNextPage
          }
          media(type: ANIME, status: NOT_YET_RELEASED, sort: POPULARITY_DESC) {
            ${this.getMediaQuery()}
          }
        }
      }
    `;

    try {
      const data = await this.makeRequest(query, { page, perPage });
      return {
        pageInfo: data.data.Page.pageInfo,
        results: data.data.Page.media.map((anime) => this.formatAnime(anime, 'anilist-upcoming')),
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
      const data = await this.makeRequest(searchQuery, {
        search: query,
        page,
        perPage,
      });

      return {
        pageInfo: data.data.Page.pageInfo,
        results: data.data.Page.media.map((anime) => this.formatAnime(anime, 'anilist-search')),
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
                  native
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
                  native
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
      const data = await this.makeRequest(query, { id: parseInt(cleanId, 10) });
      const anime = data.data.Media;

      return {
        id: String(anime.id),       // fix: ID consistent
        anilistId: anime.id,
        title: anime.title?.english || anime.title?.romaji || anime.title?.native,
        alternativeTitles: [
          anime.title?.romaji,
          anime.title?.english,
          anime.title?.native,
          ...(anime.synonyms || []),
        ].filter(Boolean),
        romajiTitle: anime.title?.romaji || null,
        englishTitle: anime.title?.english || null,
        nativeTitle: anime.title?.native || null,
        synonyms: anime.synonyms || [],
        image: anime.coverImage?.large || anime.coverImage?.medium || null,
        bannerImage: anime.bannerImage || null,
        coverColor: anime.coverImage?.color || null,
        rating: anime.averageScore ? (anime.averageScore / 10).toFixed(1) : 'N/A',
        averageScore: anime.averageScore || null,
        meanScore: anime.meanScore || null,
        year: anime.startDate?.year || anime.seasonYear || 'Unknown',
        startDate: anime.startDate || null,
        endDate: anime.endDate || null,
        status: this.formatStatus(anime.status),
        genres: anime.genres || [],
        totalEpisodes: anime.episodes || 0,
        episodes: anime.episodes || 0,
        duration: anime.duration || null,
        format: anime.format || null,
        season: anime.season || null,
        seasonYear: anime.seasonYear || null,
        popularity: anime.popularity || 0,
        favourites: anime.favourites || 0,
        sourceMaterial: anime.source || null,
        source: anime.source || null,
        countryOfOrigin: anime.countryOfOrigin || null,
        isAdult: anime.isAdult || false,
        hashtag: anime.hashtag || null,
        studios:
          anime.studios?.nodes
            ?.filter((studio) => studio.isAnimationStudio)
            .map((studio) => studio.name) || [],
        allStudios:
          anime.studios?.nodes?.map((studio) => ({
            name: studio.name,
            isAnimationStudio: studio.isAnimationStudio,
          })) || [],
        description: anime.description
          ? anime.description.replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]*>/g, '').trim()
          : '',
        trailer: anime.trailer
          ? {
              id: anime.trailer.id,
              site: anime.trailer.site?.toLowerCase(),
              thumbnail: anime.trailer.thumbnail,
            }
          : null,
        tags:
          anime.tags
            ?.filter((tag) => !tag.isMediaSpoiler)
            .map((tag) => ({
              name: tag.name,
              rank: tag.rank,
            })) || [],
        nextAiring: anime.nextAiringEpisode
          ? {
              airingAt: anime.nextAiringEpisode.airingAt,
              timeUntilAiring: anime.nextAiringEpisode.timeUntilAiring,
              episode: anime.nextAiringEpisode.episode,
            }
          : null,
        airingSchedule: anime.airingSchedule?.nodes || [],
        rankings: anime.rankings || [],
        scoreDistribution: anime.stats?.scoreDistribution || [],
        statusDistribution: anime.stats?.statusDistribution || [],
        externalLinks:
          anime.externalLinks?.map((link) => ({
            id: link.id,
            url: link.url,
            site: link.site,
            type: link.type,
            language: link.language,
            color: link.color,
            icon: link.icon,
          })) || [],
        relations:
          anime.relations?.edges?.map((edge) => ({
            type: edge.relationType,
            id: String(edge.node.id),
            title: edge.node.title?.english || edge.node.title?.romaji || edge.node.title?.native,
            image: edge.node.coverImage?.medium,
            format: edge.node.format,
            status: edge.node.status,
            rating: edge.node.averageScore ? (edge.node.averageScore / 10).toFixed(1) : 'N/A',
            year: edge.node.startDate?.year,
          })) || [],
        recommendations:
          anime.recommendations?.nodes?.map((rec) => ({
            id: String(rec.mediaRecommendation.id),
            title:
              rec.mediaRecommendation.title?.english ||
              rec.mediaRecommendation.title?.romaji ||
              rec.mediaRecommendation.title?.native,
            image: rec.mediaRecommendation.coverImage?.medium,
            rating: rec.mediaRecommendation.averageScore
              ? (rec.mediaRecommendation.averageScore / 10).toFixed(1)
              : 'N/A',
            format: rec.mediaRecommendation.format,
            status: rec.mediaRecommendation.status,
            year: rec.mediaRecommendation.startDate?.year,
          })) || [],
        staff:
          anime.staff?.edges?.map((edge) => ({
            role: edge.role,
            name: edge.node.name?.full,
            image: edge.node.image?.medium,
          })) || [],
        characters:
          anime.characters?.edges?.map((edge) => ({
            role: edge.role,
            name: edge.node.name?.full,
            image: edge.node.image?.medium,
            voiceActor: edge.voiceActors?.[0]
              ? {
                  name: edge.voiceActors[0].name?.full,
                  image: edge.voiceActors[0].image?.medium,
                }
              : null,
          })) || [],
        siteUrl: anime.siteUrl,
        sourceProvider: 'anilist',
      };
    } catch (error) {
      console.error('Error fetching anime details:', error.message);
      return null;
    }
  }

  async getAnimeByGenre(genre, page = 1, perPage = 25) {
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
        results: data.data.Page.media.map((anime) => this.formatAnime(anime, 'anilist-genre')),
      };
    } catch (error) {
      console.error('Error fetching anime by genre:', error.message);
      return { pageInfo: null, results: [] };
    }
  }

  async getAnimeByYear(year, page = 1, perPage = 25) {
    const query = `
      query ($year: Int, $page: Int, $perPage: Int) {
        Page(page: $page, perPage: $perPage) {
          pageInfo {
            total
            currentPage
            lastPage
            hasNextPage
          }
          media(type: ANIME, seasonYear: $year, sort: POPULARITY_DESC) {
            ${this.getMediaQuery()}
          }
        }
      }
    `;

    try {
      const data = await this.makeRequest(query, { year, page, perPage });
      return {
        pageInfo: data.data.Page.pageInfo,
        results: data.data.Page.media.map((anime) => this.formatAnime(anime, 'anilist-year')),
      };
    } catch (error) {
      console.error('Error fetching anime by year:', error.message);
      return { pageInfo: null, results: [] };
    }
  }

  async getAnimeBySeasonYear(season, year, page = 1, perPage = 25) {
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
        results: data.data.Page.media.map((anime) => this.formatAnime(anime, 'anilist-season-year')),
      };
    } catch (error) {
      console.error('Error fetching anime by season/year:', error.message);
      return { pageInfo: null, results: [] };
    }
  }
}

module.exports = new AniListAPI();