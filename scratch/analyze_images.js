import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

function normalizeName(name) {
  if (!name) return '';
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "")
    .trim();
}

async function main() {
  const productsDir = 'src/content/products';
  const imagesDir = 'public/images/products';

  if (!fs.existsSync(productsDir)) {
    console.error(`Directory not found: ${productsDir}`);
    return;
  }

  const jsonFiles = fs.readdirSync(productsDir).filter(f => f.endsWith('.json'));
  console.log(`Analyzing images for ${jsonFiles.length} products...\n`);

  const reports = [];

  for (const filename of jsonFiles) {
    const filePath = path.join(productsDir, filename);
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    
    // Find all files on disk matching the product slug base name
    const slug = filename.replace('.json', '');
    const prefix = slug + '-';
    
    const filesOnDisk = fs.readdirSync(imagesDir)
      .filter(f => f.startsWith(prefix) && f.endsWith('.webp'))
      .map(f => {
        const numPart = f.substring(prefix.length).replace('.webp', '');
        return {
          filename: f,
          index: parseInt(numPart, 10),
          path: `/images/products/${f}`,
          fullPath: path.join(imagesDir, f)
        };
      })
      .sort((a, b) => a.index - b.index);

    const imagesInfo = [];
    for (const img of filesOnDisk) {
      const stats = fs.statSync(img.fullPath);
      let entropy = 999;
      let width = 0;
      let height = 0;
      try {
        const metadata = await sharp(img.fullPath).metadata();
        const shStats = await sharp(img.fullPath).stats();
        entropy = shStats.entropy;
        width = metadata.width;
        height = metadata.height;
      } catch (err) {
        // error reading image stats
      }

      imagesInfo.push({
        filename: img.filename,
        index: img.index,
        path: img.path,
        sizeKB: parseFloat((stats.size / 1024).toFixed(1)),
        entropy: parseFloat(entropy.toFixed(3)),
        width,
        height
      });
    }

    reports.push({
      product: filename,
      name: data.name,
      category: data.category,
      currentBlueprint: data.blueprint || null,
      currentGallery: data.gallery || [],
      currentImage: data.image || null,
      imagesOnDisk: imagesInfo
    });
  }

  // Save the report to scratch for easy viewing
  fs.writeFileSync('scratch/images_analysis_report.json', JSON.stringify(reports, null, 2), 'utf8');
  console.log(`Saved analysis report to scratch/images_analysis_report.json. Total products: ${reports.length}`);

  // Print a summary of items where the current blueprint has high entropy or large size,
  // or items where another image has much lower entropy.
  console.log('\n--- POTENTIAL PROBLEMS (Blueprint has high entropy/size) ---');
  for (const rep of reports) {
    if (rep.currentBlueprint) {
      const bpInfo = rep.imagesOnDisk.find(img => img.path === rep.currentBlueprint);
      if (bpInfo) {
        // Blueprint should be low size (usually < 20KB) and low entropy (usually < 2.0)
        const isSuspicious = bpInfo.sizeKB > 22 || bpInfo.entropy > 2.0;
        if (isSuspicious) {
          console.log(`Product: ${rep.name} (${rep.product})`);
          console.log(`  Current Blueprint: ${rep.currentBlueprint} (Size: ${bpInfo.sizeKB}KB, Entropy: ${bpInfo.entropy})`);
          console.log(`  All images on disk:`);
          rep.imagesOnDisk.forEach(img => {
            console.log(`    - ${img.filename} (Size: ${img.sizeKB}KB, Entropy: ${img.entropy}, Dim: ${img.width}x${img.height})`);
          });
        }
      } else {
        console.log(`Product: ${rep.name} (${rep.product}) - Blueprint path does not exist on disk: ${rep.currentBlueprint}`);
      }
    }
  }
}

main().catch(console.error);
