/**
 * Test client for API endpoints
 * 
 * This utility provides test functions for API endpoints to help verify functionality.
 */

import axios from 'axios';
import * as crypto from 'crypto';
import { db } from './db';
import { users, usersToTenants } from '@shared/schema';
import { eq } from 'drizzle-orm';
import { hashPassword } from './auth';

const BASE_URL = 'http://localhost:5000';

// Create test accounts for testing API features
export async function createTestUserAndSession() {
  // Create a unique test user
  const username = `testuser_${Date.now()}`;
  const password = 'TestPassword123!';
  const email = `${username}@example.com`;
  
  // Create a test tenant
  const tenantId = `tenant_${crypto.randomUUID().replace(/-/g, '')}`;
  const tenantName = `Test Tenant ${Date.now()}`;
  
  // Insert test tenant
  await db.insert(users).values({
    id: `user_${crypto.randomUUID().replace(/-/g, '')}`,
    username,
    password: await hashPassword(password),
    email,
    name: `Test User ${Date.now()}`,
    created_at: new Date(),
    is_admin: true
  });
  
  const [createdUser] = await db.select().from(users).where(eq(users.username, username));
  
  // Link user to tenant
  await db.insert(usersToTenants).values({
    id: `utt_${crypto.randomUUID().replace(/-/g, '')}`,
    userId: createdUser.id,
    tenantId,
    role: 'admin',
    is_default: true
  });
  
  console.log(`Created test user: ${username} with id ${createdUser.id}, password: ${password}`);
  
  // Log in as test user
  try {
    const loginResponse = await axios.post(`${BASE_URL}/api/login`, {
      username,
      password,
    }, {
      withCredentials: true
    });
    
    const cookies = loginResponse.headers['set-cookie'];
    console.log(`Successfully logged in as ${username}`);
    
    return {
      user: createdUser,
      cookies,
      tenantId
    };
  } catch (error) {
    console.error('Failed to log in with test user:', error.message);
    throw error;
  }
}

// Function to make authenticated API calls
export async function makeAuthenticatedRequest(
  method: 'get' | 'post' | 'put' | 'delete' | 'patch',
  endpoint: string,
  data?: any,
  cookies?: string[]
) {
  try {
    const url = `${BASE_URL}${endpoint}`;
    const headers: any = {};
    
    if (cookies) {
      headers.Cookie = cookies.join('; ');
    }
    
    const response = await axios({
      method,
      url,
      data,
      headers,
      withCredentials: true
    });
    
    return response.data;
  } catch (error) {
    console.error(`Error making ${method.toUpperCase()} request to ${endpoint}:`, error.message);
    throw error;
  }
}

// Function to test user creation
export async function testUserCreation() {
  const { cookies, tenantId } = await createTestUserAndSession();
  
  // Generate data for a new user
  const newUser = {
    username: `newuser_${Date.now()}`,
    email: `newuser_${Date.now()}@example.com`,
    firstName: 'New',
    lastName: 'User',
    role: 'member'
  };
  
  try {
    // Create the user
    const createdUser = await makeAuthenticatedRequest(
      'post',
      `/api/users?tenantId=${tenantId}`,
      newUser,
      cookies
    );
    
    console.log('Successfully created a new user:', createdUser);
    return createdUser;
  } catch (error) {
    console.error('Failed to create new user:', error);
    throw error;
  }
}

// Function to test user deletion
export async function testUserDeletion(userId: string) {
  const { cookies, tenantId } = await createTestUserAndSession();
  
  try {
    // Delete the user
    const result = await makeAuthenticatedRequest(
      'delete',
      `/api/users/${userId}?tenantId=${tenantId}`,
      undefined,
      cookies
    );
    
    console.log('Successfully deleted user:', result);
    return result;
  } catch (error) {
    console.error('Failed to delete user:', error);
    throw error;
  }
}

// Exposed test functions
export const testFunctions = {
  createTestUser: createTestUserAndSession,
  testUserCreation,
  testUserDeletion
};