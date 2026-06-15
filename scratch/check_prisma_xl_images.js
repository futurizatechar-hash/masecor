import fs from 'fs';
import path from 'path';

function main() {
  const fullProductsPath = 'scratch/inoxar_products_full.json';
  if (!fs.existsSync(fullProductsPath)) return;

  const data = JSON.parse(fs.readFileSync(fullProductsPath, 'utf8'));
  const p = data.find(item => item.name.toLowerCase().includes('prisma xl'));
  if (p) {
    console.log('Product:', p.name);
    console.log('Original Images:', p.images);
  } else {
    console.log('Product not found');
  }
}

main();
