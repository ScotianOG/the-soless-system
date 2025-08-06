import { useState } from "react";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import {
  PublicKey,
  Transaction,
  SystemProgram,
  LAMPORTS_PER_SOL,
} from "@solana/web3.js";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Info, Sparkles } from "lucide-react";
import { toast } from "sonner";

// Configuration

const getSoulRatio = (pairId: string) => {
  switch (pairId) {
    case "popdog-soul":
      return "2.6";
    case "maximus-soul":
      return "0.125";
    case "solana-soul":
      return "200,000";
    default:
      return "0";
  }
};
const PAIRS = [
  {
    id: "popdog-soul",
    token1Logo: "/assets/images/popdog-logo.jpg",
    token2Logo: "/assets/images/soless-logo.png",
    token1Name: "POPDOG",
    token2Name: "SOL",
    // 1 POPDOG = 2.6 SOUL, calculating required SOL based on SOUL ratio
    // 2.6 SOUL = 0.000013 SOL (since 1 SOL = 200k SOUL)
    ratio: 0.000013,
  },
  {
    id: "maximus-soul",
    token1Logo: "/assets/images/dogeus-logo.webp",
    token2Logo: "/assets/images/soless-logo.png",
    token1Name: "MAXIMUS",
    token2Name: "SOL",
    // 1 MAXIMUS = 0.125 SOUL, calculating required SOL based on SOUL ratio
    // 0.125 SOUL = 0.000000625 SOL (since 1 SOL = 200k SOUL)
    ratio: 0.000000625,
  },
  {
    id: "solana-soul",
    token1Logo: "/assets/images/sol-logo.png",
    token2Logo: "/assets/images/soless-logo.png",
    token1Name: "SOL",
    token2Name: "SOUL",
    ratio: 200000, // 1 SOL = 200k SOUL
  },
];

const CONTRIBUTION_WALLETS = {
  "popdog-soul": new PublicKey("BTeRqfVFGjFTmiBDyeBsbmu9hVLVHQ6y6nRND6DxAsL7"),
  "maximus-soul": new PublicKey("9JExg4Wqazi7kLKqtGQkwL8AqXUfPGD3Ay4iKeVzBbS3"),
  "solana-soul": new PublicKey("CTesHFNDR9MLK6yNwgjypGYqSSssihNWb8ysRq6vBG9C"),
};

const MIN_SOL = 0.1;
const MAX_SOL = 25;

export default function LiquidityPage() {
  const { publicKey, signTransaction } = useWallet();
  const { connection } = useConnection();
  const [selectedPair, setSelectedPair] = useState(PAIRS[0]);
  const [amounts, setAmounts] = useState({ token1: "", token2: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAmountChange = (value: string, isToken1: boolean) => {
    const newAmount = value.replace(/[^0-9.]/g, "");
    const ratio = selectedPair.ratio;
  
    if (selectedPair.id === "solana-soul") {
      // For SOL/SOUL pair, user enters SOL amount and SOUL is calculated
      const soulAmount = (parseFloat(newAmount) * ratio).toFixed(0);
      setAmounts({
        token1: newAmount,
        token2: isNaN(parseFloat(soulAmount)) ? "" : soulAmount,
      });
    } else {
      // For token pairs, user enters token amount and SOL is calculated
      const solAmount = (parseFloat(newAmount) * ratio).toFixed(8);
      setAmounts({
        token1: newAmount,
        token2: isNaN(parseFloat(solAmount)) ? "" : solAmount,
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
  
    if (!publicKey || !signTransaction) {
      toast.error("Please connect your wallet first");
      return;
    }
  
    let solAmount = 0;
    if (selectedPair.id === "solana-soul") {
      // For SOL/SOUL pair, double the entered SOL amount
      solAmount = parseFloat(amounts.token1) * 2;
    } else {
      // For other pairs, use the calculated SOL amount
      solAmount = parseFloat(amounts.token2);
    }
  
    if (isNaN(solAmount)) {
      toast.error("Please enter a valid amount");
      return;
    }
  
    setIsSubmitting(true);
    try {
      // Create transaction
      const recipientWallet =
        CONTRIBUTION_WALLETS[
          selectedPair.id as keyof typeof CONTRIBUTION_WALLETS
        ];
      const transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: publicKey,
          toPubkey: recipientWallet,
          lamports: Math.floor(solAmount * LAMPORTS_PER_SOL), 
        })
      );

      // Get latest blockhash
      const { blockhash, lastValidBlockHeight } =
        await connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = publicKey;

      console.log("Requesting signature...");
      const signed = await signTransaction(transaction);
      console.log("Transaction signed");

      const rawTransaction = signed.serialize();
      console.log("Sending transaction...");

      const signature = await connection.sendRawTransaction(rawTransaction, {
        skipPreflight: true,
        maxRetries: 5,
      });

      console.log("Confirming transaction...");
      const confirmationStrategy = {
        blockhash,
        lastValidBlockHeight,
        signature,
      };

      const confirmation = await connection.confirmTransaction(
        confirmationStrategy
      );
      console.log("Transaction confirmed:", confirmation);

      if (confirmation.value.err) {
        throw new Error("Transaction failed");
      }

      toast.success("Contribution successful!", {
        description: `Transaction signature: ${signature.slice(0, 8)}...`,
      });

      // Reset form
      setAmounts({ token1: "", token2: "" });
    } catch (error: any) {
      console.error("Transaction error:", error);
      toast.error(error?.message || "Failed to process contribution");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-black/95">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          {/* Banner */}
          <div className="mb-12">
            <img
              src="/assets/images/WordBanner.png"
              alt="Banner"
              className="w-full h-auto rounded-xl"
            />
          </div>
          <p className="text-lg text-gray-400 max-w-2xl mx-auto">
            Contribute liquidity and earn rewards in the SOLess ecosystem. Early
            contributors receive a{" "}
            <span className="text-soless-blue font-medium">
              1.5x multiplier
            </span>{" "}
            on rewards, no trading fees for as long as your stake is locked, and
            automatic whitelisting for the Founder's Collection NFT mint!
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-7xl mx-auto">
          {/* Left Column - Pair Selector */}
          <div className="bg-black/30 border border-soless-blue rounded-lg p-6">
            <h2 className="text-2xl font-bold text-soless-blue mb-4">
              Select Token Pair
            </h2>
            <div className="space-y-3">
              {PAIRS.map((pair) => (
                <button
                  key={pair.id}
                  onClick={() => {
                    setSelectedPair(pair);
                    setAmounts({ token1: "", token2: "" });
                  }}
                  className={`w-full p-4 rounded-lg border transition-all duration-200 flex items-center justify-between group hover:bg-soless-blue/10 ${
                    selectedPair.id === pair.id
                      ? "bg-soless-blue/20 border-soless-blue"
                      : "border-soless-blue bg-black/40"
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className="relative flex items-center">
                      <img
                        src={pair.token1Logo}
                        alt={pair.token1Name}
                        className="w-8 h-8 rounded-full"
                      />
                      <img
                        src={pair.token2Logo}
                        alt={pair.token2Name}
                        className="w-8 h-8 rounded-full -ml-3"
                      />
                    </div>
                    <div className="text-left">
                      <h3 className="font-medium text-white">
                        {pair.token1Name}/{pair.token2Name}
                      </h3>
                      <p className="text-sm text-soless-blue">
                        1 {pair.token1Name} ={" "}
                        {pair.id === "popdog-soul"
                          ? "2.6"
                          : pair.id === "maximus-soul"
                          ? "0.125"
                          : "200,000"}{" "}
                        SOUL
                      </p>
                    </div>
                  </div>
                  {selectedPair.id === pair.id && (
                    <div className="h-2 w-2 rounded-full bg-soless-blue" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Right Column - Contribution Form */}
          <div className="bg-black/30 border border-soless-blue/20 rounded-lg p-6">
            <h2 className="text-2xl font-bold text-soless-blue mb-4">
              Contribute Liquidity
            </h2>

            <div className="mb-6 p-4 bg-black/40 rounded-lg border border-soless-blue">
              <h3 className="text-lg font-semibold text-soless-blue mb-3">
                Contribution Info
              </h3>
              <ul className="space-y-3">
                <li className="flex items-start gap-3 text-gray-300">
                  <Info className="w-5 h-5 text-soless-blue mt-0.5 flex-shrink-0" />
                  <span>
                    Current ratio: 1 {selectedPair.token1Name} ={" "}
                    {selectedPair.ratio} {selectedPair.token2Name}
                  </span>
                </li>
                <li className="flex items-start gap-3 text-gray-300">
                  <Info className="w-5 h-5 text-soless-blue mt-0.5 flex-shrink-0" />
                  <span>SOL will be converted to SOUL at launch</span>
                </li>
                <li className="flex items-start gap-3">
                  <Info className="w-5 h-5 text-soless-blue mt-0.5 flex-shrink-0" />
                  <span className="text-soless-blue font-medium">
                    Initial lock period is 90 days and may be extended
                    afterwards in 30 day increments.
                  </span>
                </li>
              </ul>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-4">
                {/* Dynamic Input Fields based on pair */}
                {selectedPair.id === "solana-soul" ? (
                  <>
                    {/* SOL Input */}
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        SOL Amount
                      </label>
                      <div className="relative">
                        <Input
                          type="text"
                          value={amounts.token1}
                          onChange={(e) =>
                            handleAmountChange(e.target.value, true)
                          }
                          placeholder="0.0"
                          className="bg-black/60 border-soless-blue/20 focus:border-soless-blue text-white pl-4 pr-24 h-12"
                        />
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2 bg-black/40 px-2 py-1 rounded-md">
                          <img
                            src="/assets/images/sol-logo.png"
                            alt="SOL"
                            className="w-5 h-5 rounded-full"
                          />
                          <span className="text-sm text-gray-300">SOL</span>
                        </div>
                      </div>
                    </div>

                    {/* SOUL Output */}
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        SOUL Amount (Received)
                      </label>
                      <div className="relative">
                        <Input
                          type="text"
                          value={amounts.token2}
                          readOnly
                          placeholder="0.0"
                          className="bg-black/80 border-soless-blue/20 focus:border-soless-blue text-white pl-4 pr-24 h-12 cursor-not-allowed"
                        />
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2 bg-black/40 px-2 py-1 rounded-md">
                          <img
                            src="/assets/images/soless-logo.png"
                            alt="SOUL"
                            className="w-5 h-5 rounded-full"
                          />
                          <span className="text-sm text-gray-300">SOUL</span>
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    {/* Token Input */}
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        {selectedPair.token1Name} Amount
                      </label>
                      <div className="relative">
                        <Input
                          type="text"
                          value={amounts.token1}
                          onChange={(e) =>
                            handleAmountChange(e.target.value, true)
                          }
                          placeholder="0.0"
                          className="bg-black/60 border-soless-blue/20 focus:border-soless-blue text-white pl-4 pr-24 h-12"
                        />
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2 bg-black/40 px-2 py-1 rounded-md">
                          <img
                            src={selectedPair.token1Logo}
                            alt={selectedPair.token1Name}
                            className="w-5 h-5 rounded-full"
                          />
                          <span className="text-sm text-gray-300">
                            {selectedPair.token1Name}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* SOL Required */}
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        SOL Required
                      </label>
                      <div className="relative">
                        <Input
                          type="text"
                          value={amounts.token2}
                          readOnly
                          placeholder="0.0"
                          className="bg-black/80 border-soless-blue/20 focus:border-soless-blue text-white pl-4 pr-24 h-12 cursor-not-allowed"
                        />
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2 bg-black/40 px-2 py-1 rounded-md">
                          <img
                            src="/assets/images/sol-logo.png"
                            alt="SOL"
                            className="w-5 h-5 rounded-full"
                          />
                          <span className="text-sm text-gray-300">SOL</span>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>

              <div className="text-sm text-gray-400 bg-soless-blue/10 p-4 rounded-lg border border-soless-blue">
                <p className="mb-2">
                  SOL will be automatically converted to SOUL at the presale
                  price. Any change in ratios from now until launch will result
                  in your wallet being refunded one side of the pair
                </p>
                <p>
                  Min: {MIN_SOL} SOL | Max: {MAX_SOL} SOL
                </p>
              </div>

              <Button
                type="submit"
                disabled={!publicKey || isSubmitting}
                className="w-full bg-soless-blue hover:bg-soless-blue/80 text-white font-medium h-12 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting
                  ? "Processing..."
                  : publicKey
                  ? "Contribute"
                  : "Connect Wallet to Contribute"}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
