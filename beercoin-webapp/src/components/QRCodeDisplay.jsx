import { useState } from 'react';
import { useWallet } from '../contexts/WalletContext';
import { QRCodeSVG } from 'qrcode.react';
import { QR_CONFIG } from '../config';

const QRCodeDisplay = () => {
  const { wallet, isTrusted } = useWallet();
  const [copied, setCopied] = useState(false);

  if (!wallet) {
    return null;
  }

  // Generate QR code data
  const qrData = JSON.stringify({
    address: wallet.address,
    isTrusted: isTrusted || false,
    timestamp: Date.now(),
  });

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
          <li>• If you're a trusted user, others can scan this QR code to register with your referral</li>
          <li>• Anyone can scan this QR code to send you BEER tokens</li>
          <li>• Share your QR code to grow your referral network</li>
        </ul>
      </div>
    </div>
  );
};

export default QRCodeDisplay;

