// Minimal PNG generator for placeholder icon
const fs = require('fs');
const path = require('path');

// This is a minimal 32x32 blue square PNG (base64 encoded)
const minimalPNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAEklEQVR42mNgGAWjYBSMAggAAAQQAAF/TXiOAAAAAElFTkSuQmCC',
  'base64'
);

// Create a larger 512x512 icon for generation
const canvas = `
<svg width="512" height="512" xmlns="http://www.w3.org/2000/svg">
  <rect width="512" height="512" fill="#3498db"/>
  <text x="256" y="280" font-size="200" text-anchor="middle" fill="white" font-family="Arial">T</text>
</svg>
`;

const iconPath = path.join(__dirname, 'app-icon.svg');
fs.writeFileSync(iconPath, canvas);

console.log('Generated app-icon.svg - Now run: npm run tauri icon app-icon.svg');
