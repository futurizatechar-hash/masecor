import fs from 'fs';
import path from 'path';

// Copied helper from ProductGrid
function getProductCategories(name, cat) {
  name = name.toLowerCase();
  
  let mainCategory = '';
  let subCategory = '';
  
  if (cat === 'bacha-simple') {
    mainCategory = 'bachas';
    subCategory = 'simple';
  } else if (cat === 'bacha-doble') {
    mainCategory = 'bachas';
    subCategory = 'doble';
  } else if (cat === 'mesada-ciega') {
    mainCategory = 'mesadas';
    subCategory = 'ciega';
  } else if (cat === 'mesada-integrada') {
    mainCategory = 'mesadas';
    subCategory = 'integrada';
  } else if (cat === 'pileta-lavadero') {
    mainCategory = 'lavadero';
    subCategory = 'pileta';
  } else if (cat === 'accesorio') {
    mainCategory = 'accesorios';
    if (name.includes('canasto')) subCategory = 'canastos';
    else if (name.includes('colador')) subCategory = 'coladores';
    else if (name.includes('griferia')) subCategory = 'griferia';
    else if (name.includes('dispenser') || name.includes('dosificador')) subCategory = 'dispenser';
    else if (name.includes('sifon')) subCategory = 'sifones';
    else if (name.includes('sopapa') || name.includes('sop-')) {
      // Check if it's actually a bacha that just includes a sopapa
      if (name.includes('bacha') || name.includes('pileta')) {
        return { mainCategory: 'bachas', subCategory: 'simple', error: 'Bacha classified as sopapa accessory' };
      }
      subCategory = 'sopapas';
    }
    else if (name.includes('roller')) subCategory = 'roller';
    else if (name.includes('asadera')) subCategory = 'asadera';
    else subCategory = 'otros';
  } else {
    mainCategory = 'otros';
    subCategory = 'otros';
  }
  
  return { mainCategory, subCategory };
}

function main() {
  const dir = 'src/content/products';
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.json'));

  console.log('--- PRODUCT CATEGORIZATION ANALYSIS ---');
  files.forEach(file => {
    const data = JSON.parse(fs.readFileSync(path.join(dir, file), 'utf8'));
    const name = data.name.toLowerCase();
    const cat = data.category;
    const { mainCategory, subCategory } = getProductCategories(data.name, cat);

    // Let's flag anomalies
    let anomaly = false;
    let reason = '';

    // Anomaly 1: Title says Bacha/Pileta/Mesada but categorized as Accessory
    if (cat === 'accesorio' && (name.includes('bacha') || name.includes('pileta') || name.includes('mesada')) && !name.includes('canasto') && !name.includes('colador') && !name.includes('tabla')) {
      anomaly = true;
      reason = 'Title contains Bacha/Pileta/Mesada but category is "accesorio"';
    }

    // Anomaly 2: Title says Bacha/Pileta but category is Mesada (often caused by "bajo mesada" keyword matching)
    if (cat.startsWith('mesada') && (name.includes('bacha') || name.includes('pileta')) && !name.includes('mesada con') && !name.includes('mesada de') && !name.includes('mesada 1') && !name.includes('mesada 2') && !name.includes('mesada 8')) {
      // Mesadas usually specify size like "mesada 100cm" or "mesada de 120 cm"
      anomaly = true;
      reason = 'Title contains Bacha/Pileta but category is "mesada-integrada/ciega" (likely due to "bajo mesada")';
    }

    if (anomaly) {
      console.log(`Product: "${data.name}"`);
      console.log(`  File: ${file}`);
      console.log(`  Category in JSON: "${cat}"`);
      console.log(`  Classified as: Main="${mainCategory}", Sub="${subCategory}"`);
      console.log(`  Reason: ${reason}`);
      console.log('-------------------------------------------');
    }
  });
}

main();
