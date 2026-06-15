import fs from 'fs';
import path from 'path';

function main() {
  const fullProductsPath = 'scratch/inoxar_products_full.json';
  if (!fs.existsSync(fullProductsPath)) return;

  const data = JSON.parse(fs.readFileSync(fullProductsPath, 'utf8'));
  console.log('Is Array:', Array.isArray(data));
  if (Array.isArray(data)) {
    console.log('Length:', data.length);
    console.log('First item keys:', Object.keys(data[0]));
    console.log('First item sample images:', data[0].images);
  } else {
    console.log('Keys:', Object.keys(data));
  }
}

main();
