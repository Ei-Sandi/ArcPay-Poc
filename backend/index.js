require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { BridgeKit } = require('@circle-fin/bridge-kit');
const { ethers } = require('ethers');

const app = express();
app.use(express.json());
app.use(cors());

const RPC_ENDPOINTS = {
    'ARC_TESTNET': 'https://rpc.testnet.arc.network',
    'ETHEREUM_SEPOLIA': 'https://rpc.sepolia.org',
    'POLYGON_AMOY': 'https://rpc-amoy.polygon.technology/'
};

const bridgeKit = new BridgeKit({
    apiKey: process.env.CIRCLE_TEST_API_KEY,
    network: 'testnet',
});

app.post('/api/process-payment', async (req, res) => {
    console.log("Backend: Received request:", req.body);

    // 1. Get ALL data from the frontend
    const { burnTxHash, destinationWallet, destinationChain } = req.body;
    if (!burnTxHash || !destinationWallet || !destinationChain) {
        return res.status(400).json({ error: 'burnTxHash, destinationWallet, and destinationChain are required.' });
    }

    // 2. Look up the correct RPC URL from your map
    const rpcUrl = RPC_ENDPOINTS[destinationChain];
    if (!rpcUrl) {
        console.error(`Error: No RPC endpoint configured for chain: ${destinationChain}`);
        return res.status(500).json({ error: 'Server configuration error: Unsupported chain.' });
    }
    console.log(`Backend: Routing payment to chain: ${destinationChain} at ${rpcUrl}`);


    let attestation;
    try {
        console.log(`Backend: Now polling Circle for the attestation...`);
        const maxAttempts = 60;
        const pollInterval = 30000;
        let attempts = 0;
        let isComplete = false; // Flag to track success

        while (attempts < maxAttempts) {
            try {
                attestation = await bridgeKit.getAttestation(burnTxHash);

                if (attestation && attestation.status) {
                    console.log(`Backend: Poll attempt ${attempts + 1}/${maxAttempts}. Status: ${attestation.status}`);
                }

                if (attestation && attestation.status === 'complete') {
                    console.log("Backend: We got the attestation! It's ready to mint.");
                    isComplete = true; // Set flag to true
                    break; // Exit the loop
                }

            } catch (pollError) {
                console.log(`Backend: Attestation not ready yet (Attempt ${attempts + 1}/${maxAttempts})`);
            }

            attempts++;
            await new Promise(resolve => setTimeout(resolve, pollInterval)); // Wait for next poll
        }

        if (!isComplete) {
            throw new Error('Attestation polling timed out after 30 minutes.');
        }

        // 3. Create a provider for the *dynamic* destination chain
        console.log(`Backend: Connecting to ${destinationChain} with our Relayer wallet...`);
        const provider = new ethers.JsonRpcProvider(rpcUrl);

        // 4. Connect your *single* relayer wallet to that specific provider
        const relayerWallet = new ethers.Wallet(process.env.RELAYER_PRIVATE_KEY, provider);

        // 5. Mint!
        console.log(`Backend: Submitting MINT transaction to ${destinationChain}...`);
        const mintTx = await bridgeKit.mint(
            attestation,
            destinationWallet, // The merchant's wallet
            relayerWallet      // Your relayer wallet (now connected to the right chain)
        );

        const mintTxReceipt = await mintTx.wait();

        console.log("✅ SUCCESS! Payment complete.");
        console.log(`Mint Transaction Hash on ${destinationChain}: ${mintTxReceipt.hash}`);
        res.json({ success: true, mintTxHash: mintTxReceipt.hash, chain: destinationChain });

    } catch (err) {
        console.error('Error processing payment:', err.message);
        res.status(500).json({ error: err.message });
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`ArcPay backend listening on port ${PORT}`);
});