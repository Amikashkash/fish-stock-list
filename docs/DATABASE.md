# Firestore Database Schema

## Overview

This document details the complete Firestore database structure for the Fish Farm Management System.

**Key Principles:**
- Multi-tenant architecture (multiple farms per database)
- Real-time data sync
- Role-based access control
- Historical data tracking
- Optimized for mobile-first queries

---

## Collections Structure

```
Firestore Root
├── users/
├── farms/
│   ├── {farmId}/
│   │   ├── aquariums/
│   │   ├── fishSpecies/
│   │   ├── fishInstances/
│   │   ├── shipments/
│   │   ├── dailyChecks/
│   │   ├── treatmentAlerts/
│   │   ├── mortalityEvents/
│   │   ├── scheduledChecks/
│   │   ├── tasks/
│   │   └── members/
│   └── ...
└── globalTreatments/
```

---

## 1. Users Collection

**Path:** `/users/{userId}`

```typescript
interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;

  // Farms user belongs to
  farms: string[];  // Array of farmIds
  currentFarmId?: string;  // Active farm

  // Role in each farm (stored in farm/members subcollection)

  // Metadata
  createdAt: Timestamp;
  lastLogin?: Timestamp;

  // Preferences
  preferences: {
    language: 'he' | 'en';
    theme: 'light' | 'dark';
    notifications: boolean;
  };
}
```

**Example:**
```json
{
  "uid": "user123",
  "email": "owner@fishfarm.com",
  "displayName": "John Doe",
  "farms": ["farm001", "farm002"],
  "currentFarmId": "farm001",
  "createdAt": "2024-01-15T10:00:00Z",
  "preferences": {
    "language": "he",
    "theme": "light",
    "notifications": true
  }
}
```

---

## 2. Farms Collection

**Path:** `/farms/{farmId}`

```typescript
interface Farm {
  farmId: string;
  name: string;
  ownerId: string;  // User who created the farm

  // Settings
  settings: {
    currency: 'ILS' | 'USD' | 'EUR';
    timezone: string;
    location?: string;

    // Check settings
    enforceDailyChecks: boolean;
    enforceFirstWeek: boolean;  // Enforce daily checks in reception phase
    mortalityAlertThreshold: number;  // Default: 0.40 (40%)

    // Growth tracking
    defaultGrowthCheckInterval: number;  // Days, default: 30
  };

  // Member IDs (for quick access control)
  memberIds: string[];  // All users with access

  // Metadata
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

---

## 3. Farm Members Subcollection

**Path:** `/farms/{farmId}/members/{userId}`

```typescript
interface FarmMember {
  userId: string;
  email: string;
  displayName: string;
  role: 'owner' | 'employee' | 'customer';

  // Granular permissions
  permissions: Permission[];

  // Status
  status: 'active' | 'inactive' | 'pending';
  invitedBy?: string;
  joinedAt: Timestamp;
}

type Permission =
  | 'tasks.view' | 'tasks.create' | 'tasks.complete' | 'tasks.delete'
  | 'aquariums.view' | 'aquariums.edit' | 'aquariums.free'
  | 'fish.view' | 'fish.move' | 'fish.edit'
  | 'prices.edit'
  | 'mortality.report'
  | 'shipments.view' | 'shipments.process' | 'shipments.edit'
  | 'growth.track' | 'growth.measure'
  | 'treatments.apply' | 'treatments.view';
```

---

## 4. Fish Species (Master Data)

**Path:** `/farms/{farmId}/fishSpecies/{speciesId}`

```typescript
interface FishSpecies {
  speciesId: string;
  commonName: string;
  scientificName?: string;
  category?: string;  // "Cichlid", "Catfish", "Tetra", etc.

  // Images
  imageUrl?: string;
  thumbnailUrl?: string;

  // SKU Variants (per supplier + size)
  skus: {
    [skuKey: string]: {
      supplierCode: string;  // From supplier (e.g., "01-A-01-041-01")
      internalCode?: string;  // Optional internal code
      supplier: string;
      size: string;
      packingRatio: number;
      packingUnit?: string;  // "1/6", "1/4", etc.
      basePrice: number;
      wholesalePrice: number;
      retailPrice: number;
      lastUpdated: Timestamp;
    };
  };

  // Treatment Knowledge Base
  commonIssues: Array<{
    issue: string;
    symptoms: string[];
    preventiveMeasures: string[];
    treatments: Array<{
      treatment: string;
      successRate: number;  // 0-1
      notes: string;
    }>;
  }>;

  // Metadata
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

**Example:**
```json
{
  "speciesId": "spec001",
  "commonName": "Neon Tetra",
  "scientificName": "Paracheirodon innesi",
  "category": "Tetra",
  "skus": {
    "SG-NEON-SM": {
      "supplierCode": "01-A-11-055-04",
      "supplier": "Singapore Aquatics",
      "size": "2.3-2.4 cm",
      "packingRatio": 0.25,
      "basePrice": 0.15,
      "wholesalePrice": 0.30,
      "retailPrice": 0.50
    }
  },
  "commonIssues": [
    {
      "issue": "White spots (Ich)",
      "symptoms": ["white dots on body", "scratching on objects"],
      "preventiveMeasures": ["Maintain stable temperature", "Quarantine new fish"],
      "treatments": [
        {
          "treatment": "Raise temp to 28°C + aquarium salt",
          "successRate": 0.85,
          "notes": "Usually resolves in 5-7 days"
        }
      ]
    }
  ]
}
```

---

## 5. Shipments Collection

**Path:** `/farms/{farmId}/shipments/{shipmentId}`

```typescript
interface Shipment {
  shipmentId: string;
  shipmentNumber: string;  // User-defined or auto
  supplier: string;
  marking?: string;  // "FM-B", etc.

  // Dates
  arrivalDate: Timestamp;
  doaReportDate?: Timestamp;

  // Status
  status: 'pending' | 'arrived' | 'doa-reported' | 'in-reception' | 'completed';

  // Items from invoice
  items: Array<{
    // Identification
    code: string;  // Supplier code or MISSING-xxx
    codeStatus: 'valid' | 'missing';
    cart: string;  // 14a, 14b, etc.
    scientificName: string;
    commonName: string;
    size: string;

    // Quantities
    bags: number;
    qtyPerBag: number;
    totalQuantity: number;

    // Packing
    packingRatio: number;
    partOfCart?: string;  // "1/6", "1/4", etc.

    // Pricing
    pricing: {
      invoicePrice: number;
      currency: 'ILS' | 'USD' | 'EUR';
      actualCostPerFish: number;  // After shipping, tax, fees
      actualTotalCost: number;
      priceNotes?: string;
    };

    // Link to created fish instance (after import)
    fishInstanceId?: string;
    speciesId?: string;  // Matched species
  }>;

  // Import metadata
  importMethod: 'excel' | 'manual';
  excelFileName?: string;
  importedBy: string;  // userId
  importedAt: Timestamp;

  // Edit history
  editHistory: Array<{
    editedAt: Timestamp;
    editedBy: string;
    field: string;
    oldValue: any;
    newValue: any;
    reason?: string;
  }>;

  // Totals
  totalItems: number;
  totalFish: number;
  totalCost: number;
}
```

---

## 6. Fish Instances Collection

**Path:** `/farms/{farmId}/fishInstances/{instanceId}`

```typescript
interface FishInstance {
  instanceId: string;
  speciesId: string;
  shipmentId: string;

  // Identification
  code: string;  // Supplier code
  codeStatus: 'valid' | 'missing';
  batchNumber: string;  // Auto-generated or from shipment

  // Basic info
  commonName: string;
  scientificName?: string;
  size: string;
  supplier: string;

  // Lifecycle
  phase: 'reception' | 'growth' | 'sale-ready';
  lifecycle: 'short-term' | 'growth' | 'sold' | 'deceased';
  purposeInFarm: 'quick-sale' | 'grow-to-size';

  // Quantities
  initialQuantity: number;
  currentQuantity: number;
  soldQuantity: number;

  // Location
  currentAquariumId?: string;
  status: 'in-shipment' | 'in-reception' | 'in-aquarium' | 'sold' | 'depleted';

  // Cost tracking
  costs: {
    invoiceCostPerFish: number;
    invoiceTotalCost: number;
    arrivalCostPerFish: number;  // After DOA
    currentCostPerFish: number;   // After all mortality
    profitableAtWholesale: boolean;
    profitableAtRetail: boolean;
  };

  // Mortality
  mortality: {
    reception: {
      doa: number;
      deaths: number;
      total: number;
    };
    postReception: {
      deaths: number;
    };
    totalMortality: number;
    mortalityRate: number;  // 0-1
  };

  // Alerts
  alerts: {
    mortalityThresholdReached: boolean;
    managerNotified: boolean;
    notifiedAt?: Timestamp;
    managerDecision?: {
      action: 'continue' | 'sell-urgent' | 'discard' | 'special-treatment';
      notes: string;
      decidedAt: Timestamp;
    };
  };

  // Reception tracking
  receptionTracking: {
    startDate: Timestamp;
    endDate?: Timestamp;
    dailyChecksCompleted: number;
    issuesFound: string[];
  };

  // Growth tracking (if lifecycle = 'growth')
  growthTracking?: {
    startDate: Timestamp;
    targetSize: string;

    sizeHistory: Array<{
      date: Timestamp;
      size: string;
      measuredBy: string;
      method: 'visual' | 'measured' | 'estimated';
      notes?: string;
      photoUrl?: string;
    }>;

    growthRate: {
      averageGrowthPerMonth: number;  // cm/month
      estimatedDaysToTarget?: number;
    };

    nextSizeCheck: Timestamp;
  };

  // Health & treatment history
  healthHistory: Array<{
    date: Timestamp;
    condition: 'excellent' | 'good' | 'fair' | 'concerning' | 'critical';
    symptoms?: string[];
    notes: string;
  }>;

  allTreatments: Array<{
    treatmentId: string;
    date: Timestamp;
    issue: string;
    treatment: string;
    success: boolean;
    daysToRecovery?: number;
    notes: string;
  }>;

  // Movement history
  movements: Array<{
    date: Timestamp;
    fromAquarium?: string;
    toAquarium?: string;
    quantity: number;
    type: 'arrival' | 'transfer' | 'split' | 'sale';
    notes?: string;
  }>;

  // Metadata
  createdAt: Timestamp;
  updatedAt: Timestamp;
  createdBy: string;
}
```

---

## 7. Aquariums Collection

**Path:** `/farms/{farmId}/aquariums/{aquariumId}`

```typescript
interface Aquarium {
  aquariumId: string;
  aquariumNumber: string;  // User-defined (e.g., "A-01", "14a")

  // Physical properties
  shelf: 'bottom' | 'middle' | 'top';
  volume: number;  // Liters
  location: string;  // Area in farm
  room: 'reception' | 'main' | 'quarantine' | 'display';

  // Status
  status: 'empty' | 'occupied' | 'in-transfer' | 'maintenance';

  // Current fish (can have multiple species/batches)
  fishInstances: Array<{
    instanceId: string;
    quantity: number;
    dateAdded: Timestamp;
  }>;

  // Stats
  totalFish: number;  // Sum of all instances
  occupancyRate: number;  // Based on volume and packing ratios

  // Maintenance
  lastCleaned?: Timestamp;
  lastWaterChange?: Timestamp;

  // Equipment
  equipment?: {
    heater: boolean;
    filter: boolean;
    aerator: boolean;
  };

  notes?: string;

  // Metadata
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

---

## 8. Daily Checks Collection

**Path:** `/farms/{farmId}/dailyChecks/{checkId}`

```typescript
interface DailyCheck {
  checkId: string;
  date: Timestamp;
  phase: 'reception' | 'main-farm';

  // Who checked
  morningCheckBy?: string;  // Employee
  treatmentCheckBy?: string;  // Owner/manager

  // Observations
  observations: Array<{
    aquariumId: string;
    fishInstanceId?: string;

    // Mortality
    mortalityCount?: number;

    // Condition
    condition?: 'healthy' | 'concerning' | 'critical';
    symptoms?: string[];

    // From previous day
    previousDayAssessment?: string;

    notes: string;
  }>;

  // Treatments applied
  treatmentsApplied: Array<{
    fishInstanceId: string;
    treatment: string;
    reason: string;
    appliedBy: string;
  }>;

  // Completion
  status: 'partial' | 'completed';
  completedAt?: Timestamp;

  notes?: string;
}
```

---

## 9. Mortality Events Collection

**Path:** `/farms/{farmId}/mortalityEvents/{eventId}`

```typescript
interface MortalityEvent {
  eventId: string;
  fishInstanceId: string;

  // Type
  phase: 'reception' | 'post-reception';
  type: 'doa' | 'death';

  // Details
  quantity: number;
  date: Timestamp;
  reportedBy: string;

  // Cause (if known)
  cause?: string;
  treatment?: string;  // What treatment was applied before death

  // Location
  aquariumId?: string;

  // Impact on metrics
  affectsSupplierMetrics: boolean;  // true for reception, false for post

  notes?: string;
}
```

---

## 10. Treatment Alerts Collection

**Path:** `/farms/{farmId}/treatmentAlerts/{alertId}`

```typescript
interface TreatmentAlert {
  alertId: string;
  fishInstanceId: string;

  // Trigger
  triggerType: 'on-arrival' | 'daily-check' | 'symptom-detected' | 'proactive';
  triggerDate: Timestamp;

  // Recommendation
  recommendedAction: string;
  reasoning: string;  // "This species had 30% mortality from white spots last time"
  priority: 'high' | 'medium' | 'low';

  // Historical data
  basedOnHistory: {
    previousCases: number;
    successRate: number;
    commonTreatment: string;
  };

  // Status
  status: 'pending' | 'applied' | 'dismissed';
  appliedAt?: Timestamp;
  outcome?: string;
  dismissedReason?: string;
}
```

---

## 11. Scheduled Checks Collection

**Path:** `/farms/{farmId}/scheduledChecks/{checkId}`

```typescript
interface ScheduledCheck {
  checkId: string;
  type: 'daily-reception' | 'monthly-growth' | 'health';

  // Target
  fishInstanceId?: string;
  aquariumId?: string;

  // Scheduling
  dueDate: Timestamp;
  frequency: 'daily' | 'weekly' | 'monthly';

  // Status
  status: 'pending' | 'completed' | 'overdue' | 'skipped';
  priority: 'high' | 'medium' | 'low';

  // Enforcement
  canSkip: boolean;  // false for reception first week

  // If completed
  completedAt?: Timestamp;
  completedBy?: string;
  results?: any;

  // If skipped
  skippedAt?: Timestamp;
  skippedBy?: string;
  skipReason?: string;
  skipCostAnalysis?: {
    mortalityDuringSkip: number;
    estimatedCost: number;
    issuesFound: string[];
  };
}
```

---

## 12. Tasks Collection

**Path:** `/farms/{farmId}/tasks/{taskId}`

```typescript
interface Task {
  taskId: string;
  title: string;
  description?: string;

  // Assignment
  assignedTo?: string;  // userId
  createdBy: string;

  // Status
  status: 'pending' | 'in-progress' | 'completed' | 'cancelled';
  priority: 'high' | 'medium' | 'low';

  // Dates
  dueDate?: Timestamp;
  createdAt: Timestamp;
  completedAt?: Timestamp;

  // Notes
  notes: Array<{
    noteId: string;
    userId: string;
    userName: string;
    text: string;
    createdAt: Timestamp;
  }>;

  // Related entities
  relatedFishInstanceId?: string;
  relatedAquariumId?: string;

  // Completion
  completedBy?: string;
  completionNotes?: string;
}
```

---

## 13. Global Treatments Collection

**Path:** `/globalTreatments/{treatmentId}`

**Note:** This is a ROOT collection, shared across ALL farms.

```typescript
interface GlobalTreatment {
  treatmentId: string;
  speciesName: string;
  issue: string;
  symptoms: string[];
  treatment: string;

  // Aggregate statistics (anonymized)
  successRate: number;  // 0-1
  timesUsed: number;

  // Contributed by (farm IDs only, no user data)
  contributedBy: string[];  // farmIds

  // Results
  aggregateResults: {
    totalApplications: number;
    successfulApplications: number;
    averageMortalityReduction: number;
    costEffectiveness: 'high' | 'medium' | 'low';
  };

  createdAt: Timestamp;
  lastUpdated: Timestamp;
}
```

---

## Indexes

### Required Composite Indexes

```javascript
// Fish instances by farm and phase
farms/{farmId}/fishInstances
  - phase ASC
  - status ASC

// Fish instances by farm and lifecycle
farms/{farmId}/fishInstances
  - lifecycle ASC
  - currentQuantity DESC

// Scheduled checks by farm and due date
farms/{farmId}/scheduledChecks
  - status ASC
  - dueDate ASC

// Mortality events by farm and date
farms/{farmId}/mortalityEvents
  - date DESC
  - type ASC

// Shipments by farm and arrival date
farms/{farmId}/shipments
  - status ASC
  - arrivalDate DESC
```

---

## Data Size Estimates

**Small farm (2 employees):**
- Fish species: ~100 documents
- Fish instances: ~50 active at a time
- Shipments: ~24 per year
- Daily checks: ~365 per year
- Total: ~1,000 documents/year

**Large farm (10 employees, 100s of customers):**
- Fish species: ~500 documents
- Fish instances: ~500 active
- Shipments: ~100 per year
- Daily checks: ~3,650 per year
- Customers viewing: Read-heavy, no writes
- Total: ~10,000 documents/year

**Firestore limits:** 1 million reads/day on free tier = plenty for this use case.

---

**Last Updated:** December 2024
