import fs from 'fs';
import path from 'path';

const htmlPath = 'C:\\Users\\angel\\OneDrive\\futuriza\\proyectos\\masecor\\inox-ecomerce\\inoxar.html';
const html = fs.readFileSync(htmlPath, 'utf8');

// Find all script blocks of type application/ld+json
const ldJsonRegex = /<script\s+type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi;
let match;
const products = [];

while ((match = ldJsonRegex.exec(html)) !== null) {
  const content = match[1].trim();
  try {
    const data = JSON.parse(content);
    if (data['@type'] === 'Product') {
      const name = data.name;
      const url = data.mainEntityOfPage?.['@id'] || data.url;
      const offers = data.offers;
      let price = null;
      if (offers) {
        if (Array.isArray(offers)) {
          price = offers[0]?.price;
        } else {
          price = offers.price;
        }
      }
      products.push({ name, url, price });
    }
  } catch (e) {
    // Some might fail if they are not valid JSON or if they are templated, but let's see
  }
}

console.log(`Extracted ${products.length} products with prices from JSON-LD:`);
console.log(JSON.stringify(products, null, 2));
