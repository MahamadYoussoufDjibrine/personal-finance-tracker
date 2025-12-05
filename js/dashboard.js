// js/dashboard.js

// --- 1. View Switching Logic ---
const navItems = document.querySelectorAll('.nav-item');
const contentViews = document.querySelectorAll('.content-view');

// Function to switch the active view
function switchView(viewName) {
    // Deactivate all nav items and hide all views
    navItems.forEach(item => {
        item.classList.remove('active');
    });
    contentViews.forEach(view => {
        view.classList.remove('active');
    });

    // Activate the selected nav item
    const activeNavItem = document.querySelector(`.nav-item[data-view="${viewName}"]`);
    if (activeNavItem) {
        activeNavItem.classList.add('active');
    }

    // Show the selected content view
    const activeView = document.getElementById(`${viewName}-view`);
    if (activeView) {
        activeView.classList.add('active');
    }
}

// Attach event listeners to nav items
navItems.forEach(item => {
    item.addEventListener('click', (e) => {
        e.preventDefault();
        const view = item.getAttribute('data-view');
        switchView(view);
    });
});

// --- 2. Initial Dashboard Load (Placeholder for Data) ---

auth.onAuthStateChanged(async (user) => {
    if (user) {
        // Update welcome message with user's display name
        const welcomeMessageElement = document.getElementById('welcome-message');
        if (welcomeMessageElement) {
            // Use the "clever" default if displayName is null, matching the UI
            const userName = user.displayName || 'clever'; 
            welcomeMessageElement.textContent = `Welcome back, ${userName}!`;
        }

        // Initialize Charts (will be fleshed out later)
        if (window.location.pathname.includes('dashboard.html')) {
            initializeDashboardCharts();
        }

    } else {
        // Already handled by auth.js, but good practice to keep the flow clean
        console.log("User logged out or session expired.");
    }
});


// --- 3. Placeholder for Chart Initialization (Required by Analytics/Dashboard views) ---

function initializeDashboardCharts() {
    // --- Balance Trend Chart (Dashboard View) ---
    const balanceTrendCtx = document.getElementById('balanceTrendChart');
    if (balanceTrendCtx) {
        new Chart(balanceTrendCtx, {
            type: 'line',
            data: {
                labels: ['Jan 1', 'Jan 5', 'Jan 10', 'Jan 15', 'Jan 20', 'Jan 25', 'Today'],
                datasets: [{
                    label: 'Total Balance',
                    data: [2200, 2400, 2800, 2400, 2100, 2350, 2250], // Placeholder data
                    borderColor: '#19C37D',
                    backgroundColor: 'rgba(25, 195, 125, 0.1)',
                    tension: 0.4,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                scales: {
                    y: { beginAtZero: false }
                }
            }
        });
    }

    // --- Income vs Expense Chart (Analytics View) ---
    const incomeVsExpenseCtx = document.getElementById('incomeVsExpenseChart');
    if (incomeVsExpenseCtx) {
        new Chart(incomeVsExpenseCtx, {
            type: 'bar',
            data: {
                labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
                datasets: [{
                    label: 'Income',
                    data: [4000, 2000, 3000, 2800, 3500, 2500], // Placeholder
                    backgroundColor: '#19C37D',
                }, {
                    label: 'Expense',
                    data: [1500, 2500, 1000, 2200, 1800, 1200], // Placeholder
                    backgroundColor: '#E53935',
                }]
            },
            options: { responsive: true }
        });
    }

    // --- Spending by Category Chart (Analytics View) ---
    const spendingByCategoryCtx = document.getElementById('spendingByCategoryChart');
    if (spendingByCategoryCtx) {
        new Chart(spendingByCategoryCtx, {
            type: 'doughnut',
            data: {
                labels: ['Food', 'Transportation', 'Entertainment', 'Utilities', 'Other'],
                datasets: [{
                    data: [450, 320, 280, 200, 150], // Placeholder
                    backgroundColor: [
                        '#19C37D', // Green (Food)
                        '#00BCD4', // Cyan (Transportation)
                        '#FF9800', // Orange (Entertainment)
                        '#E91E63', // Pink (Utilities)
                        '#9C27B0'  // Purple (Other)
                    ]
                }]
            },
            options: { responsive: true, cutout: '70%', plugins: { legend: { position: 'bottom' } } }
        });
    }
}


// --- 4. Modal Visibility Logic ---

const modal = document.getElementById('add-transaction-modal');
const openBtns = document.querySelectorAll('#add-transaction-btn-dash, #add-transaction-btn-full');
const closeBtn = document.querySelector('#add-transaction-modal .close-btn');
const cancelBtn = document.getElementById('cancel-transaction-btn');

function showModal() {
    modal.classList.add('show');
}

function hideModal() {
    modal.classList.remove('show');
}

openBtns.forEach(btn => {
    btn.addEventListener('click', showModal);
});
closeBtn.addEventListener('click', hideModal);
cancelBtn.addEventListener('click', hideModal);
window.addEventListener('click', (e) => {
    if (e.target === modal) {
        hideModal();
    }
});
// js/dashboard.js (Append the following section)

// --- 5. Settings Management Logic ---

const settingsForm = document.getElementById('settings-form');
const settingFullName = document.getElementById('setting-full-name');
const settingEmail = document.getElementById('setting-email');
const settingCurrency = document.getElementById('setting-currency');
const settingNotifications = document.getElementById('setting-notifications');
const changePasswordBtn = settingsForm ? settingsForm.querySelector('.link-btn') : null;

// Function to load current user settings into the form
async function loadSettings(user) {
    if (!user) return;

    // A. Load Authentication Data (Full Name & Email)
    settingFullName.value = user.displayName || '';
    settingEmail.value = user.email || '';

    try {
        // B. Load Firestore Preferences
        const userDoc = await db.collection('users').doc(user.uid).get();
        if (userDoc.exists) {
            const userData = userDoc.data();
            const prefs = userData.preferences || {};
            
            // Set currency preference
            if (settingCurrency) {
                settingCurrency.value = prefs.currency || 'US Dollar (USD)';
            }
            // Set notification preference
            if (settingNotifications) {
                settingNotifications.checked = prefs.emailNotifications !== false;
            }
        }
    } catch (error) {
        console.error("Error loading user preferences:", error);
    }
}

// Attach event listener for form submission
if (settingsForm) {
    settingsForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const user = auth.currentUser;
        if (!user) {
            alert("You must be logged in to update settings.");
            return;
        }

        const newFullName = settingFullName.value.trim();
        const newCurrency = settingCurrency.value;
        const newNotifications = settingNotifications.checked;
        const submitButton = settingsForm.querySelector('.save-settings-btn');

        submitButton.disabled = true;
        submitButton.textContent = 'Saving...';
        
        try {
            // 1. Update Full Name in Firebase Authentication
            if (newFullName !== user.displayName) {
                await user.updateProfile({
                    displayName: newFullName
                });
            }

            // 2. Update Preferences in Firestore
            await db.collection('users').doc(user.uid).update({
                fullName: newFullName, // Redundant but good for quick access in Firestore
                preferences: {
                    currency: newCurrency,
                    emailNotifications: newNotifications
                }
            });

            alert('Settings updated successfully!');

        } catch (error) {
            console.error("Error updating settings:", error);
            alert(`Failed to update settings. Error: ${error.message}`);
        } finally {
            submitButton.disabled = false;
            submitButton.textContent = 'Save Settings';
        }
    });
}

// Handle the "Change Password" action
if (changePasswordBtn) {
    changePasswordBtn.addEventListener('click', async () => {
        const user = auth.currentUser;
        if (!user || !user.email) {
            alert("Please log in again or ensure your account has an email.");
            return;
        }

        try {
            await auth.sendPasswordResetEmail(user.email);
            alert(`A password reset link has been sent to ${user.email}. Please check your inbox.`);
        } catch (error) {
            console.error("Error sending password reset email:", error);
            alert("Failed to send password reset link. Please verify your email or log in using an email/password account.");
        }
    });
}

// js/dashboard.js (Append this logic)

const deleteAccountBtn = document.getElementById('delete-account-btn');

if (deleteAccountBtn) {
    deleteAccountBtn.addEventListener('click', async () => {
        const user = auth.currentUser;
        if (!user) {
            alert("You must be logged in to delete your account.");
            return;
        }

        const confirmation = prompt("To confirm account deletion, please type 'DELETE' below:");
        if (confirmation !== 'DELETE') {
            alert("Deletion cancelled or confirmation incorrect.");
            return;
        }

        const password = prompt("Please enter your password to re-authenticate and confirm deletion:");
        if (!password) return;

        try {
            // 1. Re-authenticate the user (MANDATORY for Firebase deletion)
            const credential = firebase.auth.EmailAuthProvider.credential(user.email, password);
            await user.reauthenticateWithCredential(credential);

            // 2. Delete ALL associated data from Firestore (Transactions)
            const transactionsSnapshot = await db.collection('transactions')
                .where('userId', '==', user.uid)
                .get();

            const batch = db.batch(); // Use a batch for efficiency
            transactionsSnapshot.docs.forEach(doc => {
                batch.delete(doc.ref);
            });
            batch.delete(db.collection('users').doc(user.uid)); // Delete the user profile document
            await batch.commit();

            // 3. Delete receipts from Storage (Optional but recommended)
            // NOTE: Deleting the entire folder requires Cloud Functions for larger apps,
            // but for simple apps, deleting the bucket reference is usually sufficient, 
            // or deleting files one by one (simplified here).
            
            // 4. Delete the User Account
            await user.delete();

            alert("Account and all associated data deleted successfully. Redirecting to sign-up.");
            window.location.href = 'signup.html';

        } catch (error) {
            console.error("Account Deletion Error:", error);
            let errorMessage = "Deletion failed. ";
            if (error.code === 'auth/wrong-password' || error.code === 'auth/user-mismatch') {
                errorMessage += "Incorrect password provided.";
            } else if (error.code === 'auth/requires-recent-login') {
                 errorMessage += "Please log out and log back in, then immediately try deleting the account.";
            } else {
                 errorMessage += error.message;
            }
            alert(errorMessage);
        }
    });
}
// --- 6. Integrate Settings Load into Auth Listener ---

// Find the existing auth.onAuthStateChanged listener and modify it 
// or ensure this logic runs after the user is confirmed logged in.

auth.onAuthStateChanged(async (user) => {
    if (user) {
        // ... (Existing code for welcome message and charts) ...
        
        // **NEW INTEGRATION:** Load settings when the user is available
        if (settingsForm) {
            loadSettings(user);
        }

    } else {
        // ... (Existing logout logic) ...
    }
});