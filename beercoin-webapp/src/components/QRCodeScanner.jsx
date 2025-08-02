import { useState, useEffect, useRef } from 'react';
import { useWallet } from '../contexts/WalletContext';
import useContractData from '../hooks/useContractData';
import { Html5Qrcode } from 'html5-qrcode';
import { STORAGE_KEYS, APP_CONFIG } from '../config';
import contractServiceV2 from '../lib/contractServiceV2';
import '../utils/cameraDebug.js'; // Load camera debug utilities

const QRCodeScanner = ({ setActivePage, setPrefilledSendData }) => {
  const { wallet, isRegistered, isTrusted, sendXDai } = useWallet();
  // Poll for trusted status (debug only, no auto-navigation)
  useEffect(() => {
    const interval = setInterval(() => {
      console.debug('[QRCodeScanner] Polling for trusted status. isTrusted:', isTrusted);
    }, 5000); // check every 5 seconds
    return () => clearInterval(interval);
  }, [isTrusted]);

  // Get available cameras
  const getCameras = async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(device => device.kind === 'videoinput');
      setCameras(videoDevices);
      
      // Prioritize main back camera over ultra-wide
      // Look for main camera first (avoid ultra-wide which is often default)
      const mainBackCamera = videoDevices.find(device => {
        const label = device.label.toLowerCase();
        return (label.includes('back') || label.includes('rear') || label.includes('environment')) &&
               (label.includes('main') || label.includes('wide') && !label.includes('ultra'));
      });
      
      // If no main camera, look for any back camera that's NOT ultra-wide
      const backCameraNoUltra = videoDevices.find(device => {
        const label = device.label.toLowerCase();
        return (label.includes('back') || label.includes('rear') || label.includes('environment')) &&
               !label.includes('ultra');
      });
      
      // Fallback to any back camera
      const anyBackCamera = videoDevices.find(device => {
        const label = device.label.toLowerCase();
        return label.includes('back') || label.includes('rear') || label.includes('environment');
      });
      
      // Set priority: main back > back non-ultra > any back > first available
      if (mainBackCamera) {
        setSelectedCamera(mainBackCamera.deviceId);
      } else if (backCameraNoUltra) {
        setSelectedCamera(backCameraNoUltra.deviceId);
      } else if (anyBackCamera) {
        setSelectedCamera(anyBackCamera.deviceId);
      } else if (videoDevices.length > 0) {
        setSelectedCamera(videoDevices[0].deviceId);
      }
      
      console.log('Available cameras:', videoDevices.map(d => d.label));
      console.log('Selected camera:', mainBackCamera?.label || backCameraNoUltra?.label || anyBackCamera?.label || videoDevices[0]?.label);
    } catch (err) {
      console.error('Error getting cameras:', err);
      setError('Failed to get camera list');
    }
  };

  // Initialize cameras on component mount
  useEffect(() => {
    getCameras();
  }, []);

  const [scanning, setScanning] = useState(false);
  const [scannedData, setScannedData] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [manualAddress, setManualAddress] = useState('');
  const [manualUsername, setManualUsername] = useState('');
  const [showManual, setShowManual] = useState(false);
  const [cameras, setCameras] = useState([]);
  const [selectedCamera, setSelectedCamera] = useState('');
  const scannerRef = useRef(null);
  const scannerContainerRef = useRef(null);

  useEffect(() => {
    // Clean up scanner on unmount
    return () => {
      console.log('Component unmounting, cleaning up scanner...');
      if (scannerRef.current) {
        try {
          if (scannerRef.current.isScanning) {
            scannerRef.current.stop().catch(console.error);
          }
          scannerRef.current.clear().catch(console.error);
        } catch (err) {
          console.error('Error during cleanup:', err);
        }
        scannerRef.current = null;
      }
      
      // Clean up DOM elements
      const scannerId = 'beer-qr-scanner';
      const existingElement = document.getElementById(scannerId);
      if (existingElement) {
        existingElement.remove();
      }
    };
  }, []);

  const startScanner = async () => {
    try {
      setScanning(true);
      setError('');
      setScannedData(null);
      
      // Check if we're on HTTPS or localhost (required for camera access)
      const isSecure = window.location.protocol === 'https:' || 
                      window.location.hostname === 'localhost' || 
                      window.location.hostname === '127.0.0.1';
      
      if (!isSecure) {
        throw new Error('Camera access requires HTTPS or localhost. Please use manual entry instead.');
      }
      
      // Check if getUserMedia is available
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera access not supported by your browser. Please use manual entry instead.');
      }
      
      // Wait a moment for the DOM to be ready if needed
      await new Promise(resolve => setTimeout(resolve, 100));
      
      if (!scannerContainerRef.current) {
        console.error('Scanner container ref not found, checking DOM...');
        console.error('scannerContainerRef:', scannerContainerRef);
        console.error('scanning state:', scanning);
        throw new Error('Scanner container not found. Please try again.');
      }
      
      console.log('Scanner container found:', scannerContainerRef.current);
      
      const scannerId = 'beer-qr-scanner';
      
      // Clear any existing scanner element
      const existingElement = document.getElementById(scannerId);
      if (existingElement) {
        existingElement.remove();
      }
      
      // Create fresh scanner container
      const scannerElement = document.createElement('div');
      scannerElement.id = scannerId;
      scannerElement.style.width = '100%';
      scannerElement.style.maxWidth = '400px';
      scannerElement.style.margin = '0 auto';
      scannerElement.style.border = '2px solid #ddd';
      scannerElement.style.borderRadius = '8px';
      scannerElement.style.overflow = 'hidden';
      scannerContainerRef.current.appendChild(scannerElement);
      
      // Test camera permissions first
      console.log('Testing camera permissions...');
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: 'environment' }
        });
        console.log('Camera permission granted');
        stream.getTracks().forEach(track => track.stop()); // Stop the test stream
      } catch (permissionError) {
        console.error('Camera permission error:', permissionError);
        throw new Error('Camera permission denied. Please allow camera access in your browser settings and try again.');
      }
      
      // Initialize scanner with better error handling
      console.log('Initializing QR scanner...');
      scannerRef.current = new Html5Qrcode(scannerId);
      
      const config = {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0,
        showTorchButtonIfSupported: true,
        showZoomSliderIfSupported: true,
        defaultZoomValueIfSupported: 2,
      };
      
      // Try different camera constraints
      const cameraConstraints = [];
      
      // If a specific camera is selected, use it first
      if (selectedCamera) {
        cameraConstraints.push({ deviceId: { exact: selectedCamera } });
      }
      
      // Fallback options
      cameraConstraints.push(
        { facingMode: 'environment' }, // Back camera
        { facingMode: 'user' },        // Front camera
        true                           // Any camera
      );
      
      let scannerStarted = false;
      for (const constraint of cameraConstraints) {
        try {
          console.log('Trying camera constraint:', constraint);
          await scannerRef.current.start(
            constraint,
            config,
            handleScanSuccess,
            handleScanError
          );
          scannerStarted = true;
          console.log('Scanner started successfully');
          break;
        } catch (startError) {
          console.warn('Failed with constraint:', constraint, startError);
          continue;
        }
      }
      
      if (!scannerStarted) {
        throw new Error('Unable to start camera with any available configuration. Please use manual entry.');
      }
      
    } catch (err) {
      console.error('Error starting scanner:', err);
      setError(err.message || 'Failed to start camera. Please check permissions or use manual entry.');
      setScanning(false);
      
      // Clean up on error
      if (scannerRef.current) {
        try {
          await scannerRef.current.stop();
        } catch (stopError) {
          console.warn('Error stopping scanner during cleanup:', stopError);
        }
        scannerRef.current = null;
      }
    }
  };

  const stopScanner = async () => {
    console.log('Stopping scanner...');
    if (scannerRef.current) {
      try {
        if (scannerRef.current.isScanning) {
          await scannerRef.current.stop();
          console.log('Scanner stopped successfully');
        }
        await scannerRef.current.clear();
        scannerRef.current = null;
      } catch (err) {
        console.error('Error stopping scanner:', err);
        // Force cleanup even if stop() fails
        scannerRef.current = null;
      }
    }
    
    // Clean up DOM elements
    const scannerId = 'beer-qr-scanner';
    const existingElement = document.getElementById(scannerId);
    if (existingElement) {
      existingElement.remove();
    }
    
    setScanning(false);
  };

  const handleScanSuccess = (decodedText) => {
    try {
      // Stop scanner after successful scan
      stopScanner();
      
      // Try to parse the QR code data
      let parsedData;
      
      // Check if it's a URL format (deeplink)
      if (decodedText.startsWith('https://pepae.github.io/BeerCoin/')) {
        try {
          const url = new URL(decodedText);
          
          // Check if it's a registration URL
          const regAddress = url.searchParams.get('reg');
          const username = url.searchParams.get('username');
          
          if (regAddress && username) {
            // Registration QR code
            if (!/^0x[a-fA-F0-9]{40}$/.test(regAddress)) {
              throw new Error('Invalid address in registration URL');
            }
            
            parsedData = { 
              address: regAddress,
              username: decodeURIComponent(username),
              type: 'registration'
            };
          } else {
            // Regular referral QR code
            const address = url.searchParams.get('ref');
            const trusted = url.searchParams.get('trusted') === 'true';
            
            if (!address || !/^0x[a-fA-F0-9]{40}$/.test(address)) {
              throw new Error('Invalid address in URL');
            }
            
            parsedData = { 
              address: address,
              isTrusted: trusted,
              type: 'deeplink'
            };
          }
        } catch (urlError) {
          throw new Error('Invalid URL format in QR code');
        }
      } else {
        // Try JSON format (legacy support)
        try {
          parsedData = JSON.parse(decodedText);
        } catch (jsonError) {
          // If not JSON, check if it's a valid Ethereum address
          if (/^0x[a-fA-F0-9]{40}$/.test(decodedText)) {
            parsedData = { address: decodedText };
          } else {
            throw new Error('Invalid QR code format - must be URL, JSON, or Ethereum address');
          }
        }
      }
      
      // Validate the parsed data
      if (!parsedData.address || !/^0x[a-fA-F0-9]{40}$/.test(parsedData.address)) {
        throw new Error('Invalid address in QR code');
      }
      
      setScannedData(parsedData);
    } catch (err) {
      console.error('Error processing QR code:', err);
      setError(err.message || 'Failed to process QR code');
    }
  };

  const handleScanError = (err) => {
    // Don't show errors to user as they happen frequently during scanning
    console.warn('QR scan error:', err);
  };

  const handleManualSubmit = (e) => {
    e.preventDefault();
    
    try {
      if (!manualAddress.trim()) {
        setError('Please enter an address');
        return;
      }
      
      if (!/^0x[a-fA-F0-9]{40}$/.test(manualAddress)) {
        setError('Invalid Ethereum address');
        return;
      }
      
      // For registration approval, also need a username
      if (showManual && manualUsername.trim()) {
        setScannedData({ 
          type: 'registration',
          address: manualAddress,
          username: manualUsername
        });
      } else {
        setScannedData({ address: manualAddress });
      }
      
      setManualAddress('');
      setManualUsername('');
      setShowManual(false);
    } catch (err) {
      console.error('Error processing manual address:', err);
      setError(err.message || 'Failed to process address');
    }
  };

  const handleSendGas = async () => {
    if (!scannedData || !scannedData.address) {
      setError('No valid address found');
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      
      await sendXDai(scannedData.address, APP_CONFIG.gasAmount);
      
      setSuccess(`Successfully sent ${APP_CONFIG.gasAmount} xDAI to ${formatAddress(scannedData.address)}`);
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccess('');
        setScannedData(null);
      }, 3000);
    } catch (err) {
      console.error('Error sending xDAI:', err);
      setError(err.message || 'Failed to send xDAI');
    } finally {
      setLoading(false);
    }
  };

  const handleApproveRegistration = async () => {
    if (!scannedData || !scannedData.address || !scannedData.username) {
      setError('Invalid registration data');
      return;
    }
    
    if (!isTrusted) {
      setError('Only trusted users can approve registrations');
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      
      // First, send gas to the new user
      await sendXDai(scannedData.address, APP_CONFIG.gasAmount);
      
      // Then register the user using the new V2 method
      const result = await contractServiceV2.registerUserByTrusted(scannedData.address, scannedData.username);
      
      if (!result.success) {
        throw new Error(result.error);
      }
      
      setSuccess(`Successfully approved ${scannedData.username}'s registration!`);
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccess('');
        setScannedData(null);
      }, 3000);
    } catch (err) {
      console.error('Error approving registration:', err);
      setError(err.message || 'Failed to approve registration');
    } finally {
      setLoading(false);
    }
  };

  const handleSendToUser = async () => {
    if (!scannedData || !scannedData.address) {
      setError('No valid address found');
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      
      // Check if the user is registered by trying to get their info
      const userInfo = await contractServiceV2.getUserInfo(scannedData.address);
      
      // Navigate to send page with prefilled address regardless of registration status
      setPrefilledSendData({ 
        address: scannedData.address, 
        username: userInfo.success && userInfo.username ? userInfo.username : null
      });
      setActivePage('send');
    } catch (err) {
      console.error('Error checking user info:', err);
      // Even if we can't get user info, still navigate to send page with just the address
      setPrefilledSendData({ 
        address: scannedData.address, 
        username: null
      });
      setActivePage('send');
    } finally {
      setLoading(false);
    }
  };

  const formatAddress = (address) => {
    if (!address) return '';
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  return (
    <div className="beer-container">
      <h2 className="text-2xl font-bold mb-4 text-center">Scan QR Code</h2>
      <p className="text-center text-muted-foreground mb-6">
        {isTrusted 
          ? "Scan a QR code to approve new users or send BEER tokens" 
          : "Scan a QR code to send BEER tokens"}
      </p>
      
      {!scanning && !scannedData && (
        <div>
          {/* Camera Selection */}
          {cameras.length > 1 && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Camera:
              </label>
              <select
                value={selectedCamera}
                onChange={(e) => setSelectedCamera(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-white"
              >
                {cameras.map((camera, index) => {
                  const label = camera.label || `Camera ${index + 1}`;
                  // Add helpful indicators for camera types
                  let displayLabel = label;
                  if (label.toLowerCase().includes('ultra')) {
                    displayLabel = `📐 ${label} (Ultra-wide)`;
                  } else if (label.toLowerCase().includes('tele')) {
                    displayLabel = `🔍 ${label} (Telephoto)`;
                  } else if (label.toLowerCase().includes('back') || label.toLowerCase().includes('rear')) {
                    displayLabel = `📷 ${label} (Main)`;
                  } else if (label.toLowerCase().includes('front') || label.toLowerCase().includes('user')) {
                    displayLabel = `🤳 ${label} (Front)`;
                  }
                  
                  return (
                    <option key={camera.deviceId} value={camera.deviceId}>
                      {displayLabel}
                    </option>
                  );
                })}
              </select>
              <p className="text-xs text-muted-foreground mt-1">
                📷 Main camera recommended for QR scanning
              </p>
            </div>
          )}

          <button
            className="beer-button w-full mb-4"
            onClick={startScanner}
          >
            Start Camera
          </button>
          
          <div className="flex items-center justify-center my-4">
            <div className="flex-1 h-px bg-border"></div>
            <span className="px-4 text-muted-foreground text-sm">OR</span>
            <div className="flex-1 h-px bg-border"></div>
          </div>
          
          <button
            className="beer-button-secondary w-full"
            onClick={() => setShowManual(!showManual)}
          >
            {showManual ? 'Hide Manual Entry' : 'Enter Address Manually'}
          </button>
          
          {showManual && (
            <form onSubmit={handleManualSubmit} className="mt-4">
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Ethereum Address</label>
                <input
                  type="text"
                  className="beer-input w-full"
                  placeholder="0x..."
                  value={manualAddress}
                  onChange={(e) => setManualAddress(e.target.value)}
                  required
                />
              </div>
              
              {isTrusted && (
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1">Username (for registration approval)</label>
                  <input
                    type="text"
                    className="beer-input w-full"
                    placeholder="Enter username"
                    value={manualUsername}
                    onChange={(e) => setManualUsername(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Only needed if approving a new user registration
                  </p>
                </div>
              )}
              
              <button
                type="submit"
                className="beer-button w-full"
              >
                Submit
              </button>
            </form>
          )}
        </div>
      )}
      
      {scanning && (
        <div>
          {/* Camera Selection while scanning */}
          {cameras.length > 1 && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Switch Camera:
              </label>
              <select
                value={selectedCamera}
                onChange={async (e) => {
                  const newCameraId = e.target.value;
                  setSelectedCamera(newCameraId);
                  
                  // Restart scanner with new camera
                  if (scannerRef.current && scannerRef.current.isScanning) {
                    try {
                      await scannerRef.current.stop();
                      
                      // Small delay to ensure camera is released
                      setTimeout(async () => {
                        try {
                          const config = {
                            fps: 10,
                            qrbox: { width: 250, height: 250 },
                            aspectRatio: 1.0,
                            showTorchButtonIfSupported: true,
                            showZoomSliderIfSupported: true,
                            defaultZoomValueIfSupported: 2,
                          };
                          
                          await scannerRef.current.start(
                            { deviceId: { exact: newCameraId } },
                            config,
                            handleScanSuccess,
                            handleScanError
                          );
                        } catch (restartError) {
                          console.error('Error restarting with new camera:', restartError);
                          setError('Failed to switch camera. Please stop and start again.');
                        }
                      }, 500);
                    } catch (stopError) {
                      console.error('Error stopping scanner for camera switch:', stopError);
                    }
                  }
                }}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-white text-sm"
              >
                {cameras.map((camera, index) => {
                  const label = camera.label || `Camera ${index + 1}`;
                  // Add helpful indicators for camera types
                  let displayLabel = label;
                  if (label.toLowerCase().includes('ultra')) {
                    displayLabel = `📐 ${label} (Ultra-wide)`;
                  } else if (label.toLowerCase().includes('tele')) {
                    displayLabel = `🔍 ${label} (Telephoto)`;
                  } else if (label.toLowerCase().includes('back') || label.toLowerCase().includes('rear')) {
                    displayLabel = `📷 ${label} (Main)`;
                  } else if (label.toLowerCase().includes('front') || label.toLowerCase().includes('user')) {
                    displayLabel = `🤳 ${label} (Front)`;
                  }
                  
                  return (
                    <option key={camera.deviceId} value={camera.deviceId}>
                      {displayLabel}
                    </option>
                  );
                })}
              </select>
            </div>
          )}

          <div 
            className="beer-scanner-container" 
            ref={scannerContainerRef}
            style={{ minHeight: '300px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}
          >
            {/* Scanner will be inserted here */}
          </div>
          
          <div className="flex gap-2 mt-4">
            <button
              className="beer-button-secondary flex-1"
              onClick={stopScanner}
            >
              Cancel
            </button>
            
            {cameras.length > 0 && (
              <button
                onClick={getCameras}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex-shrink-0"
                title="Refresh camera list"
              >
                🔄
              </button>
            )}
          </div>
        </div>
      )}
      
      {scannedData && (
        <div className="beer-card">
          {scannedData.type === 'registration' ? (
            <>
              <h3 className="text-lg font-medium mb-4">Registration Approval</h3>
              
              <div className="mb-3">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Username:</span>
                  <span className="font-medium">{scannedData.username}</span>
                </div>
              </div>
              
              <div className="mb-3">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Address:</span>
                  <span className="font-mono">{formatAddress(scannedData.address)}</span>
                </div>
              </div>
              
              <div className="mt-6 space-y-4">
                {isTrusted ? (
                  <button
                    className="beer-button w-full"
                    onClick={handleApproveRegistration}
                    disabled={loading}
                  >
                    {loading ? 'Approving...' : 'Approve Registration'}
                  </button>
                ) : (
                  <div className="p-3 bg-destructive/10 text-destructive rounded-lg">
                    <p className="font-medium">Only trusted users can approve registrations</p>
                  </div>
                )}
                
                <button
                  className="beer-button-secondary w-full"
                  onClick={() => setScannedData(null)}
                >
                  Cancel
                </button>
              </div>
            </>
          ) : (
            <>
              <h3 className="text-lg font-medium mb-4">Scanned Address</h3>
              
              <div className="mb-3">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Address:</span>
                  <span className="font-mono">{formatAddress(scannedData.address)}</span>
                </div>
              </div>
              
              <div className="mt-6 space-y-4">
                <button
                  className="beer-button w-full"
                  onClick={handleSendToUser}
                  disabled={loading}
                >
                  {loading ? 'Checking...' : 'Send BEER/xDAI'}
                </button>
                
                {isTrusted && (
                  <button
                    className="beer-button-secondary w-full"
                    onClick={handleSendGas}
                    disabled={loading}
                  >
                    {loading ? 'Sending...' : `Send ${APP_CONFIG.gasAmount} xDAI for Gas`}
                  </button>
                )}
                
                <button
                  className="beer-button-secondary w-full"
                  onClick={() => setScannedData(null)}
                >
                  Scan Another
                </button>
              </div>
            </>
          )}
        </div>
      )}
      
      {error && (
        <div className="mt-4 p-3 bg-destructive/10 text-destructive rounded-lg text-center">
          {error}
        </div>
      )}
      
      {success && (
        <div className="mt-4 p-3 bg-primary/10 text-primary rounded-lg text-center">
          {success}
        </div>
      )}
    </div>
  );
};

export default QRCodeScanner;

