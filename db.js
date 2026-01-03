/**
 * Expense Tracker - IndexedDB Database Module
 * Handles all database operations and data persistence
 */

const DB_NAME = 'ExpenseTrackerDB';
const DB_VERSION = 1;

let db;

/**
 * Initialize the IndexedDB database
 * Creates object stores for expenses, categories, recurring expenses, and EMIs
 */
function initializeDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = () => {
            console.error('Database failed to open:', request.error);
            reject(request.error);
        };

        request.onupgradeneeded = (event) => {
            db = event.target.result;

            // Create Categories store
            if (!db.objectStoreNames.contains('categories')) {
                const categoryStore = db.createObjectStore('categories', { keyPath: 'id', autoIncrement: true });
                categoryStore.createIndex('name', 'name', { unique: true });

                // Add default categories
                const defaultCategories = [
                    'School Fees',
                    'Van Fees',
                    'Insurance',
                    'Car Insurance',
                    'Groceries',
                    'Utilities',
                    'Dining Out',
                    'Entertainment',
                    'Health',
                    'Transport'
                ];

                defaultCategories.forEach(cat => {
                    categoryStore.add({ name: cat, createdAt: new Date() });
                });
            }

            // Create Expenses store
            if (!db.objectStoreNames.contains('expenses')) {
                const expenseStore = db.createObjectStore('expenses', { keyPath: 'id', autoIncrement: true });
                expenseStore.createIndex('date', 'date');
                expenseStore.createIndex('category', 'category');
                expenseStore.createIndex('date-category', ['date', 'category']);
            }

            // Create Recurring Expenses store
            if (!db.objectStoreNames.contains('recurringExpenses')) {
                const recurringStore = db.createObjectStore('recurringExpenses', { keyPath: 'id', autoIncrement: true });
                recurringStore.createIndex('category', 'category');
            }

            // Create EMIs store
            if (!db.objectStoreNames.contains('emis')) {
                const emiStore = db.createObjectStore('emis', { keyPath: 'id', autoIncrement: true });
                emiStore.createIndex('type', 'type');
                emiStore.createIndex('status', 'status');
                emiStore.createIndex('dueDate', 'dueDate');
            }
        };

        request.onsuccess = () => {
            db = request.result;
            console.log('Database initialized successfully');
            resolve(db);
        };
    });
}

/**
 * Get all categories
 */
function getAllCategories() {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['categories'], 'readonly');
        const store = transaction.objectStore('categories');
        const request = store.getAll();

        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);
    });
}

/**
 * Add a new category
 */
function addCategory(name) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['categories'], 'readwrite');
        const store = transaction.objectStore('categories');
        const request = store.add({ name, createdAt: new Date() });

        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);
    });
}

/**
 * Delete a category
 */
function deleteCategory(id) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['categories'], 'readwrite');
        const store = transaction.objectStore('categories');
        const request = store.delete(id);

        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve();
    });
}

/**
 * Add a new expense
 */
function addExpense(expense) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['expenses'], 'readwrite');
        const store = transaction.objectStore('expenses');
        const request = store.add({
            date: expense.date,
            amount: parseFloat(expense.amount),
            category: expense.category,
            description: expense.description,
            isRecurring: expense.isRecurring || false,
            frequency: expense.frequency || null,
            createdAt: new Date()
        });

        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);
    });
}

/**
 * Update an expense
 */
function updateExpense(id, expense) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['expenses'], 'readwrite');
        const store = transaction.objectStore('expenses');
        
        store.get(id).onsuccess = (event) => {
            const data = event.target.result;
            const updated = {
                ...data,
                date: expense.date,
                amount: parseFloat(expense.amount),
                category: expense.category,
                description: expense.description
            };
            const request = store.put(updated);
            
            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve(request.result);
        };
    });
}

/**
 * Delete an expense
 */
function deleteExpense(id) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['expenses'], 'readwrite');
        const store = transaction.objectStore('expenses');
        const request = store.delete(id);

        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve();
    });
}

/**
 * Get all expenses
 */
function getAllExpenses() {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['expenses'], 'readonly');
        const store = transaction.objectStore('expenses');
        const request = store.getAll();

        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);
    });
}

/**
 * Get expenses by date range
 */
function getExpensesByDateRange(startDate, endDate) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['expenses'], 'readonly');
        const store = transaction.objectStore('expenses');
        const index = store.index('date');
        const range = IDBKeyRange.bound(startDate, endDate);
        const request = index.getAll(range);

        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);
    });
}

/**
 * Get expenses by category
 */
function getExpensesByCategory(category) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['expenses'], 'readonly');
        const store = transaction.objectStore('expenses');
        const index = store.index('category');
        const request = index.getAll(category);

        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);
    });
}

/**
 * Get expenses by month (YYYY-MM)
 */
function getExpensesByMonth(yearMonth) {
    return new Promise((resolve, reject) => {
        getAllExpenses().then(expenses => {
            const filtered = expenses.filter(exp => {
                const expDate = new Date(exp.date).toISOString().slice(0, 7);
                return expDate === yearMonth;
            });
            resolve(filtered);
        }).catch(reject);
    });
}

/**
 * Search expenses by description
 */
function searchExpenses(query) {
    return new Promise((resolve, reject) => {
        getAllExpenses().then(expenses => {
            const filtered = expenses.filter(exp =>
                exp.description.toLowerCase().includes(query.toLowerCase())
            );
            resolve(filtered);
        }).catch(reject);
    });
}

/**
 * Add a recurring expense template
 */
function addRecurringExpense(recurring) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['recurringExpenses'], 'readwrite');
        const store = transaction.objectStore('recurringExpenses');
        const request = store.add({
            category: recurring.category,
            amount: parseFloat(recurring.amount),
            description: recurring.description,
            frequency: recurring.frequency,
            createdAt: new Date()
        });

        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);
    });
}

/**
 * Get all recurring expenses
 */
function getAllRecurringExpenses() {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['recurringExpenses'], 'readonly');
        const store = transaction.objectStore('recurringExpenses');
        const request = store.getAll();

        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);
    });
}

/**
 * Delete a recurring expense
 */
function deleteRecurringExpense(id) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['recurringExpenses'], 'readwrite');
        const store = transaction.objectStore('recurringExpenses');
        const request = store.delete(id);

        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve();
    });
}

/**
 * Get total expenses for a month
 */
function getMonthlyTotal(yearMonth) {
    return new Promise((resolve, reject) => {
        getExpensesByMonth(yearMonth).then(expenses => {
            const total = expenses.reduce((sum, exp) => sum + exp.amount, 0);
            resolve(total);
        }).catch(reject);
    });
}

/**
 * Get total expenses for a year
 */
function getYearlyTotal(year) {
    return new Promise((resolve, reject) => {
        getAllExpenses().then(expenses => {
            const total = expenses
                .filter(exp => new Date(exp.date).getFullYear() === parseInt(year))
                .reduce((sum, exp) => sum + exp.amount, 0);
            resolve(total);
        }).catch(reject);
    });
}

/**
 * Get expenses grouped by category for a month
 */
function getCategoryBreakdown(yearMonth) {
    return new Promise((resolve, reject) => {
        getExpensesByMonth(yearMonth).then(expenses => {
            const breakdown = {};
            expenses.forEach(exp => {
                if (!breakdown[exp.category]) {
                    breakdown[exp.category] = 0;
                }
                breakdown[exp.category] += exp.amount;
            });
            resolve(breakdown);
        }).catch(reject);
    });
}

/**
 * Get monthly totals for last 12 months
 */
function getMonthlyTrend() {
    return new Promise((resolve, reject) => {
        getAllExpenses().then(expenses => {
            const trend = {};
            const now = new Date();

            // Initialize last 12 months
            for (let i = 11; i >= 0; i--) {
                const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
                const key = date.toISOString().slice(0, 7);
                trend[key] = 0;
            }

            // Aggregate expenses
            expenses.forEach(exp => {
                const key = exp.date.slice(0, 7);
                if (trend.hasOwnProperty(key)) {
                    trend[key] += exp.amount;
                }
            });

            resolve(trend);
        }).catch(reject);
    });
}

// ============================================================
// EMI/Chit Operations
// ============================================================

/**
 * Add a new EMI/Chit record
 */
function addEMI(emi) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['emis'], 'readwrite');
        const store = transaction.objectStore('emis');
        const request = store.add({
            type: emi.type, // 'EMI' or 'Chit'
            description: emi.description,
            principalAmount: parseFloat(emi.principalAmount),
            totalEmiAmount: parseFloat(emi.totalEmiAmount),
            monthlyEmiAmount: parseFloat(emi.monthlyEmiAmount),
            startDate: emi.startDate,
            maturityDate: emi.maturityDate,
            dueDate: emi.dueDate,
            totalMonths: parseInt(emi.totalMonths),
            monthsPending: parseInt(emi.monthsPending),
            interestRate: emi.interestRate ? parseFloat(emi.interestRate) : 0,
            bankName: emi.bankName,
            notes: emi.notes,
            status: 'active',
            createdAt: new Date()
        });

        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);
    });
}

/**
 * Update an EMI/Chit record
 */
function updateEMI(id, emi) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['emis'], 'readwrite');
        const store = transaction.objectStore('emis');
        
        store.get(id).onsuccess = (event) => {
            const data = event.target.result;
            const updated = {
                ...data,
                type: emi.type,
                description: emi.description,
                principalAmount: parseFloat(emi.principalAmount),
                totalEmiAmount: parseFloat(emi.totalEmiAmount),
                monthlyEmiAmount: parseFloat(emi.monthlyEmiAmount),
                startDate: emi.startDate,
                maturityDate: emi.maturityDate,
                dueDate: emi.dueDate,
                totalMonths: parseInt(emi.totalMonths),
                monthsPending: parseInt(emi.monthsPending),
                interestRate: emi.interestRate ? parseFloat(emi.interestRate) : 0,
                bankName: emi.bankName,
                notes: emi.notes
            };
            const request = store.put(updated);
            
            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve(request.result);
        };
    });
}

/**
 * Delete an EMI/Chit record
 */
function deleteEMI(id) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['emis'], 'readwrite');
        const store = transaction.objectStore('emis');
        const request = store.delete(id);

        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve();
    });
}

/**
 * Get all EMI/Chit records
 */
function getAllEMIs() {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['emis'], 'readonly');
        const store = transaction.objectStore('emis');
        const request = store.getAll();

        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);
    });
}

/**
 * Get EMIs by type (EMI or Chit)
 */
function getEMIsByType(type) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['emis'], 'readonly');
        const store = transaction.objectStore('emis');
        const index = store.index('type');
        const request = index.getAll(type);

        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);
    });
}

/**
 * Calculate days until EMI due date
 */
function daysTillDue(dueDate) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(dueDate);
    due.setHours(0, 0, 0, 0);
    const diffTime = due - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
}

/**
 * Calculate total pending amount for EMI
 */
function calculatePendingAmount(monthlyEmiAmount, monthsPending) {
    return monthlyEmiAmount * monthsPending;
}

/**
 * Get EMI dashboard summary
 */
function getEMIDashboardSummary() {
    return new Promise((resolve, reject) => {
        getAllEMIs().then(emis => {
            const activeEMIs = emis.filter(e => e.status === 'active');
            
            let totalPendingAmount = 0;
            let totalPendingMonths = 0;
            let emiDueThisMonth = 0;
            const today = new Date();
            const currentMonth = today.toISOString().slice(0, 7);

            activeEMIs.forEach(emi => {
                const pendingAmount = calculatePendingAmount(emi.monthlyEmiAmount, emi.monthsPending);
                totalPendingAmount += pendingAmount;
                totalPendingMonths += emi.monthsPending;

                // Check if due this month
                const dueMonth = emi.dueDate.slice(0, 7);
                if (dueMonth === currentMonth) {
                    emiDueThisMonth += emi.monthlyEmiAmount;
                }
            });

            resolve({
                totalActiveEMIs: activeEMIs.length,
                totalPendingAmount: totalPendingAmount,
                totalPendingMonths: totalPendingMonths,
                emiDueThisMonth: emiDueThisMonth
            });
        }).catch(reject);
    });
}

// Initialize database when module loads
initializeDB().catch(err => console.error('Failed to initialize database:', err));
