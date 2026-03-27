const EpisodeContent = require('../models/EpisodeContent');

function slugify(text = '') {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function generateEpisodeContent({ animeTitle, episodeNumber, genres = [], year = '', score = '' }) {
  const safeTitle = animeTitle || 'This anime';
  const safeGenres = genres.length > 0 ? genres.join(', ') : 'anime';
  const safeYear = year || 'unknown year';
  const safeScore = score || 'N/A';

  return {
    animeSlug: slugify(safeTitle),
    episodeSlug: `episode-${episodeNumber}`,
    customIntro: `${safeTitle} Episode ${episodeNumber} is part of a ${safeGenres} anime released in ${safeYear}. This episode page helps viewers quickly find the right episode and available watch options.`,
    watchGuide: `Use the provider buttons on this page to open search results for ${safeTitle} Episode ${episodeNumber}. This is useful when you want to jump directly to a specific episode.`,
    whyWatch: `If you are following ${safeTitle}, Episode ${episodeNumber} is best viewed as part of the full progression of the story. The series is especially popular with fans of ${safeGenres} and has an average score of ${safeScore}.`,
  };
}

async function getOrCreateEpisodeContent({
  animeId,
  animeTitle,
  episodeNumber,
  genres = [],
  year = '',
  score = '',
}) {
  let content = await EpisodeContent.findOne({ animeId, episodeNumber });

  if (content) return content;

  const generated = generateEpisodeContent({
    animeTitle,
    episodeNumber,
    genres,
    year,
    score,
  });

  content = await EpisodeContent.create({
    animeId,
    animeSlug: generated.animeSlug,
    episodeNumber,
    episodeSlug: generated.episodeSlug,
    customIntro: generated.customIntro,
    watchGuide: generated.watchGuide,
    whyWatch: generated.whyWatch,
  });

  return content;
}

module.exports = {
  getOrCreateEpisodeContent,
};