const AnimeContent = require('../models/AnimeContent');
const { getOrCreateAnimeContent } = require('../services/contentService');

async function getAnimeContent(req, res, next) {
  try {
    const { animeId } = req.params;

    const content = await getOrCreateAnimeContent(animeId, {
      title: {
        romaji: req.query.title || '',
      },
      startDate: {
        year: req.query.year || '',
      },
      averageScore: req.query.score || '',
      genres: req.query.genres ? req.query.genres.split(',') : [],
    });

    res.json({
      success: true,
      data: content,
    });
  } catch (error) {
    next(error);
  }
}

async function upsertAnimeContent(req, res, next) {
  try {
    const { animeId, slug, customIntro, watchGuide, whyWatch } = req.body;

    if (!animeId) {
      return res.status(400).json({
        success: false,
        error: 'animeId is required',
      });
    }

    const content = await AnimeContent.findOneAndUpdate(
      { animeId },
      {
        animeId,
        slug: slug || '',
        customIntro: customIntro || '',
        watchGuide: watchGuide || '',
        whyWatch: whyWatch || '',
      },
      {
        new: true,
        upsert: true,
        runValidators: true,
      }
    );

    res.json({
      success: true,
      data: content,
    });
  } catch (error) {
    next(error);
  }
}

async function deleteAnimeContent(req, res, next) {
  try {
    const { animeId } = req.params;

    const deleted = await AnimeContent.findOneAndDelete({ animeId });

    res.json({
      success: true,
      deleted: !!deleted,
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getAnimeContent,
  upsertAnimeContent,
  deleteAnimeContent,
};