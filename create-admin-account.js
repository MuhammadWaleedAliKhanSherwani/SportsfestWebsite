// Create Admin Account Script
// Run this in your browser console after setting up Firebase

// Step 1: Open your website in browser
// Step 2: Open Developer Tools (F12)
// Step 3: Go to Console tab
// Step 4: Copy and paste this entire script
// Step 5: Press Enter to run

console.log('🚀 Starting admin account creation...');

// Create admin user
async function createAdminAccount() {
    try {
        // Create admin user in Firebase Auth
        const userCredential = await firebase.auth().createUserWithEmailAndPassword(
            'admin@sportsfest.com', 
            'Admin@2024!'
        );
        
        const user = userCredential.user;
        console.log('✅ Admin user created in Authentication:', user.uid);
        
        // Create user document in Firestore
        await firebase.firestore().collection('users').doc(user.uid).set({
            email: 'admin@sportsfest.com',
            role: 'admin',
            displayName: 'Sports Fest Admin',
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            lastLogin: firebase.firestore.FieldValue.serverTimestamp(),
            isActive: true,
            permissions: ['read', 'write', 'delete', 'admin']
        });
        
        console.log('✅ Admin user document created in Firestore');
        console.log('🎉 Admin account created successfully!');
        console.log('📧 Email: admin@sportsfest.com');
        console.log('🔑 Password: Admin@2024!');
        console.log('⚠️  Remember to change the password after first login!');
        
        // Sign out the admin user
        await firebase.auth().signOut();
        console.log('✅ Admin user signed out');
        
    } catch (error) {
        if (error.code === 'auth/email-already-in-use') {
            console.log('ℹ️  Admin user already exists. Checking Firestore document...');
            
            try {
                // Try to sign in to get the user
                const userCredential = await firebase.auth().signInWithEmailAndPassword(
                    'admin@sportsfest.com', 
                    'Admin@2024!'
                );
                const user = userCredential.user;
                
                // Check if user document exists
                const userDoc = await firebase.firestore().collection('users').doc(user.uid).get();
                
                if (userDoc.exists) {
                    console.log('✅ Admin user already exists and has proper role');
                } else {
                    // Create user document if it doesn't exist
                    await firebase.firestore().collection('users').doc(user.uid).set({
                        email: 'admin@sportsfest.com',
                        role: 'admin',
                        displayName: 'Sports Fest Admin',
                        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                        lastLogin: firebase.firestore.FieldValue.serverTimestamp(),
                        isActive: true,
                        permissions: ['read', 'write', 'delete', 'admin']
                    });
                    console.log('✅ Admin user document created in Firestore');
                }
                
                await firebase.auth().signOut();
                
            } catch (signInError) {
                console.error('❌ Error signing in:', signInError.message);
            }
        } else {
            console.error('❌ Error creating admin user:', error.message);
        }
    }
}

// Run the script
createAdminAccount();

