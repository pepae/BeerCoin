import { Html5Qrcode } from 'html5-qrcode';
import { QR_CONFIG } from '../config';

/**
 * QRService - Handles QR code scanning functionality
 */
class QRService {
  constructor() {
    this.scanner = null;
  }

  /**
   * Initialize QR scanner
   * @param {string} elementId - ID of the HTML element to render scanner
   * @returns {Html5Qrcode} Scanner instance
   */
  initScanner(elementId) {
    if (this.scanner) {
      this.stopScanner();
    }
    
    this.scanner = new Html5Qrcode(elementId);
    return this.scanner;
  }

  /**
   * Start QR scanner
   * @param {string} elementId - ID of the HTML element to render scanner
   * @param {Function} onScanSuccess - Callback for successful scan
   * @param {Function} onScanError - Callback for scan error
   * @returns {Promise<void>}
   */
  async startScanner(elementId, onScanSuccess, onScanError) {
    if (!this.scanner) {
      this.initScanner(elementId);
    }
    
    const config = {
      fps: 10,
      qrbox: { width: 250, height: 250 },
    };
    
    try {
      await this.scanner.start(
        { facingMode: "environment" },
        config,
        onScanSuccess,
        onScanError || this.handleScanError
      );
    } catch (error) {
      console.error('Error starting QR scanner:', error);
      throw error;
    }
  }

  /**
   * Stop QR scanner
   * @returns {Promise<void>}
   */
  async stopScanner() {
    if (this.scanner && this.scanner.isScanning) {
      try {
        await this.scanner.stop();
        this.scanner = null;
      } catch (error) {
        console.error('Error stopping QR scanner:', error);
      }
    }
  }

  /**
   * Handle scan error
   * @param {Error} error - Scan error
   */
  handleScanError(error) {
    console.warn('QR scan error:', error);
    // Don't show errors to user as they happen frequently during scanning
  }

  /**
   * Generate QR code data for wallet address
   * @param {string} address - Wallet address
   * @param {boolean} isTrusted - Whether the user is trusted
   * @returns {string} QR code data
   */
  generateQRData(address, isTrusted) {
    const data = {
      address,
      isTrusted: isTrusted || false,
      timestamp: Date.now(),
    };
    
    return JSON.stringify(data);
  }

  /**
   * Parse QR code data
   * @param {string} qrData - QR code data
   * @returns {Object|null} Parsed data or null if invalid
   */
  parseQRData(qrData) {
    try {
      // First try to parse as JSON
      return JSON.parse(qrData);
    } catch (error) {
      // If not JSON, check if it's a valid Ethereum address
      if (this.isValidEthereumAddress(qrData)) {
        return { address: qrData };
      }
      
      console.error('Invalid QR data:', error);
      return null;
    }
  }

  /**
   * Check if string is a valid Ethereum address
   * @param {string} address - Address to check
   * @returns {boolean} True if valid
   */
  isValidEthereumAddress(address) {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
  }
}

// Create singleton instance
const qrService = new QRService();
export default qrService;

