import fs from 'fs';

const htmlPath = 'C:\\Users\\angel\\OneDrive\\futuriza\\proyectos\\masecor\\inox-ecomerce\\inoxar.html';
const html = fs.readFileSync(htmlPath, 'utf8');

const ldJsonRegex = /<script\s+type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi;
let match;
while ((match = ldJsonRegex.exec(html)) !== null) {
  const content = match[1].trim();
  try {
    const data = JSON.parse(content);
    if (data['@type'] === 'Product') {
      console.log('--- PRODUCT ---');
      console.log(JSON.stringify(data, null, 2));
    }
  } catch (e) {
  }
}
