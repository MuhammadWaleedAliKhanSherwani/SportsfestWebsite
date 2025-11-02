// Portal JavaScript - Main functionality for Sports Fest Portal

// Global variables
let currentUser = null;
let userRole = null;

// Initialize portal
document.addEventListener('DOMContentLoaded', function() {
    initializePortal();
    loadPortalStats();
});

// Initialize portal functionality
function initializePortal() {
    // Check authentication state
    auth.onAuthStateChanged(function(user) {
        if (user) {
            currentUser = user;
            checkUserRole(user.uid);
        } else {
            // User is signed out
            currentUser = null;
            userRole = null;
        }
    });

    // Initialize mobile navigation
    initMobileNav();
}

// Check user role from Firestore
async function checkUserRole(uid) {
    try {
        const userDoc = await db.collection('users').doc(uid).get();
        if (userDoc.exists) {
            userRole = userDoc.data().role;
            updateUIForUser();
        }
    } catch (error) {
        console.error('Error checking user role:', error);
    }
}

// Update UI based on user authentication and role
function updateUIForUser() {
    const portalCards = document.querySelector('.portal-cards');
    if (!portalCards) return;

    if (currentUser && userRole) {
        // User is logged in, show appropriate portal access
        if (userRole === 'admin') {
            portalCards.innerHTML = `
                <div class="portal-card admin-portal">
                    <div class="portal-card-icon">
                        <i class="fas fa-shield-alt"></i>
                    </div>
                    <h2>Welcome, Admin!</h2>
                    <p>You are logged in as an administrator. Access the admin dashboard to manage all teams and tournament data.</p>
                    <div class="portal-features">
                        <div class="feature">
                            <i class="fas fa-check"></i>
                            <span>Complete Team Management</span>
                        </div>
                        <div class="feature">
                            <i class="fas fa-check"></i>
                            <span>Real-time Tournament Tracking</span>
                        </div>
                        <div class="feature">
                            <i class="fas fa-check"></i>
                            <span>Data Export & Analytics</span>
                        </div>
                        <div class="feature">
                            <i class="fas fa-check"></i>
                            <span>Advanced Filtering & Search</span>
                        </div>
                    </div>
                    <a href="admin-dashboard.html" class="portal-btn primary">
                        <i class="fas fa-tachometer-alt"></i>
                        Access Admin Dashboard
                    </a>
                    <button onclick="signOut()" class="portal-btn secondary" style="margin-top: 1rem;">
                        <i class="fas fa-sign-out-alt"></i>
                        Sign Out
                    </button>
                </div>
            `;
        } else if (userRole === 'team') {
            portalCards.innerHTML = `
                <div class="portal-card team-portal">
                    <div class="portal-card-icon">
                        <i class="fas fa-users"></i>
                    </div>
                    <h2>Welcome, Team!</h2>
                    <p>You are logged in as a team member. Access your team dashboard to manage registrations and track progress.</p>
                    <div class="portal-features">
                        <div class="feature">
                            <i class="fas fa-check"></i>
                            <span>Team Registration & Management</span>
                        </div>
                        <div class="feature">
                            <i class="fas fa-check"></i>
                            <span>Real-time Progress Tracking</span>
                        </div>
                        <div class="feature">
                            <i class="fas fa-check"></i>
                            <span>Score Updates & Results</span>
                        </div>
                        <div class="feature">
                            <i class="fas fa-check"></i>
                            <span>18 Sports Categories</span>
                        </div>
                    </div>
                    <a href="team-dashboard.html" class="portal-btn primary">
                        <i class="fas fa-tachometer-alt"></i>
                        Access Team Dashboard
                    </a>
                    <button onclick="signOut()" class="portal-btn secondary" style="margin-top: 1rem;">
                        <i class="fas fa-sign-out-alt"></i>
                        Sign Out
                    </button>
                </div>
            `;
        }
    }
}

// Load portal statistics
async function loadPortalStats() {
    try {
        // Get total teams
        const teamsSnapshot = await db.collection('teams').get();
        const totalTeams = teamsSnapshot.size;
        
        // Get active events (events with status 'active')
        const activeEventsSnapshot = await db.collection('events').where('status', '==', 'active').get();
        const activeEvents = activeEventsSnapshot.size;
        
        // Get completed events
        const completedEventsSnapshot = await db.collection('events').where('status', '==', 'completed').get();
        const completedEvents = completedEventsSnapshot.size;

        // Update UI
        const totalTeamsElement = document.getElementById('totalTeams');
        const activeEventsElement = document.getElementById('activeEvents');
        const completedEventsElement = document.getElementById('completedEvents');

        if (totalTeamsElement) totalTeamsElement.textContent = totalTeams;
        if (activeEventsElement) activeEventsElement.textContent = activeEvents;
        if (completedEventsElement) completedEventsElement.textContent = completedEvents;

    } catch (error) {
        console.error('Error loading portal stats:', error);
    }
}

// Sign out function
async function signOut() {
    try {
        await auth.signOut();
        window.location.href = 'index.html';
    } catch (error) {
        console.error('Error signing out:', error);
        showNotification('Error signing out. Please try again.', 'error');
    }
}

// Initialize mobile navigation
function initMobileNav() {
    const navToggle = document.querySelector('.nav-toggle');
    const navMenu = document.querySelector('.nav-menu');

    if (navToggle && navMenu) {
        navToggle.addEventListener('click', function() {
            navMenu.classList.toggle('active');
            navToggle.classList.toggle('active');
        });

        // Close mobile menu when clicking on a link
        const navLinks = document.querySelectorAll('.nav-menu a');
        navLinks.forEach(link => {
            link.addEventListener('click', () => {
                navMenu.classList.remove('active');
                navToggle.classList.remove('active');
            });
        });
    }
}

// Utility function to show notifications
function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas fa-${type === 'error' ? 'exclamation-circle' : type === 'success' ? 'check-circle' : 'info-circle'}"></i>
            <span>${message}</span>
        </div>
        <button class="notification-close">
            <i class="fas fa-times"></i>
        </button>
    `;

    // Add styles
    notification.style.cssText = `
        position: fixed;
        top: 100px;
        right: 20px;
        background: ${type === 'error' ? '#e74c3c' : type === 'success' ? '#27ae60' : '#3498db'};
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 10px;
        box-shadow: 0 10px 20px rgba(0,0,0,0.3);
        z-index: 10000;
        display: flex;
        align-items: center;
        gap: 1rem;
        max-width: 400px;
        animation: slideInRight 0.3s ease;
    `;

    // Add to page
    document.body.appendChild(notification);

    // Close button functionality
    const closeBtn = notification.querySelector('.notification-close');
    closeBtn.addEventListener('click', () => {
        notification.remove();
    });

    // Auto remove after 5 seconds
    setTimeout(() => {
        if (notification.parentNode) {
            notification.remove();
        }
    }, 5000);
}

// Add CSS animation for notifications
const portalStyle = document.createElement('style');
portalStyle.textContent = `
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
    
    .notification-content {
        display: flex;
        align-items: center;
        gap: 0.5rem;
    }
    
    .notification-close {
        background: none;
        border: none;
        color: white;
        cursor: pointer;
        padding: 0.25rem;
        border-radius: 50%;
        transition: background 0.3s ease;
    }
    
    .notification-close:hover {
        background: rgba(255,255,255,0.2);
    }
`;
document.head.appendChild(portalStyle);

// Export functions for use in other files
window.showNotification = showNotification;
window.signOut = signOut; 