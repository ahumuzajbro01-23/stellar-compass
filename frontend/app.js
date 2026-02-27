// Stellar Compass - Multi-Wallet Support
console.log('Stellar Compass Initializing...');

let connectedAccount = null;
let connectedWallet = null;

// Toggle hamburger menu
function toggleMenu() {
    const menu = document.getElementById('wallet-menu');
    menu.classList.toggle('hidden');
    
    // Close menu when clicking outside
    if (!menu.classList.contains('hidden')) {
        setTimeout(() => {
            document.addEventListener('click', closeMenuOutside);
        }, 100);
    }
}

function closeMenuOutside(event) {
    const menu = document.getElementById('wallet-menu');
    const menuBtn = document.getElementById('menu-btn');
    const connectBtn = document.getElementById('connect-btn');
    
    if (!menu.contains(event.target) && 
        event.target !== menuBtn && 
        event.target !== connectBtn &&
        !menuBtn.contains(event.target) &&
        !connectBtn.contains(event.target)) {
        menu.classList.add('hidden');
        document.removeEventListener('click', closeMenuOutside);
    }
}

// Connect to Freighter wallet
async function connectFreighter() {
    console.log('Connecting to Freighter...');
    toggleMenu();
    
    if (typeof window.freighterApi === 'undefined') {
        showError('Freighter not installed. Please install from freighter.app');
        return;
    }
    
    try {
        const publicKey = await window.freighterApi.getPublicKey();
        await finalizeConnection(publicKey, 'Freighter', '');
    } catch (error) {
        console.error('Freighter error:', error);
        showError('Failed to connect Freighter. Please approve the connection.');
    }
}

// Connect to Rabet wallet
async function connectRabet() {
    console.log('Connecting to Rabet...');
    toggleMenu();
    
    if (typeof window.rabet === 'undefined') {
        showError('Rabet not installed. Please install Rabet extension.');
        return;
    }
    
    try {
        await window.rabet.connect();
        const publicKey = await window.rabet.getPublicKey();
        await finalizeConnection(publicKey, 'Rabet', '');
    } catch (error) {
        console.error('Rabet connection error:', error);
        showError('Failed to connect Rabet. Please approve the connection.');
    }
}

// Connect to xBull wallet
async function connectXBull() {
    console.log('Connecting to xBull...');
    toggleMenu();
    
    if (typeof window.xBullSDK === 'undefined') {
        showError('xBull not installed. Please install xBull extension.');
        return;
    }
    
    try {
        const publicKey = await window.xBullSDK.connect();
        await finalizeConnection(publicKey, 'xBull', '');
    } catch (error) {
        console.error('xBull error:', error);
        showError('Failed to connect xBull. Please approve the connection.');
    }
}

// Connect to Albedo wallet
async function connectAlbedo() {
    console.log('Connecting to Albedo...');
    toggleMenu();
    
    try {
        if (typeof window.albedo === 'undefined') {
            showError('Albedo integration coming soon. Use manual entry for now.');
            return;
        }
        
        const result = await window.albedo.publicKey();
        await finalizeConnection(result.pubkey, 'Albedo', '');
    } catch (error) {
        console.error('Albedo error:', error);
        showError('Failed to connect Albedo.');
    }
}

// Connect manually (Lobstr / Other wallets)
async function connectManual(walletType = 'Custom') {
    console.log('Manual wallet connection...');
    toggleMenu();
    
    const walletInstructions = {
        'Lobstr': {
            name: 'Lobstr Wallet',
            steps: [
                'Open the Lobstr app on your phone',
                'Tap on Settings',
                'Select "Account Details"',
                'Copy your Public Key (starts with "G")'
            ]
        },
        'Custom': {
            name: 'Custom Wallet',
            steps: [
                'Open your Stellar wallet app or website',
                'Find your account settings or profile',
                'Look for "Public Key", "Public Address", or "Account ID"',
                'Copy the address (56 characters starting with "G")'
            ]
        }
    };
    
    const wallet = walletInstructions[walletType] || walletInstructions['Custom'];
    
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4';
    modal.innerHTML = `
        <div class="bg-white rounded-lg max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div class="sticky top-0 bg-gradient-to-r from-purple-600 to-blue-600 text-white p-6 rounded-t-lg">
                <div class="flex justify-between items-center">
                    <div class="flex items-center space-x-3">
                        <div>
                            <h3 class="text-2xl font-bold">Connect ${wallet.name}</h3>
                            <p class="text-sm opacity-90">Enter your Stellar address</p>
                        </div>
                    </div>
                    <button onclick="this.closest('.fixed').remove()" class="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2 transition">
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                        </svg>
                    </button>
                </div>
            </div>

            <div class="p-6">
                <div class="bg-blue-50 border-l-4 border-blue-500 rounded-lg p-4 mb-4">
                    <h4 class="font-bold text-blue-900 mb-2 flex items-center">
                        <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                        </svg>
                        How to find your public key:
                    </h4>
                    <ol class="text-sm text-blue-800 space-y-2 ml-6">
                        ${wallet.steps.map((step, i) => `<li class="list-decimal">${step}</li>`).join('')}
                    </ol>
                </div>

                <label class="block text-sm font-semibold text-gray-700 mb-2">
                    Stellar Public Key
                </label>
                <input 
                    type="text" 
                    id="wallet-address-input" 
                    placeholder="GXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
                    class="w-full border-2 border-gray-300 rounded-lg px-4 py-3 mb-2 font-mono text-sm focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-200 transition"
                />
                <p class="text-xs text-gray-500 mb-4">
                    Must be 56 characters long and start with "G"
                </p>

                ${walletType === 'Custom' ? `
                <div class="bg-gray-50 rounded-lg p-4 mb-4">
                    <p class="text-xs font-semibold text-gray-700 mb-2">Supported Stellar Wallets:</p>
                    <div class="grid grid-cols-2 gap-2 text-xs text-gray-600">
                        <div>Lobstr</div>
                        <div>Solar Wallet</div>
                        <div>StellarTerm</div>
                        <div>StellarX</div>
                        <div>Ledger</div>
                        <div>Trezor</div>
                        <div>Paper Wallet</div>
                        <div>Any other wallet</div>
                    </div>
                </div>
                ` : ''}

                <div class="flex space-x-3">
                    <button 
                        onclick="this.closest('.fixed').remove()" 
                        class="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg hover:bg-gray-300 transition font-semibold">
                        Cancel
                    </button>
                    <button 
                        onclick="confirmManualConnection('${walletType}')" 
                        class="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 rounded-lg hover:from-purple-700 hover:to-blue-700 transition font-semibold shadow-lg">
                        Connect Wallet
                    </button>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    setTimeout(() => {
        document.getElementById('wallet-address-input').focus();
    }, 100);
}

// Confirm manual wallet connection
async function confirmManualConnection(walletType = 'Custom') {
    const input = document.getElementById('wallet-address-input');
    const publicKey = input.value.trim();
    
    if (!publicKey || publicKey.length !== 56 || !publicKey.startsWith('G')) {
        showError('Invalid Stellar address. Must be 56 characters starting with "G".');
        input.classList.remove('border-gray-300');
        input.classList.add('border-red-500');
        input.focus();
        return;
    }
    
    const modal = document.querySelector('.fixed.inset-0');
    if (modal) modal.remove();
    
    const walletName = walletType === 'Custom' ? 'Custom Wallet' : walletType;
    const walletIcon = '';
    
    await finalizeConnection(publicKey, walletName, walletIcon);
}

// Finalize connection for any wallet
async function finalizeConnection(publicKey, walletName, walletIcon) {
    console.log(`${walletName} connected:`, publicKey);
    
    connectedAccount = publicKey;
    connectedWallet = walletName;
    
    document.getElementById('wallet-address').textContent = 
        `${publicKey.substring(0, 8)}...${publicKey.substring(publicKey.length - 8)}`;
    document.getElementById('wallet-icon').textContent = walletIcon;
    document.getElementById('connect-btn').style.display = 'none';
    document.getElementById('menu-btn').classList.remove('hidden');
    document.getElementById('wallet-info').classList.remove('hidden');
    document.getElementById('get-started').style.display = 'none';
    document.getElementById('dashboard').classList.remove('hidden');
    
    showSuccess(`${walletName} connected! Sending notification...`);
    
    try {
        const notifyResponse = await fetch('http://localhost:5000/api/notify-connection', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                publicKey: publicKey,
                walletType: walletName
            })
        });

        if (notifyResponse.ok) {
            console.log('Notification sent');
            showSuccess('Check your email for wallet connection confirmation!');
        }
    } catch (error) {
        console.warn('Could not send notification:', error);
    }
    
    await loadPortfolio();
    await loadOpportunities();
}

// Load portfolio data
async function loadPortfolio() {
    if (!connectedAccount) return;
    
    console.log('Loading portfolio...');
    
    try {
        const response = await fetch(`http://localhost:5000/api/portfolio/${connectedAccount}`);
        const data = await response.json();

        console.log('Portfolio loaded:', data);

        const balances = data.balances || [];

        document.getElementById('total-value').textContent = `$${(data.total_value || 0).toFixed(2)}`;
        document.getElementById('asset-count').textContent = balances.length;
        document.getElementById('idle-count').textContent = (data.idle_assets || []).length;

        const assetsList = document.getElementById('assets-list');
        assetsList.innerHTML = '';

        if (balances.length === 0) {
            assetsList.innerHTML = `
                <div class="text-center py-8">
                    <p class="text-gray-500">No assets found.</p>
                    <p class="text-sm text-gray-400 mt-2">Fund your wallet to get started!</p>
                </div>
            `;
        } else {
            balances.forEach(balance => {
                const assetCode = balance.asset_code || 'XLM';
                const bal = parseFloat(balance.balance) || 0;
                const val = parseFloat(balance.value) || 0;

                const assetDiv = document.createElement('div');
                assetDiv.className = 'p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition';
                assetDiv.innerHTML = `
                    <div class="flex justify-between items-center">
                        <div>
                            <span class="font-bold text-lg">${assetCode}</span>
                            <p class="text-sm text-gray-600">${bal.toFixed(4)}</p>
                        </div>
                        <div class="text-right">
                            <p class="font-semibold text-purple-600">$${val.toFixed(2)}</p>
                        </div>
                    </div>
                `;
                assetsList.appendChild(assetDiv);
            });
        }
        
        showSuccess('Portfolio analysis sent to your email!');
        
    } catch (error) {
        console.error('Error loading portfolio:', error);
        showError('Failed to load portfolio data. Is the backend running?');
    }
}

// Load DeFi opportunities
async function loadOpportunities() {
    if (!connectedAccount) return;
    
    console.log('Loading opportunities...');
    
    try {
        const response = await fetch(`http://localhost:5000/api/opportunities/${connectedAccount}`);
        const result = await response.json();
        const opportunities = result.opportunities || [];

        console.log('Opportunities loaded:', opportunities);

        const oppList = document.getElementById('opportunities-list');
        oppList.innerHTML = '';

        if (opportunities.length === 0) {
            oppList.innerHTML = `
                <div class="text-center py-8">
                    <p class="text-gray-500">No opportunities available.</p>
                    <p class="text-sm text-gray-400 mt-2">Add assets to your wallet first!</p>
                </div>
            `;
        } else {
            opportunities.forEach(opp => {
                const oppDiv = document.createElement('div');
                oppDiv.className = 'p-4 border-2 border-gray-200 rounded-lg hover:border-purple-400 transition cursor-pointer';
                oppDiv.innerHTML = `
                    <div class="flex justify-between items-start mb-3">
                        <div>
                            <h4 class="font-bold text-lg">${opp.protocol}</h4>
                            <p class="text-sm text-gray-600">${opp.type}</p>
                        </div>
                        <span class="px-3 py-1 rounded-full text-xs font-semibold ${
                            opp.risk === 'Low' ? 'bg-green-100 text-green-800' :
                            opp.risk === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                        }">${opp.risk} Risk</span>
                    </div>
                    <div class="grid grid-cols-2 gap-2 mb-3 text-sm">
                        <div>
                            <span class="text-gray-500">APY:</span>
                            <span class="font-bold text-green-600 ml-1">${opp.apy}</span>
                        </div>
                        <div>
                            <span class="text-gray-500">TVL:</span>
                            <span class="font-bold ml-1">${opp.tvl}</span>
                        </div>
                    </div>
                    <p class="text-sm text-gray-600 mb-3">${opp.description}</p>
                    <button class="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-2 rounded-lg font-semibold hover:from-purple-700 hover:to-blue-700 transition">
                        ${opp.action}
                    </button>
                `;
                oppList.appendChild(oppDiv);
            });
            
            if (opportunities.length > 0) {
                showSuccess(`${opportunities.length} opportunities found! Check your email for details.`);
            }
        }
        
    } catch (error) {
        console.error('Error loading opportunities:', error);
        showError('Failed to load opportunities.');
    }
}

// Disconnect wallet
function disconnectWallet() {
    console.log('Disconnecting wallet...');
    
    connectedAccount = null;
    connectedWallet = null;
    document.getElementById('connect-btn').style.display = 'block';
    document.getElementById('menu-btn').classList.add('hidden');
    document.getElementById('wallet-info').classList.add('hidden');
    document.getElementById('get-started').style.display = 'block';
    document.getElementById('dashboard').classList.add('hidden');
    document.getElementById('assets-list').innerHTML = '';
    document.getElementById('opportunities-list').innerHTML = '';
    document.getElementById('total-value').textContent = '$0.00';
    document.getElementById('asset-count').textContent = '0';
    document.getElementById('idle-count').textContent = '0';
    
    showSuccess('Wallet disconnected.');
}

// Utility functions
function showSuccess(message) {
    showNotification(message, 'success');
}

function showError(message) {
    showNotification(message, 'error');
}

function showNotification(message, type) {
    const notification = document.createElement('div');
    notification.className = `fixed top-4 right-4 px-6 py-4 rounded-lg shadow-2xl z-50 max-w-md ${
        type === 'success' ? 'bg-green-500' : 'bg-red-500'
    } text-white`;
    notification.innerHTML = `
        <div class="flex items-center space-x-3">
            <p>${message}</p>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transform = 'translateX(100%)';
        notification.style.transition = 'all 0.5s';
        setTimeout(() => notification.remove(), 500);
    }, 5000);
}

// Initialize on page load
window.addEventListener('load', async () => {
    console.log('Stellar Compass loaded - Multi-Wallet Support!');
    
    try {
        const response = await fetch('http://localhost:5000/api/health');
        const data = await response.json();
        console.log('Backend connected:', data.message);
    } catch (error) {
        console.error('Backend not reachable');
        showError('Backend server not running. Please start the backend on port 5000.');
    }
});
