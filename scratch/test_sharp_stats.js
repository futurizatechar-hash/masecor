import sharp from 'sharp';

async function main() {
  const img1 = 'public/images/products/bacha-cocina-estandar-m30c-acero-inox-430-pileta-bajo-mesada-sop-110mm-1.webp';
  const img2 = 'public/images/products/bacha-cocina-estandar-m30c-acero-inox-430-pileta-bajo-mesada-sop-110mm-2.webp';

  try {
    const stats1 = await sharp(img1).stats();
    const stats2 = await sharp(img2).stats();

    console.log('--- STATS FOR IMAGE 1 (Photo) ---');
    console.log('Channels:', stats1.channels.map(c => ({ mean: c.mean, stdev: c.stdev })));
    console.log('Entropy:', stats1.entropy);

    console.log('\n--- STATS FOR IMAGE 2 (Blueprint) ---');
    console.log('Channels:', stats2.channels.map(c => ({ mean: c.mean, stdev: c.stdev })));
    console.log('Entropy:', stats2.entropy);
  } catch (err) {
    console.error(err);
  }
}

main();
