const express = require('express');
const {
  getEpisodeContent,
  upsertEpisodeContent,
  deleteEpisodeContent,
} = require('../controllers/episodeContentController');

const router = express.Router();

router.get('/:animeId/:episodeNumber', getEpisodeContent);
router.post('/', upsertEpisodeContent);
router.delete('/:animeId/:episodeNumber', deleteEpisodeContent);

module.exports = router;