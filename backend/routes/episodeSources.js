// routes/episodeSources.js
// npm install axios

const express  = require('express');
const router   = express.Router();
const axios    = require('axios');
const mongoose = require('mongoose');

// ── Schemas ───────────────────────────────────────────────────────────────────

const episodeFields = [{ episodeNumber: Number, episodeId: String, episodeTitle: String, url: String }];

const EpisodeMapping = mongoose.models.EpisodeMapping ||
  mongoose.model('EpisodeMapping', new mongoose.Schema({
    animeId: String, animeSlug: String, animeTitle: String,
    episodes: episodeFields, scrapeStatus: String,
  }));

const EpisodeMapping9anime = mongoose.models.EpisodeMapping9anime ||
  mongoose.model('EpisodeMapping9anime', new mongoose.Schema({
    animeId: String, animeSlug: String, animeTitle: String,
    episodes: episodeFields, scrapeStatus: String,
  }));

const PROVIDERS = [
  { name: 'aniwatchtv', base: 'https://aniwatchtv.to',  model: () => EpisodeMapping },
  { name: '9animetv',   base: 'https://9animetv.to',    model: () => EpisodeMapping9anime },
];
// ── In-memory cache pentru embed URL-uri (5 minute) ───────────────────────────
const sourcesCache = new Map();
const SOURCES_TTL  = 5 * 60 * 1000;

function getCached(key) {
  const hit = sourcesCache.get(key);
  if (hit && Date.now() - hit.ts < SOURCES_TTL) return hit.data;
  sourcesCache.delete(key);
  return null;
}
function setCached(key, data) {
  sourcesCache.set(key, { data, ts: Date.now() });
  if (sourcesCache.size > 500) {
    const oldest = [...sourcesCache.entries()].sort((a, b) => a[1].ts - b[1].ts)[0];
    sourcesCache.delete(oldest[0]);
  }
}



// ── Helpers ───────────────────────────────────────────────────────────────────

function escapeRegex(str) {
  return (str || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Transforma un titlu in slug pentru cautare in DB
// "Attack on Titan" → "attack-on-titan"
function titleToSlug(title) {
  return (title || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

/**
 * Normalizează titlul pentru comparare:
 * - lowercase, fără punctuație
 * - elimină cuvinte de sezon ("season 3", "2nd season", "part 1" etc.)
 *   astfel încât "Jujutsu Kaisen Season 3" ≈ "Jujutsu Kaisen"
 */
function norm(str) {
  return (str || '')
    .toLowerCase()
    .replace(/['''`]/g, '')
    .replace(/\bseason\s*\d+\b/g, '')       // "season 3" → ''
    .replace(/\b\d+(st|nd|rd|th)\s+season\b/g, '') // "2nd season" → ''
    .replace(/\bpart\s*\d+\b/g, '')          // "part 1" → ''
    .replace(/\bs\d+\b/g, '')               // "s3" → ''
    .replace(/[^a-z0-9 ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Extrage cuvintele cheie din slug URL:
 * "jujutsu-kaisen-season-3-the-culling-game-part-1"
 * → ["jujutsu", "kaisen", "culling", "game"] (fără season/part/cifre)
 */
function slugKeywords(slug) {
  const STOPWORDS = new Set(['the', 'a', 'an', 'of', 'in', 'and', 'or',
    'season', 'part', 'ova', 'ona', 'movie', 'film']);
  return (slug || '')
    .split('-')
    .filter(w => w.length > 1 && !/^\d+$/.test(w) && !STOPWORDS.has(w));
}

function wordSimilarity(a, b) {
  const na = norm(a), nb = norm(b);
  if (!na || !nb) return 0;
  if (na === nb) return 1;
  // Conținere (unul e sub-șir al celuilalt după normalizare)
  if (na.includes(nb) || nb.includes(na)) return 0.85;
  // Cuvinte comune
  const wa = new Set(na.split(' ').filter(w => w.length > 1));
  const wb = new Set(nb.split(' ').filter(w => w.length > 1));
  if (wa.size === 0 || wb.size === 0) return 0;
  const common = [...wa].filter(w => wb.has(w)).length;
  // Ponderăm față de cel mai scurt (evităm penalizarea pentru "Season 3" în plus)
  const minSize = Math.min(wa.size, wb.size);
  return common / minSize;
}

/**
 * Căutare în DB cu multiple strategii, fără scan full:
 *
 * 1. Slug exact:   urlSlug-{id}  (ex: naruto-677)
 * 2. Slug prefix:  primele N cuvinte din urlSlug
 * 3. Keyword regex: caută cuvinte cheie din slug în animeSlug
 * 4. Title regex:  caută cuvinte cheie din titlu în animeTitle (MongoDB regex, nu full scan)
 */
async function findAnimeInDb(Model, urlSlug, titleFromAniList) {
  const candidates = [];
  const seen = new Set();

  function addCandidate(doc, strategy, confidence) {
    if (!doc || seen.has(doc._id?.toString())) return;
    seen.add(doc._id?.toString());
    candidates.push({ mapping: doc, strategy, confidence });
  }

  // ── Strategie 1: slug exact match (ex: "naruto" → "naruto-677") ─────────────
  const exactDocs = await Model.find({
    animeSlug : { $regex: `^${escapeRegex(urlSlug)}-\\d+$`, $options: 'i' },
    scrapeStatus: { $ne: 'error' },
  }).limit(3).lean();
  for (const doc of exactDocs) {
    const conf = 0.9 + wordSimilarity(titleFromAniList, doc.animeTitle) * 0.1;
    addCandidate(doc, 'slug-exact', conf);
  }

  // ── Strategie 2: slug fără suffix numeric ────────────────────────────────────
  // ex: "attack-on-titan" → caută slug care conține "attack-on-titan"
  const slugKeywords5 = urlSlug.split('-').slice(0, 5).join('-');
  if (slugKeywords5.length >= 6) {
    const prefixDocs = await Model.find({
      animeSlug   : { $regex: escapeRegex(slugKeywords5), $options: 'i' },
      scrapeStatus: { $ne: 'error' },
    }).limit(10).lean();
    for (const doc of prefixDocs) {
      const sim  = wordSimilarity(titleFromAniList || urlSlug, doc.animeTitle);
      addCandidate(doc, 'slug-prefix', 0.5 + sim * 0.45);
    }
  }

  // ── Strategie 3: cuvinte cheie din slug în animeSlug ────────────────────────
  const kws = slugKeywords(urlSlug).slice(0, 4); // primele 4 cuvinte relevante
  if (kws.length >= 2) {
    // Caută slug-uri care conțin TOATE cuvintele cheie
    const kwRegex = kws.map(w => `(?=.*${escapeRegex(w)})`).join('');
    const kwDocs = await Model.find({
      animeSlug   : { $regex: kwRegex, $options: 'i' },
      scrapeStatus: { $ne: 'error' },
    }).limit(10).lean();
    for (const doc of kwDocs) {
      const sim = wordSimilarity(titleFromAniList || urlSlug, doc.animeTitle);
      addCandidate(doc, 'keyword-slug', 0.4 + sim * 0.55);
    }
  }

  // ── Strategie 3b: slug generat din titlu englezesc ──────────────────────────
  // Ex: titleFromAniList="Attack on Titan" → cautam slug "attack-on-titan"
  if (titleFromAniList && urlSlug !== titleToSlug(titleFromAniList)) {
    const titleSlug = titleToSlug(titleFromAniList);
    if (titleSlug.length >= 4) {
      const titleSlugWords = titleSlug.split('-').slice(0, 5).join('-');
      const titleSlugDocs = await Model.find({
        animeSlug   : { $regex: escapeRegex(titleSlugWords), $options: 'i' },
        scrapeStatus: { $ne: 'error' },
      }).limit(5).lean();
      for (const doc of titleSlugDocs) {
        const sim = wordSimilarity(titleFromAniList, doc.animeTitle);
        addCandidate(doc, 'title-slug', 0.5 + sim * 0.45);
      }
    }
  }

  // ── Strategie 4: cuvinte cheie din titlu în animeTitle ─────────────────────
  if (titleFromAniList) {
    const normTitle = norm(titleFromAniList);
    const titleWords = normTitle.split(' ').filter(w => w.length > 2).slice(0, 3);
    if (titleWords.length >= 1) {
      const titleRegex = titleWords.map(w => `(?=.*${escapeRegex(w)})`).join('');
      const titleDocs = await Model.find({
        animeTitle  : { $regex: titleRegex, $options: 'i' },
        scrapeStatus: { $ne: 'error' },
      }).limit(10).lean();
      for (const doc of titleDocs) {
        const sim = wordSimilarity(titleFromAniList, doc.animeTitle);
        addCandidate(doc, 'title-keyword', sim);
      }
    }
  }

  if (candidates.length === 0) return null;

  // Sortează descrescător după confidence
  candidates.sort((a, b) => b.confidence - a.confidence);

  const best = candidates[0];
  console.log(`[findAnimeInDb] Best: "${best.mapping.animeTitle}" via ${best.strategy} (${best.confidence.toFixed(2)})`);
  if (candidates.length > 1) {
    console.log(`[findAnimeInDb] Other candidates: ${candidates.slice(1, 3).map(c => `"${c.mapping.animeTitle}"(${c.confidence.toFixed(2)})`).join(', ')}`);
  }

  // Prag minim de confidence
  if (best.confidence < 0.4) {
    console.warn(`[findAnimeInDb] Low confidence (${best.confidence.toFixed(2)}) — rejected`);
    return null;
  }

  return best;
}

// ── HTTP helpers ──────────────────────────────────────────────────────────────

function makeHeaders(referer, base) {
  return {
    'User-Agent'      : 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/122.0.0.0 Safari/537.36',
    'Accept'          : 'application/json, text/plain, */*',
    'Accept-Language' : 'en-US,en;q=0.9',
    'X-Requested-With': 'XMLHttpRequest',
    'Referer'         : referer,
    'Origin'          : base,
  };
}

function parseServers(html) {
  const servers = [];
  if (!html) return servers;
  const re = /data-id="(\d+)"[^>]*data-type="([^"]+)"[^>]*>([\s\S]*?)<\/div>/g;
  let m;
  while ((m = re.exec(html)) !== null) {
    const inner     = m[3];
    const nameMatch = inner.match(/<a[^>]*>\s*([^<]+)\s*<\/a>/) || inner.match(/>([A-Za-z0-9 \-.]+)</);
    servers.push({ serverId: m[1], serverName: nameMatch ? nameMatch[1].trim() : `Server ${m[1]}`, type: m[2].trim().toLowerCase() });
  }
  if (servers.length === 0) {
    const re2 = /data-id="(\d+)"[^>]*data-type="(\w+)"/g;
    let i = 0, m2;
    while ((m2 = re2.exec(html)) !== null) {
      servers.push({ serverId: m2[1], serverName: `Server ${++i}`, type: m2[2].toLowerCase() });
    }
  }
  return servers;
}

/**
 * Încearcă să obțină surse video de la un provider.
 */
async function tryProvider(provider, urlSlug, titlesInput, epNum) {
  const Model  = provider.model();
  // Accepta un string sau array de titluri
  const titles = Array.isArray(titlesInput) ? titlesInput : [titlesInput];

  // Incearca matching cu fiecare titlu disponibil
  let result = null;
  for (const t of titles) {
    result = await findAnimeInDb(Model, urlSlug, t);
    if (result && result.confidence >= 0.5) break;
    // Daca am gasit ceva cu confidence scazut, continuam sa incercam
    if (!result || result.confidence < 0.4) result = null;
  }
  if (!result) result = await findAnimeInDb(Model, urlSlug, titles[0]);
  if (!result) {
    console.log(`[${provider.name}] Not found for "${urlSlug}" / "${aniTitle}"`);
    return null;
  }

  const { mapping, strategy, confidence } = result;
  const episode = mapping.episodes?.find((e) => e.episodeNumber === epNum);

  if (!episode) {
    console.log(`[${provider.name}] Ep ${epNum} not found in "${mapping.animeTitle}" (${mapping.episodes?.length || 0} eps total)`);
    return null;
  }

  const { episodeId, episodeTitle } = episode;
  const watchUrl = `${provider.base}/watch/${mapping.animeSlug}?ep=${episodeId}`;
  const headers  = makeHeaders(watchUrl, provider.base);

  console.log(`[${provider.name}] "${mapping.animeTitle}" ep${epNum} → ${watchUrl} (${strategy}, ${confidence.toFixed(2)})`);

  // Preia serverele
  let servers = [];
  try {
    const res  = await axios.get(`${provider.base}/ajax/v2/episode/servers/${episodeId}`, { headers, timeout: 12000 });
    const raw  = res.data;
    const html = typeof raw === 'string' ? raw : (raw?.html || raw?.data?.html || '');
    servers    = parseServers(html);
    console.log(`[${provider.name}] Servers: ${servers.length}`);
  } catch (err) {
    console.error(`[${provider.name}] Servers fetch failed:`, err.message);
  }

  // Preia embed URL-uri în PARALEL (nu secvențial)
  const sources = (await Promise.allSettled(
    servers.map(srv =>
      axios.get(`${provider.base}/ajax/v2/episode/sources?id=${srv.serverId}`, { headers, timeout: 8000 })
        .then(res => {
          const data     = res.data;
          const embedUrl = data?.link || data?.url || data?.sources?.[0]?.file || null;
          if (!embedUrl) return null;
          console.log(`[${provider.name}] ✓ ${srv.serverName}`);
          return { serverId: srv.serverId, serverName: srv.serverName, type: srv.type, embedUrl, provider: provider.name };
        })
        .catch(() => null)
    )
  )).map(r => r.value).filter(Boolean);

  return { animeTitle: mapping.animeTitle, animeSlug: mapping.animeSlug, episodeId, episodeTitle: episodeTitle || `Episode ${epNum}`, watchUrl, sources, provider: provider.name, strategy, confidence };
}

// ── Debug endpoint ─────────────────────────────────────────────────────────────
// GET /api/anime/debug-match?slug=jujutsu-kaisen-season-3-the-culling-game-part-1&title=JUJUTSU+KAISEN+Season+3

router.get('/debug-match', async (req, res) => {
  const { slug, title } = req.query;
  if (!slug) return res.status(400).json({ error: 'slug required' });

  const results = {};
  for (const provider of PROVIDERS) {
    const r = await findAnimeInDb(provider.model(), slug, title || '');
    results[provider.name] = r
      ? { found: true, animeTitle: r.mapping.animeTitle, animeSlug: r.mapping.animeSlug, strategy: r.strategy, confidence: r.confidence, episodeCount: r.mapping.episodes?.length }
      : { found: false };
  }

  return res.json({ slug, title, results });
});

// ── Main endpoint ──────────────────────────────────────────────────────────────
// GET /api/anime/sources/:animeSlug/:episodeNumber?title=...

router.get('/sources/:animeSlug/:episodeNumber', async (req, res) => {
  const urlSlug     = req.params.animeSlug;
  const epNum       = parseInt(req.params.episodeNumber, 10);
  const aniTitle    = req.query.title        || '';
  const engTitle    = req.query.englishTitle || '';
  const romTitle    = req.query.romajiTitle  || '';

  // Toate titlurile disponibile — le incercam pe rand pentru matching
  const allTitles = [aniTitle, engTitle, romTitle].filter(Boolean);

  if (!urlSlug || isNaN(epNum)) {
    return res.status(400).json({ success: false, message: 'Invalid slug or episodeNumber' });
  }

  // ── Cache check ────────────────────────────────────────────────────────────
  const cacheKey    = `${urlSlug}_${epNum}`;
  const cachedResp  = getCached(cacheKey);
  if (cachedResp) {
    console.log(`[sources] Cache HIT: ${cacheKey}`);
    return res.json(cachedResp);
  }

  try {
    let providerResult = null;
    const tried = [];

    for (const provider of PROVIDERS) {
      tried.push(provider.name);
      const result = await tryProvider(provider, urlSlug, allTitles, epNum);

      if (!result) continue;

      providerResult = result;
      if (result.sources.length > 0) break; // avem surse → oprim

      console.log(`[${provider.name}] 0 embed sources — trying next provider...`);
    }

    if (!providerResult) {
      return res.status(404).json({
        success : false,
        message : `"${aniTitle}" (slug: ${urlSlug}) not found in any database.`,
        hint    : `Debug: /api/anime/debug-match?slug=${encodeURIComponent(urlSlug)}&title=${encodeURIComponent(aniTitle)}`,
        tried,
      });
    }

    const response = {
      success      : true,
      animeTitle   : providerResult.animeTitle,
      animeSlug    : providerResult.animeSlug,
      episodeId    : providerResult.episodeId,
      episodeNumber: epNum,
      episodeTitle : providerResult.episodeTitle,
      watchUrl     : providerResult.watchUrl,
      sources      : providerResult.sources,
      _debug: {
        provider  : providerResult.provider,
        strategy  : providerResult.strategy,
        confidence: parseFloat(providerResult.confidence.toFixed(2)),
        tried,
      },
    };

    // Salvează în cache doar dacă avem surse (nu cachăm erorile)
    if (providerResult.sources.length > 0 || providerResult.watchUrl) {
      setCached(cacheKey, response);
    }

    return res.json(response);

  } catch (err) {
    console.error('[sources] error:', err.message);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

module.exports = router;