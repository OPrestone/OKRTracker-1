/**
 * Test script for user management functionality
 */

import { testFunctions } from './test-client';

// Test creating and deleting a user
async function runTests() {
  console.log('--- Starting User Management Tests ---');
  
  try {
    // Test user creation
    console.log('\n--- Testing User Creation ---');
    const createdUser = await testFunctions.testUserCreation();
    
    if (createdUser && createdUser.id) {
      console.log(`User created successfully with ID: ${createdUser.id}`);
      
      // Test user deletion
      console.log('\n--- Testing User Deletion ---');
      const deletionResult = await testFunctions.testUserDeletion(createdUser.id);
      
      if (deletionResult && deletionResult.success) {
        console.log('User deletion test passed!');
      } else {
        console.error('User deletion test failed!');
      }
    } else {
      console.error('User creation test failed!');
    }
  } catch (error) {
    console.error('Test suite failed with error:', error);
  }
  
  console.log('\n--- User Management Tests Completed ---');
  process.exit(0);
}

// Run the tests
runTests();