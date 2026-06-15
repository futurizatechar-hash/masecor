import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

function normalizeName(name) {
  if (!name) return '';
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Remove accents
    .replace(/[^a-z0-9]/g, "")       // Keep only alphanumeric
    .trim();
}

async function getEntropy(filePath) {
  try {
    const stats = await sharp(filePath).stats();
    return stats.entropy;
  } catch (err) {
    return 999; // Error fallback
  }
}

async function main() {
  const productsDir = 'src/content/products';
  const fullProductsPath = 'scratch/inoxar_products_full.json';
  
  let fullProductsMap = {};
  if (fs.existsSync(fullProductsPath)) {
    const fullProducts = JSON.parse(fs.readFileSync(fullProductsPath, 'utf8'));
    fullProducts.forEach(p => {
      fullProductsMap[normalizeName(p.name)] = p;
    });
  } else {
    console.warn('Warning: scratch/inoxar_products_full.json not found. Keyword matching from original URLs won\'t be active.');
  }

  const jsonFiles = fs.readdirSync(productsDir).filter(f => f.endsWith('.json'));
  console.log(`Starting blueprint migration for ${jsonFiles.length} products...\n`);

  const blueprintKeywords = ['captura-de-pantalla', 'captura', 'croquis', 'plano', 'esquema', 'medidas', 'mbs', 'dimensiones'];
  let modifiedCount = 0;
  const migratedList = [];

  for (const filename of jsonFiles) {
    const filePath = path.join(productsDir, filename);
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    const normName = normalizeName(data.name);
    const fullProduct = fullProductsMap[normName];

    const gallery = data.gallery || [];
    if (gallery.length === 0) {
      // Clear blueprint just in case, or ensure it's not present if gallery is empty
      if (data.blueprint) {
        delete data.blueprint;
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
        console.log(`Cleared blueprint field from ${filename} as it has no gallery.`);
      }
      continue;
    }

    let detectedBlueprint = null;
    let detectionReason = '';

    // 1. Check gallery images
    for (let i = 0; i < gallery.length; i++) {
      const imgPath = gallery[i];
      const localFullPath = path.join('public', imgPath);
      
      if (!fs.existsSync(localFullPath)) continue;

      const entropy = await getEntropy(localFullPath);

      // Check URL keyword match
      let matchesKeyword = false;
      let originalUrl = '';
      if (fullProduct && fullProduct.images) {
        const fileSuffixMatch = imgPath.match(/-(\d+)\.webp$/);
        if (fileSuffixMatch) {
          const originalIdx = parseInt(fileSuffixMatch[1], 10) - 1;
          if (fullProduct.images[originalIdx]) {
            originalUrl = fullProduct.images[originalIdx];
            const lowerUrl = originalUrl.toLowerCase();
            const matchedKw = blueprintKeywords.find(kw => lowerUrl.includes(kw));
            if (matchedKw) {
              matchesKeyword = true;
              detectionReason = `Keyword match "${matchedKw}" in original URL`;
            }
          }
        }
      }

      // Check low entropy match (excluding main images)
      if (entropy < 1.75 && !matchesKeyword) {
        const isStandard = imgPath.includes('-1.webp');
        if (!isStandard) {
          matchesKeyword = true;
          detectionReason = `Low entropy (${entropy.toFixed(2)})`;
        }
      }

      if (matchesKeyword) {
        detectedBlueprint = imgPath;
        break; // Stop at first detected blueprint in gallery
      }
    }

    // Apply change if blueprint was found
    if (detectedBlueprint) {
      // Remove blueprint from gallery
      const initialLength = data.gallery.length;
      data.gallery = data.gallery.filter(img => img !== detectedBlueprint);
      
      // Assign to blueprint field
      data.blueprint = detectedBlueprint;
      
      // Write file back
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n', 'utf8');
      
      modifiedCount++;
      migratedList.push({
        file: filename,
        product: data.name,
        blueprint: detectedBlueprint,
        reason: detectionReason,
        remainingGallerySize: data.gallery.length
      });
      console.log(`Migrated ${filename}: removed ${detectedBlueprint} from gallery and set as blueprint. (${detectionReason})`);
    } else {
      // Ensure no blueprint field remains if not found
      if (data.blueprint) {
        delete data.blueprint;
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n', 'utf8');
        console.log(`Removed blueprint field from ${filename} since no blueprint was detected.`);
      }
    }
  }

  console.log(`\nMigration completed. Modified ${modifiedCount} files.`);
}

main().catch(console.error);
