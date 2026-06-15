import fs from 'fs';
import path from 'path';

function main() {
  const fullProductsPath = 'scratch/inoxar_products_full.json';
  if (!fs.existsSync(fullProductsPath)) return;

  const data = JSON.parse(fs.readFileSync(fullProductsPath, 'utf8'));
  const results = [];

  data.forEach(p => {
    const name = p.name;
    const images = p.images || [];
    
    // Find images that are blueprints.
    // Let's print all images for each product so we can see the filenames
    const list = images.map((img, idx) => {
      const parts = img.split('/');
      const filename = parts[parts.length - 1];
      return { idx, filename };
    });
    
    results.push({ name, images: list });
  });

  // Let's print products and their images to inspect
  results.slice(0, 30).forEach(r => {
    console.log(`Product: ${r.name}`);
    r.images.forEach(img => {
      console.log(`  [${img.idx}] ${img.filename}`);
    });
    console.log('---------------------------------');
  });
}

main();
