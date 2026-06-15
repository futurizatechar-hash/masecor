import fs from 'fs';
import path from 'path';

function main() {
  const fullProductsPath = 'scratch/inoxar_products_full.json';
  if (!fs.existsSync(fullProductsPath)) return;

  const data = JSON.parse(fs.readFileSync(fullProductsPath, 'utf8'));
  const keywords = ['captura-de-pantalla', 'captura', 'croquis', 'plano', 'esquema', 'medidas', 'mbs', 'dimensiones'];

  const matches = [];

  data.forEach(p => {
    if (p.images) {
      p.images.forEach((img, idx) => {
        const lowerImg = img.toLowerCase();
        const matchedKeyword = keywords.find(kw => lowerImg.includes(kw));
        if (matchedKeyword) {
          matches.push({
            name: p.name,
            keyword: matchedKeyword,
            index: idx,
            url: img
          });
        }
      });
    }
  });

  console.log(`Found ${matches.length} blueprint image candidates:`);
  console.log(JSON.stringify(matches.slice(0, 30), null, 2));
  console.log(`Total count: ${matches.length}`);
}

main();
