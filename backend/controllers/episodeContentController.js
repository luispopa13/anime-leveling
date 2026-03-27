const EpisodeContent = require('../models/EpisodeContent');
const { getOrCreateEpisodeContent } = require('../services/episodeContentService');

async function getEpisodeContent(req, res, next) {
  try {
    const { animeId, episodeNumber } = req.params;

    const numericEpisode = parseInt(episodeNumber, 10);

    if (!numericEpisode || numericEpisode < 1) {
      return res.status(400).json({
        success: false,
        error: 'episodeNumber must be a positive integer',
      });
    }

    const content = await getOrCreateEpisodeContent({
      animeId,
      episodeNumber: numericEpisode,
      animeTitle: req.query.title || '',
      genres: req.query.genres ? req.query.genres.split(',') : [],
      year: req.query.year || '',
      score: req.query.score || '',
    });

    res.json({
      success: true,
      data: content,
    });
  } catch (error) {
    next(error);
  }
}

async function upsertEpisodeContent(req, res, next) {
  try {
    const {
      animeId,
      animeSlug,
      episodeNumber,
      episodeSlug,
      customIntro,
      watchGuide,
      whyWatch,
    } = req.body;

    const numericEpisode = parseInt(episodeNumber, 10);

    if (!animeId || !numericEpisode) {
      return res.status(400).json({
        success: false,
        error: 'animeId and episodeNumber are required',
      });
    }

    const content = await EpisodeContent.findOneAndUpdate(
      { animeId, episodeNumber: numericEpisode },
      {
        animeId,
        animeSlug: animeSlug || '',
        episodeNumber: numericEpisode,
        episodeSlug: episodeSlug || `episode-${numericEpisode}`,
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

async function deleteEpisodeContent(req, res, next) {
  try {
    const { animeId, episodeNumber } = req.params;
    const numericEpisode = parseInt(episodeNumber, 10);

    const deleted = await EpisodeContent.findOneAndDelete({
      animeId,
      episodeNumber: numericEpisode,
    });

    res.json({
      success: true,
      deleted: !!deleted,
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getEpisodeContent,
  upsertEpisodeContent,
  deleteEpisodeContent,
};