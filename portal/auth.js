// Authentication utility functions

// Get user-friendly error messages
function getErrorMessage(errorCode) {
    const errorMessages = {
        'auth/user-not-found': 'No account found with this email address.',
        'auth/wrong-password': 'Incorrect password. Please try again.',
        'auth/invalid-email': 'Please enter a valid email address.',
        'auth/weak-password': 'Password should be at least 6 characters long.',
        'auth/email-already-in-use': 'An account with this email already exists.',
        'auth/too-many-requests': 'Too many failed attempts. Please try again later.',
        'auth/network-request-failed': 'Network error. Please check your connection.',
        'auth/popup-closed-by-user': 'Sign-in popup was closed. Please try again.',
        'auth/cancelled-popup-request': 'Sign-in was cancelled.',
        'auth/popup-blocked': 'Sign-in popup was blocked. Please allow popups for this site.',
        'auth/account-exists-with-different-credential': 'An account already exists with the same email but different sign-in credentials.',
        'auth/requires-recent-login': 'This operation requires recent authentication. Please sign in again.',
        'auth/user-disabled': 'This account has been disabled.',
        'auth/invalid-credential': 'Invalid credentials. Please check your email and password.',
        'auth/operation-not-allowed': 'This operation is not allowed.',
        'auth/user-token-expired': 'Your session has expired. Please sign in again.',
        'auth/web-storage-unsupported': 'Web storage is not supported in this browser.',
        'auth/invalid-user-token': 'Invalid user token.',
        'auth/invalid-tenant-id': 'Invalid tenant ID.',
        'auth/tenant-id-mismatch': 'Tenant ID mismatch.',
        'auth/unauthorized-continue-uri': 'Unauthorized continue URI.',
        'auth/invalid-continue-uri': 'Invalid continue URI.',
        'auth/missing-continue-uri': 'Missing continue URI.',
        'auth/unauthorized-domain': 'Unauthorized domain.',
        'auth/invalid-dynamic-link-domain': 'Invalid dynamic link domain.',
        'auth/argument-error': 'Invalid argument provided.',
        'auth/invalid-persistence-type': 'Invalid persistence type.',
        'auth/unsupported-persistence-type': 'Unsupported persistence type.',
        'auth/invalid-phone-number': 'Invalid phone number.',
        'auth/invalid-verification-code': 'Invalid verification code.',
        'auth/invalid-verification-id': 'Invalid verification ID.',
        'auth/missing-verification-code': 'Missing verification code.',
        'auth/missing-verification-id': 'Missing verification ID.',
        'auth/app-deleted': 'App deleted.',
        'auth/app-not-authorized': 'App not authorized.',
        'auth/configuration-not-found': 'Configuration not found.',
        'auth/invalid-api-key': 'Invalid API key.',
        'auth/invalid-app-credential': 'Invalid app credential.',
        'auth/invalid-cert-hash': 'Invalid certificate hash.',
        'auth/invalid-credential': 'Invalid credential.',
        'auth/invalid-message-payload': 'Invalid message payload.',
        'auth/invalid-oauth-client-id': 'Invalid OAuth client ID.',
        'auth/invalid-oauth-provider': 'Invalid OAuth provider.',
        'auth/invalid-provider-id': 'Invalid provider ID.',
        'auth/invalid-recipient-email': 'Invalid recipient email.',
        'auth/invalid-sender': 'Invalid sender.',
        'auth/invalid-user-import': 'Invalid user import.',
        'auth/missing-android-pkg-name': 'Missing Android package name.',
        'auth/missing-app-credential': 'Missing app credential.',
        'auth/missing-client-type': 'Missing client type.',
        'auth/missing-continue-uri': 'Missing continue URI.',
        'auth/missing-iframe-start': 'Missing iframe start.',
        'auth/missing-ios-bundle-id': 'Missing iOS bundle ID.',
        'auth/missing-or-invalid-nonce': 'Missing or invalid nonce.',
        'auth/missing-phone-number': 'Missing phone number.',
        'auth/missing-verification-code': 'Missing verification code.',
        'auth/missing-verification-id': 'Missing verification ID.',
        'auth/phone-number-already-exists': 'Phone number already exists.',
        'auth/project-not-found': 'Project not found.',
        'auth/reserved-claims': 'Reserved claims.',
        'auth/session-expired': 'Session expired.',
        'auth/uid-already-exists': 'UID already exists.',
        'auth/unauthorized-continue-uri': 'Unauthorized continue URI.',
        'auth/user-not-found': 'User not found.',
        'auth/weak-password': 'Weak password.',
        'auth/web-storage-unsupported': 'Web storage unsupported.',
        'auth/already-initialized': 'Already initialized.',
        'auth/invalid-app': 'Invalid app.',
        'auth/invalid-user-token': 'Invalid user token.',
        'auth/key-error': 'Key error.',
        'auth/network-request-failed': 'Network request failed.',
        'auth/null-user': 'Null user.',
        'auth/operation-not-allowed': 'Operation not allowed.',
        'auth/requires-recent-login': 'Requires recent login.',
        'auth/timeout': 'Timeout.',
        'auth/user-disabled': 'User disabled.',
        'auth/user-token-expired': 'User token expired.',
        'auth/web-storage-unsupported': 'Web storage unsupported.',
        'auth/invalid-credential': 'Invalid credential.',
        'auth/account-exists-with-different-credential': 'Account exists with different credential.',
        'auth/credential-already-in-use': 'Credential already in use.',
        'auth/email-change-needs-verification': 'Email change needs verification.',
        'auth/email-already-in-use': 'Email already in use.',
        'auth/invalid-email': 'Invalid email.',
        'auth/invalid-password': 'Invalid password.',
        'auth/invalid-phone-number': 'Invalid phone number.',
        'auth/invalid-verification-code': 'Invalid verification code.',
        'auth/invalid-verification-id': 'Invalid verification ID.',
        'auth/missing-verification-code': 'Missing verification code.',
        'auth/missing-verification-id': 'Missing verification ID.',
        'auth/phone-number-already-exists': 'Phone number already exists.',
        'auth/user-not-found': 'User not found.',
        'auth/weak-password': 'Weak password.',
        'auth/invalid-action-code': 'Invalid action code.',
        'auth/invalid-verification-code': 'Invalid verification code.',
        'auth/invalid-verification-id': 'Invalid verification ID.',
        'auth/missing-verification-code': 'Missing verification code.',
        'auth/missing-verification-id': 'Missing verification ID.',
        'auth/quota-exceeded': 'Quota exceeded.',
        'auth/retry-limit-exceeded': 'Retry limit exceeded.',
        'auth/invalid-phone-number': 'Invalid phone number.',
        'auth/missing-phone-number': 'Missing phone number.',
        'auth/invalid-recaptcha-token': 'Invalid reCAPTCHA token.',
        'auth/missing-recaptcha-token': 'Missing reCAPTCHA token.',
        'auth/invalid-recaptcha-action': 'Invalid reCAPTCHA action.',
        'auth/missing-recaptcha-action': 'Missing reCAPTCHA action.',
        'auth/invalid-recaptcha-score': 'Invalid reCAPTCHA score.',
        'auth/missing-recaptcha-score': 'Missing reCAPTCHA score.',
        'auth/invalid-recaptcha-secret': 'Invalid reCAPTCHA secret.',
        'auth/missing-recaptcha-secret': 'Missing reCAPTCHA secret.',
        'auth/invalid-recaptcha-response': 'Invalid reCAPTCHA response.',
        'auth/missing-recaptcha-response': 'Missing reCAPTCHA response.',
        'auth/invalid-recaptcha-site-key': 'Invalid reCAPTCHA site key.',
        'auth/missing-recaptcha-site-key': 'Missing reCAPTCHA site key.',
        'auth/invalid-recaptcha-version': 'Invalid reCAPTCHA version.',
        'auth/missing-recaptcha-version': 'Missing reCAPTCHA version.',
        'auth/invalid-recaptcha-action': 'Invalid reCAPTCHA action.',
        'auth/missing-recaptcha-action': 'Missing reCAPTCHA action.',
        'auth/invalid-recaptcha-score': 'Invalid reCAPTCHA score.',
        'auth/missing-recaptcha-score': 'Missing reCAPTCHA score.',
        'auth/invalid-recaptcha-secret': 'Invalid reCAPTCHA secret.',
        'auth/missing-recaptcha-secret': 'Missing reCAPTCHA secret.',
        'auth/invalid-recaptcha-response': 'Invalid reCAPTCHA response.',
        'auth/missing-recaptcha-response': 'Missing reCAPTCHA response.',
        'auth/invalid-recaptcha-site-key': 'Invalid reCAPTCHA site key.',
        'auth/missing-recaptcha-site-key': 'Missing reCAPTCHA site key.',
        'auth/invalid-recaptcha-version': 'Invalid reCAPTCHA version.',
        'auth/missing-recaptcha-version': 'Missing reCAPTCHA version.'
    };

    return errorMessages[errorCode] || 'An error occurred. Please try again.';
}

// Create user document in Firestore
async function createUserDocument(user, role, additionalData = {}) {
    try {
        const userData = {
            uid: user.uid,
            email: user.email,
            displayName: user.displayName || user.email.split('@')[0],
            role: role,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            lastLogin: firebase.firestore.FieldValue.serverTimestamp(),
            ...additionalData
        };

        await db.collection('users').doc(user.uid).set(userData);
        return userData;
    } catch (error) {
        console.error('Error creating user document:', error);
        throw error;
    }
}

// Update user's last login time
async function updateLastLogin(uid) {
    try {
        await db.collection('users').doc(uid).update({
            lastLogin: firebase.firestore.FieldValue.serverTimestamp()
        });
    } catch (error) {
        console.error('Error updating last login:', error);
    }
}

// Check if user has required role
async function checkUserRole(uid, requiredRole) {
    try {
        const userDoc = await db.collection('users').doc(uid).get();
        if (userDoc.exists) {
            const userData = userDoc.data();
            return userData.role === requiredRole;
        }
        return false;
    } catch (error) {
        console.error('Error checking user role:', error);
        return false;
    }
}

// Redirect based on user role
async function redirectBasedOnRole(uid) {
    try {
        const userDoc = await db.collection('users').doc(uid).get();
        if (userDoc.exists) {
            const userData = userDoc.data();
            switch (userData.role) {
                case 'admin':
                    window.location.href = 'admin-dashboard.html';
                    break;
                case 'team':
                    window.location.href = 'team-dashboard.html';
                    break;
                default:
                    window.location.href = 'index.html';
            }
        } else {
            window.location.href = 'index.html';
        }
    } catch (error) {
        console.error('Error redirecting based on role:', error);
        window.location.href = 'index.html';
    }
}

// Validate email format
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Validate password strength
function validatePassword(password) {
    const minLength = 6;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    const errors = [];
    
    if (password.length < minLength) {
        errors.push(`Password must be at least ${minLength} characters long`);
    }
    if (!hasUpperCase) {
        errors.push('Password must contain at least one uppercase letter');
    }
    if (!hasLowerCase) {
        errors.push('Password must contain at least one lowercase letter');
    }
    if (!hasNumbers) {
        errors.push('Password must contain at least one number');
    }
    if (!hasSpecialChar) {
        errors.push('Password must contain at least one special character');
    }

    return {
        isValid: errors.length === 0,
        errors: errors
    };
}

// Format phone number
function formatPhoneNumber(phoneNumber) {
    // Remove all non-digit characters
    const cleaned = phoneNumber.replace(/\D/g, '');
    
    // Check if it's a valid length
    if (cleaned.length === 11 && cleaned.startsWith('0')) {
        // Convert 03xxxxxxxxx to +923xxxxxxxxx
        return '+92' + cleaned.substring(1);
    } else if (cleaned.length === 12 && cleaned.startsWith('92')) {
        // Already in international format
        return '+' + cleaned;
    } else if (cleaned.length === 10 && cleaned.startsWith('3')) {
        // Convert 3xxxxxxxxx to +923xxxxxxxxx
        return '+92' + cleaned;
    }
    
    return phoneNumber; // Return original if no pattern matches
}

// Export functions
window.getErrorMessage = getErrorMessage;
window.createUserDocument = createUserDocument;
window.updateLastLogin = updateLastLogin;
window.checkUserRole = checkUserRole;
window.redirectBasedOnRole = redirectBasedOnRole;
window.isValidEmail = isValidEmail;
window.validatePassword = validatePassword;
window.formatPhoneNumber = formatPhoneNumber; 