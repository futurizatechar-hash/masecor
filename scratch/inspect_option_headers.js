import fs from 'fs';

async function main() {
  const html = fs.readFileSync('scratch/product_detail_raw.html', 'utf8');
  
  // Find select tags
  const selects = html.match(/<select[^>]*>[\s\S]*?<\/select>/gi) || [];
  console.log('Found', selects.length, 'select tags:');
  selects.forEach(s => console.log(s.slice(0, 300)));
  
  // Search for "MEDIDA" case-insensitively
  const searchRegex = /MEDIDA|UBICACI|UBICACIÓN/gi;
  let match;
  console.log('\nOccurrences of Medida/Ubicacion in text:');
  while ((match = searchRegex.exec(html)) !== null) {
    console.log(`At index ${match.index}: ${html.slice(match.index - 50, match.index + 100)}`);
  }
}

main().catch(console.error);
