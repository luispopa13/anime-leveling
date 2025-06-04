const axiosZoro = require('axios');

const ZORO_BASE = 'https://api.consumet.org/anime/zoro';

exports.getSourcesZoro = async (episodeId) => {
  try {
    const res = await axiosZoro.get(`${ZORO_BASE}/watch?episodeId=${episodeId}`);
    return res.data; // includes .sources and .subtitles
  } catch (err) {
    console.error('Zoro error:', err.message);
    return { success: false, error: 'Failed to fetch Zoro sources' };
  }
};

exports.searchZoroAnime = async (query, page = 1) => {
  try {
    const res = await axiosZoro.get(`${ZORO_BASE}/${query}?page=${page}`);
    return res.data;
  } catch (err) {
    console.error('Zoro search error:', err.message);
    return [];
  }
};
