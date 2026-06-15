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

async function main() {
  const url = 'https://inoxar.com.ar/productos/mesada-80cm-bacha-simple-de-acero-inoxidable-grueso-100-calidad-asadera-de-acero-profesional-de-regalo/';
  console.log('Fetching:', url);
  const html = await fetchPage(url);
  console.log('HTML Length:', html.length);
  
  if (html.includes('Just a moment...')) {
    console.log('Cloudflare Blocked');
    return;
  }

  // Find JSON-LD scripts
  const ldJsonRegex = /<script\s+type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi;
  let match;
  while ((match = ldJsonRegex.exec(html)) !== null) {
    const content = match[1].trim();
    try {
      const data = JSON.parse(content);
      if (data['@type'] === 'Product') {
        console.log('Found Product Schema:', JSON.stringify(data.offers, null, 2));
      }
    } catch (e) {}
  }
}

main().catch(console.error);
