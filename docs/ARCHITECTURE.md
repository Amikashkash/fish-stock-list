# Fish Farm Management System - Architecture



## Technology Stack

### Frontend
- **Framework:** React 19
- **Build Tool:** Vite
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **UI Components:** shadcn/ui
- **Routing:** React Router DOM

### Backend
- **Authentication:** Firebase Auth
- **Database:** Cloud Firestore
- **Storage:** Firebase Storage
- **Hosting:** Firebase Hosting

### State Management
- **Global State:** Context API (user, theme)
- **Server State:** React Query (all Firebase data)
- **Local State:** useState (component-specific)
- **Complex State:** Zustand (if needed later)

---

## Why This Stack?

### React + Vite (Not Next.js)
**Decision:** Stay with React + Vite for now

**Reasoning:**
1. **Faster development** - Simpler setup, less concepts
2. **Firebase handles backend** - Don't need Next.js API routes
3. **SEO not critical** - Internal tool first, B2B customers
4. **Client-side rendering sufficient** - Firebase provides real-time data
5. **Easy deployment** - Firebase Hosting, one command

**Future consideration:**
- Can build separate Next.js customer portal later if needed
- Or migrate if become public SaaS product
- For now, avoid over-engineering

### TypeScript
**Essential for this project:**
- Complex data relationships (fish, aquariums, shipments, treatments)
- Multiple user roles and permissions
- Prevents bugs early
- Self-documenting code
- Better IDE support

### Firebase
**Perfect fit because:**
- **Real-time database** - Customers see live inventory
- **Built-in auth** - Email/password + Google
- **Security rules** - Granular permissions
- **Scalable** - Handles growth automatically
- **Offline support** - Works without internet
- **No server management** - Focus on features, not infrastructure

---

## Project Structure

```
fish-stock-list/
├── docs/                      # Documentation
│   ├── ARCHITECTURE.md        # This file
│   ├── DATABASE.md            # Firestore schema
│   ├── FEATURES.md            # Feature list
│   ├── DEVELOPMENT_GUIDE.md   # Dev setup & standards
│   └── USER_FLOWS.md          # User journeys
│
├── templates/                 # Excel templates
│   ├── shipment-template.xlsx
│   └── template-guide.md
│
├── src/
│   ├── components/
│   │   ├── ui/               # shadcn components
│   │   ├── layout/           # Header, Sidebar, Footer
│   │   └── features/         # Feature-specific components
│   │
│   ├── pages/                # Route components
│   │   ├── LoginPage/
│   │   ├── HomePage/
│   │   ├── ShipmentsPage/
│   │   ├── AquariumsPage/
│   │   ├── TasksPage/
│   │   └── GrowthTrackingPage/
│   │
│   ├── lib/
│   │   ├── firebase/         # Firebase config
│   │   └── utils/            # Helper functions
│   │
│   ├── services/             # Business logic
│   │   ├── auth.service.ts
│   │   ├── shipment.service.ts
│   │   ├── fish.service.ts
│   │   ├── aquarium.service.ts
│   │   ├── treatment.service.ts
│   │   └── growth.service.ts
│   │
│   ├── contexts/             # React Context
│   │   ├── AuthContext.tsx
│   │   └── ThemeContext.tsx
│   │
│   ├── hooks/                # Custom hooks
│   │   ├── useAuth.ts
│   │   ├── useFishInstances.ts
│   │   ├── useShipments.ts
│   │   └── useGrowthTracking.ts
│   │
│   ├── types/                # TypeScript types
│   │   ├── models/           # Data models
│   │   │   ├── Fish.ts
│   │   │   ├── Shipment.ts
│   │   │   ├── Aquarium.ts
│   │   │   └── Treatment.ts
│   │   └── api/              # API types
│   │
│   └── constants/            # Constants
│       ├── routes.ts
│       └── firebase.ts
│
├── public/                   # Static assets
├── .env.local               # Environment variables (not committed!)
├── .env.example             # Template for env vars
├── .gitignore
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```

---

## Data Flow

### Authentication Flow
```
User → LoginPage
  ↓
Firebase Auth (email/password or Google)
  ↓
AuthContext (global user state)
  ↓
Protected Routes (based on user role)
  ↓
HomePage / Dashboard
```

### Shipment Import Flow
```
Excel File → Upload
  ↓
Parse & Validate
  ↓
Preview (show user what will be imported)
  ↓
User confirms
  ↓
Create Shipment document in Firestore
  ↓
Create Fish Instance documents
  ↓
Show success / Show shipment details
```

### Daily Check Flow
```
Scheduled Check appears in dashboard
  ↓
Employee: Opens check form
  ↓
Employee: Reports mortality count
  ↓
System: Updates fish quantities
  ↓
System: Checks if 40% threshold reached
  ↓
If yes → Alert manager
  ↓
Manager: Reviews and decides action
  ↓
Later: Owner adds treatment notes
  ↓
System: Records complete check history
```

### Growth Tracking Flow
```
Fish marked as "growth" lifecycle
  ↓
System: Creates monthly measurement schedule
  ↓
Reminder appears when due
  ↓
User: Measures fish size
  ↓
System: Calculates growth rate
  ↓
System: Estimates days to target size
  ↓
Updates dashboard with progress
```

---

## Security Architecture

### Firebase Security Rules
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Users can only read/write their own profile
    match /users/{userId} {
      allow read, write: if request.auth.uid == userId;
    }

    // Farm members can access farm data
    match /farms/{farmId} {
      allow read: if isFarmMember(farmId);
      allow write: if isFarmOwner(farmId) || isFarmEmployee(farmId);

      // Nested collections inherit permissions
      match /{document=**} {
        allow read: if isFarmMember(farmId);
        allow write: if isFarmOwner(farmId) || isFarmEmployee(farmId);
      }
    }
  }

  // Helper functions
  function isFarmMember(farmId) {
    return request.auth != null &&
           request.auth.uid in get(/databases/$(database)/documents/farms/$(farmId)).data.memberIds;
  }

  function isFarmOwner(farmId) {
    return request.auth != null &&
           get(/databases/$(database)/documents/farms/$(farmId)).data.ownerId == request.auth.uid;
  }

  function isFarmEmployee(farmId) {
    return request.auth != null &&
           exists(/databases/$(database)/documents/farms/$(farmId)/members/$(request.auth.uid));
  }
}
```

### Environment Variables
```bash
# .env.local (NEVER commit this!)
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id
```

**Note:** Vite requires `VITE_` prefix for client-side variables.

---

## Deployment

### Firebase Hosting
```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login
firebase login

# Initialize project
firebase init hosting

# Build for production
npm run build

# Deploy
firebase deploy --only hosting
```

### Automatic Deployment (GitHub Actions)
When code is pushed to `main` branch, GitHub Actions automatically:
1. Runs tests (if configured)
2. Builds the app
3. Deploys to Firebase Hosting

---

## Performance Considerations

### Code Splitting
- Lazy load heavy components
- Route-based splitting (automatic with React Router)
- Only load what's needed

### Caching Strategy
- React Query caches server data
- Stale time: 5 minutes for most queries
- Refetch on window focus for critical data
- Optimistic updates for better UX

### Image Optimization
- Use WebP format
- Lazy load images
- Compress before upload
- Use Firebase Storage CDN

### Firestore Query Optimization
- Use indexes for complex queries
- Limit query results (pagination)
- Use composite indexes
- Cache frequently accessed data

---

## Mobile-First Design

### Responsive Breakpoints (Tailwind)
```
sm:  640px  (small phones in landscape)
md:  768px  (tablets)
lg:  1024px (laptops)
xl:  1280px (desktops)
2xl: 1536px (large desktops)
```

### Design Approach
1. Design for mobile (320px width) first
2. Add tablet styles with `md:` prefix
3. Add desktop styles with `lg:` prefix
4. Touch targets minimum 44x44px
5. Font size minimum 16px (prevents zoom on iOS)

---

## Error Handling Strategy

### Levels of Error Handling

1. **Component Level**
   - Try/catch in async functions
   - Show user-friendly error messages
   - Log to console.error

2. **React Error Boundaries**
   - Wrap critical sections
   - Show fallback UI
   - Prevent full app crash

3. **Firebase Errors**
   - Handle auth errors (wrong password, etc.)
   - Handle Firestore errors (permissions, network)
   - Provide retry mechanisms

4. **Global Error Tracking**
   - Firebase Crashlytics (free tier)
   - Or Sentry (5K errors/month free)
   - Track which users affected

---

## Testing Strategy

### Phase 1 (Current)
- TypeScript for type safety
- ESLint for code quality
- Manual testing on real devices

### Phase 2 (Future, if needed)
- Integration tests for critical flows (Playwright)
- Unit tests for complex logic (Vitest)

**Philosophy:** Start lean, add tests when you feel pain (bugs, regressions).

---

## Future Considerations

### When to Consider Next.js
- Marketing as public SaaS product
- Need SEO for landing pages
- Scale to hundreds of farms
- Need server-side logic beyond Firebase

### When to Split Into Multiple Apps
- Customer portal becomes large
- Different teams work on admin vs customer features
- Need different deployment strategies

### When to Add Testing
- Bugs appearing in production
- Fear of changing code
- Critical flows breaking

---

## Key Design Decisions

| Decision | Reasoning |
|----------|-----------|
| React + Vite (not Next.js) | Simpler, faster development; Firebase handles backend |
| TypeScript | Essential for complex data relationships |
| Firebase | Real-time, scalable, no server management |
| Tailwind CSS | Faster styling, consistent design |
| shadcn/ui | Accessible, customizable components |
| React Query | Best for server state management with Firebase |
| Context API | Simple global state (user, theme) |
| Manual pricing | USD invoices need shipping/tax/fees added |
| Growth tracking | Long-term fish need size measurements |
| Treatment history | Learn from past issues, prevent future ones |
| Flexible daily checks | Enforce for reception, optional for growth |

---

**Last Updated:** December 2024
**Version:** 1.0
**Status:** Planning Phase
