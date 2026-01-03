# 💰 Expense Tracker

A simple, responsive, offline-first expense tracking application built with vanilla HTML, CSS, and JavaScript.

## Features

✅ **Add Expenses** - Record transactions by date, amount, category, and description  
✅ **Manage Categories** - Create, view, and delete expense categories  
✅ **View Expenses** - Filter by category, month, or search by description  
✅ **Recurring Expenses** - Set up monthly/yearly recurring templates and auto-generate them  
✅ **Financial Summary** - View monthly/yearly totals, category breakdowns, and 12-month trends  
✅ **Export to CSV** - Download expenses for any month as a CSV file  
✅ **Offline Storage** - All data stored locally in browser's IndexedDB  
✅ **Responsive Design** - Works seamlessly on desktop, tablet, and mobile  

## Getting Started

### No Installation Required!

1. Open `index.html` in any modern web browser
2. Start tracking your expenses immediately
3. Data is automatically saved to your browser's local storage

**Supported Browsers:**
- Chrome 25+
- Firefox 16+
- Safari 10+
- Edge 12+
- Opera 11+

## How to Use

### Adding an Expense
1. Go to **Add Expense** tab
2. Select a date
3. Enter amount (in ₹)
4. Choose a category
5. Add optional description
6. Check "Is this a recurring expense?" if applicable
7. Click **Add Expense**

### Managing Categories
1. Go to **Manage Categories** tab
2. Type a new category name
3. Click **Add Category**
4. Remove categories by clicking the **Remove** button

### Viewing & Filtering Expenses
1. Go to **View Expenses** tab
2. Use filters to find expenses:
   - By category dropdown
   - By month selector
   - By description search
3. Edit or delete expenses as needed

### Setting Up Recurring Expenses
1. Add an expense and check "Is this a recurring expense?"
2. Select frequency (Monthly/Yearly)
3. Go to **Recurring** tab to see all recurring templates
4. Click **Generate This Month's Recurring Expenses** to auto-create expenses

### Viewing Financial Summary
1. Go to **Summary** tab
2. Select a month to view:
   - Monthly and yearly totals
   - Category breakdown (amount and percentage)
   - 12-month trend visualization
3. Click **Export to CSV** to download the report

## Data Storage

All your data is stored locally in your browser's **IndexedDB** database. 

⚠️ **Important:**
- Data is NOT synced across devices
- Clearing browser storage will delete all data
- Data persists until browser cache is cleared

## Tips & Best Practices

### Default Categories Included
- School Fees
- Van Fees
- Insurance
- Car Insurance
- Groceries
- Utilities
- Dining Out
- Entertainment
- Health
- Transport

### Backup Your Data
1. Go to **Summary** tab
2. Select each month
3. Click **Export to CSV**
4. Save files to your computer

### Recurring Expenses
- Generated expenses are marked with `[Auto]` prefix
- They are created on the 1st of each month
- You can edit or delete them like regular expenses

## Browser DevTools Debugging

Open DevTools Console (F12) and try:

```javascript
// View all expenses
await getAllExpenses().then(exps => console.table(exps));

// View all categories
await getAllCategories().then(cats => console.table(cats));

// View all recurring templates
await getAllRecurringExpenses().then(rec => console.table(rec));

// Check database info
db.objectStoreNames;  // List all stores
```

## Technical Stack

- **Frontend:** Vanilla JavaScript (ES6+)
- **Storage:** IndexedDB
- **Styling:** CSS3 with CSS Grid & Flexbox
- **No Dependencies:** Zero npm packages - runs standalone

## File Structure

```
expenseTracker/
├── index.html                    # Main UI structure
├── styles.css                    # Responsive styling
├── script.js                     # UI logic & event handlers
├── db.js                         # IndexedDB operations
├── README.md                     # This file
└── .github/
    └── copilot-instructions.md   # AI Agent Guide
```

## Known Limitations

- 📱 Single browser storage (no cloud sync)
- 💾 Data lost if browser storage is cleared
- 📊 No complex financial calculations
- ⚡ Performance optimal for <5000 expenses

## Future Enhancements

- Cloud sync (Google Drive, Dropbox)
- Multi-device synchronization
- Budget alerts and notifications
- Advanced filtering and reports
- Dark mode theme
- Mobile app export

## Troubleshooting

### Data Not Saving
- Check if IndexedDB is enabled in browser settings
- Try a different browser
- Check browser's storage quota

### Export Not Working
- Make sure you've selected a month
- Check if there are any expenses in that month
- Allow pop-ups if browser blocks downloads

### App Runs Slowly
- Try clearing old expenses (year-old data)
- Close other browser tabs
- Restart the browser

## License

Free to use and modify for personal use.

---

**Built with ❤️ for better financial tracking**
# ExpenseCalculator
# ExpenseCalculator
