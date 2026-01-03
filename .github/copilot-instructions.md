# Expense Tracker - Copilot Instructions

## Project Overview

**Expense Tracker** is a responsive, vanilla HTML/CSS/JavaScript web application for personal expense and EMI/Chit tracking with IndexedDB local storage. It supports category-wise expense management, recurring expenses, EMI/Chit monitoring, and financial analytics.

**Tech Stack:** HTML5, CSS3, Vanilla JavaScript (ES6+), IndexedDB
**Target:** Works offline in browsers; single `index.html` file deployment

---

## Architecture

### 3-Tier Structure

1. **Presentation Layer** (`index.html`, `styles.css`)
   - Single-page app with 6 tabs: Add Expense, Manage Categories, View Expenses, Recurring, EMI/Chit Tracker, Summary
   - Modals for expense and EMI editing
   - Responsive grid-based CSS using custom properties for theming

2. **Business Logic Layer** (`script.js`)
   - Event listeners and form validation
   - Tab navigation and filtering logic
   - Data rendering and DOM manipulation
   - CSV export functionality
   - EMI/Chit dashboard calculations

3. **Data Layer** (`db.js`)
   - IndexedDB wrapper with async/await promises
   - Four object stores: `categories`, `expenses`, `recurringExpenses`, `emis`
   - Index support for efficient queries by date, category, type

### Data Flow

```
User Action → Event Listener (script.js) 
    → Database Operation (db.js) 
    → IndexedDB Storage 
    → Response Handling 
    → DOM Render (script.js) 
    → Visual Feedback
```

---

## Key Files & Their Responsibilities

| File | Purpose | Key Functions |
|------|---------|---|
| `index.html` | UI structure with 6 tabs and 2 modals | Form elements, semantic HTML, accessibility |
| `styles.css` | Responsive design (mobile-first) | CSS Grid, Flexbox, custom properties, EMI card styling |
| `db.js` | IndexedDB abstraction layer | `initializeDB()`, CRUD operations, queries |
| `script.js` | UI logic and event handling | Form handlers, filtering, rendering, exports |

---

## Critical Workflows

### Adding an Expense
1. User fills form: Date, Amount, Category, Description
2. Optional: Check "Recurring" + select Frequency
3. Form validates category selection
4. `addExpense()` stores in IndexedDB `expenses` store
5. If recurring, also stored in `recurringExpenses` template store
6. UI re-renders expense list; success message shown

**Code Entry Point:** `handleAddExpense()` in `script.js`

### Filtering Expenses
- **By Category:** Renders only matching category expenses
- **By Month:** Uses date string matching (YYYY-MM)
- **Search:** Case-insensitive description/category lookup
- Multiple filters can combine (AND operation)

**Code Entry Point:** `filterExpenses()` in `script.js`

### Generating Recurring Expenses
1. User clicks "Generate This Month's Recurring Expenses"
2. Loop through all templates in `allRecurringExpenses`
3. Create actual expense entries dated to 1st of current month
4. Auto-prefixed with `[Auto]` for tracking
5. Prevents duplicate generation (checks if expense already exists)

**Code Entry Point:** `generateRecurringExpenses()` in `script.js`

### Adding EMI/Chit Records
1. User navigates to "EMI/Chit Tracker" tab
2. Fills form: Type (EMI/Chit), Description, Principal, Monthly Amount, etc.
3. Form validates all required fields
4. `addEMI()` stores in IndexedDB `emis` store with fields:
   - type: 'EMI' or 'Chit'
   - Principal & Total EMI amounts
   - Monthly EMI, Total & Pending months
   - Start, Maturity, Due dates
   - Interest rate, Bank name, Notes
5. Dashboard auto-calculates:
   - Days until due (`daysTillDue()`)
   - Total pending amount (`calculatePendingAmount()`)
6. UI renders EMI list with details; success message shown

**Code Entry Point:** `handleAddEMI()` in `script.js`

### EMI/Chit Dashboard Summary
- Displays: Active EMI count, Total pending amount, Total pending months, EMI due this month
- Updated via `updateEMIDashboard()` when tab switches or records change
- Uses `getEMIDashboardSummary()` from db.js for aggregations
- Color-coded alerts: Days until due < 5 shows as "due-soon"

**Code Entry Point:** `updateEMIDashboard()` in `script.js`

### Exporting to CSV
1. Get all expenses for selected month
2. Build CSV with headers: Date, Category, Description, Amount
3. Calculate and append total row
4. Trigger browser download as `expenses-YYYY-MM.csv`

**Code Entry Point:** `exportToCSV()` in `script.js`

---

## Project-Specific Patterns

### Promise-Based Async (IndexedDB)
All DB operations return Promises for consistency:
```javascript
async function addExpense(expense) {
    return new Promise((resolve, reject) => {
        const request = store.add({...});
        request.onsuccess = () => resolve(result);
        request.onerror = () => reject(error);
    });
}
```
**Why:** IndexedDB API is callback-based; wrapping enables async/await in main code.

### Global State Management
- `allExpenses`, `allCategories`, `allRecurringExpenses` held in memory
- Loaded on init; refreshed after mutations
- No external state library (vanilla JS approach)

**Pattern Impact:** Large datasets (1000+ expenses) may need pagination; currently loads all into memory.

### DOM Rendering Pattern
- Clear container, rebuild entirely on data change
- Event listeners re-attached after render
- Used in: `renderExpenses()`, `renderCategories()`, `renderRecurringExpenses()`, `renderEMIs()`

**Why:** Simpler than incremental updates for this scale; sufficient performance.

### EMI Auto-Calculation Pattern
```javascript
// Days until due - compares current date with EMI due date
function daysTillDue(dueDate) {
    const today = new Date();
    const due = new Date(dueDate);
    return Math.ceil((due - today) / (1000 * 60 * 60 * 24));
}

// Pending amount = Monthly EMI × Pending Months
function calculatePendingAmount(monthlyEmiAmount, monthsPending) {
    return monthlyEmiAmount * monthsPending;
}
```
Used in EMI dashboard and record display for real-time calculations.

### EMI Dashboard Summary Aggregation
```javascript
// Computes totals across all active EMIs
async function getEMIDashboardSummary() {
    // Returns: totalActiveEMIs, totalPendingAmount, totalPendingMonths, emiDueThisMonth
}
```
Called on tab switch and after EMI mutations for dashboard updates.

### Message Display Pattern
```javascript
showMessage(elementId, message, type); // type: 'success' | 'error'
// Auto-hides after 3 seconds
```
Used consistently for user feedback across all operations.

### Responsive Design Breakpoints
- **Desktop:** Full multi-column layout
- **Tablet (≤768px):** Reduced column grid, compact nav
- **Mobile (≤480px):** Single-column, tabs wrap, compact buttons

**CSS Location:** Responsive media queries at end of `styles.css`

---

## Extension Points

### Adding a New Field to Expenses
1. Update `db.js` schema: Add to store.add() object
2. Update form in `index.html`: Add input element
3. Update `script.js`: Extract value in `handleAddExpense()`, include in expense object
4. Update `renderExpenses()`: Add column to table

### Adding EMI Payment Tracking
1. Add `paymentHistory` array field to EMI store in `db.js`
2. Create `recordEMIPayment()` function to append payment records
3. Update EMI form to have "Record Payment" button
4. Adjust `monthsPending` on payment record
5. Update `renderEMIs()` to show payment history

### Adding Interest Calculations
1. Implement interest calculation in `db.js`:
   ```javascript
   function calculateAccruedInterest(principal, rate, monthsElapsed) {
       return (principal * rate * monthsElapsed) / (100 * 12);
   }
   ```
2. Add interest display field to EMI record rendering
3. Update EMI dashboard to show total accrued interest across all EMIs

### Adding Analytics
- Query pattern: `getExpensesByMonth()`, `getCategoryBreakdown()`, `getMonthlyTrend()`
- Render in Summary tab using card + breakdown components

### Adding Persistence Export
- JSON export: Serialize `allExpenses` and `allEMIs`, download as `.json`
- Google Sheets: Send POST to backend service (requires server)
- Cloud Sync: Implement sync wrapper around DB operations

---

## Common Integration Points

### Browser APIs Used
- **IndexedDB:** Persistent client-side storage
- **Fetch (potential):** For future cloud sync
- **Date APIs:** `Date`, `toLocaleDateString()`, `toISOString()`
- **Blob/Download:** `createObjectURL()`, click-to-download pattern

### External Dependencies
- **None** - Pure vanilla stack, zero npm dependencies

### Known Limitations
1. **No server backup:** Data lost if browser storage cleared
2. **Single browser:** Data not synced across devices
3. **No batch operations:** Adding 100 expenses/EMIs requires 100 individual requests
4. **Limited querying:** No complex aggregations (no SQL equivalent)
5. **No automatic payment tracking:** Users manually update months pending

---

## Testing Strategies

### Manual Testing Checklist
- [ ] Add expense with/without recurring flag
- [ ] Add EMI with all fields populated
- [ ] Update EMI months pending and verify dashboard calculations
- [ ] Delete category with existing expenses (should allow/prevent?)
- [ ] Generate recurring for month where some already exist
- [ ] Export CSV with 0, 1, 10+ expenses
- [ ] Filter by month + category simultaneously
- [ ] Mobile responsiveness on 375px viewport

### Debug Patterns
```javascript
// In browser DevTools console:
await getAllExpenses().then(exps => console.log(exps));
db.objectStoreNames; // Check available stores
```

---

## Code Style & Conventions

### Naming
- **Functions:** camelCase with verb prefix: `handleAddExpense`, `renderExpenses`, `loadCategories`
- **Constants:** UPPER_SNAKE_CASE: `DB_NAME`, `DB_VERSION`
- **Variables:** camelCase: `allExpenses`, `currentEditId`, `monthValue`
- **IDs/Classes:** kebab-case: `expense-form`, `tab-content`, `category-badge`

### Comments
- **Function headers:** JSDoc-style for public functions in `db.js`
- **Sections:** Section dividers with emojis + text: `// ============ Event Listeners Setup ============`
- **Complex logic:** Inline comments explaining "why" not "what"

### Code Organization
- `db.js`: Database operations only (no DOM)
- `script.js`: UI logic and event handling
- `index.html`: Structure (minimal inline scripts)
- `styles.css`: All styling, no inline styles

### Error Handling
- DB operations: `.catch()` for promise rejections
- Form validation: Check inputs before submission
- User feedback: `showMessage()` for all errors

---

## Performance Considerations

### Optimization Areas
1. **Large datasets:** Consider pagination in expenses list (currently renders all)
2. **Filter performance:** Re-filters all expenses each keystroke (acceptable for typical use <5000 expenses)
3. **CSV export:** Generates full table in memory (fine for ≤1000 rows)

### Best Practices Applied
- Minimize DOM reflows: Batch updates, render once
- Efficient selectors: `getElementById` preferred over `querySelector` for single elements
- Event delegation: Could improve for large lists (not implemented yet)

---

## Future Enhancements

**High Priority (User Requests):**
- Cloud sync to Google Drive/Dropbox
- Multi-device sync with login
- Bill splitting feature
- Budget alerts/notifications

**Low Priority (Code Quality):**
- Unit tests with Jest
- Pagination for 1000+ expenses
- IndexedDB upgrade lifecycle management
- Service Worker for offline PWA

---

## Quick Start for Contributors

1. Open `index.html` in any modern browser (no build step)
2. Open DevTools Console to check for errors
3. Interact with app to test features
4. Use `db.objectStoreNames` to verify database
5. Check `allExpenses` array in console for data validation

**Testing recurring generation:**
```javascript
await generateRecurringExpenses(); // Won't work from console (needs UI state)
// Better: Use UI button or manually test with form
```

**Testing EMI calculations:**
```javascript
// View all EMIs
await getAllEMIs().then(emis => console.table(emis));

// Get dashboard summary
await getEMIDashboardSummary().then(summary => console.log(summary));

// Calculate days until due
daysTillDue('2026-02-15'); // Returns number of days
```

---

## Decision Log

| Decision | Rationale | Implications |
|----------|-----------|--------------|
| Vanilla JS (no framework) | Simplicity, single file, no build step | Trade UI reactivity for ease of deployment |
| IndexedDB over LocalStorage | Support complex queries, larger storage | Async/Promise-based API is more complex |
| Separate EMI store | Clean separation of concerns | Requires duplicate auto-calc logic vs expenses |
| Manual EMI month updates | Simpler than payment history tracking | Users must manually update months pending |
| Full re-render on change | Simpler logic than virtual DOM | Performance OK for <5000 items |
| Global state in memory | Easier debugging, no state library setup | Requires data refresh on mutations |
| CSV export only (no PDF) | User requirement, easier to implement | Limited reporting options |

