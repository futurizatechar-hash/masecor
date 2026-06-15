import fs from 'fs';
import https from 'https';
import path from 'path';

function fetchPage(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { rejectUnauthorized: false }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

async function main() {
  const allProducts = [];
  const uniqueUrls = new Set();

  for (let page = 1; page <= 7; page++) {
    const url = page === 1 
      ? 'https://inoxar.com.ar/productos/' 
      : `https://inoxar.com.ar/productos/page/${page}/`;
    
    console.log(`Fetching page ${page}: ${url}...`);
    try {
      const html = await fetchPage(url);
      
      if (html.includes('Just a moment...')) {
        console.error(`Page ${page} was blocked by Cloudflare.`);
        continue;
      }

      // Regex to find product links and details in the HTML
      // A product link typically looks like:
      // <a href="https://inoxar.com.ar/productos/PRODUCT-NAME/" title="PRODUCT TITLE" ...
      // And contains an image tag inside.
      
      const regex = /<a\s+href="([^"]+\/productos\/[^"\/]+)\/"\s+title="([^"]+)"[^>]*>([\s\S]*?)<\/a>/g;
      let match;
      let count = 0;
      
      while ((match = regex.exec(html)) !== null) {
        const detailUrl = match[1] + '/';
        const name = match[2];
        const innerHtml = match[3];
        
        // Find image src inside the innerHtml
        const imgRegex = /src="([^"]+)"/i;
        const imgMatch = innerHtml.match(imgRegex);
        const rawImgUrl = imgMatch ? imgMatch[1] : null;
        
        // Skip links that are pagination links or duplicates
        if (detailUrl.includes('/page/') || uniqueUrls.has(detailUrl)) {
          continue;
        }
        
        uniqueUrls.add(detailUrl);
        
        allProducts.push({
          name: name.trim(),
          url: detailUrl,
          rawImageUrl: rawImgUrl ? 'https:' + rawImgUrl.replace(/^https?:/, '') : null
        });
        count++;
      }
      
      console.log(`Found ${count} products on page ${page}.`);
      await sleep(1000); // 1s delay to be polite
    } catch (e) {
      console.error(`Error fetching page ${page}:`, e.message);
    }
  }

  console.log(`\nTotal products extracted: ${allProducts.length}`);
  
  // Create scratch dir if not exists
  const scratchDir = path.join(process.cwd(), 'scratch');
  if (!fs.existsSync(scratchDir)) {
    fs.mkdirSync(scratchDir, { recursive: true });
  }

  const outputPath = path.join(scratchDir, 'inoxar_catalog.json');
  fs.writeFileSync(outputPath, JSON.stringify(allProducts, null, 2));
  console.log(`Saved ${allProducts.length} products to ${outputPath}`);
}

main().catch(console.error);
