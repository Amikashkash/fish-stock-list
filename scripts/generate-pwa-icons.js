/**
 * Generate simple PWA icons
 * This creates basic colored PNG icons for PWA
 * For better icons, use a tool like https://realfavicongenerator.net/
 */

const fs = require('fs');
const path = require('path');

// Simple SVG to use as base
const svgIcon = `
<svg width="512" height="512" xmlns="http://www.w3.org/2000/svg">
  <rect width="512" height="512" fill="#667eea" rx="128"/>
  <g transform="translate(100, 180)">
    <ellipse cx="150" cy="80" rx="120" ry="60" fill="#ffffff"/>
    <path d="M 30 80 L 10 50 L 10 110 Z" fill="#ffffff"/>
    <circle cx="220" cy="70" r="12" fill="#667eea"/>
    <path d="M 150 40 L 130 20 L 140 35 Z" fill="#ffffff" opacity="0.8"/>
    <path d="M 150 120 L 130 140 L 140 125 Z" fill="#ffffff" opacity="0.8"/>
  </g>
  <text x="256" y="380" font-family="Arial, sans-serif" font-size="48" font-weight="bold" fill="#ffffff" text-anchor="middle">
    Fish Farm
  </text>
</svg>
`.trim();

// Save the SVG
const publicDir = path.join(__dirname, '../public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

fs.writeFileSync(path.join(publicDir, 'icon.svg'), svgIcon);

console.log('✅ SVG icon created at public/icon.svg');
console.log('');
console.log('⚠️  For PNG icons, please use one of these methods:');
console.log('');
console.log('1. Online converter:');
console.log('   - Visit https://realfavicongenerator.net/');
console.log('   - Upload public/icon.svg');
console.log('   - Generate and download icons');
console.log('   - Place pwa-192x192.png and pwa-512x512.png in public/');
console.log('');
console.log('2. Use sharp (Node.js):');
console.log('   npm install sharp');
console.log('   Then use sharp to convert SVG to PNG');
console.log('');
console.log('3. Use any image editor to convert public/icon.svg to PNG');
console.log('');
