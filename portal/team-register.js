// Team Registration JavaScript

document.addEventListener('DOMContentLoaded', function() {
    initializeRegistrationForm();
});

function initializeRegistrationForm() {
    const form = document.getElementById('registrationForm');
    const addMemberBtn = document.getElementById('addMember');
    const passwordInput = document.getElementById('password');
    const confirmPasswordInput = document.getElementById('confirmPassword');
    const passwordStrength = document.getElementById('passwordStrength');

    let memberCount = 1;

    // Password strength validation
    passwordInput.addEventListener('input', function() {
        const password = this.value;
        const validation = validatePassword(password);
        
        if (password.length > 0) {
            if (validation.isValid) {
                passwordStrength.textContent = '✅ Strong password';
                passwordStrength.style.color = '#27ae60';
            } else {
                passwordStrength.textContent = '⚠️ ' + validation.errors.join(', ');
                passwordStrength.style.color = '#f39c12';
            }
        } else {
            passwordStrength.textContent = '';
        }
    });

    // Confirm password validation
    confirmPasswordInput.addEventListener('input', function() {
        const password = passwordInput.value;
        const confirmPassword = this.value;
        
        if (confirmPassword.length > 0) {
            if (password === confirmPassword) {
                this.style.borderColor = '#27ae60';
                this.style.backgroundColor = 'rgba(39, 174, 96, 0.1)';
            } else {
                this.style.borderColor = '#e74c3c';
                this.style.backgroundColor = 'rgba(231, 76, 60, 0.1)';
            }
        } else {
            this.style.borderColor = 'rgba(255, 255, 255, 0.2)';
            this.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
        }
    });

    // Add member functionality
    addMemberBtn.addEventListener('click', function() {
        memberCount++;
        if (memberCount <= 10) { // Limit to 10 members
            addMemberRow(memberCount);
        } else {
            showNotification('Maximum 10 team members allowed', 'error');
        }
    });

    // Form submission
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        if (validateForm()) {
            await registerTeam();
        }
    });

    // Phone number formatting
    const phoneInputs = document.querySelectorAll('input[type="tel"]');
    phoneInputs.forEach(input => {
        input.addEventListener('input', function() {
            let value = this.value.replace(/\D/g, '');
            if (value.length > 0) {
                if (value.startsWith('0')) {
                    value = value.substring(1);
                }
                if (value.length <= 10) {
                    this.value = value;
                } else {
                    this.value = value.substring(0, 10);
                }
            }
        });
    });

    // CNIC formatting
    const cnicInput = document.getElementById('captainCNIC');
    cnicInput.addEventListener('input', function() {
        let value = this.value.replace(/\D/g, '');
        if (value.length <= 13) {
            if (value.length >= 5) {
                value = value.substring(0, 5) + '-' + value.substring(5);
            }
            if (value.length >= 13) {
                value = value.substring(0, 13) + '-' + value.substring(13, 14);
            }
            this.value = value;
        }
    });
}

function addMemberRow(memberNumber) {
    const teamMembers = document.getElementById('teamMembers');
    const memberRow = document.createElement('div');
    memberRow.className = 'member-row';
    memberRow.setAttribute('data-member', memberNumber);
    
    memberRow.innerHTML = `
        <div class="form-row">
            <div class="form-group">
                <label>Member ${memberNumber} Name *</label>
                <input type="text" name="member${memberNumber}Name" placeholder="Full name" required>
            </div>
            <div class="form-group">
                <label>Member ${memberNumber} Age *</label>
                <input type="number" name="member${memberNumber}Age" min="16" max="50" placeholder="Age" required>
            </div>
            <div class="form-group">
                <label>Member ${memberNumber} Phone *</label>
                <input type="tel" name="member${memberNumber}Phone" placeholder="03xxxxxxxxx" required>
            </div>
            <div class="form-group">
                <button type="button" class="remove-member-btn" onclick="removeMember(${memberNumber})">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `;
    
    teamMembers.appendChild(memberRow);
    
    // Add phone formatting to new input
    const newPhoneInput = memberRow.querySelector('input[type="tel"]');
    newPhoneInput.addEventListener('input', function() {
        let value = this.value.replace(/\D/g, '');
        if (value.length > 0) {
            if (value.startsWith('0')) {
                value = value.substring(1);
            }
            if (value.length <= 10) {
                this.value = value;
            } else {
                this.value = value.substring(0, 10);
            }
        }
    });
}

function removeMember(memberNumber) {
    const memberRow = document.querySelector(`[data-member="${memberNumber}"]`);
    if (memberRow) {
        memberRow.remove();
        // Renumber remaining members
        const remainingMembers = document.querySelectorAll('.member-row');
        remainingMembers.forEach((row, index) => {
            const newNumber = index + 1;
            row.setAttribute('data-member', newNumber);
            const labels = row.querySelectorAll('label');
            const inputs = row.querySelectorAll('input');
            
            labels[0].textContent = `Member ${newNumber} Name *`;
            labels[1].textContent = `Member ${newNumber} Age *`;
            labels[2].textContent = `Member ${newNumber} Phone *`;
            
            inputs[0].name = `member${newNumber}Name`;
            inputs[1].name = `member${newNumber}Age`;
            inputs[2].name = `member${newNumber}Phone`;
        });
    }
}

function validateForm() {
    const form = document.getElementById('registrationForm');
    const formData = new FormData(form);
    
    // Check if at least one sport is selected
    const selectedSports = formData.getAll('sports');
    if (selectedSports.length === 0) {
        showNotification('Please select at least one sports category', 'error');
        return false;
    }
    
    // Check password confirmation
    const password = formData.get('password');
    const confirmPassword = formData.get('confirmPassword');
    if (password !== confirmPassword) {
        showNotification('Passwords do not match', 'error');
        return false;
    }
    
    // Validate password strength
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
        showNotification('Password is too weak. ' + passwordValidation.errors.join(', '), 'error');
        return false;
    }
    
    // Validate email format
    const email = formData.get('email');
    if (!isValidEmail(email)) {
        showNotification('Please enter a valid email address', 'error');
        return false;
    }
    
    // Validate phone numbers
    const captainPhone = formData.get('captainPhone');
    if (captainPhone.length < 10) {
        showNotification('Please enter a valid phone number for captain', 'error');
        return false;
    }
    
    // Validate CNIC format
    const captainCNIC = formData.get('captainCNIC');
    if (!/^\d{5}-\d{7}-\d{1}$/.test(captainCNIC)) {
        showNotification('Please enter a valid CNIC in format: 35202-1234567-8', 'error');
        return false;
    }
    
    return true;
}

async function registerTeam() {
    try {
        showNotification('Creating your team account...', 'info');
        
        const form = document.getElementById('registrationForm');
        const formData = new FormData(form);
        
        // Create user account
        const email = formData.get('email');
        const password = formData.get('password');
        
        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        const user = userCredential.user;
        
        // Prepare team data
        const teamData = {
            // Account info
            email: email,
            teamName: formData.get('teamName'),
            teamCategory: formData.get('teamCategory'),
            institution: formData.get('institution'),
            city: formData.get('city'),
            
            // Captain info
            captain: {
                name: formData.get('captainName'),
                phone: formatPhoneNumber(formData.get('captainPhone')),
                age: parseInt(formData.get('captainAge')),
                cnic: formData.get('captainCNIC')
            },
            
            // Team members
            members: [],
            
            // Sports categories
            sports: formData.getAll('sports'),
            
            // Metadata
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            status: 'pending',
            registrationComplete: false
        };
        
        // Add team members
        const memberRows = document.querySelectorAll('.member-row');
        memberRows.forEach((row, index) => {
            const memberNumber = index + 1;
            const member = {
                name: formData.get(`member${memberNumber}Name`),
                age: parseInt(formData.get(`member${memberNumber}Age`)),
                phone: formatPhoneNumber(formData.get(`member${memberNumber}Phone`))
            };
            teamData.members.push(member);
        });
        
        // Create user document
        await createUserDocument(user, 'team', {
            teamName: teamData.teamName,
            teamId: user.uid
        });
        
        // Create team document
        await db.collection('teams').doc(user.uid).set(teamData);
        
        // Create sports participation records
        for (const sport of teamData.sports) {
            await db.collection('sports_participation').add({
                teamId: user.uid,
                teamName: teamData.teamName,
                sport: sport,
                status: 'registered',
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
        }
        
        showNotification('Team registration successful! Redirecting to dashboard...', 'success');
        
        // Redirect to team dashboard
        setTimeout(() => {
            window.location.href = 'team-dashboard.html';
        }, 2000);
        
    } catch (error) {
        console.error('Registration error:', error);
        showNotification(getErrorMessage(error.code), 'error');
    }
}

// Add CSS for form sections
const style = document.createElement('style');
style.textContent = `
    .form-section {
        margin-bottom: 2rem;
        padding: 1.5rem;
        background: rgba(255, 255, 255, 0.05);
        border-radius: 10px;
        border: 1px solid rgba(255, 255, 255, 0.1);
    }
    
    .form-section h3 {
        color: var(--royal-gold);
        margin-bottom: 1rem;
        font-size: 1.2rem;
        display: flex;
        align-items: center;
        gap: 0.5rem;
    }
    
    .form-row {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 1rem;
        margin-bottom: 1rem;
    }
    
    .form-row:last-child {
        margin-bottom: 0;
    }
    
    .section-description {
        color: rgba(255, 255, 255, 0.8);
        margin-bottom: 1rem;
        font-size: 0.9rem;
    }
    
    .sports-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 1rem;
        margin-top: 1rem;
    }
    
    .sport-checkbox {
        display: flex;
        align-items: center;
        padding: 0.75rem;
        background: rgba(255, 255, 255, 0.05);
        border-radius: 8px;
        border: 1px solid rgba(255, 255, 255, 0.1);
        transition: all 0.3s ease;
    }
    
    .sport-checkbox:hover {
        background: rgba(255, 255, 255, 0.1);
        border-color: var(--royal-gold);
    }
    
    .sport-checkbox input[type="checkbox"] {
        margin-right: 0.75rem;
        transform: scale(1.2);
    }
    
    .sport-checkbox label {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        cursor: pointer;
        font-weight: 500;
    }
    
    .sport-checkbox i {
        color: var(--royal-gold);
        font-size: 1.1rem;
    }
    
    .checkbox-group {
        display: flex;
        align-items: flex-start;
        gap: 0.75rem;
    }
    
    .checkbox-group input[type="checkbox"] {
        margin-top: 0.25rem;
        transform: scale(1.2);
    }
    
    .checkbox-group label {
        font-size: 0.9rem;
        line-height: 1.4;
    }
    
    .checkbox-group a {
        color: var(--royal-gold);
        text-decoration: underline;
    }
    
    .password-strength {
        font-size: 0.8rem;
        margin-top: 0.25rem;
        display: block;
    }
    
    .member-row {
        margin-bottom: 1rem;
        padding: 1rem;
        background: rgba(255, 255, 255, 0.03);
        border-radius: 8px;
        border: 1px solid rgba(255, 255, 255, 0.1);
    }
    
    .remove-member-btn {
        background: #e74c3c;
        color: white;
        border: none;
        border-radius: 50%;
        width: 35px;
        height: 35px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.3s ease;
    }
    
    .remove-member-btn:hover {
        background: #c0392b;
        transform: scale(1.1);
    }
    
    @media (max-width: 768px) {
        .form-row {
            grid-template-columns: 1fr;
        }
        
        .sports-grid {
            grid-template-columns: 1fr;
        }
    }
`;
document.head.appendChild(style); 