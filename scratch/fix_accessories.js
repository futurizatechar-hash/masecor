import fs from 'fs';
import path from 'path';

function main() {
  const dir = 'src/content/products';
  
  const filesToFix = [
    'asadera.json',
    'bandeja-prisma-mediana-26-36-8cm.json',
    'bandeja-prisma-mini-26-35-8cm.json',
    'bandeja-prisma-xl-o-prisma-duo-20-38-6cm.json',
    'canasto-cuore-o-prisma-l-22x43x10cm.json',
    'canasto-esencial-o-gema-xl-22x36x11cm.json',
    'canasto-gema-o-aqua-l75-22x34x11cm.json',
    'colador-gema-xl-o-esencial-duo-23-37-9cm.json',
    'sopapa-premium-sin-antidesborde.json'
  ];

  filesToFix.forEach(filename => {
    const filePath = path.join(dir, filename);
    if (fs.existsSync(filePath)) {
      const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      
      console.log(`Fixing ${filename}:`);
      console.log(`  Old: line=${data.line}, category=${data.category}`);
      
      data.line = 'accesorios';
      data.category = 'accesorio';
      
      // Reset description so process_products can regenerate it
      delete data.description;
      delete data.shortDescription;

      fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
      console.log(`  New: line=${data.line}, category=${data.category}`);
    } else {
      console.warn(`File not found: ${filename}`);
    }
  });

  console.log('\nAll accessory anomalies patched. Now run process_products.js.');
}

main();
