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
  const productsPath = path.join(scratchDir, 'inoxar_products_full.json');
  if (!fs.existsSync(productsPath)) {
    console.error('inoxar_products_full.json not found!');
    return;
  }

  const products = JSON.parse(fs.readFileSync(productsPath, 'utf8'));
  console.log(`Loaded ${products.length} products to fetch prices...`);

  const results = [];
  const concurrency = 5;

  // Helper to process a single product
  async function processProduct(p, idx) {
    console.log(`[${idx + 1}/${products.length}] Fetching price for: ${p.name}...`);
    try {
      const html = await fetchPage(p.url);
      if (html.includes('Just a moment...')) {
        console.error(`Blocked by Cloudflare for: ${p.name}`);
        return { ...p, price: null, variants: [] };
      }

      // Parse JSON-LD Product Schemas
      const ldJsonRegex = /<script\s+type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi;
      let match;
      let price = null;
      let lowPrice = null;
      let highPrice = null;
      let variants = [];

      while ((match = ldJsonRegex.exec(html)) !== null) {
        const content = match[1].trim();
        try {
          const data = JSON.parse(content);
          if (data['@type'] === 'Product' && data.mainEntityOfPage?.['@id']?.includes(p.url)) {
            const offers = data.offers;
            if (offers) {
              if (offers['@type'] === 'AggregateOffer') {
                lowPrice = offers.lowPrice ? parseFloat(offers.lowPrice) : null;
                highPrice = offers.highPrice ? parseFloat(offers.highPrice) : null;
                price = lowPrice;
                if (offers.offers && Array.isArray(offers.offers)) {
                  variants = offers.offers.map(off => ({
                    name: off.name,
                    sku: off.sku,
                    price: off.price ? parseFloat(off.price) : null,
                    availability: off.availability
                  }));
                }
              } else if (offers['@type'] === 'Offer') {
                price = offers.price ? parseFloat(offers.price) : null;
              } else if (Array.isArray(offers)) {
                price = offers[0]?.price ? parseFloat(offers[0].price) : null;
              }
            }
          }
        } catch (e) {
          // ignore parsing error
        }
      }

      // Fallback: If no schema matches or price not found, regex parse price from body
      if (!price) {
        // Look for: "price": "167048"
        const fallbackRegex = /"price":\s*"([0-9]+)"/i;
        const fallbackMatch = html.match(fallbackRegex);
        if (fallbackMatch) {
          price = parseFloat(fallbackMatch[1]);
        }
      }

      console.log(`   ✓ Price: ${price}. Variants count: ${variants.length}`);
      return {
        ...p,
        price,
        lowPrice,
        highPrice,
        variants
      };
    } catch (e) {
      console.error(`Error fetching price for ${p.name}:`, e.message);
      return { ...p, price: null, variants: [] };
    }
  }

  // Run with simple concurrency control
  for (let i = 0; i < products.length; i += concurrency) {
    const chunk = products.slice(i, i + concurrency);
    const promises = chunk.map((p, idx) => processProduct(p, i + idx));
    const chunkResults = await Promise.all(promises);
    results.push(...chunkResults);
    
    // Quick write
    fs.writeFileSync(
      path.join(scratchDir, 'inoxar_products_with_prices.json'),
      JSON.stringify(results, null, 2)
    );

    await sleep(400); // polite pause between chunks
  }

  console.log(`🎉 Done! Saved prices for ${results.length} products to scratch/inoxar_products_with_prices.json`);
}

main().catch(console.error);
