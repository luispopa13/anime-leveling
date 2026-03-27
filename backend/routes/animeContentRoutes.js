const express = require('express');
const {
  getAnimeContent,
  upsertAnimeContent,
  deleteAnimeContent,
} = require('../controllers/animeContentController');

const router = express.Router();

// GET custom content by anime id
router.get('/:animeId', getAnimeContent);

// CREATE / UPDATE custom content
router.post('/', upsertAnimeContent);

// DELETE custom content
router.delete('/:animeId', deleteAnimeContent);

module.exports = router;