const mongoose = require('mongoose');

const EpisodeIndexSchema = new mongoose.Schema(
  {
    animeId: {
      type: String,
      required: true,
      index: true,
    },
    animeTitle: {
      type: String,
      required: true,
      index: true,
    },
    seasonName: {
      type: String,
      default: '',
    },
    format: {
      type: String,
      default: '',
    },
    episodeNumber: {
      type: Number,
      required: true,
      index: true,
    },
    // opțional, pentru completare ulterioară cu surse oficiale
    youtubeVideoId: {
      type: String,
      default: '',
    },
    youtubeSearchQuery: {
      type: String,
      default: '',
    },

    customFields: {
      type: Object,
      default: {},
    },
  },
  { timestamps: true }
);

EpisodeIndexSchema.index({ animeId: 1, episodeNumber: 1 }, { unique: true });

module.exports = mongoose.model('EpisodeIndex', EpisodeIndexSchema);