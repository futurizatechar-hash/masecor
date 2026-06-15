import fs from 'fs';
import path from 'path';

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
    else if (name.includes('sopapa') || name.includes('sop-')) subCategory = 'sopapas';
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

  const structure = {};

  files.forEach(file => {
    const data = JSON.parse(fs.readFileSync(path.join(dir, file), 'utf8'));
    const { mainCategory, subCategory } = getProductCategories(data.name, data.category);

    if (!structure[mainCategory]) {
      structure[mainCategory] = {};
    }
    structure[mainCategory][subCategory] = (structure[mainCategory][subCategory] || 0) + 1;
  });

  console.log('--- GENERATED GRID CATEGORIES ---');
  console.log(JSON.stringify(structure, null, 2));
}

main();
