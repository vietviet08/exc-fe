import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth, createUserWithRole, checkUserRole } from './config';

// Function to register a new user with a role
export const registerUser = async (email, password, role = 'user') => {
  try {
    // Create the user in Firebase Auth
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // Create the user in Firestore with role
    await createUserWithRole(user.uid, { email, role });
    
    return { success: true, user };
  } catch (error) {
    console.error('Error registering user:', error);
    return { success: false, error: error.message };
  }
};

// Function to verify if a user has admin privileges
export const verifyAdminAccess = async (user) => {
  if (!user) {
    console.log('No user provided to verifyAdminAccess');
    return false;
  }
  
  console.log(`Verifying admin access for user: ${user.email}`);
  
  try {
    // Check the role in Firestore
    const isAdmin = await checkUserRole(user.uid);
    console.log(`Firestore role check for ${user.email}: ${isAdmin}`);
    return isAdmin;
  } catch (error) {
    console.error('Error in verifyAdminAccess:', error);
    return false;
  }
}; 