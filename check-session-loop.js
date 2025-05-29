#!/usr/bin/env node

// Script to monitor session API calls and detect infinite loops
const http = require('http');

console.log('🔍 Session Loop Monitor');
console.log('======================');

let requestCount = 0;
let lastRequestTime = Date.now();
const requests = [];

function makeRequest() {
  return new Promise((resolve) => {
    const req = http.request({
      hostname: 'localhost',
      port: 3000,
      path: '/api/auth/session',
      method: 'GET'
    }, (res) => {
      requestCount++;
      const now = Date.now();
      const timeSinceLastRequest = now - lastRequestTime;
      lastRequestTime = now;
      
      requests.push({
        count: requestCount,
        status: res.statusCode,
        timeSinceLastRequest
      });
      
      if (requests.length > 10) {
        requests.shift(); // Keep only last 10 requests
      }
      
      resolve({ status: res.statusCode, timeSinceLastRequest });
    });
    
    req.on('error', (error) => {
      resolve({ error: error.message });
    });
    
    req.end();
  });
}

async function monitorSession() {
  console.log('Monitoring session API calls for 30 seconds...\n');
  
  const startTime = Date.now();
  const monitorDuration = 30000; // 30 seconds
  
  while (Date.now() - startTime < monitorDuration) {
    const result = await makeRequest();
    
    if (result.error) {
      console.log(`❌ Error: ${result.error}`);
      break;
    }
    
    console.log(`📊 Request #${requestCount}: Status ${result.status}, Time since last: ${result.timeSinceLastRequest}ms`);
    
    // Check for potential infinite loop (more than 1 request per second on average)
    if (requests.length >= 5) {
      const avgTimeBetweenRequests = requests.slice(-5).reduce((sum, req) => sum + req.timeSinceLastRequest, 0) / 5;
      
      if (avgTimeBetweenRequests < 1000) {
        console.log('⚠️  WARNING: Potential infinite loop detected! Requests are too frequent.');
        console.log(`   Average time between requests: ${avgTimeBetweenRequests.toFixed(0)}ms`);
        console.log('   Expected: Should be much longer unless actively using the app');
      }
    }
    
    await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds between checks
  }
  
  console.log('\n📈 Summary:');
  console.log(`Total requests in 30 seconds: ${requestCount}`);
  console.log(`Average requests per second: ${(requestCount / 30).toFixed(2)}`);
  
  if (requestCount > 30) {
    console.log('⚠️  High request frequency detected. This might indicate a problem.');
  } else {
    console.log('✅ Request frequency looks normal.');
  }
  
  console.log('\n💡 Tips:');
  console.log('• If you see many rapid requests, there might still be a loop');
  console.log('• Normal usage should have very few session API calls');
  console.log('• Most session calls should happen only when user interacts with the app');
}

console.log('Starting monitoring in 3 seconds...');
setTimeout(monitorSession, 3000); 