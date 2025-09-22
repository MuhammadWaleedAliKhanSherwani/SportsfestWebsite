// Team Dashboard JavaScript

let currentUser = null;
let teamData = null;
let teamId = null;

// Initialize dashboard
document.addEventListener('DOMContentLoaded', function() {
    initializeDashboard();
});

// Initialize dashboard functionality
async function initializeDashboard() {
    try {
        // Check authentication
        auth.onAuthStateChanged(async function(user) {
            if (user) {
                currentUser = user;
                teamId = user.uid;
                await loadTeamData();
                await loadDashboardStats();
                await loadEvents();
                await loadResults();
            } else {
                // Redirect to login if not authenticated
                window.location.href = 'team-login.html';
            }
        });
    } catch (error) {
        console.error('Dashboard initialization error:', error);
        showNotification('Error loading dashboard. Please try again.', 'error');
    }
}

// Load team data
async function loadTeamData() {
    try {
        const teamDoc = await db.collection('teams').doc(teamId).get();
        if (teamDoc.exists) {
            teamData = teamDoc.data();
            displayTeamInfo();
            displaySportsParticipation();
            displayTeamMembers();
        } else {
            showNotification('Team data not found. Please contact support.', 'error');
        }
    } catch (error) {
        console.error('Error loading team data:', error);
        showNotification('Error loading team data.', 'error');
    }
}

// Display team information
function displayTeamInfo() {
    if (!teamData) return;

    document.getElementById('teamName').textContent = teamData.teamName || 'Team Dashboard';
    document.getElementById('teamNameInfo').textContent = teamData.teamName || '-';
    document.getElementById('institutionInfo').textContent = teamData.institution || '-';
    document.getElementById('cityInfo').textContent = teamData.city || '-';
    document.getElementById('categoryInfo').textContent = teamData.teamCategory || '-';
    document.getElementById('captainInfo').textContent = teamData.captain?.name || '-';
    
    // Status badge
    const statusElement = document.getElementById('statusInfo');
    const status = teamData.status || 'pending';
    statusElement.textContent = status.charAt(0).toUpperCase() + status.slice(1);
    statusElement.className = `status-badge ${status}`;
}

// Display sports participation
function displaySportsParticipation() {
    if (!teamData || !teamData.sports) return;

    const sportsList = document.getElementById('sportsList');
    sportsList.innerHTML = '';

    if (teamData.sports.length === 0) {
        sportsList.innerHTML = '<p class="no-data">No sports selected. <a href="#" onclick="editSportsParticipation()">Add sports</a></p>';
        return;
    }

    const sportsGrid = document.createElement('div');
    sportsGrid.className = 'sports-grid';

    teamData.sports.forEach(sport => {
        const sportCard = document.createElement('div');
        sportCard.className = 'sport-card';
        sportCard.innerHTML = `
            <div class="sport-icon">
                <i class="fas fa-${getSportIcon(sport)}"></i>
            </div>
            <div class="sport-name">${sport.charAt(0).toUpperCase() + sport.slice(1).replace('-', ' ')}</div>
            <div class="sport-status">Registered</div>
        `;
        sportsGrid.appendChild(sportCard);
    });

    sportsList.appendChild(sportsGrid);
}

// Display team members
function displayTeamMembers() {
    if (!teamData) return;

    const membersList = document.getElementById('membersList');
    membersList.innerHTML = '';

    // Captain
    if (teamData.captain) {
        const captainCard = document.createElement('div');
        captainCard.className = 'member-card captain';
        captainCard.innerHTML = `
            <div class="member-info">
                <div class="member-name">
                    <i class="fas fa-crown"></i>
                    ${teamData.captain.name}
                </div>
                <div class="member-details">
                    <div class="member-email">${teamData.captain.email}</div>
                    <div class="member-phone">${teamData.captain.phone}</div>
                </div>
            </div>
            <div class="member-role">Captain</div>
        `;
        membersList.appendChild(captainCard);
    }

    // Team members
    if (teamData.members && teamData.members.length > 0) {
        teamData.members.forEach((member, index) => {
            const memberCard = document.createElement('div');
            memberCard.className = 'member-card';
            memberCard.innerHTML = `
                <div class="member-info">
                    <div class="member-name">${member.name}</div>
                    <div class="member-details">
                        <div class="member-phone">${member.phone}</div>
                        <div class="member-cnic">${member.cnic}</div>
                    </div>
                </div>
                <div class="member-role">Member ${index + 1}</div>
            `;
            membersList.appendChild(memberCard);
        });
    }

    if (!teamData.members || teamData.members.length === 0) {
        membersList.innerHTML = '<p class="no-data">No additional team members. <a href="#" onclick="editTeamMembers()">Add members</a></p>';
    }
}

// Load dashboard statistics
async function loadDashboardStats() {
    try {
        // Total sports
        const totalSports = teamData?.sports?.length || 0;
        document.getElementById('totalSports').textContent = totalSports;

        // Total members (captain + members)
        const totalMembers = 1 + (teamData?.members?.length || 0);
        document.getElementById('totalMembers').textContent = totalMembers;

        // Active events (events where team is participating)
        const activeEventsSnapshot = await db.collection('events')
            .where('participatingTeams', 'array-contains', teamId)
            .where('status', '==', 'active')
            .get();
        document.getElementById('activeEvents').textContent = activeEventsSnapshot.size;

        // Completed events
        const completedEventsSnapshot = await db.collection('events')
            .where('participatingTeams', 'array-contains', teamId)
            .where('status', '==', 'completed')
            .get();
        document.getElementById('completedEvents').textContent = completedEventsSnapshot.size;

    } catch (error) {
        console.error('Error loading dashboard stats:', error);
    }
}

// Load events
async function loadEvents() {
    try {
        const eventsSnapshot = await db.collection('events')
            .where('participatingTeams', 'array-contains', teamId)
            .orderBy('startDate', 'desc')
            .limit(10)
            .get();

        const eventsList = document.getElementById('eventsList');
        eventsList.innerHTML = '';

        if (eventsSnapshot.empty) {
            eventsList.innerHTML = '<p class="no-data">No events scheduled yet.</p>';
            return;
        }

        eventsSnapshot.forEach(doc => {
            const event = doc.data();
            const eventCard = document.createElement('div');
            eventCard.className = 'event-card';
            eventCard.innerHTML = `
                <div class="event-header">
                    <h4>${event.name}</h4>
                    <span class="event-status ${event.status}">${event.status}</span>
                </div>
                <div class="event-details">
                    <div class="event-info">
                        <i class="fas fa-trophy"></i>
                        <span>${event.sport}</span>
                    </div>
                    <div class="event-info">
                        <i class="fas fa-calendar"></i>
                        <span>${formatDate(event.startDate)}</span>
                    </div>
                    <div class="event-info">
                        <i class="fas fa-map-marker-alt"></i>
                        <span>${event.venue || 'TBA'}</span>
                    </div>
                </div>
            `;
            eventsList.appendChild(eventCard);
        });

    } catch (error) {
        console.error('Error loading events:', error);
        document.getElementById('eventsList').innerHTML = '<p class="error">Error loading events.</p>';
    }
}

// Load results
async function loadResults() {
    try {
        const resultsSnapshot = await db.collection('results')
            .where('teamId', '==', teamId)
            .orderBy('date', 'desc')
            .limit(10)
            .get();

        const resultsList = document.getElementById('resultsList');
        resultsList.innerHTML = '';

        if (resultsSnapshot.empty) {
            resultsList.innerHTML = '<p class="no-data">No results available yet.</p>';
            return;
        }

        resultsSnapshot.forEach(doc => {
            const result = doc.data();
            const resultCard = document.createElement('div');
            resultCard.className = 'result-card';
            resultCard.innerHTML = `
                <div class="result-header">
                    <h4>${result.sport}</h4>
                    <span class="result-position">${result.position || 'N/A'}</span>
                </div>
                <div class="result-details">
                    <div class="result-info">
                        <i class="fas fa-medal"></i>
                        <span>Position: ${result.position || 'N/A'}</span>
                    </div>
                    <div class="result-info">
                        <i class="fas fa-chart-line"></i>
                        <span>Score: ${result.score || 'N/A'}</span>
                    </div>
                    <div class="result-info">
                        <i class="fas fa-calendar"></i>
                        <span>${formatDate(result.date)}</span>
                    </div>
                </div>
            `;
            resultsList.appendChild(resultCard);
        });

    } catch (error) {
        console.error('Error loading results:', error);
        document.getElementById('resultsList').innerHTML = '<p class="error">Error loading results.</p>';
    }
}

// Edit team information
function editTeamInfo() {
    if (!teamData) return;

    // Populate form with current data
    document.getElementById('editTeamName').value = teamData.teamName || '';
    document.getElementById('editInstitution').value = teamData.institution || '';
    document.getElementById('editCity').value = teamData.city || '';
    document.getElementById('editCategory').value = teamData.teamCategory || '';

    // Show modal
    document.getElementById('editTeamModal').style.display = 'flex';
}

// Save team information
async function saveTeamInfo() {
    try {
        const updatedData = {
            teamName: document.getElementById('editTeamName').value,
            institution: document.getElementById('editInstitution').value,
            city: document.getElementById('editCity').value,
            teamCategory: document.getElementById('editCategory').value,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        };

        await db.collection('teams').doc(teamId).update(updatedData);
        
        // Update local data
        Object.assign(teamData, updatedData);
        
        // Refresh display
        displayTeamInfo();
        
        showNotification('Team information updated successfully!', 'success');
        closeModal('editTeamModal');

    } catch (error) {
        console.error('Error updating team info:', error);
        showNotification('Error updating team information.', 'error');
    }
}

// Edit sports participation
function editSportsParticipation() {
    if (!teamData) return;

    const editSportsGrid = document.getElementById('editSportsGrid');
    editSportsGrid.innerHTML = '';

    const sports = [
        'futsal', 'cricket', 'basketball', 'throwball', 'volleyball',
        'dodgeball', 'badminton', 'chess', 'ludo', 'carrom',
        'scavenger-hunt', 'gaming', 'table-tennis', 'athletics',
        'strongmen', 'tug-of-war'
    ];

    sports.forEach(sport => {
        const sportOption = document.createElement('label');
        sportOption.className = 'sport-option';
        sportOption.innerHTML = `
            <input type="checkbox" name="editSports" value="${sport}" ${teamData.sports?.includes(sport) ? 'checked' : ''}>
            <span class="sport-icon"><i class="fas fa-${getSportIcon(sport)}"></i></span>
            <span class="sport-name">${sport.charAt(0).toUpperCase() + sport.slice(1).replace('-', ' ')}</span>
        `;
        editSportsGrid.appendChild(sportOption);
    });

    document.getElementById('editSportsModal').style.display = 'flex';
}

// Save sports participation
async function saveSportsParticipation() {
    try {
        const selectedSports = Array.from(document.querySelectorAll('input[name="editSports"]:checked'))
            .map(cb => cb.value);

        if (selectedSports.length === 0) {
            showNotification('Please select at least one sport.', 'error');
            return;
        }

        // Update team document
        await db.collection('teams').doc(teamId).update({
            sports: selectedSports,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        // Update sports participation records
        // Remove old participation records
        const oldParticipation = await db.collection('sports_participation')
            .where('teamId', '==', teamId)
            .get();
        
        const batch = db.batch();
        oldParticipation.forEach(doc => {
            batch.delete(doc.ref);
        });
        await batch.commit();

        // Add new participation records
        const newBatch = db.batch();
        selectedSports.forEach(sport => {
            const participationRef = db.collection('sports_participation').doc();
            newBatch.set(participationRef, {
                teamId: teamId,
                teamName: teamData.teamName,
                sport: sport,
                status: 'registered',
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
        });
        await newBatch.commit();

        // Update local data
        teamData.sports = selectedSports;
        
        // Refresh display
        displaySportsParticipation();
        await loadDashboardStats();
        
        showNotification('Sports participation updated successfully!', 'success');
        closeModal('editSportsModal');

    } catch (error) {
        console.error('Error updating sports participation:', error);
        showNotification('Error updating sports participation.', 'error');
    }
}

// Edit team members
function editTeamMembers() {
    showNotification('Team member editing feature coming soon!', 'info');
}

// Close modal
function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

// Utility functions
function getSportIcon(sport) {
    const icons = {
        'futsal': 'futbol',
        'cricket': 'baseball-ball',
        'basketball': 'basketball-ball',
        'throwball': 'volleyball-ball',
        'volleyball': 'volleyball-ball',
        'dodgeball': 'circle',
        'badminton': 'table-tennis',
        'chess': 'chess',
        'ludo': 'dice',
        'carrom': 'circle',
        'scavenger-hunt': 'search',
        'gaming': 'gamepad',
        'table-tennis': 'table-tennis',
        'athletics': 'running',
        'strongmen': 'dumbbell',
        'tug-of-war': 'hand-rock'
    };
    return icons[sport] || 'trophy';
}

function formatDate(timestamp) {
    if (!timestamp) return 'N/A';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Add CSS for dashboard components
const style = document.createElement('style');
style.textContent = `
    .dashboard-container {
        min-height: 100vh;
        background: #f8f9fa;
        padding: 2rem 0;
    }
    
    .dashboard-section {
        background: white;
        border-radius: 15px;
        margin-bottom: 2rem;
        box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
        overflow: hidden;
    }
    
    .section-header {
        background: linear-gradient(135deg, #3498db, #2980b9);
        color: white;
        padding: 1.5rem 2rem;
        display: flex;
        justify-content: space-between;
        align-items: center;
    }
    
    .section-header h2 {
        margin: 0;
        display: flex;
        align-items: center;
        gap: 0.5rem;
    }
    
    .edit-btn {
        background: rgba(255, 255, 255, 0.2);
        color: white;
        border: none;
        padding: 0.5rem 1rem;
        border-radius: 5px;
        cursor: pointer;
        transition: all 0.3s ease;
        display: flex;
        align-items: center;
        gap: 0.5rem;
    }
    
    .edit-btn:hover {
        background: rgba(255, 255, 255, 0.3);
    }
    
    .section-content {
        padding: 2rem;
    }
    
    .info-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
        gap: 1rem;
    }
    
    .info-item {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
    }
    
    .info-item label {
        font-weight: 600;
        color: #7f8c8d;
        font-size: 0.9rem;
    }
    
    .info-item span {
        color: #2c3e50;
        font-size: 1.1rem;
    }
    
    .status-badge {
        padding: 0.25rem 0.75rem;
        border-radius: 20px;
        font-size: 0.8rem;
        font-weight: 600;
        text-transform: uppercase;
    }
    
    .status-badge.pending {
        background: #fef9e7;
        color: #f39c12;
    }
    
    .status-badge.approved {
        background: #f0f9ff;
        color: #27ae60;
    }
    
    .status-badge.rejected {
        background: #fdf2f2;
        color: #e74c3c;
    }
    
    .sports-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
        gap: 1rem;
    }
    
    .sport-card {
        background: #f8f9fa;
        border: 2px solid #ecf0f1;
        border-radius: 10px;
        padding: 1.5rem;
        text-align: center;
        transition: all 0.3s ease;
    }
    
    .sport-card:hover {
        border-color: #3498db;
        background: #e3f2fd;
    }
    
    .sport-icon {
        width: 40px;
        height: 40px;
        background: #3498db;
        color: white;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        margin: 0 auto 1rem;
        font-size: 1.2rem;
    }
    
    .sport-name {
        font-weight: 600;
        color: #2c3e50;
        margin-bottom: 0.5rem;
    }
    
    .sport-status {
        font-size: 0.8rem;
        color: #27ae60;
        font-weight: 600;
    }
    
    .members-list {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
        gap: 1rem;
    }
    
    .member-card {
        background: #f8f9fa;
        border: 1px solid #ecf0f1;
        border-radius: 10px;
        padding: 1.5rem;
        display: flex;
        justify-content: space-between;
        align-items: center;
    }
    
    .member-card.captain {
        border-color: #f39c12;
        background: #fef9e7;
    }
    
    .member-name {
        font-weight: 600;
        color: #2c3e50;
        margin-bottom: 0.5rem;
        display: flex;
        align-items: center;
        gap: 0.5rem;
    }
    
    .member-details {
        font-size: 0.9rem;
        color: #7f8c8d;
    }
    
    .member-role {
        background: #3498db;
        color: white;
        padding: 0.25rem 0.75rem;
        border-radius: 15px;
        font-size: 0.8rem;
        font-weight: 600;
    }
    
    .events-list, .results-list {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
        gap: 1rem;
    }
    
    .event-card, .result-card {
        background: #f8f9fa;
        border: 1px solid #ecf0f1;
        border-radius: 10px;
        padding: 1.5rem;
    }
    
    .event-header, .result-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 1rem;
    }
    
    .event-header h4, .result-header h4 {
        margin: 0;
        color: #2c3e50;
    }
    
    .event-status {
        padding: 0.25rem 0.75rem;
        border-radius: 15px;
        font-size: 0.8rem;
        font-weight: 600;
        text-transform: uppercase;
    }
    
    .event-status.active {
        background: #f0f9ff;
        color: #3498db;
    }
    
    .event-status.completed {
        background: #f0f9ff;
        color: #27ae60;
    }
    
    .event-status.upcoming {
        background: #fef9e7;
        color: #f39c12;
    }
    
    .event-details, .result-details {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
    }
    
    .event-info, .result-info {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        color: #7f8c8d;
        font-size: 0.9rem;
    }
    
    .result-position {
        background: #f39c12;
        color: white;
        padding: 0.25rem 0.75rem;
        border-radius: 15px;
        font-size: 0.8rem;
        font-weight: 600;
    }
    
    .no-data, .error {
        text-align: center;
        color: #7f8c8d;
        padding: 2rem;
        font-style: italic;
    }
    
    .error {
        color: #e74c3c;
    }
    
    .no-data a {
        color: #3498db;
        text-decoration: none;
    }
    
    .no-data a:hover {
        text-decoration: underline;
    }
    
    /* Modal Styles */
    .modal {
        display: none;
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.5);
        z-index: 1000;
        align-items: center;
        justify-content: center;
    }
    
    .modal-content {
        background: white;
        border-radius: 15px;
        max-width: 500px;
        width: 90%;
        max-height: 80vh;
        overflow-y: auto;
    }
    
    .modal-header {
        background: linear-gradient(135deg, #3498db, #2980b9);
        color: white;
        padding: 1.5rem;
        display: flex;
        justify-content: space-between;
        align-items: center;
        border-radius: 15px 15px 0 0;
    }
    
    .modal-header h3 {
        margin: 0;
    }
    
    .close-btn {
        background: none;
        border: none;
        color: white;
        font-size: 1.5rem;
        cursor: pointer;
        padding: 0.5rem;
        border-radius: 50%;
        transition: background 0.3s ease;
    }
    
    .close-btn:hover {
        background: rgba(255, 255, 255, 0.2);
    }
    
    .modal-body {
        padding: 2rem;
    }
    
    .modal-footer {
        padding: 1.5rem;
        border-top: 1px solid #ecf0f1;
        display: flex;
        gap: 1rem;
        justify-content: flex-end;
    }
    
    .btn {
        padding: 0.75rem 1.5rem;
        border: none;
        border-radius: 5px;
        cursor: pointer;
        font-weight: 600;
        transition: all 0.3s ease;
    }
    
    .btn.primary {
        background: #3498db;
        color: white;
    }
    
    .btn.primary:hover {
        background: #2980b9;
    }
    
    .btn.secondary {
        background: #95a5a6;
        color: white;
    }
    
    .btn.secondary:hover {
        background: #7f8c8d;
    }
    
    @media (max-width: 768px) {
        .dashboard-stats {
            grid-template-columns: repeat(2, 1fr);
        }
        
        .info-grid {
            grid-template-columns: 1fr;
        }
        
        .sports-grid {
            grid-template-columns: repeat(2, 1fr);
        }
        
        .members-list {
            grid-template-columns: 1fr;
        }
        
        .events-list, .results-list {
            grid-template-columns: 1fr;
        }
    }
`;
document.head.appendChild(style);