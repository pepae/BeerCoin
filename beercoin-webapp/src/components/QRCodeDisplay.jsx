import { useState, useEffect } from 'react';
import { useWallet } from '../contexts/WalletContext';
import { QRCodeSVG } from 'qrcode.react';
import { QR_CONFIG } from '../config';

const QRCodeDisplay = ({ setActivePage }) => {
  const { wallet, isTrusted } = useWallet();
  const [copied, setCopied] = useState(false);

  // Poll for trusted status and auto-navigate to dashboard ONLY for new users
  useEffect(() => {
    if (isTrusted) {
      console.debug('[QRCodeDisplay] User is already trusted, skipping polling.');
      return;
    }
    console.debug('[QRCodeDisplay] Starting trusted status polling...');
    const interval = setInterval(() => {
      console.debug('[QRCodeDisplay] Polling for trusted status. isTrusted:', isTrusted);
      if (isTrusted && setActivePage) {
        console.debug('[QRCodeDisplay] User became trusted! Navigating to dashboard.');
        setActivePage('dashboard');
      }
    }, 5000);
    return () => {
      console.debug('[QRCodeDisplay] Stopping trusted status polling.');
      clearInterval(interval);
    };
  }, [isTrusted, setActivePage]);

  if (!wallet) {
    return null;
  }

  // Generate QR code data with deeplink that works both as URL and app data
  const qrData = `https://pepae.github.io/BeerCoin/?ref=${wallet.address}&trusted=${isTrusted ? 'true' : 'false'}&t=${Date.now()}`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(wallet.address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatAddress = (address) => {
    if (!address) return '';
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  return (
    <div className="beer-container">
      <h2 className="text-2xl font-bold mb-4 text-center">Your QR Code</h2>
      <p className="text-center text-muted-foreground mb-6">
        Share this QR code with others to receive BEER tokens or to refer new users
      </p>
      
      <div className="beer-qr-container">
        <QRCodeSVG
          value={qrData}
          size={QR_CONFIG.size}
          level={QR_CONFIG.errorCorrectionLevel}
          includeMargin={QR_CONFIG.includeMargin}
          fgColor={QR_CONFIG.color.dark}
          bgColor={QR_CONFIG.color.light}
        />
      </div>
      
      <div className="mt-6 mb-8">
        <div className="flex justify-between items-center mb-2">
          <span className="text-muted-foreground">Your Address:</span>
          <div className="flex items-center">
            <span className="font-mono">{formatAddress(wallet.address)}</span>
            <button
              className="ml-2 p-1 text-primary hover:text-primary/80"
              onClick={copyToClipboard}
            >
              {copied ? '✓' : '📋'}
            </button>
          </div>
        </div>
        
        <div className="flex justify-between items-center">
          <span className="text-muted-foreground">Status:</span>
          <span className="font-medium">
            {isTrusted ? (
              <span className="text-primary">Trusted User</span>
            ) : (
              <span>Regular User</span>
            )}
          </span>
        </div>
      </div>
      
      <div className="bg-muted p-4 rounded-lg">
        <h3 className="font-medium mb-2">How to use:</h3>
        <ul className="text-sm text-muted-foreground space-y-2">
          <li>• <strong>New users:</strong> Scanning this QR code will open BeerCoin app and pre-fill your referral info</li>
          <li>• <strong>Existing users:</strong> Can scan from within the app to send you BEER tokens or use your referral</li>
          <li>• <strong>Trusted users only:</strong> Others can register through your referral link</li>
          <li>• Share this QR code to grow your referral network and earn more BEER!</li>
        </ul>
      </div>
    </div>
  );
};

export default QRCodeDisplay;

