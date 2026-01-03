/**
 * Expense Tracker - Main Application Logic
 * Handles UI interactions, form processing, and data rendering
 */

let allExpenses = [];
let allCategories = [];
let allRecurringExpenses = [];
let allEMIs = [];
let currentEditId = null;
let currentEditEMIId = null;

// ============================================================
// Initialization
// ============================================================

document.addEventListener('DOMContentLoaded', async () => {
    // Wait for database to initialize
    await new Promise(resolve => {
        const checkDB = setInterval(() => {
            if (db) {
                clearInterval(checkDB);
                resolve();
            }
        }, 100);
    });

    loadCategories();
    loadExpenses();
    loadRecurringExpenses();
    loadEMIs();
    setupEventListeners();
    setTodayDate();
});

// ============================================================
// Event Listeners Setup
// ============================================================

function setupEventListeners() {
    // Tab navigation
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', switchTab);
    });

    // Add expense form
    document.getElementById('expense-form').addEventListener('submit', handleAddExpense);
    document.getElementById('expense-is-recurring').addEventListener('change', toggleRecurringOptions);

    // Category management
    document.getElementById('add-category-btn').addEventListener('click', handleAddCategory);
    document.getElementById('new-category-input').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleAddCategory();
    });

    // Filters and search
    document.getElementById('filter-category').addEventListener('change', filterExpenses);
    document.getElementById('filter-month').addEventListener('change', filterExpenses);
    document.getElementById('search-expense').addEventListener('input', filterExpenses);
    document.getElementById('clear-filters-btn').addEventListener('click', clearFilters);

    // Summary
    document.getElementById('summary-month').addEventListener('change', updateSummary);
    document.getElementById('export-csv-btn').addEventListener('click', exportToCSV);

    // Recurring expenses
    document.getElementById('generate-recurring-btn').addEventListener('click', generateRecurringExpenses);

    // Modal controls
    const modal = document.getElementById('edit-modal');
    document.querySelector('.close').addEventListener('click', closeModal);
    document.getElementById('cancel-edit-btn').addEventListener('click', closeModal);
    document.getElementById('edit-expense-form').addEventListener('submit', handleEditExpense);

    // Close modal when clicking outside
    window.addEventListener('click', (event) => {
        if (event.target === modal) {
            closeModal();
        }
    });

    // EMI/Chit form
    document.getElementById('emi-form').addEventListener('submit', handleAddEMI);
    document.getElementById('emi-filter-type').addEventListener('change', filterEMIs);

    // EMI Modal controls
    const emiModal = document.getElementById('edit-emi-modal');
    document.querySelector('.close-emi').addEventListener('click', closeEMIModal);
    document.getElementById('cancel-edit-emi-btn').addEventListener('click', closeEMIModal);
    document.getElementById('edit-emi-form').addEventListener('submit', handleEditEMI);

    // Close EMI modal when clicking outside
    window.addEventListener('click', (event) => {
        if (event.target === emiModal) {
            closeEMIModal();
        }
    });
}

// ============================================================
// Tab Navigation
// ============================================================

function switchTab(e) {
    const tabName = e.target.dataset.tab;

    // Remove active class from all tabs and contents
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));

    // Add active class to clicked tab and corresponding content
    e.target.classList.add('active');
    document.getElementById(tabName).classList.add('active');

    // Refresh data when switching to summary
    if (tabName === 'summary') {
        setCurrentMonth();
        updateSummary();
    }

    // Refresh data when switching to view expenses
    if (tabName === 'view-expenses') {
        loadExpenses();
        renderExpenses();
    }

    // Refresh data when switching to EMI/Chit tracker
    if (tabName === 'emi-chit') {
        loadEMIs();
        updateEMIDashboard();
    }
}

// ============================================================
// Utilities
// ============================================================

function setTodayDate() {
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('expense-date').value = today;
}

function setCurrentMonth() {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    document.getElementById('summary-month').value = `${year}-${month}`;
}

function showMessage(elementId, message, type) {
    const messageEl = document.getElementById(elementId);
    messageEl.textContent = message;
    messageEl.className = `message show ${type}`;
    setTimeout(() => {
        messageEl.classList.remove('show');
    }, 3000);
}

function formatCurrency(amount) {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 2
    }).format(amount);
}

function formatDate(dateString) {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-IN', options);
}

// ============================================================
// Category Management
// ============================================================

async function loadCategories() {
    try {
        allCategories = await getAllCategories();
        renderCategorySelect();
        renderCategories();
    } catch (error) {
        console.error('Error loading categories:', error);
    }
}

function renderCategorySelect() {
    const selects = [
        document.getElementById('expense-category'),
        document.getElementById('filter-category'),
        document.getElementById('edit-expense-category')
    ];

    selects.forEach(select => {
        const currentValue = select.value;
        select.innerHTML = '<option value="">-- Select Category --</option>';
        allCategories.forEach(cat => {
            const option = document.createElement('option');
            option.value = cat.name;
            option.textContent = cat.name;
            select.appendChild(option);
        });
        select.value = currentValue;
    });
}

function renderCategories() {
    const container = document.getElementById('categories-list');
    container.innerHTML = '';

    if (allCategories.length === 0) {
        container.innerHTML = '<p class="no-data">No categories yet</p>';
        return;
    }

    allCategories.forEach(cat => {
        const badge = document.createElement('div');
        badge.className = 'category-badge';
        badge.innerHTML = `
            <span class="category-badge-name">${cat.name}</span>
            <button type="button" class="delete-category-btn" data-id="${cat.id}">Remove</button>
        `;
        badge.querySelector('.delete-category-btn').addEventListener('click', handleDeleteCategory);
        container.appendChild(badge);
    });
}

async function handleAddCategory() {
    const input = document.getElementById('new-category-input');
    const name = input.value.trim();

    if (!name) {
        showMessage('add-category-message', 'Please enter a category name', 'error');
        return;
    }

    // Check for duplicate
    if (allCategories.some(cat => cat.name.toLowerCase() === name.toLowerCase())) {
        showMessage('add-category-message', 'Category already exists', 'error');
        return;
    }

    try {
        await addCategory(name);
        showMessage('add-category-message', `Category "${name}" added successfully!`, 'success');
        input.value = '';
        loadCategories();
    } catch (error) {
        showMessage('add-category-message', 'Error adding category', 'error');
        console.error(error);
    }
}

async function handleDeleteCategory(e) {
    const categoryId = parseInt(e.target.dataset.id);
    const categoryName = e.target.previousElementSibling.textContent;

    if (confirm(`Are you sure you want to delete "${categoryName}"?`)) {
        try {
            await deleteCategory(categoryId);
            showMessage('add-category-message', `Category "${categoryName}" deleted!`, 'success');
            loadCategories();
            loadExpenses();
            renderExpenses();
        } catch (error) {
            showMessage('add-category-message', 'Error deleting category', 'error');
            console.error(error);
        }
    }
}

// ============================================================
// Expense Management
// ============================================================

function toggleRecurringOptions() {
    const isRecurring = document.getElementById('expense-is-recurring').checked;
    document.getElementById('recurring-options').style.display = isRecurring ? 'flex' : 'none';
}

async function handleAddExpense(e) {
    e.preventDefault();

    const expense = {
        date: document.getElementById('expense-date').value,
        amount: document.getElementById('expense-amount').value,
        category: document.getElementById('expense-category').value,
        description: document.getElementById('expense-description').value,
        isRecurring: document.getElementById('expense-is-recurring').checked,
        frequency: document.getElementById('expense-frequency').value
    };

    if (!expense.category) {
        showMessage('add-expense-message', 'Please select a category', 'error');
        return;
    }

    try {
        // Add as regular expense
        await addExpense(expense);

        // If recurring, also add to recurring templates
        if (expense.isRecurring) {
            await addRecurringExpense(expense);
        }

        showMessage('add-expense-message', 'Expense added successfully!', 'success');
        document.getElementById('expense-form').reset();
        setTodayDate();
        loadExpenses();
        loadRecurringExpenses();
    } catch (error) {
        showMessage('add-expense-message', 'Error adding expense', 'error');
        console.error(error);
    }
}

async function loadExpenses() {
    try {
        allExpenses = await getAllExpenses();
    } catch (error) {
        console.error('Error loading expenses:', error);
    }
}

async function loadRecurringExpenses() {
    try {
        allRecurringExpenses = await getAllRecurringExpenses();
        renderRecurringExpenses();
    } catch (error) {
        console.error('Error loading recurring expenses:', error);
    }
}

function renderExpenses(expenses = allExpenses) {
    const container = document.getElementById('expenses-list');

    if (expenses.length === 0) {
        container.innerHTML = '<p class="no-data">No expenses found</p>';
        return;
    }

    // Sort by date descending
    const sorted = [...expenses].sort((a, b) => new Date(b.date) - new Date(a.date));

    container.innerHTML = `
        <table>
            <thead>
                <tr>
                    <th>Date</th>
                    <th>Category</th>
                    <th>Description</th>
                    <th>Amount</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                ${sorted.map(exp => `
                    <tr>
                        <td>${formatDate(exp.date)}</td>
                        <td><span class="category-tag">${exp.category}</span></td>
                        <td>${exp.description || '-'}</td>
                        <td class="amount">${formatCurrency(exp.amount)}</td>
                        <td class="action-buttons">
                            <button class="btn btn-primary btn-small edit-btn" data-id="${exp.id}">Edit</button>
                            <button class="btn btn-danger btn-small delete-btn" data-id="${exp.id}">Delete</button>
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;

    // Attach event listeners
    container.querySelectorAll('.edit-btn').forEach(btn => {
        btn.addEventListener('click', (e) => handleEditClick(e));
    });
    container.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', (e) => handleDeleteExpense(e));
    });
}

function handleEditClick(e) {
    const expenseId = parseInt(e.target.dataset.id);
    const expense = allExpenses.find(exp => exp.id === expenseId);

    if (expense) {
        currentEditId = expenseId;
        document.getElementById('edit-expense-date').value = expense.date;
        document.getElementById('edit-expense-amount').value = expense.amount;
        document.getElementById('edit-expense-category').value = expense.category;
        document.getElementById('edit-expense-description').value = expense.description || '';

        // Populate category dropdown
        const select = document.getElementById('edit-expense-category');
        select.innerHTML = '';
        allCategories.forEach(cat => {
            const option = document.createElement('option');
            option.value = cat.name;
            option.textContent = cat.name;
            select.appendChild(option);
        });
        select.value = expense.category;

        openModal();
    }
}

async function handleEditExpense(e) {
    e.preventDefault();

    if (!currentEditId) return;

    const updatedExpense = {
        date: document.getElementById('edit-expense-date').value,
        amount: document.getElementById('edit-expense-amount').value,
        category: document.getElementById('edit-expense-category').value,
        description: document.getElementById('edit-expense-description').value
    };

    try {
        await updateExpense(currentEditId, updatedExpense);
        showMessage('add-expense-message', 'Expense updated successfully!', 'success');
        closeModal();
        loadExpenses();
        renderExpenses();
    } catch (error) {
        console.error('Error updating expense:', error);
    }
}

async function handleDeleteExpense(e) {
    const expenseId = parseInt(e.target.dataset.id);
    const expense = allExpenses.find(exp => exp.id === expenseId);

    if (confirm(`Delete this ${formatCurrency(expense.amount)} expense?`)) {
        try {
            await deleteExpense(expenseId);
            showMessage('add-expense-message', 'Expense deleted successfully!', 'success');
            loadExpenses();
            renderExpenses();
        } catch (error) {
            console.error('Error deleting expense:', error);
        }
    }
}

// ============================================================
// Filtering and Search
// ============================================================

function filterExpenses() {
    const categoryFilter = document.getElementById('filter-category').value;
    const monthFilter = document.getElementById('filter-month').value;
    const searchQuery = document.getElementById('search-expense').value.toLowerCase();

    let filtered = [...allExpenses];

    // Filter by category
    if (categoryFilter) {
        filtered = filtered.filter(exp => exp.category === categoryFilter);
    }

    // Filter by month
    if (monthFilter) {
        filtered = filtered.filter(exp => exp.date.startsWith(monthFilter));
    }

    // Filter by search query
    if (searchQuery) {
        filtered = filtered.filter(exp =>
            exp.description.toLowerCase().includes(searchQuery) ||
            exp.category.toLowerCase().includes(searchQuery)
        );
    }

    renderExpenses(filtered);
}

function clearFilters() {
    document.getElementById('filter-category').value = '';
    document.getElementById('filter-month').value = '';
    document.getElementById('search-expense').value = '';
    renderExpenses();
}

// ============================================================
// Recurring Expenses
// ============================================================

function renderRecurringExpenses() {
    const container = document.getElementById('recurring-list');

    if (allRecurringExpenses.length === 0) {
        container.innerHTML = '<p class="no-data">No recurring expenses set up</p>';
        return;
    }

    container.innerHTML = `
        <table>
            <thead>
                <tr>
                    <th>Category</th>
                    <th>Description</th>
                    <th>Amount</th>
                    <th>Frequency</th>
                    <th>Action</th>
                </tr>
            </thead>
            <tbody>
                ${allRecurringExpenses.map(exp => `
                    <tr>
                        <td><span class="category-tag">${exp.category}</span></td>
                        <td>${exp.description || '-'}</td>
                        <td class="amount">${formatCurrency(exp.amount)}</td>
                        <td><strong>${exp.frequency}</strong></td>
                        <td class="action-buttons">
                            <button class="btn btn-danger btn-small delete-recurring-btn" data-id="${exp.id}">Remove</button>
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;

    container.querySelectorAll('.delete-recurring-btn').forEach(btn => {
        btn.addEventListener('click', handleDeleteRecurring);
    });
}

async function handleDeleteRecurring(e) {
    const recurringId = parseInt(e.target.dataset.id);
    if (confirm('Delete this recurring expense template?')) {
        try {
            await deleteRecurringExpense(recurringId);
            loadRecurringExpenses();
        } catch (error) {
            console.error('Error deleting recurring expense:', error);
        }
    }
}

async function generateRecurringExpenses() {
    const today = new Date();
    const currentMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;

    // Check if recurring expenses for this month already exist
    const monthlyExpenses = allExpenses.filter(exp => exp.date.startsWith(currentMonth));
    const recurringForThisMonth = allRecurringExpenses.filter(recur => {
        const existingThisMonth = monthlyExpenses.find(exp =>
            exp.category === recur.category &&
            exp.description === recur.description &&
            exp.amount === recur.amount
        );
        return !!existingThisMonth;
    });

    if (recurringForThisMonth.length > 0) {
        showMessage('recurring-message', 'Recurring expenses for this month already generated', 'error');
        return;
    }

    let count = 0;
    try {
        for (const recurring of allRecurringExpenses) {
            // Use the first day of the month for consistency
            const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
            const dateStr = firstDay.toISOString().split('T')[0];

            await addExpense({
                date: dateStr,
                amount: recurring.amount,
                category: recurring.category,
                description: `[Auto] ${recurring.description}`,
                isRecurring: false
            });
            count++;
        }

        showMessage('recurring-message', `Generated ${count} recurring expense(es) for this month!`, 'success');
        loadExpenses();
        renderExpenses();
    } catch (error) {
        console.error('Error generating recurring expenses:', error);
        showMessage('recurring-message', 'Error generating recurring expenses', 'error');
    }
}

// ============================================================
// Summary and Analytics
// ============================================================

async function updateSummary() {
    const monthValue = document.getElementById('summary-month').value;
    if (!monthValue) return;

    try {
        // Update totals
        const monthlyTotal = await getMonthlyTotal(monthValue);
        const yearTotal = await getYearlyTotal(monthValue.split('-')[0]);
        const categoryCount = allCategories.length;

        document.getElementById('monthly-total').textContent = formatCurrency(monthlyTotal);
        document.getElementById('yearly-total').textContent = formatCurrency(yearTotal);
        document.getElementById('total-categories').textContent = categoryCount;

        // Update category breakdown
        const breakdown = await getCategoryBreakdown(monthValue);
        renderCategoryBreakdown(breakdown, monthlyTotal);

        // Update monthly trend
        const trend = await getMonthlyTrend();
        renderMonthlyTrend(trend);
    } catch (error) {
        console.error('Error updating summary:', error);
    }
}

function renderCategoryBreakdown(breakdown, monthlyTotal) {
    const container = document.getElementById('category-breakdown');

    if (Object.keys(breakdown).length === 0) {
        container.innerHTML = '<p class="no-data">No expenses this month</p>';
        return;
    }

    container.innerHTML = Object.entries(breakdown)
        .sort((a, b) => b[1] - a[1])
        .map(([category, amount]) => {
            const percentage = monthlyTotal > 0 ? ((amount / monthlyTotal) * 100).toFixed(1) : 0;
            return `
                <div class="breakdown-card">
                    <h4>${category}</h4>
                    <p>${formatCurrency(amount)}</p>
                    <div class="percentage">${percentage}% of total</div>
                </div>
            `;
        })
        .join('');
}

function renderMonthlyTrend(trend) {
    const container = document.getElementById('monthly-trend');

    const entries = Object.entries(trend).slice(-12); // Last 12 months

    if (entries.length === 0) {
        container.innerHTML = '<p class="no-data">No data available</p>';
        return;
    }

    const maxAmount = Math.max(...entries.map(e => e[1]));

    container.innerHTML = entries.map(([month, amount]) => {
        const height = maxAmount > 0 ? (amount / maxAmount) * 150 : 0;
        const [year, monthNum] = month.split('-');
        const monthName = new Date(year, monthNum - 1).toLocaleDateString('en-IN', { month: 'short' });

        return `
            <div class="month-bar">
                <div class="bar" style="height: ${height}px; min-height: ${height > 0 ? '10px' : '2px'};"></div>
                <div class="month-label">${monthName}</div>
                <div class="month-amount">${formatCurrency(amount)}</div>
            </div>
        `;
    }).join('');
}

// ============================================================
// Export to CSV
// ============================================================

async function exportToCSV() {
    const monthValue = document.getElementById('summary-month').value;
    if (!monthValue) {
        alert('Please select a month first');
        return;
    }

    try {
        const expenses = await getExpensesByMonth(monthValue);

        if (expenses.length === 0) {
            alert('No expenses to export for this month');
            return;
        }

        // Prepare CSV content
        let csv = 'Date,Category,Description,Amount\n';
        let total = 0;

        expenses.forEach(exp => {
            const date = formatDate(exp.date);
            const category = exp.category.replace(/,/g, ' ');
            const description = (exp.description || '-').replace(/,/g, ' ');
            const amount = exp.amount.toFixed(2);
            csv += `"${date}","${category}","${description}",${amount}\n`;
            total += exp.amount;
        });

        // Add total row
        csv += `\n"TOTAL",,,"${total.toFixed(2)}"\n`;

        // Download
        const element = document.createElement('a');
        element.setAttribute('href', 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv));
        element.setAttribute('download', `expenses-${monthValue}.csv`);
        element.style.display = 'none';
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);

        showMessage('add-expense-message', `Exported ${expenses.length} expenses to CSV!`, 'success');
    } catch (error) {
        console.error('Error exporting CSV:', error);
        showMessage('add-expense-message', 'Error exporting to CSV', 'error');
    }
}

// ============================================================
// Modal Management
// ============================================================

function openModal() {
    document.getElementById('edit-modal').classList.add('show');
}

function closeModal() {
    document.getElementById('edit-modal').classList.remove('show');
    currentEditId = null;
}

function openEMIModal() {
    document.getElementById('edit-emi-modal').classList.add('show');
}

function closeEMIModal() {
    document.getElementById('edit-emi-modal').classList.remove('show');
    currentEditEMIId = null;
}

// ============================================================
// EMI/Chit Management
// ============================================================

async function loadEMIs() {
    try {
        allEMIs = await getAllEMIs();
        renderEMIs();
        updateEMIDashboard();
    } catch (error) {
        console.error('Error loading EMIs:', error);
    }
}

async function handleAddEMI(e) {
    e.preventDefault();

    const emi = {
        type: document.getElementById('emi-type').value,
        description: document.getElementById('emi-description').value,
        principalAmount: document.getElementById('emi-principal').value,
        totalEmiAmount: document.getElementById('emi-total-amount').value,
        monthlyEmiAmount: document.getElementById('emi-monthly').value,
        totalMonths: document.getElementById('emi-total-months').value,
        monthsPending: document.getElementById('emi-pending-months-input').value,
        interestRate: document.getElementById('emi-interest-rate').value || '0',
        startDate: document.getElementById('emi-start-date').value,
        maturityDate: document.getElementById('emi-maturity-date').value,
        dueDate: document.getElementById('emi-due-date').value,
        bankName: document.getElementById('emi-bank').value,
        notes: document.getElementById('emi-notes').value
    };

    if (!emi.type || !emi.description || !emi.dueDate) {
        showMessage('emi-form-message', 'Please fill all required fields', 'error');
        return;
    }

    try {
        await addEMI(emi);
        showMessage('emi-form-message', 'EMI/Chit added successfully!', 'success');
        document.getElementById('emi-form').reset();
        loadEMIs();
    } catch (error) {
        showMessage('emi-form-message', 'Error adding EMI/Chit', 'error');
        console.error(error);
    }
}

function renderEMIs(emis = allEMIs) {
    const container = document.getElementById('emi-list');

    if (emis.length === 0) {
        container.innerHTML = '<p class="no-data">No EMI/Chit records found</p>';
        return;
    }

    // Sort by due date
    const sorted = [...emis].sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));

    container.innerHTML = sorted.map(emi => {
        const daysUntilDue = daysTillDue(emi.dueDate);
        const pendingAmount = calculatePendingAmount(emi.monthlyEmiAmount, emi.monthsPending);
        const typeClass = emi.type.toLowerCase();

        return `
            <div class="emi-record">
                <div class="emi-record-header">
                    <div>
                        <span class="emi-record-title">${emi.description}</span>
                        <span class="emi-type-badge ${typeClass}">${emi.type}</span>
                    </div>
                </div>
                <div class="emi-record-details">
                    <div class="emi-detail-item">
                        <div class="emi-detail-label">Principal Amount</div>
                        <div class="emi-detail-value amount">${formatCurrency(emi.principalAmount)}</div>
                    </div>
                    <div class="emi-detail-item">
                        <div class="emi-detail-label">Monthly EMI</div>
                        <div class="emi-detail-value amount">${formatCurrency(emi.monthlyEmiAmount)}</div>
                    </div>
                    <div class="emi-detail-item">
                        <div class="emi-detail-label">Months Pending</div>
                        <div class="emi-detail-value pending">${emi.monthsPending} / ${emi.totalMonths}</div>
                    </div>
                    <div class="emi-detail-item">
                        <div class="emi-detail-label">Pending Amount</div>
                        <div class="emi-detail-value pending">${formatCurrency(pendingAmount)}</div>
                    </div>
                    <div class="emi-detail-item">
                        <div class="emi-detail-label">Due Date</div>
                        <div class="emi-detail-value">${formatDate(emi.dueDate)}</div>
                    </div>
                    <div class="emi-detail-item">
                        <div class="emi-detail-label">Days Until Due</div>
                        <div class="emi-detail-value ${daysUntilDue < 5 ? 'due-soon' : ''}">${daysUntilDue} days</div>
                    </div>
                    <div class="emi-detail-item">
                        <div class="emi-detail-label">Bank/Lender</div>
                        <div class="emi-detail-value">${emi.bankName || '-'}</div>
                    </div>
                    <div class="emi-detail-item">
                        <div class="emi-detail-label">Start Date</div>
                        <div class="emi-detail-value">${formatDate(emi.startDate)}</div>
                    </div>
                </div>
                ${emi.notes ? `<div style="background: white; padding: 0.75rem; border-radius: 4px; border: 1px solid var(--border-color); margin-bottom: 1rem;"><strong>Notes:</strong> ${emi.notes}</div>` : ''}
                <div class="emi-record-actions">
                    <button class="btn btn-primary btn-small edit-emi-btn" data-id="${emi.id}">Edit</button>
                    <button class="btn btn-danger btn-small delete-emi-btn" data-id="${emi.id}">Delete</button>
                </div>
            </div>
        `;
    }).join('');

    // Attach event listeners
    container.querySelectorAll('.edit-emi-btn').forEach(btn => {
        btn.addEventListener('click', (e) => handleEditEMIClick(e));
    });
    container.querySelectorAll('.delete-emi-btn').forEach(btn => {
        btn.addEventListener('click', (e) => handleDeleteEMI(e));
    });
}

function handleEditEMIClick(e) {
    const emiId = parseInt(e.target.dataset.id);
    const emi = allEMIs.find(em => em.id === emiId);

    if (emi) {
        currentEditEMIId = emiId;
        document.getElementById('edit-emi-type').value = emi.type;
        document.getElementById('edit-emi-description').value = emi.description;
        document.getElementById('edit-emi-principal').value = emi.principalAmount;
        document.getElementById('edit-emi-total-amount').value = emi.totalEmiAmount;
        document.getElementById('edit-emi-monthly').value = emi.monthlyEmiAmount;
        document.getElementById('edit-emi-pending').value = emi.monthsPending;
        document.getElementById('edit-emi-due-date').value = emi.dueDate;
        document.getElementById('edit-emi-bank').value = emi.bankName || '';

        openEMIModal();
    }
}

async function handleEditEMI(e) {
    e.preventDefault();

    if (!currentEditEMIId) return;

    const updatedEMI = {
        type: document.getElementById('edit-emi-type').value,
        description: document.getElementById('edit-emi-description').value,
        principalAmount: document.getElementById('edit-emi-principal').value,
        totalEmiAmount: document.getElementById('edit-emi-total-amount').value,
        monthlyEmiAmount: document.getElementById('edit-emi-monthly').value,
        monthsPending: document.getElementById('edit-emi-pending').value,
        dueDate: document.getElementById('edit-emi-due-date').value,
        bankName: document.getElementById('edit-emi-bank').value,
        startDate: allEMIs.find(e => e.id === currentEditEMIId).startDate,
        maturityDate: allEMIs.find(e => e.id === currentEditEMIId).maturityDate,
        totalMonths: allEMIs.find(e => e.id === currentEditEMIId).totalMonths,
        interestRate: allEMIs.find(e => e.id === currentEditEMIId).interestRate,
        notes: allEMIs.find(e => e.id === currentEditEMIId).notes
    };

    try {
        await updateEMI(currentEditEMIId, updatedEMI);
        showMessage('emi-form-message', 'EMI/Chit updated successfully!', 'success');
        closeEMIModal();
        loadEMIs();
    } catch (error) {
        console.error('Error updating EMI:', error);
    }
}

async function handleDeleteEMI(e) {
    const emiId = parseInt(e.target.dataset.id);
    const emi = allEMIs.find(em => em.id === emiId);

    if (confirm(`Delete "${emi.description}" (${emi.type})?`)) {
        try {
            await deleteEMI(emiId);
            showMessage('emi-form-message', 'EMI/Chit deleted successfully!', 'success');
            loadEMIs();
        } catch (error) {
            console.error('Error deleting EMI:', error);
        }
    }
}

function filterEMIs() {
    const typeFilter = document.getElementById('emi-filter-type').value;

    let filtered = [...allEMIs];

    if (typeFilter) {
        filtered = filtered.filter(emi => emi.type === typeFilter);
    }

    renderEMIs(filtered);
}

async function updateEMIDashboard() {
    try {
        const summary = await getEMIDashboardSummary();
        document.getElementById('emi-count').textContent = summary.totalActiveEMIs;
        document.getElementById('emi-pending-amount').textContent = formatCurrency(summary.totalPendingAmount);
        document.getElementById('emi-pending-months').textContent = summary.totalPendingMonths;
        document.getElementById('emi-due-this-month').textContent = formatCurrency(summary.emiDueThisMonth);
    } catch (error) {
        console.error('Error updating EMI dashboard:', error);
    }
}

