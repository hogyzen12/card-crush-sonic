import { PublicKey } from '@solana/web3.js';

export interface GameEntry {
  signature: string;
  blockTime: number;
  score: number;
  seed: string;
  moves: string[];
  date: string;
}

interface TransactionSignatureResult {
  signature: string;
  blockTime?: number;
  confirmationStatus?: string;
  err?: any;
  memo?: string;
  slot?: number;
}

/**
 * Fetches the game transaction history for a specific wallet address
 * @param walletAddress The public key of the wallet
 * @returns An array of game entries
 */
export const fetchGameTransactionHistory = async (
  walletAddress: PublicKey
): Promise<GameEntry[]> => {
  try {
    console.log(`Fetching transaction history for ${walletAddress.toString()}`);
    
    const response = await fetch('https://api.mainnet-alpha.sonic.game', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'getSignaturesForAddress',
        params: [walletAddress.toString(), { limit: 690 }],
      }),
    });

    const data = await response.json();
    
    if (!data.result || !Array.isArray(data.result)) {
      console.error('Invalid response format:', data);
      return [];
    }

    console.log(`Found ${data.result.length} transactions`);
    
    // Filter for game transactions by checking if they have a memo that matches our game format
    const gameEntries: GameEntry[] = data.result
      .filter((tx: TransactionSignatureResult) => tx.memo && tx.memo.includes('|'))
      .map((tx: TransactionSignatureResult) => {
        try {
          // The memo format is: score|seed|move1|move2|...|moveN
          // or [code] score|seed|move1|move2|...|moveN
          const memoContent = tx.memo as string;
          const parts = memoContent.split('|');
          
          // Extract score from the first part
          // Handle different prefix formats in the memo
          let scorePart = parts[0];
          
          // Check if the score part contains a code in square brackets
          const bracketMatch = scorePart.match(/\[\d+\]\s*(.*)/);
          if (bracketMatch) {
            // Extract just the number after the bracketed code
            scorePart = bracketMatch[1];
          }
          
          const score = parseInt(scorePart, 10);
          
          if (isNaN(score)) {
            console.warn(`Invalid score in transaction ${tx.signature}:`, scorePart);
            return null;
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
          
          return {
            signature: tx.signature,
            blockTime: tx.blockTime || 0,
            score,
            seed,
            moves,
            date
          };
        } catch (error) {
          console.error(`Error parsing memo for transaction ${tx.signature}:`, error);
          return null;
        }
      })
      .filter((entry: GameEntry | null) => entry !== null) as GameEntry[];
    
    // Sort by block time (most recent first)
    return gameEntries.sort((a, b) => (b.blockTime || 0) - (a.blockTime || 0));
    
  } catch (error) {
    console.error('Error fetching transaction history:', error);
    return [];
  }
};

/**
 * Calculates the total SONIC rewards based on game entries
 * @param entries Array of game entries
 * @returns Total SONIC rewards (1 SONIC per entry)
 */
export const calculateTotalRewards = (entries: GameEntry[]): number => {
  return entries.length; // 1 SONIC per entry
};