const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const svgPath = path.join(__dirname, '../app/icon.svg');
const outputDir = path.join(__dirname, '../public/icons');

// Ensure output directory exists
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

const sizes = [
  { name: 'icon-192x192.png', size: 192 },
  { name: 'icon-512x512.png', size: 512 },
  { name: 'apple-touch-icon.png', size: 180 },
];

// For maskable icon, we need to add padding (safe zone is inner 80%)
const maskableSizes = [
  { name: 'icon-maskable-512x512.png', size: 512, padding: true },
];

async function generateIcons() {
  const svgBuffer = fs.readFileSync(svgPath);

  // Generate regular icons
  for (const { name, size } of sizes) {
    await sharp(svgBuffer)
      .resize(size, size)
      .png()
      .toFile(path.join(outputDir, name));
    console.log(`Generated ${name}`);
  }

  // Generate maskable icons with padding for safe zone
  for (const { name, size } of maskableSizes) {
    const innerSize = Math.round(size * 0.8);
    const padding = Math.round((size - innerSize) / 2);

    await sharp(svgBuffer)
      .resize(innerSize, innerSize)
      .extend({
        top: padding,
        bottom: padding,
        left: padding,
        right: padding,
        background: '#1a241e'
      })
      .png()
      .toFile(path.join(outputDir, name));
    console.log(`Generated ${name} (maskable with safe zone)`);
  }

  console.log('All icons generated successfully!');
}

generateIcons().catch(console.error);
