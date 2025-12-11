// js/auth.js (Section A)

auth.onAuthStateChanged(user => {
    const path = window.location.pathname;
    
    if (user) {
        // User is signed in.
        // ...
        // If the user is on a public page (login/signup), redirect them to the dashboard
        if (path.includes('index.html') || path.includes('signup.html')) {
            window.location.href = 'dashboard.html';
        }
    } else {
        // User is signed out.
        // ...
        // If the user is on a restricted page (dashboard), redirect them to the login page
        if (path.includes('dashboard.html')) {
            window.location.href = 'index.html'; // This is the crucial line for protection
        }
    }
});


// js/auth.js (Inside Section B - Handle Email/Password Login)

const loginForm = document.getElementById('login-form');

if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;
        const submitButton = loginForm.querySelector('button[type="submit"]');

        submitButton.disabled = true;
        submitButton.textContent = 'Signing In...';

        try {
            // Firebase Login
            await auth.signInWithEmailAndPassword(email, password);

            // 🚀 CRITICAL FIX: Add the manual redirect for guaranteed transition 🚀
            submitButton.textContent = 'Success! Redirecting...';
            window.location.href = 'dashboard.html';
            
        } catch (error) {
            console.error('Login Error:', error.code, error.message);
            
            let errorMessage = 'Login failed. Please check your email and password.';
            
            // You can refine this error handling based on specific Firebase codes if needed
            if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
                errorMessage = 'Invalid email or password.';
            }

            alert(`Error: ${errorMessage}`);
            
            submitButton.disabled = false;
            submitButton.textContent = 'Sign In';
        }
    });
}


// --- C. Handle Email/Password Sign Up ---

const signupForm = document.getElementById('signup-form');

// js/auth.js (Inside Section C - Handle Email/Password Sign Up)

// ... existing code (const signupForm = document.getElementById('signup-form'); etc.) ...

if (signupForm) {
    signupForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // --- 1. Variable Declarations and Validation ---
        const fullName = document.getElementById('full-name').value;
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const submitButton = signupForm.querySelector('button[type="submit"]');

        // Check for empty fields (You should uncomment/verify this logic)
        if (!fullName || !email || !password) { 
             alert('Please fill in all fields.');
             return;
        }

        submitButton.disabled = true;
        submitButton.textContent = 'Creating Account...';
        
        try {
            // 🛑 CRITICAL: CREATE USER IN FIREBASE AUTH 🛑
            const userCredential = await auth.createUserWithEmailAndPassword(email, password);
            const user = userCredential.user;

            // Update user profile name
            await user.updateProfile({
                displayName: fullName
            });

            // Save initial user data in Firestore
            await db.collection('users').doc(user.uid).set({
                fullName: fullName,
                email: email,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                preferences: {
                    currency: 'USD',
                    emailNotifications: true
                },
                totalBalance: 0
            });

            // 🚀 SUCCESS: Manual Redirection 🚀
            alert('Account created successfully! Redirecting to dashboard.');
            window.location.href = 'dashboard.html'; 
            
        } catch (error) {
            console.error('Sign Up Error:', error.code, error.message);
            
            let errorMessage = 'An unknown error occurred during sign up.';
            if (error.code === 'auth/email-already-in-use') {
                errorMessage = 'This email address is already in use.';
            } else if (error.code === 'auth/weak-password') {
                errorMessage = 'The password is too weak (must be at least 6 characters).';
            }

            alert(`Error: ${errorMessage}`);
            
            submitButton.disabled = false;
            submitButton.textContent = 'Create Account';
        }
    });
}

// --- D. Sign Out Function (Used on the dashboard page) ---
// --- D. Sign Out Function (Used on the dashboard page) ---

const signOutButton = document.getElementById('sign-out-link');

if (signOutButton) {
    signOutButton.addEventListener('click', async (e) => {
        e.preventDefault(); 
        try {
            await auth.signOut();
            
            // ⭐ CRITICAL FIX: Explicitly redirect immediately after sign out
            window.location.href = 'index.html'; 

            console.log("Successfully called auth.signOut() and redirecting.");
        } catch (error) {
            console.error('Sign Out Error:', error);
            alert('Error signing out. Please try again.');
        }
    });
}