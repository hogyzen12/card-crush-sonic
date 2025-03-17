import {
  Connection,
  PublicKey,
  Transaction,
  ComputeBudgetProgram,
  SystemProgram,
  SendOptions
} from '@solana/web3.js';
import { SignerWalletAdapter } from '@solana/wallet-adapter-base';

// Sonic Network specific program IDs
const TOKEN_PROGRAM_ID = new PublicKey("TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb");
const ASSOCIATED_TOKEN_PROGRAM_ID = new PublicKey("ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL");
const MEMO_PROGRAM_ID = new PublicKey("MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr");

// SONIC token mint address
const SONIC_MINT = new PublicKey("mrujEYaN1oyQXDHeYNxBYpxWKVkQ2XsGxfznpifu4aL");

/**
 * Get associated token address for a wallet and mint
 */
const getAssociatedTokenAddress = async (
  mint: PublicKey,
  owner: PublicKey
): Promise<PublicKey> => {
  return PublicKey.findProgramAddressSync(
    [
      owner.toBuffer(),
      TOKEN_PROGRAM_ID.toBuffer(),
      mint.toBuffer(),
    ],
    ASSOCIATED_TOKEN_PROGRAM_ID
  )[0];
};

/**
 * Create and send a transaction for sending SONIC tokens with a memo
 */
export async function createSonicTx(
  receiverAddress: string,
  senderPublicKey: PublicKey,
  memoContent: string,
  signTransaction: SignerWalletAdapter['signTransaction'],
  connection: Connection
): Promise<string> {
  try {
    console.log("Starting transaction creation...");
    
    // Convert receiver address to PublicKey
    const receiver = new PublicKey(receiverAddress);
    console.log("Receiver:", receiver.toString());
    
    // Get the associated token accounts for sender and receiver
    const senderTokenAccount = await getAssociatedTokenAddress(SONIC_MINT, senderPublicKey);
    console.log("Sender token account:", senderTokenAccount.toString());
    
    const receiverTokenAccount = await getAssociatedTokenAddress(SONIC_MINT, receiver);
    console.log("Receiver token account:", receiverTokenAccount.toString());
    
    // Create a new transaction
    const transaction = new Transaction();
    
    // Add compute budget instruction to ensure transaction has enough compute units
    // Increase compute units to prevent "exceeded CUs meter" error
    transaction.add(ComputeBudgetProgram.setComputeUnitLimit({ units: 69420 }));
    
    // Check if receiver token account exists
    const receiverAccountInfo = await connection.getAccountInfo(receiverTokenAccount);
    console.log("Receiver account exists:", !!receiverAccountInfo);
    
    if (receiverAccountInfo === null) {
      console.log("Creating receiver token account...");
      // Create associated token account for receiver if it doesn't exist
      const createATAInstruction = {
        keys: [
          { pubkey: senderPublicKey, isSigner: true, isWritable: true },
          { pubkey: receiverTokenAccount, isSigner: false, isWritable: true },
          { pubkey: receiver, isSigner: false, isWritable: false },
          { pubkey: SONIC_MINT, isSigner: false, isWritable: false },
          { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
          { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
        ],
        programId: ASSOCIATED_TOKEN_PROGRAM_ID,
        data: Buffer.from([1]), // 1 = CreateIdempotent instruction
      };
      
      transaction.add(createATAInstruction);
    }
    
    // Create a buffer for the transfer instruction
    const instructionTypeBuffer = Buffer.from([12]); // 12 = TransferChecked instruction
    
    // Amount to send - 0.01 SONIC (or any small amount for game entry)
    const tokenAmount = 0.01;
    const decimals = 9;
    const amountInSmallestUnits = Math.floor(tokenAmount * Math.pow(10, decimals));
    console.log("Token amount in smallest units:", amountInSmallestUnits);
    
    // Create buffer for token amount
    const amountBuffer = Buffer.alloc(8);
    amountBuffer.writeBigUInt64LE(BigInt(amountInSmallestUnits), 0);
    
    // Create buffer for decimals
    const decimalsBuffer = Buffer.from([decimals]);
    
    // Combine all buffers for the instruction data
    const dataBuffer = Buffer.concat([instructionTypeBuffer, amountBuffer, decimalsBuffer]);
    
    // Add the token transfer instruction
    const transferInstruction = {
      keys: [
        { pubkey: senderTokenAccount, isSigner: false, isWritable: true },
        { pubkey: SONIC_MINT, isSigner: false, isWritable: false },
        { pubkey: receiverTokenAccount, isSigner: false, isWritable: true },
        { pubkey: senderPublicKey, isSigner: true, isWritable: false },
      ],
      programId: TOKEN_PROGRAM_ID,
      data: dataBuffer
    };
    
    transaction.add(transferInstruction);
    
    // Add memo instruction to include game data - FIXED: memo data format
    const memoBuffer = Buffer.from(memoContent, 'utf-8');
    console.log("Memo content:", memoContent);
    console.log("Memo buffer length:", memoBuffer.length);
    
    const memoInstruction = {
      keys: [{ pubkey: senderPublicKey, isSigner: true, isWritable: false }],
      programId: MEMO_PROGRAM_ID,
      data: memoBuffer
    };
    
    transaction.add(memoInstruction);
    
    // Set fee payer
    transaction.feePayer = senderPublicKey;
    
    // Get recent blockhash
    const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
    transaction.recentBlockhash = blockhash;
    console.log("Recent blockhash:", blockhash);
    
    // Sign the transaction
    console.log("Signing transaction...");
    const signedTransaction = await signTransaction(transaction);
    
    // Send the transaction
    console.log("Sending transaction...");
    const sendOptions: SendOptions = {
      skipPreflight: true, // CHANGED: Skip simulation to avoid potential RPC issues
      preflightCommitment: 'processed',
      maxRetries: 2, // Add retries to handle potential network issues
    };
    
    const txid = await connection.sendRawTransaction(signedTransaction.serialize(), sendOptions);
    console.log("Transaction sent, txid:", txid);
    
    // Check transaction confirmation
    await connection.confirmTransaction({
      blockhash,
      lastValidBlockHeight,
      signature: txid
    });
    
    return txid;
  } catch (error) {
    console.error("Error in createSonicTx:", error);
    throw error;
  }
}