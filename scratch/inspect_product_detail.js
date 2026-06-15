import fs from 'fs';
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
  const html = await fetchPage(url);
  fs.writeFileSync('scratch/product_detail_test.html', html);
  console.log('Saved product detail html. Length:', html.length);
  
  // Find "price" matches
  const regex = /"price":\s*"([^"]+)"|price:\s*([0-9\.]+)/gi;
  let match;
  while ((match = regex.exec(html)) !== null) {
    console.log('Price match:', match[0]);
  }
  
  // Find values with currency symbol like $123.456 or similar
  const currencyRegex = /\$\s*[0-9\.,]+/g;
  const currencyMatches = html.match(currencyRegex);
  if (currencyMatches) {
    console.log('Currency matches:', currencyMatches.slice(0, 30));
  }
}

main().catch(console.error);
