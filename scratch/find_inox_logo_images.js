import fs from 'fs';
import path from 'path';

function main() {
  const dir = 'src/content/products';
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.json'));

  const references = [];

  files.forEach(file => {
    const data = JSON.parse(fs.readFileSync(path.join(dir, file), 'utf8'));
    const images = [data.image, ...(data.gallery || [])].filter(Boolean);

    images.forEach(img => {
      if (img.toLowerCase().includes('inox') && !img.toLowerCase().includes('inoxidable')) {
        references.push({
          file,
          productName: data.name,
          img
        });
      }
    });
  });

  console.log(`Found ${references.length} potential inox logo references:`);
  console.log(JSON.stringify(references, null, 2));
}

main();
