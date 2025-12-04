# PWA Icons Required

To complete the PWA setup, you need to add the following icon files to the `public/` directory:

## Required Icons:

1. **pwa-192x192.png** - 192x192 pixels PNG icon
2. **pwa-512x512.png** - 512x512 pixels PNG icon
3. **favicon.ico** (optional) - Browser favicon
4. **apple-touch-icon.png** (optional) - 180x180 pixels for iOS
5. **mask-icon.svg** (optional) - SVG icon for Safari

## How to Create Icons:

You can use online tools to generate PWA icons:

### Option 1: PWA Asset Generator (Recommended)
```bash
npx @vite-pwa/assets-generator --preset minimal public/fish-icon.png
```

### Option 2: Manual Creation
1. Create a 512x512 PNG with your fish farm logo/icon
2. Use https://realfavicongenerator.net/ to generate all sizes
3. Download and place in the `public/` directory

### Option 3: Simple Fish Icon (Placeholder)
For now, you can use a simple fish emoji as a placeholder:
1. Visit https://favicon.io/emoji-favicons/fish/
2. Download the icon pack
3. Extract to the `public/` directory

## Icon Design Guidelines:

- **Theme**: Fish or aquarium related
- **Colors**: Use your brand colors (e.g., #667eea purple/blue)
- **Simple**: Clear and recognizable at small sizes
- **Background**: Solid color or transparent
- **Safe Zone**: Keep important content in the center 80%

## Current Status:

⚠️ **Icons are missing** - The PWA will work but won't have custom icons until you add them.

The app will still function normally, but users won't see a custom icon when installing the app on their devices.
