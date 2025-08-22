// Admin Dashboard JavaScript

let currentUser = null;
let teamsData = [];
let eventsData = [];
let realTimeListeners = [];

document.addEventListener('DOMContentLoaded', function() {
    initializeAdminDashboard();
});

async function initializeAdminDashboard() {
    // Check authentication
    auth.onAuthStateChanged(async function(user) {
        if (user) {
            currentUser = user;
            const userDoc = await db.collection('users').doc(user.uid).get();
            
            if (userDoc.exists && userDoc.data().role === 'admin') {
                await loadDashboardData();
                setupNavigation();
                setupRealTimeListeners();
                setupSearchAndFilters();
            } else {
                showNotification('Access denied. Redirecting to portal...', 'error');
                setTimeout(() => {
                    window.location.href = 'index.html';
                }, 2000);
            }
        } else {
            window.location.href = 'admin-login.html';
        }
    });
}

async function loadDashboardData() {
    try {
        await Promise.all([
            loadOverviewStats(),
            loadRecentActivity(),
            loadTeamsData(),
            loadSportsOverview(),
            loadEventsData(),
            loadResultsData(),
            loadAnalytics()
        ]);
    } catch (error) {
        console.error('Error loading dashboard data:', error);
        showNotification('Error loading dashboard data', 'error');
    }
}

async function loadOverviewStats() {
    try {
        // Get total teams
        const teamsSnapshot = await db.collection('teams').get();
        const totalTeams = teamsSnapshot.size;
        
        // Calculate total participants
        let totalParticipants = 0;
        teamsSnapshot.forEach(doc => {
            const team = doc.data();
            totalParticipants += (team.members ? team.members.length + 1 : 1); // +1 for captain
        });
        
        // Get events stats
        const eventsSnapshot = await db.collection('events').get();
        let activeEvents = 0;
        let completedEvents = 0;
        const now = new Date();
        
        eventsSnapshot.forEach(doc => {
            const event = doc.data();
            if (event.endDate && event.endDate.toDate() < now) {
                completedEvents++;
            } else {
                activeEvents++;
            }
        });
        
        // Update UI
        document.getElementById('totalTeams').textContent = totalTeams;
        document.getElementById('totalParticipants').textContent = totalParticipants;
        document.getElementById('activeEvents').textContent = activeEvents;
        document.getElementById('completedEvents').textContent = completedEvents;
        
    } catch (error) {
        console.error('Error loading overview stats:', error);
    }
}

async function loadRecentActivity() {
    try {
        const activitySnapshot = await db.collection('admin_activity')
            .orderBy('timestamp', 'desc')
            .limit(10)
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
    } catch (error) {
        console.error('Error loading recent activity:', error);
    }
}

async function loadTeamsData() {
    try {
        const teamsSnapshot = await db.collection('teams').get();
        teamsData = [];
        
        teamsSnapshot.forEach(doc => {
            teamsData.push({
                id: doc.id,
                ...doc.data()
            });
        });
        
        renderTeamsTable(teamsData);
    } catch (error) {
        console.error('Error loading teams data:', error);
        document.getElementById('teamsContainer').innerHTML = '<p>Error loading teams data</p>';
    }
}

function renderTeamsTable(teams) {
    const container = document.getElementById('teamsContainer');
    
    if (teams.length === 0) {
        container.innerHTML = '<p>No teams found</p>';
        return;
    }
    
    let tableHTML = `
        <div class="table-container">
            <table class="data-table">
                <thead>
                    <tr>
                        <th>Team Name</th>
                        <th>Category</th>
                        <th>City</th>
                        <th>Captain</th>
                        <th>Members</th>
                        <th>Sports</th>
                        <th>Status</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
    `;
    
    teams.forEach(team => {
        tableHTML += `
            <tr>
                <td>${team.teamName}</td>
                <td>${team.teamCategory || 'N/A'}</td>
                <td>${team.city || 'N/A'}</td>
                <td>${team.captain?.name || 'N/A'}</td>
                <td>${team.members ? team.members.length + 1 : 1}</td>
                <td>${team.sports ? team.sports.length : 0}</td>
                <td><span class="status-badge ${team.status || 'pending'}">${team.status || 'pending'}</span></td>
                <td>
                    <button class="action-btn small" onclick="viewTeam('${team.id}')">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="action-btn small" onclick="editTeam('${team.id}')">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="action-btn small danger" onclick="deleteTeam('${team.id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `;
    });
    
    tableHTML += `
                </tbody>
            </table>
        </div>
    `;
    
    container.innerHTML = tableHTML;
}

async function loadSportsOverview() {
    try {
        const sportsSnapshot = await db.collection('sports_participation').get();
        const sportsData = {};
        
        sportsSnapshot.forEach(doc => {
            const participation = doc.data();
            if (!sportsData[participation.sport]) {
                sportsData[participation.sport] = {
                    total: 0,
                    registered: 0,
                    active: 0,
                    completed: 0
                };
            }
            sportsData[participation.sport].total++;
            sportsData[participation.sport][participation.status]++;
        });
        
        renderSportsOverview(sportsData);
    } catch (error) {
        console.error('Error loading sports overview:', error);
        document.getElementById('sportsOverview').innerHTML = '<p>Error loading sports data</p>';
    }
}

function renderSportsOverview(sportsData) {
    const container = document.getElementById('sportsOverview');
    
    let html = '<div class="sports-grid">';
    Object.entries(sportsData).forEach(([sport, data]) => {
        html += `
            <div class="sport-card">
                <div class="sport-header">
                    <i class="fas fa-${getSportIcon(sport)}"></i>
                    <h4>${sport}</h4>
                </div>
                <div class="sport-stats">
                    <div class="stat-row">
                        <span>Total Teams:</span>
                        <span class="stat-value">${data.total}</span>
                    </div>
                    <div class="stat-row">
                        <span>Registered:</span>
                        <span class="stat-value">${data.registered}</span>
                    </div>
                    <div class="stat-row">
                        <span>Active:</span>
                        <span class="stat-value">${data.active}</span>
                    </div>
                    <div class="stat-row">
                        <span>Completed:</span>
                        <span class="stat-value">${data.completed}</span>
                    </div>
                </div>
            </div>
        `;
    });
    html += '</div>';
    
    container.innerHTML = html;
}

async function loadEventsData() {
    try {
        const eventsSnapshot = await db.collection('events').orderBy('startDate').get();
        eventsData = [];
        
        eventsSnapshot.forEach(doc => {
            eventsData.push({
                id: doc.id,
                ...doc.data()
            });
        });
        
        renderEventsTable(eventsData);
    } catch (error) {
        console.error('Error loading events data:', error);
        document.getElementById('eventsContainer').innerHTML = '<p>Error loading events data</p>';
    }
}

function renderEventsTable(events) {
    const container = document.getElementById('eventsContainer');
    
    if (events.length === 0) {
        container.innerHTML = '<p>No events found</p>';
        return;
    }
    
    let tableHTML = `
        <div class="table-container">
            <table class="data-table">
                <thead>
                    <tr>
                        <th>Event Name</th>
                        <th>Sport</th>
                        <th>Date</th>
                        <th>Venue</th>
                        <th>Teams</th>
                        <th>Status</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
    `;
    
    events.forEach(event => {
        const startDate = event.startDate.toDate();
        tableHTML += `
            <tr>
                <td>${event.name}</td>
                <td>${event.sport}</td>
                <td>${startDate.toLocaleDateString()}</td>
                <td>${event.venue || 'TBD'}</td>
                <td>${event.participatingTeams ? event.participatingTeams.length : 0}</td>
                <td><span class="status-badge ${event.status}">${event.status}</span></td>
                <td>
                    <button class="action-btn small" onclick="viewEvent('${event.id}')">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="action-btn small" onclick="editEvent('${event.id}')">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="action-btn small danger" onclick="deleteEvent('${event.id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `;
    });
    
    tableHTML += `
                </tbody>
            </table>
        </div>
    `;
    
    container.innerHTML = tableHTML;
}

async function loadResultsData() {
    try {
        const resultsSnapshot = await db.collection('results').orderBy('date', 'desc').get();
        const resultsData = [];
        
        resultsSnapshot.forEach(doc => {
            resultsData.push({
                id: doc.id,
                ...doc.data()
            });
        });
        
        renderResultsTable(resultsData);
    } catch (error) {
        console.error('Error loading results data:', error);
        document.getElementById('resultsManagement').innerHTML = '<p>Error loading results data</p>';
    }
}

function renderResultsTable(results) {
    const container = document.getElementById('resultsManagement');
    
    if (results.length === 0) {
        container.innerHTML = '<p>No results found</p>';
        return;
    }
    
    let tableHTML = `
        <div class="table-container">
            <table class="data-table">
                <thead>
                    <tr>
                        <th>Team</th>
                        <th>Sport</th>
                        <th>Score</th>
                        <th>Position</th>
                        <th>Date</th>
                        <th>Status</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
    `;
    
    results.forEach(result => {
        const resultDate = result.date.toDate();
        tableHTML += `
            <tr>
                <td>${result.teamName}</td>
                <td>${result.sport}</td>
                <td>${result.score || 'N/A'}</td>
                <td>${result.position || 'N/A'}</td>
                <td>${resultDate.toLocaleDateString()}</td>
                <td><span class="status-badge ${result.status}">${result.status}</span></td>
                <td>
                    <button class="action-btn small" onclick="editResult('${result.id}')">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="action-btn small danger" onclick="deleteResult('${result.id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `;
    });
    
    tableHTML += `
                </tbody>
            </table>
        </div>
    `;
    
    container.innerHTML = tableHTML;
}

async function loadAnalytics() {
    try {
        // Load analytics data
        const analyticsContainer = document.getElementById('analyticsContainer');
        
        // Get participation by category
        const categoryStats = {};
        teamsData.forEach(team => {
            const category = team.teamCategory || 'Other';
            categoryStats[category] = (categoryStats[category] || 0) + 1;
        });
        
        // Get participation by city
        const cityStats = {};
        teamsData.forEach(team => {
            const city = team.city || 'Unknown';
            cityStats[city] = (cityStats[city] || 0) + 1;
        });
        
        let analyticsHTML = `
            <div class="analytics-grid">
                <div class="analytics-card">
                    <h4>Teams by Category</h4>
                    <div class="chart-container">
                        ${Object.entries(categoryStats).map(([category, count]) => `
                            <div class="chart-item">
                                <span class="chart-label">${category}</span>
                                <div class="chart-bar">
                                    <div class="chart-fill" style="width: ${(count / teamsData.length) * 100}%"></div>
                                </div>
                                <span class="chart-value">${count}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
                
                <div class="analytics-card">
                    <h4>Teams by City</h4>
                    <div class="chart-container">
                        ${Object.entries(cityStats).slice(0, 10).map(([city, count]) => `
                            <div class="chart-item">
                                <span class="chart-label">${city}</span>
                                <div class="chart-bar">
                                    <div class="chart-fill" style="width: ${(count / teamsData.length) * 100}%"></div>
                                </div>
                                <span class="chart-value">${count}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;
        
        analyticsContainer.innerHTML = analyticsHTML;
        
    } catch (error) {
        console.error('Error loading analytics:', error);
        document.getElementById('analyticsContainer').innerHTML = '<p>Error loading analytics</p>';
    }
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

function setupSearchAndFilters() {
    const teamSearch = document.getElementById('teamSearch');
    const teamFilter = document.getElementById('teamFilter');
    
    if (teamSearch) {
        teamSearch.addEventListener('input', function() {
            filterTeams();
        });
    }
    
    if (teamFilter) {
        teamFilter.addEventListener('change', function() {
            filterTeams();
        });
    }
}

function filterTeams() {
    const searchTerm = document.getElementById('teamSearch').value.toLowerCase();
    const filterValue = document.getElementById('teamFilter').value;
    
    const filteredTeams = teamsData.filter(team => {
        const matchesSearch = team.teamName.toLowerCase().includes(searchTerm) ||
                            team.captain?.name.toLowerCase().includes(searchTerm) ||
                            team.city.toLowerCase().includes(searchTerm);
        
        const matchesFilter = !filterValue || team.teamCategory === filterValue;
        
        return matchesSearch && matchesFilter;
    });
    
    renderTeamsTable(filteredTeams);
}

function setupRealTimeListeners() {
    // Listen for teams data changes
    const teamsListener = db.collection('teams')
        .onSnapshot(function(snapshot) {
            teamsData = [];
            snapshot.forEach(doc => {
                teamsData.push({
                    id: doc.id,
                    ...doc.data()
                });
            });
            renderTeamsTable(teamsData);
            loadOverviewStats();
        }, function(error) {
            console.error('Error listening to teams data:', error);
        });

    realTimeListeners.push(teamsListener);
}

// Action functions
function exportData() {
    const data = {
        teams: teamsData,
        events: eventsData,
        timestamp: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sports-fest-data-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showNotification('Data exported successfully!', 'success');
}

function exportTeams() {
    const csvContent = convertTeamsToCSV(teamsData);
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `teams-export-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showNotification('Teams exported to CSV!', 'success');
}

function convertTeamsToCSV(teams) {
    const headers = ['Team Name', 'Category', 'City', 'Institution', 'Captain Name', 'Captain Phone', 'Members Count', 'Sports', 'Status'];
    const rows = teams.map(team => [
        team.teamName,
        team.teamCategory || '',
        team.city || '',
        team.institution || '',
        team.captain?.name || '',
        team.captain?.phone || '',
        team.members ? team.members.length + 1 : 1,
        team.sports ? team.sports.join(', ') : '',
        team.status || 'pending'
    ]);
    
    return [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
}

function createEvent() {
    showNotification('Event creation feature coming soon!', 'info');
}

function manageTeams() {
    const teamsBtn = document.querySelector('[data-section="teams"]');
    if (teamsBtn) {
        teamsBtn.click();
    }
}

function viewAnalytics() {
    const analyticsBtn = document.querySelector('[data-section="analytics"]');
    if (analyticsBtn) {
        analyticsBtn.click();
    }
}

// Team management functions
function viewTeam(teamId) {
    const team = teamsData.find(t => t.id === teamId);
    if (team) {
        showTeamDetails(team);
    }
}

function editTeam(teamId) {
    showNotification('Team editing feature coming soon!', 'info');
}

async function deleteTeam(teamId) {
    if (confirm('Are you sure you want to delete this team? This action cannot be undone.')) {
        try {
            await db.collection('teams').doc(teamId).delete();
            showNotification('Team deleted successfully!', 'success');
        } catch (error) {
            console.error('Error deleting team:', error);
            showNotification('Error deleting team', 'error');
        }
    }
}

function showTeamDetails(team) {
    const detailsHTML = `
        <div class="modal-content">
            <h3>${team.teamName}</h3>
            <div class="team-details">
                <p><strong>Category:</strong> ${team.teamCategory || 'N/A'}</p>
                <p><strong>City:</strong> ${team.city || 'N/A'}</p>
                <p><strong>Institution:</strong> ${team.institution || 'N/A'}</p>
                <p><strong>Captain:</strong> ${team.captain?.name || 'N/A'}</p>
                <p><strong>Phone:</strong> ${team.captain?.phone || 'N/A'}</p>
                <p><strong>Members:</strong> ${team.members ? team.members.length + 1 : 1}</p>
                <p><strong>Sports:</strong> ${team.sports ? team.sports.join(', ') : 'None'}</p>
                <p><strong>Status:</strong> ${team.status || 'pending'}</p>
            </div>
        </div>
    `;
    
    showModal(detailsHTML);
}

// Event management functions
function viewEvent(eventId) {
    const event = eventsData.find(e => e.id === eventId);
    if (event) {
        showEventDetails(event);
    }
}

function editEvent(eventId) {
    showNotification('Event editing feature coming soon!', 'info');
}

async function deleteEvent(eventId) {
    if (confirm('Are you sure you want to delete this event? This action cannot be undone.')) {
        try {
            await db.collection('events').doc(eventId).delete();
            showNotification('Event deleted successfully!', 'success');
        } catch (error) {
            console.error('Error deleting event:', error);
            showNotification('Error deleting event', 'error');
        }
    }
}

function showEventDetails(event) {
    const startDate = event.startDate.toDate();
    const endDate = event.endDate.toDate();
    
    const detailsHTML = `
        <div class="modal-content">
            <h3>${event.name}</h3>
            <div class="event-details">
                <p><strong>Sport:</strong> ${event.sport}</p>
                <p><strong>Date:</strong> ${startDate.toLocaleDateString()}</p>
                <p><strong>Time:</strong> ${startDate.toLocaleTimeString()} - ${endDate.toLocaleTimeString()}</p>
                <p><strong>Venue:</strong> ${event.venue || 'TBD'}</p>
                <p><strong>Teams:</strong> ${event.participatingTeams ? event.participatingTeams.length : 0}</p>
                <p><strong>Status:</strong> ${event.status}</p>
            </div>
        </div>
    `;
    
    showModal(detailsHTML);
}

// Results management functions
function editResult(resultId) {
    showNotification('Result editing feature coming soon!', 'info');
}

async function deleteResult(resultId) {
    if (confirm('Are you sure you want to delete this result? This action cannot be undone.')) {
        try {
            await db.collection('results').doc(resultId).delete();
            showNotification('Result deleted successfully!', 'success');
        } catch (error) {
            console.error('Error deleting result:', error);
            showNotification('Error deleting result', 'error');
        }
    }
}

// Utility functions
function getActivityIcon(type) {
    const icons = {
        'team_registered': 'user-plus',
        'event_created': 'calendar-plus',
        'result_updated': 'chart-line',
        'team_deleted': 'user-minus',
        'event_deleted': 'calendar-minus',
        'default': 'info-circle'
    };
    return icons[type] || icons.default;
}

function getSportIcon(sport) {
    const icons = {
        'futsal': 'futbol',
        'basketball': 'basketball-ball',
        'tableTennis': 'table-tennis',
        'armWrestling': 'dumbbell',
        'athletics': 'running',
        'swimming': 'swimming-pool',
        'badminton': 'table-tennis',
        'volleyball': 'volleyball-ball',
        'cricket': 'cricket',
        'football': 'futbol',
        'hockey': 'hockey-puck',
        'squash': 'table-tennis',
        'tennis': 'table-tennis',
        'boxing': 'boxing-glove',
        'wrestling': 'dumbbell',
        'weightlifting': 'dumbbell',
        'default': 'trophy'
    };
    return icons[sport] || icons.default;
}

function showModal(content) {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-overlay">
            <div class="modal-container">
                ${content}
                <button class="modal-close" onclick="this.closest('.modal').remove()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

// Cleanup on page unload
window.addEventListener('beforeunload', function() {
    realTimeListeners.forEach(unsubscribe => {
        if (typeof unsubscribe === 'function') {
            unsubscribe();
        }
    });
});

// Add CSS for admin dashboard components
const style = document.createElement('style');
style.textContent = `
    .section-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 1.5rem;
    }
    
    .section-actions {
        display: flex;
        gap: 1rem;
        align-items: center;
    }
    
    .search-input {
        padding: 0.5rem 1rem;
        border: 1px solid rgba(255, 255, 255, 0.2);
        border-radius: 8px;
        background: rgba(255, 255, 255, 0.1);
        color: var(--pure-white);
        font-size: 0.9rem;
    }
    
    .search-input::placeholder {
        color: rgba(255, 255, 255, 0.6);
    }
    
    .filter-select {
        padding: 0.5rem 1rem;
        border: 1px solid rgba(255, 255, 255, 0.2);
        border-radius: 8px;
        background: rgba(255, 255, 255, 0.1);
        color: var(--pure-white);
        font-size: 0.9rem;
    }
    
    .table-container {
        overflow-x: auto;
        border-radius: 10px;
        border: 1px solid rgba(255, 255, 255, 0.1);
    }
    
    .data-table {
        width: 100%;
        border-collapse: collapse;
        background: rgba(255, 255, 255, 0.05);
    }
    
    .data-table th,
    .data-table td {
        padding: 1rem;
        text-align: left;
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    }
    
    .data-table th {
        background: rgba(255, 255, 255, 0.1);
        font-weight: 600;
        color: var(--royal-gold);
    }
    
    .data-table tr:hover {
        background: rgba(255, 255, 255, 0.05);
    }
    
    .action-btn.small {
        padding: 0.25rem 0.5rem;
        font-size: 0.8rem;
        margin-right: 0.25rem;
    }
    
    .action-btn.danger {
        background: #e74c3c;
        border-color: #e74c3c;
    }
    
    .action-btn.danger:hover {
        background: #c0392b;
        border-color: #c0392b;
    }
    
    .sport-stats {
        margin-top: 1rem;
    }
    
    .stat-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 0.25rem 0;
        font-size: 0.9rem;
    }
    
    .stat-value {
        font-weight: 600;
        color: var(--royal-gold);
    }
    
    .analytics-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
        gap: 2rem;
    }
    
    .analytics-card {
        background: rgba(255, 255, 255, 0.05);
        border-radius: 10px;
        padding: 1.5rem;
        border: 1px solid rgba(255, 255, 255, 0.1);
    }
    
    .analytics-card h4 {
        color: var(--royal-gold);
        margin-bottom: 1rem;
        font-size: 1.1rem;
    }
    
    .chart-container {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
    }
    
    .chart-item {
        display: flex;
        align-items: center;
        gap: 1rem;
    }
    
    .chart-label {
        min-width: 100px;
        font-size: 0.9rem;
        color: rgba(255, 255, 255, 0.8);
    }
    
    .chart-bar {
        flex: 1;
        height: 20px;
        background: rgba(255, 255, 255, 0.1);
        border-radius: 10px;
        overflow: hidden;
    }
    
    .chart-fill {
        height: 100%;
        background: var(--gold-gradient);
        transition: width 0.3s ease;
    }
    
    .chart-value {
        min-width: 30px;
        text-align: right;
        font-weight: 600;
        color: var(--royal-gold);
    }
    
    .status-value.online {
        color: #27ae60;
    }
    
    .modal {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        z-index: 10000;
    }
    
    .modal-overlay {
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.8);
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 2rem;
    }
    
    .modal-container {
        background: var(--midnight-navy);
        border-radius: 15px;
        padding: 2rem;
        max-width: 500px;
        width: 100%;
        position: relative;
        border: 1px solid rgba(255, 255, 255, 0.2);
    }
    
    .modal-close {
        position: absolute;
        top: 1rem;
        right: 1rem;
        background: none;
        border: none;
        color: var(--pure-white);
        font-size: 1.2rem;
        cursor: pointer;
        padding: 0.5rem;
        border-radius: 50%;
        transition: background 0.3s ease;
    }
    
    .modal-close:hover {
        background: rgba(255, 255, 255, 0.1);
    }
    
    .team-details,
    .event-details {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
    }
    
    .team-details p,
    .event-details p {
        margin: 0;
        font-size: 0.9rem;
    }
    
    @media (max-width: 768px) {
        .section-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 1rem;
        }
        
        .section-actions {
            width: 100%;
            flex-wrap: wrap;
        }
        
        .search-input,
        .filter-select {
            flex: 1;
            min-width: 150px;
        }
        
        .analytics-grid {
            grid-template-columns: 1fr;
        }
        
        .chart-item {
            flex-direction: column;
            align-items: flex-start;
            gap: 0.5rem;
        }
        
        .chart-label {
            min-width: auto;
        }
        
        .chart-bar {
            width: 100%;
        }
    }
`;
document.head.appendChild(style); 