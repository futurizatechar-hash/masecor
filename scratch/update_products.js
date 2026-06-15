import fs from 'fs';
import path from 'path';

const productsDir = 'src/content/products';

// 1. Delete requested products
const productsToDelete = [
  'canasto-esencial-duo-33x38x12cm.json',
  'griferia-mesada-10612.json'
];

productsToDelete.forEach(filename => {
  const filePath = path.join(productsDir, filename);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
    console.log(`Deleted ${filename}`);
  }
});

// 2. Rewrite descriptions without "inox"
const files = fs.readdirSync(productsDir).filter(f => f.endsWith('.json'));

const baseCopies = [
  "Diseño elegante y gran durabilidad. Ideal para cocinas modernas que buscan funcionalidad sin sacrificar el estilo. Su acabado premium facilita la limpieza diaria.",
  "Calidad superior y resistencia excepcional. Esta pieza destaca por su formato ergonómico, aportando una estética minimalista y profesional a tu espacio.",
  "La combinación perfecta entre estética y practicidad. Pensada para el uso intensivo, garantiza un mantenimiento sencillo y una vida útil prolongada.",
  "Optimiza tu espacio con esta solución de alta gama. Su estructura robusta asegura un rendimiento impecable y una apariencia sofisticada en todo momento."
];

function sanitize(text) {
  if (!text) return "";
  return text.replace(/inoxidable/gi, 'de alta calidad').replace(/inox/gi, 'premium');
}

files.forEach((filename, idx) => {
  const filePath = path.join(productsDir, filename);
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

  // Sanitize name, material, features, shortDescription, description
  data.name = sanitize(data.name);
  if (data.material) data.material = sanitize(data.material);
  
  if (data.features) {
    data.features = data.features.map(f => sanitize(f));
  }

  // Rewrite description to be short, beautiful, and NO inox
  const copy = baseCopies[idx % baseCopies.length];
  
  data.shortDescription = copy;
  data.description = `Renová tu espacio con este producto de Masecor. ${copy} Especialmente diseñado para adaptarse a cualquier mesada y ofrecerte la mejor experiencia de uso.`;

  fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n', 'utf8');
});

console.log("Updated descriptions and removed 'inox' references.");
