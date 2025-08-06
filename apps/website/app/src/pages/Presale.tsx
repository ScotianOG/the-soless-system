import { useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { usePresale } from "../hooks/usePresale";
import PresaleCountdown from "../components/PresaleCountdown";

const PRESALE_START = new Date("2025-01-01T09:00:00Z");
const PRESALE_END = new Date("2025-01-10T23:59:59Z");

const Presale = () => {
  const { connected } = useWallet();
  const {
    contribute,
    loading,
    minContribution,
    maxContribution,
    walletContributions,
  } = usePresale();
  const [amount, setAmount] = useState<string>("");
  const [error, setError] = useState<string>("");

  const handleContribute = async () => {
    if (!amount) return;

    try {
      setError("");
      const solAmount = parseFloat(amount);
      const now = new Date();

      if (now < PRESALE_START) {
        setError("Presale has not started yet");
        return;
      }

      if (now > PRESALE_END) {
        setError("Presale has ended");
        return;
      }

      if (solAmount < minContribution) {
        setError(`Minimum contribution is ${minContribution} SOL`);
        return;
      }
      if (solAmount > maxContribution) {
        setError(`Maximum contribution is ${maxContribution} SOL`);
        return;
      }

      const tx = await contribute(solAmount);
      setAmount("");
      alert("Thank you for your contribution!");
    } catch (err: any) {
      console.error("Contribution error:", err);
      setError(err.message || "Failed to contribute");
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-2 pt-0">
      <div className="mb-4 flex justify-center">
        <img
          src="/assets/images/PresaleBanner.png"
          alt="SOLess Presale Banner"
          className="w-200 h-auto rounded-xl max-h-100"
        />
      </div>
      <div className="bg-black/30 p-8 rounded-xl border border-soless-blue/40 mb-4">
        <PresaleCountdown startDate={PRESALE_START} endDate={PRESALE_END} />
      </div>
      <div className="bg-black/30 p-8 rounded-xl border border-soless-blue/40 mb-4">
        <p className="text-xl text-soless-blue font-semibold mb-4">
          ROUND TWO EXTENDED UNTIL JANUARY 10TH AT 23:59 UCT. FINAL CHANCE!!
        </p>
        <p className="text-gray-300 mb-6">
          The SOLess presale is your exclusive chance to be part of a
          revolutionary DeFi and social ecosystem built on SONIC! With a
          minimum contribution of just 0.1 SOL and a maximum of 5 SOL per
          wallet, we're giving everyone an opportunity to join the SOLess
          community early.
        </p>
      </div>
      <div className="bg-black/30 p-8 rounded-xl border border-soless-blue/40 mb-4 text-center">
        {!connected ? (
          <div>
            <p className="text-xl text-gray-300 mb-4">
              Connect your wallet to participate in the presale
            </p>
            <WalletMultiButton className="!bg-gradient-to-r !from-soless-blue !to-soless-purple hover:!opacity-90" />
          </div>
        ) : (
          <div>
            <input
              type="number"
              min="0.1"
              max="5"
              step="0.1"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Enter SOL amount (0.1 - 5)"
              className="w-full max-w-md px-4 py-2 rounded-lg bg-black/50 border border-soless-blue/40 text-white mb-4"
            />
            <button
              onClick={handleContribute}
              disabled={loading}
              className="bg-gradient-to-r from-soless-blue to-soless-purple px-8 py-3 rounded-lg font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {loading ? "Processing..." : "Contribute"}
            </button>
            {error && (
              <div className="text-red-500 mt-2 p-4 bg-red-500/10 rounded-lg">
                {error}
              </div>
            )}
            {walletContributions && (
              <div className="text-gray-300 mt-4 p-4 bg-black/20 rounded-lg">
                <p>
                  Your total contribution:{" "}
                  {walletContributions.total.toFixed(2)} SOL
                </p>
                <p className="text-sm">
                  Remaining allowed:{" "}
                  {(maxContribution - walletContributions.total).toFixed(2)} SOL
                </p>
              </div>
            )}
          </div>
        )}
        <p className="text-gray-400 mt-4">
          Presale ends January 10th!
        </p>
      </div>
      <div className="bg-black/30 p-8 rounded-xl border border-soless-blue/40 mb-4">
        <h2 className="text-2xl font-bold mb-4 text-soless-blue">
          Token Distribution
        </h2>
        <p className="text-gray-300 mb-4">
          Contributors will be divided into four groups and receive their tokens
          over time through airdrops, starting on launch day.
        </p>
        <ul className="list-disc list-inside text-gray-300 space-y-2">
          <li>20% of your tokens at launch</li>
          <li>20% each month for the next four months</li>
          <li>
            The monthly airdrops will go to a different group each week. Your
            airdrop will rotate each month among the 4 weeks. The airdrop
            schedule will be posted after the presale ends and before the token
            launch.
          </li>
        </ul>
      </div>
      <div className="flex justify-center mb-4">
        <img
          src="/assets/images/PresaleSoulie.png"
          alt="SOLess Soulie"
          className="h-96 w-auto"
        />
      </div>
    </div>
  );
};

export default Presale;
