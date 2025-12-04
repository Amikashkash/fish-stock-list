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
