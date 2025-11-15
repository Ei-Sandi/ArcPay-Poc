### ArcPay (Chain-Agnostic Shopify Plugin)
ArcPay is a high-performance payment gateway built for the modern web3 e-commerce stack. It functions as a Shopify plugin that enables merchants to accept USDC payments from customers on any supported blockchain, while receiving all funds as native USDC on the Arc network.
This solves the single biggest point of friction in crypto e-commerce: the "Wrong Network" error.

### The Problem
Current e-commerce plugins (like Shopify's official one) are chain-locked. A merchant on Base can only accept payments from customers who also have funds on Base. If a customer arrives with USDC on Polygon, Arbitrum, or Ethereum, the payment fails, and the sale is lost. This creates a terrible user experience and leads to massive cart abandonment.

### The Solution
ArcPay uses Circle's Bridge Kit (CCTP) as a "chain-agnostic settlement rail." Our system handles the entire cross-chain complexity "behind the scenes" with a single click from the user.

The user experience is seamless:
A customer on Polygon goes to pay for an item.
They click "Pay with USDC." Our app auto-detects their network.
The customer signs one transaction in their wallet.
Behind the scenes, our backend relayer:
Waits for the customer's USDC to be burned on Polygon.
Gets the attestation from Circle's CCTP API.
Uses the attestation to mint an equivalent amount of native USDC on the Arc network, directly into the merchant's wallet.


### Key Features & Value
For the Customer: A zero-friction, "one-click" payment. They never have to leave the checkout page, use a third-party bridge, or worry about what network they're on.
For the Merchant: A massive increase in conversion rates. They can now capture 100% of customers with USDC, regardless of their chain.
For the Ecosystem: It provides the critical payment infrastructure for the Arc network, making it a viable and easy-to-use hub for e-commerce and DApps.