
const fs = require('fs');
const path = require('path');

function createSVG(width, height, text, color) {
    return `
<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
  <rect width="100%" height="100%" fill="${color}" />
  <text x="50%" y="50%" font-family="serif" font-size="40" fill="white" text-anchor="middle" dy=".3em">${text}</text>
</svg>
    `.trim();
}

const aboutDir = path.join(__dirname, '../public/about');
if (!fs.existsSync(aboutDir)) fs.mkdirSync(aboutDir, { recursive: true });

fs.writeFileSync(path.join(aboutDir, 'workshop.svg'), createSVG(800, 600, 'Hudemas Workshop', '#57534e'));
fs.writeFileSync(path.join(aboutDir, 'hands.svg'), createSVG(800, 600, 'Artistic Craft', '#78716c'));

console.log('Generated SVGs in public/about');
