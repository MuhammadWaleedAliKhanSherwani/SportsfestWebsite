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
    const eventFormHTML = `
        <div class="modal-content">
            <h3><i class="fas fa-plus-circle"></i> Create New Event</h3>
            <form id="eventForm" class="admin-form">
                <div class="form-group">
                    <label for="eventName">Event Name *</label>
                    <input type="text" id="eventName" name="eventName" required>
                </div>
                
                <div class="form-group">
                    <label for="eventSport">Sport Category *</label>
                    <select id="eventSport" name="eventSport" required>
                        <option value="">Select Sport</option>
                        <option value="futsal">Futsal</option>
                        <option value="cricket">Cricket</option>
                        <option value="basketball">Basketball</option>
                        <option value="throwball">Throwball</option>
                        <option value="volleyball">Volleyball</option>
                        <option value="dodgeball">Dodgeball</option>
                        <option value="badminton">Badminton</option>
                        <option value="chess">Chess</option>
                        <option value="ludo">Ludo</option>
                        <option value="carrom">Carrom</option>
                        <option value="scavengerHunt">Scavenger Hunt</option>
                        <option value="gaming">Gaming</option>
                        <option value="tableTennis">Table Tennis</option>
                        <option value="athletics">Athletics</option>
                        <option value="strongmen">Strongmen</option>
                        <option value="tugOfWar">Tug of War</option>
                    </select>
                </div>
                
                <div class="form-row">
                    <div class="form-group">
                        <label for="startDate">Start Date *</label>
                        <input type="datetime-local" id="startDate" name="startDate" required>
                    </div>
                    <div class="form-group">
                        <label for="endDate">End Date *</label>
                        <input type="datetime-local" id="endDate" name="endDate" required>
                    </div>
                </div>
                
                <div class="form-group">
                    <label for="eventVenue">Venue *</label>
                    <input type="text" id="eventVenue" name="eventVenue" required>
                </div>
                
                <div class="form-group">
                    <label for="eventDescription">Description</label>
                    <textarea id="eventDescription" name="eventDescription" rows="3"></textarea>
                </div>
                
                <div class="form-group">
                    <label for="maxTeams">Maximum Teams</label>
                    <input type="number" id="maxTeams" name="maxTeams" min="1" value="16">
                </div>
                
                <div class="form-group">
                    <label for="eventStatus">Status</label>
                    <select id="eventStatus" name="eventStatus">
                        <option value="upcoming">Upcoming</option>
                        <option value="ongoing">Ongoing</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                    </select>
                </div>
                
                <div class="form-actions">
                    <button type="button" onclick="closeModal()" class="btn btn-secondary">Cancel</button>
                    <button type="submit" class="btn btn-primary">Create Event</button>
                </div>
            </form>
        </div>
    `;
    
    showModal(eventFormHTML);
    
    // Add form submission handler
    document.getElementById('eventForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const eventData = {
            name: formData.get('eventName'),
            sport: formData.get('eventSport'),
            startDate: new Date(formData.get('startDate')),
            endDate: new Date(formData.get('endDate')),
            venue: formData.get('eventVenue'),
            description: formData.get('eventDescription'),
            maxTeams: parseInt(formData.get('maxTeams')) || 16,
            status: formData.get('eventStatus'),
            participatingTeams: [],
            createdAt: new Date(),
            updatedAt: new Date()
        };
        
        try {
            await db.collection('events').add(eventData);
            showNotification('Event created successfully!', 'success');
            closeModal();
            loadEvents(); // Refresh events list
        } catch (error) {
            console.error('Error creating event:', error);
            showNotification('Error creating event', 'error');
        }
    });
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
    const team = teamsData.find(t => t.id === teamId);
    if (!team) {
        showNotification('Team not found', 'error');
        return;
    }

    const editFormHTML = `
        <div class="modal-content">
            <h3><i class="fas fa-edit"></i> Edit Team: ${team.teamName}</h3>
            <form id="editTeamForm" class="admin-form">
                <div class="form-group">
                    <label for="editTeamName">Team Name *</label>
                    <input type="text" id="editTeamName" name="teamName" value="${team.teamName || ''}" required>
                </div>
                
                <div class="form-group">
                    <label for="editTeamCategory">Team Category *</label>
                    <select id="editTeamCategory" name="teamCategory" required>
                        <option value="university" ${team.teamCategory === 'university' ? 'selected' : ''}>University Team</option>
                        <option value="college" ${team.teamCategory === 'college' ? 'selected' : ''}>College Team</option>
                        <option value="school" ${team.teamCategory === 'school' ? 'selected' : ''}>School Team</option>
                        <option value="club" ${team.teamCategory === 'club' ? 'selected' : ''}>Sports Club</option>
                        <option value="corporate" ${team.teamCategory === 'corporate' ? 'selected' : ''}>Corporate Team</option>
                        <option value="amateur" ${team.teamCategory === 'amateur' ? 'selected' : ''}>Amateur Team</option>
                    </select>
                </div>
                
                <div class="form-group">
                    <label for="editInstitution">Institution/Organization</label>
                    <input type="text" id="editInstitution" name="institution" value="${team.institution || ''}">
                </div>
                
                <div class="form-group">
                    <label for="editCity">City *</label>
                    <input type="text" id="editCity" name="city" value="${team.city || ''}" required>
                </div>
                
                <div class="form-group">
                    <label for="editStatus">Status</label>
                    <select id="editStatus" name="status">
                        <option value="pending" ${team.status === 'pending' ? 'selected' : ''}>Pending</option>
                        <option value="approved" ${team.status === 'approved' ? 'selected' : ''}>Approved</option>
                        <option value="rejected" ${team.status === 'rejected' ? 'selected' : ''}>Rejected</option>
                        <option value="disqualified" ${team.status === 'disqualified' ? 'selected' : ''}>Disqualified</option>
                    </select>
                </div>
                
                <div class="form-group">
                    <label for="editSports">Sports Categories</label>
                    <div class="sports-checkboxes">
                        <label><input type="checkbox" name="sports" value="futsal" ${team.sports && team.sports.includes('futsal') ? 'checked' : ''}> Futsal</label>
                        <label><input type="checkbox" name="sports" value="cricket" ${team.sports && team.sports.includes('cricket') ? 'checked' : ''}> Cricket</label>
                        <label><input type="checkbox" name="sports" value="basketball" ${team.sports && team.sports.includes('basketball') ? 'checked' : ''}> Basketball</label>
                        <label><input type="checkbox" name="sports" value="throwball" ${team.sports && team.sports.includes('throwball') ? 'checked' : ''}> Throwball</label>
                        <label><input type="checkbox" name="sports" value="volleyball" ${team.sports && team.sports.includes('volleyball') ? 'checked' : ''}> Volleyball</label>
                        <label><input type="checkbox" name="sports" value="dodgeball" ${team.sports && team.sports.includes('dodgeball') ? 'checked' : ''}> Dodgeball</label>
                        <label><input type="checkbox" name="sports" value="badminton" ${team.sports && team.sports.includes('badminton') ? 'checked' : ''}> Badminton</label>
                        <label><input type="checkbox" name="sports" value="chess" ${team.sports && team.sports.includes('chess') ? 'checked' : ''}> Chess</label>
                        <label><input type="checkbox" name="sports" value="ludo" ${team.sports && team.sports.includes('ludo') ? 'checked' : ''}> Ludo</label>
                        <label><input type="checkbox" name="sports" value="carrom" ${team.sports && team.sports.includes('carrom') ? 'checked' : ''}> Carrom</label>
                        <label><input type="checkbox" name="sports" value="scavengerHunt" ${team.sports && team.sports.includes('scavengerHunt') ? 'checked' : ''}> Scavenger Hunt</label>
                        <label><input type="checkbox" name="sports" value="gaming" ${team.sports && team.sports.includes('gaming') ? 'checked' : ''}> Gaming</label>
                        <label><input type="checkbox" name="sports" value="tableTennis" ${team.sports && team.sports.includes('tableTennis') ? 'checked' : ''}> Table Tennis</label>
                        <label><input type="checkbox" name="sports" value="athletics" ${team.sports && team.sports.includes('athletics') ? 'checked' : ''}> Athletics</label>
                        <label><input type="checkbox" name="sports" value="strongmen" ${team.sports && team.sports.includes('strongmen') ? 'checked' : ''}> Strongmen</label>
                        <label><input type="checkbox" name="sports" value="tugOfWar" ${team.sports && team.sports.includes('tugOfWar') ? 'checked' : ''}> Tug of War</label>
                    </div>
                </div>
                
                <div class="form-actions">
                    <button type="button" onclick="closeModal()" class="btn btn-secondary">Cancel</button>
                    <button type="submit" class="btn btn-primary">Update Team</button>
                </div>
            </form>
        </div>
    `;
    
    showModal(editFormHTML);
    
    // Add form submission handler
    document.getElementById('editTeamForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const selectedSports = formData.getAll('sports');
        
        const updateData = {
            teamName: formData.get('teamName'),
            teamCategory: formData.get('teamCategory'),
            institution: formData.get('institution'),
            city: formData.get('city'),
            status: formData.get('status'),
            sports: selectedSports,
            updatedAt: new Date()
        };
        
        try {
            await db.collection('teams').doc(teamId).update(updateData);
            showNotification('Team updated successfully!', 'success');
            closeModal();
            loadTeams(); // Refresh teams list
        } catch (error) {
            console.error('Error updating team:', error);
            showNotification('Error updating team', 'error');
        }
    });
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
    const event = eventsData.find(e => e.id === eventId);
    if (!event) {
        showNotification('Event not found', 'error');
        return;
    }

    const startDate = event.startDate.toDate();
    const endDate = event.endDate.toDate();
    
    const editFormHTML = `
        <div class="modal-content">
            <h3><i class="fas fa-edit"></i> Edit Event: ${event.name}</h3>
            <form id="editEventForm" class="admin-form">
                <div class="form-group">
                    <label for="editEventName">Event Name *</label>
                    <input type="text" id="editEventName" name="eventName" value="${event.name || ''}" required>
                </div>
                
                <div class="form-group">
                    <label for="editEventSport">Sport Category *</label>
                    <select id="editEventSport" name="eventSport" required>
                        <option value="">Select Sport</option>
                        <option value="futsal" ${event.sport === 'futsal' ? 'selected' : ''}>Futsal</option>
                        <option value="cricket" ${event.sport === 'cricket' ? 'selected' : ''}>Cricket</option>
                        <option value="basketball" ${event.sport === 'basketball' ? 'selected' : ''}>Basketball</option>
                        <option value="throwball" ${event.sport === 'throwball' ? 'selected' : ''}>Throwball</option>
                        <option value="volleyball" ${event.sport === 'volleyball' ? 'selected' : ''}>Volleyball</option>
                        <option value="dodgeball" ${event.sport === 'dodgeball' ? 'selected' : ''}>Dodgeball</option>
                        <option value="badminton" ${event.sport === 'badminton' ? 'selected' : ''}>Badminton</option>
                        <option value="chess" ${event.sport === 'chess' ? 'selected' : ''}>Chess</option>
                        <option value="ludo" ${event.sport === 'ludo' ? 'selected' : ''}>Ludo</option>
                        <option value="carrom" ${event.sport === 'carrom' ? 'selected' : ''}>Carrom</option>
                        <option value="scavengerHunt" ${event.sport === 'scavengerHunt' ? 'selected' : ''}>Scavenger Hunt</option>
                        <option value="gaming" ${event.sport === 'gaming' ? 'selected' : ''}>Gaming</option>
                        <option value="tableTennis" ${event.sport === 'tableTennis' ? 'selected' : ''}>Table Tennis</option>
                        <option value="athletics" ${event.sport === 'athletics' ? 'selected' : ''}>Athletics</option>
                        <option value="strongmen" ${event.sport === 'strongmen' ? 'selected' : ''}>Strongmen</option>
                        <option value="tugOfWar" ${event.sport === 'tugOfWar' ? 'selected' : ''}>Tug of War</option>
                    </select>
                </div>
                
                <div class="form-row">
                    <div class="form-group">
                        <label for="editStartDate">Start Date *</label>
                        <input type="datetime-local" id="editStartDate" name="startDate" value="${startDate.toISOString().slice(0, 16)}" required>
                    </div>
                    <div class="form-group">
                        <label for="editEndDate">End Date *</label>
                        <input type="datetime-local" id="editEndDate" name="endDate" value="${endDate.toISOString().slice(0, 16)}" required>
                    </div>
                </div>
                
                <div class="form-group">
                    <label for="editEventVenue">Venue *</label>
                    <input type="text" id="editEventVenue" name="eventVenue" value="${event.venue || ''}" required>
                </div>
                
                <div class="form-group">
                    <label for="editEventDescription">Description</label>
                    <textarea id="editEventDescription" name="eventDescription" rows="3">${event.description || ''}</textarea>
                </div>
                
                <div class="form-group">
                    <label for="editMaxTeams">Maximum Teams</label>
                    <input type="number" id="editMaxTeams" name="maxTeams" min="1" value="${event.maxTeams || 16}">
                </div>
                
                <div class="form-group">
                    <label for="editEventStatus">Status</label>
                    <select id="editEventStatus" name="eventStatus">
                        <option value="upcoming" ${event.status === 'upcoming' ? 'selected' : ''}>Upcoming</option>
                        <option value="ongoing" ${event.status === 'ongoing' ? 'selected' : ''}>Ongoing</option>
                        <option value="completed" ${event.status === 'completed' ? 'selected' : ''}>Completed</option>
                        <option value="cancelled" ${event.status === 'cancelled' ? 'selected' : ''}>Cancelled</option>
                    </select>
                </div>
                
                <div class="form-actions">
                    <button type="button" onclick="closeModal()" class="btn btn-secondary">Cancel</button>
                    <button type="submit" class="btn btn-primary">Update Event</button>
                </div>
            </form>
        </div>
    `;
    
    showModal(editFormHTML);
    
    // Add form submission handler
    document.getElementById('editEventForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const updateData = {
            name: formData.get('eventName'),
            sport: formData.get('eventSport'),
            startDate: new Date(formData.get('startDate')),
            endDate: new Date(formData.get('endDate')),
            venue: formData.get('eventVenue'),
            description: formData.get('eventDescription'),
            maxTeams: parseInt(formData.get('maxTeams')) || 16,
            status: formData.get('eventStatus'),
            updatedAt: new Date()
        };
        
        try {
            await db.collection('events').doc(eventId).update(updateData);
            showNotification('Event updated successfully!', 'success');
            closeModal();
            loadEvents(); // Refresh events list
        } catch (error) {
            console.error('Error updating event:', error);
            showNotification('Error updating event', 'error');
        }
    });
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
function createResult() {
    const resultFormHTML = `
        <div class="modal-content">
            <h3><i class="fas fa-plus-circle"></i> Add Tournament Result</h3>
            <form id="resultForm" class="admin-form">
                <div class="form-group">
                    <label for="resultTeam">Team *</label>
                    <select id="resultTeam" name="teamId" required>
                        <option value="">Select Team</option>
                        ${teamsData.map(team => `<option value="${team.id}">${team.teamName}</option>`).join('')}
                    </select>
                </div>
                
                <div class="form-group">
                    <label for="resultSport">Sport Category *</label>
                    <select id="resultSport" name="sport" required>
                        <option value="">Select Sport</option>
                        <option value="futsal">Futsal</option>
                        <option value="cricket">Cricket</option>
                        <option value="basketball">Basketball</option>
                        <option value="throwball">Throwball</option>
                        <option value="volleyball">Volleyball</option>
                        <option value="dodgeball">Dodgeball</option>
                        <option value="badminton">Badminton</option>
                        <option value="chess">Chess</option>
                        <option value="ludo">Ludo</option>
                        <option value="carrom">Carrom</option>
                        <option value="scavengerHunt">Scavenger Hunt</option>
                        <option value="gaming">Gaming</option>
                        <option value="tableTennis">Table Tennis</option>
                        <option value="athletics">Athletics</option>
                        <option value="strongmen">Strongmen</option>
                        <option value="tugOfWar">Tug of War</option>
                    </select>
                </div>
                
                <div class="form-group">
                    <label for="resultScore">Score/Result *</label>
                    <input type="text" id="resultScore" name="score" placeholder="e.g., 3-1, 1st Place, 15.5 seconds" required>
                </div>
                
                <div class="form-group">
                    <label for="resultPosition">Position</label>
                    <input type="number" id="resultPosition" name="position" min="1" placeholder="1, 2, 3...">
                </div>
                
                <div class="form-group">
                    <label for="resultDate">Date *</label>
                    <input type="date" id="resultDate" name="date" required>
                </div>
                
                <div class="form-group">
                    <label for="resultStatus">Status</label>
                    <select id="resultStatus" name="status">
                        <option value="final">Final</option>
                        <option value="provisional">Provisional</option>
                        <option value="disqualified">Disqualified</option>
                    </select>
                </div>
                
                <div class="form-group">
                    <label for="resultNotes">Notes</label>
                    <textarea id="resultNotes" name="notes" rows="3" placeholder="Additional notes about the result"></textarea>
                </div>
                
                <div class="form-actions">
                    <button type="button" onclick="closeModal()" class="btn btn-secondary">Cancel</button>
                    <button type="submit" class="btn btn-primary">Add Result</button>
                </div>
            </form>
        </div>
    `;
    
    showModal(resultFormHTML);
    
    // Add form submission handler
    document.getElementById('resultForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const selectedTeam = teamsData.find(t => t.id === formData.get('teamId'));
        
        const resultData = {
            teamId: formData.get('teamId'),
            teamName: selectedTeam ? selectedTeam.teamName : 'Unknown Team',
            sport: formData.get('sport'),
            score: formData.get('score'),
            position: parseInt(formData.get('position')) || null,
            date: new Date(formData.get('date')),
            status: formData.get('resultStatus'),
            notes: formData.get('resultNotes'),
            createdAt: new Date(),
            updatedAt: new Date()
        };
        
        try {
            await db.collection('results').add(resultData);
            showNotification('Result added successfully!', 'success');
            closeModal();
            loadResults(); // Refresh results list
        } catch (error) {
            console.error('Error adding result:', error);
            showNotification('Error adding result', 'error');
        }
    });
}

function editResult(resultId) {
    const result = resultsData.find(r => r.id === resultId);
    if (!result) {
        showNotification('Result not found', 'error');
        return;
    }

    const resultDate = result.date.toDate();
    
    const editFormHTML = `
        <div class="modal-content">
            <h3><i class="fas fa-edit"></i> Edit Result</h3>
            <form id="editResultForm" class="admin-form">
                <div class="form-group">
                    <label for="editResultTeam">Team *</label>
                    <select id="editResultTeam" name="teamId" required>
                        <option value="">Select Team</option>
                        ${teamsData.map(team => `<option value="${team.id}" ${result.teamId === team.id ? 'selected' : ''}>${team.teamName}</option>`).join('')}
                    </select>
                </div>
                
                <div class="form-group">
                    <label for="editResultSport">Sport Category *</label>
                    <select id="editResultSport" name="sport" required>
                        <option value="">Select Sport</option>
                        <option value="futsal" ${result.sport === 'futsal' ? 'selected' : ''}>Futsal</option>
                        <option value="cricket" ${result.sport === 'cricket' ? 'selected' : ''}>Cricket</option>
                        <option value="basketball" ${result.sport === 'basketball' ? 'selected' : ''}>Basketball</option>
                        <option value="throwball" ${result.sport === 'throwball' ? 'selected' : ''}>Throwball</option>
                        <option value="volleyball" ${result.sport === 'volleyball' ? 'selected' : ''}>Volleyball</option>
                        <option value="dodgeball" ${result.sport === 'dodgeball' ? 'selected' : ''}>Dodgeball</option>
                        <option value="badminton" ${result.sport === 'badminton' ? 'selected' : ''}>Badminton</option>
                        <option value="chess" ${result.sport === 'chess' ? 'selected' : ''}>Chess</option>
                        <option value="ludo" ${result.sport === 'ludo' ? 'selected' : ''}>Ludo</option>
                        <option value="carrom" ${result.sport === 'carrom' ? 'selected' : ''}>Carrom</option>
                        <option value="scavengerHunt" ${result.sport === 'scavengerHunt' ? 'selected' : ''}>Scavenger Hunt</option>
                        <option value="gaming" ${result.sport === 'gaming' ? 'selected' : ''}>Gaming</option>
                        <option value="tableTennis" ${result.sport === 'tableTennis' ? 'selected' : ''}>Table Tennis</option>
                        <option value="athletics" ${result.sport === 'athletics' ? 'selected' : ''}>Athletics</option>
                        <option value="strongmen" ${result.sport === 'strongmen' ? 'selected' : ''}>Strongmen</option>
                        <option value="tugOfWar" ${result.sport === 'tugOfWar' ? 'selected' : ''}>Tug of War</option>
                    </select>
                </div>
                
                <div class="form-group">
                    <label for="editResultScore">Score/Result *</label>
                    <input type="text" id="editResultScore" name="score" value="${result.score || ''}" required>
                </div>
                
                <div class="form-group">
                    <label for="editResultPosition">Position</label>
                    <input type="number" id="editResultPosition" name="position" min="1" value="${result.position || ''}">
                </div>
                
                <div class="form-group">
                    <label for="editResultDate">Date *</label>
                    <input type="date" id="editResultDate" name="date" value="${resultDate.toISOString().split('T')[0]}" required>
                </div>
                
                <div class="form-group">
                    <label for="editResultStatus">Status</label>
                    <select id="editResultStatus" name="status">
                        <option value="final" ${result.status === 'final' ? 'selected' : ''}>Final</option>
                        <option value="provisional" ${result.status === 'provisional' ? 'selected' : ''}>Provisional</option>
                        <option value="disqualified" ${result.status === 'disqualified' ? 'selected' : ''}>Disqualified</option>
                    </select>
                </div>
                
                <div class="form-group">
                    <label for="editResultNotes">Notes</label>
                    <textarea id="editResultNotes" name="notes" rows="3">${result.notes || ''}</textarea>
                </div>
                
                <div class="form-actions">
                    <button type="button" onclick="closeModal()" class="btn btn-secondary">Cancel</button>
                    <button type="submit" class="btn btn-primary">Update Result</button>
                </div>
            </form>
        </div>
    `;
    
    showModal(editFormHTML);
    
    // Add form submission handler
    document.getElementById('editResultForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const selectedTeam = teamsData.find(t => t.id === formData.get('teamId'));
        
        const updateData = {
            teamId: formData.get('teamId'),
            teamName: selectedTeam ? selectedTeam.teamName : 'Unknown Team',
            sport: formData.get('sport'),
            score: formData.get('score'),
            position: parseInt(formData.get('position')) || null,
            date: new Date(formData.get('date')),
            status: formData.get('status'),
            notes: formData.get('notes'),
            updatedAt: new Date()
        };
        
        try {
            await db.collection('results').doc(resultId).update(updateData);
            showNotification('Result updated successfully!', 'success');
            closeModal();
            loadResults(); // Refresh results list
        } catch (error) {
            console.error('Error updating result:', error);
            showNotification('Error updating result', 'error');
        }
    });
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
    
    .sports-checkboxes {
        display: flex;
        flex-wrap: wrap;
        gap: 1rem;
        margin-top: 0.5rem;
    }

    .sports-checkboxes label {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        font-size: 0.9rem;
        color: var(--pure-white);
    }

    .sports-checkboxes input[type="checkbox"] {
        transform: scale(0.9);
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