import React, { useState } from 'react';
import MerchantDashboard from './MerchantDashboard';
import CheckoutDemo from './CheckoutDemo';
import { Store, ShoppingCart } from 'lucide-react';

const Main = () => {
    const [demoMode, setDemoMode] = useState('merchant');

    return (
        <div className="min-h-screen bg-white">
            {/* Demo Mode Toggle */}
            <div className="fixed top-4 right-4 z-50 flex gap-2">
                <button
                    onClick={() => setDemoMode('merchant')}
                    className={`px-4 py-2 rounded-lg font-medium text-sm transition-all flex items-center gap-2 ${demoMode === 'merchant'
                        ? 'bg-orange-600 text-white shadow-lg'
                        : 'bg-white text-orange-600 border-2 border-orange-200 hover:border-orange-400'
                        }`}
                >
                    <Store className="w-4 h-4" />
                    Merchant
                </button>
                <button
                    onClick={() => setDemoMode('checkout')}
                    className={`px-4 py-2 rounded-lg font-medium text-sm transition-all flex items-center gap-2 ${demoMode === 'checkout'
                        ? 'bg-orange-600 text-white shadow-lg'
                        : 'bg-white text-orange-600 border-2 border-orange-200 hover:border-orange-400'
                        }`}
                >
                    <ShoppingCart className="w-4 h-4" />
                    Checkout
                </button>
            </div>
            {demoMode === 'merchant' ? <MerchantDashboard /> : <CheckoutDemo />}
        </div>
    );
};

export default Main;
