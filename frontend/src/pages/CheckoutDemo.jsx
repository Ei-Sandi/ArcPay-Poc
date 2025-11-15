import React, { useState, useEffect } from 'react';
import { ShoppingCart, Wallet, CheckCircle, Clock, XCircle, Network } from 'lucide-react';

const products = [
    { id: 1, name: 'Arc Hackathon Tee', price: 2.00, quantity: 1, image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&h=400&fit=crop' },
    { id: 2, name: 'Arc Coffee Mug', price: 2.00, quantity: 1, image: 'https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?w=400&h=400&fit=crop' }
];

// Supported networks for USDC payments
const SUPPORTED_NETWORKS = [
    { 
        name: 'Arc Testnet', 
        chainId: '0x4cef52', // Correct Arc Testnet chainId (decimal 5,042,002)
        rpcUrl: 'https://rpc.testnet.arc.network', 
        nativeCurrency: { name: 'ARC', symbol: 'ARC', decimals: 18 },
        blockExplorerUrls: ['https://testnet.arcscan.io/'],
        displayName: 'Arc Testnet (USDC)'
    },
    { 
        name: 'Ethereum Sepolia', 
        chainId: '0xaa36a7', 
        rpcUrl: 'https://rpc.sepolia.org', 
        nativeCurrency: { name: 'Sepolia ETH', symbol: 'ETH', decimals: 18 },
        blockExplorerUrls: ['https://sepolia.etherscan.io'],
        displayName: 'Ethereum Sepolia (USDC)'
    },
    { 
        name: 'Polygon Amoy', 
        chainId: '0x13882', 
        rpcUrl: 'https://rpc-amoy.polygon.technology', 
        nativeCurrency: { name: 'MATIC', symbol: 'MATIC', decimals: 18 },
        blockExplorerUrls: ['https://amoy.polygonscan.com'],
        displayName: 'Polygon Amoy (USDC)'
    },
    { 
        name: 'Ethereum Mainnet', 
        chainId: '0x1', 
        rpcUrl: 'https://eth.llamarpc.com', 
        nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
        blockExplorerUrls: ['https://etherscan.io'],
        displayName: 'Ethereum Mainnet (USDC)'
    },
    { 
        name: 'Polygon Mainnet', 
        chainId: '0x89', 
        rpcUrl: 'https://polygon-rpc.com', 
        nativeCurrency: { name: 'MATIC', symbol: 'MATIC', decimals: 18 },
        blockExplorerUrls: ['https://polygonscan.com'],
        displayName: 'Polygon Mainnet (USDC)'
    },
];

const CheckoutDemo = () => {
    const [isConnected, setIsConnected] = useState(false);
    const [userAddress, setUserAddress] = useState('');
    const [currentChain, setCurrentChain] = useState('');
    const [currentChainId, setCurrentChainId] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [paymentStatus, setPaymentStatus] = useState('');
    const [showNetworkSelector, setShowNetworkSelector] = useState(false);
    const subtotal = products.reduce((sum, p) => sum + (p.price * p.quantity), 0);
    const discount = 0;
    const total = subtotal - discount;

    // Listen for account and chain changes
    useEffect(() => {
        if (window.ethereum) {
            // Listen for account changes
            window.ethereum.on('accountsChanged', async (accounts) => {
                if (accounts.length === 0) {
                    // User disconnected wallet
                    setIsConnected(false);
                    setUserAddress('');
                    setCurrentChain('');
                    setPaymentStatus('Wallet disconnected');
                    setTimeout(() => setPaymentStatus(''), 2000);
                } else {
                    // User switched accounts
                    setUserAddress(accounts[0]);
                }
            });

            // Listen for chain changes
            window.ethereum.on('chainChanged', async (chainId) => {
                const chainName = await getChainName(chainId);
                setCurrentChain(chainName);
                setCurrentChainId(chainId);
                setPaymentStatus(`Switched to ${chainName}`);
                setTimeout(() => setPaymentStatus(''), 2000);
            });
        }

        // Cleanup listeners on unmount
        return () => {
            if (window.ethereum) {
                window.ethereum.removeListener('accountsChanged', () => {});
                window.ethereum.removeListener('chainChanged', () => {});
            }
        };
    }, []);

    const connectWallet = async () => {
        setPaymentStatus('Connecting to wallet...');
        
        try {
            if (typeof window.ethereum !== 'undefined') {
                const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
                
                const chainId = await window.ethereum.request({ method: 'eth_chainId' });
                
                // Get chain name dynamically
                const chainName = await getChainName(chainId);
                
                setUserAddress(accounts[0]);
                setIsConnected(true);
                setCurrentChain(chainName);
                setCurrentChainId(chainId);
                setPaymentStatus('Wallet connected successfully!');
                setTimeout(() => setPaymentStatus(''), 2000);
            } else {
                setPaymentStatus('MetaMask not detected. Please install MetaMask.');
            }
        } catch (error) {
            setPaymentStatus(`Connection failed: ${error.message}`);
        }
    };

    const switchNetwork = async (network) => {
        if (!window.ethereum) {
            setPaymentStatus('MetaMask not detected.');
            return;
        }

        try {
            setPaymentStatus(`Switching to ${network.name}...`);

            // Try to switch to the network
            await window.ethereum.request({
                method: 'wallet_switchEthereumChain',
                params: [{ chainId: network.chainId }],
            });

            setShowNetworkSelector(false);
            setPaymentStatus(`Switched to ${network.name} successfully!`);
            setTimeout(() => setPaymentStatus(''), 2000);

        } catch (error) {
            // Error code 4902 means the chain hasn't been added to MetaMask yet
            if (error.code === 4902) {
                try {
                    setPaymentStatus(`Adding ${network.name} to MetaMask...`);
                    
                    await window.ethereum.request({
                        method: 'wallet_addEthereumChain',
                        params: [{
                            chainId: network.chainId,
                            chainName: network.name,
                            nativeCurrency: network.nativeCurrency,
                            rpcUrls: [network.rpcUrl],
                            blockExplorerUrls: network.blockExplorerUrls || []
                        }],
                    });
                    setShowNetworkSelector(false);
                    setPaymentStatus(`${network.name} added and switched successfully!`);
                    setTimeout(() => setPaymentStatus(''), 2000);
                } catch (addError) {
                    setPaymentStatus(`Failed to add ${network.name}: ${addError.message}`);
                }
            } else if (error.code === 4001) {
                setPaymentStatus('Network switch cancelled by user.');
                setTimeout(() => setPaymentStatus(''), 2000);
            } else {
                setPaymentStatus(`Failed to switch network: ${error.message}`);
            }
        }
    };

    const changeAccount = async () => {
        if (!window.ethereum) {
            setPaymentStatus('MetaMask not detected.');
            return;
        }

        try {
            setPaymentStatus('Opening account selector...');
            // Request accounts with the 'eth_requestAccounts' will show account selector
            const accounts = await window.ethereum.request({
                method: 'wallet_requestPermissions',
                params: [{
                    eth_accounts: {}
                }]
            });
            
            // After permission is granted, get the accounts
            const newAccounts = await window.ethereum.request({ method: 'eth_accounts' });
            if (newAccounts && newAccounts.length > 0) {
                setUserAddress(newAccounts[0]);
                setPaymentStatus('Account changed successfully!');
                setTimeout(() => setPaymentStatus(''), 2000);
            }
        } catch (error) {
            if (error.code === 4001) {
                setPaymentStatus('Account change cancelled by user.');
                setTimeout(() => setPaymentStatus(''), 2000);
            } else {
                setPaymentStatus(`Failed to change account: ${error.message}`);
            }
        }
    };

    const getChainName = async (chainId) => {
        // Normalize chainId to lowercase for consistent comparison
        const normalizedChainId = chainId?.toLowerCase();
        
        // Common chain names for quick lookup (all lowercase)
        const knownChains = {
            '0x1': 'Ethereum Mainnet',
            '0xaa36a7': 'Ethereum Sepolia',
            '0x13882': 'Polygon Amoy',
            '0x89': 'Polygon Mainnet',
            '0x5': 'Goerli',
            '0xa': 'Optimism',
            '0xa4b1': 'Arbitrum One',
            '0x38': 'BNB Smart Chain',
            '0xa86a': 'Avalanche C-Chain',
            '0x4cef52': 'Arc Testnet'
        };

        // If it's a known chain, return immediately
        if (knownChains[normalizedChainId]) {
            return knownChains[normalizedChainId];
        }

        // Try to fetch chain info dynamically
        try {
            // Convert hex to decimal
            const chainIdDecimal = parseInt(chainId, 16);

            // Return formatted chain ID if name not found
            return `Chain ${chainIdDecimal} (${chainId})`;
        } catch (error) {
            return `Chain ${chainId}`;
        }
    };

    const handlePayment = async () => {
        setIsLoading(true);
        setPaymentStatus('Please approve the USDC spending in your wallet...');
        try {
            await new Promise(resolve => setTimeout(resolve, 2000));
            setPaymentStatus('Processing burn transaction on ' + currentChain + '... This may take a moment.');
            await new Promise(resolve => setTimeout(resolve, 3000));
            const mockBurnTxHash = '0x' + Math.random().toString(16).slice(2, 66);
            setPaymentStatus('Payment sent. Verifying transaction on-chain. This is the final step and may take 15-20 minutes. Please keep this window open.');
            const response = await fetch('/api/process-payment', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ burnTxHash: mockBurnTxHash, amount: total.toFixed(2), sourceChain: currentChain })
            });
            if (response.ok) {
                setPaymentStatus('✅ Payment Complete! Your order is confirmed.');
            } else {
                throw new Error('Backend processing failed');
            }
        } catch (error) {
            setPaymentStatus(`Payment failed: ${error.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    const formatAddress = (address) => {
        if (!address) return '';
        return `${address.slice(0, 6)}...${address.slice(-4)}`;
    };

    return (
        <div className="max-w-5xl mx-auto px-6 py-12">
            <div className="text-center mb-8">
                <h1 className="text-3xl font-bold text-orange-800 mb-2">Checkout</h1>
                <p className="text-orange-600">Pay with USDC from any chain</p>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
                {/* Products Section */}
                <div className="md:col-span-2 space-y-4">
                    <h2 className="text-xl font-semibold text-orange-800 mb-4">Your Order</h2>
                    {products.map((product) => (
                        <div key={product.id} className="bg-orange-50 rounded-lg p-4 border border-orange-100 flex gap-4">
                            <img src={product.image} alt={product.name} className="w-24 h-24 object-cover rounded-lg" />
                            <div className="flex-1">
                                <h3 className="font-semibold text-orange-800 text-lg">{product.name}</h3>
                                <div className="text-orange-600 mt-1">Quantity: {product.quantity}</div>
                                <div className="text-orange-800 font-semibold mt-2">{product.price.toFixed(2)} USDC</div>
                            </div>
                        </div>
                    ))}
                </div>
                {/* Payment Section */}
                <div className="space-y-4">
                    {/* Wallet Status */}
                    {isConnected && (
                        <div className="bg-orange-50 rounded-lg p-4 border border-orange-100">
                            <div className="flex items-center gap-2 text-sm text-orange-600 mb-2">
                                <Wallet className="w-4 h-4" />
                                Connected Wallet
                            </div>
                            <div className="font-mono text-orange-800 text-sm">{formatAddress(userAddress)}</div>
                            <button 
                                onClick={changeAccount}
                                className="text-xs text-orange-600 hover:text-orange-800 underline mt-1"
                            >
                                Switch Account
                            </button>
                            
                            <div className="mt-3 pt-3 border-t border-orange-200">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <div className="text-xs text-orange-600 mb-1">Current Network:</div>
                                        <div className="text-sm font-semibold text-orange-800">{currentChain}</div>
                                    </div>
                                    <button 
                                        onClick={() => setShowNetworkSelector(!showNetworkSelector)}
                                        className="text-xs bg-orange-100 hover:bg-orange-200 text-orange-700 px-3 py-1.5 rounded-md transition-colors flex items-center gap-1"
                                    >
                                        <Network className="w-3 h-3" />
                                        Switch
                                    </button>
                                </div>
                            </div>

                            {/* Network Selector Dropdown */}
                            {showNetworkSelector && (
                                <div className="mt-3 p-3 bg-white rounded-lg border border-orange-200 shadow-lg">
                                    <div className="text-xs font-semibold text-orange-800 mb-2">Select Network:</div>
                                    <div className="space-y-1 max-h-60 overflow-y-auto">
                                        {SUPPORTED_NETWORKS.map((network) => (
                                            <button
                                                key={network.chainId}
                                                onClick={() => switchNetwork(network)}
                                                className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                                                    currentChainId.toLowerCase() === network.chainId.toLowerCase()
                                                        ? 'bg-orange-600 text-white'
                                                        : 'hover:bg-orange-100 text-orange-800'
                                                }`}
                                            >
                                                {network.displayName || network.name}
                                                {currentChainId.toLowerCase() === network.chainId.toLowerCase() && (
                                                    <span className="ml-2 text-xs">✓</span>
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                    {/* Order Summary */}
                    <div className="bg-orange-50 rounded-lg p-6 border border-orange-100 space-y-3">
                        <h3 className="font-semibold text-orange-800 mb-4">Order Summary</h3>
                        <div className="flex justify-between text-orange-800">
                            <span>Subtotal</span>
                            <span>{subtotal.toFixed(2)} USDC</span>
                        </div>
                        <div className="flex justify-between text-orange-600">
                            <span>Discount</span>
                            <span>{discount.toFixed(2)} USDC</span>
                        </div>
                        <div className="border-t border-orange-200 pt-3 flex justify-between text-orange-800 font-bold text-lg">
                            <span>Total</span>
                            <span>{total.toFixed(2)} USDC</span>
                        </div>
                    </div>
                    {/* Payment Button */}
                    {!isConnected ? (
                        <button onClick={connectWallet} className="w-full bg-gradient-to-r from-orange-600 to-amber-600 text-white py-4 px-6 rounded-lg font-semibold hover:from-orange-700 hover:to-amber-700 transition-all flex items-center justify-center gap-2">
                            <Wallet className="w-5 h-5" />
                            Connect Wallet
                        </button>
                    ) : (
                        <button onClick={handlePayment} disabled={isLoading} className="w-full bg-gradient-to-r from-orange-600 to-amber-600 text-white py-4 px-6 rounded-lg font-semibold hover:from-orange-700 hover:to-amber-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
                            {isLoading ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    Processing...
                                </>
                            ) : (
                                <>
                                    <ShoppingCart className="w-5 h-5" />
                                    Pay {total.toFixed(2)} USDC
                                </>
                            )}
                        </button>
                    )}
                    {/* Status Messages */}
                    {paymentStatus && (
                        <div className={`p-4 rounded-lg ${paymentStatus.includes('✅') ? 'bg-green-50 border border-green-200 text-green-700' : paymentStatus.includes('failed') || paymentStatus.includes('Failed') ? 'bg-red-50 border border-red-200 text-red-700' : 'bg-blue-50 border border-blue-200 text-blue-700'}`}>
                            <div className="text-sm whitespace-pre-line">{paymentStatus}</div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CheckoutDemo;
