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
  const imagesDir = 'public/images/products';
  const productsDir = 'src/content/products';

  // 1. Target competitor logos (size 3980 bytes, containing 'inox' in original URL)
  const targetLogoFiles = [
    'cubic-acero-304-61x46x20cm-3.webp',
    'pileton-gastronomico-industrial-acero-304-1-25mm-4.webp',
    'bacha-l83-acero-304-83x43x22cm-3.webp',
    'prisma-duo-acero-304-82-45-22cm-5.webp'
  ];

  console.log('--- Step 1: Deleting competitor logos ---');
  targetLogoFiles.forEach(file => {
    const filePath = path.join(imagesDir, file);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log(`Deleted logo file: ${file}`);
    }
  });

  const logoPathsToRemove = new Set(targetLogoFiles.map(file => `/images/products/${file}`));

  // 2. Scan and update all JSON files
  console.log('\n--- Step 2: Cleaning up JSON files (logos & additional blueprints) ---');
  const jsonFiles = fs.readdirSync(productsDir).filter(f => f.endsWith('.json'));

  for (const filename of jsonFiles) {
    const filePath = path.join(productsDir, filename);
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    let changed = false;

    // A. Remove logos from gallery/blueprint/variants
    if (data.gallery && data.gallery.length > 0) {
      const originalLen = data.gallery.length;
      data.gallery = data.gallery.filter(img => !logoPathsToRemove.has(img));
      if (data.gallery.length !== originalLen) {
        changed = true;
      }
    }

    if (data.blueprint && logoPathsToRemove.has(data.blueprint)) {
      console.log(`Product "${data.name}" (${filename}) had logo as blueprint. Removing it.`);
      delete data.blueprint;
      changed = true;
    }

    if (data.variants && data.variants.length > 0) {
      data.variants.forEach(v => {
        if (v.image && logoPathsToRemove.has(v.image)) {
          delete v.image;
          changed = true;
        }
      });
    }

    // B. Scan remaining gallery for any blueprint drawings (entropy < 1.75) and remove them from gallery
    if (data.gallery && data.gallery.length > 0) {
      const initialGallery = [...data.gallery];
      const newGallery = [];
      
      for (const imgPath of initialGallery) {
        const localFullPath = path.join('public', imgPath);
        if (!fs.existsSync(localFullPath)) {
          // If file doesn't exist, don't keep it in gallery
          changed = true;
          continue;
        }

        const entropy = await getEntropy(localFullPath);
        
        if (entropy < 1.75) {
          // It's a blueprint drawing!
          console.log(`Detected drawing in gallery of "${data.name}": ${imgPath} (Entropy: ${entropy.toFixed(3)})`);
          
          // If product doesn't have a blueprint yet, assign this one
          if (!data.blueprint) {
            data.blueprint = imgPath;
            console.log(`  Assigned ${imgPath} as the product's blueprint.`);
          } else {
            console.log(`  Removed ${imgPath} from gallery (already has blueprint: ${data.blueprint}).`);
          }
          changed = true;
        } else {
          newGallery.push(imgPath);
        }
      }

      if (newGallery.length !== initialGallery.length) {
        data.gallery = newGallery;
        changed = true;
      }
    }

    // Write file back if updated
    if (changed) {
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n', 'utf8');
      console.log(`Updated JSON for ${filename}`);
    }
  }

  console.log('\nCleanup and blueprint separation completed!');
}

main().catch(console.error);
