const fetch = require('node-fetch');

const cache = new Map();
const CACHE_TTL = 300000; 
const MAX_CACHE_SIZE = 50; 

function cleanCache() {
  const now = Date.now();
  for (const [key, value] of cache) {
    if (now - value.timestamp > CACHE_TTL) {
      cache.delete(key);
    }
  }
  if (cache.size > MAX_CACHE_SIZE) {
    const keys = Array.from(cache.keys()).slice(0, cache.size - MAX_CACHE_SIZE);
    keys.forEach((key) => cache.delete(key));
  }
}

module.exports = async (req, res) => {
  const id = req.url.split('/api/')[1];

  if (!id || !/^\d+$/.test(id)) {
    return res.status(404).send('Invalid ID');
  }

  cleanCache();

  if (cache.has(id) && Date.now() - cache.get(id).timestamp < CACHE_TTL) {
    return res.send(cache.get(id).url);
  }

  const url = `http://interface.yy.com/hls/get/stream/15013/xv_${id}_${id}_0_0_0/15013/xa_${id}_${id}_0_0_0?source=h5player&type=flv`;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/86.0.4240.198 Safari/537.36'
      },
      signal: controller.signal
    });

    clearTimeout(timeout);

    if (!response.ok) {
      throw new Error(`Request failed: ${response.statusText}`);
    }

    const data = await response.json();

    if (data.hls) {
      cache.set(id, {
        url: data.hls,
        timestamp: Date.now()
      });

      res.setHeader('Cache-Control', `public, max-age=${CACHE_TTL / 1000}`);
      return res.send(data.hls);
    } else {
      return res.status(404).send('FLV link not found');
    }
  } catch (error) {
    if (error.name === 'AbortError') {
      return res.status(504).send('Request timeout');
    }
    return res.status(500).send(`Server error: ${error.message}`);
  }
};
