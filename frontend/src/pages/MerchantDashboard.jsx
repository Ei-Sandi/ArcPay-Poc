import React, { useState } from 'react';
import { Settings, Activity, BarChart3, Save, CheckCircle, Clock, XCircle, Store } from 'lucide-react';

const MerchantDashboard = () => {
    const [activeTab, setActiveTab] = useState('overview');
    const [walletAddress, setWalletAddress] = useState('');
    const [destinationChain, setDestinationChain] = useState('ARC_TESTNET');
    const [saveStatus, setSaveStatus] = useState('');

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
                body: JSON.stringify({ destinationWallet: walletAddress, destinationChain })
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
                {activeTab === 'settings' && (
                    <div className="max-w-2xl">
                        <h2 className="text-xl font-semibold text-orange-800 mb-6">Payment Configuration</h2>
                        <div className="bg-orange-50 rounded-lg p-8 border border-orange-100 space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-orange-800 mb-2">Destination Wallet Address</label>
                                <input type="text" value={walletAddress} onChange={(e) => setWalletAddress(e.target.value)} placeholder="0x..." className="w-full px-4 py-3 bg-white border border-orange-200 rounded-lg text-orange-800 placeholder-orange-300 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent" />
                                <p className="text-xs text-orange-600 mt-2">This is where all your payments will be sent after cross-chain transfer</p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-orange-800 mb-2">Destination Chain</label>
                                <select value={destinationChain} onChange={(e) => setDestinationChain(e.target.value)} className="w-full px-4 py-3 bg-white border border-orange-200 rounded-lg text-orange-800 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent">
                                    <option value="ARC_TESTNET">Arc Testnet</option>
                                    <option value="ETHEREUM_SEPOLIA">Ethereum Sepolia</option>
                                    <option value="POLYGON_AMOY">Polygon Amoy</option>
                                </select>
                                <p className="text-xs text-orange-600 mt-2">Select which blockchain you want to receive payments on</p>
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
                    </div>
                )}
            </div>
        </>
    );
};

export default MerchantDashboard;
