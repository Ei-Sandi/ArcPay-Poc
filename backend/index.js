require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fs = require('fs').promises;
const path = require('path');
const { ethers } = require('ethers');

const app = express();
app.use(express.json());
app.use(cors());

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
}); const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`ArcPay backend listening on port ${PORT}`);
});