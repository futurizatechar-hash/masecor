import fs from 'fs';

async function main() {
  const html = fs.readFileSync('scratch/product_detail_raw.html', 'utf8');
  const idx = html.indexOf('IZQUIERDA-MONOCOMANDO');
  if (idx !== -1) {
    console.log('--- 1000 characters BEFORE ---');
    console.log(html.slice(idx - 1500, idx));
    console.log('--- 1000 characters AFTER ---');
    console.log(html.slice(idx, idx + 1000));
  }
}

main().catch(console.error);
