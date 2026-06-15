import fs from 'fs';
import path from 'path';

function normalizeName(name) {
  if (!name) return '';
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Remove accents
    .replace(/[^a-z0-9]/g, "")       // Keep only alphanumeric
    .trim();
}

function normalizeImgUrl(url) {
  if (!url) return '';
  // Get filename from path, e.g. /products/filename-1024-1024.webp -> filename
  const filenameMatch = url.match(/\/products\/([^\-]+)/) || url.match(/\/products\/([^/]+)$/);
  return filenameMatch ? filenameMatch[1].split('.')[0] : url;
}

function decodeHtmlEntities(str) {
  if (!str) return '';
  return str
    .replace(/&iexcl;/g, '¡')
    .replace(/&deg;/g, '°')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .replace(/&ndash;/g, '–')
    .replace(/&mdash;/g, '—')
    .replace(/&ldquo;/g, '“')
    .replace(/&rdquo;/g, '”')
    .replace(/&iquest;/g, '¿')
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
    .replace(/&Ntilde;/g, 'Ñ');
}

function cleanHtmlTags(str) {
  if (!str) return '';
  return str
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<[^>]+>/g, '') // Strip all other tags
    .replace(/\r\n/g, '\n')
    .replace(/\n{2,}/g, '\n\n')
    .trim();
}

function cleanDescription(name, descText, category, line) {
  if (!descText) return getPremiumDescription(category, line);

  let clean = decodeHtmlEntities(descText);
  clean = cleanHtmlTags(clean);

  // Split at common spec/features sections to isolate introduction
  const splitKeywords = [
    /características\s+destacadas/i,
    /características/i,
    /fácil\s+instalación/i,
    /por\s+qué\s+elegir/i,
    /por\s+que\s+elegir/i,
    /especificaciones/i,
    /bacha\s+integrada/i,
    /realizamos\s+perforación/i,
    /realizamos\s+factura/i,
    /factura\s+a\s+y\s+b/i,
    /a\s+diferencia\s+del\s+mármol/i,
    /para\s+mantener\s+su\s+brillo/i,
    /medidas/i,
    /zócalo\s+trasero/i,
    /bandeja\s+para\s+horno/i
  ];

  for (const regex of splitKeywords) {
    const parts = clean.split(regex);
    if (parts.length > 0 && parts[0].trim().length > 30) {
      clean = parts[0].trim();
    }
  }

  // Clean leading headers or duplicate names
  // E.g., if it starts with the product title or variation of it
  const sentences = clean.split(/[.\n]/);
  if (sentences.length > 0) {
    const firstSentence = sentences[0].trim();
    // If the first sentence is mostly uppercase or contains words from the title, remove it
    if (firstSentence.length > 10 && (firstSentence.toUpperCase() === firstSentence || name.toLowerCase().includes(firstSentence.toLowerCase()))) {
      clean = clean.replace(firstSentence, '').trim();
      // Remove any leading punctuation
      clean = clean.replace(/^[.\s\–\-\—\:\,]+/, '').trim();
    }
  }

  // Final trim and check
  if (clean.length < 50) {
    return getPremiumDescription(category, line);
  }

  // Combine scraped clean intro with premium description for professional flow
  const intro = clean.replace(/^[.\s\–\-\—\:\,]+/, '').trim();
  const base = getPremiumDescription(category, line);
  
  // Make sure it doesn't sound redundant. If the scraped intro is long and good, just use it.
  if (intro.length > 150) {
    return intro;
  }
  
  return `${intro} ${base}`;
}

function getPremiumDescription(category, line) {
  const lineLabel = line === 'premium' ? 'Premium' : line === 'prisma' ? 'Prisma' : 'Estándar';
  
  if (category.startsWith('mesada')) {
    return `Mesada de cocina Masecor en acero inoxidable, diseñada bajo exigentes estándares profesionales para ofrecer máxima resistencia, higiene absoluta y un acabado estético inigualable. Su estructura robusta y su refuerzo interno aseguran una durabilidad excepcional en cualquier espacio, aportando un diseño moderno, minimalista e industrial de alta gama.`;
  }
  if (category.startsWith('bacha')) {
    return `Bacha de cocina Masecor en acero inoxidable de calidad superior. Cuenta con un diseño pulido que facilita la limpieza, bordes antiderrame y un volumen óptimo para tareas exigentes, combinando elegancia, durabilidad y máxima funcionalidad para integrarse perfectamente a tu mesada.`;
  }
  if (category === 'pileta-lavadero') {
    return `Pileta para lavadero súper profunda, fabricada en acero inoxidable de gran espesor. Su capacidad de carga excepcional y su alta resistencia al desgaste la convierten en la opción ideal para las tareas domésticas más exigentes en lavaderos modernos.`;
  }
  if (category === 'accesorio') {
    return `Accesorio premium de diseño minimalista y alta practicidad, desarrollado en acero inoxidable para complementar perfectamente tu bacha o mesada, facilitando el escurrido, la preparación y la organización higiénica en tu cocina.`;
  }
  return `Producto fabricado en acero inoxidable AISI 304 de alta gama. Combina durabilidad excepcional, higiene y un acabado estético minimalista diseñado para durar toda la vida.`;
}

function cleanShortDescription(description) {
  // Extract the first sentence or first 120 chars
  const sentences = description.split(/[.\n]/);
  let short = sentences[0].trim();
  if (short.length < 30 && sentences.length > 1) {
    short = short + '. ' + sentences[1].trim();
  }
  if (short.length > 130) {
    short = short.slice(0, 127) + '...';
  } else if (!short.endsWith('.')) {
    short += '.';
  }
  return short;
}

// Clean option labels to standard Spanish words
function cleanOptionName(label) {
  const lbl = label.trim().toUpperCase();
  if (lbl.includes('MEDIDA')) return 'Medida';
  if (lbl.includes('UBICACI') || lbl.includes('ORIENTACI')) return 'Ubicación';
  if (lbl.includes('ZOCALO')) return 'Zócalo';
  if (lbl.includes('COMBO')) return 'Combos';
  return label;
}

// Clean option values (e.g., standardizing text)
function cleanOptionValue(val) {
  if (!val) return '';
  return val.trim().replace(/-+/g, ' ').toUpperCase();
}

async function main() {
  const scratchDir = path.join(process.cwd(), 'scratch');
  const productsDir = path.join(process.cwd(), 'src/content/products');
  
  const rawVariantsPath = path.join(scratchDir, 'inoxar_variants_raw.json');
  const fullProductsPath = path.join(scratchDir, 'inoxar_products_full.json');
  
  if (!fs.existsSync(rawVariantsPath) || !fs.existsSync(fullProductsPath)) {
    console.error('Scraped files not found! Make sure scrape_variants has run.');
    return;
  }
  
  const rawVariantsData = JSON.parse(fs.readFileSync(rawVariantsPath, 'utf8'));
  const fullProductsData = JSON.parse(fs.readFileSync(fullProductsPath, 'utf8'));
  
  const localFiles = fs.readdirSync(productsDir).filter(f => f.endsWith('.json'));
  console.log(`Processing ${localFiles.length} local product files...`);
  
  // Create normalization maps for fast lookup
  const rawVariantsMap = {};
  Object.keys(rawVariantsData).forEach(name => {
    rawVariantsMap[normalizeName(name)] = rawVariantsData[name];
  });
  
  const fullProductsMap = {};
  fullProductsData.forEach(p => {
    fullProductsMap[normalizeName(p.name)] = p;
  });
  
  let processedCount = 0;
  let variantsAddedCount = 0;
  
  for (const filename of localFiles) {
    const filePath = path.join(productsDir, filename);
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    const normLocalName = normalizeName(data.name);
    
    // 1. Clean description
    const fullProduct = fullProductsMap[normLocalName];
    const rawDesc = fullProduct ? fullProduct.description : null;
    const cleanDesc = cleanDescription(data.name, rawDesc, data.category, data.line);
    data.description = cleanDesc;
    data.shortDescription = cleanShortDescription(cleanDesc);
    
    // 2. Process variants if available
    const scrapedVariantsInfo = rawVariantsMap[normLocalName];
    if (scrapedVariantsInfo && scrapedVariantsInfo.variants && scrapedVariantsInfo.variants.length > 0) {
      const { optionLabels, variants: scrapedVariants } = scrapedVariantsInfo;
      
      // Determine actual option headers
      const optionHeaders = {};
      Object.keys(optionLabels).forEach(key => {
        optionHeaders[key] = cleanOptionName(optionLabels[key]);
      });
      
      // If there are options defined (e.g. option0, option1)
      const optionsConfig = [];
      const optionKeys = Object.keys(optionHeaders).sort(); // option0, option1
      
      optionKeys.forEach(optKey => {
        const name = optionHeaders[optKey];
        // Gather unique values for this option
        const values = [...new Set(scrapedVariants.map(v => cleanOptionValue(v[optKey])))].filter(Boolean);
        if (values.length > 0) {
          optionsConfig.push({ name, values });
        }
      });
      
      // Map variants array
      const mappedVariants = scrapedVariants.map(v => {
        const variantOptions = {};
        optionKeys.forEach(optKey => {
          const name = optionHeaders[optKey];
          const val = cleanOptionValue(v[optKey]);
          if (name && val) {
            variantOptions[name] = val;
          }
        });
        
        // Find local image path matching remote image_url
        let localImage = undefined;
        if (v.image_url && fullProduct && fullProduct.images) {
          const normRemoteUrl = normalizeImgUrl(v.image_url);
          const originalImagesNorm = fullProduct.images.map(normalizeImgUrl);
          const idx = originalImagesNorm.indexOf(normRemoteUrl);
          
          if (idx === 0) {
            localImage = data.image;
          } else if (idx > 0 && data.gallery && data.gallery[idx - 1]) {
            localImage = data.gallery[idx - 1];
          }
        }
        
        return {
          id: v.id,
          options: variantOptions,
          available: v.available,
          image: localImage
        };
      });
      
      // Only attach if options and variants are valid
      if (optionsConfig.length > 0 && mappedVariants.length > 0) {
        data.options = optionsConfig;
        data.variants = mappedVariants;
        variantsAddedCount++;
      }
    } else {
      // Remove any leftover options/variants from previous runs if any
      delete data.options;
      delete data.variants;
    }
    
    // Write back clean JSON
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    processedCount++;
  }
  
  console.log(`\n🎉 Processed and cleaned descriptions for ${processedCount} products.`);
  console.log(`Merged options and variants for ${variantsAddedCount} products.`);
}

main().catch(console.error);
