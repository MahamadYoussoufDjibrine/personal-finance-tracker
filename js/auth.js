// js/auth.js

// --- A. Authentication State Listener ---
// This runs every time the user's login state changes (login, logout, page load)

auth.onAuthStateChanged(user => {
    // Get the current path (e.g., /index.html, /dashboard.html)
    const path = window.location.pathname;
    
    // Check if the user is logged in
    if (user) {
        // User is signed in.
        console.log("Auth state changed: User is now signed in.");

        // If the user is on a public page (login/signup), redirect them to the dashboard
        if (path.includes('index.html') || path.includes('signup.html')) {
            window.location.href = 'dashboard.html';
        }
    } else {
        // User is signed out.
        console.log("Auth state changed: User is now signed out.");
        
        // If the user is on a restricted page (dashboard), redirect them to the login page
        if (path.includes('dashboard.html')) {
            window.location.href = 'index.html';
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

        // ... variable declarations and validation ...

        try {
            const userCredential = await auth.createUserWithEmailAndPassword(email, password);
            const user = userCredential.user;

            await user.updateProfile({
                displayName: fullName
            });

            // Set initial user data in Firestore
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

            // 🚀 FIX: Manual Redirection for guaranteed transition 🚀
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

const signOutButton = document.getElementById('sign-out-link');

if (signOutButton) {
    signOutButton.addEventListener('click', async (e) => {
        e.preventDefault(); 
        try {
            await auth.signOut();
            // The listener (Section A) will detect the sign out and redirect to index.html
            console.log("Successfully called auth.signOut()");
        } catch (error) {
            console.error('Sign Out Error:', error);
            alert('Error signing out. Please try again.');
        }
    });
}