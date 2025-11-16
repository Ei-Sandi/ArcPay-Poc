# ArcPay - Cross-Chain USDC Payment Widget 🌉

> **Embeddable payment widget powered by Circle's Bridge Kit + Arc Network**

Accept USDC payments from **any blockchain** and receive funds on **your preferred chain** (including Arc Network). Built with Circle's Bridge Kit SDK for seamless cross-chain transfers.

## 🎯 The Problem & Solution

**Problem:** Current e-commerce plugins are chain-locked. Merchants on Base can only accept payments from customers with funds on Base, leading to failed payments and cart abandonment.

**Solution:** ArcPay uses Circle's Bridge Kit (CCTP) as a chain-agnostic settlement rail. Customers pay from any chain with one click, and merchants receive USDC on their chosen destination chain.

## ⚡ Key Features

- 🌉 Cross-Chain Payments - Accept USDC from 5+ blockchains
- ✨ **Gasless Transactions** - Zero gas fees for users via Circle Gas Station
- 🔗 Arc Network Support - Fully integrated with Arc Testnet
- 🛠️ Powered by Bridge Kit - Uses Circle's official CCTP SDK
- 💼 Merchant Dashboard - Configure destination wallet and chain
- 📊 Payment Tracking - View all completed cross-chain payments

## 💫 Gasless Transactions

ArcPay integrates with **Circle Gas Station** to sponsor gas fees, providing a seamless payment experience:

- ✅ **One-click checkout** - Users approve only 1 transaction
- ✅ **Zero gas fees** - No need for ETH/MATIC/ARC tokens
- ✅ **Higher conversions** - Remove friction from checkout flow
- ✅ **Automatic sponsorship** - Merchant sponsors gas via Circle

**How it works:** Circle's Gas Station automatically sponsors blockchain gas fees for USDC transfers. Users only need USDC in their wallet - no native tokens required. This eliminates the #1 barrier to crypto payments and significantly improves conversion rates.

📖 [Setup Guide](./CONFIGURE_GAS_STATION.md) | 🔧 [Technical Details](./GASLESS_SETUP.md)

## 🚀 Quick Start

```bash
# Clone and install
git clone https://github.com/Ei-Sandi/ArcPay-Poc.git
cd ArcPay-Poc
npm install
cd frontend && npm install
cd ../backend && npm install && cd ..

# Configure backend (optional)
cd backend
cp .env.example .env

# Start both servers
cd ..
npm run dev

# Open browser
# Frontend: http://localhost:5173
# Dashboard: http://localhost:5173/dashboard
# Checkout: http://localhost:5173/checkout
```

## 📁 Project Structure

```
ArcPay-Poc/
├── backend/
│   ├── index.js               # Express API server
│   ├── merchantSettings.json  # Merchant config storage
│   ├── payments.json          # Payment transaction logs
│   └── package.json
├── frontend/
│   ├── src/
│   │   └── pages/
│   │       ├── CheckoutDemo.jsx      # Payment widget
│   │       ├── Main.jsx              # Landing page
│   │       └── MerchantDashboard.jsx # Settings UI
│   ├── index.html
│   └── package.json
└── package.json               # Root with parallel scripts
```

## 💻 Development Setup

### Prerequisites

- Node.js v18+
- npm v8+
- MetaMask browser extension
- Testnet USDC from [Circle Faucet](https://faucet.circle.com/)

### Installation

```bash
# Install all dependencies
cd frontend && npm install
cd ../backend && npm install
cd ..
```

### Environment Configuration

Create `backend/.env`:

```env
PORT=5000
MERCHANT_WALLET_ADDRESS=0xYourWalletAddressHere  # Optional

# Circle Gas Station (for gasless transactions)
CIRCLE_API_KEY=your_api_key_here
CIRCLE_APP_ID=your_app_id_here
CIRCLE_ENTITY_SECRET=optional_not_required
```

> 📖 **New to Gas Station?** See [CONFIGURE_GAS_STATION.md](./CONFIGURE_GAS_STATION.md) for setup instructions.

### Start Application

**Option 1 - Both servers together (recommended):**
```bash
npm run dev
```

**Option 2 - Separate terminals:**
```bash
# Terminal 1
cd backend && npm run dev

# Terminal 2
cd frontend && npm run dev
```

**Access points:**
- Frontend: `http://localhost:5173`
- Backend: `http://localhost:5000`

## 🧪 Testing Payment Flow

1. Visit `http://localhost:5173/dashboard`
2. Configure destination wallet and chain
3. Visit `http://localhost:5173/checkout`
4. Connect MetaMask and pay with testnet USDC
5. Bridge Kit handles cross-chain transfer (15-20 min)

## 🏗️ Technology Stack

**Frontend:** React 18.3, Vite 7.2, Bridge Kit SDK 1.1.1, Viem 2.21, Ethers.js 6.15

**Backend:** Node.js, Express 5.1, CORS, dotenv

## 🔧 API Endpoints

### Merchant Settings
```bash
GET  /api/merchant/settings     # Get current configuration
POST /api/merchant/settings     # Update wallet and chain
```

### Payment Processing
```bash
POST /api/process-payment       # Record completed Bridge Kit transfer
```

**Example:**
```bash
curl -X POST http://localhost:5000/api/merchant/settings \
  -H "Content-Type: application/json" \
  -d '{"destinationWallet": "0x...", "destinationChain": "ARC_TESTNET"}'
```

## 🌐 Supported Networks

### Testnet
- ✅ Ethereum Sepolia (`0xaa36a7`)
- ✅ Polygon Amoy (`0x13882`)
- ✅ **Arc Testnet** (`0x4cef52`)

### Mainnet
- ✅ Ethereum, Polygon, more coming soon

## �� Bridge Kit Integration

```javascript
import { BridgeKit } from '@circle-fin/bridge-kit';
import { createWalletAdapter } from '@circle-fin/adapter-viem-v2';

const bridgeKit = new BridgeKit();
const walletAdapter = await createWalletAdapter({ provider: window.ethereum });

const result = await bridgeKit.bridge({
    from: { adapter: walletAdapter, chain: 'Ethereum_Sepolia' },
    to: { adapter: walletAdapter, chain: 'Arc_Testnet' },
    amount: '10.00'
});
// Bridge Kit automatically handles approval, burn, attestation, and mint
```

## 🎯 Arc Network Integration

**Arc Testnet Configuration:**
- Chain ID: `0x4cef52` (5,042,002)
- RPC: `https://rpc.blockdaemon.testnet.arc.network`
- Explorer: `https://testnet.arcscan.io/`
- USDC: `0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d`

## 🛠️ Troubleshooting

**Port in use:**
```bash
lsof -ti:5000 | xargs kill -9  # Backend
lsof -ti:5173 | xargs kill -9  # Frontend
```

**MetaMask issues:** Ensure unlocked, correct network, and refresh page

**Module errors:**
```bash
rm -rf node_modules package-lock.json && npm install
```

## 📊 Data Storage

Development uses JSON files:
- `merchantSettings.json` - Merchant configuration
- `payments.json` - Transaction logs

> **Production:** Replace with proper database (PostgreSQL, MongoDB)

## 🛣️ Roadmap

- [ ] Widget SDK for easier integration
- [ ] Mainnet deployment
- [ ] Shopify & WooCommerce plugins
- [ ] Analytics dashboard

## 📚 Resources

- [Circle Bridge Kit Docs](https://developers.circle.com/bridge-kit)
- [Arc Network Docs](https://docs.arc.network/)
- [Getting Testnet USDC](https://faucet.circle.com/)

## 📄 License

MIT License - see [LICENSE](./LICENSE)

---

**Powered by Circle Bridge Kit & CCTP**
