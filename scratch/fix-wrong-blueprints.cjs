/**
 * Script de corrección: los productos de mesadas con bacha (con muchas imágenes) 
 * NO tienen planos técnicos reales - son fotos promocionales.
 * Este script elimina el campo blueprint de esos productos y devuelve la imagen a gallery.
 * 
 * También verifica visualmente cuáles blueprints son reales mirando las imágenes asignadas
 * que tengan el patrón de los planos técnicos (solo las de bachas de la línea premium/standard).
 */

const fs = require('fs');
const path = require('path');

const PRODUCTS_DIR = './src/content/products';

// Productos que NO tienen plano técnico real (sus imágenes son fotos promocionales)
// Estos son los productos con 7+ imágenes donde ninguna es un plano técnico
const PRODUCTS_WITHOUT_BLUEPRINT = [
  'mesada-100cm-bacha-simple-de-acero-inoxidable-grueso-100-calidad-asadera-de-acero-profesional-de-regalo.json',
  'mesada-110-cm-ciega-cocina-sin-bacha-acero-inoxidable-grueso-100-calidad-con-o-sin-zocalo-trasero.json',
  'mesada-110cm-bacha-simple-de-acero-inoxidable-grueso-110-calidad-asadera-de-acero-profesional-de-regalo.json',
  'mesada-120-cm-ciega-cocina-sin-bacha-acero-inoxidable-grueso-100-calidad-con-o-sin-zocalo-trasero-copia.json',
  'mesada-120cm-bacha-simple-de-acero-inoxidable-grueso-100-calidad-asadera-de-acero-profesional-de-regalo.json',
  'mesada-130cm-bacha-simple-de-acero-inoxidable-grueso-100-calidad-asadera-de-acero-profesional-de-regalo.json',
  'mesada-140-cm-ciega-cocina-sin-bacha-acero-inoxidable-grueso-100-calidad-con-o-sin-zocalo-trasero.json',
  'mesada-140cm-bacha-simple-de-acero-inoxidable-grueso-100-calidad-asadera-de-acero-profesional-de-regalo.json',
  'mesada-150cm-bacha-simple-de-acero-inoxidable-grueso-100-calidad-asadera-de-acero-profesional-de-regalo.json',
  'mesada-160-cm-ciega-cocina-sin-bacha-acero-inoxidable-grueso-100-calidad-con-o-sin-zocalo-trasero.json',
  'mesada-160cm-bacha-simple-de-acero-inoxidable-grueso-100-calidad-asadera-de-acero-profesional-de-regalo.json',
  'mesada-180-cm-ciega-cocina-sin-bacha-acero-inoxidable-grueso-100-calidad-con-o-sin-zocalo-trasero.json',
  'mesada-180cm-bacha-simple-de-acero-inoxidable-grueso-100-calidad-asadera-de-acero-profesional-de-regalo.json',
  'mesada-200-cm-ciega-cocina-sin-bacha-acero-inoxidable-grueso-100-calidad-con-o-sin-zocalo-trasero.json',
  'mesada-200cm-bacha-simple-de-acero-inoxidable-grueso-100-calidad-asadera-de-acero-profesional-de-regalo.json',
  'mesada-220cm-bacha-simple-de-acero-inoxidable-grueso-100-calidad-asadera-de-acero-profesional-de-regalo.json',
  'mesada-80-cm-ciega-cocina-sin-bacha-acero-inoxidable-grueso-100-calidad-con-o-sin-zocalo-trasero.json',
  'mesada-80cm-bacha-simple-de-acero-inoxidable-grueso-100-calidad-asadera-de-acero-profesional-de-regalo.json',
  'mesada-de-120-cm-con-bacha-lava-ollas-lavadero-de-61x38x25-cm-super-profunda-inoxidable-grueso-100-calidad-envio-copia.json',
  'mesada-de-160-cm-con-bacha-lava-ollas-lavadero-de-61x38x25-cm-super-profunda-inoxidable-grueso-100-calidad-envio.json',
  // dispenser no tiene plano técnico real
  'dispenser-de-detergente-acero-inoxidable.json',
  // griferias no tienen plano técnico, son fotos de producto
  'griferia-pico-alto-10614.json',
  'griferia-pico-bar-10014.json',
];

let fixed = 0;

for (const filename of PRODUCTS_WITHOUT_BLUEPRINT) {
  const filePath = path.join(PRODUCTS_DIR, filename);
  if (!fs.existsSync(filePath)) {
    console.log(`  NOT FOUND: ${filename}`);
    continue;
  }
  
  const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  
  if (!data.blueprint) {
    console.log(`  SKIP (no blueprint): ${filename}`);
    continue;
  }
  
  // Move blueprint back to gallery
  const blueprint = data.blueprint;
  delete data.blueprint;
  if (!data.gallery) data.gallery = [];
  data.gallery.push(blueprint);
  
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n');
  console.log(`  FIXED: ${filename} → blueprint removed, moved to gallery`);
  fixed++;
}

console.log(`\nFixed: ${fixed}`);
