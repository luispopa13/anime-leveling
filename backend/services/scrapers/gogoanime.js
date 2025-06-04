const axios = require('axios');

const BASE_URL = 'https://api.consumet.org/anime/gogoanime';

exports.fetchEpisodeSources = async (episodeId) => {
  try {
    const res = await axios.get(`${BASE_URL}/watch/${episodeId}`);
    return res.data; // includes .sources and .subtitles
  } catch (err) {
    console.error('Gogoanime error:', err.message);
    return { success: false, error: 'Failed to fetch Gogoanime sources' };
  }
};

exports.searchAnime = async (query, page = 1) => {
  try {
    const res = await axios.get(`${BASE_URL}/${query}?page=${page}`);
    return res.data;
  } catch (err) {
    console.error('Gogoanime search error:', err.message);
    return [];
  }
};