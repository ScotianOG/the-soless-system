import { useCallback, useState } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import {
  PublicKey,
  LAMPORTS_PER_SOL,
  Transaction,
  SystemProgram,
  VersionedTransaction,
  TransactionMessage,
} from "@solana/web3.js";
import { connectionManager } from "../utils/connection";
import { sendAndConfirmTransactionWithRetry } from "../utils/transaction";
import { logger } from "../utils/logger";
import { useWalletTracking } from "./useWalletTracking";

const TREASURY_WALLET = new PublicKey(
  "3RcJunhg5ciP3UWrUvzeRWDRMiAsSFdMLBFPZXBgWKMo"
);
const MIN_CONTRIBUTION = 0.1 * LAMPORTS_PER_SOL;
const MAX_CONTRIBUTION = 5 * LAMPORTS_PER_SOL;

export const usePresale = () => {
  const { connection } = useConnection();
  const wallet = useWallet();
  const [loading, setLoading] = useState(false);
  const { checkContributionLimit, walletContributions, refreshContributions } =
    useWalletTracking(wallet.publicKey ?? undefined);

  const contribute = useCallback(
    async (amount: number) => {
      if (!wallet.publicKey || !wallet.signTransaction) {
        throw new Error("Wallet not connected");
      }

      const lamports = amount * LAMPORTS_PER_SOL;

      try {
        setLoading(true);

        // Get reliable connection
        const reliableConnection =
          await connectionManager.getCurrentConnection();

        // Get latest blockhash
        const { blockhash, lastValidBlockHeight } = await reliableConnection.getLatestBlockhash();

        // Create instruction
        const transferInstruction = SystemProgram.transfer({
          fromPubkey: wallet.publicKey,
          toPubkey: TREASURY_WALLET,
          lamports,
        });

        // Create v0 transaction
        const messageV0 = new TransactionMessage({
          payerKey: wallet.publicKey,
          recentBlockhash: blockhash,
          instructions: [transferInstruction],
        }).compileToV0Message();

        const transaction = new VersionedTransaction(messageV0);

        // Sign transaction
        const signed = await wallet.signTransaction(transaction);

        // Send with retry logic
        const signature = await sendAndConfirmTransactionWithRetry(
          reliableConnection,
          signed
        );

        // Refresh contribution tracking
        await refreshContributions();

        return signature;
      } catch (error: any) {
        logger.error("Contribution error:", error);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [connection, wallet, refreshContributions]
  );

  return {
    contribute,
    loading,
    minContribution: MIN_CONTRIBUTION / LAMPORTS_PER_SOL,
    maxContribution: MAX_CONTRIBUTION / LAMPORTS_PER_SOL,
    treasuryWallet: TREASURY_WALLET.toString(),
    walletContributions,
  };
};
