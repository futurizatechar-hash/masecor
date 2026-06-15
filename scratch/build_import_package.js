import fs from 'fs';
import path from 'path';

function sanitizeFilename(name) {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

async function main() {
  const masecorRoot = 'c:\\Users\\angel\\OneDrive\\futuriza\\proyectos\\masecor\\masecor-web';
  const inoxRoot = 'C:\\Users\\angel\\OneDrive\\futuriza\\proyectos\\masecor\\inox-ecomerce';

  const srcProductsDir = path.join(masecorRoot, 'src', 'content', 'products');
  const srcImagesDir = path.join(masecorRoot, 'public', 'images', 'products');
  const srcPricesJsonPath = path.join(masecorRoot, 'scratch', 'inoxar_products_with_prices.json');

  const destImportDir = path.join(inoxRoot, 'data-import');
  const destProductsDir = path.join(destImportDir, 'products');
  const destImagesDir = path.join(destImportDir, 'images');

  console.log('Creating destination directories...');
  fs.mkdirSync(destImportDir, { recursive: true });
  fs.mkdirSync(destProductsDir, { recursive: true });
  fs.mkdirSync(destImagesDir, { recursive: true });

  if (!fs.existsSync(srcPricesJsonPath)) {
    console.error('Source prices JSON not found!');
    return;
  }

  // Load scraped products with prices
  const scrapedProducts = JSON.parse(fs.readFileSync(srcPricesJsonPath, 'utf8'));
  console.log(`Loaded ${scrapedProducts.length} scraped products with prices.`);

  // Create a map of sanitized_name -> scraped info
  const scrapedMap = new Map();
  scrapedProducts.forEach(p => {
    const key = sanitizeFilename(p.name);
    scrapedMap.set(key, p);
  });

  // Read all Astro collection products
  const astroFiles = fs.readdirSync(srcProductsDir).filter(f => f.endsWith('.json'));
  console.log(`Found ${astroFiles.length} product JSON files in Astro collection.`);

  let matchedCount = 0;

  astroFiles.forEach(file => {
    const slug = path.basename(file, '.json');
    const scraped = scrapedMap.get(slug);

    const fullSrcPath = path.join(srcProductsDir, file);
    const productData = JSON.parse(fs.readFileSync(fullSrcPath, 'utf8'));

    if (scraped) {
      // Add prices, variants and originalUrl
      productData.price = scraped.price;
      productData.lowPrice = scraped.lowPrice;
      productData.highPrice = scraped.highPrice;
      productData.variants = scraped.variants || [];
      productData.originalUrl = scraped.url;
      matchedCount++;
    } else {
      console.warn(`No price match found for Astro product: ${file}`);
      // Try fuzzy matching or default properties
      productData.price = null;
      productData.variants = [];
    }

    // Write to new destination
    const fullDestPath = path.join(destProductsDir, file);
    fs.writeFileSync(fullDestPath, JSON.stringify(productData, null, 2));
  });

  console.log(`Matched and wrote ${matchedCount}/${astroFiles.length} product JSON files with price data.`);

  // Write any products that are in scrape but not in Astro collection
  let extraCount = 0;
  scrapedProducts.forEach(p => {
    const slug = sanitizeFilename(p.name);
    const file = `${slug}.json`;
    const fullDestPath = path.join(destProductsDir, file);

    if (!fs.existsSync(fullDestPath)) {
      // Create a new product JSON file
      const productData = {
        name: p.name,
        line: 'standard', // default line
        category: 'bacha-simple', // default category
        shortDescription: p.name,
        description: p.description || '',
        material: 'Acero Inoxidable',
        features: ['Acero Inoxidable', 'Calidad Profesional'],
        installationType: 'bajo-mesada',
        image: p.images?.[0] ? `/images/products/${path.basename(p.images[0])}` : null,
        gallery: p.images?.slice(1).map(img => `/images/products/${path.basename(img)}`) || [],
        price: p.price,
        lowPrice: p.lowPrice,
        highPrice: p.highPrice,
        variants: p.variants || [],
        originalUrl: p.url,
        sortOrder: 100,
        featured: false,
        available: true
      };
      fs.writeFileSync(fullDestPath, JSON.stringify(productData, null, 2));
      extraCount++;
    }
  });

  console.log(`Generated ${extraCount} extra product JSON files not present in original Astro collection.`);

  // Copy images
  console.log('Copying images...');
  const images = fs.readdirSync(srcImagesDir).filter(f => f.endsWith('.webp') || f.endsWith('.jpg') || f.endsWith('.png'));
  let imagesCopied = 0;

  images.forEach(img => {
    const srcImgPath = path.join(srcImagesDir, img);
    const destImgPath = path.join(destImagesDir, img);
    fs.copyFileSync(srcImgPath, destImgPath);
    imagesCopied++;
  });

  console.log(`Successfully copied ${imagesCopied} images.`);

  // Save the master JSON with all raw data (including raw mitiendanube image links, full description, etc.)
  const destMasterPath = path.join(destImportDir, 'products_master.json');
  fs.writeFileSync(destMasterPath, JSON.stringify(scrapedProducts, null, 2));
  console.log(`Saved products_master.json with raw scraped data to ${destMasterPath}`);

  console.log('\n🎉 Import package built successfully inside inox-ecomerce!');
}

main().catch(console.error);
