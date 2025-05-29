#!/usr/bin/env node

// Test utility to verify session expiration
const https = require('https');
const http = require('http');

console.log('🔍 Session Expiration Test Utility');
console.log('==================================');

// Test current session endpoint
function testSessionEndpoint() {
  const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/auth/session',
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    }
  };

  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const session = JSON.parse(data);
          resolve({ status: res.statusCode, session });
        } catch (error) {
          resolve({ status: res.statusCode, session: null, error: error.message });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.end();
  });
}

// Instructions for manual testing
function printTestInstructions() {
  console.log('\n📋 Manual Testing Steps:');
  console.log('========================');
  console.log('1. Update your .env file with the new NEXTAUTH_SECRET');
  console.log('2. Restart the development server (Ctrl+C then npm run dev)');
  console.log('3. Clear browser cache and cookies completely');
  console.log('4. Open browser DevTools (F12)');
  console.log('5. Go to Application > Storage > Clear site data');
  console.log('6. Login to your application');
  console.log('7. Check the JWT token in DevTools:');
  console.log('   - Application > Cookies > next-auth.session-token');
  console.log('   - Decode the JWT at https://jwt.io');
  console.log('   - Check the "exp" field (expiration timestamp)');
  console.log('\n🕒 Expected Behavior:');
  console.log('- Token should expire exactly 24 hours after login');
  console.log('- No automatic refresh should occur');
  console.log('- User should be logged out after 24 hours');
  
  console.log('\n🔧 Quick Test:');
  console.log('To test faster, temporarily change maxAge in NextAuth config to 60 seconds');
  console.log('File: app/api/auth/[...nextauth]/route.js');
  console.log('Change: maxAge: 60 // 1 minute for testing');
}

// Main execution
async function main() {
  try {
    console.log('\n🔍 Testing session endpoint...');
    const result = await testSessionEndpoint();
    console.log('Status:', result.status);
    console.log('Session data:', result.session ? 'Present' : 'None');
    
    if (result.session && result.session.expires) {
      const expiryTime = new Date(result.session.expires);
      const now = new Date();
      const timeRemaining = expiryTime.getTime() - now.getTime();
      
      console.log('Session expires at:', expiryTime.toISOString());
      console.log('Time remaining:', Math.round(timeRemaining / 1000 / 60), 'minutes');
    }
    
  } catch (error) {
    console.log('❌ Error testing session:', error.message);
  }
  
  printTestInstructions();
}

main(); 