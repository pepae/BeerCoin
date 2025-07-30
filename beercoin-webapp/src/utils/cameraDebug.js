// Camera debug test
console.log('🔍 Camera Debug Test');
console.log('==================');

// Check basic browser support
console.log('1. Browser capabilities:');
console.log('   - navigator.mediaDevices:', !!navigator.mediaDevices);
console.log('   - getUserMedia:', !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia));
console.log('   - Protocol:', window.location.protocol);
console.log('   - Hostname:', window.location.hostname);

// Check if HTTPS or localhost
const isSecure = window.location.protocol === 'https:' || 
                window.location.hostname === 'localhost' || 
                window.location.hostname === '127.0.0.1';
console.log('   - Secure context:', isSecure);

// Test camera access
if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
  console.log('\n2. Testing camera access...');
  
  navigator.mediaDevices.getUserMedia({ video: true })
    .then(stream => {
      console.log('✅ Camera access successful!');
      console.log('   - Stream:', stream);
      console.log('   - Video tracks:', stream.getVideoTracks().length);
      
      // Stop the test stream
      stream.getTracks().forEach(track => {
        track.stop();
        console.log('   - Stopped track:', track.label);
      });
    })
    .catch(error => {
      console.log('❌ Camera access failed:', error.name, error.message);
      
      if (error.name === 'NotAllowedError') {
        console.log('💡 Solution: Grant camera permissions in browser');
      } else if (error.name === 'NotFoundError') {
        console.log('💡 Solution: Check if camera is connected');
      } else if (error.name === 'NotSupportedError') {
        console.log('💡 Solution: Use HTTPS or localhost');
      }
    });
} else {
  console.log('❌ getUserMedia not supported');
}

// Export for manual testing
window.testCamera = () => {
  if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
    return navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
      .then(stream => {
        console.log('Camera test successful');
        stream.getTracks().forEach(track => track.stop());
        return true;
      })
      .catch(error => {
        console.error('Camera test failed:', error);
        return false;
      });
  }
  return Promise.resolve(false);
};

console.log('\n3. Manual test available: window.testCamera()');

export default {};
