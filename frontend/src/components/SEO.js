import React from 'react';
import { Helmet } from 'react-helmet-async';

const SITE_NAME = 'AnimeLeveling';
const SITE_URL_CONST = process.env.REACT_APP_SITE_URL || 'https://animeleveling.com';

const WEBSITE_SCHEMA = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: SITE_NAME,
  url: SITE_URL_CONST,
  description: 'Free anime streaming platform with thousands of anime episodes in HD.',
  potentialAction: {
    '@type': 'SearchAction',
    target: { '@type': 'EntryPoint', urlTemplate: `${SITE_URL_CONST}/search?q={search_term_string}` },
    'query-input': 'required name=search_term_string',
  },
};
const SITE_URL = process.env.REACT_APP_SITE_URL || '';

function stripHtml(text) {
  return String(text || '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// Cuvinte cheie globale prezente pe toate paginile
const GLOBAL_KEYWORDS = 'watch anime online free, anime streaming, anime episodes, free anime, HD anime, AnimeLeveling';

export default function SEO({
  title,
  description,
  image,
  path = '',
  type = 'website',
  structuredData,
  keywords = '',
  noindex = false,
}) {
  const fullTitle    = title ? `${title} | ${SITE_NAME}` : `${SITE_NAME} - Watch Anime Online Free`;
  const defaultDesc  = 'Watch anime online free in HD on AnimeLeveling. Stream the latest and classic anime episodes including Naruto, One Piece, Attack on Titan, Demon Slayer and thousands more.';
  const safeDescription = stripHtml(description || defaultDesc).slice(0, 160);
  const canonical    = SITE_URL ? `${SITE_URL}${path}` : null;
  const resolvedImage = image && image.startsWith('http')
    ? image
    : SITE_URL && image ? `${SITE_URL}${image}` : null;
  const allKeywords  = [GLOBAL_KEYWORDS, keywords].filter(Boolean).join(', ');

  return (
    <Helmet>
      <html lang="en" />
      <title>{fullTitle}</title>
      <script type="application/ld+json">{JSON.stringify(WEBSITE_SCHEMA)}</script>

      {safeDescription && <meta name="description" content={safeDescription} />}
      <meta name="keywords" content={allKeywords} />
      {noindex
        ? <meta name="robots" content="noindex, nofollow" />
        : <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
      }

      {canonical && <link rel="canonical" href={canonical} />}

      <meta property="og:type" content={type} />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:title" content={fullTitle} />
      {safeDescription && <meta property="og:description" content={safeDescription} />}
      {canonical && <meta property="og:url" content={canonical} />}
      {resolvedImage && <meta property="og:image" content={resolvedImage} />}
      <meta property="og:locale" content="en_US" />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:site" content="@AnimeLeveling" />
      <meta name="twitter:title" content={fullTitle} />
      {safeDescription && <meta name="twitter:description" content={safeDescription} />}
      {resolvedImage && <meta name="twitter:image" content={resolvedImage} />}

      {structuredData && (
        <script type="application/ld+json">
          {JSON.stringify(structuredData)}
        </script>
      )}
    </Helmet>
  );
}