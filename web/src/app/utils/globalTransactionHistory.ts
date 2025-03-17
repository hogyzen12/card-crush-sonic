import { PublicKey } from '@solana/web3.js';

export interface GameEntry {
  signature: string;
  blockTime: number;
  score: number;
  seed: string;
  moves: string[];
  date: string;
  wallet?: string; // Added wallet field to track the player
}

interface TransactionSignatureResult {
  signature: string;
  blockTime?: number;
  confirmationStatus?: string;
  err?: any;
  memo?: string;
  slot?: number;
  signer?: string; // Added signer field
}

/**
 * Fetches global game transaction history for the entry wallet
 * @param entryWalletAddress The public key of the entry wallet that collects all game entries
 * @returns An array of game entries from all players
 */
export const fetchGlobalGameHistory = async (
  entryWalletAddress: string
): Promise<GameEntry[]> => {
  try {
    console.log(`Fetching global transaction history for entry wallet: ${entryWalletAddress}`);

    // Parse address to ensure it's valid
    const entryWallet = new PublicKey(entryWalletAddress);
    
    // First, get all signatures for the entry wallet with a higher limit
    // This will fetch transactions where the entry wallet is involved
    const response = await fetch('https://api.mainnet-alpha.sonic.game', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'getSignaturesForAddress',
        params: [entryWallet.toString(), { limit: 1000 }], // Fetch more transactions for global view
      }),
    });

    const data = await response.json();
    
    if (!data.result || !Array.isArray(data.result)) {
      console.error('Invalid response format:', data);
      return [];
    }

    console.log(`Found ${data.result.length} transactions for entry wallet`);
    
    // Function to get transaction details including signers
    const fetchTransactionDetails = async (signature: string): Promise<any> => {
      try {
        const response = await fetch('https://api.mainnet-alpha.sonic.game', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            jsonrpc: '2.0',
            id: 1,
            method: 'getTransaction',
            params: [
              signature, 
              { encoding: 'jsonParsed', maxSupportedTransactionVersion: 0 }
            ],
          }),
        });
        
        const data = await response.json();
        return data.result;
      } catch (error) {
        console.error(`Error fetching transaction details for ${signature}:`, error);
        return null;
      }
    };
    
    // Process transactions with memos and extract player wallet addresses
    const processedEntries: GameEntry[] = [];
    
    for (const tx of data.result) {
      // Skip if no memo or doesn't include game data format (number|seed|moves)
      if (!tx.memo || !tx.memo.includes('|')) continue;
      
      try {
        // Fetch full transaction details to get the signer (player wallet)
        const txDetails = await fetchTransactionDetails(tx.signature);
        if (!txDetails || !txDetails.transaction || !txDetails.transaction.message) {
          continue;
        }
        
        // Extract player wallet from transaction message accounts (first account is typically the fee payer/signer)
        const accountKeys = txDetails.transaction.message.accountKeys || [];
        const playerWallet = accountKeys.length > 0 ? accountKeys[0].pubkey : undefined;
        
        // The memo format is: score|seed|move1|move2|...|moveN
        const memoContent = tx.memo as string;
        const parts = memoContent.split('|');
        
        // Extract score from the first part
        // If the memo starts with '[106]', we need to remove that prefix
        const scorePart = parts[0].includes('[106]') ? parts[0].replace('[106] ', '') : parts[0];
        const score = parseInt(scorePart, 10);
        
        if (isNaN(score)) {
          console.warn(`Invalid score in transaction ${tx.signature}:`, scorePart);
          continue;
        }
        
        // Extract seed from the second part
        const seed = parts[1];
        
        // Extract moves from the remaining parts
        const moves = parts.slice(2);
        
        // Format date from blockTime (which is in seconds since epoch)
        const date = tx.blockTime 
          ? new Date(tx.blockTime * 1000).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })
          : 'Unknown date';
        
        processedEntries.push({
          signature: tx.signature,
          blockTime: tx.blockTime || 0,
          score,
          seed,
          moves,
          date,
          wallet: playerWallet
        });
      } catch (error) {
        console.error(`Error processing transaction ${tx.signature}:`, error);
      }
    }
    
    // Sort by block time (most recent first)
    return processedEntries.sort((a, b) => b.blockTime - a.blockTime);
    
  } catch (error) {
    console.error('Error fetching global transaction history:', error);
    return [];
  }
};

/**
 * Groups game entries by level (seed)
 * @param entries Array of game entries
 * @returns Record of entries grouped by seed
 */
export const groupEntriesByLevel = (entries: GameEntry[]): Record<string, GameEntry[]> => {
  return entries.reduce((acc, entry) => {
    if (!acc[entry.seed]) {
      acc[entry.seed] = [];
    }
    acc[entry.seed].push(entry);
    return acc;
  }, {} as Record<string, GameEntry[]>);
};

/**
 * Groups game entries by player wallet
 * @param entries Array of game entries
 * @returns Record of entries grouped by player wallet
 */
export const groupEntriesByPlayer = (entries: GameEntry[]): Record<string, GameEntry[]> => {
  return entries.reduce((acc, entry) => {
    if (!entry.wallet) return acc;
    
    if (!acc[entry.wallet]) {
      acc[entry.wallet] = [];
    }
    acc[entry.wallet].push(entry);
    return acc;
  }, {} as Record<string, GameEntry[]>);
};