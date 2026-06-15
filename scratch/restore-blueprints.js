/**
 * Script para restaurar el campo "blueprint" en todos los productos.
 * 
 * Lógica:
 * - La imagen de "Instrucciones de Uso" tiene exactamente 47516 bytes (misma imagen para todos)
 * - La imagen de "Instrucciones de Uso" alternativa tiene 46490 bytes (otra versión)
 * - El blueprint es la imagen en gallery que NO sea instrucciones y que parezca un plano técnico
 * 
 * Estrategia:
 * - Para cada producto con gallery, buscar en las imágenes cuál es un plano técnico
 *   buscando en el nombre del archivo o por tamaño.
 * - Las imágenes que son planos técnicos tienen tamaños únicos por producto (no repetidos)
 * - Excluimos las instrucciones (47516 y 46490 bytes) de la galería, y el blueprint
 *   es el que queda como "plano" - visualmente reconocible.
 * 
 * Como no podemos analizar el contenido de las imágenes automáticamente de forma confiable,
 * usamos el siguiente criterio observado:
 * - Si el producto tiene galería, el blueprint es la imagen en gallery que tiene un tamaño
 *   de archivo que no corresponde a las instrucciones genéricas (47516 o 46490 bytes)
 *   y que tiene el número más bajo (es decir, la primera imagen en gallery que no sea instrucciones)
 * 
 * EXCEPCIÓN observada:
 * - bacha-aqua-l57: gallery tiene [2, 4, 5, 3] → 5 = instrucciones, 4 = instrucciones alternativa
 *   → el blueprint sería 3 (plano técnico)
 * - bacha-cuore: gallery tiene [3, 2] → 3 = instrucciones → blueprint = 2
 * 
 * REGLA FINAL: El blueprint es la imagen en gallery que NO tiene 47516 ni 46490 bytes
 * (excluyendo las instrucciones de uso genéricas).
 * Si hay múltiples candidatas, tomar la que tenga el número más alto en el nombre (suele ser el plano técnico).
 */

const fs = require('fs');
const path = require('path');

const PRODUCTS_DIR = './src/content/products';
const IMAGES_DIR = './public/images/products';

// Tamaños de las imágenes genéricas de instrucciones de uso
const INSTRUCTIONS_SIZES = new Set([47516, 46490]);

function getFileSize(imagePath) {
  // imagePath is like /images/products/filename.webp
  const filename = path.basename(imagePath);
  const fullPath = path.join(IMAGES_DIR, filename);
  try {
    return fs.statSync(fullPath).size;
  } catch (e) {
    return -1;
  }
}

function findBlueprint(mainImage, gallery) {
  if (!gallery || gallery.length === 0) return null;
  
  // Filter out instruction images
  const candidates = gallery.filter(img => {
    const size = getFileSize(img);
    return !INSTRUCTIONS_SIZES.has(size) && size > 0;
  });
  
  if (candidates.length === 0) return null;
  
  // Among candidates, pick the one with the highest number suffix
  // (technical blueprints tend to be after the product photos)
  candidates.sort((a, b) => {
    const numA = parseInt(a.match(/-(\d+)\.webp$/)?.[1] || '0');
    const numB = parseInt(b.match(/-(\d+)\.webp$/)?.[1] || '0');
    return numB - numA; // descending - higher number = more likely blueprint
  });
  
  return candidates[0];
}

const files = fs.readdirSync(PRODUCTS_DIR).filter(f => f.endsWith('.json'));
let restored = 0;
let skipped = 0;

for (const file of files) {
  const filePath = path.join(PRODUCTS_DIR, file);
  const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  
  // Skip if already has blueprint
  if (data.blueprint) {
    console.log(`  SKIP (ya tiene blueprint): ${file}`);
    skipped++;
    continue;
  }
  
  // Skip if no gallery
  if (!data.gallery || data.gallery.length === 0) {
    console.log(`  SKIP (sin gallery): ${file}`);
    skipped++;
    continue;
  }
  
  const blueprint = findBlueprint(data.image, data.gallery);
  
  if (!blueprint) {
    console.log(`  SKIP (no se encontró candidato): ${file}`);
    skipped++;
    continue;
  }
  
  // Remove blueprint from gallery and add blueprint field
  const newGallery = data.gallery.filter(img => img !== blueprint);
  data.blueprint = blueprint;
  data.gallery = newGallery;
  
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n');
  console.log(`  OK: ${file} → blueprint = ${blueprint}`);
  restored++;
}

console.log(`\nRestaurados: ${restored}, Omitidos: ${skipped}`);
