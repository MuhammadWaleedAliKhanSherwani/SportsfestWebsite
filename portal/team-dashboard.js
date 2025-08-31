// Team Dashboard JavaScript

let currentUser = null;
let teamData = null;
let realTimeListeners = [];

document.addEventListener('DOMContentLoaded', function() {
    initializeDashboard();
});

async function initializeDashboard() {
    // Check authentication
    auth.onAuthStateChanged(async function(user) {
        if (user) {
            currentUser = user;
            const userDoc = await db.collection('users').doc(user.uid).get();
            
            if (userDoc.exists && userDoc.data().role === 'team') {
                await loadTeamData();
                setupNavigation();
                setupRealTimeListeners();
            } else {
                showNotification('Access denied. Redirecting to portal...', 'error');
                setTimeout(() => {
                    window.location.href = 'index.html';
                }, 2000);
            }
        } else {
            window.location.href = 'team-login.html';
        }
    });
}

async function loadTeamData() {
    try {
        const teamDoc = await db.collection('teams').doc(currentUser.uid).get();
        if (teamDoc.exists) {
            teamData = teamDoc.data();
            updateDashboard();
        } else {
            showNotification('Team data not found. Please contact support.', 'error');
        }
    } catch (error) {
        console.error('Error loading team data:', error);
        showNotification('Error loading team data', 'error');
    }
}

function updateDashboard() {
    if (!teamData) return;

    // Update team name
    document.getElementById('teamName').textContent = teamData.teamName;

    // Update statistics
    document.getElementById('totalSports').textContent = teamData.sports ? teamData.sports.length : 0;
    document.getElementById('totalMembers').textContent = teamData.members ? teamData.members.length + 1 : 1; // +1 for captain

    // Update status
    document.getElementById('registrationStatus').textContent = teamData.status || 'Pending';
    document.getElementById('paymentStatus').textContent = teamData.paymentStatus || 'Pending';
    document.getElementById('lastUpdated').textContent = teamData.updatedAt ? 
        new Date(teamData.updatedAt.toDate()).toLocaleDateString() : 'N/A';

    // Load section data
    loadOverviewData();
    loadTeamInfo();
    loadSportsParticipation();
    loadResults();
    loadSchedule();
}

function setupNavigation() {
    const navButtons = document.querySelectorAll('.dashboard-nav-btn[data-section]');
    const sections = document.querySelectorAll('.dashboard-section');

    navButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            
            const targetSection = this.getAttribute('data-section');
            
            // Update active states
            navButtons.forEach(btn => btn.classList.remove('active'));
            sections.forEach(section => section.classList.remove('active'));
            
            this.classList.add('active');
            document.getElementById(targetSection).classList.add('active');
        });
    });
}

function setupRealTimeListeners() {
    // Listen for team data changes
    const teamListener = db.collection('teams').doc(currentUser.uid)
        .onSnapshot(function(doc) {
            if (doc.exists) {
                teamData = doc.data();
                updateDashboard();
            }
        }, function(error) {
            console.error('Error listening to team data:', error);
        });

    realTimeListeners.push(teamListener);
}

async function loadOverviewData() {
    try {
        // Load recent activity
        const activitySnapshot = await db.collection('team_activity')
            .where('teamId', '==', currentUser.uid)
            .orderBy('timestamp', 'desc')
            .limit(5)
            .get();

        const activityList = document.getElementById('recentActivity');
        if (activitySnapshot.empty) {
            activityList.innerHTML = '<div class="activity-item">No recent activity</div>';
        } else {
            activityList.innerHTML = '';
            activitySnapshot.forEach(doc => {
                const activity = doc.data();
                const activityItem = document.createElement('div');
                activityItem.className = 'activity-item';
                activityItem.innerHTML = `
                    <i class="fas fa-${getActivityIcon(activity.type)}"></i>
                    <span>${activity.description}</span>
                    <small>${new Date(activity.timestamp.toDate()).toLocaleDateString()}</small>
                `;
                activityList.appendChild(activityItem);
            });
        }

        // Load event counts
        const eventsSnapshot = await db.collection('events')
            .where('participatingTeams', 'array-contains', currentUser.uid)
            .get();

        let completedCount = 0;
        let upcomingCount = 0;
        const now = new Date();

        eventsSnapshot.forEach(doc => {
            const event = doc.data();
            if (event.endDate && event.endDate.toDate() < now) {
                completedCount++;
            } else {
                upcomingCount++;
            }
        });

        document.getElementById('completedEvents').textContent = completedCount;
        document.getElementById('upcomingEvents').textContent = upcomingCount;

    } catch (error) {
        console.error('Error loading overview data:', error);
    }
}

function loadTeamInfo() {
    if (!teamData) return;

    const teamInfo = document.getElementById('teamInfo');
    teamInfo.innerHTML = `
        <div class="info-grid">
            <div class="info-section">
                <h4>Basic Information</h4>
                <div class="info-item">
                    <span class="info-label">Team Name:</span>
                    <span class="info-value">${teamData.teamName}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Category:</span>
                    <span class="info-value">${teamData.teamCategory || 'N/A'}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Institution:</span>
                    <span class="info-value">${teamData.institution || 'N/A'}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">City:</span>
                    <span class="info-value">${teamData.city || 'N/A'}</span>
                </div>
            </div>
            
            <div class="info-section">
                <h4>Captain Information</h4>
                <div class="info-item">
                    <span class="info-label">Name:</span>
                    <span class="info-value">${teamData.captain?.name || 'N/A'}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Phone:</span>
                    <span class="info-value">${teamData.captain?.phone || 'N/A'}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Age:</span>
                    <span class="info-value">${teamData.captain?.age || 'N/A'}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">CNIC:</span>
                    <span class="info-value">${teamData.captain?.cnic || 'N/A'}</span>
                </div>
            </div>
            
            <div class="info-section">
                <h4>Team Members (${teamData.members?.length || 0})</h4>
                ${teamData.members ? teamData.members.map((member, index) => `
                    <div class="member-item">
                        <div class="member-name">${index + 1}. ${member.name}</div>
                        <div class="member-details">
                            <span>Age: ${member.age}</span>
                            <span>Phone: ${member.phone}</span>
                        </div>
                    </div>
                `).join('') : '<p>No additional members</p>'}
            </div>
        </div>
    `;
}

async function loadSportsParticipation() {
    try {
        const participationSnapshot = await db.collection('sports_participation')
            .where('teamId', '==', currentUser.uid)
            .get();

        const sportsContainer = document.getElementById('sportsParticipation');
        
        if (participationSnapshot.empty) {
            sportsContainer.innerHTML = '<p>No sports participation found</p>';
            return;
        }

        let sportsHTML = '<div class="sports-grid">';
        participationSnapshot.forEach(doc => {
            const participation = doc.data();
            sportsHTML += `
                <div class="sport-card">
                    <div class="sport-header">
                        <i class="fas fa-${getSportIcon(participation.sport)}"></i>
                        <h4>${participation.sport}</h4>
                    </div>
                    <div class="sport-status">
                        <span class="status-badge ${participation.status}">${participation.status}</span>
                    </div>
                    <div class="sport-details">
                        <p>Team: ${participation.teamName}</p>
                        <p>Registered: ${new Date(participation.createdAt.toDate()).toLocaleDateString()}</p>
                    </div>
                </div>
            `;
        });
        sportsHTML += '</div>';
        
        sportsContainer.innerHTML = sportsHTML;

    } catch (error) {
        console.error('Error loading sports participation:', error);
        document.getElementById('sportsParticipation').innerHTML = '<p>Error loading sports data</p>';
    }
}

async function loadResults() {
    try {
        const resultsSnapshot = await db.collection('results')
            .where('teamId', '==', currentUser.uid)
            .orderBy('date', 'desc')
            .get();

        const resultsContainer = document.getElementById('resultsContainer');
        
        if (resultsSnapshot.empty) {
            resultsContainer.innerHTML = '<p>No results available yet</p>';
            return;
        }

        let resultsHTML = '<div class="results-list">';
        resultsSnapshot.forEach(doc => {
            const result = doc.data();
            resultsHTML += `
                <div class="result-item">
                    <div class="result-header">
                        <h4>${result.sport}</h4>
                        <span class="result-date">${new Date(result.date.toDate()).toLocaleDateString()}</span>
                    </div>
                    <div class="result-details">
                        <div class="result-score">
                            <span>Score: ${result.score || 'N/A'}</span>
                            <span>Position: ${result.position || 'N/A'}</span>
                        </div>
                        <div class="result-status">
                            <span class="status-badge ${result.status}">${result.status}</span>
                        </div>
                    </div>
                </div>
            `;
        });
        resultsHTML += '</div>';
        
        resultsContainer.innerHTML = resultsHTML;

    } catch (error) {
        console.error('Error loading results:', error);
        document.getElementById('resultsContainer').innerHTML = '<p>Error loading results</p>';
    }
}

async function loadSchedule() {
    try {
        const scheduleSnapshot = await db.collection('events')
            .where('participatingTeams', 'array-contains', currentUser.uid)
            .orderBy('startDate')
            .get();

        const scheduleContainer = document.getElementById('scheduleContainer');
        
        if (scheduleSnapshot.empty) {
            scheduleContainer.innerHTML = '<p>No scheduled events found</p>';
            return;
        }

        let scheduleHTML = '<div class="schedule-list">';
        scheduleSnapshot.forEach(doc => {
            const event = doc.data();
            const startDate = event.startDate.toDate();
            const endDate = event.endDate.toDate();
            const isUpcoming = startDate > new Date();
            
            scheduleHTML += `
                <div class="schedule-item ${isUpcoming ? 'upcoming' : 'past'}">
                    <div class="schedule-header">
                        <h4>${event.sport}</h4>
                        <span class="schedule-date">${startDate.toLocaleDateString()}</span>
                    </div>
                    <div class="schedule-details">
                        <p><strong>Event:</strong> ${event.name}</p>
                        <p><strong>Time:</strong> ${startDate.toLocaleTimeString()} - ${endDate.toLocaleTimeString()}</p>
                        <p><strong>Venue:</strong> ${event.venue || 'TBD'}</p>
                        <p><strong>Status:</strong> <span class="status-badge ${event.status}">${event.status}</span></p>
                    </div>
                </div>
            `;
        });
        scheduleHTML += '</div>';
        
        scheduleContainer.innerHTML = scheduleHTML;

    } catch (error) {
        console.error('Error loading schedule:', error);
        document.getElementById('scheduleContainer').innerHTML = '<p>Error loading schedule</p>';
    }
}

// Utility functions
function getActivityIcon(type) {
    const icons = {
        'registration': 'user-plus',
        'sport_added': 'trophy',
        'result_updated': 'chart-line',
        'payment': 'credit-card',
        'default': 'info-circle'
    };
    return icons[type] || icons.default;
}

function getSportIcon(sport) {
    const icons = {
        'futsal': 'futbol',
        'cricket': 'cricket',
        'basketball': 'basketball-ball',
        'throwball': 'volleyball-ball',
        'volleyball': 'volleyball-ball',
        'dodgeball': 'circle',
        'badminton': 'table-tennis',
        'chess': 'chess',
        'ludo': 'dice',
        'carrom': 'circle',
        'scavengerHunt': 'search',
        'gaming': 'gamepad',
        'tableTennis': 'table-tennis',
        'athletics': 'running',
        'strongmen': 'dumbbell',
        'tugOfWar': 'grip-lines',
        'default': 'trophy'
    };
    return icons[sport] || icons.default;
}

// Action functions
function updateTeamInfo() {
    const updateFormHTML = `
        <div class="modal-content">
            <h3><i class="fas fa-edit"></i> Update Team Information</h3>
            <form id="updateTeamForm" class="team-form">
                <div class="form-group">
                    <label for="updateTeamName">Team Name *</label>
                    <input type="text" id="updateTeamName" name="teamName" value="${teamData.teamName || ''}" required>
                </div>
                
                <div class="form-group">
                    <label for="updateInstitution">Institution/Organization</label>
                    <input type="text" id="updateInstitution" name="institution" value="${teamData.institution || ''}">
                </div>
                
                <div class="form-group">
                    <label for="updateCity">City *</label>
                    <input type="text" id="updateCity" name="city" value="${teamData.city || ''}" required>
                </div>
                
                <div class="form-group">
                    <label for="updateSports">Sports Categories</label>
                    <div class="sports-checkboxes">
                        <label><input type="checkbox" name="sports" value="futsal" ${teamData.sports && teamData.sports.includes('futsal') ? 'checked' : ''}> Futsal</label>
                        <label><input type="checkbox" name="sports" value="cricket" ${teamData.sports && teamData.sports.includes('cricket') ? 'checked' : ''}> Cricket</label>
                        <label><input type="checkbox" name="sports" value="basketball" ${teamData.sports && teamData.sports.includes('basketball') ? 'checked' : ''}> Basketball</label>
                        <label><input type="checkbox" name="sports" value="throwball" ${teamData.sports && teamData.sports.includes('throwball') ? 'checked' : ''}> Throwball</label>
                        <label><input type="checkbox" name="sports" value="volleyball" ${teamData.sports && teamData.sports.includes('volleyball') ? 'checked' : ''}> Volleyball</label>
                        <label><input type="checkbox" name="sports" value="dodgeball" ${teamData.sports && teamData.sports.includes('dodgeball') ? 'checked' : ''}> Dodgeball</label>
                        <label><input type="checkbox" name="sports" value="badminton" ${teamData.sports && teamData.sports.includes('badminton') ? 'checked' : ''}> Badminton</label>
                        <label><input type="checkbox" name="sports" value="chess" ${teamData.sports && teamData.sports.includes('chess') ? 'checked' : ''}> Chess</label>
                        <label><input type="checkbox" name="sports" value="ludo" ${teamData.sports && teamData.sports.includes('ludo') ? 'checked' : ''}> Ludo</label>
                        <label><input type="checkbox" name="sports" value="carrom" ${teamData.sports && teamData.sports.includes('carrom') ? 'checked' : ''}> Carrom</label>
                        <label><input type="checkbox" name="sports" value="scavengerHunt" ${teamData.sports && teamData.sports.includes('scavengerHunt') ? 'checked' : ''}> Scavenger Hunt</label>
                        <label><input type="checkbox" name="sports" value="gaming" ${teamData.sports && teamData.sports.includes('gaming') ? 'checked' : ''}> Gaming</label>
                        <label><input type="checkbox" name="sports" value="tableTennis" ${teamData.sports && teamData.sports.includes('tableTennis') ? 'checked' : ''}> Table Tennis</label>
                        <label><input type="checkbox" name="sports" value="athletics" ${teamData.sports && teamData.sports.includes('athletics') ? 'checked' : ''}> Athletics</label>
                        <label><input type="checkbox" name="sports" value="strongmen" ${teamData.sports && teamData.sports.includes('strongmen') ? 'checked' : ''}> Strongmen</label>
                        <label><input type="checkbox" name="sports" value="tugOfWar" ${teamData.sports && teamData.sports.includes('tugOfWar') ? 'checked' : ''}> Tug of War</label>
                    </div>
                </div>
                
                <div class="form-actions">
                    <button type="button" onclick="closeModal()" class="btn btn-secondary">Cancel</button>
                    <button type="submit" class="btn btn-primary">Update Information</button>
                </div>
            </form>
        </div>
    `;
    
    showModal(updateFormHTML);
    
    // Add form submission handler
    document.getElementById('updateTeamForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const selectedSports = formData.getAll('sports');
        
        const updateData = {
            teamName: formData.get('teamName'),
            institution: formData.get('institution'),
            city: formData.get('city'),
            sports: selectedSports,
            updatedAt: new Date()
        };
        
        try {
            await db.collection('teams').doc(currentUser.uid).update(updateData);
            showNotification('Team information updated successfully!', 'success');
            closeModal();
            loadTeamData(); // Refresh team data
        } catch (error) {
            console.error('Error updating team info:', error);
            showNotification('Error updating team information', 'error');
        }
    });
}

function viewSchedule() {
    // Load events for the team's sports
    loadTeamSchedule();
    
    // Switch to schedule section
    const scheduleBtn = document.querySelector('[data-section="schedule"]');
    if (scheduleBtn) {
        scheduleBtn.click();
    }
}

async function loadTeamSchedule() {
    try {
        const scheduleContainer = document.getElementById('scheduleContainer');
        if (!scheduleContainer) return;
        
        scheduleContainer.innerHTML = '<div class="loading">Loading schedule...</div>';
        
        // Get events for the team's sports
        const teamSports = teamData.sports || [];
        if (teamSports.length === 0) {
            scheduleContainer.innerHTML = '<div class="no-data">No sports selected. Please update your team information.</div>';
            return;
        }
        
        const eventsSnapshot = await db.collection('events')
            .where('sport', 'in', teamSports)
            .where('status', 'in', ['upcoming', 'ongoing'])
            .orderBy('startDate')
            .get();
        
        const events = [];
        eventsSnapshot.forEach(doc => {
            events.push({ id: doc.id, ...doc.data() });
        });
        
        if (events.length === 0) {
            scheduleContainer.innerHTML = '<div class="no-data">No upcoming events found for your selected sports.</div>';
            return;
        }
        
        const scheduleHTML = events.map(event => {
            const startDate = event.startDate.toDate();
            const endDate = event.endDate.toDate();
            
            return `
                <div class="schedule-item">
                    <div class="schedule-header">
                        <h4><i class="fas fa-${getSportIcon(event.sport)}"></i> ${event.name}</h4>
                        <span class="event-status ${event.status}">${event.status}</span>
                    </div>
                    <div class="schedule-details">
                        <p><i class="fas fa-calendar"></i> <strong>Date:</strong> ${startDate.toLocaleDateString()}</p>
                        <p><i class="fas fa-clock"></i> <strong>Time:</strong> ${startDate.toLocaleTimeString()} - ${endDate.toLocaleTimeString()}</p>
                        <p><i class="fas fa-map-marker-alt"></i> <strong>Venue:</strong> ${event.venue || 'TBD'}</p>
                        <p><i class="fas fa-users"></i> <strong>Teams:</strong> ${event.participatingTeams ? event.participatingTeams.length : 0}/${event.maxTeams || '∞'}</p>
                        ${event.description ? `<p><i class="fas fa-info-circle"></i> <strong>Description:</strong> ${event.description}</p>` : ''}
                    </div>
                </div>
            `;
        }).join('');
        
        scheduleContainer.innerHTML = scheduleHTML;
        
    } catch (error) {
        console.error('Error loading schedule:', error);
        document.getElementById('scheduleContainer').innerHTML = '<div class="error">Error loading schedule. Please try again.</div>';
    }
}

function viewResults() {
    // Load team results
    loadTeamResults();
    
    // Switch to results section
    const resultsBtn = document.querySelector('[data-section="results"]');
    if (resultsBtn) {
        resultsBtn.click();
    }
}

async function loadTeamResults() {
    try {
        const resultsContainer = document.getElementById('resultsContainer');
        if (!resultsContainer) return;
        
        resultsContainer.innerHTML = '<div class="loading">Loading results...</div>';
        
        // Get results for this team
        const resultsSnapshot = await db.collection('results')
            .where('teamId', '==', currentUser.uid)
            .orderBy('date', 'desc')
            .get();
        
        const results = [];
        resultsSnapshot.forEach(doc => {
            results.push({ id: doc.id, ...doc.data() });
        });
        
        if (results.length === 0) {
            resultsContainer.innerHTML = '<div class="no-data">No results found yet. Check back after participating in events!</div>';
            return;
        }
        
        const resultsHTML = results.map(result => {
            const resultDate = result.date.toDate();
            
            return `
                <div class="result-item">
                    <div class="result-header">
                        <h4><i class="fas fa-${getSportIcon(result.sport)}"></i> ${result.sport}</h4>
                        <span class="result-status ${result.status}">${result.status}</span>
                    </div>
                    <div class="result-details">
                        <p><i class="fas fa-calendar"></i> <strong>Date:</strong> ${resultDate.toLocaleDateString()}</p>
                        <p><i class="fas fa-trophy"></i> <strong>Score/Result:</strong> ${result.score}</p>
                        ${result.position ? `<p><i class="fas fa-medal"></i> <strong>Position:</strong> ${result.position}</p>` : ''}
                        ${result.notes ? `<p><i class="fas fa-info-circle"></i> <strong>Notes:</strong> ${result.notes}</p>` : ''}
                    </div>
                </div>
            `;
        }).join('');
        
        resultsContainer.innerHTML = resultsHTML;
        
    } catch (error) {
        console.error('Error loading results:', error);
        document.getElementById('resultsContainer').innerHTML = '<div class="error">Error loading results. Please try again.</div>';
    }
}

function contactSupport() {
    window.open('mailto:support@pakistanfutsal.com?subject=Team Support Request', '_blank');
}

// Cleanup on page unload
window.addEventListener('beforeunload', function() {
    realTimeListeners.forEach(unsubscribe => {
        if (typeof unsubscribe === 'function') {
            unsubscribe();
        }
    });
});

// Add CSS for dashboard components
const style = document.createElement('style');
style.textContent = `
    .dashboard-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
        gap: 2rem;
    }
    
    .stats-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 1rem;
    }
    
    .stat-item {
        text-align: center;
        padding: 1rem;
        background: rgba(255, 255, 255, 0.05);
        border-radius: 10px;
        border: 1px solid rgba(255, 255, 255, 0.1);
    }
    
    .stat-number {
        font-size: 2rem;
        font-weight: 700;
        color: var(--royal-gold);
        margin-bottom: 0.5rem;
    }
    
    .stat-label {
        font-size: 0.9rem;
        color: rgba(255, 255, 255, 0.8);
    }
    
    .activity-list {
        max-height: 300px;
        overflow-y: auto;
    }
    
    .activity-item {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        padding: 0.75rem;
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    }
    
    .activity-item:last-child {
        border-bottom: none;
    }
    
    .activity-item i {
        color: var(--royal-gold);
        width: 20px;
    }
    
    .activity-item small {
        color: rgba(255, 255, 255, 0.6);
        font-size: 0.8rem;
        margin-left: auto;
    }
    
    .quick-actions {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
    }
    
    .action-btn {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.75rem 1rem;
        background: rgba(255, 255, 255, 0.1);
        border: 1px solid rgba(255, 255, 255, 0.2);
        border-radius: 8px;
        color: var(--pure-white);
        cursor: pointer;
        transition: all 0.3s ease;
        font-size: 0.9rem;
    }
    
    .action-btn:hover {
        background: var(--royal-gold);
        color: var(--midnight-navy);
    }
    
    .status-info {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
    }
    
    .status-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 0.5rem 0;
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    }
    
    .status-item:last-child {
        border-bottom: none;
    }
    
    .status-label {
        color: rgba(255, 255, 255, 0.8);
        font-size: 0.9rem;
    }
    
    .status-value {
        color: var(--royal-gold);
        font-weight: 600;
    }
    
    .dashboard-section {
        display: none;
    }
    
    .dashboard-section.active {
        display: block;
    }
    
    .info-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
        gap: 2rem;
    }
    
    .info-section h4 {
        color: var(--royal-gold);
        margin-bottom: 1rem;
        font-size: 1.1rem;
    }
    
    .info-item {
        display: flex;
        justify-content: space-between;
        padding: 0.5rem 0;
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    }
    
    .info-item:last-child {
        border-bottom: none;
    }
    
    .info-label {
        color: rgba(255, 255, 255, 0.8);
        font-weight: 500;
    }
    
    .info-value {
        color: var(--pure-white);
        font-weight: 600;
    }
    
    .member-item {
        padding: 0.75rem;
        background: rgba(255, 255, 255, 0.05);
        border-radius: 8px;
        margin-bottom: 0.5rem;
    }
    
    .member-name {
        font-weight: 600;
        color: var(--pure-white);
        margin-bottom: 0.25rem;
    }
    
    .member-details {
        display: flex;
        gap: 1rem;
        font-size: 0.8rem;
        color: rgba(255, 255, 255, 0.7);
    }
    
    .sports-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
        gap: 1rem;
    }
    
    .sport-card {
        background: rgba(255, 255, 255, 0.05);
        border-radius: 10px;
        padding: 1rem;
        border: 1px solid rgba(255, 255, 255, 0.1);
    }
    
    .sport-header {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        margin-bottom: 0.75rem;
    }
    
    .sport-header i {
        color: var(--royal-gold);
        font-size: 1.2rem;
    }
    
    .sport-header h4 {
        color: var(--pure-white);
        margin: 0;
        text-transform: capitalize;
    }
    
    .sport-status {
        margin-bottom: 0.75rem;
    }
    
    .status-badge {
        padding: 0.25rem 0.75rem;
        border-radius: 20px;
        font-size: 0.8rem;
        font-weight: 600;
        text-transform: uppercase;
    }
    
    .status-badge.registered {
        background: #3498db;
        color: white;
    }
    
    .status-badge.active {
        background: #27ae60;
        color: white;
    }
    
    .status-badge.completed {
        background: #95a5a6;
        color: white;
    }
    
    .status-badge.pending {
        background: #f39c12;
        color: white;
    }
    
    .sport-details p {
        margin: 0.25rem 0;
        font-size: 0.9rem;
        color: rgba(255, 255, 255, 0.8);
    }
    
    .results-list, .schedule-list {
        display: flex;
        flex-direction: column;
        gap: 1rem;
    }
    
    .result-item, .schedule-item {
        background: rgba(255, 255, 255, 0.05);
        border-radius: 10px;
        padding: 1rem;
        border: 1px solid rgba(255, 255, 255, 0.1);
    }
    
    .result-header, .schedule-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 0.75rem;
    }
    
    .result-header h4, .schedule-header h4 {
        color: var(--royal-gold);
        margin: 0;
        text-transform: capitalize;
    }
    
    .result-date, .schedule-date {
        color: rgba(255, 255, 255, 0.6);
        font-size: 0.9rem;
    }
    
    .result-details {
        display: flex;
        justify-content: space-between;
        align-items: center;
    }
    
    .result-score {
        display: flex;
        gap: 1rem;
        font-size: 0.9rem;
        color: rgba(255, 255, 255, 0.8);
    }
    
    .schedule-details p {
        margin: 0.5rem 0;
        font-size: 0.9rem;
        color: rgba(255, 255, 255, 0.8);
    }
    
    .loading {
        text-align: center;
        color: rgba(255, 255, 255, 0.6);
        padding: 2rem;
    }
    
    .no-data {
        text-align: center;
        color: rgba(255, 255, 255, 0.6);
        padding: 2rem;
    }
    
    .error {
        text-align: center;
        color: var(--error-red);
        padding: 2rem;
    }
    
    .event-status {
        padding: 0.25rem 0.75rem;
        border-radius: 20px;
        font-size: 0.8rem;
        font-weight: 600;
        text-transform: uppercase;
    }
    
    .event-status.upcoming {
        background: #3498db;
        color: white;
    }
    
    .event-status.ongoing {
        background: #27ae60;
        color: white;
    }
    
    .event-status.completed {
        background: #95a5a6;
        color: white;
    }
    
    .event-status.cancelled {
        background: #e74c3c;
        color: white;
    }
    
    @media (max-width: 768px) {
        .dashboard-grid {
            grid-template-columns: 1fr;
        }
        
        .stats-grid {
            grid-template-columns: 1fr;
        }
        
        .info-grid {
            grid-template-columns: 1fr;
        }
        
        .sports-grid {
            grid-template-columns: 1fr;
        }
        
        .result-details {
            flex-direction: column;
            align-items: flex-start;
            gap: 0.5rem;
        }
    }
`;
document.head.appendChild(style); 