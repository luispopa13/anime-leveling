const mongoose = require('mongoose');

const EpisodeContentSchema = new mongoose.Schema(
  {
    animeId: {
      type: String,
      required: true,
      index: true,
    },
    animeSlug: {
      type: String,
      default: '',
      index: true,
    },
    episodeNumber: {
      type: Number,
      required: true,
      index: true,
    },
    episodeSlug: {
      type: String,
      default: '',
      index: true,
    },
    customIntro: {
      type: String,
      default: '',
    },
    watchGuide: {
      type: String,
      default: '',
    },
    whyWatch: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

EpisodeContentSchema.index(
  { animeId: 1, episodeNumber: 1 },
  { unique: true }
);

module.exports = mongoose.model('EpisodeContent', EpisodeContentSchema);