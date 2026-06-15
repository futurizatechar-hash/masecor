import fs from 'fs';

async function main() {
  const html = fs.readFileSync('scratch/product_detail_raw.html', 'utf8');
  
  // Find where LS.variants starts
  const startIdx = html.indexOf('LS.variants = ');
  if (startIdx !== -1) {
    const fromStart = html.slice(startIdx + 'LS.variants = '.length);
    // Find the ending bracket of the array
    let bracketCount = 0;
    let endIdx = -1;
    for (let i = 0; i < fromStart.length; i++) {
      if (fromStart[i] === '[') {
        bracketCount++;
      } else if (fromStart[i] === ']') {
        bracketCount--;
        if (bracketCount === 0) {
          endIdx = i + 1;
          break;
        }
      }
    }
    
    if (endIdx !== -1) {
      const jsonStr = fromStart.slice(0, endIdx);
      const variants = JSON.parse(jsonStr);
      console.log('Found LS.variants!');
      console.log('Total variants:', variants.length);
      console.log('First variant:', JSON.stringify(variants[0], null, 2));
      
      const option0Values = [...new Set(variants.map(v => v.option0))].filter(Boolean);
      const option1Values = [...new Set(variants.map(v => v.option1))].filter(Boolean);
      const option2Values = [...new Set(variants.map(v => v.option2))].filter(Boolean);
      console.log('Option0 unique values:', option0Values);
      console.log('Option1 unique values:', option1Values);
      console.log('Option2 unique values:', option2Values);
    } else {
      console.log('End bracket of LS.variants not found.');
    }
  } else {
    console.log('LS.variants = not found.');
  }
}

main().catch(console.error);
