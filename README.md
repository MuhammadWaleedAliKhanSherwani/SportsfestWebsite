# Sports Fest Portal - Bolt Sportsfest

A comprehensive Sports Fest portal integrated with Firebase for the Bolt Sportsfest. This portal provides team registration, management, and real-time tournament tracking capabilities.

## 🏆 Features

### 🔐 Authentication System
- **Email/Password Login**: Secure authentication for teams and admins
- **Google OAuth**: One-click sign-in with Google accounts
- **Role-based Access**: Separate portals for teams and administrators
- **Password Reset**: Automated password recovery system

### 👥 Team Portal
- **Team Registration**: Comprehensive registration form with validation
- **Member Management**: Add up to 10 team members with detailed information
- **Sports Selection**: Choose from 16 different sports categories
- **Real-time Dashboard**: Live updates on team progress and participation
- **Progress Tracking**: Monitor performance across all sports categories
- **Schedule Viewing**: Access event schedules and match times for selected sports
- **Results Tracking**: View scores and tournament standings
- **Team Information Updates**: Edit team details and sports participation

### 🛡️ Admin Portal
- **Complete Team Management**: View, edit, and manage all registered teams
- **Advanced Filtering**: Filter teams by category, city, and status
- **Data Export**: Export team data to CSV/Excel formats
- **Event Management**: Create, edit, and manage tournament events
- **Results Management**: Add, edit, and manage tournament results and scores
- **Analytics Dashboard**: Comprehensive tournament analytics and insights
- **Real-time Monitoring**: Live tracking of all tournament activities

### 🏅 Sports Categories
1. **Futsal** (5 players)
2. **Cricket**
3. **Basketball** (3x3)
4. **Throwball**
5. **Volleyball**
6. **Dodgeball**
7. **Badminton**
8. **Chess**
9. **Ludo**
10. **Carrom**
11. **Scavenger Hunt**
12. **Gaming**
13. **Table Tennis**
14. **Athletics**
15. **Strongmen**
16. **Tug of War**

## 🚀 Quick Start

### Prerequisites
- Node.js (v14 or higher)
- Firebase account
- Modern web browser

### 1. Firebase Setup

#### Create Firebase Project
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project"
3. Enter project name: `sports-fest-portal`
4. Enable Google Analytics (optional)
5. Click "Create project"

#### Enable Authentication
1. In Firebase Console, go to "Authentication"
2. Click "Get started"
3. Enable "Email/Password" provider
4. Enable "Google" provider
5. Add your domain to authorized domains

#### Create Firestore Database
1. Go to "Firestore Database"
2. Click "Create database"
3. Choose "Start in test mode" (we'll add security rules later)
4. Select a location close to your users
5. Click "Done"

#### Get Firebase Configuration
1. Go to Project Settings (gear icon)
2. Scroll down to "Your apps"
3. Click "Add app" → "Web"
4. Register app with name "Sports Fest Portal"
5. Copy the configuration object

### 2. Project Setup

#### Clone/Download Project
```bash
# If using git
git clone <repository-url>
cd SportsfestWebsite

# Or download and extract the project files
```

#### Configure Firebase
1. Open `firebase-config.js`
2. Replace the placeholder configuration with your Firebase config:

```javascript
const firebaseConfig = {
  apiKey: "your-api-key",
  authDomain: "your-project-id.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project-id.appspot.com",
  messagingSenderId: "your-sender-id",
  appId: "your-app-id"
};
```

#### Deploy Security Rules
1. Install Firebase CLI:
```bash
npm install -g firebase-tools
```

2. Login to Firebase:
```bash
firebase login
```

3. Initialize Firebase in your project:
```bash
firebase init firestore
```

4. Deploy security rules:
```bash
firebase deploy --only firestore:rules
```

### 3. Create Admin User

#### Method 1: Using Firebase Console
1. Go to Authentication → Users
2. Click "Add user"
3. Enter admin email and password
4. Go to Firestore Database
5. Create a document in `users` collection:
   - Document ID: `[user-uid]`
   - Fields:
     - `email`: admin email
     - `role`: "admin"
     - `displayName`: "Admin"
     - `createdAt`: current timestamp

#### Method 2: Using Admin SDK (Advanced)
```javascript
// Run this in Firebase Console → Functions
const admin = require('firebase-admin');
const db = admin.firestore();

await db.collection('users').doc('admin-uid').set({
  email: 'admin@example.com',
  role: 'admin',
  displayName: 'Admin',
  createdAt: admin.firestore.FieldValue.serverTimestamp()
});
```

### 4. Deploy to Vercel

#### Install Vercel CLI
```bash
npm install -g vercel
```

#### Deploy
```bash
vercel
```

#### Configure Environment Variables
In Vercel dashboard, add environment variables:
- `FIREBASE_API_KEY`: Your Firebase API key
- `FIREBASE_PROJECT_ID`: Your Firebase project ID

## 📁 Project Structure

```
SportsfestWebsite/
├── index.html                 # Main website
├── styles.css                 # Main website styles
├── script.js                  # Main website scripts
├── firebase-config.js         # Firebase configuration
├── firestore.rules           # Firestore security rules
├── README.md                 # This file
└── portal/                   # Sports Fest Portal
    ├── index.html            # Portal entry page
    ├── portal-styles.css     # Portal-specific styles
    ├── portal.js             # Portal main script
    ├── auth.js               # Authentication utilities
    ├── team-login.html       # Team login page
    ├── team-register.html    # Team registration page
    ├── team-register.js      # Registration functionality
    ├── team-dashboard.html   # Team dashboard
    ├── team-dashboard.js     # Team dashboard logic
    ├── admin-login.html      # Admin login page
    ├── admin-dashboard.html  # Admin dashboard
    └── admin-dashboard.js    # Admin dashboard logic
```

## 🔧 Configuration

### Firebase Collections Structure

```
users/
├── {userId}/
│   ├── email: string
│   ├── role: "admin" | "team"
│   ├── displayName: string
│   ├── teamName: string (for teams)
│   ├── teamId: string (for teams)
│   ├── createdAt: timestamp
│   └── lastLogin: timestamp

teams/
├── {teamId}/
│   ├── email: string
│   ├── teamName: string
│   ├── teamCategory: string
│   ├── institution: string
│   ├── city: string
│   ├── captain: object
│   ├── members: array
│   ├── sports: array
│   ├── status: string
│   ├── createdAt: timestamp
│   └── updatedAt: timestamp

sports_participation/
├── {participationId}/
│   ├── teamId: string
│   ├── teamName: string
│   ├── sport: string
│   ├── status: string
│   └── createdAt: timestamp

events/
├── {eventId}/
│   ├── name: string
│   ├── sport: string
│   ├── startDate: timestamp
│   ├── endDate: timestamp
│   ├── venue: string
│   ├── participatingTeams: array
│   └── status: string

results/
├── {resultId}/
│   ├── teamId: string
│   ├── teamName: string
│   ├── sport: string
│   ├── score: string
│   ├── position: number
│   ├── date: timestamp
│   └── status: string
```

## 🎨 Customization

### Styling
- Modify `portal-styles.css` for portal-specific styling
- Update color variables in CSS for brand consistency
- Customize dashboard layouts and components

### Sports Categories
- Edit the sports list in `team-register.html`
- Update sports icons in JavaScript files
- Modify sports participation logic

### Features
- Add new dashboard sections
- Implement additional export formats
- Create custom analytics views
- Add notification system

## 🔒 Security Features

- **Role-based Access Control**: Strict separation between team and admin access
- **Data Validation**: Comprehensive form validation and sanitization
- **Firestore Security Rules**: Granular access control for all collections
- **Authentication Guards**: Protected routes and API endpoints
- **Input Sanitization**: XSS protection and data validation

## 📱 Responsive Design

The portal is fully responsive and works on:
- Desktop computers
- Tablets
- Mobile phones
- All modern browsers

## 🚀 Performance Optimizations

- **Lazy Loading**: Dashboard sections load on demand
- **Real-time Updates**: Efficient Firestore listeners
- **Optimized Queries**: Indexed database queries
- **Caching**: Browser-level caching for static assets
- **Minification**: Compressed CSS and JavaScript

## 🐛 Troubleshooting

### Common Issues

#### Firebase Connection Errors
- Verify Firebase configuration in `firebase-config.js`
- Check if Firebase project is active
- Ensure proper API keys and permissions

#### Authentication Issues
- Verify Google OAuth is enabled in Firebase Console
- Check authorized domains in Firebase Authentication
- Ensure proper user roles are set in Firestore

#### Real-time Updates Not Working
- Check Firestore security rules
- Verify collection names match exactly
- Ensure proper listener cleanup

#### Export Functionality Issues
- Check browser console for errors
- Verify data structure matches export format
- Ensure proper file permissions

### Debug Mode
Enable debug logging by adding this to any JavaScript file:
```javascript
localStorage.setItem('debug', 'true');
```

## 📞 Support

For technical support or questions:
- Email: boltsportsf@gmail.com
- WhatsApp: 0329-4433558 (Fasih Qureshi, Event Head)
- Phone: 0329-4433558 (Fasih Qureshi) or 0328-4651000 (Hassan Qureshi)
- Documentation: [Portal Documentation](link-to-docs)

## 📄 License

This project is proprietary software for Bolt Sportsfest.

## 🔄 Updates

### Version 1.1.0 (Current)
- Complete admin functionality with event and result management
- Full team portal with schedule viewing and results tracking
- Updated sports categories (16 sports)
- Enhanced UI/UX with improved forms and styling
- Real-time updates and notifications
- Data export capabilities
- Comprehensive team management system

### Planned Features
- Mobile app integration
- Advanced analytics and reporting
- Payment integration
- Live streaming integration
- Social media integration

---

**Developed for Bolt Sportsfest** 🏆 