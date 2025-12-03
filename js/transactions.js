// js/transactions.js

// References to elements defined in dashboard.html
const newTransactionForm = document.getElementById('new-transaction-form');
const transactionTypeSwitch = document.querySelector('.transaction-type-switch');
const transactionCategorySelect = document.getElementById('transaction-category');
//const modal = document.getElementById('add-transaction-modal');
let currentTransactionType = 'expense'; // Default type

// --- Category Options Mapping (for dynamic display) ---
const categories = {
    expense: ['Food', 'Transportation', 'Entertainment', 'Utilities', 'Subscription', 'Other'],
    income: ['Salary', 'Freelance', 'Investment', 'Gift', 'Other Income']
};

// --- A. Dynamic Category and Type Switch ---

// Function to update the category dropdown based on type
function updateCategories(type) {
    // Clear existing options
    transactionCategorySelect.innerHTML = ''; 

    // Determine which list to use
    const categoryList = categories[type] || categories['expense'];

    // Populate new options
    categoryList.forEach(category => {
        const option = document.createElement('option');
        option.value = category;
        option.textContent = category;
        transactionCategorySelect.appendChild(option);
    });
}

// Event listener for the type switch buttons (Expense/Income)
transactionTypeSwitch.addEventListener('click', (e) => {
    if (e.target.classList.contains('type-btn')) {
        // Update button active state
        transactionTypeSwitch.querySelectorAll('.type-btn').forEach(btn => btn.classList.remove('active'));
        e.target.classList.add('active');

        // Update current type and categories
        currentTransactionType = e.target.getAttribute('data-type');
        updateCategories(currentTransactionType);
    }
});

// Initialize categories when the script loads (defaults to expense)
updateCategories(currentTransactionType);


// --- B. Form Submission and Firestore Save ---

// js/transactions.js (Revised Section B: Form Submission and Firestore Save)

newTransactionForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const user = auth.currentUser;
    if (!user) {
        alert("You must be logged in to record a transaction.");
        return;
    }

    // --- 1. Gather Data ---
    const amount = parseFloat(document.getElementById('transaction-amount').value);
    const category = transactionCategorySelect.value;
    const date = document.getElementById('transaction-date').value;
    const description = document.getElementById('transaction-description').value;
    const receiptFile = document.getElementById('transaction-receipt').files[0]; // Get the file object

    if (isNaN(amount) || amount <= 0) {
        alert("Please enter a valid positive amount.");
        return;
    }

    const submitButton = newTransactionForm.querySelector('button[type="submit"]');
    submitButton.disabled = true;
    submitButton.textContent = 'Saving Transaction...';
    
    let receiptUrl = null;

    try {
        // --- 2. Handle File Upload (If a file is present) ---
        if (receiptFile) {
            submitButton.textContent = 'Uploading Receipt...';
            
            // Define the storage path: 'receipts/[user-id]/[timestamp]_[filename]'
            const storageRef = storage.ref();

            // 🛑 CRITICAL FIX: Sanitize the file name to remove special characters/spaces
            const sanitizedFileName = receiptFile.name.replace(/[^a-zA-Z0-9.]/g, '_'); 
            
            const fileName = `${Date.now()}_${sanitizedFileName}`; // Use the cleaned name
            const fileRef = storageRef.child(`receipts/${user.uid}/${fileName}`);
            
            // ... rest of the upload logic ...
        }
        
        // --- 3. Prepare and Save Transaction Data ---
        
        const sign = (currentTransactionType === 'income') ? 1 : -1;
        
        const transactionData = {
            userId: user.uid,
            amount: amount * sign,
            category: category,
            date: new Date(date),
            description: description,
            type: currentTransactionType,
            receiptUrl: receiptUrl, // Saved URL (will be null if no file was uploaded)
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        };
        
        submitButton.textContent = 'Saving Data...';
        
        // Save to Firestore
        await db.collection('transactions').add(transactionData);

        // --- 4. Cleanup and Refresh ---
        alert('Transaction added successfully!');
        newTransactionForm.reset();
        modal.classList.remove('show'); // Hide modal
        
        // Refresh data display
        loadTransactions(user.uid); 
        
    } catch (error) {
        console.error("Error adding transaction/uploading receipt: ", error);
        alert(`Failed to save transaction. Error: ${error.message}`);
    } finally {
        submitButton.disabled = false;
        submitButton.textContent = 'Add Transaction';
    }
});


// --- C. Display Transactions (Loading from Firestore) ---

const recentTransactionsList = document.getElementById('recent-transactions-list');
const fullTransactionsList = document.getElementById('full-transactions-list');

// Utility function to format currency
const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD', // Should eventually use user's preference from Firestore
});

// Function to render a single transaction item HTML
// js/transactions.js (Corrected createTransactionItemHTML function)

// Function to render a single transaction item HTML
function createTransactionItemHTML(transaction, isFullList = false) {
    const isIncome = transaction.type === 'income';
    const amountDisplay = formatter.format(Math.abs(transaction.amount));
    
    // Format date string
    const dateObj = transaction.date.toDate(); // Convert Firestore Timestamp to JS Date
    const dateString = isFullList 
        ? dateObj.toLocaleDateString() 
        : dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

    return `
        <div class="transaction-item ${transaction.type}">
            <div class="icon-name">
                <i class="icon-${transaction.category.toLowerCase().replace(/\s/g, '-')}"></i>
                <div>
                    <span class="name">${transaction.description}</span>
                    <span class="category">${transaction.category}</span>
                </div>
            </div>
            <div class="amount-date">
                <span class="amount">${isIncome ? '+' : '-'} ${amountDisplay}</span>
                <span class="date">${dateString}</span>
            </div>
            ${transaction.receiptUrl ? `
                <a href="${transaction.receiptUrl}" target="_blank" title="View Receipt" class="receipt-link">📎</a>
            ` : ''}
        </div>
    `;
}

// Function to fetch and display transactions
async function loadTransactions(userId) {
    try {
        // Fetch all transactions for the user, ordered by date descending
        const snapshot = await db.collection('transactions')
            .where('userId', '==', userId)
            .orderBy('date', 'desc')
            .get();

        const transactions = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        // 1. Render Recent Transactions (Limit to 5 for Dashboard)
        if (recentTransactionsList) {
            const recentHTML = transactions.slice(0, 5).map(t => createTransactionItemHTML(t)).join('');
            recentTransactionsList.innerHTML = recentHTML || '<p>No recent transactions found.</p>';
        }

        // 2. Render Full Transactions List (For Transactions View)
        if (fullTransactionsList) {
            const fullHTML = transactions.map(t => createTransactionItemHTML(t, true)).join('');
            fullTransactionsList.innerHTML = fullHTML || '<p>No transactions found. Start adding one!</p>';
        }

        // 3. Update Dashboard Stats (Simple Calculation)
        updateDashboardStats(transactions);

    } catch (error) {
        console.error("Error loading transactions: ", error);
    }
}


// --- D. Update Dashboard Statistics ---

function updateDashboardStats(transactions) {
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    
    let totalBalance = 0;
    let monthlyIncome = 0;
    let monthlyExpense = 0;

    transactions.forEach(t => {
        // Calculate total balance
        totalBalance += t.amount;

        // Check if transaction is in the current month
        const tDate = t.date.toDate();
        if (tDate.getMonth() === currentMonth && tDate.getFullYear() === currentYear) {
            if (t.type === 'income') {
                monthlyIncome += t.amount; // amount is positive here
            } else {
                monthlyExpense += Math.abs(t.amount); // amount is negative, use absolute
            }
        }
    });

    // Update the DOM elements
    document.getElementById('total-balance').textContent = formatter.format(totalBalance);
    document.getElementById('monthly-income').textContent = formatter.format(monthlyIncome);
    document.getElementById('monthly-expense').textContent = formatter.format(monthlyExpense);
    
    // Optional: Update the user document balance (better to calculate live, but useful for quick access)
    // auth.currentUser && db.collection('users').doc(auth.currentUser.uid).update({ totalBalance: totalBalance });
}


// --- E. Initial Data Load on Auth Change ---

// Listen to auth state to trigger the initial transaction load once the user is ready
auth.onAuthStateChanged(user => {
    if (user) {
        // When user logs in, load their data
        loadTransactions(user.uid);
    }
});