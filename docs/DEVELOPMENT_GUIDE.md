# Fish Farm Management System - Development Guide

## Table of Contents

1. [Setup](#setup)
2. [Coding Standards](#coding-standards)
3. [Component Structure](#component-structure)
4. [State Management](#state-management)
5. [Error Handling](#error-handling)
6. [Performance](#performance)
7. [Security](#security)
8. [Git Workflow](#git-workflow)
9. [Testing](#testing)
10. [Common Patterns](#common-patterns)

---

## Setup

### Prerequisites

- **Node.js:** 18+ (LTS recommended)
- **npm:** 9+ (comes with Node.js)
- **Git:** Latest version
- **Code Editor:** VS Code (recommended)
- **Firebase Account:** Free tier sufficient for development

### VS Code Extensions (Recommended)

```json
{
  "recommendations": [
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",
    "bradlc.vscode-tailwindcss",
    "dsznajder.es7-react-js-snippets",
    "formulahendry.auto-rename-tag",
    "christian-kohler.path-intellisense"
  ]
}
```

### Installation Steps

1. **Clone the repository**
```bash
git clone https://github.com/Amikashkash/fish-stock-list.git
cd fish-stock-list
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**
```bash
cp .env.example .env.local
```

Edit `.env.local` with your Firebase credentials:
```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id
```

**Important:** Never commit `.env.local` to git!

4. **Start development server**
```bash
npm run dev
```

5. **Access the app**
Open [http://localhost:5173](http://localhost:5173) in your browser

### Firebase Setup

1. **Create Firebase Project**
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Create new project
   - Enable Google Analytics (optional)

2. **Enable Authentication**
   - Navigate to Authentication > Sign-in method
   - Enable Email/Password
   - Enable Google Sign-In
   - Configure authorized domains

3. **Create Firestore Database**
   - Navigate to Firestore Database
   - Create database (Start in test mode for development)
   - Set security rules (see DATABASE.md)

4. **Set up Firebase Storage**
   - Navigate to Storage
   - Get started
   - Set security rules

5. **Get Firebase Config**
   - Project Settings > General
   - Scroll to "Your apps"
   - Copy config values to `.env.local`

---

## Coding Standards

### General Principles

1. **Readability over cleverness**
   - Write code that's easy to understand
   - Avoid overly complex one-liners
   - Use descriptive names

2. **DRY (Don't Repeat Yourself)**
   - Extract reusable logic
   - Create shared utilities
   - But don't over-abstract

3. **Keep it simple**
   - Avoid premature optimization
   - Choose simple solutions
   - Refactor when needed, not before

### Naming Conventions

**Variables and Functions**
```javascript
// Use camelCase
const userName = 'John Doe'
const isLoggedIn = true

// Functions: verb + noun
function getUserProfile() { }
function calculateTotalCost() { }
function validateEmail() { }
```

**Components**
```javascript
// Use PascalCase
function HomePage() { }
function UserProfile() { }
function ShipmentList() { }
```

**Constants**
```javascript
// Use SCREAMING_SNAKE_CASE for true constants
const MAX_FILE_SIZE = 5242880 // 5MB
const DEFAULT_CURRENCY = 'ILS'
const MORTALITY_THRESHOLD = 0.4
```

**Files**
```
// Components: PascalCase.jsx
HomePage.jsx
UserProfile.jsx

// Utilities: camelCase.js
dateUtils.js
formatters.js

// Services: camelCase.service.js
auth.service.js
shipment.service.js
```

### Comments

**File Headers**
Every file should start with a comment block:

```javascript
/**
 * HomePage.jsx
 *
 * Main dashboard after user login.
 * Shows welcome message, quick actions, and farm status.
 *
 * Features:
 * - User greeting with farm info
 * - Quick action cards (Tasks, Aquariums, Shipments, etc.)
 * - System status indicator
 * - Sign out functionality
 */
```

**Function Comments**
Add comments before functions explaining what and why:

```javascript
/**
 * Calculate the current cost per fish after all mortality
 * Formula: (invoice cost × original quantity) / remaining quantity
 *
 * @param {number} invoiceCost - Original cost per fish from supplier
 * @param {number} originalQuantity - Initial quantity received
 * @param {number} currentQuantity - Remaining live fish
 * @returns {number} Current cost per fish
 */
function calculateCurrentCost(invoiceCost, originalQuantity, currentQuantity) {
  if (currentQuantity === 0) return 0
  return (invoiceCost * originalQuantity) / currentQuantity
}
```

**Inline Comments**
Use sparingly, only for non-obvious logic:

```javascript
// DOA must be recorded within 24 hours of arrival
const isWithinDOAWindow = hoursSinceArrival <= 24

// Calculate mortality rate as percentage
const mortalityRate = (totalDeaths / originalQuantity) * 100

// Alert threshold reached - notify owner
if (mortalityRate >= MORTALITY_THRESHOLD) {
  sendAlert()
}
```

### File Length

**Maximum 200 lines per file**

If a file exceeds 200 lines:
1. Identify logical groups
2. Extract components/utilities
3. Move to separate files

**Example of splitting:**
```javascript
// Before: ShipmentPage.jsx (350 lines)

// After:
ShipmentPage.jsx              // Main page (150 lines)
ShipmentList.jsx              // List component (100 lines)
ShipmentFilters.jsx           // Filter component (80 lines)
shipmentUtils.js              // Helper functions (50 lines)
```

### Code Formatting

**Use Prettier (auto-format on save)**

`.prettierrc` configuration:
```json
{
  "semi": false,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "es5",
  "printWidth": 100,
  "arrowParens": "always"
}
```

**ESLint Rules**

`.eslintrc.json` configuration:
```json
{
  "extends": [
    "eslint:recommended",
    "plugin:react/recommended",
    "plugin:react-hooks/recommended"
  ],
  "rules": {
    "no-console": "warn",
    "no-unused-vars": "warn",
    "react/prop-types": "off"
  }
}
```

---

## Component Structure

### Standard Component Template

```javascript
/**
 * ComponentName.jsx
 *
 * Brief description of what this component does.
 *
 * Features:
 * - Feature 1
 * - Feature 2
 */

import { useState, useEffect } from 'react'
import PropTypes from 'prop-types'
import './ComponentName.css'

/**
 * ComponentName component
 *
 * @param {Object} props
 * @param {string} props.title - Component title
 * @param {Function} props.onAction - Callback function
 */
function ComponentName({ title, onAction }) {
  // 1. State declarations
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // 2. Effects
  useEffect(() => {
    loadData()
  }, [])

  // 3. Event handlers
  async function loadData() {
    try {
      setLoading(true)
      setError(null)
      // Fetch data...
      setData(result)
    } catch (err) {
      console.error('Error loading data:', err)
      setError('Failed to load data. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  function handleClick() {
    onAction?.()
  }

  // 4. Early returns for loading/error states
  if (loading) {
    return <div className="loading">Loading...</div>
  }

  if (error) {
    return <div className="error">{error}</div>
  }

  // 5. Main render
  return (
    <div className="component-name">
      <h2>{title}</h2>
      <button onClick={handleClick}>Action</button>
    </div>
  )
}

// 6. PropTypes (for documentation, TypeScript is better)
ComponentName.propTypes = {
  title: PropTypes.string.required,
  onAction: PropTypes.func
}

export default ComponentName
```

### TypeScript Component Template

```typescript
/**
 * ComponentName.tsx
 *
 * Brief description of what this component does.
 */

import { useState, useEffect } from 'react'
import './ComponentName.css'

// 1. Type definitions at the top
interface ComponentNameProps {
  title: string
  onAction?: () => void
  items?: Item[]
}

interface Item {
  id: string
  name: string
}

/**
 * ComponentName component
 */
function ComponentName({ title, onAction, items = [] }: ComponentNameProps) {
  // Component implementation...
}

export default ComponentName
```

### Folder Structure for Features

```
src/
├── components/
│   ├── ui/                    # Reusable UI components
│   │   ├── Button/
│   │   │   ├── Button.jsx
│   │   │   ├── Button.css
│   │   │   └── Button.test.jsx
│   │   └── Card/
│   │       ├── Card.jsx
│   │       └── Card.css
│   │
│   └── features/              # Feature-specific components
│       ├── shipments/
│       │   ├── ShipmentList.jsx
│       │   ├── ShipmentCard.jsx
│       │   └── ShipmentFilters.jsx
│       └── mortality/
│           ├── MortalityForm.jsx
│           └── MortalityChart.jsx
│
├── pages/                     # Route components
│   ├── HomePage/
│   │   ├── HomePage.jsx
│   │   └── HomePage.css
│   └── ShipmentsPage/
│       ├── ShipmentsPage.jsx
│       └── ShipmentsPage.css
```

---

## Styling with Tailwind CSS

### Why Tailwind CSS?

**Completed full migration in December 2024** - All component-specific CSS files have been removed in favor of Tailwind utility classes.

**Benefits:**
- ✅ **Consistency** - Uniform styling approach across entire codebase
- ✅ **Maintainability** - No CSS class hunting, styles are co-located with markup
- ✅ **Performance** - Tailwind purges unused CSS in production builds
- ✅ **Developer Experience** - IntelliSense support, faster development
- ✅ **Responsive Design** - Mobile-first utilities built-in
- ✅ **Code Reduction** - Reduced from 1,649 lines of CSS to inline utilities

### Basic Principles

**1. Use Utility Classes**
```jsx
// ❌ WRONG - Don't create custom CSS files
// ComponentName.css
.my-button {
  padding: 12px 24px;
  background: #2196F3;
  color: white;
}

// ✅ CORRECT - Use Tailwind utilities
<button className="px-6 py-3 bg-blue-500 text-white rounded-lg">
  Click Me
</button>
```

**2. Use Tailwind's Design System**
```jsx
// ❌ WRONG - Arbitrary values for standard use cases
<div className="p-[13px] text-[#2196F3]">

// ✅ CORRECT - Use Tailwind's scale
<div className="p-3 text-blue-500">
```

**3. Mobile-First Responsive Design**
```jsx
// Default = mobile, then add breakpoints for larger screens
<div className="text-sm md:text-base lg:text-lg">
  Responsive text
</div>

// Breakpoints:
// sm:  640px and up  (small tablets)
// md:  768px and up  (tablets)
// lg:  1024px and up (desktops)
// xl:  1280px and up (large screens)
// 2xl: 1536px and up (extra large screens)
```

### Common Patterns

**Layout Patterns**

```jsx
// Centered container with max width
<div className="max-w-[1200px] mx-auto p-4">
  {/* Content */}
</div>

// Flex row with gap
<div className="flex items-center gap-4">
  <button>Action 1</button>
  <button>Action 2</button>
</div>

// Flex column
<div className="flex flex-col gap-2">
  <div>Item 1</div>
  <div>Item 2</div>
</div>

// Grid layout
<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
  {items.map(item => <Card key={item.id} {...item} />)}
</div>

// Sticky header
<header className="sticky top-0 z-50 bg-white shadow-md">
  {/* Header content */}
</header>
```

**Card Patterns**

```jsx
// Basic card
<div className="bg-white rounded-xl shadow-md p-6">
  <h2 className="text-xl font-bold mb-4">Card Title</h2>
  <p className="text-gray-600">Card content</p>
</div>

// Interactive card
<div className="bg-white rounded-xl shadow-md p-6 cursor-pointer transition-all hover:shadow-xl hover:-translate-y-1">
  {/* Clickable card */}
</div>

// Card with border accent
<div className="bg-white rounded-xl shadow-md p-6 border-t-4 border-blue-500">
  {/* Card with top border */}
</div>
```

**Button Patterns**

```jsx
// Primary button
<button className="px-6 py-3 bg-blue-500 text-white rounded-lg font-semibold hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
  Save Changes
</button>

// Secondary button
<button className="px-6 py-3 bg-gray-100 text-gray-900 rounded-lg font-semibold hover:bg-gray-200 transition-colors">
  Cancel
</button>

// Icon button
<button className="w-10 h-10 flex items-center justify-center rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors">
  ⚙️
</button>

// Danger button
<button className="px-6 py-3 bg-red-500 text-white rounded-lg font-semibold hover:bg-red-600 transition-colors">
  Delete
</button>
```

**Form Patterns**

```jsx
// Form group
<div className="mb-5">
  <label className="block mb-2 font-medium text-gray-900 text-sm">
    Email Address
  </label>
  <input
    type="email"
    className="w-full px-4 py-3 border border-gray-300 rounded-lg text-base transition-colors focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
    placeholder="example@email.com"
  />
</div>

// Select dropdown
<select className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm cursor-pointer bg-white focus:outline-none focus:border-blue-500">
  <option value="">Choose option...</option>
  <option value="1">Option 1</option>
  <option value="2">Option 2</option>
</select>

// Textarea
<textarea
  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm transition-colors resize-y min-h-[80px] focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
  rows="3"
/>
```

**Modal Patterns**

```jsx
// Modal overlay with centered content
<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1000] p-5">
  <div className="bg-white rounded-2xl shadow-2xl max-w-[600px] w-full max-h-[90vh] overflow-y-auto">
    {/* Modal header */}
    <div className="px-6 pt-6 pb-4 border-b border-gray-200 flex justify-between items-center">
      <h2 className="text-xl font-semibold">Modal Title</h2>
      <button className="text-2xl text-gray-400 hover:text-gray-700">×</button>
    </div>

    {/* Modal body */}
    <div className="p-6">
      {/* Content */}
    </div>

    {/* Modal footer */}
    <div className="px-6 pb-6 pt-4 border-t border-gray-200 flex gap-3 justify-end">
      <button className="px-6 py-3 bg-gray-100 rounded-lg">Cancel</button>
      <button className="px-6 py-3 bg-blue-500 text-white rounded-lg">Save</button>
    </div>
  </div>
</div>
```

**Loading States**

```jsx
// Loading spinner
<div className="flex flex-col items-center justify-center min-h-screen">
  <div className="w-12 h-12 border-4 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
  <p className="mt-4 text-gray-600">Loading...</p>
</div>

// Skeleton loader
<div className="bg-white rounded-xl p-6">
  <div className="h-6 bg-gray-200 rounded w-3/4 mb-4 animate-pulse"></div>
  <div className="h-4 bg-gray-200 rounded w-full mb-2 animate-pulse"></div>
  <div className="h-4 bg-gray-200 rounded w-5/6 animate-pulse"></div>
</div>
```

**Message/Alert Patterns**

```jsx
// Success message
<div className="px-5 py-4 rounded-xl mb-6 bg-green-100 text-green-800 border border-green-200">
  Changes saved successfully!
</div>

// Error message
<div className="px-5 py-4 rounded-xl mb-6 bg-red-100 text-red-800 border border-red-200">
  An error occurred. Please try again.
</div>

// Info message
<div className="px-5 py-4 rounded-xl mb-6 bg-blue-100 text-blue-800 border border-blue-200">
  Please note: This action cannot be undone.
</div>

// Warning message
<div className="px-5 py-4 rounded-xl mb-6 bg-yellow-100 text-yellow-800 border border-yellow-200">
  Warning: You have unsaved changes.
</div>
```

### Custom Configuration

**Tailwind Config Location:** `tailwind.config.js`

```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      // Custom colors
      colors: {
        primary: {
          DEFAULT: '#2196F3',
          light: '#64B5F6',
          dark: '#1976D2',
        },
        secondary: {
          DEFAULT: '#00BCD4',
          light: '#4DD0E1',
          dark: '#0097A7',
        },
      },

      // Custom animations
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-20px)' },
        },
      },
      animation: {
        float: 'float 3s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
```

**Usage:**
```jsx
// Use custom colors
<button className="bg-primary hover:bg-primary-dark">
  Primary Action
</button>

// Use custom animation
<div className="animate-float">
  🐠
</div>
```

### Responsive Design

**Mobile-First Approach**

```jsx
// Start with mobile, add larger breakpoints
<div className="
  p-4           // Mobile: 16px padding
  sm:p-6        // Tablet: 24px padding
  lg:p-8        // Desktop: 32px padding
">
  {/* Content */}
</div>

// Responsive grid
<div className="
  grid
  grid-cols-1         // Mobile: 1 column
  sm:grid-cols-2      // Tablet: 2 columns
  lg:grid-cols-3      // Desktop: 3 columns
  xl:grid-cols-4      // Large: 4 columns
  gap-4
">
  {items.map(item => <Card key={item.id} />)}
</div>

// Responsive text
<h1 className="
  text-2xl          // Mobile: 24px
  md:text-3xl       // Tablet: 30px
  lg:text-4xl       // Desktop: 36px
  font-bold
">
  Heading
</h1>

// Hide on mobile, show on desktop
<div className="hidden lg:block">
  Desktop only content
</div>

// Show on mobile, hide on desktop
<div className="block lg:hidden">
  Mobile only content
</div>
```

### RTL (Right-to-Left) Support

**For Hebrew text, use `dir="rtl"` on specific elements:**

```jsx
// English input (left-to-right)
<input
  type="email"
  placeholder="example@email.com"
  dir="ltr"
  className="w-full px-4 py-3"
/>

// Hebrew text (right-to-left is default in our app)
<p className="text-right">
  טקסט בעברית
</p>
```

### Best Practices

**1. Extract Complex Classes**

If a component uses the same class combination multiple times, consider extracting:

```jsx
// ❌ AVOID - Repeated long class strings
function CardGrid({ items }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {items.map(item => (
        <div key={item.id} className="bg-white rounded-xl shadow-md p-6 hover:shadow-xl transition-all">
          {/* Card content */}
        </div>
      ))}
    </div>
  )
}

// ✅ BETTER - Extract to constants
const CARD_CLASSES = "bg-white rounded-xl shadow-md p-6 hover:shadow-xl transition-all"
const GRID_CLASSES = "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"

function CardGrid({ items }) {
  return (
    <div className={GRID_CLASSES}>
      {items.map(item => (
        <div key={item.id} className={CARD_CLASSES}>
          {/* Card content */}
        </div>
      ))}
    </div>
  )
}
```

**2. Conditional Classes**

Use template literals for dynamic classes:

```jsx
// Simple conditional
<button className={`px-6 py-3 rounded-lg ${isActive ? 'bg-blue-500' : 'bg-gray-300'}`}>
  Toggle
</button>

// Multiple conditionals with clsx (if installed)
import clsx from 'clsx'

<div className={clsx(
  'rounded-xl p-4',
  isActive && 'bg-blue-500 text-white',
  isDisabled && 'opacity-50 cursor-not-allowed',
  size === 'large' && 'p-6'
)}>
  {/* Content */}
</div>
```

**3. Arbitrary Values (Use Sparingly)**

Only use arbitrary values when Tailwind's scale doesn't fit:

```jsx
// ✅ GOOD - Use Tailwind's scale when possible
<div className="w-12 h-12">  // 48px

// ⚠️ USE SPARINGLY - Only when standard sizes don't work
<div className="w-[73px] h-[73px]">  // Specific brand requirement

// ✅ GOOD - Use custom config for repeated values
// Add to tailwind.config.js instead:
extend: {
  spacing: {
    '73': '73px',
  }
}
```

**4. Keep Classes Organized**

Order classes by category for readability:

```jsx
<div className="
  // Layout
  flex items-center justify-between

  // Spacing
  px-6 py-4 gap-3

  // Appearance
  bg-white rounded-xl shadow-md

  // Typography
  text-base font-semibold text-gray-900

  // States
  hover:shadow-xl hover:-translate-y-1

  // Responsive
  sm:px-8 md:flex-row
">
  {/* Content */}
</div>
```

**5. Avoid Over-Nesting**

Keep components flat when possible:

```jsx
// ❌ AVOID - Too much nesting
<div className="flex">
  <div className="flex">
    <div className="flex">
      <button>Click</button>
    </div>
  </div>
</div>

// ✅ BETTER - Flat structure
<div className="flex">
  <button>Click</button>
</div>
```

### Migration Notes

**December 2024 Migration:**
- ✅ Migrated all 8 CSS files to Tailwind utilities
- ✅ Deleted: `App.css`, `FarmSettingsPage.css`, `AquariumModal.css`, `AquariumCard.css`, `AquariumsPage.css`, `HomePage.css`, `LoginPage.css`, `WelcomePage.css`
- ✅ Kept: `index.css` (for Tailwind directives and global CSS variables)
- ✅ Added custom `float` animation to `tailwind.config.js`
- ✅ Net reduction: 1,364 lines of code

**If you need to add new components:**
1. ❌ **DO NOT** create new `.css` files
2. ✅ **DO** use Tailwind utility classes directly in JSX
3. ✅ **DO** add custom values to `tailwind.config.js` if needed for design tokens

### Common Gotchas

**1. Focus States**

Always remove default outline and add Tailwind focus styles:

```jsx
// ❌ WRONG - Browser default outline
<input type="text" className="border" />

// ✅ CORRECT - Custom focus styles
<input
  type="text"
  className="border focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
/>
```

**2. Transition Classes**

Add `transition-*` for smooth state changes:

```jsx
// ❌ WRONG - Abrupt color change
<button className="bg-blue-500 hover:bg-blue-600">

// ✅ CORRECT - Smooth transition
<button className="bg-blue-500 hover:bg-blue-600 transition-colors">
```

**3. Z-Index Management**

Use consistent z-index values:

```jsx
// Standard z-index hierarchy:
// - Modals: z-[1000]
// - Sticky headers: z-50
// - Dropdowns: z-40
// - Tooltips: z-30

<div className="fixed inset-0 z-[1000]">  // Modal
<header className="sticky top-0 z-50">    // Header
<div className="absolute z-40">           // Dropdown
```

**4. Backdrop Blur (Requires Vite Config)**

```jsx
// Works in most modern browsers
<div className="bg-white/20 backdrop-blur-md">
  Glassmorphism effect
</div>
```

### Resources

- [Tailwind CSS Docs](https://tailwindcss.com/docs) - Official documentation
- [Tailwind UI](https://tailwindui.com/) - Component examples (paid)
- [Headless UI](https://headlessui.com/) - Unstyled accessible components
- [Tailwind Play](https://play.tailwindcss.com/) - Online playground

**VS Code Extension:**
- Install: `bradlc.vscode-tailwindcss`
- Provides: IntelliSense, autocomplete, linting

---

## State Management

### Context API (Global State)

**When to use:**
- User authentication state
- Theme/language settings
- App-wide configuration

**Example: AuthContext**

```javascript
/**
 * AuthContext.js
 *
 * Provides authentication state to entire app.
 * Handles login, logout, and user session.
 */

import { createContext, useContext, useState, useEffect } from 'react'
import { auth } from '../firebase/config'
import { onAuthStateChanged } from 'firebase/auth'

const AuthContext = createContext(null)

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user)
      setLoading(false)
    })

    return unsubscribe
  }, [])

  const value = {
    user,
    loading,
  }

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  )
}
```

### React Query (Server State)

**When to use:**
- Fetching data from Firebase
- Mutations (create, update, delete)
- Real-time data subscriptions

**Example: Shipments Query**

```javascript
/**
 * useShipments.js
 *
 * Custom hook for managing shipment data.
 * Uses React Query for caching and real-time updates.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getShipments, createShipment, updateShipment } from '../services/shipment.service'

export function useShipments(farmId) {
  return useQuery({
    queryKey: ['shipments', farmId],
    queryFn: () => getShipments(farmId),
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: !!farmId,
  })
}

export function useCreateShipment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createShipment,
    onSuccess: (data, variables) => {
      // Invalidate shipments query to refetch
      queryClient.invalidateQueries(['shipments', variables.farmId])
    },
  })
}
```

### useState (Local State)

**When to use:**
- Form inputs
- UI state (modals, dropdowns)
- Component-specific data

```javascript
function ShipmentForm() {
  // Form fields
  const [supplier, setSupplier] = useState('')
  const [date, setDate] = useState('')
  const [items, setItems] = useState([])

  // UI state
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [errors, setErrors] = useState({})
}
```

---

## Error Handling

### Async Function Pattern

**Always use try-catch-finally:**

```javascript
async function loadShipment(shipmentId) {
  try {
    setLoading(true)
    setError(null)

    const shipment = await getShipment(shipmentId)
    setData(shipment)

  } catch (err) {
    // 1. Log detailed error for debugging
    console.error('Error loading shipment:', err)

    // 2. Set user-friendly error message
    setError('Failed to load shipment. Please try again.')

    // 3. Optional: Send to error tracking service
    // trackError(err)

  } finally {
    // Always runs, even if error occurs
    setLoading(false)
  }
}
```

### Firebase Error Handling

```javascript
/**
 * Handle Firebase authentication errors
 */
function getAuthErrorMessage(error) {
  switch (error.code) {
    case 'auth/user-not-found':
    case 'auth/wrong-password':
      return 'Invalid email or password'

    case 'auth/email-already-in-use':
      return 'This email is already registered'

    case 'auth/weak-password':
      return 'Password should be at least 6 characters'

    case 'auth/invalid-email':
      return 'Invalid email address'

    case 'auth/network-request-failed':
      return 'Network error. Please check your connection.'

    default:
      console.error('Unhandled auth error:', error.code, error.message)
      return 'An error occurred. Please try again.'
  }
}

// Usage
try {
  await signInWithEmailAndPassword(auth, email, password)
} catch (error) {
  const message = getAuthErrorMessage(error)
  setError(message)
}
```

### React Error Boundaries

```javascript
/**
 * ErrorBoundary.jsx
 *
 * Catches React errors and shows fallback UI.
 * Prevents entire app from crashing.
 */

import { Component } from 'react'

class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo)
    // Optional: Send to error tracking
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary">
          <h2>Something went wrong</h2>
          <p>Please refresh the page or contact support.</p>
          <button onClick={() => window.location.reload()}>
            Refresh Page
          </button>
        </div>
      )
    }

    return this.props.children
  }
}

// Usage in App.jsx
function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <RouterProvider router={router} />
      </AuthProvider>
    </ErrorBoundary>
  )
}
```

### Validation Errors

```javascript
/**
 * Validate shipment form data
 * Returns object with field-specific errors
 */
function validateShipment(data) {
  const errors = {}

  if (!data.supplier?.trim()) {
    errors.supplier = 'Supplier name is required'
  }

  if (!data.date) {
    errors.date = 'Date is required'
  }

  if (!data.items || data.items.length === 0) {
    errors.items = 'At least one item is required'
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  }
}

// Usage
function handleSubmit(e) {
  e.preventDefault()

  const { isValid, errors } = validateShipment(formData)

  if (!isValid) {
    setErrors(errors)
    return
  }

  // Proceed with submission
  createShipment(formData)
}
```

---

## Performance

### React.memo

**Use sparingly - only for expensive components:**

```javascript
/**
 * FishCard component
 * Memoized because it renders in large lists
 */
const FishCard = React.memo(function FishCard({ fish, onSelect }) {
  return (
    <div className="fish-card" onClick={() => onSelect(fish.id)}>
      <h3>{fish.commonName}</h3>
      <p>{fish.quantity} fish</p>
    </div>
  )
})
```

### Lazy Loading

**Load heavy components only when needed:**

```javascript
import { lazy, Suspense } from 'react'

// Lazy load pages
const ShipmentsPage = lazy(() => import('./pages/ShipmentsPage'))
const GrowthTrackingPage = lazy(() => import('./pages/GrowthTrackingPage'))

function App() {
  return (
    <Suspense fallback={<LoadingScreen />}>
      <Routes>
        <Route path="/shipments" element={<ShipmentsPage />} />
        <Route path="/growth" element={<GrowthTrackingPage />} />
      </Routes>
    </Suspense>
  )
}
```

### Debouncing

**Delay expensive operations:**

```javascript
import { useState, useEffect } from 'react'

/**
 * Custom hook for debounced value
 */
function useDebounce(value, delay = 500) {
  const [debouncedValue, setDebouncedValue] = useState(value)

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => clearTimeout(timer)
  }, [value, delay])

  return debouncedValue
}

// Usage in search
function SearchBar() {
  const [searchTerm, setSearchTerm] = useState('')
  const debouncedSearchTerm = useDebounce(searchTerm, 300)

  useEffect(() => {
    // Only fires after user stops typing for 300ms
    if (debouncedSearchTerm) {
      searchShipments(debouncedSearchTerm)
    }
  }, [debouncedSearchTerm])

  return (
    <input
      value={searchTerm}
      onChange={(e) => setSearchTerm(e.target.value)}
      placeholder="Search shipments..."
    />
  )
}
```

---

## Security

### Environment Variables

**Never commit secrets:**

```javascript
// ❌ WRONG - Hard-coded secrets
const apiKey = 'AIzaSyDKn-6_oLt5AHzGav9WolS5A0I-W0Yh9Vo'

// ✅ CORRECT - Use environment variables
const apiKey = import.meta.env.VITE_FIREBASE_API_KEY
```

### Input Validation

**Always validate user input:**

```javascript
/**
 * Sanitize user input to prevent XSS
 */
function sanitizeInput(input) {
  if (typeof input !== 'string') return ''

  return input
    .trim()
    .replace(/[<>]/g, '') // Remove < and >
    .substring(0, 1000) // Limit length
}

// Usage
function handleSubmit(e) {
  e.preventDefault()
  const sanitizedName = sanitizeInput(formData.name)
  // Use sanitized value
}
```

### Firestore Security Rules

**Never trust client-side validation:**

```javascript
// Firestore rules enforce server-side validation
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only read/write their own data
    match /users/{userId} {
      allow read, write: if request.auth.uid == userId;
    }

    // Farm members can access farm data
    match /farms/{farmId} {
      allow read: if isFarmMember(farmId);
      allow write: if isFarmOwner(farmId);
    }
  }
}
```

---

## Git Workflow

### Branch Strategy

```
main (production)
  ↓
develop (latest stable features)
  ↓
feature/shipment-import (your work)
```

### Commit Messages

**Format: `type: description`**

**Types:**
- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation changes
- `style:` Formatting (no code change)
- `refactor:` Code restructuring
- `test:` Adding tests
- `chore:` Build/config changes

**Examples:**
```
feat: add Excel import for shipments
fix: mortality calculation for DOA fish
docs: update database schema documentation
refactor: extract price calculation to utility
```

### Pull Request Process

1. **Create feature branch**
```bash
git checkout -b feature/excel-import
```

2. **Make changes and commit**
```bash
git add .
git commit -m "feat: add Excel parsing for shipments"
```

3. **Push and create PR**
```bash
git push origin feature/excel-import
```

4. **PR Description Template**
```markdown
## What does this PR do?
Brief description of changes

## Why?
Explain the reasoning

## How to test?
Step-by-step testing instructions

## Screenshots (if UI changes)
[Add screenshots]

## Checklist
- [ ] Code follows style guide
- [ ] Comments added for complex logic
- [ ] No console.logs left behind
- [ ] Tested on mobile
```

---

## Testing

### Philosophy

**Start lean, add tests when needed:**

1. **TypeScript** - Type safety (already have)
2. **ESLint** - Code quality (already have)
3. **Manual testing** - Test on real devices
4. **Automated tests** - Add when:
   - Bugs appear in production
   - Fear of changing code
   - Critical flows breaking

### Manual Testing Checklist

Before committing:
- [ ] Feature works as expected
- [ ] No console errors
- [ ] Works on mobile (Chrome DevTools)
- [ ] Works in different browsers
- [ ] Loading states work
- [ ] Error states work
- [ ] No TypeScript errors

### Future: Unit Tests (Vitest)

```javascript
/**
 * calculateCost.test.js
 */
import { describe, it, expect } from 'vitest'
import { calculateCurrentCost } from './costUtils'

describe('calculateCurrentCost', () => {
  it('calculates cost correctly', () => {
    const result = calculateCurrentCost(10, 100, 80)
    expect(result).toBe(12.5)
  })

  it('returns 0 for zero quantity', () => {
    const result = calculateCurrentCost(10, 100, 0)
    expect(result).toBe(0)
  })
})
```

---

## Common Patterns

### Loading States

```javascript
function ShipmentPage() {
  const { data, loading, error } = useShipments(farmId)

  if (loading) {
    return <LoadingSpinner />
  }

  if (error) {
    return <ErrorMessage error={error} />
  }

  return <ShipmentList shipments={data} />
}
```

### Form Handling

```javascript
function ShipmentForm({ onSubmit }) {
  const [formData, setFormData] = useState({
    supplier: '',
    date: '',
    items: [],
  })
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)

  function handleChange(field, value) {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear error when user types
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }))
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()

    const { isValid, errors } = validate(formData)
    if (!isValid) {
      setErrors(errors)
      return
    }

    try {
      setSubmitting(true)
      await onSubmit(formData)
    } catch (err) {
      console.error('Submit error:', err)
      setErrors({ submit: 'Failed to save. Please try again.' })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      {/* Form fields */}
    </form>
  )
}
```

### Modal Pattern

```javascript
function useModal() {
  const [isOpen, setIsOpen] = useState(false)

  return {
    isOpen,
    open: () => setIsOpen(true),
    close: () => setIsOpen(false),
    toggle: () => setIsOpen(prev => !prev),
  }
}

// Usage
function ShipmentPage() {
  const modal = useModal()

  return (
    <>
      <button onClick={modal.open}>Add Shipment</button>

      {modal.isOpen && (
        <Modal onClose={modal.close}>
          <ShipmentForm onSubmit={handleSubmit} />
        </Modal>
      )}
    </>
  )
}
```

---

## Resources

### Documentation
- [React Docs](https://react.dev)
- [Vite Docs](https://vitejs.dev)
- [Firebase Docs](https://firebase.google.com/docs)
- [Tailwind CSS](https://tailwindcss.com)
- [React Query](https://tanstack.com/query)

### Tools
- [VS Code](https://code.visualstudio.com/)
- [Firebase CLI](https://firebase.google.com/docs/cli)
- [Chrome DevTools](https://developer.chrome.com/docs/devtools/)

---

**Last Updated:** December 2024
**Version:** 1.0
**Status:** Planning Phase
