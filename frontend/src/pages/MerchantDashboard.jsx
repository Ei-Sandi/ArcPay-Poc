import React, { useState, useEffect } from 'react';
import { Settings, Activity, BarChart3, Save, CheckCircle, Clock, XCircle, Store, Wallet, Users, TrendingUp, DollarSign, ArrowRight, Building2 } from 'lucide-react';

const MerchantDashboard = () => {
    const [activeTab, setActiveTab] = useState('overview');
    const [walletAddress, setWalletAddress] = useState('');
    const [saveStatus, setSaveStatus] = useState('');
    const [isLoading, setIsLoading] = useState(true);

    // Load merchant settings on component mount
    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        setIsLoading(true);
        try {
            const response = await fetch('/api/merchant/settings');
            if (response.ok) {
                const settings = await response.json();
                setWalletAddress(settings.destinationWallet || '');
            }
        } catch (error) {
            console.error('Failed to load settings:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const transactions = [
        { id: 1, date: '2024-11-15 14:32', amount: '50.00 USDC', sourceChain: 'Ethereum Sepolia', destinationChain: 'Arc Testnet', status: 'Complete' },
        { id: 2, date: '2024-11-15 13:18', amount: '125.50 USDC', sourceChain: 'Polygon Amoy', destinationChain: 'Arc Testnet', status: 'Complete' },
        { id: 3, date: '2024-11-15 12:05', amount: '75.00 USDC', sourceChain: 'Ethereum Sepolia', destinationChain: 'Arc Testnet', status: 'Pending' },
        { id: 4, date: '2024-11-15 10:42', amount: '200.00 USDC', sourceChain: 'Polygon Amoy', destinationChain: 'Arc Testnet', status: 'Complete' }
    ];
    const totalRevenue = '450.50';
    const salesByChain = [
        { chain: 'Ethereum Sepolia', amount: 155.00, percentage: 34 },
        { chain: 'Polygon Amoy', amount: 295.50, percentage: 66 }
    ];

    const handleSaveSettings = async () => {
        setSaveStatus('saving');
        try {
            const response = await fetch('/api/merchant/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    destinationWallet: walletAddress, 
                    destinationChain: 'ARC_TESTNET' // Always use Arc Testnet
                })
            });
            if (response.ok) {
                setSaveStatus('success');
                setTimeout(() => setSaveStatus(''), 3000);
            } else {
                setSaveStatus('error');
                setTimeout(() => setSaveStatus(''), 3000);
            }
        } catch (error) {
            setSaveStatus('error');
            setTimeout(() => setSaveStatus(''), 3000);
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'Complete': return 'text-green-600 bg-green-50';
            case 'Pending': return 'text-amber-600 bg-amber-50';
            case 'Failed': return 'text-red-600 bg-red-50';
            default: return 'text-gray-600 bg-gray-50';
        }
    };
    const getStatusIcon = (status) => {
        switch (status) {
            case 'Complete': return <CheckCircle className="w-4 h-4" />;
            case 'Pending': return <Clock className="w-4 h-4" />;
            case 'Failed': return <XCircle className="w-4 h-4" />;
            default: return null;
        }
    };

    return (
        <>
            <div className="border-b border-orange-100">
                <div className="max-w-7xl mx-auto px-6 py-6">
                    <h1 className="text-3xl font-bold text-orange-800">ArcPay</h1>
                    <p className="text-sm text-orange-600 mt-1">Merchant Dashboard</p>
                </div>
            </div>
            <div className="border-b border-orange-100">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="flex space-x-8">
                        <button onClick={() => setActiveTab('overview')} className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors ${activeTab === 'overview' ? 'border-orange-600 text-orange-800' : 'border-transparent text-orange-400 hover:text-orange-600'}`}>
                            <div className="flex items-center gap-2"><BarChart3 className="w-4 h-4" />Overview</div>
                        </button>
                        <button onClick={() => setActiveTab('transactions')} className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors ${activeTab === 'transactions' ? 'border-orange-600 text-orange-800' : 'border-transparent text-orange-400 hover:text-orange-600'}`}>
                            <div className="flex items-center gap-2"><Activity className="w-4 h-4" />Transactions</div>
                        </button>
                        <button onClick={() => setActiveTab('treasury')} className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors ${activeTab === 'treasury' ? 'border-orange-600 text-orange-800' : 'border-transparent text-orange-400 hover:text-orange-600'}`}>
                            <div className="flex items-center gap-2"><Wallet className="w-4 h-4" />Smart Treasury</div>
                        </button>
                        <button onClick={() => setActiveTab('settings')} className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors ${activeTab === 'settings' ? 'border-orange-600 text-orange-800' : 'border-transparent text-orange-400 hover:text-orange-600'}`}>
                            <div className="flex items-center gap-2"><Settings className="w-4 h-4" />Settings</div>
                        </button>
                    </div>
                </div>
            </div>
            <div className="max-w-7xl mx-auto px-6 py-8 pb-20">
                {activeTab === 'overview' && (
                    <div className="space-y-8">
                        <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-lg p-8 border border-orange-100">
                            <div className="text-orange-600 text-sm font-medium mb-2">Total Revenue</div>
                            <div className="text-5xl font-bold text-orange-800">${totalRevenue}</div>
                            <div className="text-orange-600 text-sm mt-2">USDC</div>
                        </div>
                        <div>
                            <h2 className="text-xl font-semibold text-orange-800 mb-4">Sales by Chain</h2>
                            <div className="space-y-4">
                                {salesByChain.map((item, index) => (
                                    <div key={index} className="bg-orange-50 rounded-lg p-6 border border-orange-100">
                                        <div className="flex justify-between items-center mb-3">
                                            <span className="font-medium text-orange-800">{item.chain}</span>
                                            <span className="text-orange-600">${item.amount.toFixed(2)} USDC</span>
                                        </div>
                                        <div className="w-full bg-orange-100 rounded-full h-3">
                                            <div className="bg-gradient-to-r from-orange-500 to-amber-500 h-3 rounded-full transition-all" style={{ width: `${item.percentage}%` }} />
                                        </div>
                                        <div className="text-right text-sm text-orange-600 mt-2">{item.percentage}%</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
                {activeTab === 'transactions' && (
                    <div>
                        <h2 className="text-xl font-semibold text-orange-800 mb-6">Payment History</h2>
                        <div className="space-y-3">
                            {transactions.map((tx) => (
                                <div key={tx.id} className="bg-orange-50 rounded-lg p-6 border border-orange-100 hover:border-orange-200 transition-colors">
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <div className="font-semibold text-orange-800 text-lg">{tx.amount}</div>
                                            <div className="text-sm text-orange-600 mt-1">{tx.date}</div>
                                        </div>
                                        <span className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${getStatusColor(tx.status)}`}>{getStatusIcon(tx.status)}{tx.status}</span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                        <div>
                                            <div className="text-orange-500 mb-1">Source Chain</div>
                                            <div className="text-orange-800 font-medium">{tx.sourceChain}</div>
                                        </div>
                                        <div>
                                            <div className="text-orange-500 mb-1">Destination Chain</div>
                                            <div className="text-orange-800 font-medium">{tx.destinationChain}</div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
                {activeTab === 'treasury' && (
                    <div className="space-y-8">
                        {/* Hero Section */}
                        <div className="bg-gradient-to-br from-orange-50 via-amber-50 to-orange-50 rounded-xl p-8 border border-orange-200">
                            <div className="flex items-start justify-between mb-6">
                                <div>
                                    <h2 className="text-2xl font-bold text-orange-800 mb-2">Smart Treasury Platform</h2>
                                    <p className="text-orange-600">Unified revenue management across all your stores</p>
                                </div>
                                <div className="bg-orange-100 rounded-lg px-4 py-2 border border-orange-300">
                                    <div className="text-xs text-orange-600 font-medium">COMING SOON</div>
                                </div>
                            </div>
                            <div className="grid grid-cols-3 gap-6 mt-6">
                                <div className="bg-white rounded-lg p-6 border border-orange-100">
                                    <div className="text-orange-600 text-sm font-medium mb-2">Treasury Balance</div>
                                    <div className="text-3xl font-bold text-orange-800">$1,248,350</div>
                                    <div className="text-orange-500 text-xs mt-1">USDC on Arc Network</div>
                                </div>
                                <div className="bg-white rounded-lg p-6 border border-orange-100">
                                    <div className="text-orange-600 text-sm font-medium mb-2">Connected Stores</div>
                                    <div className="text-3xl font-bold text-orange-800">8</div>
                                    <div className="text-orange-500 text-xs mt-1">Across 3 platforms</div>
                                </div>
                                <div className="bg-white rounded-lg p-6 border border-orange-100">
                                    <div className="text-orange-600 text-sm font-medium mb-2">Automation Rules</div>
                                    <div className="text-3xl font-bold text-orange-800">12</div>
                                    <div className="text-orange-500 text-xs mt-1">Active operations</div>
                                </div>
                            </div>
                        </div>

                        {/* Connected Stores */}
                        <div>
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-xl font-semibold text-orange-800">Connected E-commerce Stores</h3>
                                <button className="px-4 py-2 bg-orange-600 text-white rounded-lg text-sm font-medium hover:bg-orange-700 transition-colors flex items-center gap-2">
                                    <Store className="w-4 h-4" />
                                    Connect Store
                                </button>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                {[
                                    { name: 'Main Shopify Store', platform: 'Shopify', revenue: '425,680', status: 'Active' },
                                    { name: 'WooCommerce Site', platform: 'WooCommerce', revenue: '312,450', status: 'Active' },
                                    { name: 'Premium Store', platform: 'Shopify', revenue: '198,720', status: 'Active' },
                                    { name: 'Wholesale Portal', platform: 'Custom', revenue: '311,500', status: 'Active' }
                                ].map((store, idx) => (
                                    <div key={idx} className="bg-orange-50 rounded-lg p-6 border border-orange-100 hover:border-orange-200 transition-colors">
                                        <div className="flex items-start justify-between mb-4">
                                            <div className="flex items-center gap-3">
                                                <div className="bg-orange-200 rounded-lg p-2">
                                                    <Store className="w-5 h-5 text-orange-700" />
                                                </div>
                                                <div>
                                                    <div className="font-semibold text-orange-800">{store.name}</div>
                                                    <div className="text-sm text-orange-600">{store.platform}</div>
                                                </div>
                                            </div>
                                            <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full font-medium">{store.status}</span>
                                        </div>
                                        <div className="pt-4 border-t border-orange-200">
                                            <div className="text-orange-600 text-xs mb-1">Total Revenue</div>
                                            <div className="text-orange-800 font-bold text-lg">${store.revenue} USDC</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Smart Treasury Contract */}
                        <div>
                            <h3 className="text-xl font-semibold text-orange-800 mb-4">Smart Treasury Contract</h3>
                            <div className="bg-gradient-to-r from-orange-100 to-amber-100 rounded-lg p-6 border border-orange-200">
                                <div className="flex items-center justify-between mb-6">
                                    <div className="flex items-center gap-3">
                                        <div className="bg-orange-600 rounded-lg p-3">
                                            <Building2 className="w-6 h-6 text-white" />
                                        </div>
                                        <div>
                                            <div className="font-semibold text-orange-800">Treasury Contract</div>
                                            <div className="text-sm text-orange-600 font-mono">0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb</div>
                                        </div>
                                    </div>
                                    <button className="px-4 py-2 bg-white text-orange-700 rounded-lg text-sm font-medium hover:bg-orange-50 transition-colors border border-orange-300">
                                        View on Explorer
                                    </button>
                                </div>
                                <div className="text-sm text-orange-700 bg-white/50 rounded-lg p-4">
                                    <strong>How it works:</strong> All revenue from your connected stores flows through our Pay-In engine and is automatically consolidated into this single Smart Treasury Contract on the Arc network. From here, you can automate treasury operations.
                                </div>
                            </div>
                        </div>

                        {/* Automated Operations */}
                        <div>
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-xl font-semibold text-orange-800">Automated Treasury Operations</h3>
                                <button className="px-4 py-2 bg-orange-600 text-white rounded-lg text-sm font-medium hover:bg-orange-700 transition-colors">
                                    Create Rule
                                </button>
                            </div>
                            <div className="space-y-4">
                                {[
                                    { 
                                        type: 'Payroll', 
                                        description: 'Monthly team payments', 
                                        amount: '85,000',
                                        schedule: 'Every 1st of month',
                                        recipients: 24,
                                        icon: Users,
                                        color: 'blue'
                                    },
                                    { 
                                        type: 'Revenue Split', 
                                        description: 'Partner profit sharing', 
                                        amount: '125,000',
                                        schedule: 'Weekly (Mondays)',
                                        recipients: 3,
                                        icon: TrendingUp,
                                        color: 'green'
                                    },
                                    { 
                                        type: 'Supplier Payments', 
                                        description: 'Automatic vendor settlements', 
                                        amount: '45,000',
                                        schedule: 'Bi-weekly',
                                        recipients: 12,
                                        icon: DollarSign,
                                        color: 'purple'
                                    }
                                ].map((operation, idx) => (
                                    <div key={idx} className="bg-orange-50 rounded-lg p-6 border border-orange-100">
                                        <div className="flex items-start justify-between">
                                            <div className="flex items-start gap-4 flex-1">
                                                <div className={`bg-${operation.color}-100 rounded-lg p-3`}>
                                                    <operation.icon className={`w-5 h-5 text-${operation.color}-700`} />
                                                </div>
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-3 mb-2">
                                                        <h4 className="font-semibold text-orange-800">{operation.type}</h4>
                                                        <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full font-medium">Active</span>
                                                    </div>
                                                    <p className="text-sm text-orange-600 mb-3">{operation.description}</p>
                                                    <div className="grid grid-cols-3 gap-4 text-sm">
                                                        <div>
                                                            <div className="text-orange-500 text-xs mb-1">Amount</div>
                                                            <div className="text-orange-800 font-medium">${operation.amount} USDC</div>
                                                        </div>
                                                        <div>
                                                            <div className="text-orange-500 text-xs mb-1">Schedule</div>
                                                            <div className="text-orange-800 font-medium">{operation.schedule}</div>
                                                        </div>
                                                        <div>
                                                            <div className="text-orange-500 text-xs mb-1">Recipients</div>
                                                            <div className="text-orange-800 font-medium">{operation.recipients} wallets</div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            <button className="px-3 py-2 text-orange-600 hover:text-orange-700 text-sm font-medium">
                                                Edit
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Revenue Flow Diagram */}
                        <div>
                            <h3 className="text-xl font-semibold text-orange-800 mb-4">Revenue Flow</h3>
                            <div className="bg-orange-50 rounded-lg p-8 border border-orange-100">
                                <div className="flex items-center justify-between">
                                    <div className="flex-1 text-center">
                                        <div className="bg-white rounded-lg p-6 border border-orange-200 inline-block">
                                            <Store className="w-8 h-8 text-orange-600 mx-auto mb-2" />
                                            <div className="font-semibold text-orange-800">Multiple Stores</div>
                                            <div className="text-xs text-orange-600 mt-1">Various chains</div>
                                        </div>
                                    </div>
                                    <div className="px-6">
                                        <ArrowRight className="w-8 h-8 text-orange-400" />
                                    </div>
                                    <div className="flex-1 text-center">
                                        <div className="bg-gradient-to-br from-orange-600 to-amber-600 rounded-lg p-6 border border-orange-700 inline-block text-white">
                                            <Activity className="w-8 h-8 mx-auto mb-2" />
                                            <div className="font-semibold">Pay-In Engine</div>
                                            <div className="text-xs mt-1 text-orange-100">Cross-chain relay</div>
                                        </div>
                                    </div>
                                    <div className="px-6">
                                        <ArrowRight className="w-8 h-8 text-orange-400" />
                                    </div>
                                    <div className="flex-1 text-center">
                                        <div className="bg-white rounded-lg p-6 border border-orange-200 inline-block">
                                            <Building2 className="w-8 h-8 text-orange-600 mx-auto mb-2" />
                                            <div className="font-semibold text-orange-800">Smart Treasury</div>
                                            <div className="text-xs text-orange-600 mt-1">Arc Network</div>
                                        </div>
                                    </div>
                                    <div className="px-6">
                                        <ArrowRight className="w-8 h-8 text-orange-400" />
                                    </div>
                                    <div className="flex-1 text-center">
                                        <div className="bg-white rounded-lg p-6 border border-orange-200 inline-block">
                                            <Wallet className="w-8 h-8 text-orange-600 mx-auto mb-2" />
                                            <div className="font-semibold text-orange-800">Automated Ops</div>
                                            <div className="text-xs text-orange-600 mt-1">Payroll, splits, etc.</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
                {activeTab === 'settings' && (
                    <div className="max-w-2xl">
                        <h2 className="text-xl font-semibold text-orange-800 mb-6">Payment Configuration</h2>
                        {isLoading ? (
                            <div className="bg-orange-50 rounded-lg p-8 border border-orange-100 flex items-center justify-center">
                                <div className="text-orange-600">Loading settings...</div>
                            </div>
                        ) : (
                            <div className="bg-orange-50 rounded-lg p-8 border border-orange-100 space-y-6">
                                <div>
                                    <label className="block text-sm font-medium text-orange-800 mb-2">Enter your wallet address on Arc Testnet</label>
                                    <input type="text" value={walletAddress} onChange={(e) => setWalletAddress(e.target.value)} placeholder="0x..." className="w-full px-4 py-3 bg-white border border-orange-200 rounded-lg text-orange-800 placeholder-orange-300 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent" />
                                    <p className="text-xs text-orange-600 mt-2">Note: Add Arc wallet address only</p>
                                </div>
                                <div className="pt-4">
                                    <button onClick={handleSaveSettings} disabled={saveStatus === 'saving'} className="w-full bg-gradient-to-r from-orange-600 to-amber-600 text-white py-3 px-6 rounded-lg font-medium hover:from-orange-700 hover:to-amber-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
                                        <Save className="w-5 h-5" />
                                        {saveStatus === 'saving' ? 'Saving...' : 'Save Settings'}
                                    </button>
                                    {saveStatus === 'success' && (
                                        <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm flex items-center gap-2">
                                            <CheckCircle className="w-4 h-4" />
                                            Settings saved successfully!
                                        </div>
                                    )}
                                    {saveStatus === 'error' && (
                                        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-center gap-2">
                                            <XCircle className="w-4 h-4" />
                                            Failed to save settings. Please try again.
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </>
    );
};

export default MerchantDashboard;
