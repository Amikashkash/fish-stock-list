# Fish Farm Management System - User Flows

## Overview

This document details all user journeys through the Fish Farm Management System, organized by user role and feature.

---

## Table of Contents

1. [Authentication Flows](#authentication-flows)
2. [Onboarding Flow](#onboarding-flow)
3. [Shipment Import Flow](#shipment-import-flow)
4. [Manual Pricing Flow](#manual-pricing-flow)
5. [Reception & DOA Tracking Flow](#reception--doa-tracking-flow)
6. [Daily Check Flow](#daily-check-flow)
7. [Growth Tracking Flow](#growth-tracking-flow)
8. [Treatment Alert Flow](#treatment-alert-flow)
9. [Aquarium Management Flow](#aquarium-management-flow)
10. [Customer Portal Flow](#customer-portal-flow)

---

## Authentication Flows

### 1. First-Time Registration

```
User arrives at app
       ↓
Login page displayed
       ↓
User clicks "Don't have an account? Sign up"
       ↓
Registration form:
  - Email
  - Password (with show/hide toggle)
  - Confirm password
  - Full name (optional)
       ↓
User submits form
       ↓
Validation checks:
  - Email format valid?
  - Password strength (min 6 chars)?
  - Passwords match?
       ↓
[If validation fails]
  → Show error messages
  → User corrects and resubmits
       ↓
[If validation passes]
  → Create Firebase Auth account
  → Send verification email
       ↓
[Account created successfully]
       ↓
Create user profile in Firestore:
  - userId
  - email
  - displayName
  - createdAt
  - farms: []
       ↓
Navigate to "Create Your First Farm" screen
```

**Success Criteria:**
- User account created in Firebase Auth
- User profile document created in Firestore
- Verification email sent
- User redirected to farm creation

---

### 2. Email/Password Login

```
User arrives at login page
       ↓
Login form:
  - Email input
  - Password input (with show/hide toggle)
  - "Remember me" checkbox
  - "Forgot password?" link
       ↓
User enters credentials and submits
       ↓
Attempt Firebase Auth sign-in
       ↓
[If authentication fails]
  → Show error: "Invalid email or password"
  → User tries again or resets password
       ↓
[If authentication succeeds]
  → Check user profile exists in Firestore
       ↓
[No profile found]
  → Create profile
  → Navigate to farm creation
       ↓
[Profile exists, but no farms]
  → Navigate to farm creation
       ↓
[Profile exists with farms]
  → Load user's default farm
  → Navigate to Home page
```

**Success Criteria:**
- User authenticated
- User profile loaded
- Default farm selected
- User on Home page

---

### 3. Google Sign-In

```
User clicks "Sign in with Google"
       ↓
Google Sign-In popup appears
       ↓
User selects Google account
       ↓
[User denies permission]
  → Show error: "Google Sign-In cancelled"
  → Return to login page
       ↓
[User grants permission]
  → Firebase Auth creates/signs in user
  → User profile created (if new user)
       ↓
[New user - no farms]
  → Navigate to farm creation
       ↓
[Existing user with farms]
  → Load default farm
  → Navigate to Home page
```

**Success Criteria:**
- User authenticated via Google
- Profile synced with Google info
- User navigated appropriately

---

### 4. Password Reset

```
User clicks "Forgot password?"
       ↓
Password reset form:
  - Email input
       ↓
User enters email and submits
       ↓
Firebase sends password reset email
       ↓
Show success message:
  "Password reset email sent. Check your inbox."
       ↓
User clicks link in email
       ↓
Redirected to Firebase password reset page
       ↓
User enters new password
       ↓
Password updated in Firebase
       ↓
User redirected to login page
       ↓
User logs in with new password
```

**Success Criteria:**
- Reset email sent successfully
- User can set new password
- User can log in with new password

---

## Onboarding Flow

### First Farm Creation

```
New user (no farms yet)
       ↓
"Create Your First Farm" screen
       ↓
Farm creation form:
  - Farm name (required)
  - Location (optional)
  - Contact phone (optional)
  - Default currency (ILS/USD)
  - Mortality threshold (default: 40%)
       ↓
User fills form and submits
       ↓
Validation:
  - Farm name not empty?
       ↓
[Validation fails]
  → Show errors
  → User corrects
       ↓
[Validation passes]
  → Create farm document in Firestore
  → Set current user as owner
  → Create farm membership for user
  → Update user's farms array
       ↓
Show success message:
  "Farm created! Let's get started."
       ↓
Navigate to Home page
       ↓
Show welcome tour (optional):
  - "This is your dashboard"
  - "Import your first shipment"
  - "Set up aquariums"
  - "Invite your team"
```

**Success Criteria:**
- Farm document created
- User is owner
- User membership created
- User on Home page

---

## Shipment Import Flow

### Excel File Import

```
User on Home page or Shipments page
       ↓
Clicks "Import Shipment" or "New Shipment"
       ↓
Import modal opens with two options:
  1. "Upload Excel File"
  2. "Manual Entry"
       ↓
User selects "Upload Excel File"
       ↓
File picker appears
       ↓
User selects Excel file (.xlsx, .xls)
       ↓
[Invalid file format]
  → Show error: "Please upload an Excel file"
  → User selects different file
       ↓
[Valid file format]
  → Upload file to client
  → Parse Excel with SheetJS
       ↓
[Parsing error]
  → Show error: "Could not read Excel file"
  → Show expected format guide
  → User fixes file and retries
       ↓
[Parsing succeeds]
  → Extract data from expected columns:
    - Code (SKU)
    - Cart number
    - Scientific name
    - Common name
    - Size
    - Bags
    - Qty/bag
    - Total quantity
    - Packing ratio
    - Part of cart (%)
    - Price per fish
    - Currency
       ↓
Validate each row:
  - Required fields present?
  - Numeric fields are numbers?
  - Currency is ILS or USD?
       ↓
[Validation errors found]
  → Show preview with errors highlighted
  → User can:
    a) Edit data inline
    b) Cancel and fix Excel
       ↓
[No validation errors OR user fixed inline]
  → Show import preview:
    - Supplier name input
    - Date received input
    - Table of all fish to import
    - Summary: X items, Y total fish, Z total cost
       ↓
Handle missing codes:
  - For rows without code:
    → Generate dummy code: MISSING-{timestamp}-{randomId}
    → Show warning icon (⚠️)
    → Note: "Code missing - can be added later"
       ↓
User reviews preview
       ↓
[User cancels]
  → Discard import
  → Return to previous page
       ↓
[User clicks "Confirm Import"]
  → Show progress indicator
  → Create shipment document in Firestore
  → Create fish instance documents (batch write)
  → Update farm statistics
  → Generate initial scheduled checks
       ↓
[Import fails]
  → Show error: "Import failed. Please try again."
  → Keep preview open for retry
       ↓
[Import succeeds]
  → Show success message:
    "Shipment imported successfully!"
    "X fish added, Y species"
  → Navigate to shipment details page
       ↓
Shipment Details page shows:
  - Shipment info
  - All fish instances
  - Next actions:
    - "Record DOA" (if within 24 hours)
    - "Assign to Aquariums"
    - "Edit Pricing"
```

**Success Criteria:**
- Excel file parsed correctly
- Data validated
- Shipment created in Firestore
- Fish instances created
- User sees shipment details

**Error Handling:**
- Invalid file format → Clear message + retry
- Parsing error → Show expected format
- Validation errors → Highlight + allow editing
- Import failure → Keep data + retry option

---

## Manual Pricing Flow

### Editing USD Invoice Prices

```
User on Shipment Details page
       ↓
Sees fish with USD pricing
       ↓
Price card shows:
  "Invoice Price: $10.00 USD"
  "Actual Cost: Not set ⚠️"
       ↓
User clicks "Edit Pricing"
       ↓
Pricing modal opens:
  - Original invoice price (read-only): $10.00
  - Actual cost per fish (editable): ______
  - Price notes (optional text area)
       ↓
User enters breakdown:
  Invoice price: $10.00
  + Shipping per fish: $2.00
  + Customs/tax: $1.50
  + Handling: $0.50
  = Actual cost: $14.00
       ↓
User adds notes:
  "Shipment #1234 from USA
   Shipping: $2000 / 1000 fish = $2/fish
   Customs 15% = $1.50/fish
   Handling fee = $0.50/fish"
       ↓
User clicks "Save"
       ↓
Update fish instance in Firestore:
  - Set actualCostPerFish: 14.00
  - Set currency: USD (converted to ILS at save time if needed)
  - Add to editHistory:
    - field: "actualCostPerFish"
    - oldValue: null
    - newValue: 14.00
    - editedBy: userId
    - editedAt: timestamp
    - notes: "[user's notes]"
       ↓
Recalculate all costs:
  - Invoice cost per fish: $10.00
  - Arrival cost per fish: $10.00 (no DOA yet)
  - Current cost per fish: $14.00 (actual cost)
       ↓
Show success message:
  "Pricing updated successfully"
       ↓
Price card updates:
  "Invoice Price: $10.00 USD"
  "Actual Cost: $14.00 USD ✓"
  "Last edited by [User] on [Date]"
```

**Why Manual?**
- USD invoices only show supplier's price
- Shipping, customs, taxes vary by shipment
- Not possible to auto-calculate
- Need accurate costs for profitability

**Success Criteria:**
- User can input actual cost
- Cost breakdown documented in notes
- Edit history tracked
- All costs recalculated

---

## Reception & DOA Tracking Flow

### Recording Dead on Arrival (DOA)

```
Shipment arrives (15-24 hours window)
       ↓
Dashboard shows alert:
  "⏰ DOA Check Due: Shipment #1234"
  "Must be completed within 24 hours"
       ↓
User clicks "Record DOA"
       ↓
DOA Recording form:
  - Shipment: #1234 (read-only)
  - Received: [Date] at [Time] (read-only)
  - Hours since arrival: 18 hours ⚠️
  - List of all fish in shipment:
       ↓
For each fish species:
  ┌─────────────────────────────────┐
  │ Pterophyllum scalare (Angelfish)│
  │ Received: 100 fish              │
  │ DOA Count: [____] fish          │
  │ Photos: [Upload]                │
  │ Notes: [____________]           │
  └─────────────────────────────────┘
       ↓
User enters DOA counts
       ↓
[Any fish with 40%+ mortality]
  → Show warning:
    "⚠️ High Mortality Alert"
    "Angelfish: 45 DOA (45%)"
    "This will be flagged for review"
       ↓
User adds photos:
  - Photos of deceased fish
  - Photos of water condition
  - Photos of packaging
       ↓
User adds notes per species:
  - "Many fish already decomposing"
  - "Packaging was damaged"
  - "Water temperature very cold"
       ↓
User reviews summary:
  - Total received: 500 fish
  - Total DOA: 75 fish (15%)
  - Survival rate: 85%
       ↓
User clicks "Submit DOA Report"
       ↓
Create mortality event documents:
  - For each species with DOA
  - phase: "reception"
  - type: "doa"
  - quantity: [DOA count]
  - photos: [uploaded files]
  - notes: [user notes]
  - recordedBy: userId
  - timestamp: now
       ↓
Update fish instances:
  - Subtract DOA from quantity
  - Set survival rate
  - Update mortality stats:
    - reception.doa: [count]
    - totalMortality: [count]
    - mortalityRate: [percentage]
       ↓
Recalculate arrival cost:
  Formula: (invoiceCost × originalQty) / (originalQty - DOA)
  Example: ($10 × 100) / (100 - 15) = $11.76 per fish
       ↓
[If 40%+ threshold reached]
  → Send alert to owner:
    - Push notification
    - Email
    - Dashboard badge
  → Create alert document:
    - type: "high_mortality"
    - severity: "high"
    - shipmentId
    - mortalityRate: 45%
    - requiresReview: true
       ↓
Update supplier metrics:
  - Increment total DOA count
  - Calculate supplier reliability
  - Flag if pattern of high DOA
       ↓
Show success message:
  "DOA report submitted"
  "Arrival cost updated: $11.76/fish"
  [If alert] "⚠️ High mortality flagged for owner review"
       ↓
Navigate to Shipment Details page
       ↓
Page shows:
  - Updated quantities
  - DOA statistics
  - Cost breakdown:
    - Invoice cost: $10.00
    - Arrival cost: $11.76 ↑
    - Current cost: $11.76
  - Timeline showing DOA event
  - Photos and notes
```

**Success Criteria:**
- DOA recorded within 24-hour window
- Quantities updated correctly
- Arrival cost recalculated
- Supplier metrics updated
- Owner alerted if threshold reached
- Photos and notes saved

**Business Rules:**
- Must be recorded within 24 hours of arrival
- After 24 hours, deaths are "post-reception"
- DOA affects supplier evaluation
- 40%+ triggers automatic alert
- Owner must review high mortality

---

## Daily Check Flow

### Two-Person Daily Check

**Phase 1: Employee Morning Check**

```
7:00 AM - Automated scheduled check appears
       ↓
Employee dashboard shows:
  "📋 Daily Checks - 5 pending"
       ↓
Employee clicks "Start Daily Checks"
       ↓
Check list page shows all aquariums:
  ┌─────────────────────────────┐
  │ Aquarium A1                 │
  │ 3 species, 250 fish         │
  │ Last checked: Yesterday     │
  │ [Start Check]               │
  └─────────────────────────────┘
       ↓
Employee clicks "Start Check" for Aquarium A1
       ↓
Check form opens:
  Aquarium: A1
  Time: 7:15 AM
  Checked by: [Employee Name]
       ↓
For each fish species in aquarium:
  ┌─────────────────────────────────┐
  │ Pterophyllum scalare            │
  │ Current quantity: 95 fish       │
  │ Mortality: [____] fish          │
  │ Condition: [Dropdown]           │
  │   - Good ✓                      │
  │   - Fair                        │
  │   - Poor                        │
  │   - Critical                    │
  │ Notes: [____________]           │
  └─────────────────────────────────┘
       ↓
Employee enters data:
  - Mortality count: 2 fish died
  - Condition: Good
  - Notes: "Eating well, active"
       ↓
[Optional] Add photos:
  - Photo of aquarium
  - Photo of any issues
       ↓
Employee marks:
  ☑ Water parameters checked
  ☑ Fish fed
  ☑ Equipment functioning
       ↓
Employee clicks "Complete Check"
       ↓
Save check document (status: "employee_complete")
       ↓
Create mortality events:
  - For each species with deaths
  - phase: "post_reception"
  - type: "daily_mortality"
  - quantity: 2
  - recordedBy: employeeId
       ↓
Update fish quantities:
  - Old quantity: 95
  - New quantity: 93 (95 - 2)
       ↓
Recalculate current cost:
  Formula: (invoiceCost × originalQty) / currentQty
  Cost increases as fish die
       ↓
[Check for 40% threshold]
  - If total mortality ≥ 40%:
    → Alert owner immediately
       ↓
Show success message:
  "Aquarium A1 check complete"
  "2 deaths recorded"
       ↓
Return to check list:
  ✓ Aquarium A1 - Awaiting owner review
  ⏳ Aquarium A2 - Pending
  ⏳ Aquarium A3 - Pending
```

**Phase 2: Owner Review (Later in Day)**

```
Owner dashboard shows:
  "📋 Daily Checks - 3 awaiting review"
       ↓
Owner clicks "Review Daily Checks"
       ↓
Check list shows checks ready for review:
  ┌─────────────────────────────────┐
  │ Aquarium A1                     │
  │ Checked by: John at 7:15 AM     │
  │ 2 deaths (Angelfish)            │
  │ Condition: Good                 │
  │ [Review]                        │
  └─────────────────────────────────┘
       ↓
Owner clicks "Review"
       ↓
Review form shows:
  - Employee's entries (read-only)
  - Mortality count: 2
  - Current condition: Good
  - Photos
  - Notes: "Eating well, active"
       ↓
Owner section (editable):
  Treatment needed? [Yes/No]
       ↓
[If Yes]
  → Treatment form:
    - Issue description: [____________]
    - Treatment plan: [____________]
    - Medication: [____________]
    - Dosage: [____________]
    - Duration: [____] days
    - Estimated cost: [____]
       ↓
[If No]
  → Just add notes: [____________]
       ↓
Owner adds notes:
  "Normal mortality rate. No treatment needed."
       ↓
Owner clicks "Finalize Check"
       ↓
Update check document (status: "complete")
       ↓
[If treatment added]
  → Add to fish treatment history
  → Create treatment alert
  → Set follow-up reminder
       ↓
Show success message:
  "Daily check finalized"
       ↓
Return to list - check marked as ✓ Complete
```

**Enforcement Rules:**

**Reception Fish (First Week):**
```
Daily check is ENFORCED
       ↓
[Check not completed by 10 PM]
  → Send reminder notification
  → Show warning on dashboard
       ↓
[Check still not done by midnight]
  → Alert owner:
    "Daily check missed - Shipment #1234"
  → Log compliance issue
  → Flag in reports
```

**Growth Fish:**
```
Daily check is OPTIONAL but tracked
       ↓
Employee can skip check:
  - Click "Skip Today"
  - Select reason:
    - Weekend
    - Holiday
    - Low risk
    - Other
  - Add note (optional)
       ↓
[Check skipped]
  → Record skip in database
  → Calculate cost of no monitoring
  → Track skip frequency
       ↓
[Too many skips]
  → Alert: "Angelfish not checked in 5 days"
  → Remind to schedule check
```

**Success Criteria:**
- Employee completes morning check
- Mortality recorded accurately
- Owner reviews and finalizes
- Treatment plans documented
- Compliance tracked
- Costs recalculated

---

## Growth Tracking Flow

### Monthly Size Measurement

```
1st of month - System generates scheduled measurement
       ↓
Dashboard shows:
  "📏 Growth Measurement Due"
  "Pterophyllum scalare (Angelfish)"
  "Last measured: 30 days ago"
       ↓
Employee clicks "Measure Growth"
       ↓
Measurement form:
  Fish: Pterophyllum scalare
  Target size: 10cm
  Current recorded size: 5cm
  Days since last measurement: 30
       ↓
Measurement entry:
  - Measurement method:
    - Length (cm)
    - Weight (g)
    - Both
  - Current size: [____] cm
  - Current weight: [____] g (optional)
  - Health notes: [____________]
  - Photos: [Upload]
       ↓
Employee measures and enters:
  - Size: 6.5 cm
  - Weight: 15g
  - Notes: "Healthy, good coloration"
  - Uploads photo
       ↓
System calculates growth:
  - Previous size: 5cm
  - Current size: 6.5cm
  - Growth: 1.5cm in 30 days
  - Average growth per month: 1.5cm
  - Growth rate: 30% increase
       ↓
System calculates projection:
  - Target size: 10cm
  - Current size: 6.5cm
  - Remaining growth needed: 3.5cm
  - At current rate (1.5cm/month):
    Estimated time to target: 2.3 months (70 days)
       ↓
[Check if growth is slower than expected]
  Expected growth: 2cm/month
  Actual growth: 1.5cm/month
  → Show warning:
    "⚠️ Growth slower than expected"
    "Consider reviewing feed and water parameters"
       ↓
Employee clicks "Save Measurement"
       ↓
Update fish instance:
  - Add to sizeHistory array:
    {
      date: now,
      size: 6.5,
      weight: 15,
      measuredBy: employeeId,
      notes: "...",
      photos: [...]
    }
  - Update growthTracking:
    - currentSize: 6.5
    - averageGrowthPerMonth: 1.5
    - estimatedDaysToTarget: 70
       ↓
Generate next scheduled measurement:
  - Date: 1 month from now
  - Type: "growth_measurement"
  - Fish: [fishId]
       ↓
Show success message:
  "Measurement recorded"
  "Estimated ready for sale: [Date]"
       ↓
Navigate to Growth Tracking dashboard
       ↓
Dashboard shows:
  ┌─────────────────────────────────┐
  │ Pterophyllum scalare            │
  │ Progress: ████████░░ 65%        │
  │ Current: 6.5cm → Target: 10cm   │
  │ Growth rate: 1.5cm/month        │
  │ Est. ready: March 15, 2025      │
  │ [View History] [Measure Now]    │
  └─────────────────────────────────┘
       ↓
User can click "View History" to see:
  - Growth chart (size over time)
  - All measurements in timeline
  - Photos at each measurement
  - Growth rate trends
  - Cost accumulation over time
```

**Success Criteria:**
- Measurement recorded monthly
- Growth rate calculated
- Time to target estimated
- Slow growth flagged
- Next measurement scheduled

---

## Treatment Alert Flow

### Proactive Treatment Alert

```
User imports new shipment from Excel
       ↓
System processes each fish species:
  For: Pterophyllum scalare (Angelfish)
       ↓
Query treatment history:
  - Check current fish instances
  - Check past treatments for same species
  - Look back 6 months
       ↓
[No previous issues found]
  → No alert
  → Continue import
       ↓
[Previous treatment found]
  → Generate treatment alert:
    {
      type: "treatment_history",
      severity: "medium",
      fishSpecies: "Pterophyllum scalare",
      historicalIssue: "ICH (white spot disease)",
      lastOccurrence: "3 months ago",
      treatmentUsed: "Malachite green",
      success: true,
      duration: "5 days",
      notes: "Effective, full recovery"
    }
       ↓
Import continues, shipment created
       ↓
User navigates to Shipment Details
       ↓
Alert banner shows:
  ┌─────────────────────────────────────┐
  │ ⚠️ Treatment History Alert          │
  │                                     │
  │ Pterophyllum scalare had ICH        │
  │ 3 months ago in this farm.          │
  │                                     │
  │ Treatment: Malachite green (5 days) │
  │ Result: ✓ Successful                │
  │                                     │
  │ Recommendation:                     │
  │ • Monitor closely for white spots   │
  │ • Check water parameters daily      │
  │ • Have medication ready             │
  │                                     │
  │ [View Details] [Dismiss]            │
  └─────────────────────────────────────┘
       ↓
User clicks "View Details"
       ↓
Treatment History modal shows:
  - Timeline of all past treatments for this species
  - Success rates by treatment type
  - Photos from previous cases
  - Links to related fish instances
  - Preventive measures recommended
       ↓
User reviews information
       ↓
User can take actions:
  - Set up preventive treatment plan
  - Schedule extra daily checks
  - Add notes to shipment
  - Dismiss alert
       ↓
[User sets up preventive plan]
  → Create task:
    "Monitor Angelfish for ICH symptoms"
    Assigned to: [Employee]
    Due: Daily for 2 weeks
       ↓
[Week later - Symptoms appear]
  → Employee records in daily check:
    "White spots appearing on fins"
       ↓
System suggests treatment:
  "Based on previous success, recommended treatment:
   Malachite green - 5 day course"
       ↓
Owner reviews and approves treatment
       ↓
Treatment added to fish history:
  - Issue: ICH
  - Treatment: Malachite green
  - Started: [Date]
  - Duration: 5 days
  - Success: [To be determined]
       ↓
System tracks treatment outcome:
  - Did fish recover?
  - How long did it take?
  - Any side effects?
  - Cost of treatment
       ↓
Add to knowledge base:
  - Species: Pterophyllum scalare
  - Issue: ICH
  - Treatment: Malachite green
  - Success: Yes
  - This helps future shipments
```

**Success Criteria:**
- Alert shows on import if history exists
- Recommendations are actionable
- Treatment tracked from start to end
- Outcomes recorded for future use
- Knowledge base grows over time

---

## Aquarium Management Flow

### Assigning Fish to Aquariums

```
New shipment arrived and DOA recorded
       ↓
Shipment Details page shows:
  "Fish need aquarium assignment"
       ↓
User clicks "Assign to Aquariums"
       ↓
Assignment interface:
  Left side: Unassigned Fish
  ┌─────────────────────────────────┐
  │ Pterophyllum scalare            │
  │ 93 fish remaining               │
  │ Size: 5cm                       │
  │ [Assign]                        │
  └─────────────────────────────────┘

  Right side: Available Aquariums
  ┌─────────────────────────────────┐
  │ Aquarium A1                     │
  │ Capacity: 100 fish              │
  │ Current: 50 fish (50% full)     │
  │ Species: 2                      │
  │ [Assign Here]                   │
  └─────────────────────────────────┘
       ↓
User selects fish and aquarium
       ↓
Assignment form:
  - Fish: Pterophyllum scalare
  - Quantity to assign: [____] / 93
  - Target aquarium: A1
  - Notes: [____________]
       ↓
[Check capacity]
  Current: 50
  Adding: 93
  Total: 143
  Capacity: 100
  → Warning: "Aquarium will be overcrowded (143%)"
       ↓
User adjusts:
  - Split fish across multiple aquariums
  - Or increase aquarium capacity
  - Or select different aquarium
       ↓
User assigns:
  - 50 fish to Aquarium A1 (now 100% full)
  - 43 fish to Aquarium A2 (now 43% full)
       ↓
System updates:
  - Create aquarium_assignments
  - Update fish instances with aquariumId
  - Update aquarium occupancy
  - Generate daily checks for these aquariums
       ↓
Show success:
  "Fish assigned successfully"
  "Aquarium A1: 50 fish added"
  "Aquarium A2: 43 fish added"
```

**Success Criteria:**
- All fish assigned to aquariums
- Capacity limits respected
- Assignments tracked
- Daily checks generated

---

## Customer Portal Flow

### Customer Viewing Live Inventory

```
Customer logs in with customer account
       ↓
Customer Dashboard shows:
  - My Supplier: [Farm Name]
  - Available Fish
  - My Orders
  - Contact Info
       ↓
Customer clicks "Available Fish"
       ↓
Inventory page (filtered view):
  - Only shows fish with lifecycle: "sale-ready"
  - Real-time quantities
  - No pricing info until owner approves
       ↓
Search and filter:
  - By species name
  - By size
  - By availability
  - Sort by: newest, quantity, size
       ↓
Customer finds fish:
  ┌─────────────────────────────────┐
  │ Pterophyllum scalare (Angelfish)│
  │ Size: 10cm                      │
  │ Available: 85 fish              │
  │ Quality: ★★★★★                  │
  │ [Request Price] [View Details]  │
  └─────────────────────────────────┘
       ↓
Customer clicks "View Details"
       ↓
Fish details page shows:
  - Photos
  - Scientific name
  - Common name (Hebrew + English)
  - Size
  - Current quantity
  - Quality indicators (low mortality, good growth)
  - Health status: Excellent
  - Available since: [Date]
       ↓
Customer clicks "Request Price"
       ↓
Price request form:
  - Quantity needed: [____]
  - Delivery date: [____]
  - Notes: [____________]
       ↓
Customer submits request
       ↓
[Notification sent to farm owner]
  "New price request from [Customer]"
  "Angelfish: 50 fish"
       ↓
Owner reviews:
  - Customer relationship
  - Quantity requested
  - Current costs
  - Market prices
  - Calculate wholesale price
       ↓
Owner sends quote:
  - Price per fish: ₪15.00
  - Total: ₪750.00
  - Delivery: [Date]
  - Valid until: [Date]
       ↓
Customer receives notification
       ↓
Customer reviews quote:
  "Quote received: ₪750 for 50 Angelfish"
  [Accept] [Negotiate] [Decline]
       ↓
[Customer accepts]
  → Create order document
  → Reserve fish quantity
  → Send confirmation to both parties
       ↓
Order tracking:
  - Order placed
  - Payment pending
  - Preparing shipment
  - In transit
  - Delivered
```

**Success Criteria:**
- Customer sees only sale-ready fish
- Real-time inventory updates
- Price request workflow
- Order tracking
- Both parties notified

---

## Key User Flows Summary

| Flow | User Role | Frequency | Complexity | Priority |
|------|-----------|-----------|------------|----------|
| Login | All | Daily | Low | Critical |
| Excel Import | Owner/Employee | Weekly | High | Critical |
| Manual Pricing | Owner | As needed | Medium | High |
| DOA Recording | Employee | Per shipment | Medium | Critical |
| Daily Checks | Employee+Owner | Daily | Medium | High |
| Growth Measurement | Employee | Monthly | Low | High |
| Treatment Alert | Owner | Per import | Medium | High |
| Aquarium Assignment | Employee | Per shipment | Medium | Medium |
| Customer Portal | Customer | Daily | Medium | Future |

---

## Mobile Considerations

### Touch Optimizations
- Buttons: Minimum 44×44px
- Swipe gestures: Left/right to navigate
- Pull to refresh: Update data
- Long press: Show context menu
- Double tap: Quick actions

### Offline Support
- Cache last viewed shipments
- Queue actions when offline
- Sync when back online
- Show offline indicator

### Camera Integration
- Quick photo capture
- Multiple photos per event
- Photo annotation
- Auto-compress before upload

---

**Last Updated:** December 2024
**Version:** 1.0
**Status:** Planning Phase
