import fs from 'fs';
import path from 'path';

function main() {
  const dir = 'src/content/products';
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.json'));

  const anomalies = [];

  files.forEach(file => {
    const data = JSON.parse(fs.readFileSync(path.join(dir, file), 'utf8'));
    const name = data.name.toLowerCase();
    const inst = data.installationType;
    const cat = data.category;
    const line = data.line;

    let issue = false;
    let reason = [];

    // Check Installation Type mismatch
    if (name.includes('bajo mesada') || name.includes('bajo-mesada')) {
      if (inst !== 'bajo-mesada') {
        issue = true;
        reason.push(`has 'bajo mesada' in title but installationType is '${inst}'`);
      }
    }

    // Check Category mismatch
    if (name.includes('bajo mesada') || name.includes('bajo-mesada')) {
      if (cat.startsWith('mesada')) {
        issue = true;
        reason.push(`has 'bajo mesada' in title but category is '${cat}'`);
      }
    }

    if (name.includes('bacha') || name.includes('pileta')) {
      if (cat === 'accesorio') {
        // Exclude actual accessories that mention "para bacha" or "para pileta"
        if (!name.includes('canasto') && !name.includes('colador') && !name.includes('sifon') && !name.includes('sopapa') && !name.includes('tabla') && !name.includes('dispenser') && !name.includes('roller')) {
          issue = true;
          reason.push(`contains 'bacha' or 'pileta' in title but category is 'accesorio'`);
        }
      }
    }

    if (issue) {
      anomalies.push({
        file,
        name: data.name,
        category: cat,
        line: line,
        installationType: inst,
        reasons: reason
      });
    }
  });

  console.log(`Found ${anomalies.length} products with issues:`);
  console.log(JSON.stringify(anomalies, null, 2));
}

main();
