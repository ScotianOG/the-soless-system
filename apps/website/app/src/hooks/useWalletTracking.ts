import { useCallback, useEffect, useState } from "react";
import { useConnection } from "@solana/wallet-adapter-react";
import {
  PublicKey,
  ParsedTransactionWithMeta,
  LAMPORTS_PER_SOL,
} from "@solana/web3.js";

const TREASURY_WALLET = new PublicKey(
  "668N9L9tdjKwEW26Zg5gtMKVs5PA8x1Tp5FHeEZkj8i2"
);
const MAX_PER_WALLET = 5 * LAMPORTS_PER_SOL;

interface WalletContribution {
  total: number;
  transactions: string[];
  lastContribution: Date;
}

export const useWalletTracking = (walletAddress?: PublicKey) => {
  const { connection } = useConnection();
  const [walletContributions, setWalletContributions] =
    useState<WalletContribution | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchWalletContributions = useCallback(async () => {
    if (!walletAddress) return;

    try {
      setLoading(true);

      const signatures = await connection.getSignaturesForAddress(
        walletAddress,
        { limit: 100 },
        "confirmed"
      );

      const transactions = await Promise.all(
        signatures.map((sig) =>
          connection.getParsedTransaction(sig.signature, "confirmed")
        )
      );

      let total = 0;
      const contributionTxs: string[] = [];

      transactions.forEach((tx: ParsedTransactionWithMeta | null) => {
        if (!tx?.meta || tx.meta.err) return;

        tx.transaction.message.instructions.forEach((ix: any) => {
          if (
            ix.program === "system" &&
            ix.parsed.type === "transfer" &&
            ix.parsed.info.destination === TREASURY_WALLET.toString()
          ) {
            total += ix.parsed.info.lamports / LAMPORTS_PER_SOL;
            if (tx.transaction.signatures[0]) {
              contributionTxs.push(tx.transaction.signatures[0]);
            }
          }
        });
      });

      setWalletContributions({
        total,
        transactions: contributionTxs,
        lastContribution: new Date((signatures[0]?.blockTime ?? 0) * 1000),
      });
    } catch (error) {
      console.error("Error fetching wallet contributions:", error);
    } finally {
      setLoading(false);
    }
  }, [connection, walletAddress]);

  const checkContributionLimit = useCallback(
    async (newAmount: number) => {
      await fetchWalletContributions();

      const currentTotal = walletContributions?.total || 0;

      return {
        currentTotal,
        wouldExceedLimit:
          currentTotal + newAmount > MAX_PER_WALLET / LAMPORTS_PER_SOL,
        remainingAllowed: MAX_PER_WALLET / LAMPORTS_PER_SOL - currentTotal,
      };
    },
    [walletContributions, fetchWalletContributions]
  );

  useEffect(() => {
    fetchWalletContributions();
  }, [walletAddress]);

  return {
    walletContributions,
    loading,
    checkContributionLimit,
    refreshContributions: fetchWalletContributions,
  };
};
