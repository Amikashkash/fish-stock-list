/**
 * Script to create a test Excel file from CSV data
 * Run with: node scripts/create-test-excel.js
 */

import XLSX from 'xlsx';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Sample shipment data matching the expected format
const testData = [
  {
    'Code': 'ANG-001',
    'Cart': 1,
    'Scientific Name': 'Pterophyllum scalare',
    'Common Name': 'מלאך',
    'Size': '5-6cm',
    'Bags': 10,
    'Qty/Bag': 10,
    'Total': 100,
    'Packing Ratio': '1:3',
    'Part of Cart': 40,
    'Price': 12.50,
    'Currency': 'ILS'
  },
  {
    'Code': 'NEON-005',
    'Cart': 1,
    'Scientific Name': 'Paracheirodon innesi',
    'Common Name': 'נאון',
    'Size': '2cm',
    'Bags': 5,
    'Qty/Bag': 20,
    'Total': 100,
    'Packing Ratio': '1:2',
    'Part of Cart': 40,
    'Price': 2.50,
    'Currency': 'ILS'
  },
  {
    'Code': 'GOLD-010',
    'Cart': 1,
    'Scientific Name': 'Carassius auratus',
    'Common Name': 'דג זהב',
    'Size': '8-10cm',
    'Bags': 5,
    'Qty/Bag': 10,
    'Total': 50,
    'Packing Ratio': '1:3',
    'Part of Cart': 20,
    'Price': 8.00,
    'Currency': 'ILS'
  },
  {
    'Code': '', // Missing code - should be auto-generated
    'Cart': 2,
    'Scientific Name': 'Betta splendens',
    'Common Name': 'לוחם',
    'Size': '5cm',
    'Bags': 10,
    'Qty/Bag': 10,
    'Total': 100,
    'Packing Ratio': '1:2',
    'Part of Cart': 50,
    'Price': 15.00,
    'Currency': 'ILS'
  },
  {
    'Code': 'TETRA-020',
    'Cart': 2,
    'Scientific Name': 'Hyphessobrycon eques',
    'Common Name': 'טטרה אדומה',
    'Size': '3cm',
    'Bags': 10,
    'Qty/Bag': 15,
    'Total': 150,
    'Packing Ratio': '1:2',
    'Part of Cart': 50,
    'Price': 3.50,
    'Currency': 'ILS'
  }
];

// Create a new workbook and worksheet
const wb = XLSX.utils.book_new();
const ws = XLSX.utils.json_to_sheet(testData);

// Add the worksheet to the workbook
XLSX.utils.book_append_sheet(wb, ws, 'Shipment Data');

// Create templates directory if it doesn't exist
const templatesDir = path.join(__dirname, '..', 'templates');
if (!fs.existsSync(templatesDir)) {
  fs.mkdirSync(templatesDir, { recursive: true });
}

// Write the Excel file
const outputPath = path.join(templatesDir, 'test-shipment-data.xlsx');
XLSX.writeFile(wb, outputPath);

console.log('✅ Test Excel file created successfully!');
console.log(`📁 Location: ${outputPath}`);
console.log('\nTest data summary:');
console.log('- 5 fish types');
console.log('- 2 carts');
console.log('- 1 missing code (Betta splendens) - will be auto-generated');
console.log('- Total: 500 fish');
console.log('- Total cost: 2,785 ILS');
