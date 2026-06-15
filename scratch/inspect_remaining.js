import fs from 'fs';

function normalizeName(name) {
  if (!name) return '';
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "")
    .trim();
}

const fullProducts = JSON.parse(fs.readFileSync('scratch/inoxar_products_full.json', 'utf8'));
const fullProductsMap = {};
fullProducts.forEach(p => {
  fullProductsMap[normalizeName(p.name)] = p;
});

const remaining = [
  { file: 'bacha-aqua-l75-acero-304-75x43x22cm.json', name: 'BACHA AQUA L75 Acero 304 75x43x22cm', img: '/images/products/bacha-aqua-l75-acero-304-75x43x22cm-3.webp' },
  { file: 'prisma-duo-acero-304-82-45-22cm.json', name: 'PRISMA DUO Acero 304 82*45*22CM', img: '/images/products/prisma-duo-acero-304-82-45-22cm-4.webp' },
  { file: 'prisma-duo-acero-304-82-45-22cm.json', name: 'PRISMA DUO Acero 304 82*45*22CM', img: '/images/products/prisma-duo-acero-304-82-45-22cm-5.webp' },
  { file: 'prisma-xl-acero-304-78x45x22cm.json', name: 'PRISMA XL Acero 304 78x45x22cm', img: '/images/products/prisma-xl-acero-304-78x45x22cm-3.webp' }
];

remaining.forEach(r => {
  const norm = normalizeName(r.name);
  const p = fullProductsMap[norm];
  console.log(`Product: ${r.name}`);
  console.log(`  Img: ${r.img}`);
  if (p && p.images) {
    const fileSuffixMatch = r.img.match(/-(\d+)\.webp$/);
    if (fileSuffixMatch) {
      const idx = parseInt(fileSuffixMatch[1], 10) - 1;
      console.log(`  Original URL: ${p.images[idx]}`);
    }
  }
});
