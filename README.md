# Fish Farm Management System

A comprehensive, mobile-first web application for managing fish farms, tracking inventory, monitoring fish health, and optimizing farm operations.

## Overview

This system helps fish farm owners manage the entire lifecycle of their fish inventory—from importing shipments and tracking mortality to monitoring growth rates and maintaining treatment histories. Built with React and Firebase, it provides real-time data access for both farm staff and customers.

## Key Features

### 🚚 **Shipment Management**
- Excel import from supplier invoices
- Automatic data validation and parsing
- Manual price editing for USD invoices (shipping, customs, fees)
- Missing code handling with dummy code generation
- Edit history tracking

### 📊 **Mortality Tracking**
- Two-phase tracking (Reception DOA vs Post-Reception)
- 15-24 hour DOA window for supplier accountability
- 40% mortality threshold with automatic alerts
- Impact on cost calculations
- Supplier reliability metrics

### 💰 **Cost Management**
- Three-tier cost system:
  - Invoice cost (from supplier)
  - Arrival cost (after DOA)
  - Current cost (after all mortality)
- Real-time profitability analysis
- Alert when costs exceed wholesale price
- Currency support (ILS, USD)

### 📈 **Growth Tracking**
- Monthly size measurements for long-term fish
- Growth rate calculations
- Time-to-target estimations
- Health monitoring
- Photo documentation

### 💊 **Treatment System**
- Complete treatment history per species
- Proactive alerts on shipment arrival
- Cross-reference treatments in farm
- Success rate tracking
- Global knowledge base (anonymized)

### ✅ **Daily Check System**
- Two-person workflow (employee + owner)
- Enforced checks for reception fish
- Optional checks for growth fish
- Skip tracking with reasons
- Cost analysis of skipped checks

### 🐟 **Aquarium Management**
- Fish assignment with capacity tracking
- Water parameter monitoring
- Equipment management
- Maintenance scheduling

### 👥 **Multi-Tenant Architecture**
- Multiple farms per user
- Role-based access control (owner, employee, customer)
- Team member invitations
- Customer portal (future phase)

### 📱 **Mobile-First Design**
- Optimized for tablets and phones
- Touch-friendly interface (44×44px minimum)
- Camera integration for photos
- Offline support
- Real-time updates

## Tech Stack

- **Frontend:** React 19 + Vite + TypeScript
- **Backend:** Firebase (Auth, Firestore, Storage, Hosting)
- **Routing:** React Router DOM
- **State Management:** Context API + React Query
- **Styling:** Tailwind CSS + shadcn/ui
- **Excel Parsing:** SheetJS (xlsx)

## Documentation

Comprehensive documentation is available in the [/docs](docs/) folder:

### 📚 Core Documentation

- **[ARCHITECTURE.md](docs/ARCHITECTURE.md)** - System architecture, technology stack decisions, and project structure
- **[DATABASE.md](docs/DATABASE.md)** - Complete Firestore schema with all collections and data models
- **[FEATURES.md](docs/FEATURES.md)** - Detailed feature list organized by priority and development phase
- **[DEVELOPMENT_GUIDE.md](docs/DEVELOPMENT_GUIDE.md)** - Development setup, coding standards, and best practices
- **[USER_FLOWS.md](docs/USER_FLOWS.md)** - User journeys and interaction flows for all major features

### 📋 Excel Templates

- **[Template Guide](templates/template-guide.md)** - User-facing guide for Excel shipment imports (includes foreign user instructions)
- **[Template README](templates/README.md)** - Technical documentation for developers implementing the Excel parser

### 🗓️ Implementation Phases

The project is organized into phases for systematic development:

1. **Phase 1:** Foundation + Excel Import (Weeks 1-2)
2. **Phase 2:** Shipments + Pricing (Weeks 3-4)
3. **Phase 3:** Reception Tracking (Weeks 5-6)
4. **Phase 4:** Growth Tracking (Weeks 7-8)
5. **Phase 5:** Treatment System (Weeks 9-10)
6. **Phase 6:** Daily Operations (Weeks 11+)
7. **Phase 7:** Customer Portal (Future)
8. **Phase 8:** Reports & Analytics (Future)

See [FEATURES.md](docs/FEATURES.md) for detailed breakdown.

---

## Project Status

**Current Phase:** Planning & Documentation ✅

### ✅ Completed

- [x] Clean Firebase setup with secure environment variables
- [x] Basic authentication (Email/Password + Google Sign-In)
- [x] User registration and login flow
- [x] Password reset functionality
- [x] Farm creation and management
- [x] Mobile-first responsive design foundation
- [x] Complete documentation suite:
  - Architecture & design decisions
  - Database schema (13 collections documented)
  - Feature specifications (8 phases planned)
  - Development guidelines & coding standards
  - User flows for all major features
  - Excel template documentation

### 🚧 In Progress

- [ ] Transitioning from Flutter to React codebase
- [ ] Setting up project structure for React

### ⏳ Upcoming (Phase 1: Weeks 1-2)

- [ ] Excel import system
- [ ] Shipment management
- [ ] Data validation and preview
- [ ] Missing code handling

### 📋 Planned Features

See [FEATURES.md](docs/FEATURES.md) for the complete roadmap.

**Key Milestones:**
- **Phase 1-2:** Core shipment and pricing features
- **Phase 3:** Mortality tracking and cost calculations
- **Phase 4:** Growth tracking for long-term fish
- **Phase 5:** Treatment history and alerts
- **Phase 6:** Daily operations and aquarium management
- **Phase 7+:** Customer portal and advanced analytics

---

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Firebase project with Authentication and Firestore enabled

### Installation

1. Clone the repository
```bash
git clone https://github.com/Amikashkash/fish-stock-list.git
cd fish-stock-list
```

2. Install dependencies
```bash
npm install
```

3. Set up environment variables

Copy `.env.example` to `.env.local` and fill in your Firebase configuration:

```bash
cp .env.example .env.local
```

Edit `.env.local` with your Firebase credentials:

```
REACT_APP_FIREBASE_API_KEY=your_api_key
REACT_APP_FIREBASE_AUTH_DOMAIN=your_auth_domain
REACT_APP_FIREBASE_PROJECT_ID=your_project_id
REACT_APP_FIREBASE_STORAGE_BUCKET=your_storage_bucket
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
REACT_APP_FIREBASE_APP_ID=your_app_id
REACT_APP_FIREBASE_MEASUREMENT_ID=your_measurement_id
```

4. Start the development server
```bash
npm run dev
```

The app will open at `http://localhost:3000`

### Build for Production

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

## Firebase Setup

1. Create a Firebase project at [Firebase Console](https://console.firebase.google.com/)

2. Enable Authentication methods:
   - Email/Password
   - Google Sign-In

3. Create a Firestore database

4. Set up Firestore Security Rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    match /farms/{farmId} {
      allow read, write: if request.auth != null;
      match /members/{memberId} {
        allow read, write: if request.auth != null;
      }
    }
  }
}
```

## Project Structure

```
fish-stock-list/
├── docs/                      # 📚 Documentation
│   ├── ARCHITECTURE.md        # System architecture & design decisions
│   ├── DATABASE.md            # Firestore schema & data models
│   ├── FEATURES.md            # Complete feature specifications
│   ├── DEVELOPMENT_GUIDE.md   # Dev setup & coding standards
│   └── USER_FLOWS.md          # User journeys & workflows
│
├── templates/                 # 📋 Excel templates
│   ├── template-guide.md      # User guide for Excel imports
│   └── README.md              # Technical parser documentation
│
├── src/
│   ├── components/
│   │   ├── ui/               # Reusable UI components (buttons, cards, etc.)
│   │   ├── layout/           # Layout components (header, sidebar, footer)
│   │   └── features/         # Feature-specific components
│   │
│   ├── pages/                # Route/page components
│   │   ├── HomePage/
│   │   ├── LoginPage/
│   │   ├── ShipmentsPage/
│   │   ├── AquariumsPage/
│   │   ├── TasksPage/
│   │   └── GrowthTrackingPage/
│   │
│   ├── lib/
│   │   ├── firebase/         # Firebase configuration
│   │   └── utils/            # Helper functions & utilities
│   │
│   ├── services/             # Business logic & Firebase operations
│   │   ├── auth.service.js
│   │   ├── shipment.service.js
│   │   ├── fish.service.js
│   │   ├── aquarium.service.js
│   │   ├── treatment.service.js
│   │   └── growth.service.js
│   │
│   ├── contexts/             # React Context providers
│   │   ├── AuthContext.jsx
│   │   └── ThemeContext.jsx
│   │
│   ├── hooks/                # Custom React hooks
│   │   ├── useAuth.js
│   │   ├── useFishInstances.js
│   │   ├── useShipments.js
│   │   └── useGrowthTracking.js
│   │
│   ├── types/                # TypeScript types & interfaces
│   │   ├── models/           # Data models
│   │   └── api/              # API types
│   │
│   ├── constants/            # App constants
│   │   ├── routes.js
│   │   └── firebase.js
│   │
│   ├── App.jsx              # Main app component
│   ├── App.css              # App styles
│   ├── main.jsx             # Entry point
│   └── index.css            # Global styles
│
├── public/                   # Static assets
├── .env.example             # Environment variables template
├── .env.local               # Firebase credentials (NOT committed!)
├── .gitignore               # Git ignore rules
├── index.html               # HTML template
├── package.json             # Dependencies & scripts
├── vite.config.js           # Vite configuration
└── README.md                # This file
```

## Security

⚠️ **Important:** Never commit your `.env.local` file or any file containing Firebase credentials to git!

The `.gitignore` file is configured to exclude sensitive files.

### Security Best Practices

- All Firebase credentials in `.env.local` (never committed)
- Firestore security rules enforce role-based access
- Input validation on client and server
- XSS prevention through React's escaping
- CSRF protection via Firebase Auth tokens
- Regular security audits recommended

See [DEVELOPMENT_GUIDE.md](docs/DEVELOPMENT_GUIDE.md) for detailed security guidelines.

---

## Key Design Decisions

### Why React + Vite (Not Next.js)?

After careful consideration, we chose React + Vite over Next.js because:

1. **Simpler, faster development** - Less boilerplate, easier setup
2. **Firebase handles backend** - Don't need Next.js API routes or SSR
3. **SEO not critical** - Internal B2B tool, not consumer-facing
4. **Client-side rendering sufficient** - Firebase provides real-time data
5. **Easy deployment** - Firebase Hosting with one command

**Future consideration:** Can migrate to Next.js later if needed for customer-facing marketing pages or SEO requirements.

See [ARCHITECTURE.md](docs/ARCHITECTURE.md) for detailed reasoning.

### Why Manual Price Editing?

USD invoices only show the supplier's base price. The true cost includes:
- Shipping costs (vary by season, fuel prices, route)
- Customs fees (15-20%, depends on classification)
- Handling and agent fees (vary by shipment size)

These costs are **impossible to calculate automatically** because they differ for every shipment. Manual entry with notes ensures accurate cost tracking.

### Why Two-Phase Mortality Tracking?

Fish deaths within 15-24 hours (DOA - Dead on Arrival) are:
- Supplier's responsibility
- Used for refund claims
- Impact supplier reliability metrics

Deaths after 24 hours are:
- Farm's responsibility
- Used for cost tracking only
- Different root causes (water quality, disease, etc.)

This distinction is **critical for business operations** and supplier negotiations.

---

## Contributing

### For Developers

1. Read [DEVELOPMENT_GUIDE.md](docs/DEVELOPMENT_GUIDE.md) first
2. Follow coding standards (comments, naming, 200 lines max per file)
3. Test on mobile devices
4. Write meaningful commit messages
5. Create pull requests with clear descriptions

### For Translators

The app supports Hebrew and English. Additional languages welcome:
- UI text strings in `/locales/`
- RTL support for Arabic, Persian, etc.
- Number/currency formatting per locale

---

## Resources

### Documentation
- [React Documentation](https://react.dev)
- [Vite Guide](https://vitejs.dev/guide/)
- [Firebase Documentation](https://firebase.google.com/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [React Query](https://tanstack.com/query/latest)

### Tools
- [VS Code](https://code.visualstudio.com/) - Recommended editor
- [Firebase Console](https://console.firebase.google.com/) - Manage Firebase project
- [Chrome DevTools](https://developer.chrome.com/docs/devtools/) - Debug and test

---

## Acknowledgments

Built with modern web technologies:
- [React](https://react.dev) - UI framework
- [Vite](https://vitejs.dev) - Build tool
- [Firebase](https://firebase.google.com) - Backend infrastructure
- [Tailwind CSS](https://tailwindcss.com) - Styling
- [shadcn/ui](https://ui.shadcn.com) - UI components
- [SheetJS](https://sheetjs.com) - Excel parsing

---

## License

Private - All Rights Reserved

---

## Contact & Support

For questions, issues, or feature requests:
- Open an issue on [GitHub](https://github.com/Amikashkash/fish-stock-list/issues)
- Check the [documentation](docs/) first
- Review [user flows](docs/USER_FLOWS.md) for usage questions

---

**Last Updated:** December 2024
**Version:** 1.0
**Status:** Planning Phase - Ready for Development
