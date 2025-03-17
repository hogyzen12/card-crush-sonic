// utils/wallet.ts
import { Connection, PublicKey } from '@solana/web3.js';

export const getWalletBalance = async (
  connection: Connection,
  publicKey: PublicKey
): Promise<number> => {
  try {
    const response = await fetch('https://api.mainnet-alpha.sonic.game', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'getBalance',
        params: [publicKey.toString()],
      }),
    });

    if (response.ok) {
      const data = await response.json();
      
      if (data.result) {
        // Convert lamports to SOL (1 SOL = 1,000,000,000 lamports)
        return data.result.value / 1000000000;
      }
    }
    
    // Fallback in case of any issues
    console.error('Error fetching balance from Sonic');
    return 0;
  } catch (error) {
    console.error('Error in getWalletBalance:', error);
    return 0;
  }
};