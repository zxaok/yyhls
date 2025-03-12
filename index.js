const axios = require('axios');
const NodeCache = require('node-cache');

const cache = new NodeCache({ stdTTL: 600, checkperiod: 120, maxKeys: 1000 });

module.exports = async (req, res) => {
  const id = req.url.slice(1);

  if (!id) {
    return res.status(400).json({ error: 'Missing video ID' });
  }

  const cachedUrl = cache.get(id);
  if (cachedUrl) {
    console.log(`Returning cached URL for ${id}`);
    return res.redirect(cachedUrl);
  }

  const targetUrl = `http://interface.yy.com/hls/get/stream/15013/xv_${id}_${id}_0_0_0/15013/xa_${id}_${id}_0_0_0?source=h5player&type=flv`;
  const userAgent = 'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/86.0.4240.198 Safari/537.36';

  try {
    console.log(`Fetching URL: ${targetUrl}`);

    const response = await axios.get(targetUrl, {
      headers: { 'User-Agent': userAgent },
      timeout: 8000, 
    });

    if (response.data && response.data.hls) {
      const flvUrl = response.data.hls;

      console.log(`FLV URL found for ID ${id}: ${flvUrl}`);

      cache.set(id, flvUrl);

      return res.redirect(flvUrl);
    } else {
      throw new Error('No FLV URL found in response');
    }
  } catch (error) {
    console.error('Error fetching video URL:', error.message);

    return res.status(500).json({ error: error.message });
  }
};
