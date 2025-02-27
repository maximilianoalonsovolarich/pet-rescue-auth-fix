#!/usr/bin/env node

/**
 * Auth Diagnostic Utility for Pet Rescue
 * 
 * This script helps diagnose authentication issues with Supabase Auth
 * It checks the admin user's status and can perform basic repairs
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const readline = require('readline');

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Check if environment variables are set
if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error('\n🔴 Error: Missing Supabase environment variables.');
  console.log('Make sure you have .env.local file with the following variables:');
  console.log('- NEXT_PUBLIC_SUPABASE_URL');
  console.log('- SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

// Create Supabase admin client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Admin user credentials
const ADMIN_EMAIL = 'codemaxon@gmail.com';
const ADMIN_PASSWORD = 'admin123';

// Main menu
async function showMenu() {
  console.log('\n🔧 Auth Diagnostic Utility\n');
  console.log('1. Check Admin User Status');
  console.log('2. Reset Admin Password');
  console.log('3. Test Admin Login');
  console.log('4. Export Auth Diagnostics');
  console.log('5. Exit\n');
  
  rl.question('Select an option (1-5): ', (answer) => {
    switch (answer.trim()) {
      case '1':
        checkAdminUser();
        break;
      case '2':
        resetAdminPassword();
        break;
      case '3':
        testLogin();
        break;
      case '4':
        exportDiagnostics();
        break;
      case '5':
        console.log('👋 Goodbye!');
        rl.close();
        process.exit(0);
        break;
      default:
        console.log('⚠️ Invalid option. Try again.');
        showMenu();
    }
  });
}

// Check admin user status
async function checkAdminUser() {
  console.log('\n🔍 Checking admin user status...');
  
  try {
    // Check in auth.users
    const { data: authUser, error: authError } = await supabase.auth.admin.getUserByEmail(ADMIN_EMAIL);
    
    if (authError) {
      console.error('Error checking auth.users:', authError.message);
    }
    
    // Check in profiles
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', ADMIN_EMAIL)
      .maybeSingle();
    
    if (profileError) {
      console.error('Error checking profiles:', profileError.message);
    }
    
    // Check identities
    let identities = null;
    let identityError = null;
    
    if (authUser?.user?.id) {
      const { data, error } = await supabase
        .from('auth_identities') // This is a view, might need direct SQL if not available
        .select('*')
        .eq('user_id', authUser.user.id);
      
      identities = data;
      identityError = error;
      
      if (error) {
        console.error('Error checking identities:', error.message);
      }
    }
    
    // Display results
    console.log('\n📊 Admin User Diagnostic Results:\n');
    console.log('--------------------------------------');
    
    if (authUser?.user) {
      console.log('✅ AUTH USER RECORD:');
      console.log(`   User ID: ${authUser.user.id}`);
      console.log(`   Email: ${authUser.user.email}`);
      console.log(`   Email confirmed: ${authUser.user.email_confirmed_at ? 'Yes' : 'No'}`);
      console.log(`   Last sign in: ${authUser.user.last_sign_in_at || 'Never'}`);
      
      if (authUser.user.banned_until) {
        console.log(`   ⚠️ User is banned until: ${authUser.user.banned_until}`);
      }
    } else {
      console.log('❌ AUTH USER RECORD: Not found');
    }
    
    console.log('--------------------------------------');
    
    if (profile) {
      console.log('✅ PROFILE RECORD:');
      console.log(`   Profile ID: ${profile.id}`);
      console.log(`   Name: ${profile.name}`);
      console.log(`   Email: ${profile.email}`);
      console.log(`   Is Admin: ${profile.is_admin ? 'Yes' : 'No'}`);
      console.log(`   Last login: ${profile.last_login || 'Never'}`);
    } else {
      console.log('❌ PROFILE RECORD: Not found');
    }
    
    console.log('--------------------------------------');
    
    if (identities && identities.length > 0) {
      console.log('✅ IDENTITY RECORDS:');
      identities.forEach((identity, index) => {
        console.log(`   Identity #${index + 1}:`);
        console.log(`   Provider: ${identity.provider}`);
        console.log(`   Provider ID: ${identity.provider_id || 'Not set'}`);
        console.log(`   Last sign in: ${identity.last_sign_in_at || 'Never'}`);
        console.log('');
      });
    } else {
      console.log('❌ IDENTITY RECORDS: Not found');
    }
    
    console.log('--------------------------------------');
    
    // Check for inconsistencies
    if (authUser?.user && profile) {
      if (authUser.user.id !== profile.id) {
        console.log('⚠️ INCONSISTENCY: User ID and Profile ID do not match!');
        console.log(`   Auth User ID: ${authUser.user.id}`);
        console.log(`   Profile ID: ${profile.id}`);
      } else {
        console.log('✅ User ID and Profile ID match correctly');
      }
      
      if (!profile.is_admin) {
        console.log('⚠️ ISSUE: Profile is not marked as admin!');
      }
    }
    
    if (authUser?.user && (!identities || identities.length === 0)) {
      console.log('⚠️ ISSUE: User exists but has no identity records!');
    }
    
    console.log('\n📝 RECOMMENDATION:');
    if (!authUser?.user || !profile || (authUser?.user && profile && authUser.user.id !== profile.id)) {
      console.log('   Run the admin_user_fix.sql script to repair the admin user');
    } else if (authUser?.user && (!identities || identities.length === 0)) {
      console.log('   Run the admin_user_fix.sql script to recreate the identity records');
    } else if (profile && !profile.is_admin) {
      console.log('   Update the profile record to set is_admin = true');
    } else {
      console.log('   Admin user appears to be correctly configured');
      console.log('   If login issues persist, try option 2 to reset the password');
    }
    
  } catch (error) {
    console.error('Unexpected error during admin user check:', error);
  }
  
  waitForKeypress();
}

// Reset admin password
async function resetAdminPassword() {
  console.log('\n🔄 Resetting admin password...');
  
  try {
    // Try to use admin API to reset password
    const { data, error } = await supabase.auth.admin.updateUserById(
      'search-by-email', // This will be ignored and only email is used
      { 
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD
      }
    );
    
    if (error) {
      console.error('⚠️ Error using admin API:', error.message);
      console.log('Trying SQL method instead...');
      
      // Use RPC function to reset password (requires this function to exist)
      const { data: rpcData, error: rpcError } = await supabase.rpc(
        'admin_reset_password',
        { user_email: ADMIN_EMAIL, new_password: ADMIN_PASSWORD }
      );
      
      if (rpcError) {
        console.error('⚠️ Error using RPC method:', rpcError.message);
        console.log('\n❌ Password reset failed via APIs');
        console.log('Please use the admin_user_fix.sql script to reset the password manually');
      } else {
        console.log('✅ Password reset successful via RPC function!');
      }
    } else {
      console.log('✅ Password reset successful via admin API!');
    }
  } catch (error) {
    console.error('Unexpected error during password reset:', error);
  }
  
  waitForKeypress();
}

// Test admin login
async function testLogin() {
  console.log('\n🔑 Testing admin login...');
  
  try {
    // Try to sign in with admin credentials
    const { data, error } = await supabase.auth.signInWithPassword({
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD
    });
    
    if (error) {
      console.error('❌ Login failed:', error.message);
      console.log('\nPossible causes:');
      console.log('- Password is incorrect');
      console.log('- User does not exist or is not confirmed');
      console.log('- Password encryption issues');
      console.log('\nRecommendation: Run the admin_user_fix.sql script');
    } else {
      console.log('✅ Login successful!');
      console.log(`User ID: ${data.user.id}`);
      console.log('Session established');
      
      // Check if user is admin
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', data.user.id)
        .maybeSingle();
      
      if (profileError) {
        console.error('Error checking admin status:', profileError.message);
      } else if (profile && profile.is_admin) {
        console.log('✅ User has admin privileges');
      } else {
        console.log('⚠️ User does NOT have admin privileges');
      }
    }
  } catch (error) {
    console.error('Unexpected error during login test:', error);
  }
  
  waitForKeypress();
}

// Export diagnostic data
async function exportDiagnostics() {
  console.log('\n📊 Exporting diagnostic data...');
  
  try {
    const diagnosticData = {
      timestamp: new Date().toISOString(),
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
      adminEmail: ADMIN_EMAIL,
    };
    
    // Get auth user data
    try {
      const { data, error } = await supabase.auth.admin.getUserByEmail(ADMIN_EMAIL);
      if (!error && data) {
        diagnosticData.authUser = data.user;
      } else {
        diagnosticData.authUser = null;
        diagnosticData.authUserError = error?.message;
      }
    } catch (error) {
      diagnosticData.authUserError = error.message;
    }
    
    // Get profile data
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('email', ADMIN_EMAIL)
        .maybeSingle();
      
      if (!error) {
        diagnosticData.profile = data;
      } else {
        diagnosticData.profileError = error.message;
      }
    } catch (error) {
      diagnosticData.profileError = error.message;
    }
    
    // Save to file
    const fs = require('fs');
    const filename = `auth-diagnostics-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
    fs.writeFileSync(filename, JSON.stringify(diagnosticData, null, 2));
    
    console.log(`✅ Diagnostic data exported to ${filename}`);
  } catch (error) {
    console.error('Error exporting diagnostics:', error);
  }
  
  waitForKeypress();
}

// Wait for keypress to continue
function waitForKeypress() {
  console.log('\nPress any key to return to the menu...');
  process.stdin.once('data', () => {
    showMenu();
  });
}

// Start the program
console.log('🔐 Auth Diagnostic Utility for Pet Rescue');
console.log('===========================================');
console.log(`Supabase URL: ${process.env.NEXT_PUBLIC_SUPABASE_URL}`);
showMenu();