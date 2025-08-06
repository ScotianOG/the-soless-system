import { Connection, VersionedTransaction, TransactionSignature } from '@solana/web3.js';

export async function sendAndConfirmTransactionWithRetry(
  connection: Connection,
  transaction: VersionedTransaction,
  maxRetries = 3
): Promise<TransactionSignature> {
  let lastError;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      const signature = await connection.sendRawTransaction(transaction.serialize());
      await connection.confirmTransaction(signature);
      return signature;
    } catch (error) {
      lastError = error;
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1))); // Exponential backoff
    }
  }
  
  throw lastError;
}
