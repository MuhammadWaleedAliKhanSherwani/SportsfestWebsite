// Team Registration JavaScript

let memberCount = 0;
let maxMembers = 9; // Default limit

// Show notification function
function showNotification(message, type = 'info') {
    // Remove existing notifications
    const existingNotifications = document.querySelectorAll('.notification');
    existingNotifications.forEach(notification => notification.remove());

    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : type === 'warning' ? 'exclamation-triangle' : 'info-circle'}"></i>
            <span>${message}</span>
            <button class="notification-close" onclick="this.parentElement.parentElement.remove()">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `;

    // Add to page
    document.body.appendChild(notification);

    // Auto remove after 5 seconds
    setTimeout(() => {
        if (notification.parentElement) {
            notification.remove();
        }
    }, 5000);
}

// Category-based member limits
const categoryLimits = {
    'university': 15,
    'college': 12,
    'school': 10,
    'club': 20,
    'corporate': 15,
    'community': 12
};

// Initialize registration form
document.addEventListener('DOMContentLoaded', function() {
    initializeRegistrationForm();
    setupPasswordStrength();
    setupFormValidation();
});

// Initialize registration form functionality
function initializeRegistrationForm() {
    const registrationForm = document.getElementById('registrationForm');
    const addMemberBtn = document.getElementById('addMemberBtn');
    const membersContainer = document.getElementById('membersContainer');

    // Form submission
    registrationForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        await handleRegistration();
    });

    // Add member button
    addMemberBtn.addEventListener('click', function() {
        if (memberCount < maxMembers) {
            addMemberField();
        } else {
            showNotification(`Maximum ${maxMembers} additional members allowed for this category`, 'error');
        }
    });

    // Phone number formatting
    const phoneInputs = document.querySelectorAll('input[type="tel"]');
    phoneInputs.forEach(input => {
        input.addEventListener('input', function() {
            this.value = formatPhoneNumber(this.value);
        });
    });

    // CNIC formatting
    const cnicInput = document.getElementById('captainCNIC');
    if (cnicInput) {
        cnicInput.addEventListener('input', function() {
            this.value = formatCNIC(this.value);
        });
    }
}

// Handle team registration
async function handleRegistration() {
    try {
        showNotification('Registering your team...', 'info');
        
        // Get form data
        const formData = getFormData();
        
        // Validate form data
        const validation = validateFormData(formData);
        if (!validation.isValid) {
            showNotification(validation.errors.join(', '), 'error');
            return;
        }

        // Create user account
        const userCredential = await auth.createUserWithEmailAndPassword(
            formData.captainEmail, 
            formData.password
        );
        const user = userCredential.user;

        // Create team document
        const teamData = {
            teamName: formData.teamName,
            institution: formData.institution,
            city: formData.city,
            teamCategory: formData.teamCategory,
            captain: {
                name: formData.captainName,
                email: formData.captainEmail,
                phone: formData.captainPhone,
                cnic: formData.captainCNIC
            },
            members: formData.members,
            sports: formData.sports,
            status: 'pending',
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        };

        // Save team data to Firestore
        await db.collection('teams').add(teamData);

        // Create user document
        await createUserDocument(user, 'team', {
            teamName: formData.teamName,
            teamId: user.uid
        });

        // Create sports participation records
        for (const sport of formData.sports) {
            await db.collection('sports_participation').add({
                teamId: user.uid,
                teamName: formData.teamName,
                sport: sport,
                status: 'registered',
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
        }

        showNotification('Team registered successfully! Redirecting to dashboard...', 'success');
        
        setTimeout(() => {
            window.location.href = 'team-dashboard.html';
        }, 2000);

    } catch (error) {
        console.error('Registration error:', error);
        showNotification(getErrorMessage(error.code), 'error');
    }
}

// Get form data
function getFormData() {
    const form = document.getElementById('registrationForm');
    const formData = new FormData(form);
    
    // Get basic team information
    const data = {
        teamName: formData.get('teamName'),
        institution: formData.get('institution'),
        city: formData.get('city'),
        teamCategory: formData.get('teamCategory'),
        captainName: formData.get('captainName'),
        captainEmail: formData.get('captainEmail'),
        captainPhone: formData.get('captainPhone'),
        captainCNIC: formData.get('captainCNIC'),
        password: formData.get('password'),
        confirmPassword: formData.get('confirmPassword')
    };

    // Get selected sports
    const sportsCheckboxes = document.querySelectorAll('input[name="sports"]:checked');
    data.sports = Array.from(sportsCheckboxes).map(cb => cb.value);

    // Get team members
    data.members = [];
    const memberInputs = document.querySelectorAll('.member-field');
    memberInputs.forEach(memberInput => {
        const name = memberInput.querySelector('.member-name').value;
        const phone = memberInput.querySelector('.member-phone').value;
        const cnic = memberInput.querySelector('.member-cnic').value;
        
        if (name && phone && cnic) {
            data.members.push({
                name: name,
                phone: phone,
                cnic: cnic
            });
        }
    });

    return data;
}

// Validate form data
function validateFormData(data) {
    const errors = [];

    // Required fields validation
    if (!data.teamName) errors.push('Team name is required');
    if (!data.institution) errors.push('Institution is required');
    if (!data.city) errors.push('City is required');
    if (!data.teamCategory) errors.push('Team category is required');
    if (!data.captainName) errors.push('Captain name is required');
    if (!data.captainEmail) errors.push('Captain email is required');
    if (!data.captainPhone) errors.push('Captain phone is required');
    if (!data.captainCNIC) errors.push('Captain CNIC is required');
    if (!data.password) errors.push('Password is required');

    // Email validation
    if (data.captainEmail && !isValidEmail(data.captainEmail)) {
        errors.push('Please enter a valid email address');
    }

    // Password validation
    if (data.password) {
        const passwordValidation = validatePassword(data.password);
        if (!passwordValidation.isValid) {
            errors.push(...passwordValidation.errors);
        }
    }

    // Password confirmation
    if (data.password !== data.confirmPassword) {
        errors.push('Passwords do not match');
    }

    // Sports selection validation
    if (!data.sports || data.sports.length === 0) {
        errors.push('Please select at least one sport');
    }

    // Phone number validation
    if (data.captainPhone && !isValidPhoneNumber(data.captainPhone)) {
        errors.push('Please enter a valid phone number');
    }

    // CNIC validation
    if (data.captainCNIC && !isValidCNIC(data.captainCNIC)) {
        errors.push('Please enter a valid CNIC');
    }

    return {
        isValid: errors.length === 0,
        errors: errors
    };
}

// Update team members limit based on category
function updateTeamMembersLimit() {
    const category = document.getElementById('teamCategory').value;
    maxMembers = categoryLimits[category] || 9;
    
    // Update add member button text
    const addMemberBtn = document.getElementById('addMemberBtn');
    if (addMemberBtn) {
        addMemberBtn.innerHTML = `
            <i class="fas fa-plus"></i>
            Add Team Member (${maxMembers - memberCount} remaining)
        `;
        
        // Hide button if limit reached
        if (memberCount >= maxMembers) {
            addMemberBtn.style.display = 'none';
        } else {
            addMemberBtn.style.display = 'block';
        }
    }
}

// Add member field
function addMemberField() {
    memberCount++;
    const membersContainer = document.getElementById('membersContainer');
    
    const memberField = document.createElement('div');
    memberField.className = 'member-field';
    memberField.innerHTML = `
        <div class="member-header">
            <h4>Team Member ${memberCount}</h4>
            <button type="button" class="remove-member-btn" onclick="removeMemberField(this)">
                <i class="fas fa-times"></i>
            </button>
        </div>
        <div class="member-form">
            <div class="form-group">
                <label>Member Name</label>
                <input type="text" class="member-name" placeholder="Enter member's full name">
            </div>
            <div class="form-group">
                <label>Phone Number</label>
                <input type="tel" class="member-phone" placeholder="0300-1234567">
            </div>
            <div class="form-group">
                <label>CNIC</label>
                <input type="text" class="member-cnic" placeholder="12345-1234567-1">
            </div>
        </div>
    `;

    membersContainer.appendChild(memberField);

    // Add phone and CNIC formatting
    const phoneInput = memberField.querySelector('.member-phone');
    const cnicInput = memberField.querySelector('.member-cnic');
    
    phoneInput.addEventListener('input', function() {
        this.value = formatPhoneNumber(this.value);
    });
    
    cnicInput.addEventListener('input', function() {
        this.value = formatCNIC(this.value);
    });

    // Update add member button
    const addMemberBtn = document.getElementById('addMemberBtn');
    if (memberCount >= maxMembers) {
        addMemberBtn.style.display = 'none';
    }
}

// Remove member field
function removeMemberField(button) {
    const memberField = button.closest('.member-field');
    memberField.remove();
    memberCount--;
    
    // Show add member button if under limit
    const addMemberBtn = document.getElementById('addMemberBtn');
    if (memberCount < maxMembers) {
        addMemberBtn.style.display = 'block';
    }
}

// Setup password strength indicator
function setupPasswordStrength() {
    const passwordInput = document.getElementById('password');
    const strengthIndicator = document.getElementById('passwordStrength');
    
    if (passwordInput && strengthIndicator) {
        passwordInput.addEventListener('input', function() {
            const strength = calculatePasswordStrength(this.value);
            updatePasswordStrengthIndicator(strengthIndicator, strength);
        });
    }
}

// Calculate password strength
function calculatePasswordStrength(password) {
    let score = 0;
    const checks = {
        length: password.length >= 8,
        lowercase: /[a-z]/.test(password),
        uppercase: /[A-Z]/.test(password),
        numbers: /\d/.test(password),
        special: /[!@#$%^&*(),.?":{}|<>]/.test(password)
    };

    score = Object.values(checks).filter(Boolean).length;
    
    return {
        score: score,
        checks: checks,
        level: score < 2 ? 'weak' : score < 4 ? 'medium' : 'strong'
    };
}

// Update password strength indicator
function updatePasswordStrengthIndicator(indicator, strength) {
    indicator.innerHTML = '';
    
    const strengthLevels = [
        { name: 'Length (8+)', met: strength.checks.length },
        { name: 'Lowercase', met: strength.checks.lowercase },
        { name: 'Uppercase', met: strength.checks.uppercase },
        { name: 'Numbers', met: strength.checks.numbers },
        { name: 'Special', met: strength.checks.special }
    ];

    strengthLevels.forEach(level => {
        const levelDiv = document.createElement('div');
        levelDiv.className = `strength-level ${level.met ? 'met' : 'not-met'}`;
        levelDiv.innerHTML = `
            <i class="fas fa-${level.met ? 'check' : 'times'}"></i>
            <span>${level.name}</span>
        `;
        indicator.appendChild(levelDiv);
    });

    // Add overall strength indicator
    const overallDiv = document.createElement('div');
    overallDiv.className = `strength-overall ${strength.level}`;
    overallDiv.innerHTML = `
        <span>Password Strength: ${strength.level.toUpperCase()}</span>
    `;
    indicator.appendChild(overallDiv);
}

// Setup form validation
function setupFormValidation() {
    // Real-time validation for required fields
    const requiredInputs = document.querySelectorAll('input[required], select[required]');
    requiredInputs.forEach(input => {
        input.addEventListener('blur', function() {
            validateField(this);
        });
    });

    // Password confirmation validation
    const confirmPasswordInput = document.getElementById('confirmPassword');
    if (confirmPasswordInput) {
        confirmPasswordInput.addEventListener('input', function() {
            const password = document.getElementById('password').value;
            if (this.value && this.value !== password) {
                this.setCustomValidity('Passwords do not match');
            } else {
                this.setCustomValidity('');
            }
        });
    }
}

// Validate individual field
function validateField(field) {
    const value = field.value.trim();
    let isValid = true;
    let message = '';

    if (field.hasAttribute('required') && !value) {
        isValid = false;
        message = 'This field is required';
    } else if (field.type === 'email' && value && !isValidEmail(value)) {
        isValid = false;
        message = 'Please enter a valid email address';
    } else if (field.type === 'tel' && value && !isValidPhoneNumber(value)) {
        isValid = false;
        message = 'Please enter a valid phone number';
    }

    // Update field appearance
    field.classList.toggle('invalid', !isValid);
    field.setCustomValidity(message);

    return isValid;
}

// Utility functions
function isValidPhoneNumber(phone) {
    const phoneRegex = /^(\+92|0)?3\d{9}$/;
    return phoneRegex.test(phone.replace(/\D/g, ''));
}

function isValidCNIC(cnic) {
    const cnicRegex = /^\d{5}-\d{7}-\d{1}$/;
    return cnicRegex.test(cnic);
}

function formatPhoneNumber(phone) {
    const cleaned = phone.replace(/\D/g, '');
    
    if (cleaned.length === 11 && cleaned.startsWith('0')) {
        return cleaned;
    } else if (cleaned.length === 10 && cleaned.startsWith('3')) {
        return '0' + cleaned;
    } else if (cleaned.length === 12 && cleaned.startsWith('92')) {
        return '0' + cleaned.substring(2);
    }
    
    return phone;
}

function formatCNIC(cnic) {
    const cleaned = cnic.replace(/\D/g, '');
    
    if (cleaned.length <= 5) {
        return cleaned;
    } else if (cleaned.length <= 12) {
        return cleaned.substring(0, 5) + '-' + cleaned.substring(5);
    } else {
        return cleaned.substring(0, 5) + '-' + cleaned.substring(5, 12) + '-' + cleaned.substring(12, 13);
    }
}

// Add CSS for member fields and form sections
const style = document.createElement('style');
style.textContent = `
    .form-section {
        margin-bottom: 2rem;
        padding: 1.5rem;
        background: #f8f9fa;
        border-radius: 10px;
        border-left: 4px solid #3498db;
    }
    
    .form-section h3 {
        color: #2c3e50;
        margin-bottom: 1rem;
        display: flex;
        align-items: center;
        gap: 0.5rem;
    }
    
    .form-help {
        color: #7f8c8d;
        font-size: 0.9rem;
        margin-bottom: 1rem;
    }
    
    .sports-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
        gap: 1rem;
        margin-top: 1rem;
    }
    
    .sport-option {
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 1rem;
        border: 2px solid #ecf0f1;
        border-radius: 10px;
        cursor: pointer;
        transition: all 0.3s ease;
        background: white;
    }
    
    .sport-option:hover {
        border-color: #3498db;
        background: #f8f9fa;
    }
    
    .sport-option input[type="checkbox"] {
        display: none;
    }
    
    .sport-option input[type="checkbox"]:checked + .sport-icon {
        background: #3498db;
        color: white;
    }
    
    .sport-option input[type="checkbox"]:checked {
        border-color: #3498db;
        background: #e3f2fd;
    }
    
    .sport-icon {
        width: 40px;
        height: 40px;
        border-radius: 50%;
        background: #ecf0f1;
        display: flex;
        align-items: center;
        justify-content: center;
        margin-bottom: 0.5rem;
        transition: all 0.3s ease;
    }
    
    .sport-name {
        font-weight: 600;
        color: #2c3e50;
        text-align: center;
    }
    
    .member-field {
        background: white;
        border: 1px solid #ecf0f1;
        border-radius: 10px;
        padding: 1.5rem;
        margin-bottom: 1rem;
        position: relative;
    }
    
    .member-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 1rem;
        padding-bottom: 0.5rem;
        border-bottom: 1px solid #ecf0f1;
    }
    
    .member-header h4 {
        color: #2c3e50;
        margin: 0;
    }
    
    .remove-member-btn {
        background: #e74c3c;
        color: white;
        border: none;
        border-radius: 50%;
        width: 30px;
        height: 30px;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: all 0.3s ease;
    }
    
    .remove-member-btn:hover {
        background: #c0392b;
        transform: scale(1.1);
    }
    
    .member-form {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 1rem;
    }
    
    .add-member-btn {
        background: #27ae60;
        color: white;
        border: none;
        border-radius: 10px;
        padding: 1rem 2rem;
        font-size: 1rem;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.3s ease;
        display: flex;
        align-items: center;
        gap: 0.5rem;
        margin: 1rem 0;
    }
    
    .add-member-btn:hover {
        background: #229954;
        transform: translateY(-2px);
    }
    
    .checkbox-label {
        display: flex;
        align-items: flex-start;
        gap: 0.5rem;
        cursor: pointer;
        margin: 1rem 0;
    }
    
    .checkbox-label input[type="checkbox"] {
        margin: 0;
    }
    
    .password-strength {
        margin-top: 0.5rem;
    }
    
    .strength-level {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        margin-bottom: 0.25rem;
        font-size: 0.9rem;
    }
    
    .strength-level.met {
        color: #27ae60;
    }
    
    .strength-level.not-met {
        color: #e74c3c;
    }
    
    .strength-overall {
        margin-top: 0.5rem;
        padding: 0.5rem;
        border-radius: 5px;
        font-weight: 600;
        text-align: center;
    }
    
    .strength-overall.weak {
        background: #fdf2f2;
        color: #e74c3c;
    }
    
    .strength-overall.medium {
        background: #fef9e7;
        color: #f39c12;
    }
    
    .strength-overall.strong {
        background: #f0f9ff;
        color: #27ae60;
    }
    
    .form-group input.invalid {
        border-color: #e74c3c;
        box-shadow: 0 0 0 3px rgba(231, 76, 60, 0.1);
    }
    
    select {
        width: 100%;
        padding: 1rem;
        border: 2px solid #ecf0f1;
        border-radius: 10px;
        font-size: 1rem;
        transition: all 0.3s ease;
        background: white;
        cursor: pointer;
    }
    
    select:focus {
        outline: none;
        border-color: #3498db;
        box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.1);
    }
    
    @media (max-width: 768px) {
        .sports-grid {
            grid-template-columns: repeat(2, 1fr);
        }
        
        .member-form {
            grid-template-columns: 1fr;
        }
    }
    
    /* Notification Styles */
    .notification {
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 10000;
        max-width: 400px;
        min-width: 300px;
        border-radius: 10px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        animation: slideInRight 0.3s ease-out;
    }
    
    .notification-content {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        padding: 1rem 1.25rem;
        position: relative;
    }
    
    .notification-success {
        background: linear-gradient(135deg, #27ae60, #2ecc71);
        color: white;
    }
    
    .notification-error {
        background: linear-gradient(135deg, #e74c3c, #c0392b);
        color: white;
    }
    
    .notification-warning {
        background: linear-gradient(135deg, #f39c12, #e67e22);
        color: white;
    }
    
    .notification-info {
        background: linear-gradient(135deg, #3498db, #2980b9);
        color: white;
    }
    
    .notification-content i {
        font-size: 1.25rem;
        flex-shrink: 0;
    }
    
    .notification-content span {
        flex: 1;
        font-weight: 500;
    }
    
    .notification-close {
        background: none;
        border: none;
        color: inherit;
        cursor: pointer;
        padding: 0.25rem;
        border-radius: 50%;
        width: 24px;
        height: 24px;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: background-color 0.2s ease;
        flex-shrink: 0;
    }
    
    .notification-close:hover {
        background: rgba(255, 255, 255, 0.2);
    }
    
    @keyframes slideInRight {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @media (max-width: 480px) {
        .notification {
            top: 10px;
            right: 10px;
            left: 10px;
            max-width: none;
            min-width: auto;
        }
    }
`;
document.head.appendChild(style);