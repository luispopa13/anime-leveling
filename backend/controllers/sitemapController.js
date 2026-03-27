const AnimeContent = require('../models/AnimeContent');
const EpisodeContent = require('../models/EpisodeContent');

const SITE_URL = process.env.SITE_URL || process.env.REACT_APP_SITE_URL || 'https://animeleveling.com';

async function getSitemap(req, res, next) {
  try {
    const animePages = await AnimeContent.find(
      { animeId: { $exists: true }, slug: { $exists: true, $ne: '' } },
      { animeId: 1, slug: 1, updatedAt: 1, _id: 0 }
    ).lean();

    const episodePages = await EpisodeContent.find(
      {
        animeId: { $exists: true },
        animeSlug: { $exists: true, $ne: '' },
        episodeNumber: { $exists: true },
      },
      { animeId: 1, animeSlug: 1, episodeNumber: 1, updatedAt: 1, _id: 0 }
    ).lean();

    const staticUrls = [
      {
        loc: `${SITE_URL}/`,
        changefreq: 'daily',
        priority: '1.0',
      },
      {
        loc: `${SITE_URL}/search`,
        changefreq: 'daily',
        priority: '0.9',
      },
      {
        loc: `${SITE_URL}/favorites`,
        changefreq: 'weekly',
        priority: '0.5',
      },
    ];

    const animeUrls = animePages.map((anime) => ({
      loc: `${SITE_URL}/anime/${anime.animeId}/${anime.slug}`,
      lastmod: anime.updatedAt ? new Date(anime.updatedAt).toISOString() : null,
      changefreq: 'weekly',
      priority: '0.8',
    }));

    const episodeUrls = episodePages.map((episode) => ({
      loc: `${SITE_URL}/anime/${episode.animeId}/${episode.animeSlug}/episode/${episode.episodeNumber}`,
      lastmod: episode.updatedAt ? new Date(episode.updatedAt).toISOString() : null,
      changefreq: 'weekly',
      priority: '0.7',
    }));

    const allUrls = [...staticUrls, ...animeUrls, ...episodeUrls];

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allUrls
  .map(
    (url) => `  <url>
    <loc>${url.loc}</loc>
    ${url.lastmod ? `<lastmod>${url.lastmod}</lastmod>` : ''}
    <changefreq>${url.changefreq}</changefreq>
    <priority>${url.priority}</priority>
  </url>`
  )
  .join('\n')}
</urlset>`;

    res.header('Content-Type', 'application/xml');
    res.send(xml);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getSitemap,
};