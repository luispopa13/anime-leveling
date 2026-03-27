const AnimeContent = require('../models/AnimeContent');

// --- helper slug ---
function slugify(text = '') {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

// --- generator fallback ---
function generateContent(animeData = {}) {
  const title =
    animeData?.title?.romaji ||
    animeData?.title?.english ||
    'This anime';

  const year = animeData?.startDate?.year || 'unknown year';
  const score = animeData?.averageScore || 'N/A';
  const genres = animeData?.genres?.join(', ') || 'various genres';

  return {
    slug: slugify(title),

    customIntro: `${title} is an anime released in ${year}. It has an average score of ${score} and is popular among fans of ${genres}.`,

    watchGuide: `Use the episode selector on this page to find available streaming sources for ${title}.`,

    whyWatch: `${title} is recommended if you enjoy ${genres} anime with engaging characters and storytelling.`,
  };
}

// --- MAIN FUNCTION ---
async function getOrCreateAnimeContent(animeId, animeData) {
  let content = await AnimeContent.findOne({ animeId });

  if (content) return content;

  const generated = generateContent(animeData);

  const newContent = await AnimeContent.create({
    animeId,
    slug: generated.slug,
    customIntro: generated.customIntro,
    watchGuide: generated.watchGuide,
    whyWatch: generated.whyWatch,
  });

  return newContent;
}

module.exports = {
  getOrCreateAnimeContent,
};