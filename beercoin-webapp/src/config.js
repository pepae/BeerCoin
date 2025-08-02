// BeerCoin DApp Configuration

// Contract addresses on Gnosis Chain (V2 NEW DEPLOYMENT - August 2, 2025)
export const BEERCOIN_ADDRESS = "0x9277a6F60CC18E7119A9A52a78299b5e4c73C594";
export const DISTRIBUTOR_ADDRESS = "0xa128F50Fe7D1d5d839E5723f08B7F0f66D8479737";

// Network configuration
export const NETWORK_CONFIG = {
  chainId: "0x64", // 100 in hex
  chainName: "Gnosis Chain",
  nativeCurrency: {
    name: "xDAI",
    symbol: "xDAI",
    decimals: 18,
  },
  rpcUrls: ["https://rpc.gnosischain.com"],
  blockExplorerUrls: ["https://gnosisscan.io/"],
};

// App configuration
export const APP_CONFIG = {
  appName: "BeerCoin",
  walletStorageKey: "beercoin_wallet",
  refreshInterval: 10000, // 10 seconds for balance updates
  gasAmount: "0.002", // Amount of xDAI to send for gas
  pollingInterval: 5000, // 5 seconds for polling updates
};

// Local storage keys
export const STORAGE_KEYS = {
  WALLET: "beercoin_wallet",
  USERNAME: "beercoin_username",
  IS_TRUSTED: "beercoin_is_trusted",
  REFERRER: "beercoin_referrer",
};

// UI configuration
export const UI_CONFIG = {
  colors: {
    primary: "#F2A900", // Beer gold
    secondary: "#8B4513", // Brown
    background: "#FFF8E1", // Light cream
    text: "#4A2511", // Dark brown
    accent: "#FF8C00", // Dark orange
  },
  animations: {
    duration: 300, // ms
  },
};

// QR code configuration
export const QR_CONFIG = {
  errorCorrectionLevel: "H",
  size: 250,
  includeMargin: true,
  color: {
    dark: "#4A2511", // Dark brown
    light: "#FFF8E1", // Light cream
  },
};

