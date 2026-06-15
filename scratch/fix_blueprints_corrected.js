import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

async function getEntropy(filePath) {
  try {
    const stats = await sharp(filePath).stats();
    return stats.entropy;
  } catch (err) {
    return 999;
  }
}

async function main() {
  const productsDir = 'src/content/products';
  const imagesDir = 'public/images/products';

  if (!fs.existsSync(productsDir)) {
    console.error(`Directory not found: ${productsDir}`);
    return;
  }

  const jsonFiles = fs.readdirSync(productsDir).filter(f => f.endsWith('.json'));
  console.log(`Starting corrected blueprint assignment for ${jsonFiles.length} products...\n`);

  const allowedCategories = ['bacha-simple', 'bacha-doble', 'pileta-lavadero'];
  let updatedCount = 0;

  for (const filename of jsonFiles) {
    const filePath = path.join(productsDir, filename);
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    
    const slug = filename.replace('.json', '');
    const prefix = slug + '-';
    
    // Find all files on disk matching the product slug base name
    const filesOnDisk = fs.readdirSync(imagesDir)
      .filter(f => f.startsWith(prefix) && f.endsWith('.webp'))
      .map(f => {
        const numPart = f.substring(prefix.length).replace('.webp', '');
        return {
          filename: f,
          index: parseInt(numPart, 10),
          path: `/images/products/${f}`,
          fullPath: path.join(imagesDir, f)
        };
      })
      .sort((a, b) => a.index - b.index);

    let detectedBlueprint = null;
    const canHaveBlueprint = allowedCategories.includes(data.category);

    if (canHaveBlueprint) {
      // Find candidate blueprint
      for (const img of filesOnDisk) {
        if (img.index === 1) {
          // Main image is never the blueprint
          continue;
        }

        const stats = fs.statSync(img.fullPath);
        const sizeKB = stats.size / 1024;
        const entropy = await getEntropy(img.fullPath);

        // Heuristics: size < 25KB, entropy < 2.0
        if (sizeKB < 25 && entropy < 2.0) {
          if (!detectedBlueprint || entropy < detectedBlueprint.entropy) {
            detectedBlueprint = {
              path: img.path,
              filename: img.filename,
              entropy,
              sizeKB
            };
          }
        }
      }
    }

    // Rebuild the gallery and blueprint fields
    const targetBlueprint = detectedBlueprint ? detectedBlueprint.path : null;
    const targetGallery = [];

    filesOnDisk.forEach(img => {
      if (img.index === 1) {
        // Main image remains data.image
        data.image = img.path;
      } else if (targetBlueprint && img.path === targetBlueprint) {
        // Blueprint image
      } else {
        // Gallery image
        targetGallery.push(img.path);
      }
    });

    const previousBlueprint = data.blueprint || null;
    const previousGallery = data.gallery || [];

    if (targetBlueprint) {
      data.blueprint = targetBlueprint;
    } else {
      delete data.blueprint;
    }
    data.gallery = targetGallery;

    const blueprintChanged = previousBlueprint !== (targetBlueprint || null);
    const galleryChanged = JSON.stringify(previousGallery) !== JSON.stringify(targetGallery);

    if (blueprintChanged || galleryChanged) {
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n', 'utf8');
      console.log(`Updated: ${data.name} (${filename})`);
      console.log(`  - Old blueprint: ${previousBlueprint || 'none'}`);
      console.log(`  - New blueprint: ${targetBlueprint || 'none'}`);
      console.log(`  - Gallery: ${JSON.stringify(targetGallery)}`);
      console.log('----------------------------------------------------');
      updatedCount++;
    }
  }

  console.log(`\nSuccessfully updated ${updatedCount} product JSON files.`);
}

main().catch(console.error);
