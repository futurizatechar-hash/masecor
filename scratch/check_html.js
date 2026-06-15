async function main() {
  const res = await fetch('http://localhost:4321/productos');
  const text = await res.text();
  
  let lastIndex = text.indexOf('</style>'); // Start searching after style tags
  for (let i = 0; i < 5; i++) {
    const h3Index = text.indexOf('<h3', lastIndex);
    if (h3Index === -1) break;
    console.log(`--- H3 ${i + 1} HTML ---`);
    console.log(text.substring(h3Index, h3Index + 250));
    lastIndex = h3Index + 20;
  }
}

main().catch(console.error);
