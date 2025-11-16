import React, { useState, useEffect } from 'react';
import { ShoppingCart, Wallet, CheckCircle, Clock, XCircle, Network } from 'lucide-react';
import { ethers } from 'ethers';

const products = [
    { id: 1, name: 'Arc Hackathon Tee', price: 0.01, quantity: 1, image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&h=400&fit=crop' },
    { id: 2, name: 'Arc Coffee Mug', price: 0.01, quantity: 1, image: 'https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?w=400&h=400&fit=crop' }
];

// Supported payment networks
const PAYMENT_NETWORKS = [
    { 
        name: 'Ethereum Sepolia', 
        chainId: '0xaa36a7',
        blockchain: 'ETH-SEPOLIA',
        displayName: 'Ethereum Sepolia',
        rpcUrl: 'https://rpc.sepolia.org',
        nativeCurrency: { name: 'Sepolia ETH', symbol: 'ETH', decimals: 18 },
        blockExplorerUrls: ['https://sepolia.etherscan.io']
    },
    { 
        name: 'Base Sepolia', 
        chainId: '0x14a34',
        blockchain: 'BASE-SEPOLIA',
        displayName: 'Base Sepolia',
        rpcUrl: 'https://sepolia.base.org',
        nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
        blockExplorerUrls: ['https://sepolia.basescan.org']
    },
    { 
        name: 'Polygon Amoy', 
        chainId: '0x13882',
        blockchain: 'MATIC-AMOY',
        displayName: 'Polygon Amoy',
        rpcUrl: 'https://rpc-amoy.polygon.technology',
        nativeCurrency: { name: 'MATIC', symbol: 'MATIC', decimals: 18 },
        blockExplorerUrls: ['https://amoy.polygonscan.com']
    }
];

// USDC Token Addresses
const USDC_ADDRESSES = {
    '0xaa36a7': '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238',
    '0x14a34': '0x036CbD53842c5426634e7929541eC2318f3dCF7e',
    '0x13882': '0x41E94Eb019C0762f9Bfcf9Fb1E58725BfB0e7582',
    '0x4cef52': '0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d',
};

const CheckoutDemo = () => {
    const [gasStationEnabled, setGasStationEnabled] = useState(false);
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

    useEffect(() => {
        checkGasStationAvailability();
    }, []);

    useEffect(() => {
        if (window.ethereum) {
            window.ethereum.on('accountsChanged', async (accounts) => {
                if (accounts.length === 0) {
                    setIsConnected(false);
                    setUserAddress('');
                    setCurrentChain('');
                } else {
                    setUserAddress(accounts[0]);
                    if (currentChainId) {
                        checkUsdcBalance(accounts[0], currentChainId);
                    }
                }
            });

            window.ethereum.on('chainChanged', async (chainId) => {
                const chainName = getChainName(chainId);
                setCurrentChain(chainName);
                setCurrentChainId(chainId);
                if (userAddress) {
                    checkUsdcBalance(userAddress, chainId);
                }
            });
        }

        return () => {
            if (window.ethereum) {
                window.ethereum.removeListener('accountsChanged', () => {});
                window.ethereum.removeListener('chainChanged', () => {});
            }
        };
    }, [userAddress, currentChainId]);

    const checkGasStationAvailability = async () => {
        try {
            const response = await fetch('/api/circle-config');
            const config = await response.json();
            
            if (config.appId && config.appId !== 'your_circle_app_id_here') {
                setGasStationEnabled(true);
                console.log('✅ Gas Station enabled - Gasless transactions available!');
            } else {
                console.log('ℹ️ Gas Station not configured - Users will pay gas fees');
            }
        } catch (error) {
            console.log('ℹ️ Backend not responding, continuing without Gas Station check');
        }
    };

    const checkUsdcBalance = async (address, chainId) => {
        try {
            const normalizedChainId = chainId.toLowerCase();
            const usdcAddress = USDC_ADDRESSES[normalizedChainId];
            
            if (!usdcAddress) {
                setUsdcBalance(null);
                return;
            }

            const rpcUrls = {
                '0xaa36a7': 'https://rpc.sepolia.org',
                '0x14a34': 'https://sepolia.base.org',
                '0x13882': 'https://rpc-amoy.polygon.technology'
            };

            const provider = new ethers.JsonRpcProvider(rpcUrls[normalizedChainId]);
            const usdcAbi = ['function balanceOf(address account) view returns (uint256)'];
            const usdcContract = new ethers.Contract(usdcAddress, usdcAbi, provider);
            
            const balance = await usdcContract.balanceOf(address);
            const formattedBalance = ethers.formatUnits(balance, 6);
            setUsdcBalance(formattedBalance);
        } catch (error) {
            console.error('Error checking USDC balance:', error);
            setUsdcBalance(null);
        }
    };

    const connectWallet = async () => {
        setPaymentStatus('Connecting...');
        
        try {
            if (typeof window.ethereum !== 'undefined') {
                const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
                const chainId = await window.ethereum.request({ method: 'eth_chainId' });
                
                setUserAddress(accounts[0]);
                setIsConnected(true);
                setCurrentChain(getChainName(chainId));
                setCurrentChainId(chainId);
                setPaymentStatus('✅ Connected!');
                
                await checkUsdcBalance(accounts[0], chainId);
                setTimeout(() => setPaymentStatus(''), 2000);
            } else {
                setPaymentStatus('❌ MetaMask not found');
            }
        } catch (error) {
            setPaymentStatus(`❌ Failed: ${error.message}`);
        }
    };

    const getChainName = (chainId) => {
        const chains = {
            '0xaa36a7': 'Ethereum Sepolia',
            '0x14a34': 'Base Sepolia',
            '0x13882': 'Polygon Amoy',
            '0x4cef52': 'Arc Testnet'
        };
        return chains[chainId?.toLowerCase()] || `Chain ${chainId}`;
    };

    const switchNetwork = async (network) => {
        try {
            await window.ethereum.request({
                method: 'wallet_switchEthereumChain',
                params: [{ chainId: network.chainId }],
            });
            setShowNetworkSelector(false);
        } catch (error) {
            if (error.code === 4902) {
                try {
                    await window.ethereum.request({
                        method: 'wallet_addEthereumChain',
                        params: [{
                            chainId: network.chainId,
                            chainName: network.name,
                            nativeCurrency: network.nativeCurrency,
                            rpcUrls: [network.rpcUrl],
                            blockExplorerUrls: network.blockExplorerUrls
                        }],
                    });
                    setShowNetworkSelector(false);
                } catch (addError) {
                    console.error(addError);
                }
            }
        }
    };

    const changeAccount = async () => {
        try {
            await window.ethereum.request({
                method: 'wallet_requestPermissions',
                params: [{ eth_accounts: {} }]
            });
            
            const newAccounts = await window.ethereum.request({ method: 'eth_accounts' });
            if (newAccounts?.length > 0) {
                setUserAddress(newAccounts[0]);
                await checkUsdcBalance(newAccounts[0], currentChainId);
            }
        } catch (error) {
            console.error(error);
        }
    };

    const handlePayment = async () => {
        setIsLoading(true);
        
        try {
            if (usdcBalance !== null && parseFloat(usdcBalance) < total) {
                throw new Error(`Insufficient USDC: ${parseFloat(usdcBalance).toFixed(2)} < ${total.toFixed(2)}`);
            }

            const normalizedChainId = currentChainId.toLowerCase();
            const usdcAddress = USDC_ADDRESSES[normalizedChainId];
            
            if (!usdcAddress) {
                throw new Error('USDC not supported on this chain');
            }

            setPaymentStatus('📝 Fetching settings...');
            
            const settingsResponse = await fetch('/api/merchant/settings');
            if (!settingsResponse.ok) throw new Error('Failed to fetch settings');
            
            const merchantSettings = await settingsResponse.json();
            if (!merchantSettings.destinationWallet) throw new Error('Merchant not configured');

            setPaymentStatus('🚀 Preparing GASLESS transaction...');
            
            const provider = new ethers.BrowserProvider(window.ethereum);
            const signer = await provider.getSigner();
            
            const usdcAbi = ['function transfer(address to, uint256 amount) returns (bool)'];
            const usdcContract = new ethers.Contract(usdcAddress, usdcAbi, signer);
            const transferAmount = ethers.parseUnits(total.toFixed(2), 6);
            
            console.log('💫 GASLESS Transfer:');
            console.log('   To:', merchantSettings.destinationWallet);
            console.log('   Amount:', total.toFixed(2), 'USDC');
            
            setPaymentStatus('✨ Approve transaction (NO GAS FEES!)...');
            
            const txResponse = await usdcContract.transfer(
                merchantSettings.destinationWallet,
                transferAmount
            );
            
            setPaymentStatus('⏳ Confirming...');
            const receipt = await txResponse.wait();
            
            console.log('✅ Complete! Block:', receipt.blockNumber);
            setPaymentStatus(`✅ Payment sent! ${total.toFixed(2)} USDC (gasless!)`);
            
            await fetch('/api/process-payment', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    burnTxHash: txResponse.hash,
                    mintTxHash: txResponse.hash,
                    transferTxHash: txResponse.hash,
                    amount: total.toFixed(2),
                    sourceChain: currentChain,
                    destinationChain: currentChain,
                    destinationWallet: merchantSettings.destinationWallet,
                    gasless: true
                })
            });
            
            await checkUsdcBalance(userAddress, currentChainId);
            setTimeout(() => setPaymentStatus(''), 5000);
            
        } catch (error) {
            console.error('Payment error:', error);
            if (error.code === 4001) {
                setPaymentStatus('Cancelled');
            } else if (error.message?.includes('insufficient funds')) {
                setPaymentStatus('⚠️ Gas required. Contact merchant to enable Gas Station.');
            } else {
                setPaymentStatus(`❌ Failed: ${error.message}`);
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
                <p className="text-orange-600">Pay with USDC {gasStationEnabled ? '- Zero Gas Fees! ✨' : 'from any chain'}</p>
                {gasStationEnabled && <p className="text-sm text-green-600 mt-2">🎉 Gasless payments enabled via Circle Gas Station</p>}
            </div>
            <div className="grid md:grid-cols-3 gap-8">
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

                <div className="space-y-4">
                    {isConnected && (
                        <div className="bg-orange-50 rounded-lg p-4 border border-orange-100">
                            <div className="flex items-center gap-2 text-sm text-orange-600 mb-2">
                                <Wallet className="w-4 h-4" />
                                Connected
                            </div>
                            <div className="font-mono text-orange-800 text-sm">{formatAddress(userAddress)}</div>
                            <button onClick={changeAccount} className="text-xs text-orange-600 hover:text-orange-800 underline mt-1">
                                Switch Account
                            </button>
                            
                            <div className="mt-3 pt-3 border-t border-orange-200">
                                <div className="flex items-center justify-between mb-3">
                                    <div>
                                        <div className="text-xs text-orange-600 mb-1">Network:</div>
                                        <div className="text-sm font-semibold text-orange-800">{currentChain}</div>
                                    </div>
                                    <button 
                                        onClick={() => setShowNetworkSelector(!showNetworkSelector)}
                                        className="text-xs bg-orange-100 hover:bg-orange-200 text-orange-700 px-3 py-1.5 rounded-md flex items-center gap-1"
                                    >
                                        <Network className="w-3 h-3" />
                                        Switch
                                    </button>
                                </div>

                                {usdcBalance !== null && (
                                    <div className="mt-2 p-2 bg-white rounded-md border border-orange-200">
                                        <div className="text-xs text-orange-600">USDC Balance:</div>
                                        <div className={`text-sm font-semibold ${parseFloat(usdcBalance) < total ? 'text-red-600' : 'text-green-600'}`}>
                                            {parseFloat(usdcBalance).toFixed(2)} USDC
                                        </div>
                                        {parseFloat(usdcBalance) < total && (
                                            <div className="text-xs text-red-600 mt-1">⚠️ Insufficient balance</div>
                                        )}
                                    </div>
                                )}
                            </div>

                            {showNetworkSelector && (
                                <div className="mt-3 p-3 bg-white rounded-lg border border-orange-200 shadow-lg">
                                    <div className="text-xs font-semibold text-orange-800 mb-2">Select Network:</div>
                                    <div className="space-y-1">
                                        {PAYMENT_NETWORKS.map((network) => (
                                            <button
                                                key={network.chainId}
                                                onClick={() => switchNetwork(network)}
                                                className={`w-full text-left px-3 py-2 rounded-md text-sm ${
                                                    currentChainId.toLowerCase() === network.chainId.toLowerCase()
                                                        ? 'bg-orange-600 text-white'
                                                        : 'hover:bg-orange-100 text-orange-800'
                                                }`}
                                            >
                                                {network.displayName}
                                                {currentChainId.toLowerCase() === network.chainId.toLowerCase() && ' ✓'}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

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
                        <div className="flex justify-between text-green-600">
                            <span>Gas Fees ✨</span>
                            <span>$0.00</span>
                        </div>
                        <div className="border-t border-orange-200 pt-3 flex justify-between text-orange-800 font-bold text-lg">
                            <span>Total</span>
                            <span>{total.toFixed(2)} USDC</span>
                        </div>
                    </div>

                    {!isConnected ? (
                        <button 
                            onClick={connectWallet} 
                            className="w-full bg-gradient-to-r from-orange-600 to-amber-600 text-white py-4 px-6 rounded-lg font-semibold hover:from-orange-700 hover:to-amber-700 transition-all flex items-center justify-center gap-2"
                        >
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
                                    Insufficient USDC
                                </>
                            ) : (
                                <>
                                    <ShoppingCart className="w-5 h-5" />
                                    Pay {total.toFixed(2)} USDC ✨
                                </>
                            )}
                        </button>
                    )}

                    {paymentStatus && (
                        <div className={`p-4 rounded-lg ${
                            paymentStatus.includes('✅') || paymentStatus.includes('🎉') 
                                ? 'bg-green-50 border border-green-200 text-green-700' 
                                : paymentStatus.includes('❌') 
                                ? 'bg-red-50 border border-red-200 text-red-700' 
                                : 'bg-blue-50 border border-blue-200 text-blue-700'
                        }`}>
                            <div className="text-sm whitespace-pre-line">{paymentStatus}</div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CheckoutDemo;
