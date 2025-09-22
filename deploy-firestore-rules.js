// Deploy Firestore Rules Script
// Run this in your browser console to deploy the updated Firestore rules

console.log('🚀 Deploying Firestore rules...');

// Note: This script will show you the rules that need to be deployed
// You'll need to copy these rules to your Firebase Console

const firestoreRules = `rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    // Allow authenticated users to read and write their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Allow authenticated users to read and write team data
    match /teams/{teamId} {
      // Allow users to create teams during registration
      allow create: if request.auth != null;
      // Allow users to read/write their own team data
      allow read, write: if request.auth != null && request.auth.uid == teamId;
      // Allow admins to read all teams
      allow read: if request.auth != null && 
        exists(/databases/$(database)/documents/users/$(request.auth.uid)) &&
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    // Allow authenticated users to read and write sports participation
    match /sports_participation/{docId} {
      allow read, write: if request.auth != null;
    }
    
    // Allow authenticated users to read and write events
    match /events/{eventId} {
      allow read: if request.auth != null;
      // Allow admins to write events
      allow write: if request.auth != null && 
        exists(/databases/$(database)/documents/users/$(request.auth.uid)) &&
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    // Allow authenticated users to read and write results
    match /results/{resultId} {
      allow read: if request.auth != null;
      // Allow admins to write results
      allow write: if request.auth != null && 
        exists(/databases/$(database)/documents/users/$(request.auth.uid)) &&
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    // Allow authenticated users to read and write admin activity
    match /admin_activity/{docId} {
      allow read, write: if request.auth != null && 
        exists(/databases/$(database)/documents/users/$(request.auth.uid)) &&
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    // Allow authenticated users to read and write analytics
    match /analytics/{docId} {
      allow read, write: if request.auth != null && 
        exists(/databases/$(database)/documents/users/$(request.auth.uid)) &&
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
  }
}`;

console.log('📋 Updated Firestore Rules:');
console.log('========================');
console.log(firestoreRules);
console.log('========================');

console.log('\n📝 To deploy these rules:');
console.log('1. Go to Firebase Console: https://console.firebase.google.com');
console.log('2. Select your project: sportsfest-website');
console.log('3. Go to Firestore Database → Rules');
console.log('4. Replace the existing rules with the rules above');
console.log('5. Click "Publish"');

console.log('\n🔧 Alternative: Use Firebase CLI');
console.log('If you have Firebase CLI installed, run:');
console.log('firebase deploy --only firestore:rules');

console.log('\n✅ After deploying the rules, team registration should work!');
