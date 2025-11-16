require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fs = require('fs').promises;
const path = require('path');
const { ethers } = require('ethers');
const { initiateDeveloperControlledWalletsClient } = require('@circle-fin/user-controlled-wallets');

const app = express();
app.use(express.json());
app.use(cors());

// Initialize Circle SDK client - will be set when API key is provided
let circleClient = null;

// Helper to check if Circle client is initialized
function ensureCircleClient() {
    if (!circleClient && process.env.CIRCLE_API_KEY) {
        const config = {
            apiKey: process.env.CIRCLE_API_KEY
        };

        // Entity Secret is optional - only needed for advanced wallet features
        if (process.env.CIRCLE_ENTITY_SECRET && process.env.CIRCLE_ENTITY_SECRET !== 'your_entity_secret_here') {
            config.entitySecret = process.env.CIRCLE_ENTITY_SECRET;
        }

        circleClient = initiateDeveloperControlledWalletsClient(config);
        console.log('✅ Circle SDK initialized');
    }
    return circleClient;
}

const SETTINGS_FILE = path.join(__dirname, 'merchantSettings.json');
const PAYMENTS_FILE = path.join(__dirname, 'payments.json');

// Helper function to read merchant settings
async function getMerchantSettings() {
    try {
        const data = await fs.readFile(SETTINGS_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Error reading merchant settings:', error.message);
        // Return default settings if file doesn't exist
        return {
            destinationWallet: process.env.MERCHANT_WALLET_ADDRESS || '',
            destinationChain: 'ARC_TESTNET'
        };
    }
}

// Helper function to save merchant settings
async function saveMerchantSettings(settings) {
    try {
        await fs.writeFile(SETTINGS_FILE, JSON.stringify(settings, null, 2), 'utf8');
        return true;
    } catch (error) {
        console.error('Error saving merchant settings:', error.message);
        return false;
    }
}

// GET endpoint to retrieve merchant settings
app.get('/api/merchant/settings', async (req, res) => {
    try {
        const settings = await getMerchantSettings();
        res.json(settings);
    } catch (error) {
        res.status(500).json({ error: 'Failed to retrieve settings' });
    }
});

// POST endpoint to save merchant settings
app.post('/api/merchant/settings', async (req, res) => {
    try {
        const { destinationWallet, destinationChain } = req.body;

        if (!destinationWallet || !destinationChain) {
            return res.status(400).json({ error: 'destinationWallet and destinationChain are required' });
        }

        // Validate wallet address format
        if (!ethers.isAddress(destinationWallet)) {
            return res.status(400).json({ error: 'Invalid wallet address format' });
        }

        // Validate destination chain
        const validChains = ['ARC_TESTNET', 'ETHEREUM_SEPOLIA', 'POLYGON_AMOY'];
        if (!validChains.includes(destinationChain)) {
            return res.status(400).json({ error: 'Invalid destination chain' });
        }

        const settings = { destinationWallet, destinationChain };
        const saved = await saveMerchantSettings(settings);

        if (saved) {
            console.log('✅ Merchant settings updated:', settings);
            res.json({ success: true, message: 'Settings saved successfully', settings });
        } else {
            res.status(500).json({ error: 'Failed to save settings' });
        }
    } catch (error) {
        console.error('Error in save settings endpoint:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.post('/api/process-payment', async (req, res) => {
    console.log("Backend: Payment notification received:", req.body);

    try {
        const { burnTxHash, mintTxHash, amount, sourceChain, destinationChain, bridgeKitResult } = req.body;

        if (!burnTxHash || !mintTxHash) {
            return res.status(400).json({ error: 'burnTxHash and mintTxHash are required.' });
        }

        // Get merchant settings
        const merchantSettings = await getMerchantSettings();

        // Save payment record for tracking
        const paymentRecord = {
            timestamp: new Date().toISOString(),
            burnTxHash,
            mintTxHash,
            amount,
            sourceChain,
            destinationChain,
            merchantWallet: merchantSettings.destinationWallet,
            status: 'completed',
            bridgeKitSteps: bridgeKitResult?.steps?.map(s => ({
                name: s.name,
                state: s.state,
                txHash: s.txHash
            }))
        };

        // Save to payments log
        try {
            let payments = [];
            try {
                const data = await fs.readFile(PAYMENTS_FILE, 'utf8');
                payments = JSON.parse(data);
            } catch (err) {
                // File doesn't exist yet, start with empty array
            }

            payments.push(paymentRecord);
            await fs.writeFile(PAYMENTS_FILE, JSON.stringify(payments, null, 2), 'utf8');

            console.log('✅ Payment recorded successfully');
            console.log(`   Burn Tx: ${burnTxHash}`);
            console.log(`   Mint Tx: ${mintTxHash}`);
            console.log(`   Amount: ${amount} USDC`);
            console.log(`   Route: ${sourceChain} → ${destinationChain}`);
        } catch (saveError) {
            console.error('Warning: Could not save payment record:', saveError.message);
            // Don't fail the request if logging fails
        }

        res.json({
            success: true,
            message: 'Payment processed successfully by Bridge Kit',
            record: paymentRecord
        });

    } catch (err) {
        console.error('Error processing payment notification:', err.message);
        res.status(500).json({ error: err.message });
    }
});

// Endpoint to initiate gasless transaction (sponsor gas fees)
app.post('/api/gasless-transfer', async (req, res) => {
    console.log("Backend: Gasless transfer request received");

    try {
        const {
            fromAddress,
            toAddress,
            amount,
            tokenAddress,
            chainId
        } = req.body;

        if (!fromAddress || !toAddress || !amount || !tokenAddress) {
            return res.status(400).json({
                error: 'Missing required fields: fromAddress, toAddress, amount, tokenAddress'
            });
        }

        // For now, we'll use a simplified approach with direct RPC calls
        // This will construct the transaction data that the frontend will sign
        // The key is that we use EIP-1559 transactions with maxFeePerGas = 0
        // when combined with a paymaster/Gas Station policy

        const chainConfig = {
            '0xaa36a7': { // Ethereum Sepolia
                rpcUrl: 'https://rpc.sepolia.org',
                chainId: 11155111
            },
            '0x14a34': { // Base Sepolia
                rpcUrl: 'https://sepolia.base.org',
                chainId: 84532
            },
            '0x13882': { // Polygon Amoy
                rpcUrl: 'https://rpc-amoy.polygon.technology',
                chainId: 80002
            },
            '0x4cef52': { // Arc Testnet
                rpcUrl: 'https://rpc.arc.gateway.fm',
                chainId: 5102930
            }
        };

        const config = chainConfig[chainId.toLowerCase()];
        if (!config) {
            return res.status(400).json({ error: 'Unsupported chain' });
        }

        const provider = new ethers.JsonRpcProvider(config.rpcUrl);

        // ERC20 transfer function signature
        const erc20Interface = new ethers.Interface([
            'function transfer(address to, uint256 amount) returns (bool)'
        ]);

        // Parse amount (assuming USDC with 6 decimals)
        const parsedAmount = ethers.parseUnits(amount.toString(), 6);

        // Encode the transfer function call
        const data = erc20Interface.encodeFunctionData('transfer', [
            toAddress,
            parsedAmount
        ]);

        // Get nonce for the from address
        const nonce = await provider.getTransactionCount(fromAddress, 'latest');

        // Prepare transaction for gasless execution
        // With Circle Gas Station, gas fees are sponsored
        const txRequest = {
            from: fromAddress,
            to: tokenAddress,
            data: data,
            nonce: nonce,
            chainId: config.chainId,
            // For gasless transactions, we set these to 0
            // Circle's Gas Station will sponsor the actual gas
            maxFeePerGas: 0,
            maxPriorityFeePerGas: 0,
            gasLimit: 100000 // Estimate for ERC20 transfer
        };

        console.log('✅ Transaction prepared for gasless execution');
        console.log(`   From: ${fromAddress}`);
        console.log(`   To: ${toAddress}`);
        console.log(`   Amount: ${amount} USDC`);
        console.log(`   Token: ${tokenAddress}`);
        console.log(`   Chain: ${chainId}`);

        res.json({
            success: true,
            transaction: txRequest,
            message: 'Transaction prepared for gasless execution'
        });

    } catch (err) {
        console.error('Error preparing gasless transaction:', err);
        res.status(500).json({ error: err.message });
    }
});

// Endpoint to get Circle App ID for frontend SDK initialization
app.get('/api/circle-config', (req, res) => {
    res.json({
        appId: process.env.CIRCLE_APP_ID || ''
    });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`ArcPay backend listening on port ${PORT}`);
});