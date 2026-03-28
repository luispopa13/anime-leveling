/**
 * enrichWithAnilist.js
 * 
 * Parcurge toate anime-urile din episodemappings (aniwatchtv)
 * și adaugă anilistId, anilistTitle, anilistSlug pentru fiecare.
 * 
 * Rulare:
 *   node scripts/enrichWithAnilist.js              ← toate anime-urile
 *   node scripts/enrichWithAnilist.js --test        ← primele 5, fara salvare
 *   node scripts/enrichWithAnilist.js --from 500    ← porneste de la offset 500
 *   node scripts/enrichWithAnilist.js --only-missing ← sare peste cele deja enriched
 */

require('dotenv').config();
const mongoose = require('mongoose');
const axios    = require('axios');

// ── Config ────────────────────────────────────────────────────────────────────

const CONFIG = {
  mongoUri       : process.env.MONGODB_URI,
  anilistApi     : 'https://graphql.anilist.co',
  delayMs        : 700,    // delay intre requesturi AniList (rate limit: ~90/min)
  batchSize      : 50,     // cate anime procesam o data din DB
  progressFile   : './enrich_progress.json',
  maxRetries     : 3,
};

// ── Schema ────────────────────────────────────────────────────────────────────

const EpisodeMappingSchema = new mongoose.Schema({
  animeId      : String,
  animeSlug    : String,
  animeTitle   : String,
  animeUrl     : String,
  anilistId    : Number,
  anilistTitle : String,
  anilistSlug  : String,
  episodes     : Array,
  scrapeStatus : String,
}, { timestamps: true });

const EpisodeMapping = mongoose.models.EpisodeMapping ||
  mongoose.model('EpisodeMapping', EpisodeMappingSchema);

// ── Helpers ───────────────────────────────────────────────────────────────────

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

function slugify(text) {
  return (text || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function log(msg) {
  const ts = new Date().toISOString().slice(11, 19);
  console.log(`[${ts}] ${msg}`);
}

// ── AniList Search ────────────────────────────────────────────────────────────

const ANILIST_QUERY = `
query ($search: String) {
  Media(search: $search, type: ANIME) {
    id
    title {
      romaji
      english
      native
    }
  }
}`;

async function searchAnilist(title, attempt = 1) {
  try {
    const res = await axios.post(
      CONFIG.anilistApi,
      { query: ANILIST_QUERY, variables: { search: title } },
      {
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        timeout: 10000,
      }
    );

    const media = res.data?.data?.Media;
    if (!media) return null;

    return {
      anilistId    : media.id,
      anilistTitle : media.title.english || media.title.romaji || media.title.native || title,
      anilistSlug  : slugify(media.title.english || media.title.romaji || title),
      allTitles    : [
        media.title.romaji,
        media.title.english,
        media.title.native,
      ].filter(Boolean),
    };

  } catch (err) {
    // Rate limit → asteapta si incearca din nou
    if (err.response?.status === 429 && attempt <= CONFIG.maxRetries) {
      const wait = 60000; // 1 minut
      log(`  ⏳ Rate limit! Astept ${wait / 1000}s... (attempt ${attempt})`);
      await sleep(wait);
      return searchAnilist(title, attempt + 1);
    }

    if (err.response?.status === 404 || err.response?.data?.errors) {
      return null; // Nu a gasit nimic pe AniList
    }

    log(`  ❌ AniList error pentru "${title}": ${err.message}`);
    return null;
  }
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const args        = process.argv.slice(2);
  const testMode    = args.includes('--test');
  const onlyMissing = args.includes('--only-missing');
  const fromOffset  = args.includes('--from')
    ? parseInt(args[args.indexOf('--from') + 1]) || 0
    : 0;

  log('🚀 Enrich DB with AniList data');
  log(`   Mode: ${testMode ? 'TEST (no save)' : 'LIVE'}`);
  log(`   Only missing: ${onlyMissing}`);
  log(`   From offset: ${fromOffset}`);

  await mongoose.connect(CONFIG.mongoUri);
  log('✅ MongoDB connected');

  // Filtru: daca --only-missing, sare peste cele deja cu anilistId
  const filter = onlyMissing
    ? { scrapeStatus: 'ok', anilistId: { $exists: false } }
    : { scrapeStatus: 'ok' };

  const total = await EpisodeMapping.countDocuments(filter);
  log(`📦 Total de procesat: ${total} anime`);

  const stats = { found: 0, notFound: 0, skipped: 0, errors: 0 };
  let processed = 0;

  // Proceseaza in batches
  let skip = fromOffset;

  while (skip < fromOffset + total) {
    const batch = await EpisodeMapping.find(filter)
      .skip(skip - fromOffset)
      .limit(CONFIG.batchSize)
      .select('animeId animeTitle animeSlug anilistId anilistTitle')
      .lean();

    if (batch.length === 0) break;

    for (const doc of batch) {
      processed++;
      const pct = ((processed / total) * 100).toFixed(1);

      // Sare peste cele deja enriched (daca nu e --only-missing care le filtreaza deja)
      if (doc.anilistId && !args.includes('--force')) {
        log(`[${processed}/${total}] ⏭️  "${doc.animeTitle}" — deja are anilistId (${doc.anilistId})`);
        stats.skipped++;
        continue;
      }

      log(`[${processed}/${total}] (${pct}%) 🔍 "${doc.animeTitle}"`);

      // Incearca mai intai cu titlul exact, apoi fara caractere speciale
      let result = await searchAnilist(doc.animeTitle);

      // Daca nu a gasit, incearca cu titlul curatat
      if (!result) {
        const cleanTitle = doc.animeTitle
          .replace(/\s*Season\s*\d+/gi, '')
          .replace(/\s*Part\s*\d+/gi, '')
          .replace(/[^\w\s]/g, '')
          .trim();

        if (cleanTitle && cleanTitle !== doc.animeTitle) {
          log(`  🔄 Retry cu "${cleanTitle}"`);
          result = await searchAnilist(cleanTitle);
        }
      }

      // Daca nu a gasit, incearca primele 3 cuvinte din slug
      if (!result) {
        const slugWords = doc.animeSlug
          .replace(/-\d+$/, '')      // scoate ID-ul numeric de la coada
          .split('-')
          .slice(0, 4)
          .join(' ');

        if (slugWords) {
          log(`  🔄 Retry cu slug words "${slugWords}"`);
          result = await searchAnilist(slugWords);
        }
      }

      if (result) {
        log(`  ✅ Gasit: "${result.anilistTitle}" (ID: ${result.anilistId})`);
        log(`     Titluri: ${result.allTitles.join(' | ')}`);
        stats.found++;

        if (!testMode) {
          await EpisodeMapping.updateOne(
            { animeId: doc.animeId },
            { $set: {
              anilistId    : result.anilistId,
              anilistTitle : result.anilistTitle,
              anilistSlug  : result.anilistSlug,
            }}
          );
        }
      } else {
        log(`  ❓ Nu a gasit pe AniList: "${doc.animeTitle}"`);
        stats.notFound++;
      }

      await sleep(CONFIG.delayMs);
    }

    skip += CONFIG.batchSize;

    // Afiseaza progres la fiecare batch
    log(`\n📊 Progress: found=${stats.found} notFound=${stats.notFound} skipped=${stats.skipped}\n`);

    if (testMode && processed >= 5) {
      log('Test mode: stop la 5 anime.');
      break;
    }
  }

  await mongoose.disconnect();

  log('\n════════════════════════════════');
  log('📊 FINAL:');
  log(`  ✅ Găsite și salvate: ${stats.found}`);
  log(`  ❓ Negăsite pe AniList: ${stats.notFound}`);
  log(`  ⏭️  Sărite (deja enriched): ${stats.skipped}`);
  log(`  ❌ Erori: ${stats.errors}`);
  log('════════════════════════════════');
}

main().catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});