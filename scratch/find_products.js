import https from 'https';

function fetchPage(url) {
  return new Promise((resolve, reject) => {
    const options = {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      },
      rejectUnauthorized: false
    };
    https.get(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

async function test() {
  const url = 'https://inoxar.com.ar/productos/mesada-80cm-bacha-simple-de-acero-inoxidable-grueso-100-calidad-asadera-de-acero-profesional-de-regalo/';
  const html = await fetchPage(url);
  
  // Find all images that belong to the product images (usually hosted on mitiendanube.com/stores/.../products/)
  const imgUrls = [];
  const regex = /href="([^"]+)"|src="([^"]+)"/g;
  let match;
  while ((match = regex.exec(html)) !== null) {
    const link = match[1] || match[2];
    if (link.includes('/products/') && !imgUrls.includes(link)) {
      imgUrls.push(link);
    }
  }
  
  console.log('Unique product images found:', imgUrls.length);
  console.log(imgUrls);
}

test().catch(console.error);
