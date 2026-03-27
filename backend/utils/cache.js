const NodeCache = require('node-cache');

const cache = new NodeCache({
  stdTTL: 1800,
  checkperiod: 120,
});

module.exports = cache;