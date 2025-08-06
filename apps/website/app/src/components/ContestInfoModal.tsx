import { useState } from "react";
import { Dialog } from "@headlessui/react";
import { motion, AnimatePresence } from "framer-motion";
import { X, MessageCircle, Star, Trophy, Clock, Gift } from "lucide-react";

interface ContestInfoModalProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

const ContestInfoModal = ({ isOpen, setIsOpen }: ContestInfoModalProps) => {
  const [activeTab, setActiveTab] = useState("overview");

  const tabs = [
    { id: "overview", label: "Overview", icon: Star },
    { id: "points", label: "Earning Points", icon: Trophy },
    { id: "rewards", label: "Rewards", icon: Gift },
    { id: "rules", label: "Rules", icon: MessageCircle },
  ];

  const fadeIn = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
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
          <div className="fixed inset-0 flex items-center justify-center p-4">
            <Dialog.Panel className="relative bg-black/90 rounded-xl border border-soless-blue/40 w-full max-w-3xl max-h-[80vh] overflow-hidden">
              {/* Close button */}
              <button
                onClick={() => setIsOpen(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-white"
              >
                <X className="w-6 h-6" />
              </button>

              {/* Header */}
              <div className="p-6 border-b border-soless-blue/40">
                <Dialog.Title className="text-2xl font-bold bg-gradient-to-r from-green-400 to-soless-blue bg-clip-text text-transparent">
                  SOLess Spring SOLstice Contest
                </Dialog.Title>
              </div>

              {/* Navigation Tabs */}
              <div className="flex space-x-1 p-2 bg-black/50">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                      activeTab === tab.id
                        ? "bg-soless-blue text-white"
                        : "text-gray-400 hover:text-white hover:bg-white/5"
                    }`}
                  >
                    <tab.icon className="w-4 h-4 mr-2" />
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Content */}
              <div className="p-6 overflow-y-auto max-h-[60vh]">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeTab}
                    initial="hidden"
                    animate="visible"
                    exit="hidden"
                    variants={fadeIn}
                    transition={{ duration: 0.2 }}
                  >
                    {activeTab === "overview" && (
                      <div className="space-y-4">
                        <div className="bg-black/50 rounded-lg p-4 border border-green-500/20">
                          <h3 className="text-lg font-medium text-green-400 mb-2 flex items-center">
                            <Clock className="w-5 h-5 mr-2" />
                            Spring SOLstice Contest
                          </h3>
                          <ul className="space-y-2 text-gray-300">
                            <li>
                              • Contest runs from March 20 to June 20, 2025
                            </li>
                            <li>• Special seasonal challenges and rewards</li>
                            <li>
                              • Qualify by reaching point thresholds during any
                              phase
                            </li>
                            <li>
                              • Automatic tracking and instant notifications
                            </li>
                          </ul>
                        </div>
                        <p className="text-gray-400">
                          Link your social accounts, engage with our community,
                          and earn points to qualify for exclusive rewards
                          including whitelist spots and free mints!
                        </p>
                      </div>
                    )}

                    {activeTab === "points" && (
                      <div className="space-y-6">
                        <div className="bg-black/50 rounded-lg p-4 border border-purple-500/20">
                          <h3 className="text-lg font-medium text-purple-400 mb-3">
                            Telegram Points
                          </h3>
                          <ul className="space-y-2 text-gray-300">
                            <li>
                              • Quality Posts: 1 point (5min cooldown, 10+
                              words)
                            </li>
                            <li>• Daily Activity: 2 points</li>
                            <li>
                              • Conversations/Replies: 2 points (1min cooldown)
                            </li>
                            <li>
                              • Platform Mentions: 3 points (10min cooldown)
                            </li>
                            <li>
                              • Music Sharing (/soulieplay): 5 points (10/day,
                              5min cooldown, max 50/day)
                            </li>
                            <li>• Invites: 10 points</li>
                          </ul>
                        </div>

                        <div className="bg-black/50 rounded-lg p-4 border border-indigo-500/20">
                          <h3 className="text-lg font-medium text-indigo-400 mb-3">
                            Discord Points
                          </h3>
                          <ul className="space-y-2 text-gray-300">
                            <li>• Quality Posts: 1 point (5min cooldown)</li>
                            <li>• Daily Activity: 2 points</li>
                            <li>
                              • Voice Chat: 2 points (5min cooldown, min 5min,
                              every 15min)
                            </li>
                            <li>• Reactions: 1 point (30s cooldown, 50/day)</li>
                            <li>• Invites: 10 points</li>
                          </ul>
                        </div>

                        <div className="bg-black/50 rounded-lg p-4 border border-blue-500/20">
                          <h3 className="text-lg font-medium text-blue-400 mb-3">
                            Twitter Points
                          </h3>
                          <ul className="space-y-2 text-gray-300">
                            <li>• Tweets: 2 points (5min cooldown)</li>
                            <li>• Retweets: 1 point (5min cooldown)</li>
                            <li>• Mentions: 3 points (10min cooldown)</li>
                            <li>
                              • Hashtags: 2 points (5min cooldown, #soless,
                              #solesssystem)
                            </li>
                          </ul>
                        </div>

                        <div className="bg-black/50 rounded-lg p-4 border border-orange-500/20">
                          <h3 className="text-lg font-medium text-orange-400 mb-3">
                            Streak Bonuses
                          </h3>
                          <ul className="space-y-2 text-gray-300">
                            <li>
                              • 3 points per single platform streak (reset 00:00
                              UTC, 1 day grace)
                            </li>
                            <li>• 15 points for all platform streak</li>
                          </ul>
                        </div>

                        <div className="bg-black/50 rounded-lg p-4 border border-red-500/20">
                          <h3 className="text-lg font-medium text-red-400 mb-2">
                            Global Limits
                          </h3>
                          <ul className="space-y-1 text-gray-300">
                            <li>• 1,000 points max per day</li>
                            <li>• 10 invites max per day</li>
                            <li>• 10 commands max per minute</li>
                          </ul>
                        </div>
                      </div>
                    )}

                    {activeTab === "rewards" && (
                      <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="bg-black/50 rounded-lg p-4 border border-bronze/20">
                            <h3 className="text-lg font-medium text-yellow-600 mb-2">
                              Bronze Tier
                            </h3>
                            <p className="text-sm text-gray-400 mb-2">
                              Points Required: TBA
                            </p>
                            <ul className="space-y-1 text-gray-300">
                              <li>• Whitelist Spot</li>
                              <li>• 30 days to claim</li>
                              <li>• No limit on spots</li>
                            </ul>
                          </div>

                          <div className="bg-black/50 rounded-lg p-4 border border-silver/20">
                            <h3 className="text-lg font-medium text-gray-300 mb-2">
                              Silver Tier
                            </h3>
                            <p className="text-sm text-gray-400 mb-2">
                              Points Required: TBA
                            </p>
                            <ul className="space-y-1 text-gray-300">
                              <li>• Free Mint Tier 1</li>
                              <li>• Details: TBA</li>
                            </ul>
                          </div>

                          <div className="bg-black/50 rounded-lg p-4 border border-gold/20">
                            <h3 className="text-lg font-medium text-yellow-400 mb-2">
                              Gold Tier
                            </h3>
                            <p className="text-sm text-gray-400 mb-2">
                              Points Required: TBA
                            </p>
                            <ul className="space-y-1 text-gray-300">
                              <li>• Free Mint Tier 2</li>
                              <li>• Details: TBA</li>
                            </ul>
                          </div>

                          <div className="bg-black/50 rounded-lg p-4 border border-platinum/20">
                            <h3 className="text-lg font-medium text-purple-300 mb-2">
                              Platinum Tier
                            </h3>
                            <p className="text-sm text-gray-400 mb-2">
                              Points Required: TBA
                            </p>
                            <ul className="space-y-1 text-gray-300">
                              <li>• Free Mint Tier 3</li>
                              <li>• Details: TBA</li>
                            </ul>
                          </div>
                        </div>

                        <div className="bg-black/50 rounded-lg p-4 border border-green-500/20">
                          <h3 className="text-lg font-medium text-green-400 mb-2">
                            Contest Prizes
                          </h3>
                          <ul className="space-y-1 text-gray-300">
                            <li>• 1st Place: TBA</li>
                            <li>• 2nd Place: TBA</li>
                            <li>• 3rd Place: TBA</li>
                            <li>• 4th Place: TBA</li>
                            <li>• 5th Place: TBA</li>
                          </ul>
                        </div>
                      </div>
                    )}

                    {activeTab === "rules" && (
                      <div className="space-y-4">
                        <div className="bg-black/50 rounded-lg p-4 border border-soless-blue/20">
                          <h3 className="text-lg font-medium text-soless-blue mb-2">
                            Platform Requirements
                          </h3>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                              <h4 className="text-purple-400 mb-1">Telegram</h4>
                              <ul className="text-sm text-gray-300 space-y-1">
                                <li>• Must join official group</li>
                                <li>• Must maintain membership</li>
                                <li>• Use real username</li>
                              </ul>
                            </div>
                            <div>
                              <h4 className="text-indigo-400 mb-1">Discord</h4>
                              <ul className="text-sm text-gray-300 space-y-1">
                                <li>• Must join official server</li>
                                <li>• Must accept rules</li>
                                <li>• Voice chat minimum: 5 min</li>
                              </ul>
                            </div>
                            <div>
                              <h4 className="text-blue-400 mb-1">Twitter</h4>
                              <ul className="text-sm text-gray-300 space-y-1">
                                <li>• Must follow official account</li>
                                <li>• Account must be public</li>
                                <li>• No private accounts</li>
                              </ul>
                            </div>
                          </div>
                        </div>

                        <div className="bg-black/50 rounded-lg p-4 border border-red-500/20">
                          <h3 className="text-lg font-medium text-red-400 mb-2">
                            Restrictions
                          </h3>
                          <ul className="space-y-1 text-gray-300">
                            <li>• One wallet per user</li>
                            <li>• No automated activity</li>
                            <li>• No spam or farming</li>
                            <li>• No duplicate accounts</li>
                          </ul>
                        </div>

                        <div className="bg-black/50 rounded-lg p-4 border border-yellow-500/20">
                          <h3 className="text-lg font-medium text-green-400 mb-2">
                            Spring SOLstice Special Rules
                          </h3>
                          <ul className="space-y-1 text-gray-300">
                            <li>• Seasonal challenges that change monthly</li>
                            <li>
                              • Special rewards for consistent participation
                            </li>
                            <li>
                              • Top performers each month receive exclusive
                              Spring-themed NFTs
                            </li>
                            <li>
                              • Final leaderboard rewards at Summer Solstice
                              (June 20)
                            </li>
                          </ul>
                        </div>
                      </div>
                    )}
                  </motion.div>
                </AnimatePresence>
              </div>
            </Dialog.Panel>
          </div>
        </Dialog>
      )}
    </AnimatePresence>
  );
};

export default ContestInfoModal;
