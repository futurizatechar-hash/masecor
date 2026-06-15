import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

async function getEntropy(filePath) {
  try {
    const stats = await sharp(filePath).stats();
    return stats.entropy;
  } catch (err) {
    return 999;
  }
}

async function main() {
  const productsDir = 'src/content/products';
  const jsonFiles = fs.readdirSync(productsDir).filter(f => f.endsWith('.json'));
  
  console.log('Checking remaining gallery images for drawing/blueprint signatures...');
  let remainingCount = 0;

  for (const filename of jsonFiles) {
    const filePath = path.join(productsDir, filename);
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    
    const gallery = data.gallery || [];
    for (const imgPath of gallery) {
      const localFullPath = path.join('public', imgPath);
      if (!fs.existsSync(localFullPath)) continue;
      
      const entropy = await getEntropy(localFullPath);
      if (entropy < 1.75) {
        console.log(`Product: ${data.name} (${filename})`);
        console.log(`  Remaining low-entropy gallery image: ${imgPath} (Entropy: ${entropy.toFixed(3)})`);
        remainingCount++;
      }
    }
  }

  console.log(`\nFound ${remainingCount} low-entropy images remaining in product galleries.`);
}

main().catch(console.error);
