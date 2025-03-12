const fetch = require('node-fetch');
const cache = new Map();

module.exports = async (req, res) => {
  const { query } = req;
  const id = query.id;

  if (!id) {
    return res.status(400).send('缺少 ID'); 
  }

  if (cache.has(id) && Date.now() - cache.get(id).timestamp < 300000) {
    return res.send(cache.get(id).url);
  }

  const url = `http://interface.yy.com/hls/get/stream/15013/xv_${id}_${id}_0_0_0/15013/xa_${id}_${id}_0_0_0?source=h5player&type=flv`;

  try {
    const response = await fetch(url, {
      headers: {
        
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/86.0.4240.198 Safari/537.36'
      }
    });

    if (!response.ok) throw new Error(`请求失败: ${response.statusText}`);

    const data = await response.json();

    if (data.hls) {
      cache.set(id, {
        url: data.hls,
        timestamp: Date.now()
      });

      res.setHeader('Cache-Control', 'public, max-age=300'); 
      return res.send(data.hls); 
    } else {
      return res.status(404).send('未找到 FLV 链接'); 
    }
  } catch (error) {
    return res.status(500).send(`服务器错误: ${error.message}`); 
  }
};
