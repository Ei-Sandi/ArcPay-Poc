import React, { useState, useEffect } from 'react';
import { ShoppingCart, Wallet, CheckCircle, Clock, XCircle, Network } from 'lucide-react';
import { BridgeKit } from '@circle-fin/bridge-kit';
import { createAdapterFromProvider } from '@circle-fin/adapter-viem-v2';
import { ethers } from 'ethers';

const products = [
    { id: 1, name: 'Arc Hackathon Tee', price: 0.01, quantity: 1, image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&h=400&fit=crop' },
    { id: 2, name: 'Arc Coffee Mug', price: 0.01, quantity: 1, image: 'https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?w=400&h=400&fit=crop' }
];

// Supported payment networks - Users can pay from these networks
const PAYMENT_NETWORKS = [
    { 
        name: 'Base Sepolia', 
        chainId: '0x14a34', 
        rpcUrl: 'https://sepolia.base.org', 
        nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
        blockExplorerUrls: ['https://sepolia.basescan.org'],
        displayName: 'Base Sepolia'
    },
    { 
        name: 'Ethereum Sepolia', 
        chainId: '0xaa36a7', 
        rpcUrl: 'https://rpc.sepolia.org', 
        nativeCurrency: { name: 'Sepolia ETH', symbol: 'ETH', decimals: 18 },
        blockExplorerUrls: ['https://sepolia.etherscan.io'],
        displayName: 'Ethereum Sepolia'
    },
    { 
        name: 'Polygon Amoy', 
        chainId: '0x13882', 
        rpcUrl: 'https://rpc-amoy.polygon.technology', 
        nativeCurrency: { name: 'MATIC', symbol: 'MATIC', decimals: 18 },
        blockExplorerUrls: ['https://amoy.polygonscan.com'],
        displayName: 'Polygon Amoy'
    }
];

// USDC Token Addresses for each chain (Circle's official USDC contracts)
const USDC_ADDRESSES = {
    '0xaa36a7': '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238', // Ethereum Sepolia
    '0x14a34': '0x036CbD53842c5426634e7929541eC2318f3dCF7e',  // Base Sepolia
    '0x13882': '0x41E94Eb019C0762f9Bfcf9Fb1E58725BfB0e7582',  // Polygon Amoy  
    '0x4cef52': '0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d', // Arc Testnet
    '0x1': '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',     // Ethereum Mainnet
    '0x2105': '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',  // Base Mainnet
    '0x89': '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359'     // Polygon Mainnet
};

// Circle's TokenMessenger contract addresses (for burning USDC)
const TOKEN_MESSENGER_ADDRESSES = {
    '0xaa36a7': '0x9f3B8679c73C2Fef8b59B4f3444d4e156fb70AA5', // Ethereum Sepolia
    '0x13882': '0x9f3B8679c73C2Fef8b59B4f3444d4e156fb70AA5',  // Polygon Amoy
    '0x4cef52': '0x9f3B8679c73C2Fef8b59B4f3444d4e156fb70AA5', // Arc Testnet (testnet address)
    '0x1': '0xBd3fa81B58Ba92a82136038B25aDec7066af3155',     // Ethereum Mainnet
    '0x89': '0x9daF8c91AEFAE50b9c0E69629D3F6Ca40cA3B3FE'      // Polygon Mainnet
};

// Destination domains for CCTP (domain where USDC will be minted)
// For testnet: Sepolia = 0, Avalanche Fuji = 1, Optimism Goerli = 2, Arbitrum Goerli = 3, Base Goerli = 6, Polygon Amoy = 7
// For mainnet: Ethereum = 0, Avalanche = 1, Optimism = 2, Arbitrum = 3, Noble = 4, Solana = 5, Base = 6, Polygon = 7
const DESTINATION_DOMAINS = {
    'Ethereum Sepolia': 0,
    'Ethereum Mainnet': 0,
    'Polygon Amoy': 7,
    'Polygon Mainnet': 7,
    'Arc Testnet': 0, // Arc uses Ethereum domain
};

// Default destination domains when burning (use same chain as fallback for testnet)
const DEFAULT_BURN_DESTINATION = {
    '0xaa36a7': 7, // Sepolia → burn to Polygon Amoy domain (backend will reroute to actual destination)
    '0x13882': 0,  // Polygon Amoy → burn to Sepolia domain
    '0x4cef52': 7, // Arc Testnet → burn to Polygon Amoy domain
    '0x1': 7,      // Ethereum → burn to Polygon domain
    '0x89': 0      // Polygon → burn to Ethereum domain
};

const CheckoutDemo = () => {
    const [isConnected, setIsConnected] = useState(false);
    const [userAddress, setUserAddress] = useState('');
    const [currentChain, setCurrentChain] = useState('');
    const [currentChainId, setCurrentChainId] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [paymentStatus, setPaymentStatus] = useState('');
    const [showNetworkSelector, setShowNetworkSelector] = useState(false);
    const [usdcBalance, setUsdcBalance] = useState(null);
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
                // Refresh USDC balance when chain changes
                if (userAddress) {
                    checkUsdcBalance(userAddress, chainId);
                }
            });
        }

        // Cleanup listeners on unmount
        return () => {
            if (window.ethereum) {
                window.ethereum.removeListener('accountsChanged', () => {});
                window.ethereum.removeListener('chainChanged', () => {});
            }
        };
    }, [userAddress]);

    // Check USDC balance when wallet connects or changes
    useEffect(() => {
        if (isConnected && userAddress && currentChainId) {
            checkUsdcBalance(userAddress, currentChainId);
        }
    }, [isConnected, userAddress, currentChainId]);

    const checkUsdcBalance = async (address, chainId) => {
        try {
            const normalizedChainId = chainId.toLowerCase();
            const usdcAddress = USDC_ADDRESSES[normalizedChainId];
            
            if (!usdcAddress) {
                setUsdcBalance(null);
                return;
            }

            const provider = new ethers.BrowserProvider(window.ethereum);
            
            // USDC ABI for balanceOf function
            const usdcAbi = ['function balanceOf(address account) view returns (uint256)'];
            const usdcContract = new ethers.Contract(usdcAddress, usdcAbi, provider);
            
            const balance = await usdcContract.balanceOf(address);
            // USDC has 6 decimals
            const formattedBalance = ethers.formatUnits(balance, 6);
            setUsdcBalance(formattedBalance);
        } catch (error) {
            console.error('Error checking USDC balance:', error);
            setUsdcBalance(null);
        }
    };

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
            '0x14a34': 'Base Sepolia',
            '0x2105': 'Base Mainnet',
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
        
        try {
            // Check if USDC balance is sufficient
            if (usdcBalance !== null && parseFloat(usdcBalance) < total) {
                throw new Error(`Insufficient USDC balance. You have ${parseFloat(usdcBalance).toFixed(2)} USDC but need ${total.toFixed(2)} USDC.`);
            }

            const normalizedChainId = currentChainId.toLowerCase();
            const usdcAddress = USDC_ADDRESSES[normalizedChainId];
            
            if (!usdcAddress) {
                throw new Error('USDC not supported on this chain. Please switch to a supported network.');
            }

            setPaymentStatus('Fetching merchant settings...');
            
            // Fetch merchant settings from backend
            const settingsResponse = await fetch('/api/merchant/settings');
            if (!settingsResponse.ok) {
                throw new Error('Failed to fetch merchant settings');
            }
            const merchantSettings = await settingsResponse.json();
            
            if (!merchantSettings.destinationWallet || !merchantSettings.destinationChain) {
                throw new Error('Merchant has not configured payment settings');
            }

            setPaymentStatus('Initializing Bridge Kit for cross-chain transfer...');
            
            // Initialize Bridge Kit
            const bridgeKit = new BridgeKit();
            
            // Create wallet adapter from MetaMask provider
            const walletAdapter = await createAdapterFromProvider({
                provider: window.ethereum
            });
            
            // Map chainId to Bridge Kit chain names
            const chainMapping = {
                '0xaa36a7': 'Ethereum_Sepolia',
                '0x14a34': 'Base_Sepolia',
                '0x13882': 'Polygon_Amoy_Testnet',
                '0x4cef52': 'Arc_Testnet',
                '0x1': 'Ethereum',
                '0x2105': 'Base',
                '0x89': 'Polygon'
            };
            
            const sourceChainName = chainMapping[normalizedChainId];
            if (!sourceChainName) {
                throw new Error(`Chain ${currentChain} not supported by Bridge Kit`);
            }
            
            // Map merchant's destination chain setting to Bridge Kit chain name
            const merchantChainMapping = {
                'ARC_TESTNET': 'Arc_Testnet',
                'ETHEREUM_SEPOLIA': 'Ethereum_Sepolia',
                'POLYGON_AMOY': 'Polygon_Amoy_Testnet',
                'ETHEREUM': 'Ethereum',
                'POLYGON': 'Polygon'
            };
            
            const destinationChainName = merchantChainMapping[merchantSettings.destinationChain];
            if (!destinationChainName) {
                throw new Error(`Merchant's destination chain ${merchantSettings.destinationChain} not supported`);
            }
            
            const destinationChainDisplay = merchantSettings.destinationChain.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
            
            setPaymentStatus(`Bridging ${total.toFixed(2)} USDC from ${currentChain} to ${destinationChainDisplay}...`);
            
            // Use Bridge Kit's .bridge() method
            // Note: Bridge Kit bridges to YOUR OWN wallet on destination chain
            // After bridging, we'll need to send to merchant separately
            console.log('Starting Bridge Kit transfer...');
            console.log('From:', sourceChainName, 'To:', destinationChainName, 'Amount:', total.toFixed(2));
            
            setPaymentStatus('Please confirm both transactions in MetaMask...');
            
            // Add progress monitoring
            let progressTimer;
            let elapsedSeconds = 0;
            let result; // Declare result outside try block
            
            progressTimer = setInterval(() => {
                elapsedSeconds += 10;
                const minutes = Math.floor(elapsedSeconds / 60);
                const seconds = elapsedSeconds % 60;
                setPaymentStatus(`⏳ Processing bridge transfer... ${minutes}m ${seconds}s\n(CCTP attestation typically takes 10-20 minutes)\n\nYour transaction has been submitted. Please keep this page open.`);
                console.log(`Bridge operation in progress: ${minutes}m ${seconds}s elapsed`);
            }, 10000); // Update every 10 seconds
            
            try {
                // Add timeout wrapper - Bridge Kit can hang indefinitely
                console.log('=== STARTING BRIDGE TRANSFER ===');
                console.log('Source chain:', sourceChainName);
                console.log('Destination chain:', destinationChainName);
                console.log('Amount:', total.toFixed(2));
                console.log('Wallet adapter:', walletAdapter);
                console.log('================================');
                
                const bridgeWithTimeout = Promise.race([
                    bridgeKit.bridge({
                        from: { 
                            adapter: walletAdapter, 
                            chain: sourceChainName 
                        },
                        to: { 
                            adapter: walletAdapter, // Same wallet, different chain
                            chain: destinationChainName 
                        },
                        amount: total.toFixed(2)
                    }),
                    new Promise((_, reject) => 
                        setTimeout(() => reject(new Error('Bridge operation timed out after 25 minutes. Your transaction was submitted but attestation is taking longer than expected. This is unusual - please check Circle Scan or block explorer for status.')), 1500000) // 25 min timeout
                    )
                ]);
                
                result = await bridgeWithTimeout;
                
                clearInterval(progressTimer); // Stop progress timer
                
                console.log('=== BRIDGE KIT COMPLETE ===');
                console.log('Result state:', result.state);
                console.log('Result error:', result.error);
                console.log('Result steps:', result.steps);
                console.log('Step details:');
                result.steps?.forEach((step, index) => {
                    console.log(`  Step ${index}:`, {
                        name: step.name,
                        state: step.state,
                        txHash: step.txHash,
                        error: step.error,
                        data: step.data
                    });
                });
                console.log('Full result object:', result);
                console.log('=========================');
            } catch (bridgeError) {
                clearInterval(progressTimer); // Stop progress timer on error
                throw bridgeError;
            }
            
            setPaymentStatus('Bridge transfer in progress...');
            
            // Log all the steps Bridge Kit performed
            console.log('Bridge Kit Result:', result);
            
            // Extract transaction hashes from steps
            const burnStep = result.steps?.find(s => s.name === 'burn');
            const attestStep = result.steps?.find(s => s.name === 'attest');
            const mintStep = result.steps?.find(s => s.name === 'mint');
            
            if (result.state === 'error') {
                console.error('Bridge transfer error details:', {
                    state: result.state,
                    error: result.error,
                    steps: result.steps,
                    fullResult: result
                });
                const errorMessage = result.error?.message || 'Bridge transfer failed';
                throw new Error(`Bridge transfer failed: ${errorMessage}`);
            }
            
            if (burnStep?.txHash) {
                setPaymentStatus(`✅ USDC burned on ${currentChain}! Tx: ${burnStep.txHash.slice(0, 10)}...`);
            }
            
            if (attestStep?.state === 'success') {
                setPaymentStatus(`✅ Attestation received from Circle!`);
            }
            
            if (mintStep?.txHash) {
                setPaymentStatus(`✅ USDC minted on ${destinationChainDisplay}! Tx: ${mintStep.txHash.slice(0, 10)}...`);
                setPaymentStatus(`Now sending ${total.toFixed(2)} USDC to merchant...`);
                
                // Step 2: Now send the USDC to merchant on the destination chain
                // We need to switch to the destination chain first
                const destinationChainId = Object.keys(chainMapping).find(
                    key => chainMapping[key] === destinationChainName
                );
                
                // Get USDC address on destination chain
                const destinationUsdcAddress = USDC_ADDRESSES[destinationChainId];
                
                // Create USDC contract on destination chain
                const usdcAbi = ['function transfer(address to, uint256 amount) returns (bool)'];
                const destinationProvider = new ethers.BrowserProvider(window.ethereum);
                const destinationSigner = await destinationProvider.getSigner();
                const usdcContract = new ethers.Contract(destinationUsdcAddress, usdcAbi, destinationSigner);
                
                // Send USDC to merchant
                const transferAmount = ethers.parseUnits(total.toFixed(2), 6);
                const transferTx = await usdcContract.transfer(merchantSettings.destinationWallet, transferAmount);
                
                setPaymentStatus('Confirming payment to merchant...');
                await transferTx.wait();
                
                setPaymentStatus(`✅ Payment Complete! Merchant received ${total.toFixed(2)} USDC on ${destinationChainDisplay}`);
                
                // Notify backend of successful payment
                // Convert BigInt values to strings for JSON serialization
                const serializableResult = {
                    state: result.state,
                    steps: result.steps?.map(step => ({
                        name: step.name,
                        state: step.state,
                        txHash: step.txHash,
                        explorerUrl: step.data?.explorerUrl
                    }))
                };
                
                await fetch('/api/process-payment', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ 
                        burnTxHash: burnStep.txHash,
                        mintTxHash: mintStep.txHash,
                        transferTxHash: transferTx.hash,
                        amount: total.toFixed(2),
                        sourceChain: currentChain,
                        destinationChain: destinationChainDisplay,
                        destinationWallet: merchantSettings.destinationWallet,
                        bridgeKitResult: serializableResult
                    })
                });
                
                // Refresh USDC balance
                checkUsdcBalance(userAddress, currentChainId);
            } else {
                throw new Error('Bridge transfer incomplete - mint step failed');
            }
            
        } catch (error) {
            console.error('Payment error:', error);
            if (error.code === 4001) {
                setPaymentStatus('Payment cancelled by user.');
            } else if (error.code === -32603) {
                setPaymentStatus('Transaction failed. Please check your USDC balance and gas fees.');
            } else if (error.message.includes('insufficient funds')) {
                setPaymentStatus('Insufficient funds for gas fees. Please add ETH/MATIC/ARC to your wallet.');
            } else {
                setPaymentStatus(`Payment failed: ${error.message}`);
            }
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
                                <div className="flex items-center justify-between mb-3">
                                    <div>
                                        <div className="text-xs text-orange-600 mb-1">Pay From Network:</div>
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

                                {/* USDC Balance Display */}
                                {usdcBalance !== null && (
                                    <div className="mt-2 p-2 bg-white rounded-md border border-orange-200">
                                        <div className="text-xs text-orange-600">USDC Balance:</div>
                                        <div className={`text-sm font-semibold ${parseFloat(usdcBalance) < total ? 'text-red-600' : 'text-green-600'}`}>
                                            {parseFloat(usdcBalance).toFixed(2)} USDC
                                        </div>
                                        {parseFloat(usdcBalance) < total && (
                                            <div className="text-xs text-red-600 mt-1">
                                                ⚠️ Insufficient balance for this purchase
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Network Selector Dropdown */}
                            {showNetworkSelector && (
                                <div className="mt-3 p-3 bg-white rounded-lg border border-orange-200 shadow-lg">
                                    <div className="text-xs font-semibold text-orange-800 mb-2">Select Payment Network:</div>
                                    <div className="space-y-1 max-h-60 overflow-y-auto">
                                        {PAYMENT_NETWORKS.map((network) => (
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
                        <button 
                            onClick={handlePayment} 
                            disabled={isLoading || (usdcBalance !== null && parseFloat(usdcBalance) < total)} 
                            className="w-full bg-gradient-to-r from-orange-600 to-amber-600 text-white py-4 px-6 rounded-lg font-semibold hover:from-orange-700 hover:to-amber-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isLoading ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    Processing...
                                </>
                            ) : (usdcBalance !== null && parseFloat(usdcBalance) < total) ? (
                                <>
                                    <XCircle className="w-5 h-5" />
                                    Insufficient USDC Balance
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
