const fs = require('fs');
const path = require('path');

const SITE_URL = process.env.REACT_APP_SITE_URL || 'https://your-domain.com';

const staticPages = ['/', '/search', '/favorites'];

function buildUrl(loc, priority = '0.8', changefreq = 'daily') {
  return `
  <url>
    <loc>${loc}</loc>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`;
}

function generateSitemap() {
  const urls = [
    buildUrl(`${SITE_URL}/`, '1.0', 'daily'),
    buildUrl(`${SITE_URL}/search`, '0.9', 'daily'),
    buildUrl(`${SITE_URL}/favorites`, '0.5', 'weekly'),
  ];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset
  xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
>
${urls.join('')}
</urlset>
`;

  const outputPath = path.join(process.cwd(), 'public', 'sitemap.xml');
  fs.writeFileSync(outputPath, xml, 'utf8');

  console.log(`Sitemap generated at: ${outputPath}`);
}

generateSitemap();