import fs from 'fs';
import path from 'path';

function main() {
  const imagesDir = 'public/images/products';
  const productsDir = 'src/content/products';
  
  const targetLogoFile = 'bacha-cocina-standar-m20-bacha-profunda-acero-mate-4.webp';
  const targetPath = path.join(imagesDir, targetLogoFile);
  
  if (!fs.existsSync(targetPath)) {
    console.error(`Target file ${targetLogoFile} not found!`);
    return;
  }
  
  const stats = fs.statSync(targetPath);
  const targetSize = stats.size;
  console.log(`Target logo size: ${targetSize} bytes`);

  // 1. Identify all logo files in public/images/products
  const imgFiles = fs.readdirSync(imagesDir).filter(f => f.endsWith('.webp'));
  const logoFiles = [];

  imgFiles.forEach(file => {
    const filePath = path.join(imagesDir, file);
    const fileSize = fs.statSync(filePath).size;
    if (Math.abs(fileSize - targetSize) === 0) { // Exact match of 4952 bytes
      logoFiles.push(file);
    }
  });

  console.log(`Identified ${logoFiles.length} logo files to delete.`);

  // Create a set of relative image paths to remove from JSON files
  const pathsToRemove = new Set(logoFiles.map(file => `/images/products/${file}`));

  // 2. Clean up JSON files in src/content/products
  const jsonFiles = fs.readdirSync(productsDir).filter(f => f.endsWith('.json'));
  let updatedJsonCount = 0;

  jsonFiles.forEach(filename => {
    const filePath = path.join(productsDir, filename);
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    let changed = false;

    // Remove from gallery
    if (data.gallery && data.gallery.length > 0) {
      const originalLength = data.gallery.length;
      data.gallery = data.gallery.filter(img => !pathsToRemove.has(img));
      if (data.gallery.length !== originalLength) {
        changed = true;
      }
    }

    // Remove from main image (just in case, though unlikely)
    if (data.image && pathsToRemove.has(data.image)) {
      console.warn(`Warning: Product "${data.name}" uses logo as main image!`);
      data.image = '/images/products/placeholder.webp'; // Fallback
      changed = true;
    }

    // Remove from variants
    if (data.variants && data.variants.length > 0) {
      data.variants.forEach(variant => {
        if (variant.image && pathsToRemove.has(variant.image)) {
          delete variant.image;
          changed = true;
        }
      });
    }

    if (changed) {
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
      updatedJsonCount++;
    }
  });

  console.log(`Updated ${updatedJsonCount} JSON product files to remove logo references.`);

  // 3. Physically delete the files
  let deletedFilesCount = 0;
  logoFiles.forEach(file => {
    const filePath = path.join(imagesDir, file);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      deletedFilesCount++;
    }
  });

  console.log(`Physically deleted ${deletedFilesCount} logo image files.`);
}

main();
