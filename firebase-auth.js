<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>HourFlow - Login</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.4/css/all.min.css">
    <style>
        :root {
            --primary: #4a6cf7;
            --primary-dark: #3a56c6;
            --secondary: #6c757d;
            --success: #4caf50;
            --danger: #f44336;
            --warning: #ff9800;
            --info: #2196f3;
            --light: #f8f9fa;
            --dark: #343a40;
            --medium: #6c757d;
            --white: #ffffff;
            --black: #000000;
            --border: #e0e0e0;
            --background: #f5f7fa;
        }
        
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        }
        
        body {
            background-color: var(--background);
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            padding: 20px;
        }
        
        .login-container {
            background-color: var(--white);
            border-radius: 10px;
            box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
            width: 100%;
            max-width: 400px;
            padding: 30px;
        }
        
        .logo {
            text-align: center;
            margin-bottom: 30px;
        }
        
        .logo img {
            max-width: 150px;
            height: auto;
        }
        
        h1 {
            text-align: center;
            color: var(--dark);
            margin-bottom: 30px;
            font-weight: 600;
            font-size: 24px;
        }
        
        .form-group {
            margin-bottom: 20px;
        }
        
        .form-label {
            display: block;
            margin-bottom: 8px;
            color: var(--dark);
            font-weight: 500;
        }
        
        .form-control {
            width: 100%;
            padding: 12px 15px;
            border: 1px solid var(--border);
            border-radius: 5px;
            font-size: 16px;
            transition: border-color 0.3s;
        }
        
        .form-control:focus {
            border-color: var(--primary);
            outline: none;
        }
        
        .btn {
            display: inline-block;
            padding: 12px 20px;
            background-color: var(--primary);
            color: var(--white);
            border: none;
            border-radius: 5px;
            font-size: 16px;
            font-weight: 500;
            cursor: pointer;
            transition: background-color 0.3s;
            width: 100%;
            text-align: center;
        }
        
        .btn:hover {
            background-color: var(--primary-dark);
        }
        
        .btn-google {
            background-color: #DB4437;
            margin-bottom: 10px;
        }
        
        .btn-google:hover {
            background-color: #C53929;
        }
        
        .divider {
            display: flex;
            align-items: center;
            margin: 20px 0;
        }
        
        .divider::before,
        .divider::after {
            content: "";
            flex: 1;
            border-bottom: 1px solid var(--border);
        }
        
        .divider span {
            padding: 0 10px;
            color: var(--medium);
            font-size: 14px;
        }
        
        .text-center {
            text-align: center;
        }
        
        .mt-3 {
            margin-top: 15px;
        }
        
        .text-muted {
            color: var(--medium);
            font-size: 14px;
        }
        
        .link {
            color: var(--primary);
            text-decoration: none;
            cursor: pointer;
        }
        
        .link:hover {
            text-decoration: underline;
        }
        
        .error-message {
            color: var(--danger);
            font-size: 14px;
            margin-top: 5px;
            display: none;
        }
        
        .success-message {
            color: var(--success);
            font-size: 14px;
            margin-top: 5px;
            display: none;
        }
        
        .forgot-password {
            text-align: right;
            margin-bottom: 20px;
        }
        
        .auth-section {
            display: block;
        }
        
        #reset-password-section,
        #signup-section {
            display: none;
        }
    </style>
</head>
<body>
    <div class="login-container">
        <div class="logo">
            <h1>HourFlow</h1>
        </div>
        
        <!-- Login Section -->
        <div id="login-section" class="auth-section">
            <h1>Log In to Your Account</h1>
            
            <button id="google-login-btn" class="btn btn-google">
                <i class="fab fa-google"></i> Continue with Google
            </button>
            
            <div class="divider">
                <span>OR</span>
            </div>
            
            <form id="login-form">
                <div class="form-group">
                    <label for="login-email" class="form-label">Email</label>
                    <input type="email" id="login-email" class="form-control" placeholder="Enter your email" required>
                </div>
                
                <div class="form-group">
                    <label for="login-password" class="form-label">Password</label>
                    <input type="password" id="login-password" class="form-control" placeholder="Enter your password" required>
                </div>
                
                <div class="forgot-password">
                    <a href="#" id="forgot-password-link" class="link">Forgot Password?</a>
                </div>
                
                <button type="submit" class="btn">Log In</button>
                
                <div id="login-error" class="error-message"></div>
            </form>
            
            <div class="text-center mt-3">
                <p class="text-muted">Don't have an account? <a href="#" id="signup-link" class="link">Sign Up</a></p>
            </div>
        </div>
        
        <!-- Sign Up Section -->
        <div id="signup-section" class="auth-section">
            <h1>Create an Account</h1>
            
            <form id="signup-form">
                <div class="form-group">
                    <label for="signup-email" class="form-label">Email</label>
                    <input type="email" id="signup-email" class="form-control" placeholder="Enter your email" required>
                </div>
                
                <div class="form-group">
                    <label for="signup-password" class="form-label">Password</label>
                    <input type="password" id="signup-password" class="form-control" placeholder="Enter your password" required>
                </div>
                
                <div class="form-group">
                    <label for="signup-confirm-password" class="form-label">Confirm Password</label>
                    <input type="password" id="signup-confirm-password" class="form-control" placeholder="Confirm your password" required>
                </div>
                
                <button type="submit" class="btn">Sign Up</button>
                
                <div id="signup-error" class="error-message"></div>
                <div id="signup-success" class="success-message"></div>
            </form>
            
            <div class="text-center mt-3">
                <p class="text-muted">Already have an account? <a href="#" id="login-link" class="link">Log In</a></p>
            </div>
        </div>
        
        <!-- Reset Password Section -->
        <div id="reset-password-section" class="auth-section">
            <h1>Reset Your Password</h1>
            
            <form id="reset-password-form">
                <div class="form-group">
                    <label for="reset-email" class="form-label">Email</label>
                    <input type="email" id="reset-email" class="form-control" placeholder="Enter your email" required>
                </div>
                
                <button type="submit" class="btn">Send Reset Link</button>
                
                <div id="reset-error" class="error-message"></div>
                <div id="reset-success" class="success-message"></div>
            </form>
            
            <div class="text-center mt-3">
                <p class="text-muted"><a href="#" id="back-to-login" class="link">Back to Login</a></p>
            </div>
        </div>
    </div>
    
    <!-- Firebase SDK -->
    <script src="https://www.gstatic.com/firebasejs/9.22.0/firebase-app-compat.js"></script>
    <script src="https://www.gstatic.com/firebasejs/9.22.0/firebase-auth-compat.js"></script>
    <script src="https://www.gstatic.com/firebasejs/9.22.0/firebase-analytics-compat.js"></script>
    
    <!-- Firebase Configuration -->
    <script>
      // Firebase configuration
      const firebaseConfig = {
        apiKey: "AIzaSyBrMzcoCMN9tXROYdJCMq9iT9NX5IW_fqE",
        authDomain: "hourflow-54a34.firebaseapp.com",
        projectId: "hourflow-54a34",
        storageBucket: "hourflow-54a34.appspot.com",
        messagingSenderId: "582955946179",
        appId: "1:582955946179:web:e97d00b0036ff362379276",
        measurementId: "G-ZNGXWM3FMF"
      };

      // Initialize Firebase
      firebase.initializeApp(firebaseConfig);
      const analytics = firebase.analytics();
      
      // Check if user is already logged in
      firebase.auth().onAuthStateChanged(user => {
        if (user) {
          console.log('User is logged in:', user.email);
          // Reset any auth redirect flags
          sessionStorage.removeItem('auth_redirect_in_progress');
          // Clear any license check flags to ensure fresh license check
          sessionStorage.removeItem('license_check_in_progress');
          window.location.href = 'index.html';
        } else {
          console.log('No user is logged in');
          // Make sure the login form is visible
          document.body.style.display = 'flex';
        }
      });
    </script>
    
    <!-- Login Script -->
    <script>
      document.addEventListener('DOMContentLoaded', function() {
        // DOM Elements
        const loginForm = document.getElementById('login-form');
        const signupForm = document.getElementById('signup-form');
        const resetPasswordForm = document.getElementById('reset-password-form');
        const googleLoginBtn = document.getElementById('google-login-btn');
        
        const loginSection = document.getElementById('login-section');
        const signupSection = document.getElementById('signup-section');
        const resetPasswordSection = document.getElementById('reset-password-section');
        
        const loginLink = document.getElementById('login-link');
        const signupLink = document.getElementById('signup-link');
        const forgotPasswordLink = document.getElementById('forgot-password-link');
        const backToLoginLink = document.getElementById('back-to-login');
        
        const loginError = document.getElementById('login-error');
        const signupError = document.getElementById('signup-error');
        const signupSuccess = document.getElementById('signup-success');
        const resetError = document.getElementById('reset-error');
        const resetSuccess = document.getElementById('reset-success');
        
        // Show/hide sections
        function showSection(section) {
          loginSection.style.display = 'none';
          signupSection.style.display = 'none';
          resetPasswordSection.style.display = 'none';
          
          section.style.display = 'block';
        }
        
        // Navigation between forms
        if (loginLink) {
          loginLink.addEventListener('click', (e) => {
            e.preventDefault();
            showSection(loginSection);
          });
        }
        
        if (signupLink) {
          signupLink.addEventListener('click', (e) => {
            e.preventDefault();
            showSection(signupSection);
          });
        }
        
        if (forgotPasswordLink) {
          forgotPasswordLink.addEventListener('click', (e) => {
            e.preventDefault();
            showSection(resetPasswordSection);
          });
        }
        
        if (backToLoginLink) {
          backToLoginLink.addEventListener('click', (e) => {
            e.preventDefault();
            showSection(loginSection);
          });
        }
        
        // Login with email/password
        if (loginForm) {
          loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            // Get inputs
            const email = document.getElementById('login-email').value;
            const password = document.getElementById('login-password').value;
            
            // Clear previous error
            loginError.style.display = 'none';
            
            // Sign in
            firebase.auth().signInWithEmailAndPassword(email, password)
              .then((userCredential) => {
                // Signed in 
                const user = userCredential.user;
                console.log('User logged in:', user.email);
                window.location.href = 'index.html';
              })
              .catch((error) => {
                console.error('Login error:', error);
                loginError.textContent = getErrorMessage(error.code);
                loginError.style.display = 'block';
              });
          });
        }
        
        // Sign up with email/password
        if (signupForm) {
          signupForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            // Get inputs
            const email = document.getElementById('signup-email').value;
            const password = document.getElementById('signup-password').value;
            const confirmPassword = document.getElementById('signup-confirm-password').value;
            
            // Clear previous messages
            signupError.style.display = 'none';
            signupSuccess.style.display = 'none';
            
            // Check if passwords match
            if (password !== confirmPassword) {
              signupError.textContent = 'Passwords do not match';
              signupError.style.display = 'block';
              return;
            }
            
            // Create user
            firebase.auth().createUserWithEmailAndPassword(email, password)
              .then((userCredential) => {
                // Signed up
                const user = userCredential.user;
                console.log('User created:', user.email);
                
                // Show success message
                signupSuccess.textContent = 'Account created successfully! Redirecting to login...';
                signupSuccess.style.display = 'block';
                
                // Clear form
                signupForm.reset();
                
                // Redirect to login after 2 seconds
                setTimeout(() => {
                  showSection(loginSection);
                }, 2000);
              })
              .catch((error) => {
                console.error('Signup error:', error);
                signupError.textContent = getErrorMessage(error.code);
                signupError.style.display = 'block';
              });
          });
        }
        
        // Reset password
        if (resetPasswordForm) {
          resetPasswordForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            // Get input
            const email = document.getElementById('reset-email').value;
            
            // Clear previous messages
            resetError.style.display = 'none';
            resetSuccess.style.display = 'none';
            
            // Send password reset email
            firebase.auth().sendPasswordResetEmail(email)
              .then(() => {
                // Email sent
                resetSuccess.textContent = 'Password reset email sent. Check your inbox.';
                resetSuccess.style.display = 'block';
                resetPasswordForm.reset();
              })
              .catch((error) => {
                console.error('Reset password error:', error);
                resetError.textContent = getErrorMessage(error.code);
                resetError.style.display = 'block';
              });
          });
        }
        
        // Google Sign In
        if (googleLoginBtn) {
          googleLoginBtn.addEventListener('click', () => {
            const provider = new firebase.auth.GoogleAuthProvider();
            
            firebase.auth().signInWithPopup(provider)
              .then((result) => {
                // User signed in
                const user = result.user;
                console.log('Google sign in successful:', user.email);
                window.location.href = 'index.html';
              })
              .catch((error) => {
                console.error('Google sign in error:', error);
                loginError.textContent = getErrorMessage(error.code);
                loginError.style.display = 'block';
              });
          });
        }
        
        // Helper function to get user-friendly error messages
        function getErrorMessage(errorCode) {
          switch(errorCode) {
            case 'auth/email-already-in-use':
              return 'This email is already in use. Try logging in instead.';
            case 'auth/invalid-email':
              return 'Please enter a valid email address.';
            case 'auth/user-disabled':
              return 'This account has been disabled. Please contact support.';
            case 'auth/user-not-found':
              return 'No account found with this email. Please sign up.';
            case 'auth/wrong-password':
              return 'Incorrect password. Please try again.';
            case 'auth/weak-password':
              return 'Password is too weak. Use at least 6 characters.';
            case 'auth/popup-closed-by-user':
              return 'Sign in was cancelled. Please try again.';
            case 'auth/operation-not-allowed':
              return 'This operation is not allowed. Please contact support.';
            case 'auth/network-request-failed':
              return 'Network error. Please check your connection and try again.';
            default:
              return 'An error occurred. Please try again later.';
          }
        }
      });
    </script>
</body>
</html>
