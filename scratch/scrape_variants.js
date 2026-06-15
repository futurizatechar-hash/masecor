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
  const catalogPath = path.join(scratchDir, 'inoxar_catalog.json');
  const outputPath = path.join(scratchDir, 'inoxar_variants_raw.json');
  
  if (!fs.existsSync(catalogPath)) {
    console.error('Catalog file not found!');
    return;
  }
  
  const products = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));
  console.log(`Loaded ${products.length} products to check for variants...`);
  
  const results = {};
  
  for (let i = 0; i < products.length; i++) {
    const p = products[i];
    console.log(`[${i + 1}/${products.length}] Checking: ${p.name}...`);
    
    try {
      const html = await fetchPage(p.url);
      
      if (html.includes('Just a moment...')) {
        console.error(`Blocked by Cloudflare for ${p.name}`);
        await sleep(2000);
        continue;
      }
      
      // 1. Extract option header labels
      const optionLabels = {};
      const labelRegex = /<label[^>]*for="variation_(\d+)"[^>]*>([\s\S]*?)<\/label>/gi;
      let labelMatch;
      while ((labelMatch = labelRegex.exec(html)) !== null) {
        const optionNum = parseInt(labelMatch[1]) - 1; // 0-indexed
        const labelText = labelMatch[2].trim().toUpperCase();
        optionLabels[`option${optionNum}`] = labelText;
      }
      
      // Fallback if labels not found under 'for="variation_X"'
      if (Object.keys(optionLabels).length === 0) {
        const fallbackRegex = /<label class="form-label d-inline-block mt-2">([\s\S]*?)<\/label>/gi;
        let fbMatch;
        let fbIdx = 0;
        while ((fbMatch = fallbackRegex.exec(html)) !== null) {
          const labelText = fbMatch[1].trim().toUpperCase();
          if (labelText && !optionLabels[`option${fbIdx}`]) {
            optionLabels[`option${fbIdx}`] = labelText;
            fbIdx++;
          }
        }
      }
      
      // 2. Extract LS.variants JSON
      let variants = [];
      const startIdx = html.indexOf('LS.variants = ');
      if (startIdx !== -1) {
        const fromStart = html.slice(startIdx + 'LS.variants = '.length);
        let bracketCount = 0;
        let endIdx = -1;
        for (let j = 0; j < fromStart.length; j++) {
          if (fromStart[j] === '[') bracketCount++;
          else if (fromStart[j] === ']') {
            bracketCount--;
            if (bracketCount === 0) {
              endIdx = j + 1;
              break;
            }
          }
        }
        if (endIdx !== -1) {
          variants = JSON.parse(fromStart.slice(0, endIdx));
        }
      }
      
      if (variants.length > 0) {
        console.log(`   Found ${variants.length} variants! Option labels:`, optionLabels);
        results[p.name] = {
          url: p.url,
          optionLabels,
          variants: variants.map(v => ({
            id: v.id,
            available: v.available,
            option0: v.option0,
            option1: v.option1,
            option2: v.option2,
            image_url: v.image_url ? 'https:' + v.image_url.replace(/^https?:/, '') : null,
            price: v.price_number
          }))
        };
      } else {
        console.log(`   No variants found.`);
      }
      
      // Save partial results
      if (i % 5 === 0 || i === products.length - 1) {
        fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));
      }
      
      await sleep(300);
    } catch (e) {
      console.error(`Error checking variants for ${p.name}:`, e.message);
    }
  }
  
  console.log(`\n🎉 Completed variants scraping! Results saved to ${outputPath}`);
}

main().catch(console.error);
