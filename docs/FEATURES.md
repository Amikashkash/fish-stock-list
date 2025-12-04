# Fish Farm Management System - Features

## Feature Overview

This document outlines all features of the Fish Farm Management System, organized by user role and priority.

---

## User Roles

### Owner
- Full access to all features
- Can manage farm settings and members
- Reviews treatment decisions
- Accesses financial reports

### Employee
- Daily operations management
- Performs daily checks
- Records mortality
- Manages aquariums
- Limited financial access

### Customer (Future Phase)
- View available fish
- Real-time inventory
- Place orders
- View order history
- Limited to assigned farm

---

## Phase 1: Foundation + Excel Import (Weeks 1-2)

### 1.1 Authentication
**Priority:** Critical
**User Story:** As a farm owner, I need secure access to my farm data

**Features:**
- ✅ Email/password authentication
- ✅ Google Sign-In
- ✅ Password reset via email
- ✅ Email verification
- ✅ Remember me functionality
- ✅ Secure logout

**Technical:**
- Firebase Auth
- Session persistence
- Role-based access control

---

### 1.2 User Management
**Priority:** Critical
**User Story:** As a farm owner, I need to manage my team members

**Features:**
- Create user profile on registration
- Associate users with farms
- Assign roles (owner, employee, customer)
- Invite new members via email
- Remove members
- View member activity logs

**Technical:**
- User collection in Firestore
- Farm membership subcollection
- Email invitation system
- Role-based security rules

---

### 1.3 Farm Management
**Priority:** Critical
**User Story:** As an owner, I need to manage my farm settings

**Features:**
- Create new farm
- Edit farm details (name, location, contact)
- Set default currency (ILS/USD)
- Configure notification preferences
- Set mortality thresholds (default: 40%)
- Manage farm logo/branding

**Technical:**
- Farms collection in Firestore
- Farm settings subcollection
- Image upload to Firebase Storage

---

### 1.4 Excel Import System
**Priority:** Critical
**User Story:** As an owner, I need to import shipments from supplier Excel files

**Features:**
- Upload Excel file (.xlsx, .xls)
- Parse standard template format
- Validate data before import
- Preview parsed data
- Edit data before confirming import
- Handle missing codes (create dummy codes)
- Support both ILS and USD pricing
- Show import progress
- Display import summary
- Error handling for invalid files

**Standard Template Fields:**
1. Code (SKU)
2. Cart number
3. Scientific name
4. Common name (Hebrew)
5. Size
6. Number of bags
7. Quantity per bag
8. Total quantity
9. Packing ratio
10. Part of cart (%)
11. Price per fish
12. Currency (ILS/USD)

**Technical:**
- Excel parsing library (SheetJS/xlsx)
- Client-side validation
- Batch Firestore writes
- Transaction support for consistency
- Error recovery

---

## Phase 2: Shipments + Pricing (Weeks 3-4)

### 2.1 Shipment Management
**Priority:** Critical
**User Story:** As an owner, I need to track all incoming shipments

**Features:**
- View all shipments (list + grid view)
- Search/filter shipments
- Sort by date, supplier, total value
- View shipment details
- Edit shipment information
- Track shipment status (in-transit, received, processing)
- Record supplier information
- Attach documents (PDF invoices, photos)
- Delete shipments (with confirmation)

**Shipment Details Include:**
- Shipment ID
- Date received
- Supplier name
- Total items
- Total cost
- Currency
- Edit history
- Associated fish instances

**Technical:**
- Shipments collection
- Edit history tracking
- File upload to Storage
- Pagination for large lists

---

### 2.2 Manual Price Editing
**Priority:** High
**User Story:** As an owner, I need to adjust USD prices to include all costs

**Features:**
- Edit price per fish (manual input)
- Add notes explaining price changes
- Record shipping costs
- Record customs/tax costs
- Record handling fees
- Calculate actual cost per fish
- Show invoice price vs actual cost
- Track all price edits with timestamp
- Display who made changes

**Why Manual?**
- USD invoices only show base price
- Shipping, customs, tax vary by shipment
- Need to add these costs to calculate true ILS price
- Most invoices already in ILS (no conversion needed)

**Technical:**
- Edit history array in shipment
- Decimal precision for currency
- Audit trail
- Price calculation formulas

---

### 2.3 SKU Code Management
**Priority:** High
**User Story:** As an employee, I need to handle fish that arrive without supplier codes

**Features:**
- Validate codes against master species list
- Flag missing codes
- Create dummy codes: `MISSING-{timestamp}-{randomId}`
- Visual indicator for missing codes (⚠️)
- Add real code later
- Search by code
- View code history
- Bulk code assignment

**Technical:**
- Fish species master collection
- Code validation logic
- Dummy code generator
- Code status tracking

---

## Phase 3: Reception Tracking (Weeks 5-6)

### 3.1 DOA (Dead on Arrival) Tracking
**Priority:** Critical
**User Story:** As an employee, I need to report fish that died during shipping

**Features:**
- Record DOA within 15-24 hours of arrival
- Input mortality count per fish type
- Add photos of deceased fish
- Add notes (condition, suspected cause)
- Calculate arrival cost (after DOA)
- Flag reception phase (15-24 hours)
- Distinguish DOA from post-reception deaths
- Alert if 40% mortality reached
- Affect supplier reliability metrics

**Key Distinction:**
- **Reception Phase:** Deaths within 15-24 hours (DOA)
  - Impacts supplier evaluation
  - Used for refund claims
- **Post-Reception Phase:** Deaths after 24 hours
  - Cost tracking only
  - Different cause analysis

**Technical:**
- Mortality events collection
- Phase tracking (reception vs post-reception)
- Photo upload to Storage
- Automated cost recalculation
- Supplier metrics aggregation

---

### 3.2 Cost Tracking System
**Priority:** Critical
**User Story:** As an owner, I need to know the true cost of my fish at every stage

**Three Cost Types:**

**1. Invoice Cost Per Fish**
- Price from supplier invoice
- Original cost before any mortality
- Used for accounting/taxes

**2. Arrival Cost Per Fish**
- Cost after DOA mortality
- Formula: `(invoiceCost × totalQuantity) / (totalQuantity - DOA)`
- Used for initial pricing decisions

**3. Current Cost Per Fish**
- Cost after ALL mortality (DOA + post-reception)
- Formula: `(invoiceCost × totalQuantity) / currentQuantity`
- Real-time cost that increases as fish die
- Used for profitability analysis

**Features:**
- Display all three costs
- Show cost progression over time
- Alert when current cost > wholesale price
- Cost analysis charts
- Export cost reports

**Technical:**
- Automated cost recalculation on mortality
- Real-time cost tracking
- Alert system for unprofitable fish

---

### 3.3 Mortality Threshold Alerts
**Priority:** High
**User Story:** As an owner, I need to be notified when mortality is excessive

**Features:**
- Set threshold per farm (default: 40%)
- Real-time monitoring
- Push notifications (Firebase Cloud Messaging)
- Email alerts to owner
- Dashboard warning badges
- Mortality rate charts
- Historical comparison
- Supplier performance tracking

**Technical:**
- Cloud Functions for monitoring
- FCM for notifications
- Email service integration
- Real-time listeners

---

## Phase 4: Growth Tracking (Weeks 7-8)

### 4.1 Fish Lifecycle Management
**Priority:** High
**User Story:** As an owner, I need to differentiate between short-term sale fish and long-term growth fish

**Lifecycle Types:**

**1. Short-Term (Most Fish)**
- Arrive ready for sale
- Daily mortality checks only
- Sell within weeks/months
- No size tracking needed

**2. Growth (Long-Term Fish)**
- Arrive small, grow to target size
- Monthly size measurements required
- Track growth rate
- Estimate days to sale-ready
- Health monitoring
- May take 6-12+ months

**Features:**
- Mark fish as "growth" lifecycle on import
- Set target size
- Schedule monthly measurements
- Record size history
- Calculate growth rate
- Estimate time to target
- Growth progress dashboard
- Alert when approaching target size

**Technical:**
- Lifecycle field in fish instance
- Growth tracking subcollection
- Scheduled check generation
- Growth rate calculations
- Predictive algorithms

---

### 4.2 Monthly Size Measurements
**Priority:** High
**User Story:** As an employee, I need to track how fast my growth fish are growing

**Features:**
- Scheduled monthly reminders
- Measurement form (current size, notes)
- Photo documentation
- Multiple measurement methods (length, weight)
- Measurement history timeline
- Growth charts (size over time)
- Compare to expected growth
- Health notes per measurement

**Technical:**
- Size history array in fish instance
- Reminder system
- Photo upload
- Chart visualization library
- Growth rate calculations

---

### 4.3 Growth Analytics
**Priority:** Medium
**User Story:** As an owner, I need to know when my growth fish will be ready for sale

**Features:**
- Current size vs target size
- Average growth per month
- Estimated days to target
- Growth rate comparison (expected vs actual)
- Slow growth alerts
- Health trend analysis
- Cost per growth period
- Profitability projections

**Technical:**
- Statistical calculations
- Linear regression for predictions
- Data visualization
- Cost accumulation over time

---

## Phase 5: Treatment System (Weeks 9-10)

### 5.1 Treatment History Tracking
**Priority:** High
**User Story:** As an owner, I need to remember what treatments worked or failed for each fish type

**Features:**
- Record every treatment per fish
- Issue description (disease, parasite, behavior)
- Treatment applied (medication, water change, isolation)
- Dosage and duration
- Success rating (worked/didn't work/partial)
- Cost of treatment
- Photos (before/after)
- Treatment timeline view
- Search treatments by species/issue

**Technical:**
- Treatment history array in fish instance
- Photo storage
- Treatment effectiveness tracking
- Searchable treatment database

---

### 5.2 Proactive Treatment Alerts
**Priority:** High
**User Story:** As an employee, when new fish arrive, I want to know if this species had problems before

**Features:**
- Auto-check on shipment import
- Alert if same species had issues before
- Show past treatments and success rates
- Recommend preventive measures
- Alert for fish currently in farm with same issue
- Cross-reference by scientific name
- Treatment recommendations

**Example Alert:**
> ⚠️ **Treatment History Found**
> This species (Pterophyllum scalare) had ICH 3 months ago.
> Treatment: Malachite green (5 days) - Success
> **Recommendation:** Monitor closely for white spots

**Technical:**
- Treatment alert generation on import
- Species matching algorithm
- Alert system
- Recommendation engine

---

### 5.3 Global Treatment Knowledge Base
**Priority:** Medium
**User Story:** As a farm owner, I want to learn from other farms' treatment experiences (anonymized)

**Features:**
- Share anonymized treatment data
- Browse treatments by species
- Filter by issue type
- Success rate statistics
- Most effective treatments
- Community recommendations
- Opt-in/out of sharing
- Privacy controls (no farm names)

**Privacy:**
- No farm identification
- No location data
- Only species, issue, treatment, success
- Fully anonymized

**Technical:**
- Global treatments collection
- Privacy-preserving aggregation
- Statistical analysis
- Search and filter system

---

## Phase 6: Daily Operations (Weeks 11+)

### 6.1 Flexible Daily Check System
**Priority:** High
**User Story:** As an employee, I need to perform daily mortality checks efficiently

**Two-Person Workflow:**

**Morning (Employee):**
1. Opens scheduled daily check
2. Counts mortality per aquarium
3. Records numbers
4. Takes photos if issues
5. Marks check complete

**Later (Owner):**
1. Reviews mortality numbers
2. Adds treatment notes/decisions
3. Updates fish conditions
4. Finalizes check

**Enforcement Rules:**

**Reception Fish (First Week):**
- ✅ **Enforced** - Must complete daily
- ⚠️ Alert if skipped
- Critical for DOA tracking
- Affects supplier metrics

**Growth Fish:**
- ⏸️ **Optional but tracked**
- Can skip with reason
- Tracks skip frequency
- Alerts if skipped too many days
- Records cost of skipping checks

**Features:**
- Daily check dashboard
- One-tap mortality entry
- Photo documentation
- Bulk actions (all aquariums)
- Skip check with reason
- Check history timeline
- Check compliance reports
- Late check warnings

**Technical:**
- Scheduled checks collection
- Check status tracking
- Reminder system
- Compliance monitoring
- Photo upload

---

### 6.2 Aquarium Management
**Priority:** High
**User Story:** As an employee, I need to manage multiple aquariums with different fish

**Features:**
- Create/edit aquariums
- Assign fish to aquariums
- Set aquarium capacity
- Track current occupancy
- Water parameters (temp, pH, ammonia, nitrite, nitrate)
- Equipment tracking (filters, heaters, lights)
- Maintenance schedule
- Aquarium status (active, maintenance, empty)
- Aquarium photos
- Move fish between aquariums
- Bulk operations

**Technical:**
- Aquariums collection
- Fish-aquarium relationships
- Water parameter history
- Maintenance scheduling

---

### 6.3 Task Management
**Priority:** Medium
**User Story:** As an owner, I need to assign tasks to employees and track completion

**Features:**
- Create tasks
- Assign to users
- Set priority (low, medium, high, urgent)
- Set due date
- Task categories (feeding, cleaning, maintenance, checks)
- Task status (pending, in-progress, completed, cancelled)
- Recurring tasks
- Task comments/notes
- Task completion photos
- Task history
- Overdue alerts
- Task reports

**Technical:**
- Tasks collection
- User assignments
- Status tracking
- Notification system
- Recurring task generation

---

## Phase 7: Customer Portal (Future)

### 7.1 Customer Access
**Priority:** Future
**User Story:** As a fish store owner, I want to see my supplier's live inventory

**Features:**
- Separate customer login
- View available fish (sale-ready only)
- Real-time inventory updates
- Search/filter fish
- View fish details (size, price, photos)
- Place orders
- Order history
- Delivery tracking
- Price lists (wholesale prices)
- New arrival notifications

**Technical:**
- Customer role in auth
- Filtered queries (sale-ready fish only)
- Order system
- Real-time updates

---

### 7.2 Order Management
**Priority:** Future
**User Story:** As an owner, I need to manage customer orders efficiently

**Features:**
- Review incoming orders
- Approve/reject orders
- Update order status
- Generate invoices
- Track payments
- Prepare shipments
- Print packing lists
- Order analytics

**Technical:**
- Orders collection
- Payment tracking
- Invoice generation
- Status workflow

---

## Phase 8: Reports & Analytics (Future)

### 8.1 Financial Reports
**Priority:** Future
**User Story:** As an owner, I need financial insights into my farm operations

**Reports:**
- Profit/loss per shipment
- Cost analysis over time
- Mortality cost impact
- Treatment costs
- Best/worst suppliers
- Most profitable species
- Revenue projections
- Tax reports

**Technical:**
- Aggregation queries
- Report generation
- Export to PDF/Excel
- Chart visualizations

---

### 8.2 Operational Reports
**Priority:** Future
**User Story:** As an owner, I need to understand my farm's operational efficiency

**Reports:**
- Daily check compliance
- Mortality trends
- Growth rates by species
- Aquarium utilization
- Task completion rates
- Employee performance
- Supplier reliability
- Treatment effectiveness

**Technical:**
- Data aggregation
- Statistical analysis
- Trend visualization
- Export functionality

---

## Mobile-Specific Features

### Offline Support
- Cache critical data
- Queue actions when offline
- Sync when back online
- Offline indicator

### Mobile Optimizations
- Touch-friendly buttons (min 44×44px)
- Swipe gestures
- Pull to refresh
- Bottom navigation
- Camera integration
- Push notifications
- Responsive images
- Fast load times

---

## Non-Functional Requirements

### Performance
- Page load < 2 seconds
- Real-time updates < 500ms
- Support 10,000+ fish instances
- Efficient image loading
- Optimized queries

### Security
- End-to-end encryption
- Role-based access control
- Audit logs
- Secure file upload
- Input validation
- XSS prevention
- CSRF protection

### Accessibility
- WCAG 2.1 Level AA
- Screen reader support
- Keyboard navigation
- High contrast mode
- Text scaling

### Internationalization
- Hebrew (RTL support)
- English
- Currency formatting
- Date/time localization
- Number formatting

---

## Feature Priority Matrix

| Feature | Priority | Complexity | Value | Phase |
|---------|----------|------------|-------|-------|
| Authentication | Critical | Low | High | 1 |
| Excel Import | Critical | High | High | 1 |
| Shipment Management | Critical | Medium | High | 2 |
| Manual Pricing | High | Low | High | 2 |
| DOA Tracking | Critical | Medium | High | 3 |
| Cost Tracking | Critical | High | High | 3 |
| Growth Tracking | High | High | High | 4 |
| Treatment System | High | High | Medium | 5 |
| Daily Checks | High | Medium | High | 6 |
| Aquarium Management | High | Medium | Medium | 6 |
| Task Management | Medium | Low | Medium | 6 |
| Customer Portal | Low | High | Medium | 7 |
| Reports | Low | High | Medium | 8 |

---

## Success Metrics

### User Engagement
- Daily active users
- Time spent per session
- Feature adoption rates
- Daily check completion rate

### Business Impact
- Mortality reduction
- Cost savings from better tracking
- Time saved on manual processes
- Supplier selection improvements
- Treatment success rate increase

### System Health
- Uptime (target: 99.9%)
- Response time (target: < 2s)
- Error rate (target: < 0.1%)
- User satisfaction score

---

**Last Updated:** December 2024
**Version:** 1.0
**Status:** Planning Phase
