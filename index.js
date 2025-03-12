const fetch = require('node-fetch');

const cache = new Map();
const CACHE_TTL = 300000; // 5分钟缓存

module.exports = async (req, res) => {
  res.setHeader('Content-Type', 'text/plain'); // 设置响应头，防止Vercel当成HTML

  const id = req.url.split('/').pop();

  if (!id || !/^\d+$/.test(id)) {
    return res.status(400).send('Invalid ID');
  }

  if (cache.has(id) && Date.now() - cache.get(id).timestamp < CACHE_TTL) {
    return res.redirect(cache.get(id).url);
  }

  const targetUrl = `http://interface.yy.com/hls/get/stream/15013/xv_${id}_${id}_0_0_0/15013/xa_${id}_${id}_0_0_0?source=h5player&type=flv`;

  try {
    const response = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/86.0.4240.198 Safari/537.36'
      }
    });

    if (!response.ok) throw new Error(`Request failed with status: ${response.status}`);

    const data = await response.json();

    if (data.hls) {
      cache.set(id, {
        url: data.hls,
        timestamp: Date.now()
      });

      // 设置5分钟缓存
      res.setHeader('Cache-Control', `public, max-age=${CACHE_TTL / 1000}`);
      return res.redirect(data.hls);
    } else {
      return res.status(404).send('FLV link not found');
    }
  } catch (error) {
    return res.status(500).send(`Server error: ${error.message}`);
  }
};
