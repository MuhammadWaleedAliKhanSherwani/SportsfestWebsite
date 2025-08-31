# Firebase Integration Guide for Sports Fest Portal

## Step 1: Create Firebase Project

### 1.1 Go to Firebase Console
- Visit [https://console.firebase.google.com/](https://console.firebase.google.com/)
- Sign in with your Google account

### 1.2 Create New Project
- Click **"Create a project"** or **"Add project"**
- Enter project name: `sports-fest-portal-2024` (or your preferred name)
- Click **"Continue"**

### 1.3 Configure Project Settings
- **Google Analytics**: Enable (recommended for tracking)
- Choose analytics account or create new one
- Click **"Create project"**
- Wait for project creation (1-2 minutes)

## Step 2: Enable Authentication

### 2.1 Access Authentication
- In Firebase Console, click **"Authentication"** in the left sidebar
- Click **"Get started"**

### 2.2 Enable Sign-in Methods
- Click **"Sign-in method"** tab
- Enable **"Email/Password"**:
  - Click on "Email/Password"
  - Toggle **"Enable"** to ON
  - Click **"Save"**

### 2.3 Enable Google Sign-in (Optional)
- Click on **"Google"**
- Toggle **"Enable"** to ON
- Add your **Project support email**
- Click **"Save"**

## Step 3: Set Up Firestore Database

### 3.1 Create Database
- In Firebase Console, click **"Firestore Database"** in the left sidebar
- Click **"Create database"**

### 3.2 Choose Security Rules
- Select **"Start in test mode"** (we'll update security rules later)
- Click **"Next"**

### 3.3 Choose Location
- Select a location close to your users (e.g., `us-central1` for US)
- Click **"Done"**

## Step 4: Get Firebase Configuration

### 4.1 Access Project Settings
- In Firebase Console, click the **gear icon** (⚙️) next to "Project Overview"
- Select **"Project settings"**

### 4.2 Get Web App Configuration
- Scroll down to **"Your apps"** section
- Click **"Add app"** (</>) icon
- Choose **"Web"** platform
- Enter app nickname: `Sports Fest Portal`
- Click **"Register app"**

### 4.3 Copy Configuration
- Copy the Firebase configuration object:
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

## Step 5: Update Your Firebase Configuration

### 5.1 Update firebase-config.js
- Open `firebase-config.js` in your project
- Replace the placeholder values with your actual Firebase config
- Save the file

### 5.2 Verify Configuration
- Make sure all values are correctly replaced
- Test by opening your portal in a browser
- Check browser console for any Firebase errors

## Step 6: Deploy Security Rules

### 6.1 Install Firebase CLI (if not already installed)
```bash
npm install -g firebase-tools
```

### 6.2 Login to Firebase
```bash
firebase login
```

### 6.3 Initialize Firebase in Your Project
```bash
firebase init
```
- Select **"Firestore"** and **"Hosting"**
- Choose your project
- Use default settings for most options

### 6.4 Deploy Security Rules
- Copy the contents of `firestore.rules` to `firestore.rules` in your project
- Deploy rules:
```bash
firebase deploy --only firestore:rules
```

## Step 7: Create Admin User

### 7.1 Create Admin Account
- Go to Firebase Console → Authentication → Users
- Click **"Add user"**
- Enter admin email: `admin@sportsfest.com`
- Enter strong password
- Click **"Add user"**

### 7.2 Set Admin Role in Firestore
- Go to Firebase Console → Firestore Database
- Create collection: `users`
- Create document with admin's UID (found in Authentication)
- Add this data:
```json
{
  "email": "admin@sportsfest.com",
  "role": "admin",
  "createdAt": "2024-01-01T00:00:00Z",
  "lastLogin": "2024-01-01T00:00:00Z",
  "displayName": "Sports Fest Admin"
}
```

## Step 8: Test the Integration

### 8.1 Test Admin Login
- Go to your portal: `your-domain.com/portal/`
- Click **"Access Admin Portal"**
- Login with admin credentials
- Verify you can access the admin dashboard

### 8.2 Test Team Registration
- Go to Team Portal
- Try registering a test team
- Verify data is saved to Firestore

### 8.3 Check Real-time Updates
- Open admin dashboard
- Register a team from another browser/tab
- Verify the team appears in real-time

## Step 9: Configure Hosting (Optional)

### 9.1 Deploy to Firebase Hosting
```bash
firebase deploy --only hosting
```

### 9.2 Custom Domain (Optional)
- In Firebase Console → Hosting
- Click **"Add custom domain"**
- Follow the DNS configuration instructions

## Step 10: Security Best Practices

### 10.1 Update Security Rules
- Review and customize `firestore.rules` for your needs
- Test rules thoroughly before production

### 10.2 Enable Additional Security
- Enable **"Prevent abuse"** in Authentication settings
- Set up **"Authorized domains"** in Authentication
- Consider enabling **2FA** for admin accounts

### 10.3 Monitor Usage
- Set up billing alerts in Firebase Console
- Monitor Firestore usage and costs
- Set up Firebase Analytics for insights

## Troubleshooting Common Issues

### Issue 1: "Firebase not initialized"
**Solution**: Check `firebase-config.js` has correct values

### Issue 2: "Permission denied" errors
**Solution**: Deploy updated security rules

### Issue 3: "Authentication failed"
**Solution**: Verify user exists and has correct role in Firestore

### Issue 4: "CORS errors"
**Solution**: Add your domain to authorized domains in Firebase Console

## Next Steps

1. **Customize the portal** for your specific needs
2. **Set up email notifications** using Firebase Functions
3. **Add more admin features** as required
4. **Implement backup strategies** for your data
5. **Set up monitoring and alerts**

## Support

If you encounter issues:
1. Check Firebase Console for error logs
2. Review browser console for JavaScript errors
3. Verify all configuration values are correct
4. Test with a simple Firebase app first

---

**Note**: Keep your Firebase configuration secure and never commit API keys to public repositories. 