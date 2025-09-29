# 🔥 Firebase Setup Guide for Sports Fest Portal

## 📋 Prerequisites
- Firebase project created
- Web browser with developer tools access

## 🚀 Step-by-Step Configuration

### **Step 1: Enable Authentication**
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project
3. Go to **Authentication** → **Get started**
4. Go to **Sign-in method** tab
5. Enable **Email/Password** provider
6. Enable **Google** provider
7. Add your domain to **Authorized domains**:
   - `localhost` (for testing)
   - Your production domain (when deployed)

### **Step 2: Create Firestore Database**
1. Go to **Firestore Database**
2. Click **Create database**
3. Choose **Start in test mode** (we'll add security rules later)
4. Select a location close to your users
5. Click **Done**

### **Step 3: Get Firebase Configuration**
1. Go to **Project Settings** (gear icon)
2. Scroll to **Your apps** section
3. Click **Add app** → **Web** (</> icon)
4. Register app name: **"Sports Fest Portal"**
5. **Copy the configuration object**

### **Step 4: Update Firebase Config**
Replace the content in `firebase-config.js` with your actual config:

```javascript
const firebaseConfig = {
  apiKey: "YOUR_ACTUAL_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};
```

### **Step 5: Create Admin Account**
1. Open your website in browser
2. Open Developer Tools (F12)
3. Go to Console tab
4. Copy and paste the contents of `create-admin-account.js`
5. Press Enter to run
6. You should see success messages

### **Step 6: Deploy Security Rules (Optional)**
If you have Firebase CLI installed:
```bash
firebase login
firebase init firestore
firebase deploy --only firestore:rules
```

## 🎯 What Each Account Type Can Do

### 👑 **Admin Account Features**
- **View all teams** with complete information
- **Filter teams** by status, category, city
- **Search teams** by name, institution, captain
- **Approve/Reject teams** with one click
- **Export all team data** to CSV
- **View detailed team information** including:
  - Team basic info (name, institution, city, category)
  - Captain details (name, email, phone, CNIC)
  - All team members with their info
  - Sports participation
  - Registration date and status

### 🏆 **Team Account Features**
- **Register team** with category-based member limits:
  - University: Max 15 members
  - College: Max 12 members
  - School: Max 10 members
  - Sports Club: Max 20 members
  - Corporate: Max 15 members
  - Community: Max 12 members
- **Add team members** with name, phone, CNIC
- **Select sports** from 16 categories
- **View team dashboard** with:
  - Team information
  - Sports participation
  - Team members list
  - Events and schedule
  - Results and scores
- **Edit team information** and sports participation
- **Track progress** across all sports

## 🏅 **Sports Categories Available**
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

## 🔐 **Default Admin Credentials**
- **Email:** `admin@sportsfest.com`
- **Password:** `Admin@2024!`

## 🧪 **Testing Your Setup**
1. **Open** `index.html` in your browser
2. **Go to Portal** → **Admin Login**
3. **Login** with admin credentials
4. **Test team registration** by going to Portal → Team Register
5. **Verify** admin can see the new team
6. **Test export** functionality

## 🚨 **Troubleshooting**

### **Firebase Connection Issues**
- Check `firebase-config.js` has correct values
- Verify Firebase project is active
- Check browser console for errors

### **Authentication Issues**
- Ensure Email/Password is enabled in Firebase Console
- Check authorized domains include your domain
- Verify user roles are set in Firestore

### **Data Not Loading**
- Check Firestore security rules
- Verify collection names match exactly
- Check browser console for errors

## 📞 **Support**
If you encounter issues:
1. Check browser console for error messages
2. Verify Firebase configuration is correct
3. Ensure all dependencies are loaded
4. Test with different browsers

---

**🎉 Your Sports Fest Portal is now ready for tournament management! 🚀**


