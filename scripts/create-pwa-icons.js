/**
 * Generate PWA icons using pngjs
 * Creates 192x192 and 512x512 PNG icons for PWA
 */

import { PNG } from 'pngjs';
import { createWriteStream, existsSync, mkdirSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Colors (RGBA)
const BLUE = { r: 33, g: 150, b: 243, a: 255 };
const WHITE = { r: 255, g: 255, b: 255, a: 255 };
const TRANSPARENT = { r: 0, g: 0, b: 0, a: 0 };

function setPixel(png, x, y, color) {
  const idx = (png.width * y + x) << 2;
  png.data[idx] = color.r;
  png.data[idx + 1] = color.g;
  png.data[idx + 2] = color.b;
  png.data[idx + 3] = color.a;
}

function createIcon(size) {
  return new Promise((resolve, reject) => {
    console.log(`Creating ${size}x${size} icon...`);

    const png = new PNG({ width: size, height: size });

    // Fill background with blue
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        setPixel(png, x, y, BLUE);
      }
    }

    // Draw a simple fish shape
    const centerX = size / 2;
    const centerY = size / 2;
    const fishWidth = size * 0.5;
    const fishHeight = size * 0.3;

    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const dx = (x - centerX) / (fishWidth / 2);
        const dy = (y - centerY) / (fishHeight / 2);

        // Main fish body (ellipse)
        if (dx * dx + dy * dy < 1.0) {
          setPixel(png, x, y, WHITE);
        }

        // Tail (triangle)
        const tailX = centerX - fishWidth / 2;
        const tailWidth = fishWidth * 0.3;
        if (x < tailX && x > tailX - tailWidth) {
          const tailProgress = (tailX - x) / tailWidth;
          const tailHeight = fishHeight * (1 - tailProgress);
          if (Math.abs(y - centerY) < tailHeight / 2) {
            setPixel(png, x, y, WHITE);
          }
        }

        // Eye
        const eyeX = centerX + fishWidth * 0.2;
        const eyeY = centerY - fishHeight * 0.15;
        const eyeRadius = size * 0.04;
        const eyeDx = x - eyeX;
        const eyeDy = y - eyeY;
        if (eyeDx * eyeDx + eyeDy * eyeDy < eyeRadius * eyeRadius) {
          setPixel(png, x, y, BLUE);
        }
      }
    }

    // Add rounded corners
    const cornerRadius = size * 0.15;
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        let inCorner = false;
        let cornerCenterX, cornerCenterY;

        if (x < cornerRadius && y < cornerRadius) {
          cornerCenterX = cornerRadius;
          cornerCenterY = cornerRadius;
          inCorner = true;
        } else if (x > size - cornerRadius && y < cornerRadius) {
          cornerCenterX = size - cornerRadius;
          cornerCenterY = cornerRadius;
          inCorner = true;
        } else if (x < cornerRadius && y > size - cornerRadius) {
          cornerCenterX = cornerRadius;
          cornerCenterY = size - cornerRadius;
          inCorner = true;
        } else if (x > size - cornerRadius && y > size - cornerRadius) {
          cornerCenterX = size - cornerRadius;
          cornerCenterY = size - cornerRadius;
          inCorner = true;
        }

        if (inCorner) {
          const dx = x - cornerCenterX;
          const dy = y - cornerCenterY;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance > cornerRadius) {
            setPixel(png, x, y, TRANSPARENT);
          }
        }
      }
    }

    // Save the icon
    const publicDir = join(__dirname, '../public');
    if (!existsSync(publicDir)) {
      mkdirSync(publicDir, { recursive: true });
    }

    const outputPath = join(publicDir, `pwa-${size}x${size}.png`);
    const stream = createWriteStream(outputPath);

    png.pack()
      .pipe(stream)
      .on('finish', () => {
        console.log(`✅ Created ${outputPath}`);
        resolve(outputPath);
      })
      .on('error', (err) => {
        console.error(`❌ Error saving ${outputPath}:`, err);
        reject(err);
      });
  });
}

async function createIcons() {
  console.log('🎨 Generating PWA icons...\n');

  try {
    await createIcon(192);
    await createIcon(512);

    console.log('\n✨ PWA icons generated successfully!');
    console.log('📱 Your app should now be installable as a PWA');
  } catch (error) {
    console.error('\n❌ Failed to generate icons:', error);
    process.exit(1);
  }
}

createIcons();
