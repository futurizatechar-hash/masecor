import fs from 'fs';
import path from 'path';

function main() {
  const dir = 'src/content/products';
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.json'));

  const categories = {};
  const lines = {};
  const thicknesses = {};
  const installations = {};
  const widths = {};

  files.forEach(file => {
    const data = JSON.parse(fs.readFileSync(path.join(dir, file), 'utf8'));
    
    categories[data.category] = (categories[data.category] || 0) + 1;
    lines[data.line] = (lines[data.line] || 0) + 1;
    if (data.thickness) {
      thicknesses[data.thickness] = (thicknesses[data.thickness] || 0) + 1;
    }
    if (data.installationType) {
      installations[data.installationType] = (installations[data.installationType] || 0) + 1;
    }
    if (data.dimensions && data.dimensions.width) {
      widths[data.dimensions.width] = (widths[data.dimensions.width] || 0) + 1;
    }
  });

  console.log('Categories:', categories);
  console.log('Lines:', lines);
  console.log('Thicknesses:', thicknesses);
  console.log('Installations:', installations);
  console.log('Widths:', Object.keys(widths).sort((a,b) => Number(a)-Number(b)));
}

main();
