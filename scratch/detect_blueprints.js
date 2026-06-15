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
  
  if (!fs.existsSync(fullProductsPath)) {
    console.error('inoxar_products_full.json not found!');
    return;
  }

  const fullProducts = JSON.parse(fs.readFileSync(fullProductsPath, 'utf8'));
  const fullProductsMap = {};
  fullProducts.forEach(p => {
    fullProductsMap[normalizeName(p.name)] = p;
  });

  const jsonFiles = fs.readdirSync(productsDir).filter(f => f.endsWith('.json'));
  console.log(`Analyzing ${jsonFiles.length} products...\n`);

  const blueprintKeywords = ['captura-de-pantalla', 'captura', 'croquis', 'plano', 'esquema', 'medidas', 'mbs', 'dimensiones'];
  const detections = [];

  for (const filename of jsonFiles) {
    const filePath = path.join(productsDir, filename);
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    const normName = normalizeName(data.name);
    const fullProduct = fullProductsMap[normName];

    const gallery = data.gallery || [];
    if (gallery.length === 0) continue;

    let detectedBlueprint = null;
    let detectionReason = '';

    // We check each image in the gallery
    for (let i = 0; i < gallery.length; i++) {
      const imgPath = gallery[i];
      const localFullPath = path.join('public', imgPath);
      
      if (!fs.existsSync(localFullPath)) continue;

      const entropy = await getEntropy(localFullPath);

      // 1. Check if the original URL for this gallery index matched blueprint keywords
      let matchesKeyword = false;
      let originalUrl = '';
      if (fullProduct && fullProduct.images) {
        // We need to map the local gallery index to the original images index.
        // Let's find which original image matches this local image filename.
        // E.g., if the local image is prisma-xl-acero-304-78x45x22cm-2.webp, its index suffix is 2.
        const fileSuffixMatch = imgPath.match(/-(\d+)\.webp$/);
        if (fileSuffixMatch) {
          const originalIdx = parseInt(fileSuffixMatch[1], 10) - 1; // 0-indexed
          if (fullProduct.images[originalIdx]) {
            originalUrl = fullProduct.images[originalIdx];
            const lowerUrl = originalUrl.toLowerCase();
            const matchedKw = blueprintKeywords.find(kw => lowerUrl.includes(kw));
            if (matchedKw) {
              matchesKeyword = true;
              detectionReason = `Matched keyword "${matchedKw}" in original URL`;
            }
          }
        }
      }

      // 2. Check if entropy is extremely low (< 1.8) and it's not a known non-blueprint file
      // Drawings have very low entropy (usually < 1.7)
      if (entropy < 1.75 && !matchesKeyword) {
        // Double check it's not a known standard image
        const isStandard = imgPath.includes('-1.webp');
        if (!isStandard) {
          matchesKeyword = true;
          detectionReason = `Low entropy (${entropy.toFixed(2)}) and not main image`;
        }
      }

      if (matchesKeyword) {
        detectedBlueprint = imgPath;
        break; // Found it!
      }
    }

    if (detectedBlueprint) {
      detections.push({
        file: filename,
        productName: data.name,
        blueprint: detectedBlueprint,
        reason: detectionReason
      });
    }
  }

  console.log(`Detected blueprints for ${detections.length} products:`);
  console.log(JSON.stringify(detections, null, 2));
}

main().catch(console.error);
