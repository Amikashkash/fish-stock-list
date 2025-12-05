/**
 * Migration script to add aquariumRooms and aquariumStatuses to existing farms
 * Run this once to update existing farms with the new settings
 *
 * Usage: node scripts/migrate-farm-settings.js
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, updateDoc, doc } from 'firebase/firestore';

// Your Firebase config (from .env.local)
const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
  measurementId: process.env.VITE_FIREBASE_MEASUREMENT_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const DEFAULT_ROOMS = [
  
  { id: 'main', label: 'ראשי' },
  
];

const DEFAULT_STATUSES = [
  { id: 'empty', label: 'ריק', color: '#95a5a6' },
  { id: 'occupied', label: 'תפוס', color: '#3498db' },
  { id: 'maintenance', label: 'תחזוקה', color: '#f39c12' },
  { id: 'in-transfer', label: 'בהעברה', color: '#9b59b6' },
];

async function migrateFarms() {
  try {
    console.log('🔄 Starting migration...');

    const farmsRef = collection(db, 'farms');
    const snapshot = await getDocs(farmsRef);

    let updated = 0;
    let skipped = 0;

    for (const farmDoc of snapshot.docs) {
      const farm = farmDoc.data();

      // Check if already has the new settings
      if (farm.settings?.aquariumRooms && farm.settings?.aquariumStatuses) {
        console.log(`⏭️  Skipping ${farm.name} (already migrated)`);
        skipped++;
        continue;
      }

      // Update the farm
      const farmRef = doc(db, 'farms', farmDoc.id);
      await updateDoc(farmRef, {
        'settings.aquariumRooms': DEFAULT_ROOMS,
        'settings.aquariumStatuses': DEFAULT_STATUSES,
      });

      console.log(`✅ Updated ${farm.name}`);
      updated++;
    }

    console.log('');
    console.log('✨ Migration complete!');
    console.log(`   Updated: ${updated} farms`);
    console.log(`   Skipped: ${skipped} farms (already migrated)`);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

migrateFarms();
