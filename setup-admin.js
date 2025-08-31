// Admin Setup Script for Sports Fest Portal
// Run this script after configuring Firebase to create admin user

// Include Firebase SDKs
const firebase = require('firebase/app');
require('firebase/auth');
require('firebase/firestore');

// Your Firebase configuration (replace with your actual config)
const firebaseConfig = {
  apiKey: "AIzaSyAwlo1XF-cW1qOerIDz9qZV2niUiwh-tv0",
  authDomain: "sportsfest-website.firebaseapp.com",
  projectId: "sportsfest-website",
  storageBucket: "sportsfest-website.firebasestorage.app",
  messagingSenderId: "797589204705",
  appId: "1:797589204705:web:a483a5874aa8d1fa66d1a0",
  measurementId: "G-ZJ85JVQM7F"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

const auth = firebase.auth();
const db = firebase.firestore();

// Admin user details
const adminEmail = 'admin@sportsfest.com';
const adminPassword = 'Admin@2024!'; // Change this to a strong password

async function createAdminUser() {
  try {
    console.log('Creating admin user...');
    
    // Create user in Firebase Auth
    const userCredential = await auth.createUserWithEmailAndPassword(adminEmail, adminPassword);
    const user = userCredential.user;
    
    console.log('✅ Admin user created in Authentication:', user.uid);
    
    // Create user document in Firestore
    await db.collection('users').doc(user.uid).set({
      email: adminEmail,
      role: 'admin',
      displayName: 'Sports Fest Admin',
      createdAt: new Date(),
      lastLogin: new Date(),
      isActive: true,
      permissions: ['read', 'write', 'delete', 'admin']
    });
    
    console.log('✅ Admin user document created in Firestore');
    console.log('🎉 Admin setup completed successfully!');
    console.log('📧 Email:', adminEmail);
    console.log('🔑 Password:', adminPassword);
    console.log('⚠️  Remember to change the password after first login!');
    
  } catch (error) {
    console.error('❌ Error creating admin user:', error.message);
    
    if (error.code === 'auth/email-already-in-use') {
      console.log('ℹ️  Admin user already exists. Checking Firestore document...');
      
      try {
        // Try to sign in to get the user
        const userCredential = await auth.signInWithEmailAndPassword(adminEmail, adminPassword);
        const user = userCredential.user;
        
        // Check if user document exists
        const userDoc = await db.collection('users').doc(user.uid).get();
        
        if (userDoc.exists) {
          console.log('✅ Admin user already exists and has proper role');
        } else {
          // Create user document if it doesn't exist
          await db.collection('users').doc(user.uid).set({
            email: adminEmail,
            role: 'admin',
            displayName: 'Sports Fest Admin',
            createdAt: new Date(),
            lastLogin: new Date(),
            isActive: true,
            permissions: ['read', 'write', 'delete', 'admin']
          });
          console.log('✅ Admin user document created in Firestore');
        }
        
        await auth.signOut();
        
      } catch (signInError) {
        console.error('❌ Error signing in:', signInError.message);
      }
    }
  }
}

// Run the setup
createAdminUser(); 