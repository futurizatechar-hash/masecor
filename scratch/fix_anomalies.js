import fs from 'fs';
import path from 'path';

function main() {
  const dir = 'src/content/products';
  
  const filesToFix = [
    // Bacha Cocina Estandar M20
    {
      file: 'bacha-cocina-estandar-m20-acero-inox-430-pileta-bajo-mesada.json',
      line: 'lavadero',
      category: 'pileta-lavadero',
      installationType: 'bajo-mesada'
    },
    // Bacha Cocina Estandar M30
    {
      file: 'bacha-cocina-estandar-m30-acero-inox-430-pileta-bajo-mesada-sop-70mm.json',
      line: 'lavadero',
      category: 'pileta-lavadero',
      installationType: 'bajo-mesada'
    },
    // Bacha Cocina Estandar M30c
    {
      file: 'bacha-cocina-estandar-m30c-acero-inox-430-pileta-bajo-mesada-sop-110mm.json',
      line: 'lavadero',
      category: 'pileta-lavadero',
      installationType: 'bajo-mesada'
    },
    // Bacha M10 (30*38*14) - 1
    {
      file: 'bacha-de-cocina-o-lavadero-m10-acero-inoxidable-sopapa-de-110mm-medidas-30-38-14-cm-bajo-mesada-acero-inoxidable.json',
      line: 'lavadero',
      category: 'pileta-lavadero',
      installationType: 'bajo-mesada'
    },
    // Bacha M10 (30*38*15.5) - 2
    {
      file: 'bacha-de-cocina-o-lavadero-m10-acero-inoxidable-sopapa-de-110mm-medidas-30-38-15-5-cm-bajo-mesada-acero-inoxidabl.json',
      line: 'lavadero',
      category: 'pileta-lavadero',
      installationType: 'bajo-mesada'
    },
    // Bacha M10 (30*38*15.5) - 3
    {
      file: 'bacha-de-cocina-o-lavadero-m10-acero-inoxidable-sopapa-de-110mm-medidas-30-38-15-5-cm-bajo-mesada-acero-inoxidable.json',
      line: 'lavadero',
      category: 'pileta-lavadero',
      installationType: 'bajo-mesada'
    },
    // Bacha M10 (30*38*14) - 4
    {
      file: 'bacha-de-cocina-o-lavadero-m10-acero-inoxidable-sopapa-de-70mm-medidas-30-38-14-cm-bajo-mesada-acero-inoxidable.json',
      line: 'lavadero',
      category: 'pileta-lavadero',
      installationType: 'bajo-mesada'
    },
    // Bacha M20pc Simple Lavadero
    {
      file: 'bacha-de-cocina-simple-lavadero-m20pc-acero-inoxidable-sopapa-medidas-50-33-15-5-cm-bajo-mesada-acero-inoxidable-terminacion-mate.json',
      line: 'lavadero',
      category: 'pileta-lavadero',
      installationType: 'bajo-mesada'
    }
  ];

  filesToFix.forEach(info => {
    const filePath = path.join(dir, info.file);
    if (fs.existsSync(filePath)) {
      const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      
      console.log(`Fixing ${info.file}:`);
      console.log(`  Old: line=${data.line}, category=${data.category}, installationType=${data.installationType}`);
      
      data.line = info.line;
      data.category = info.category;
      data.installationType = info.installationType;
      
      // Let's also delete the description/shortDescription so that the process_products script can re-generate the premium fallback based on the new category!
      delete data.description;
      delete data.shortDescription;

      fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
      console.log(`  New: line=${data.line}, category=${data.category}, installationType=${data.installationType}`);
    } else {
      console.warn(`File not found: ${info.file}`);
    }
  });

  console.log('\nAll anomalies updated. Now run scratch/process_products.js to regenerate descriptions and options.');
}

main();
