# Shipment Import Template Guide

## Overview

This guide explains how to format your Excel shipment files for import into the Fish Farm Management System.

**For International Users:** This template works with any Excel version worldwide. Column order and naming are critical for successful import.

---

## Quick Start

1. Download the template: `shipment-template.xlsx`
2. Fill in your data (see examples below)
3. Save as `.xlsx` or `.xls` format
4. Upload to the system

---

## Required Columns

The system expects these **12 columns in this exact order:**

| # | Column Name | Required? | Data Type | Example | Notes |
|---|-------------|-----------|-----------|---------|-------|
| 1 | Code | Optional | Text | `ANG-001` | Supplier SKU code |
| 2 | Cart | Required | Number | `1` | Shipment cart/batch number |
| 3 | Scientific Name | Required | Text | `Pterophyllum scalare` | Latin name |
| 4 | Common Name | Required | Text | `מלאך` (Angelfish) | Local name |
| 5 | Size | Required | Text | `5-6cm` | Fish size |
| 6 | Bags | Required | Number | `10` | Number of bags |
| 7 | Qty/Bag | Required | Number | `10` | Fish per bag |
| 8 | Total | Required | Number | `100` | Total quantity |
| 9 | Packing Ratio | Optional | Text | `1:3` | Packing density |
| 10 | Part of Cart | Optional | Number | `20` | Percentage of cart (%) |
| 11 | Price | Required | Number | `10.50` | Price per fish |
| 12 | Currency | Required | Text | `ILS` or `USD` | Currency code |

---

## Column Details

### 1. Code (Supplier SKU)

**Purpose:** Unique identifier from supplier
**Format:** Text (alphanumeric)
**Examples:**
- `ANG-001`
- `TETRA-NEON-005`
- `SKU12345`

**If Missing:**
- Leave cell empty
- System will generate: `MISSING-{timestamp}-{id}`
- You can add the real code later
- ⚠️ Missing codes will be visually flagged

**Why Optional:**
Sometimes fish arrive without codes, or suppliers don't provide them. The system handles this gracefully.

---

### 2. Cart Number

**Purpose:** Groups fish from same shipment batch
**Format:** Whole number (1, 2, 3...)
**Example:** `1`

**Usage:**
- Single cart: Use `1` for all rows
- Multiple carts: Use `1`, `2`, `3` for different batches
- Helps track which fish came together

---

### 3. Scientific Name

**Purpose:** Internationally recognized species name
**Format:** Text (Latin name)
**Examples:**
- `Pterophyllum scalare`
- `Paracheirodon innesi`
- `Carassius auratus`

**Important:**
- Use correct Latin spelling
- System matches species by this name
- Critical for treatment history matching

---

### 4. Common Name

**Purpose:** Local/market name for the fish
**Format:** Text (any language)
**Examples:**
- Hebrew: `מלאך`, `נאון`, `דג זהב`
- English: `Angelfish`, `Neon Tetra`, `Goldfish`

**Notes:**
- Can be in any language
- Used for display to users
- RTL languages (Hebrew, Arabic) supported

---

### 5. Size

**Purpose:** Current size of fish
**Format:** Text (flexible format)
**Examples:**
- `5-6cm` (length range)
- `8cm` (single length)
- `Large` (qualitative)
- `3-4 inches` (imperial)
- `15g` (weight)

**Notes:**
- No strict format required
- Can include units or be descriptive
- Used for display and sorting

---

### 6. Bags (Number of Bags)

**Purpose:** How many bags/containers
**Format:** Whole number
**Example:** `10`

**Usage:**
- Helps verify counts
- Formula check: `Bags × Qty/Bag = Total`
- Useful for unpacking logistics

---

### 7. Qty/Bag (Quantity per Bag)

**Purpose:** How many fish in each bag
**Format:** Whole number
**Example:** `10`

**Usage:**
- Helps verify counts
- Formula check: `Bags × Qty/Bag = Total`
- Useful for distribution

---

### 8. Total (Total Quantity)

**Purpose:** Total number of fish
**Format:** Whole number
**Example:** `100`

**Important:**
- Should equal: `Bags × Qty/Bag`
- System validates this formula
- If mismatch, you'll be asked to confirm

---

### 9. Packing Ratio

**Purpose:** Bag water to fish ratio
**Format:** Text (ratio format)
**Examples:**
- `1:3` (1 part fish, 3 parts water)
- `1:2`
- `1:1` (dense packing)

**Usage:**
- Optional metadata
- Helps assess packing quality
- Reference for future shipments

---

### 10. Part of Cart (Percentage)

**Purpose:** What percentage of cart this species represents
**Format:** Number (0-100, without % symbol)
**Examples:**
- `20` means 20%
- `50` means 50%
- `100` means entire cart

**Usage:**
- Optional metadata
- Helps understand cart composition
- Useful for cost allocation

---

### 11. Price (Price per Fish)

**Purpose:** Cost per individual fish
**Format:** Number (decimal allowed)
**Examples:**
- `10.50` (ten and a half)
- `5` (whole number)
- `0.75` (less than 1)

**Important:**
- Enter price as number only, no currency symbols
- Decimal separator: Use `.` (period)
- **For USD Invoices:** This is just the supplier price
  - You'll add shipping, customs, fees later in the system
  - See "Manual Pricing" section below

---

### 12. Currency

**Purpose:** Currency of the price
**Format:** Text (currency code)
**Accepted Values:**
- `ILS` (Israeli Shekel)
- `USD` (US Dollar)

**Important:**
- Must be exactly `ILS` or `USD`
- Case-insensitive (`ils`, `ILS`, `Ils` all work)
- No symbols (`$`, `₪` not accepted here)

---

## Complete Example

### Example 1: Single Species Shipment

| Code | Cart | Scientific Name | Common Name | Size | Bags | Qty/Bag | Total | Packing Ratio | Part of Cart | Price | Currency |
|------|------|----------------|-------------|------|------|---------|-------|---------------|--------------|-------|----------|
| ANG-001 | 1 | Pterophyllum scalare | מלאך | 5-6cm | 10 | 10 | 100 | 1:3 | 100 | 12.50 | ILS |

**Result:** 100 Angelfish, ₪12.50 each, total ₪1,250

---

### Example 2: Multiple Species Shipment

| Code | Cart | Scientific Name | Common Name | Size | Bags | Qty/Bag | Total | Packing Ratio | Part of Cart | Price | Currency |
|------|------|----------------|-------------|------|------|---------|-------|---------------|--------------|-------|----------|
| ANG-001 | 1 | Pterophyllum scalare | מלאך | 5-6cm | 10 | 10 | 100 | 1:3 | 40 | 12.50 | ILS |
| NEON-005 | 1 | Paracheirodon innesi | נאון | 2cm | 5 | 20 | 100 | 1:2 | 40 | 2.50 | ILS |
| GOLD-010 | 1 | Carassius auratus | דג זהב | 8-10cm | 5 | 10 | 50 | 1:3 | 20 | 8.00 | ILS |

**Result:**
- 100 Angelfish @ ₪12.50 = ₪1,250
- 100 Neon Tetras @ ₪2.50 = ₪250
- 50 Goldfish @ ₪8.00 = ₪400
- **Total: 250 fish, ₪1,900**

---

### Example 3: Missing Codes

| Code | Cart | Scientific Name | Common Name | Size | Bags | Qty/Bag | Total | Packing Ratio | Part of Cart | Price | Currency |
|------|------|----------------|-------------|------|------|---------|-------|---------------|--------------|-------|----------|
| ANG-001 | 1 | Pterophyllum scalare | מלאך | 5-6cm | 10 | 10 | 100 | 1:3 | 50 | 12.50 | ILS |
| | 1 | Betta splendens | לוחם | 5cm | 10 | 10 | 100 | 1:2 | 50 | 15.00 | ILS |

**Result:**
- Row 1: Code `ANG-001` ✓
- Row 2: System generates `MISSING-1702345678-abc123` ⚠️
- Both import successfully
- Missing code can be added later

---

### Example 4: USD Pricing (Needs Manual Adjustment)

| Code | Cart | Scientific Name | Common Name | Size | Bags | Qty/Bag | Total | Packing Ratio | Part of Cart | Price | Currency |
|------|------|----------------|-------------|------|------|---------|-------|---------------|--------------|-------|----------|
| OSCAR-001 | 1 | Astronotus ocellatus | אוסקר | 3-4cm | 20 | 5 | 100 | 1:3 | 100 | 10.00 | USD |

**Import:** $10.00 per fish (supplier price only)

**After Import - Manual Pricing:**
```
Invoice price: $10.00
+ Shipping per fish: $2.00 (calculated: $2000 shipping / 100 fish)
+ Customs/tax: $1.50 (15% of $10)
+ Handling: $0.50 (fees distributed)
= Actual cost: $14.00 per fish
```

You'll enter this in the system after import. See "Manual Pricing Workflow" below.

---

## Validation Rules

The system validates your data before import:

### ✅ Pass Conditions

| Rule | Example Pass | Example Fail |
|------|-------------|--------------|
| Total = Bags × Qty/Bag | 10 × 10 = 100 ✓ | 10 × 10 ≠ 95 ✗ |
| Price is positive number | 12.50 ✓ | -5 ✗ or "free" ✗ |
| Currency is ILS or USD | USD ✓ | EUR ✗ or $ ✗ |
| Scientific name present | Pterophyllum scalare ✓ | [empty] ✗ |
| Total quantity > 0 | 100 ✓ | 0 ✗ |

### Validation Errors

If validation fails, you'll see:
```
⚠️ Validation Errors Found

Row 3: Total (95) doesn't match Bags × Qty/Bag (100)
Row 5: Currency "EUR" is not valid. Use ILS or USD.
Row 7: Scientific name is required

Fix these issues and try again, or edit inline.
```

You can:
1. **Fix in Excel** and re-upload
2. **Edit inline** in the preview screen

---

## Common Mistakes

### ❌ Mistake 1: Including Currency Symbols

**Wrong:**
```
| Price | Currency |
|-------|----------|
| $10   | USD      |
| ₪15   | ILS      |
```

**Correct:**
```
| Price | Currency |
|-------|----------|
| 10    | USD      |
| 15    | ILS      |
```

---

### ❌ Mistake 2: Wrong Decimal Separator

**Wrong:**
```
| Price |
|-------|
| 10,50 | ← Comma (European style)
```

**Correct:**
```
| Price |
|-------|
| 10.50 | ← Period (International standard)
```

---

### ❌ Mistake 3: Extra Columns or Wrong Order

**Wrong:**
```
| Common Name | Scientific Name | Code | ... |
```

**Correct:**
```
| Code | Cart | Scientific Name | Common Name | ... |
```

**Order matters!** Follow the template exactly.

---

### ❌ Mistake 4: Merged Cells or Formatting

**Wrong:**
- Merged header cells
- Multiple header rows
- Empty rows in the middle
- Colorful backgrounds (okay, but unnecessary)

**Correct:**
- Single header row
- No merged cells
- No gaps in data
- Plain formatting is best

---

## Manual Pricing Workflow

### When to Use Manual Pricing

**Use for USD invoices that need cost adjustments:**
1. Supplier's invoice shows base price in USD
2. You need to add shipping, customs, taxes, fees
3. Final price is different from invoice price

**NOT needed for:**
- ILS invoices (already include all costs)
- Complete USD invoices (rare)

### How to Add Manual Pricing

```
1. Import shipment with USD prices
   → System stores invoice price: $10.00

2. Navigate to Shipment Details

3. Click "Edit Pricing" on USD fish

4. Enter actual cost breakdown:
   Invoice: $10.00 (read-only)
   + Shipping: $2.00
   + Customs: $1.50
   + Handling: $0.50
   = Actual: $14.00

5. Add notes explaining calculation:
   "Shipment #5678 from USA
    Shipping: $2000 for 1000 fish = $2/fish
    Customs 15%: $1.50/fish
    Agent fee distributed: $0.50/fish"

6. Click "Save"
   → System updates all cost calculations
   → Edit history recorded
   → Future mortality updates use actual cost
```

### Why Manual?

- USD shipment costs vary widely
- Shipping depends on season, fuel, route
- Customs rates change
- Each shipment is unique
- Automatic conversion would be inaccurate

---

## Import Process

### Step-by-Step Import

```
1. Prepare Excel File
   ✓ Fill all required columns
   ✓ Check validation rules
   ✓ Save as .xlsx or .xls

2. Open System
   → Navigate to Shipments
   → Click "Import Shipment"

3. Upload File
   → Select your Excel file
   → Wait for parsing...

4. Review Preview
   → System shows all data
   → Check for errors
   → Fix any issues inline

5. Add Shipment Info
   → Supplier name
   → Date received
   → Notes (optional)

6. Confirm Import
   → Click "Confirm Import"
   → Wait for processing...

7. Success!
   → View shipment details
   → Assign fish to aquariums
   → Record DOA if needed
   → Edit USD pricing if needed
```

### What Gets Created

After successful import:

**1. Shipment Document**
- Shipment ID
- Supplier info
- Date received
- All metadata

**2. Fish Instance Documents** (one per species)
- Species details
- Quantities
- Pricing
- Initial costs
- Aquarium assignment (pending)

**3. Scheduled Checks** (automatic)
- DOA check (15-24 hour window)
- Daily checks (if enforced)
- Growth measurements (if long-term fish)

---

## Troubleshooting

### Problem: "Could not read Excel file"

**Causes:**
- File corrupted
- Wrong format (not .xlsx or .xls)
- File locked/open in Excel
- Special characters in filename

**Solutions:**
1. Close file in Excel
2. Save as `.xlsx` explicitly
3. Try renaming file (remove special characters)
4. Create new file, copy data

---

### Problem: "Validation errors found"

**Cause:** Data doesn't meet requirements

**Solution:**
1. Read error messages carefully
2. Fix in Excel OR edit inline
3. Common fixes:
   - Correct total = bags × qty/bag
   - Change currency to ILS or USD
   - Remove currency symbols from price
   - Fill required fields

---

### Problem: "Total doesn't match calculation"

**Example:**
```
Bags: 10
Qty/Bag: 10
Total: 95 ← Should be 100
```

**Solution:**
- Either fix total to 100
- Or adjust bags/qty to match 95

**System will ask:**
```
⚠️ Mismatch detected
Calculated: 10 × 10 = 100
Your total: 95

Which is correct?
[ Use calculated (100) ]
[ Use your total (95) ]
```

---

### Problem: Missing codes

**Not a problem!** This is expected and handled:

1. Leave code column empty
2. System generates dummy code
3. Import succeeds with ⚠️ warning
4. Add real code later if you get it

---

## Multi-Language Support

### Hebrew (RTL)

✓ Common names in Hebrew work perfectly
✓ Notes and comments in Hebrew supported
✓ RTL text displays correctly

**Example:**
```
| Common Name |
|-------------|
| מלאך        |
| נאון        |
| דג זהב      |
```

### English, International

✓ All Latin characters supported
✓ Scientific names (Latin) required
✓ International keyboard layouts work

**Example:**
```
| Scientific Name       |
|----------------------|
| Pterophyllum scalare |
| Paracheirodon innesi |
```

---

## Best Practices

### ✓ Do This

1. **Keep template format** - Don't change column order
2. **Use decimal point** - Not comma (10.50, not 10,50)
3. **No symbols in price** - Just numbers
4. **Save regularly** - Don't lose work
5. **Test with small file** - Try 2-3 rows first
6. **Backup original** - Keep supplier's file unchanged
7. **Add notes** - Use notes field for special info

### ✗ Avoid This

1. **Don't merge cells** - Breaks import
2. **Don't add extra columns** - Use template exactly
3. **Don't skip required fields** - Fill all red columns
4. **Don't use formula cells** - System needs values
5. **Don't change header names** - Must match template
6. **Don't add formatting** - Plain data is best

---

## Advanced: Multiple Carts

If your shipment has multiple carts/batches:

**Example: 2 Carts**

| Code | Cart | Scientific Name | ... | Price | Currency |
|------|------|----------------|-----|-------|----------|
| ANG-001 | 1 | Pterophyllum scalare | ... | 12.50 | ILS |
| NEON-005 | 1 | Paracheirodon innesi | ... | 2.50 | ILS |
| GOLD-010 | 2 | Carassius auratus | ... | 8.00 | ILS |
| BETA-020 | 2 | Betta splendens | ... | 15.00 | ILS |

**Result:**
- Cart 1: Angelfish + Neon Tetras
- Cart 2: Goldfish + Bettas
- System groups by cart number
- Helps track which fish came together

---

## Getting Help

### In-App Help

When importing:
- Hover over field names for tips
- Click "?" icon for field explanations
- Preview shows validation errors clearly

### Support

If you need help:
1. Check this guide first
2. Review validation error messages
3. Try with template file (blank template works)
4. Contact system administrator

---

## Template Download

Download the blank template:
- File: `shipment-template.xlsx`
- Location: `/templates/` folder
- Format: Excel 2007+ (.xlsx)

**Template includes:**
- Correct column headers
- Example row (delete before use)
- Data validation where possible

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | Dec 2024 | Initial template guide |

---

**Last Updated:** December 2024
**Template Version:** 1.0
**Supported Languages:** Hebrew, English, International
