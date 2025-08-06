import { useState, useEffect } from "react";
import { Dialog } from "@headlessui/react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Gift, Check, AlertCircle } from "lucide-react";
import { contestsApi } from "../lib/api/contests";

interface RewardClaimModalProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  wallet: string;
}

interface Reward {
  id: string;
  contestId: string;
  type: string;
  status: string;
  metadata: {
    amount?: string;
    description?: string;
    rewardSystem: "tier" | "rank";
    tierName?: string;
    rank?: number;
  };
  contest: {
    name: string;
    endTime: string;
  };
  expiresAt: string | null;
}

const RewardClaimModal = ({
  isOpen,
  setIsOpen,
  wallet,
}: RewardClaimModalProps) => {
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [claimingId, setClaimingId] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    if (isOpen && wallet) {
      fetchRewards();
    }
  }, [isOpen, wallet]);

  const fetchRewards = async () => {
    try {
      setLoading(true);
      const rewardsData = await contestsApi.getRewards(wallet);
      setRewards(rewardsData as any); // Type compatibility fix
      setError("");
    } catch (err) {
      console.error("Error fetching rewards:", err);
      setError("Failed to load rewards. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const handleClaim = async (rewardId: string) => {
    try {
      setClaimingId(rewardId);
      setError("");
      setSuccessMessage("");

      const result = await contestsApi.claimReward(rewardId);

      if (result.success) {
        setSuccessMessage("Reward claimed successfully!");
        // Update the local state to reflect the claimed reward
        setRewards(
          rewards.map((reward) =>
            reward.id === rewardId ? { ...reward, status: "CLAIMED" } : reward
          )
        );
      } else {
        setError("Failed to claim reward. Please try again.");
      }
    } catch (err) {
      console.error("Error claiming reward:", err);
      setError("An error occurred while claiming the reward.");
    } finally {
      setClaimingId(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getRewardTypeDisplay = (type: string) => {
    const typeColors: Record<string, { bg: string; text: string; icon: any }> =
      {
        USDC: { bg: "bg-green-500/20", text: "text-green-400", icon: Gift },
        SOLANA: { bg: "bg-purple-500/20", text: "text-purple-400", icon: Gift },
        SOUL: { bg: "bg-blue-500/20", text: "text-blue-400", icon: Gift },
        WHITELIST: {
          bg: "bg-yellow-500/20",
          text: "text-yellow-400",
          icon: Gift,
        },
        FREE_MINT: { bg: "bg-pink-500/20", text: "text-pink-400", icon: Gift },
        FREE_GAS: {
          bg: "bg-orange-500/20",
          text: "text-orange-400",
          icon: Gift,
        },
        NO_FEES: { bg: "bg-teal-500/20", text: "text-teal-400", icon: Gift },
      };

    const defaultStyle = {
      bg: "bg-gray-500/20",
      text: "text-gray-400",
      icon: Gift,
    };
    return typeColors[type] || defaultStyle;
  };

  const isExpired = (expiresAt: string | null) => {
    if (!expiresAt) return false;
    return new Date(expiresAt) < new Date();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <Dialog
          static
          open={isOpen}
          onClose={() => setIsOpen(false)}
          className="relative z-50"
        >
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm"
          />

          {/* Modal */}
          <div className="fixed inset-0 flex items-center justify-center p-4 overflow-y-auto">
            <Dialog.Panel className="relative bg-black/90 rounded-xl border border-soless-blue/40 w-full max-w-2xl max-h-[80vh] overflow-hidden">
              {/* Close button */}
              <button
                onClick={() => setIsOpen(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-white"
              >
                <X className="w-6 h-6" />
              </button>

              {/* Header */}
              <div className="p-6 border-b border-soless-blue/40">
                <Dialog.Title className="text-2xl font-bold text-soless-blue flex items-center">
                  <Gift className="mr-2 h-6 w-6" />
                  Your Contest Rewards
                </Dialog.Title>
                <p className="text-gray-400 mt-2">
                  View and claim rewards earned from community contests
                </p>
              </div>

              {/* Content */}
              <div className="p-6 overflow-y-auto max-h-[calc(80vh-200px)]">
                {loading ? (
                  <div className="flex justify-center items-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-soless-blue"></div>
                  </div>
                ) : error ? (
                  <div className="bg-red-500/20 text-red-400 p-4 rounded-lg flex items-center">
                    <AlertCircle className="h-5 w-5 mr-2" />
                    {error}
                  </div>
                ) : successMessage ? (
                  <div className="bg-green-500/20 text-green-400 p-4 rounded-lg mb-4 flex items-center">
                    <Check className="h-5 w-5 mr-2" />
                    {successMessage}
                  </div>
                ) : null}

                {rewards.length === 0 && !loading ? (
                  <div className="text-center py-12">
                    <Gift className="mx-auto h-16 w-16 text-gray-600 mb-4" />
                    <h3 className="text-white text-xl font-medium mb-2">
                      No Rewards Yet
                    </h3>
                    <p className="text-gray-400">
                      Participate in contests to earn rewards
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {rewards.map((reward) => {
                      const rewardStyle = getRewardTypeDisplay(reward.type);
                      return (
                        <div
                          key={reward.id}
                          className={`bg-black/30 border ${
                            isExpired(reward.expiresAt)
                              ? "border-red-500/30"
                              : "border-soless-blue/30"
                          } rounded-lg p-4`}
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <div className="flex items-center">
                                <div
                                  className={`${rewardStyle.bg} p-2 rounded-full mr-3 flex-shrink-0`}
                                >
                                  <rewardStyle.icon
                                    className={`h-5 w-5 ${rewardStyle.text}`}
                                  />
                                </div>
                                <div>
                                  <h3 className="text-white font-medium">
                                    {reward.metadata.description ||
                                      `${reward.type} Reward`}
                                  </h3>
                                  <p className="text-sm text-gray-400">
                                    {reward.contest.name} •{" "}
                                    {formatDate(reward.contest.endTime)}
                                  </p>
                                </div>
                              </div>

                              {reward.metadata.tierName && (
                                <div className="mt-3 ml-10 inline-block px-2 py-1 rounded-lg bg-yellow-600/20 text-yellow-400 text-xs">
                                  {reward.metadata.tierName} Tier
                                </div>
                              )}

                              {reward.metadata.rank && (
                                <div className="mt-3 ml-10 inline-block px-2 py-1 rounded-lg bg-purple-600/20 text-purple-400 text-xs">
                                  Rank #{reward.metadata.rank}
                                </div>
                              )}

                              {reward.expiresAt && (
                                <p
                                  className={`mt-3 ml-10 text-xs ${
                                    isExpired(reward.expiresAt)
                                      ? "text-red-400"
                                      : "text-gray-400"
                                  }`}
                                >
                                  {isExpired(reward.expiresAt)
                                    ? `Expired on ${formatDate(
                                        reward.expiresAt
                                      )}`
                                    : `Expires on ${formatDate(
                                        reward.expiresAt
                                      )}`}
                                </p>
                              )}
                            </div>

                            <div>
                              {reward.status === "PENDING" &&
                              !isExpired(reward.expiresAt) ? (
                                <button
                                  className="bg-soless-blue hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                                  onClick={() => handleClaim(reward.id)}
                                  disabled={claimingId === reward.id}
                                >
                                  {claimingId === reward.id ? (
                                    <>
                                      <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                                      Claiming...
                                    </>
                                  ) : (
                                    "Claim Reward"
                                  )}
                                </button>
                              ) : reward.status === "CLAIMED" ? (
                                <span className="inline-block px-3 py-1 bg-green-500/20 text-green-400 rounded-lg text-sm">
                                  <Check className="inline-block mr-1 h-4 w-4" />
                                  Claimed
                                </span>
                              ) : reward.status === "PENDING" &&
                                isExpired(reward.expiresAt) ? (
                                <span className="inline-block px-3 py-1 bg-red-500/20 text-red-400 rounded-lg text-sm">
                                  Expired
                                </span>
                              ) : (
                                <span className="inline-block px-3 py-1 bg-gray-500/20 text-gray-400 rounded-lg text-sm">
                                  {reward.status}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="p-4 border-t border-soless-blue/40 bg-black/50">
                <div className="flex justify-between items-center">
                  <p className="text-sm text-gray-400">
                    Some rewards may have expiration dates
                  </p>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="px-4 py-2 border border-soless-blue text-soless-blue hover:bg-soless-blue/20 rounded-lg text-sm font-medium transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            </Dialog.Panel>
          </div>
        </Dialog>
      )}
    </AnimatePresence>
  );
};

export default RewardClaimModal;
