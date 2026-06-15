import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

async function main() {
  const dir = 'public/images/products';
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.webp'));

  console.log(`Analyzing ${files.length} images...`);

  const results = [];

  for (const file of files) {
    const filePath = path.join(dir, file);
    try {
      const stats = await sharp(filePath).stats();
      results.push({
        file,
        mean: stats.channels[0].mean,
        stdev: stats.channels[0].stdev,
        entropy: stats.entropy
      });
    } catch (err) {
      // Ignore errors
    }
  }

  // Sort by entropy ascending (drawings will be at the top)
  results.sort((a, b) => a.entropy - b.entropy);

  console.log('\nTop 40 lowest entropy images (likely drawings/blueprints):');
  results.slice(0, 40).forEach(r => {
    console.log(`Entropy: ${r.entropy.toFixed(3)} | File: ${r.file}`);
  });
}

main();
