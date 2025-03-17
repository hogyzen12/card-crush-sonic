import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWallet } from '@solana/wallet-adapter-react';

export function HomeScreen() {
  const navigate = useNavigate();
  const { publicKey } = useWallet();
  const [userBalance, setUserBalance] = useState<number | null>(null);
  const [sonicBalance, setSonicBalance] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // SONIC token mint address
  const SONIC_MINT = "mrujEYaN1oyQXDHeYNxBYpxWKVkQ2XsGxfznpifu4aL";
  
  // Sonic's custom token program ID (different from standard Solana)
  const TOKEN_PROGRAM_ID = "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb";
  const ASSOCIATED_TOKEN_PROGRAM_ID = "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL";

  useEffect(() => {
    const fetchBalances = async () => {
      if (!publicKey) {
        console.log("No wallet connected");
        setUserBalance(null);
        setSonicBalance(null);
        return;
      }

      console.log("Connected wallet address:", publicKey.toString());

      try {
        setIsLoading(true);
        
        // Fetch SOL balance
        console.log("Fetching SOL balance for:", publicKey.toString());
        const solResponse = await fetch('https://api.mainnet-alpha.sonic.game', {
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

        if (solResponse.ok) {
          const solData = await solResponse.json();
          console.log("SOL balance response:", solData);
          
          if (solData.result) {
            // Convert lamports to SOL (1 SOL = 1,000,000,000 lamports)
            const solBalance = solData.result.value / 1000000000;
            setUserBalance(solBalance);
            console.log("SOL balance set to:", solBalance);
          }
        }
        
        // Try a direct approach first - attempt to get the associated token account address
        console.log("Trying a direct approach to find SONIC token account");
        console.log("SONIC mint:", SONIC_MINT);
        console.log("Token Program ID:", TOKEN_PROGRAM_ID);
        
        // Construct and log the request for debugging
        const programAccountsRequestBody = JSON.stringify({
          jsonrpc: '2.0',
          id: 3,
          method: 'getProgramAccounts',
          params: [
            TOKEN_PROGRAM_ID,
            {
              filters: [
                {
                  dataSize: 165  // Size of token account data
                },
                {
                  memcmp: {
                    offset: 0,
                    bytes: publicKey.toString()
                  }
                },
                {
                  memcmp: {
                    offset: 32,
                    bytes: SONIC_MINT
                  }
                }
              ],
              encoding: "jsonParsed"
            }
          ],
        });
        
        console.log("getProgramAccounts request:", programAccountsRequestBody);
        
        const response = await fetch('https://api.mainnet-alpha.sonic.game', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: programAccountsRequestBody,
        });
        
        const data = await response.json();
        console.log("Token account lookup full response:", data);
        
        // Let's also try a simpler approach - get all token accounts for the wallet
        console.log("Trying alternative approach - get all token accounts for wallet");
        
        const allAccountsRequest = JSON.stringify({
          jsonrpc: '2.0',
          id: 5,
          method: 'getTokenAccountsByOwner',
          params: [
            publicKey.toString(),
            {
              programId: TOKEN_PROGRAM_ID
            },
            {
              encoding: "jsonParsed"
            }
          ],
        });
        
        console.log("getTokenAccountsByOwner request:", allAccountsRequest);
        
        const allAccountsResponse = await fetch('https://api.mainnet-alpha.sonic.game', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: allAccountsRequest,
        });
        
        const allAccountsData = await allAccountsResponse.json();
        console.log("All token accounts response:", allAccountsData);
        
        // If we got accounts, let's try to find the SONIC one
        if (allAccountsData.result && allAccountsData.result.value && allAccountsData.result.value.length > 0) {
          console.log(`Found ${allAccountsData.result.value.length} token accounts`);
          
          for (const account of allAccountsData.result.value) {
            console.log("Checking account:", account.pubkey);
            
            try {
              const accountInfo = account.account.data.parsed.info;
              console.log("Account mint:", accountInfo.mint);
              console.log("Account owner:", accountInfo.owner);
              
              if (accountInfo.mint === SONIC_MINT) {
                console.log("SONIC token account found:", account.pubkey);
                console.log("Token balance:", accountInfo.tokenAmount.uiAmount);
                
                setSonicBalance(accountInfo.tokenAmount.uiAmount);
                break;
              }
            } catch (err) {
              console.error("Error parsing account data:", err);
            }
          }
        } else {
          console.log("No token accounts found or error in response");
          setSonicBalance(0);
        }
        
      } catch (error) {
        console.error('Error fetching balances:', error);
        // Fallback values for development
        setUserBalance(0.0);
        setSonicBalance(0);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBalances();
    
    const intervalId = setInterval(fetchBalances, 30000);
    return () => clearInterval(intervalId);
  }, [publicKey]);

  const handlePress = (target: string) => {
    navigate(target);
  };

  return (
    <div className="centered-container">
      <div className="button-container-top">
        <button onClick={() => handlePress('/how-to-play')} className="button-primary">How to Play</button>
        <button onClick={() => handlePress('/sonicgame')} className="button-primary">SONIC Game!</button>
        <button onClick={() => handlePress('/history')} className="button-primary">Progress</button>
        <button onClick={() => handlePress('/leaderboard')} className="button-primary">Leaderboard</button>
      </div>
      
      {!publicKey ? (
        <div className="prize-pool-display">
          Connect your wallet to see your balance
        </div>
      ) : isLoading ? (
        <div className="prize-pool-display">
          Loading balances...
        </div>
      ) : (
        <div className="balances-container">
          <div className="prize-pool-display">
            Your SOL Balance: {userBalance !== null ? userBalance.toFixed(4) : '0'} SOL
          </div>
          
          {sonicBalance !== null && (
            <div className="prize-pool-display">
              You have {sonicBalance > 0 ? sonicBalance.toLocaleString() : '0'} 
              <img src="/assets/snclgo.svg" alt="SONIC" className="inline-block w-6 h-6 ml-2 align-middle" />
            </div>
          )}
          
          {(userBalance === 0 || sonicBalance === 0) && (
            <div className="bridge-info mt-4 mx-auto max-w-md p-4 bg-gray-800 rounded-lg text-white text-sm">
              <h3 className="text-center font-bold mb-2">Need to bridge to Sonic?</h3>
              <ul className="list-disc pl-5 space-y-1">
                <li>Visit <a href="https://bridge.sonic.game/" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">bridge.sonic.game</a> to bridge your assets</li>
                <li>Bridge a minimum of 0.1 SOL and 4.2 SONIC to get started</li>
                <li>Backpack wallet supports Sonic network natively</li>
                <li>Set your RPC to: <span className="font-mono text-xs bg-gray-700 px-1 py-0.5 rounded">https://rpc.mainnet-alpha.sonic.game</span></li>
                <li className="mt-1">
                  <span className="font-semibold">To switch RPC in Backpack:</span> 
                  <span className="text-gray-300 ml-1">Top left circle → Settings → Solana → RPC connection → Custom → Paste RPC link</span>
                </li>
              </ul>
            </div>
          )}
        </div>
      )}
      
      <img
        src="/assets/snc.webp"
        alt="Anime Character"
        className="w-full h-auto mt-8"
      />
    </div>
  );
}

export default HomeScreen;