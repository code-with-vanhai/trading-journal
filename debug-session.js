const { getToken } = require('next-auth/jwt');

// Create a simple debug script to check session status
console.log('=== NextAuth Session Debug ===');
console.log('Environment:', process.env.NODE_ENV);
console.log('NEXTAUTH_SECRET exists:', !!process.env.NEXTAUTH_SECRET);
console.log('NEXTAUTH_URL:', process.env.NEXTAUTH_URL);

// Function to decode JWT without verification (for debugging only)
function debugDecodeJWT(token) {
  if (!token) {
    console.log('No token provided');
    return null;
  }
  
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      console.log('Invalid JWT format');
      return null;
    }
    
    const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
    return payload;
  } catch (error) {
    console.log('Error decoding JWT:', error.message);
    return null;
  }
}

// Mock request to test token
const mockRequest = {
  headers: {
    cookie: 'next-auth.session-token=test' // This would be replaced with actual cookie
  }
};

console.log('\n=== Session Configuration ===');
console.log('Max Age: 24 hours (86400 seconds)');
console.log('Update Age: 24 hours (86400 seconds)');
console.log('Strategy: JWT');

console.log('\n=== Instructions ===');
console.log('1. Open browser DevTools (F12)');
console.log('2. Go to Application/Storage tab');
console.log('3. Check Cookies and Local Storage');
console.log('4. Look for next-auth.session-token');
console.log('5. Clear all browser data if token persists');

module.exports = { debugDecodeJWT }; 