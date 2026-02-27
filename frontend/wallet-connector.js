/**
 * Universal Stellar Wallet Connector
 * Supports: Freighter, Albedo, Rabet, xBull, and Manual (Lobstr/Hardware)
 */

class StellarWalletConnector {
    constructor() {
        this.connectedWallet = null;
        this.publicKey = null;
        this.walletType = null;
    }

    /**
     * Detect all available wallets
     */
    async detectWallets() {
        const available = {
            freighter: await this.isFreighterAvailable(),
            albedo: await this.isAlbedoAvailable(),
            rabet: await this.isRabetAvailable(),
            xbull: await this.isXBullAvailable(),
            manual: true // Always available for Lobstr, hardware wallets, etc.
        };
        return available;
    }

    /**
     * Check if Freighter is installed
     */
    async isFreighterAvailable() {
        return typeof window.freighter !== 'undefined';
    }

    /**
     * Check if Albedo is available
     */
    async isAlbedoAvailable() {
        // Albedo is always available (web-based)
        return true;
    }

    /**
     * Check if Rabet is installed
     */
    async isRabetAvailable() {
        return typeof window.rabet !== 'undefined';
    }

    /**
     * Check if xBull is installed
     */
    async isXBullAvailable() {
        return typeof window.xBullSDK !== 'undefined';
    }

    /**
     * Connect to Freighter wallet
     */
    async connectFreighter() {
        try {
            if (!await this.isFreighterAvailable()) {
                throw new Error('Freighter wallet not installed');
            }

            const publicKey = await window.freighter.getPublicKey();
            
            this.publicKey = publicKey;
            this.walletType = 'freighter';
            this.connectedWallet = window.freighter;

            return {
                success: true,
                publicKey: publicKey,
                walletType: 'freighter'
            };
        } catch (error) {
            throw new Error(`Freighter connection failed: ${error.message}`);
        }
    }

    /**
     * Connect to Albedo wallet
     */
    async connectAlbedo() {
        try {
            // Load Albedo SDK dynamically
            if (!window.albedo) {
                await this.loadAlbedoSDK();
            }

            const result = await albedo.publicKey({});
            
            this.publicKey = result.pubkey;
            this.walletType = 'albedo';
            this.connectedWallet = window.albedo;

            return {
                success: true,
                publicKey: result.pubkey,
                walletType: 'albedo'
            };
        } catch (error) {
            throw new Error(`Albedo connection failed: ${error.message}`);
        }
    }

    /**
     * Connect to Rabet wallet
     */
    async connectRabet() {
        try {
            if (!await this.isRabetAvailable()) {
                throw new Error('Rabet wallet not installed');
            }

            const result = await window.rabet.connect();
            
            this.publicKey = result.publicKey;
            this.walletType = 'rabet';
            this.connectedWallet = window.rabet;

            return {
                success: true,
                publicKey: result.publicKey,
                walletType: 'rabet'
            };
        } catch (error) {
            throw new Error(`Rabet connection failed: ${error.message}`);
        }
    }

    /**
     * Connect to xBull wallet
     */
    async connectXBull() {
        try {
            if (!await this.isXBullAvailable()) {
                throw new Error('xBull wallet not installed');
            }

            await window.xBullSDK.connect();
            const publicKey = await window.xBullSDK.getPublicKey();
            
            this.publicKey = publicKey;
            this.walletType = 'xbull';
            this.connectedWallet = window.xBullSDK;

            return {
                success: true,
                publicKey: publicKey,
                walletType: 'xbull'
            };
        } catch (error) {
            throw new Error(`xBull connection failed: ${error.message}`);
        }
    }

    /**
     * Manual connection (for Lobstr, hardware wallets, etc.)
     */
    async connectManual(publicKey) {
        try {
            // Validate Stellar public key format
            if (!publicKey || !publicKey.startsWith('G') || publicKey.length !== 56) {
                throw new Error('Invalid Stellar public key. Must start with G and be 56 characters long.');
            }

            this.publicKey = publicKey;
            this.walletType = 'manual';
            this.connectedWallet = null;

            return {
                success: true,
                publicKey: publicKey,
                walletType: 'manual'
            };
        } catch (error) {
            throw new Error(`Manual connection failed: ${error.message}`);
        }
    }

    /**
     * Auto-detect and connect to the first available wallet
     */
    async autoConnect() {
        const wallets = await this.detectWallets();
        
        if (wallets.freighter) {
            return await this.connectFreighter();
        } else if (wallets.rabet) {
            return await this.connectRabet();
        } else if (wallets.xbull) {
            return await this.connectXBull();
        } else if (wallets.albedo) {
            return await this.connectAlbedo();
        } else {
            throw new Error('No wallet detected. Please install a Stellar wallet or use manual connection.');
        }
    }

    /**
     * Sign transaction (if wallet supports it)
     */
    async signTransaction(xdr, network = 'PUBLIC') {
        try {
            if (!this.connectedWallet) {
                throw new Error('Cannot sign transaction with manual wallet. Please sign in your wallet app.');
            }

            switch (this.walletType) {
                case 'freighter':
                    return await this.connectedWallet.signTransaction(xdr, network);
                
                case 'albedo':
                    const result = await albedo.tx({
                        xdr: xdr,
                        network: network === 'PUBLIC' ? 'public' : 'testnet'
                    });
                    return result.signed_envelope_xdr;
                
                case 'rabet':
                    const rabetResult = await this.connectedWallet.sign(xdr, network);
                    return rabetResult.xdr;
                
                case 'xbull':
                    return await this.connectedWallet.signTransaction(xdr);
                
                default:
                    throw new Error('Wallet does not support transaction signing');
            }
        } catch (error) {
            throw new Error(`Transaction signing failed: ${error.message}`);
        }
    }

    /**
     * Disconnect wallet
     */
    disconnect() {
        this.publicKey = null;
        this.walletType = null;
        this.connectedWallet = null;
    }

    /**
     * Get current connection info
     */
    getConnectionInfo() {
        return {
            connected: this.publicKey !== null,
            publicKey: this.publicKey,
            walletType: this.walletType
        };
    }

    /**
     * Load Albedo SDK dynamically
     */
    async loadAlbedoSDK() {
        return new Promise((resolve, reject) => {
            if (window.albedo) {
                resolve();
                return;
            }

            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/@albedo-link/intent@0.11.0/lib/albedo.intent.js';
            script.onload = () => resolve();
            script.onerror = () => reject(new Error('Failed to load Albedo SDK'));
            document.head.appendChild(script);
        });
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = StellarWalletConnector;
}
// Frontend - Wallet Connection Flow
const connectWallet = async () => {
  try {
    // 1. Get wallet address from Stellar/Freighter
    const publicKey = await getPublicKey(); // Your Stellar connection method
    
    // 2. Prompt user for email (if not already registered)
    const userEmail = await promptForEmail(publicKey);
    
    // 3. Send to backend to store
    const response = await fetch('/api/wallet/connect', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        wallet_address: publicKey,
        email: userEmail,
        notification_preferences: {
          email: true,
          sms: false,
          push: true
        }
      })
    });
    
    if (response.ok) {
      console.log('Wallet connected and email saved');
    }
    
  } catch (error) {
    console.error('Connection failed:', error);
  }
};

// Helper function to get or prompt for email
const promptForEmail = async (walletAddress) => {
  // Check if we already have email for this wallet
  const existingUser = await fetch(`/api/user/check?wallet=${walletAddress}`);
  
  if (existingUser.ok) {
    const data = await existingUser.json();
    if (data.email) {
      return data.email;
    }
  }
  
  // If not, prompt user
  const email = prompt('Enter your email for notifications:');
  
  // Validate email
  if (!isValidEmail(email)) {
    alert('Please enter a valid email address');
    return promptForEmail(walletAddress);
  }
  
  return email;
};

const isValidEmail = (email) => {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
};