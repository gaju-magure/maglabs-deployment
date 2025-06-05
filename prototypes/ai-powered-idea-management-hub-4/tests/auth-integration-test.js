#!/usr/bin/env node

/**
 * Comprehensive Supabase Authentication Integration Tests
 * 
 * This script tests the authentication system end-to-end using the Docker Compose stack.
 * Tests include login, logout, role-based access, error handling, and session management.
 */

import fetch from 'node-fetch';
import { createClient } from '@supabase/supabase-js';

// Test Configuration - use environment variables if available
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8000';
const PROXY_URL = process.env.PROXY_URL || 'http://localhost:8080';

// Test Users (these should exist in Supabase)
const TEST_USERS = {
  contributor: {
    email: 'alice@example.com',
    password: 'TestPassword123!',
    expectedRole: 'Contributor'
  },
  evaluator: {
    email: 'bob@example.com', 
    password: 'TestPassword123!',
    expectedRole: 'Evaluator'
  }
};

// Supabase Configuration (will be loaded from frontend)
let supabaseUrl = null;
let supabaseAnonKey = null;
let supabase = null;

// Test Results
const testResults = {
  passed: 0,
  failed: 0,
  errors: []
};

// Helper Functions
function log(message, type = 'info') {
  const timestamp = new Date().toISOString();
  const prefix = type === 'error' ? '❌' : type === 'success' ? '✅' : 'ℹ️';
  console.log(`${prefix} [${timestamp}] ${message}`);
}

function assert(condition, message) {
  if (condition) {
    testResults.passed++;
    log(`PASS: ${message}`, 'success');
  } else {
    testResults.failed++;
    testResults.errors.push(message);
    log(`FAIL: ${message}`, 'error');
  }
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Test Functions
async function testServiceHealth() {
  log('🏥 Testing service health...');
  
  try {
    // Test frontend
    const frontendResponse = await fetch(`${FRONTEND_URL}/config.js`);
    assert(frontendResponse.ok, 'Frontend service is accessible');
    
    const configText = await frontendResponse.text();
    assert(configText.includes('window.ENV'), 'Frontend config.js contains environment variables');
    
    // Extract Supabase config from frontend
    const envMatch = configText.match(/window\.ENV\s*=\s*({[^}]+})/);
    if (envMatch) {
      const envConfig = JSON.parse(envMatch[1]);
      supabaseUrl = envConfig.VITE_SUPABASE_URL;
      supabaseAnonKey = envConfig.VITE_SUPABASE_ANON_KEY;
      
      // Check if Supabase configuration is valid (not dummy values)
      if (supabaseUrl && supabaseAnonKey && 
          supabaseUrl !== 'undefined' && supabaseAnonKey !== 'undefined' &&
          !supabaseUrl.includes('dummy') && !supabaseAnonKey.includes('dummy')) {
        assert(true, 'Valid Supabase configuration found in frontend');
        
        // Initialize Supabase client
        supabase = createClient(supabaseUrl, supabaseAnonKey);
        log(`Initialized Supabase client with URL: ${supabaseUrl}`);
      } else {
        log('Supabase configuration missing or invalid - skipping auth tests');
        log(`URL: ${supabaseUrl}, Key: ${supabaseAnonKey ? 'present' : 'missing'}`);
      }
    } else {
      log('Could not parse environment configuration from frontend');
    }
    
    // Test backend if available
    try {
      const backendResponse = await fetch(`${BACKEND_URL}/health`);
      if (backendResponse.ok) {
        log('Backend service is accessible');
      }
    } catch (e) {
      log('Backend service not accessible (optional for auth tests)');
    }
    
    // Test proxy if available
    try {
      const proxyResponse = await fetch(`${PROXY_URL}/config.js`);
      if (proxyResponse.ok) {
        log('Nginx proxy is accessible');
      }
    } catch (e) {
      log('Nginx proxy not accessible (using direct frontend access)');
    }
    
  } catch (error) {
    assert(false, `Service health check failed: ${error.message}`);
  }
}

async function testSupabaseConnection() {
  log('🔗 Testing Supabase connection...');
  
  if (!supabase) {
    assert(false, 'Supabase client not initialized');
    return;
  }
  
  try {
    // Test basic connection
    const { data, error } = await supabase.auth.getSession();
    assert(!error, `Supabase connection successful: ${error?.message || 'OK'}`);
    
    // Test database connection
    const { data: users, error: dbError } = await supabase
      .from('users')
      .select('count')
      .limit(1);
    
    assert(!dbError, `Database connection successful: ${dbError?.message || 'OK'}`);
    
  } catch (error) {
    assert(false, `Supabase connection failed: ${error.message}`);
  }
}

async function testUserAuthentication(userType) {
  log(`🔐 Testing authentication for ${userType}...`);
  
  const user = TEST_USERS[userType];
  if (!user || !supabase) {
    assert(false, `Test user ${userType} not configured or Supabase not available`);
    return null;
  }
  
  try {
    // Test login
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: user.password
    });
    
    assert(!authError, `Login successful for ${user.email}: ${authError?.message || 'OK'}`);
    assert(authData.user?.email === user.email, `User email matches: ${authData.user?.email}`);
    
    if (authError) return null;
    
    // Test profile retrieval
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('auth_user_id', authData.user.id)
      .single();
    
    assert(!profileError, `Profile retrieval successful: ${profileError?.message || 'OK'}`);
    assert(profile?.email === user.email, `Profile email matches: ${profile?.email}`);
    assert(profile?.roles?.includes(user.expectedRole), `User has expected role: ${profile?.roles}`);
    
    // Test session
    const { data: sessionData } = await supabase.auth.getSession();
    assert(sessionData.session?.user?.id === authData.user.id, 'Session is active');
    
    return { authData, profile };
    
  } catch (error) {
    assert(false, `Authentication test failed for ${userType}: ${error.message}`);
    return null;
  }
}

async function testUserLogout() {
  log('🚪 Testing logout...');
  
  if (!supabase) {
    assert(false, 'Supabase client not available');
    return;
  }
  
  try {
    // Logout
    const { error } = await supabase.auth.signOut();
    assert(!error, `Logout successful: ${error?.message || 'OK'}`);
    
    // Verify session is cleared
    const { data: sessionData } = await supabase.auth.getSession();
    assert(!sessionData.session, 'Session cleared after logout');
    
  } catch (error) {
    assert(false, `Logout test failed: ${error.message}`);
  }
}

async function testInvalidCredentials() {
  log('🚫 Testing invalid credentials...');
  
  if (!supabase) {
    assert(false, 'Supabase client not available');
    return;
  }
  
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: 'invalid@example.com',
      password: 'wrongpassword'
    });
    
    assert(error !== null, 'Invalid credentials should return an error');
    assert(!data.user, 'Invalid credentials should not return user data');
    
  } catch (error) {
    assert(false, `Invalid credentials test failed: ${error.message}`);
  }
}

async function testRoleBasedAccess() {
  log('👥 Testing role-based access control...');
  
  // Test contributor access
  const contributorAuth = await testUserAuthentication('contributor');
  if (contributorAuth) {
    log('Testing contributor permissions...');
    // Contributors should only see their own ideas
    assert(contributorAuth.profile.roles.includes('Contributor'), 'User has Contributor role');
  }
  
  await testUserLogout();
  await sleep(1000);
  
  // Test evaluator access  
  const evaluatorAuth = await testUserAuthentication('evaluator');
  if (evaluatorAuth) {
    log('Testing evaluator permissions...');
    // Evaluators should see all ideas
    assert(evaluatorAuth.profile.roles.includes('Evaluator'), 'User has Evaluator role');
  }
  
  await testUserLogout();
}

async function testSessionPersistence() {
  log('💾 Testing session persistence...');
  
  if (!supabase) {
    assert(false, 'Supabase client not available');
    return;
  }
  
  try {
    // Login
    const { data: authData, error } = await supabase.auth.signInWithPassword({
      email: TEST_USERS.contributor.email,
      password: TEST_USERS.contributor.password
    });
    
    assert(!error, 'Initial login successful');
    
    // Create new client instance to simulate page refresh
    const newSupabase = createClient(supabaseUrl, supabaseAnonKey);
    
    // Check if session persists
    const { data: sessionData } = await newSupabase.auth.getSession();
    assert(sessionData.session?.user?.id === authData.user?.id, 'Session persists across client instances');
    
    // Cleanup
    await supabase.auth.signOut();
    
  } catch (error) {
    assert(false, `Session persistence test failed: ${error.message}`);
  }
}

async function testFrontendIntegration() {
  log('🖥️ Testing frontend integration...');
  
  try {
    // Test that frontend loads properly
    const response = await fetch(FRONTEND_URL);
    assert(response.ok, 'Frontend homepage loads successfully');
    
    const html = await response.text();
    assert(html.includes('Idea Hub'), 'Frontend contains expected content');
    assert(html.includes('config.js'), 'Frontend loads config.js script');
    
    // Test that assets load
    const assetsResponse = await fetch(`${FRONTEND_URL}/assets/Magure_Logo.png`);
    assert(assetsResponse.ok, 'Frontend static assets load successfully');
    
  } catch (error) {
    assert(false, `Frontend integration test failed: ${error.message}`);
  }
}

// Main Test Runner
async function runAllTests() {
  log('🚀 Starting Supabase Authentication Integration Tests');
  log('=' .repeat(60));
  
  try {
    await testServiceHealth();
    await sleep(1000);
    
    if (supabase) {
      await testSupabaseConnection();
      await sleep(1000);
      
      await testInvalidCredentials();
      await sleep(1000);
      
      await testRoleBasedAccess();
      await sleep(1000);
      
      await testSessionPersistence();
      await sleep(1000);
    }
    
    await testFrontendIntegration();
    
  } catch (error) {
    log(`Test execution error: ${error.message}`, 'error');
    testResults.failed++;
    testResults.errors.push(`Test execution error: ${error.message}`);
  }
  
  // Print Results
  log('=' .repeat(60));
  log('📊 TEST RESULTS');
  log('=' .repeat(60));
  log(`Total Tests: ${testResults.passed + testResults.failed}`);
  log(`Passed: ${testResults.passed}`, 'success');
  log(`Failed: ${testResults.failed}`, testResults.failed > 0 ? 'error' : 'success');
  
  if (testResults.errors.length > 0) {
    log('\n🚨 FAILED TESTS:');
    testResults.errors.forEach((error, index) => {
      log(`${index + 1}. ${error}`, 'error');
    });
  }
  
  log('=' .repeat(60));
  
  // Exit with error code if tests failed
  process.exit(testResults.failed > 0 ? 1 : 0);
}

// Handle errors
process.on('unhandledRejection', (reason, promise) => {
  log(`Unhandled Rejection at: ${promise}, reason: ${reason}`, 'error');
  process.exit(1);
});

// Run tests
runAllTests();