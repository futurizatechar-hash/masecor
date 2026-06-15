import fs from 'fs';
import path from 'path';

function normalizeName(name) {
  if (!name) return '';
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Remove accents
    .replace(/[^a-z0-9]/g, "")       // Keep only alphanumeric
    .trim();
}

async function main() {
  const productsDir = 'src/content/products';
  const fullProductsPath = 'scratch/inoxar_products_full.json';
  
  if (!fs.existsSync(fullProductsPath)) {
    console.error('Error: scratch/inoxar_products_full.json not found.');
    return;
  }

  const fullProducts = JSON.parse(fs.readFileSync(fullProductsPath, 'utf8'));
  const fullProductsMap = {};
  fullProducts.forEach(p => {
    fullProductsMap[normalizeName(p.name)] = p;
  });

  const jsonFiles = fs.readdirSync(productsDir).filter(f => f.endsWith('.json'));
  console.log(`Starting strict blueprint correction for ${jsonFiles.length} products...\n`);

  // Keywords that definitely indicate a blueprint/AutoCAD drawing (EXCLUDING 'mbs')
  const strictBlueprintKeywords = [
    'captura-de-pantalla', 
    'captura', 
    'croquis', 
    'plano', 
    'esquema', 
    'medidas', 
    'dimensiones'
  ];

  let modifiedCount = 0;

  for (const filename of jsonFiles) {
    const filePath = path.join(productsDir, filename);
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    const normName = normalizeName(data.name);
    const fullProduct = fullProductsMap[normName];

    if (!fullProduct) {
      console.warn(`Warning: Could not find original product data for ${filename} (${data.name})`);
      continue;
    }

    // Determine total images by checking files on disk
    // e.g. /images/products/slug-1.webp, /images/products/slug-2.webp, etc.
    const baseImage = data.image;
    if (!baseImage) continue;

    const baseImageMatch = baseImage.match(/(.*)-1\.webp$/);
    if (!baseImageMatch) {
      console.warn(`Warning: Main image format not recognized for ${filename}: ${baseImage}`);
      continue;
    }

    const imagePrefix = baseImageMatch[1]; // e.g. /images/products/slug

    // Find all existing images on disk for this product
    const existingImages = [];
    let idx = 1;
    while (true) {
      const imgPath = `${imagePrefix}-${idx}.webp`;
      const diskPath = path.join('public', imgPath);
      if (fs.existsSync(diskPath)) {
        existingImages.push({ index: idx, path: imgPath });
        idx++;
      } else {
        break;
      }
    }

    // Find the original URL that is actually a blueprint
    let blueprintIdx = -1; // 0-based index of the original images
    
    if (fullProduct.images) {
      for (let i = 0; i < fullProduct.images.length; i++) {
        const url = fullProduct.images[i].toLowerCase();
        // Exclude MDF support backing
        if (url.includes('mbs')) continue;

        const hasKeyword = strictBlueprintKeywords.some(kw => url.includes(kw));
        if (hasKeyword) {
          blueprintIdx = i;
          break; // Stop at first blueprint
        }
      }
    }

    const previousBlueprint = data.blueprint;
    let newBlueprint = null;
    let newGallery = [];

    if (blueprintIdx !== -1) {
      // The blueprint image index corresponds to blueprintIdx + 1
      const blueprintNum = blueprintIdx + 1;
      const blueprintFile = existingImages.find(img => img.index === blueprintNum);

      if (blueprintFile) {
        newBlueprint = blueprintFile.path;
      } else {
        // Fallback: if the file doesn't exist at that index (e.g. index mismatch),
        // let's check if there is any file with -2 or -3 on disk that is not the main image
        console.warn(`Warning: Expected blueprint at index ${blueprintNum} for ${filename} but file not found on disk.`);
      }
    }

    // Rebuild gallery and blueprint fields
    existingImages.forEach(img => {
      if (img.index === 1) {
        // Main image is always -1.webp
        data.image = img.path;
      } else if (newBlueprint && img.path === newBlueprint) {
        // Found blueprint
        data.blueprint = img.path;
      } else {
        // Regular gallery image
        newGallery.push(img.path);
      }
    });

    if (newBlueprint) {
      data.blueprint = newBlueprint;
    } else {
      delete data.blueprint;
    }
    
    data.gallery = newGallery;

    // Check if anything actually changed
    const changed = (previousBlueprint !== data.blueprint) || 
                    (JSON.stringify(data.gallery) !== JSON.stringify(newGallery));

    if (changed) {
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n', 'utf8');
      console.log(`Updated ${filename}:`);
      console.log(`  - Old Blueprint: ${previousBlueprint || 'none'}`);
      console.log(`  - New Blueprint: ${data.blueprint || 'none'}`);
      console.log(`  - Gallery: ${JSON.stringify(data.gallery)}`);
      modifiedCount++;
    }
  }

  console.log(`\nStrict blueprint correction completed. Modified ${modifiedCount} files.`);
}

main().catch(console.error);
