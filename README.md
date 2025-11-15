# ArcPay - Cross-Chain USDC Payment Widget 🌉### ArcPay (Chain-Agnostic Shopify Plugin)

ArcPay is a high-performance payment gateway built for the modern web3 e-commerce stack. It functions as a Shopify plugin that enables merchants to accept USDC payments from customers on any supported blockchain, while receiving all funds as native USDC on the Arc network.

> **Embeddable payment widget powered by Circle's Bridge Kit + Arc Network**This solves the single biggest point of friction in crypto e-commerce: the "Wrong Network" error.



ArcPay enables merchants to accept USDC payments from **any supported blockchain** and receive funds on **their preferred chain** (including Arc Network). Built with Circle's Bridge Kit SDK for seamless cross-chain transfers.### The ProblemCircle's Bridge Kit

Current e-commerce plugins (like Shopify's official one) are chain-locked. A merchant on Base can only accept payments from customers who also have funds on Base. If a customer arrives with USDC on Polygon, Arbitrum, or Ethereum, the payment fails, and the sale is lost. This creates a terrible user experience and leads to massive cart abandonment.

## 🎯 What is ArcPay?

### The Solution

ArcPay is an **embeddable checkout widget** that merchants can add to any website (Shopify, WooCommerce, custom sites) to accept USDC from multiple blockchains. Customers can pay from Ethereum, Polygon, Arc, or other supported chains, and merchants receive USDC on their chosen destination chain.ArcPay uses Circle's Bridge Kit (CCTP) as a "chain-agnostic settlement rail." Our system handles the entire cross-chain complexity "behind the scenes" with a single click from the user.

### The ProblemThe user experience is seamless:

A customer on Polygon goes to pay for an item.

Current e-commerce plugins are chain-locked. A merchant on Base can only accept payments from customers who also have funds on Base. If a customer arrives with USDC on Polygon, Arbitrum, or Ethereum, the payment fails, and the sale is lost. This creates terrible UX and massive cart abandonment.They click "Pay with USDC." Our app auto-detects their network.

The customer signs one transaction in their wallet.

### The SolutionBehind the scenes, our backend relayer:

Waits for the customer's USDC to be burned on Polygon.

ArcPay uses Circle's **Bridge Kit (CCTP)** as a chain-agnostic settlement rail. The entire cross-chain complexity happens behind the scenes with a single click from the user.Gets the attestation from Circle's CCTP API.

Uses the attestation to mint an equivalent amount of native USDC on the Arc network, directly into the merchant's wallet.

**User Experience:**

1. Customer clicks "Pay with USDC" 

2. App auto-detects their network### Key Features & Value

3. Customer signs one transactionFor the Customer: A zero-friction, "one-click" payment. They never have to leave the checkout page, use a third-party bridge, or worry about what network they're on.

4. Bridge Kit handles the rest:For the Merchant: A massive increase in conversion rates. They can now capture 100% of customers with USDC, regardless of their chain.

   - Burns USDC on source chainFor the Ecosystem: It provides the critical payment infrastructure for the Arc network, making it a viable and easy-to-use hub for e-commerce and DApps.
   - Gets attestation from Circle
   - Mints USDC on destination chain
   - Merchant receives payment

### Key Features

- 🌉 **Cross-Chain Payments** - Accept USDC from 5+ blockchains
- 🔗 **Arc Network Support** - Fully integrated with Arc Testnet & Mainnet  
- 🛠️ **Powered by Bridge Kit** - Uses Circle's official CCTP SDK
- 🎨 **Embeddable Widget** - Works on any website with a simple script tag
- ⚡ **Automatic Routing** - Bridge Kit handles burn, attestation, and mint
- 💼 **Merchant Dashboard** - Configure destination wallet and chain
- 📊 **Payment Tracking** - View all completed cross-chain payments

## 🚀 Quick Start for Merchants

### 1. Configure Your Settings

Visit the merchant dashboard at `http://localhost:3000/dashboard` and set:
- **Destination Wallet** - Where you want to receive USDC
- **Destination Chain** - Which blockchain (Arc, Ethereum, Polygon, etc.)

### 2. Embed the Widget

Add this code to your website:

```html
<!-- Load ArcPay Widget -->
<script src="https://your-arcpay-domain.com/widget.js"></script>

<!-- ArcPay Checkout Button -->
<div id="arcpay-checkout" 
     data-amount="100.00"
     data-merchant-id="your_merchant_id"
     data-callback-url="https://yoursite.com/webhook/payment-complete">
</div>
```

### 3. Handle Payment Notifications

When a payment completes (15-20 minutes), ArcPay sends a webhook:

```json
{
  "paymentId": "abc123",
  "amount": "100.00",
  "burnTxHash": "0x...",
  "mintTxHash": "0x...",
  "sourceChain": "Ethereum_Sepolia",
  "destinationChain": "Arc_Testnet",
  "status": "completed",
  "timestamp": "2025-11-15T14:30:00Z"
}
```

## 🏗️ Architecture

### Frontend Widget (React + Bridge Kit)
- Customer-facing payment interface
- MetaMask wallet connection
- Network selection (Ethereum, Polygon, Arc, etc.)
- Real-time USDC balance checking
- Bridge Kit integration for cross-chain transfers

### Backend API (Node.js + Express)
- Merchant settings management
- Payment tracking and history
- Webhook notifications to merchants
- Transaction monitoring

### Bridge Kit Flow
```
Customer Wallet (Source Chain)
    ↓
Bridge Kit: Burn USDC
    ↓
Circle CCTP: Attestation (15-20 min)
    ↓
Bridge Kit: Mint USDC
    ↓
Merchant Wallet (Destination Chain)
```

## 🌐 Supported Networks

### Testnet
- ✅ Ethereum Sepolia (`0xaa36a7`)
- ✅ Polygon Amoy (`0x13882`)
- ✅ **Arc Testnet** (`0x4cef52`) - Featured

### Mainnet  
- ✅ Ethereum Mainnet (`0x1`)
- ✅ Polygon Mainnet (`0x89`)
- ✅ More coming soon...

## 💻 Development Setup

### Prerequisites
- Node.js v18+
- npm or yarn
- MetaMask browser extension
- Testnet USDC from [Circle Faucet](https://faucet.circle.com/)

### Installation

```bash
# Clone the repository
git clone https://github.com/Ei-Sandi/ArcPay-Poc.git
cd ArcPay-Poc

# Install frontend dependencies
cd frontend
npm install

# Install backend dependencies
cd ../backend
npm install
```

### Configuration

Create `.env` file in `backend/` directory:

```env
PORT=5000
MERCHANT_WALLET_ADDRESS=0x...  # Your test wallet
```

### Run Locally

```bash
# Terminal 1 - Start backend
cd backend
npm run dev

# Terminal 2 - Start frontend
cd frontend
npm run dev
```

Open `http://localhost:3000` to see the demo checkout page.

## 🎨 Integration Examples

### Shopify (via iframe/custom app)

```liquid
<!-- In your Shopify theme -->
<div id="arcpay-checkout" 
     data-amount="{{ cart.total_price | money_without_currency }}"
     data-order-id="{{ order.id }}"
     data-merchant-id="your_merchant_id">
</div>
<script src="https://your-arcpay.com/widget.js"></script>
```

### WooCommerce (via plugin)

```php
// Add to checkout page
add_action('woocommerce_after_checkout_form', 'add_arcpay_widget');

function add_arcpay_widget() {
    $total = WC()->cart->get_total('');
    echo '<div id="arcpay-checkout" data-amount="' . $total . '"></div>';
    echo '<script src="https://your-arcpay.com/widget.js"></script>';
}
```

### Custom Website

```html
<button onclick="openArcPayCheckout()">Pay with USDC</button>

<script src="https://your-arcpay.com/widget.js"></script>
<script>
function openArcPayCheckout() {
    ArcPay.open({
        amount: '50.00',
        merchantId: 'your_merchant_id',
        onSuccess: (payment) => {
            console.log('Payment completed:', payment);
            // Update your order status
        }
    });
}
</script>
```

## 📦 Bridge Kit Integration

ArcPay uses Circle's Bridge Kit SDK for all cross-chain operations:

```javascript
import { BridgeKit } from '@circle-fin/bridge-kit';
import { createWalletAdapter } from '@circle-fin/adapter-viem-v2';

// Initialize Bridge Kit
const bridgeKit = new BridgeKit();

// Create wallet adapter from MetaMask
const walletAdapter = await createWalletAdapter({
    provider: window.ethereum
});

// Bridge USDC across chains
const result = await bridgeKit.bridge({
    from: { 
        adapter: walletAdapter, 
        chain: 'Ethereum_Sepolia' 
    },
    to: { 
        adapter: walletAdapter,
        chain: 'Arc_Testnet' 
    },
    amount: '10.00'
});

// Bridge Kit automatically handles:
// ✅ USDC approval
// ✅ Burn transaction
// ✅ Attestation polling
// ✅ Mint transaction on destination
```

## 🔧 API Endpoints

### Merchant Settings
```
GET  /api/merchant/settings          # Get merchant configuration
POST /api/merchant/settings          # Update destination wallet/chain
```

### Payment Tracking
```
GET  /api/payments                   # List all completed payments
POST /api/process-payment           # Record completed Bridge Kit transfer
```

## 🎯 Arc Network Integration

Arc Network is fully integrated and featured:

**Testnet Configuration:**
- Network: Arc Testnet
- Chain ID: `0x4cef52` (5,042,002)
- RPC: `https://rpc.blockdaemon.testnet.arc.network`
- Explorer: `https://testnet.arcscan.io/`
- USDC Contract: `0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d`

**Usage:**
1. Merchant configures Arc as destination chain
2. Customer pays from any source chain
3. Bridge Kit routes USDC to Arc via CCTP
4. Merchant receives USDC on Arc Network

## 📋 Bounty Requirements Checklist

See [BOUNTY_REQUIREMENTS.md](./BOUNTY_REQUIREMENTS.md) for detailed compliance documentation.

- ✅ **Bridge Kit Integration** - Core SDK with `.bridge()` method
- ✅ **Arc Network Support** - Full Arc Testnet integration
- ✅ **Multi-Chain Transfers** - 5+ supported networks
- ✅ **User Experience** - Clean UI, real-time updates, error handling
- ✅ **Merchant Tools** - Dashboard, webhooks, payment tracking

## 🛣️ Roadmap

- [ ] Widget SDK for easier merchant integration
- [ ] Support for more blockchains (Arbitrum, Optimism, Base)
- [ ] Mainnet deployment
- [ ] Shopify App Store listing
- [ ] WooCommerce plugin
- [ ] Payment analytics dashboard
- [ ] Multi-currency support (EURC, etc.)

## 📚 Resources

- [Circle Bridge Kit Docs](https://developers.circle.com/bridge-kit)
- [Arc Network Docs](https://docs.arc.network/)
- [Circle CCTP Overview](https://developers.circle.com/cctp)
- [Getting Testnet USDC](https://faucet.circle.com/)

## 🤝 Contributing

Contributions welcome! Please open an issue or PR.

## 📄 License

MIT License - see [LICENSE](./LICENSE) for details

---

**Built for Arc Network Bounty**  
**Powered by Circle Bridge Kit & CCTP**
