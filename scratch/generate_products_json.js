import fs from 'fs';
import path from 'path';

function sanitizeFilename(name) {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function cleanHtmlText(html) {
  if (!html) return '';
  return html
    .replace(/<[^>]*>/g, '') // remove HTML tags
    .replace(/&nbsp;/g, ' ')
    .replace(/&ndash;/g, '–')
    .replace(/&ldquo;/g, '"')
    .replace(/&rdquo;/g, '"')
    .replace(/&aacute;/g, 'á')
    .replace(/&eacute;/g, 'é')
    .replace(/&iacute;/g, 'í')
    .replace(/&oacute;/g, 'ó')
    .replace(/&uacute;/g, 'ú')
    .replace(/&ntilde;/g, 'ñ')
    .replace(/&Aacute;/g, 'Á')
    .replace(/&Eacute;/g, 'É')
    .replace(/&Iacute;/g, 'Í')
    .replace(/&Oacute;/g, 'Ó')
    .replace(/&Uacute;/g, 'Ú')
    .replace(/&Ntilde;/g, 'Ñ')
    .replace(/\s+/g, ' ')
    .trim();
}

async function main() {
  const scratchDir = path.join(process.cwd(), 'scratch');
  const optimizedJsonPath = path.join(scratchDir, 'inoxar_products_optimized.json');
  const outputJsonDir = path.join(scratchDir, 'inoxar_content_products');

  if (!fs.existsSync(optimizedJsonPath)) {
    console.error(`Error: Optimized products JSON not found at ${optimizedJsonPath}. Please run download_and_optimize.js first.`);
    return;
  }

  if (!fs.existsSync(outputJsonDir)) {
    fs.mkdirSync(outputJsonDir, { recursive: true });
  }

  const products = JSON.parse(fs.readFileSync(optimizedJsonPath, 'utf8'));
  console.log(`Loaded ${products.length} optimized products to generate JSON files...`);

  let count = 0;

  for (const p of products) {
    const title = p.name;
    const desc = p.description || '';
    const cleanDesc = cleanHtmlText(desc);

    // 1. Determine Line
    let line = 'standard';
    const lowerTitle = title.toLowerCase();
    
    if (lowerTitle.includes('prisma') || lowerTitle.includes('mediana') || lowerTitle.includes('mini')) {
      line = 'prisma';
    } else if (
      lowerTitle.includes('premium') || 
      lowerTitle.includes('gema') || 
      lowerTitle.includes('cuore') || 
      lowerTitle.includes('lux') || 
      lowerTitle.includes('black') || 
      lowerTitle.includes('esencial duo xl')
    ) {
      line = 'premium';
    } else if (
      lowerTitle.includes('dispenser') || 
      lowerTitle.includes('canasto') || 
      lowerTitle.includes('colador') || 
      lowerTitle.includes('bandeja') || 
      lowerTitle.includes('sifon') || 
      lowerTitle.includes('sopapa') || 
      lowerTitle.includes('griferia') || 
      lowerTitle.includes('tabla') || 
      lowerTitle.includes('dosificador') || 
      lowerTitle.includes('roller') || 
      lowerTitle.includes('escurridor')
    ) {
      line = 'accesorios';
    } else if (lowerTitle.includes('lavadero') || lowerTitle.includes('lava') || lowerTitle.includes('pileta')) {
      line = 'lavadero';
    }

    // 2. Determine Category
    let category = 'bacha-simple';
    if (line === 'accesorios') {
      category = 'accesorio';
    } else if (lowerTitle.includes('mesada') && lowerTitle.includes('ciega')) {
      category = 'mesada-ciega';
    } else if (lowerTitle.includes('mesada') && (lowerTitle.includes('doble') || lowerTitle.includes('duo'))) {
      category = 'mesada-integrada'; // In Masecor, mesadas with integrated double sinks are mesada-integrada
    } else if (lowerTitle.includes('mesada')) {
      category = 'mesada-integrada';
    } else if (lowerTitle.includes('doble') || lowerTitle.includes('duo')) {
      category = 'bacha-doble';
    } else if (lowerTitle.includes('lavadero') || lowerTitle.includes('pileta')) {
      category = 'pileta-lavadero';
    }

    // 3. Parse Dimensions (Medidas)
    let dimensions = undefined;
    
    // Look for pattern like 80x50x22 or 80X50X22 or 80 * 50 * 22
    const dim3Regex = /(\d+)\s*[xX*]\s*(\d+)\s*[xX*]\s*(\d+)/i;
    const dim3Match = title.match(dim3Regex) || desc.match(dim3Regex);
    
    if (dim3Match) {
      const val1 = parseInt(dim3Match[1], 10);
      const val2 = parseInt(dim3Match[2], 10);
      const val3 = parseInt(dim3Match[3], 10);
      
      // If values look like cm (e.g. 80x50x22), convert to mm (800x500x220)
      const multiplier = val1 < 100 ? 10 : 1;
      dimensions = {
        width: val1 * multiplier,
        depth: val2 * multiplier,
        height: val3 * multiplier,
        unit: 'mm'
      };
    } else {
      // Look for single size like 120cm or 80 cm
      const widthRegex = /(\d+)\s*cm/i;
      const widthMatch = title.match(widthRegex);
      if (widthMatch) {
        dimensions = {
          width: parseInt(widthMatch[1], 10) * 10,
          unit: 'mm'
        };
      }
    }

    // 4. Parse Thickness (Espesor)
    let thickness = '0.6mm'; // Default standard
    const thickRegex = /(0[\.,]\d+)\s*mm/i;
    const thickMatch = desc.match(thickRegex) || title.match(thickRegex);
    if (thickMatch) {
      thickness = thickMatch[1].replace(',', '.') + 'mm';
    }

    // 5. Extract Features (Características)
    const features = [];
    const liRegex = /<li>([\s\S]*?)<\/li>/gi;
    let liMatch;
    while ((liMatch = liRegex.exec(desc)) !== null) {
      const cleanLi = cleanHtmlText(liMatch[1]);
      if (cleanLi && cleanLi.length < 100) {
        features.push(cleanLi);
      }
    }
    
    // If no features found in list items, add some default ones
    if (features.length === 0) {
      features.push('Acero Inoxidable AISI 304');
      features.push('Alta durabilidad y resistencia');
      if (line === 'premium') {
        features.push('Terminación satinada premium');
      }
    }

    // 6. Determine Installation Type
    let installationType = 'bajo-mesada';
    if (lowerTitle.includes('empotrar') || cleanDesc.toLowerCase().includes('empotrar')) {
      installationType = 'empotrar';
    } else if (lowerTitle.includes('colgar') || cleanDesc.toLowerCase().includes('colgar')) {
      installationType = 'colgar';
    } else if (lowerTitle.includes('mesada')) {
      installationType = 'sobre-mueble';
    }

    // 7. Short Description
    let shortDescription = cleanDesc;
    if (shortDescription.length > 150) {
      shortDescription = shortDescription.substring(0, 147) + '...';
    }
    if (!shortDescription) {
      shortDescription = `Producto de acero inoxidable de alta calidad y precisión.`;
    }

    // 8. Images mapping
    const mainImage = p.images[0] || '/images/products/placeholder.webp';
    const gallery = p.images.slice(1);

    const productJson = {
      name: title,
      line: line,
      category: category,
      shortDescription: shortDescription,
      description: cleanDesc,
      dimensions: dimensions,
      material: 'Acero Inoxidable AISI 304',
      thickness: thickness,
      features: features,
      installationType: installationType,
      image: mainImage,
      gallery: gallery,
      sortOrder: 100,
      featured: false,
      available: true
    };

    // Save JSON file
    const fileSlug = sanitizeFilename(title);
    const outputFilePath = path.join(outputJsonDir, `${fileSlug}.json`);
    fs.writeFileSync(outputFilePath, JSON.stringify(productJson, null, 2));
    count++;
  }

  console.log(`\n🎉 Success! Generated ${count} JSON files in: ${outputJsonDir}`);
}

main().catch(console.error);
