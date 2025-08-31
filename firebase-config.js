// Firebase Configuration for Sports Fest Portal
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

// Initialize Firebase services
const auth = firebase.auth();
const db = firebase.firestore();

// Google Auth Provider
const googleProvider = new firebase.auth.GoogleAuthProvider();

// Export for use in other files
window.auth = auth;
window.db = db;
window.googleProvider = googleProvider; 