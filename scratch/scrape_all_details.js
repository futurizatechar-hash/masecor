import fs from 'fs';
import https from 'https';
import path from 'path';

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

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

async function main() {
  const scratchDir = path.join(process.cwd(), 'scratch');
  if (!fs.existsSync(scratchDir)) {
    fs.mkdirSync(scratchDir, { recursive: true });
  }

  const catalogPath = path.join(scratchDir, 'inoxar_catalog.json');
  let products = [];

  // Step 1: Scrape catalog pages if not already done
  if (fs.existsSync(catalogPath)) {
    console.log('Loading existing catalog from inoxar_catalog.json...');
    products = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));
  }

  if (products.length === 0) {
    console.log('Scraping catalog...');
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

        const regex = /<a\s+href="([^"]+\/productos\/[^"\/]+)\/"\s+title="([^"]+)"[^>]*>([\s\S]*?)<\/a>/g;
        let match;
        let count = 0;
        
        while ((match = regex.exec(html)) !== null) {
          const detailUrl = match[1] + '/';
          const name = match[2];
          const innerHtml = match[3];
          
          if (detailUrl.includes('/page/') || uniqueUrls.has(detailUrl)) {
            continue;
          }
          
          uniqueUrls.add(detailUrl);
          
          // Try to get raw thumbnail image src
          const imgRegex = /src="([^"]+)"/i;
          const imgMatch = innerHtml.match(imgRegex);
          const rawImgUrl = imgMatch ? imgMatch[1] : null;

          products.push({
            name: name.trim(),
            url: detailUrl,
            rawImageUrl: rawImgUrl ? 'https:' + rawImgUrl.replace(/^https?:/, '') : null
          });
          count++;
        }
        console.log(`Found ${count} products on page ${page}.`);
        await sleep(500);
      } catch (e) {
        console.error(`Error fetching page ${page}:`, e.message);
      }
    }
    fs.writeFileSync(catalogPath, JSON.stringify(products, null, 2));
    console.log(`Saved ${products.length} products to ${catalogPath}`);
  }

  console.log(`Starting detailed scraping for ${products.length} products...`);
  const detailedProducts = [];

  for (let i = 0; i < products.length; i++) {
    const p = products[i];
    console.log(`[${i + 1}/${products.length}] Fetching details for: ${p.name}...`);
    
    try {
      const html = await fetchPage(p.url);
      
      if (html.includes('Just a moment...')) {
        console.error(`Blocked by Cloudflare on detail page: ${p.url}`);
        await sleep(2000);
        continue;
      }

      // 1. Extract Description
      let description = null;
      const descRegex1 = /class="product-description user-content"[^>]*>([\s\S]*?)<\/div>/i;
      const match1 = html.match(descRegex1);
      if (match1) {
        description = match1[1].trim();
      } else {
        const descRegex2 = /class="js-item-description item-description"[^>]*>([\s\S]*?)<\/div>/i;
        const match2 = html.match(descRegex2);
        if (match2) {
          description = match2[1].trim();
        }
      }

      // 2. Extract unique high-res product images
      // Look for /products/ images.
      // E.g. //acdn-us.mitiendanube.com/stores/006/428/317/products/image-name-1024-1024.webp
      const imageSet = new Set();
      const imgRegex = /(?:href|src)="([^"]+\/stores\/006\/428\/317\/products\/[^"]+)"/g;
      let imgMatch;
      while ((imgMatch = imgRegex.exec(html)) !== null) {
        const rawLink = imgMatch[1];
        // Clean URL to absolute https:
        const cleanLink = 'https:' + rawLink.replace(/^https?:/, '');
        imageSet.add(cleanLink);
      }

      // Filter and only keep the highest resolution of each image base name.
      // Usually Tiendanube serves multiple sizes: e.g. -240-0, -480-0, -1024-1024.
      // We will group them by the image identifier (everything before the size suffix) and keep the largest size.
      const groupedImages = {};
      for (const imgUrl of imageSet) {
        // Extract base name by stripping the size suffix (e.g. -1024-1024.webp or -480-0.webp)
        // Format example: .../image_id-1024-1024.webp
        const baseMatch = imgUrl.match(/(.+\/products\/[^\-]+)/);
        if (baseMatch) {
          const base = baseMatch[1];
          // Determine size priority. 1024-1024 is best.
          let priority = 0;
          if (imgUrl.includes('-1024-1024')) priority = 3;
          else if (imgUrl.includes('-480-0')) priority = 2;
          else if (imgUrl.includes('-240-0')) priority = 1;

          if (!groupedImages[base] || groupedImages[base].priority < priority) {
            groupedImages[base] = { url: imgUrl, priority };
          }
        } else {
          groupedImages[imgUrl] = { url: imgUrl, priority: 0 };
        }
      }

      const productImages = Object.values(groupedImages).map(item => item.url);

      detailedProducts.push({
        name: p.name,
        url: p.url,
        description: description,
        images: productImages
      });

      // Show progress
      console.log(`   ✓ Extracted description and ${productImages.length} images.`);
      
      // Save partial progress to prevent loss of data
      if (detailedProducts.length % 5 === 0 || detailedProducts.length === products.length) {
        const progressPath = path.join(scratchDir, 'inoxar_products_full.json');
        fs.writeFileSync(progressPath, JSON.stringify(detailedProducts, null, 2));
      }
      
      await sleep(350); // Pause to avoid hitting server too hard
    } catch (e) {
      console.error(`Error fetching detail page ${p.url}:`, e.message);
    }
  }

  const finalPath = path.join(scratchDir, 'inoxar_products_full.json');
  fs.writeFileSync(finalPath, JSON.stringify(detailedProducts, null, 2));
  console.log(`\n🎉 Done! Scraped ${detailedProducts.length} detailed products.`);
  console.log(`Saved detailed products file to: ${finalPath}`);
}

main().catch(console.error);
