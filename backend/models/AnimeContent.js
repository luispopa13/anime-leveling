const mongoose = require('mongoose');

const AnimeContentSchema = new mongoose.Schema(
  {
    animeId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    slug: {
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

module.exports = mongoose.model('AnimeContent', AnimeContentSchema);