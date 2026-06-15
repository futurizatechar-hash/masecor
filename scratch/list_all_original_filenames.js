import fs from 'fs';
import path from 'path';

function main() {
  const fullProductsPath = 'scratch/inoxar_products_full.json';
  if (!fs.existsSync(fullProductsPath)) return;

  const data = JSON.parse(fs.readFileSync(fullProductsPath, 'utf8'));
  const allNames = new Set();

  data.forEach(p => {
    if (p.images) {
      p.images.forEach(img => {
        const parts = img.split('/');
        const filename = parts[parts.length - 1];
        allNames.add(filename);
      });
    }
  });

  const sortedNames = Array.from(allNames).sort();
  console.log(`Total unique original filenames: ${sortedNames.length}`);
  // Let's filter and show filenames that are not the long d_nq_np_2x_ ones
  const customNames = sortedNames.filter(name => !name.startsWith('d_nq_np_2x_'));
  console.log('Non-standard (custom uploaded) filenames:', customNames.length);
  console.log(JSON.stringify(customNames, null, 2));
}

main();
