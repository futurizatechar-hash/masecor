import fs from 'fs';
import path from 'path';

function main() {
  const scratchDir = 'scratch';
  const fullProductsPath = path.join(scratchDir, 'inoxar_products_full.json');

  if (!fs.existsSync(fullProductsPath)) {
    console.error('inoxar_products_full.json not found!');
    return;
  }

  const products = JSON.parse(fs.readFileSync(fullProductsPath, 'utf8'));
  const urlCounts = {};

  products.forEach(p => {
    if (p.images) {
      p.images.forEach(img => {
        urlCounts[img] = (urlCounts[img] || 0) + 1;
      });
    }
  });

  // Sort by count
  const sorted = Object.entries(urlCounts)
    .filter(([url, count]) => count > 1)
    .sort((a, b) => b[1] - a[1]);

  console.log('Common remote image URLs across products:');
  sorted.slice(0, 15).forEach(([url, count]) => {
    console.log(`Count: ${count} | URL: ${url}`);
  });
}

main();
