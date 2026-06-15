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
  console.log(`Analyzing detection logic for ${jsonFiles.length} products...\n`);

  const allowedCategories = ['bacha-simple', 'bacha-doble', 'pileta-lavadero'];
  const changes = [];

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
    const galleryCandidates = [];
    
    // Check if category is allowed to have blueprints
    const canHaveBlueprint = allowedCategories.includes(data.category);

    if (canHaveBlueprint) {
      // Find candidate blueprint
      for (const img of filesOnDisk) {
        if (img.index === 1) {
          // Skip main image
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

    // Rebuild the lists
    const targetImage = `/images/products/${slug}-1.webp`;
    const targetBlueprint = detectedBlueprint ? detectedBlueprint.path : null;
    const targetGallery = [];

    filesOnDisk.forEach(img => {
      if (img.index === 1) {
        // Main image
      } else if (targetBlueprint && img.path === targetBlueprint) {
        // Blueprint
      } else {
        // Gallery
        targetGallery.push(img.path);
      }
    });

    const currentBlueprint = data.blueprint || null;
    const currentGallery = data.gallery || [];
    
    const blueprintChanged = currentBlueprint !== targetBlueprint;
    const galleryChanged = JSON.stringify(currentGallery) !== JSON.stringify(targetGallery);

    if (blueprintChanged || galleryChanged) {
      changes.push({
        filename,
        name: data.name,
        category: data.category,
        currentBlueprint,
        targetBlueprint,
        currentGallery,
        targetGallery,
        filesOnDiskCount: filesOnDisk.length,
        detectedBlueprintDetails: detectedBlueprint
      });
    }
  }

  console.log(`Found ${changes.length} products that will be updated:\n`);

  changes.forEach(c => {
    console.log(`Product: ${c.name} (${c.filename}) [Category: ${c.category}]`);
    console.log(`  - Files on disk: ${c.filesOnDiskCount}`);
    console.log(`  - Current blueprint: ${c.currentBlueprint || 'None'}`);
    console.log(`  - Target blueprint:  ${c.targetBlueprint || 'None'}`);
    if (c.detectedBlueprintDetails) {
      console.log(`    (Details: Size ${c.detectedBlueprintDetails.sizeKB.toFixed(1)}KB, Entropy ${c.detectedBlueprintDetails.entropy.toFixed(3)})`);
    }
    console.log(`  - Current gallery:   ${JSON.stringify(c.currentGallery)}`);
    console.log(`  - Target gallery:    ${JSON.stringify(c.targetGallery)}`);
    console.log('----------------------------------------------------');
  });

  console.log(`\nTotal products to change: ${changes.length}`);
}

main().catch(console.error);
