import fs from 'fs';
import https from 'https';
import path from 'path';
import sharp from 'sharp';

function sanitizeFilename(name) {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function downloadImage(url, destPath) {
  return new Promise((resolve, reject) => {
    const options = {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
        'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8',
      },
      rejectUnauthorized: false
    };
    
    https.get(url, options, (res) => {
      if (res.statusCode === 200) {
        const fileStream = fs.createWriteStream(destPath);
        res.pipe(fileStream);
        fileStream.on('finish', () => {
          fileStream.close(() => {
            resolve(true);
          });
        });
        fileStream.on('error', (err) => {
          fs.unlink(destPath, () => {});
          reject(err);
        });
      } else {
        res.resume();
        reject(new Error(`Server returned status code: ${res.statusCode}`));
      }
    }).on('error', reject);
  });
}

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

async function main() {
  const scratchDir = path.join(process.cwd(), 'scratch');
  const tempImgDir = path.join(scratchDir, 'inoxar_images_temp');
  const outputProductsDir = path.join(process.cwd(), 'public', 'images', 'products');

  if (!fs.existsSync(tempImgDir)) {
    fs.mkdirSync(tempImgDir, { recursive: true });
  }
  if (!fs.existsSync(outputProductsDir)) {
    fs.mkdirSync(outputProductsDir, { recursive: true });
  }

  const productsPath = path.join(scratchDir, 'inoxar_products_full.json');
  if (!fs.existsSync(productsPath)) {
    console.error(`Error: Full products JSON not found at ${productsPath}. Please run scrape_all_details.js first.`);
    return;
  }

  const products = JSON.parse(fs.readFileSync(productsPath, 'utf8'));
  console.log(`Loaded ${products.length} products to download and optimize...`);

  const updatedProducts = [];

  for (let i = 0; i < products.length; i++) {
    const p = products[i];
    const sanitizedName = sanitizeFilename(p.name);
    console.log(`\n[${i + 1}/${products.length}] Processing product: ${p.name}`);

    const localImages = [];

    for (let imgIndex = 0; imgIndex < p.images.length; imgIndex++) {
      const imgUrl = p.images[imgIndex];
      // Generate clean filename
      const extension = '.webp'; // We will convert everything to webp
      const localFilename = `${sanitizedName}-${imgIndex + 1}${extension}`;
      const tempPath = path.join(tempImgDir, `${sanitizedName}-${imgIndex + 1}_temp`);
      const finalOutputPath = path.join(outputProductsDir, localFilename);

      console.log(`   Downloading image [${imgIndex + 1}/${p.images.length}]: ${imgUrl}...`);
      
      try {
        // 1. Download image to temp location
        await downloadImage(imgUrl, tempPath);
        
        // 2. Read temp file into buffer to avoid Windows file locks
        const buffer = fs.readFileSync(tempPath);
        
        // 3. Optimize and convert image from buffer using sharp
        await sharp(buffer)
          .resize(800, null, {
            withoutEnlargement: true,
            fit: 'inside'
          })
          .webp({ quality: 65, effort: 6 })
          .toFile(finalOutputPath);
        
        // 4. Remove temp file
        fs.unlinkSync(tempPath);
        
        const inputStats = fs.statSync(finalOutputPath);
        const sizeKB = (inputStats.size / 1024).toFixed(1);
        console.log(`   ✓ Optimized and saved as /images/products/${localFilename} (${sizeKB} KB)`);
        
        // Save relative path for Astro integration
        localImages.push(`/images/products/${localFilename}`);
        
      } catch (err) {
        console.error(`   ✗ Error processing image ${imgUrl}:`, err.stack);
        try { if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath); } catch {}
      }
    }

    updatedProducts.push({
      name: p.name,
      description: p.description,
      originalUrl: p.url,
      images: localImages
    });
    
    // Write progress to inoxar_products_optimized.json
    fs.writeFileSync(
      path.join(scratchDir, 'inoxar_products_optimized.json'),
      JSON.stringify(updatedProducts, null, 2)
    );
  }

  // Cleanup temp dir
  try {
    fs.rmSync(tempImgDir, { recursive: true, force: true });
  } catch (err) {
    console.error('Error cleaning up temp directory:', err.message);
  }

  console.log(`\n🎉 Success! Processed ${updatedProducts.length} products.`);
  console.log(`Optimized images saved to: ${outputProductsDir}`);
  console.log(`Full product data saved to: ${path.join(scratchDir, 'inoxar_products_optimized.json')}`);
}

main().catch(console.error);
