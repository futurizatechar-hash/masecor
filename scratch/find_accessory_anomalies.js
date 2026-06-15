import fs from 'fs';
import path from 'path';

function main() {
  const dir = 'src/content/products';
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.json'));

  const anomalies = [];

  const accessoryKeywords = [
    'canasto', 'colador', 'griferia', 'dispenser', 'dosificador',
    'sifon', 'sopapa', 'sop-', 'roller', 'escurridor', 'asadera',
    'bandeja', 'tabla'
  ];

  files.forEach(file => {
    const data = JSON.parse(fs.readFileSync(path.join(dir, file), 'utf8'));
    const name = data.name.toLowerCase();
    const cat = data.category;
    const line = data.line;

    // Check if any keyword matches
    const matchedKeyword = accessoryKeywords.find(keyword => name.includes(keyword));

    if (matchedKeyword) {
      // It has an accessory keyword.
      // But is it actually an accessory?
      // Some products are mesadas that INCLUDE an accessory, e.g. "Mesada + Asadera de regalo".
      // But if the product is JUST the accessory, it should have category "accesorio".
      // If the product is JUST the accessory (e.g. name starts with Canasto, Griferia, Dispenser, Roller, Sifon, Sopapa, Asadera, Bandeja, Colador),
      // then it must be category "accesorio" and line "accesorios".
      const isJustAccessory = name.startsWith('canasto') || 
                              name.startsWith('colador') || 
                              name.startsWith('griferia') || 
                              name.startsWith('dispenser') || 
                              name.startsWith('dosificador') || 
                              name.startsWith('sifon') || 
                              name.startsWith('sopapa') || 
                              name.startsWith('sop-') || 
                              name.startsWith('roller') || 
                              name.startsWith('escurridor') || 
                              name.startsWith('asadera') || 
                              name.startsWith('bandeja') || 
                              name.startsWith('colador') ||
                              name.startsWith('tabla');

      if (isJustAccessory) {
        if (cat !== 'accesorio' || line !== 'accesorios') {
          anomalies.push({
            file,
            name: data.name,
            currentCategory: cat,
            currentLine: line,
            suggestedCategory: 'accesorio',
            suggestedLine: 'accesorios'
          });
        }
      }
    }
  });

  console.log(`Found ${anomalies.length} accessory anomalies:`);
  console.log(JSON.stringify(anomalies, null, 2));
}

main();
