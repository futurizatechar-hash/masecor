/**
 * Limpieza final: quita blueprints incorrectos (imágenes de marketing, logos, etc.)
 * y deja solo los planos técnicos reales.
 * Los planos técnicos identificados son los que muestran dimensiones exactas con cotas.
 */

const fs = require('fs');
const path = require('path');

const PRODUCTS_DIR = './src/content/products';
const IMAGES_DIR = './public/images/products';

// Tamaño de la imagen "Acero Inoxidable 304 INOX" (marketing genérico)
const INOX_MARKETING_SIZE = 36952;
// Tamaño del logo INOX.AR
const INOX_LOGO_SIZE = 8468; // aprox sop-comun-cuadrada-con-antidesborde-2

// Productos con blueprint incorrecto (imagen de marketing, no plano técnico)
// Detectados visualmente: los que tienen tamaño = 36952 (imagen INOX 304)
const WRONG_BLUEPRINTS = [
  'bacha-l83-acero-304-83x43x22cm.json',        // -2.webp = INOX marketing
  'cubic-acero-304-61x46x20cm.json',             // -2.webp = INOX marketing
  'gema-acero-304-68x45x22cm.json',              // -4.webp = accesorios foto
  'gema-xl-acero-304-80x50x22cm.json',           // -5.webp = necesita verificación
  'prisma-duo-acero-304-82-45-22cm.json',        // -4.webp = necesita verificación
  'sop-comun-cuadrada-con-antidesborde.json',    // -2.webp = logo INOX.AR
];

let fixed = 0;

for (const filename of WRONG_BLUEPRINTS) {
  const filePath = path.join(PRODUCTS_DIR, filename);
  if (!fs.existsSync(filePath)) continue;
  
  const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  if (!data.blueprint) continue;
  
  const blueprintFile = path.basename(data.blueprint);
  const blueprintPath = path.join(IMAGES_DIR, blueprintFile);
  let size = -1;
  try { size = fs.statSync(blueprintPath).size; } catch(e) {}
  
  console.log(`${filename}: blueprint = ${blueprintFile} (${size} bytes)`);
  
  // Move back to gallery
  const blueprint = data.blueprint;
  delete data.blueprint;
  if (!data.gallery) data.gallery = [];
  data.gallery.push(blueprint);
  
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n');
  console.log(`  -> REMOVED (moved back to gallery)`);
  fixed++;
}

console.log(`\nFixed: ${fixed}`);

// Now show remaining valid blueprints
console.log('\n=== BLUEPRINTS VÁLIDOS RESTANTES ===');
const files = fs.readdirSync(PRODUCTS_DIR).filter(f => f.endsWith('.json'));
files.forEach(f => {
  const data = JSON.parse(fs.readFileSync(path.join(PRODUCTS_DIR, f)));
  if (data.blueprint) {
    console.log(path.basename(data.blueprint) + ' <- ' + f.replace('.json',''));
  }
});
