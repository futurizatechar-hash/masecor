import fs from 'fs';
import path from 'path';

function main() {
  const dir = 'public/images/products';
  
  // Let's check the size of the known logo image: bacha-cocina-standar-m20-bacha-profunda-acero-mate-4.webp
  const targetFile = 'bacha-cocina-standar-m20-bacha-profunda-acero-mate-4.webp';
  const targetPath = path.join(dir, targetFile);
  
  if (!fs.existsSync(targetPath)) {
    console.error(`Target file ${targetFile} not found!`);
    return;
  }
  
  const stats = fs.statSync(targetPath);
  const targetSize = stats.size;
  console.log(`The target logo file size is: ${targetSize} bytes`);

  // Now find all files in the directory that have exactly this size (or within a 5-byte margin)
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.webp'));
  const matches = [];

  files.forEach(file => {
    const filePath = path.join(dir, file);
    const fileSize = fs.statSync(filePath).size;
    if (Math.abs(fileSize - targetSize) <= 10) { // 10 bytes tolerance
      matches.push({ file, size: fileSize });
    }
  });

  console.log(`Found ${matches.length} matching files:`);
  console.log(JSON.stringify(matches, null, 2));
}

main();
