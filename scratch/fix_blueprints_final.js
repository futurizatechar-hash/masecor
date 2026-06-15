import fs from 'fs';
import path from 'path';

function norm(str) {
  if (!str) return '';
  return str
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
    fullProductsMap[norm(p.name)] = p;
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
  let matchCount = 0;

  for (const filename of jsonFiles) {
    const filePath = path.join(productsDir, filename);
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    
    // We map by matching the normalized filename with the normalized original name
    const cleanFilename = filename.replace('.json', '');
    const normFilename = norm(cleanFilename);

    let fullProduct = null;

    // Try filename match first
    for (const key of Object.keys(fullProductsMap)) {
      // Check if normalized original name matches normalized filename
      // e.g. "bachaaqual57acero30457x43x22cm" vs "bachaaqual57premiumacero30457x43x22cm"
      if (key.includes(normFilename) || normFilename.includes(key)) {
        fullProduct = fullProductsMap[key];
        break;
      }
    }

    // Try name match fallback (stripping sanitize differences)
    if (!fullProduct) {
      const cleanDataName = norm(data.name)
        .replace(/dealncalidad/g, 'aceroinoxidable')
        .replace(/premium/g, 'inox');
      
      for (const key of Object.keys(fullProductsMap)) {
        if (key.includes(cleanDataName) || cleanDataName.includes(key)) {
          fullProduct = fullProductsMap[key];
          break;
        }
      }
    }

    if (!fullProduct) {
      console.warn(`Warning: Could not match ${filename} to any original product`);
      continue;
    }

    matchCount++;

    const baseImage = data.image;
    if (!baseImage) continue;

    const baseImageMatch = baseImage.match(/(.*)-1\.webp$/);
    if (!baseImageMatch) continue;

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
        // Exclude MDF support backing ("mbs")
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
        console.warn(`Warning: Expected blueprint at index ${blueprintNum} for ${filename} but file not found on disk.`);
      }
    }

    // Rebuild gallery and blueprint fields
    existingImages.forEach(img => {
      if (img.index === 1) {
        data.image = img.path;
      } else if (newBlueprint && img.path === newBlueprint) {
        data.blueprint = img.path;
      } else {
        newGallery.push(img.path);
      }
    });

    if (newBlueprint) {
      data.blueprint = newBlueprint;
    } else {
      delete data.blueprint;
    }
    
    data.gallery = newGallery;

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

  console.log(`\nMatched ${matchCount}/${jsonFiles.length} products.`);
  console.log(`Strict blueprint correction completed. Modified ${modifiedCount} files.`);
}

main().catch(console.error);
