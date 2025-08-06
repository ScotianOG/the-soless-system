import { useState } from "react";
import { Dialog } from "@headlessui/react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  MessageCircle,
  Star,
  Trophy,
  Clock,
  Gift,
  Music,
  Zap,
  Twitter,
  Globe,
} from "lucide-react";

interface PointsInfoModalProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

const PointsInfoModal = ({ isOpen, setIsOpen }: PointsInfoModalProps) => {
  const [activeTab, setActiveTab] = useState("telegram");

  const tabs = [
    { id: "telegram", label: "Telegram", icon: MessageCircle },
    { id: "discord", label: "Discord", icon: Globe },
    { id: "twitter", label: "Twitter", icon: Twitter },
    { id: "streaks", label: "Streaks", icon: Zap },
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
                <Dialog.Title className="text-2xl font-bold bg-gradient-to-r from-soless-blue to-purple-500 bg-clip-text text-transparent">
                  SOLess Point Earning System
                </Dialog.Title>
              </div>

              {/* Navigation Tabs */}
              <div className="flex space-x-1 p-2 bg-black/50">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200
                      ${
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
                    {activeTab === "telegram" && (
                      <div className="space-y-6">
                        <div className="bg-black/50 rounded-lg p-4 border border-purple-500/20">
                          <h3 className="text-lg font-medium text-purple-400 mb-3">
                            Telegram Points
                          </h3>
                          <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              <div className="bg-black/30 rounded p-3 border border-purple-500/10">
                                <div className="flex items-center mb-2">
                                  <MessageCircle className="w-4 h-4 text-purple-400 mr-2" />
                                  <h4 className="font-medium text-white">
                                    Regular Messages
                                  </h4>
                                </div>
                                <p className="text-gray-300 text-sm">
                                  1 point (60s cooldown)
                                </p>
                                <p className="text-gray-400 text-xs mt-1">
                                  Maximum 100 per day
                                </p>
                              </div>

                              <div className="bg-black/30 rounded p-3 border border-purple-500/10">
                                <div className="flex items-center mb-2">
                                  <Star className="w-4 h-4 text-purple-400 mr-2" />
                                  <h4 className="font-medium text-white">
                                    Quality Posts
                                  </h4>
                                </div>
                                <p className="text-gray-300 text-sm">
                                  1 point (300s cooldown)
                                </p>
                                <p className="text-gray-400 text-xs mt-1">
                                  Must be 10+ words
                                </p>
                              </div>

                              <div className="bg-black/30 rounded p-3 border border-purple-500/10">
                                <div className="flex items-center mb-2">
                                  <Music className="w-4 h-4 text-purple-400 mr-2" />
                                  <h4 className="font-medium text-white">
                                    Music Sharing
                                  </h4>
                                </div>
                                <p className="text-gray-300 text-sm">
                                  5 points per share
                                </p>
                                <p className="text-gray-400 text-xs mt-1">
                                  Maximum 10 per day
                                </p>
                              </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="bg-black/30 rounded p-3 border border-purple-500/10">
                                <div className="flex items-center mb-2">
                                  <Trophy className="w-4 h-4 text-purple-400 mr-2" />
                                  <h4 className="font-medium text-white">
                                    Platform Mentions
                                  </h4>
                                </div>
                                <p className="text-gray-300 text-sm">
                                  3 points (600s cooldown)
                                </p>
                                <p className="text-gray-400 text-xs mt-1">
                                  Using #soless hashtag
                                </p>
                              </div>

                              <div className="bg-black/30 rounded p-3 border border-purple-500/10">
                                <div className="flex items-center mb-2">
                                  <Gift className="w-4 h-4 text-purple-400 mr-2" />
                                  <h4 className="font-medium text-white">
                                    Invites
                                  </h4>
                                </div>
                                <p className="text-gray-300 text-sm">
                                  10 points per successful invite
                                </p>
                                <p className="text-gray-400 text-xs mt-1">
                                  New members must join group
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="bg-black/50 rounded-lg p-4 border border-soless-blue/20">
                          <h3 className="text-lg font-medium text-soless-blue mb-3">
                            Telegram Commands
                          </h3>
                          <div className="space-y-2 text-gray-300">
                            <p className="text-sm">
                              <span className="text-soless-blue font-mono">
                                /soulieplay
                              </span>{" "}
                              - Share music and earn 5 points
                            </p>
                            <p className="text-sm">
                              <span className="text-soless-blue font-mono">
                                /points
                              </span>{" "}
                              - Check your current points
                            </p>
                            <p className="text-sm">
                              <span className="text-soless-blue font-mono">
                                /leaderboard
                              </span>{" "}
                              - View community leaderboard
                            </p>
                            <p className="text-sm">
                              <span className="text-soless-blue font-mono">
                                /help
                              </span>{" "}
                              - Get a list of all commands
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {activeTab === "discord" && (
                      <div className="space-y-6">
                        <div className="bg-black/50 rounded-lg p-4 border border-indigo-500/20">
                          <h3 className="text-lg font-medium text-indigo-400 mb-3">
                            Discord Points
                          </h3>
                          <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              <div className="bg-black/30 rounded p-3 border border-indigo-500/10">
                                <div className="flex items-center mb-2">
                                  <MessageCircle className="w-4 h-4 text-indigo-400 mr-2" />
                                  <h4 className="font-medium text-white">
                                    Messages
                                  </h4>
                                </div>
                                <p className="text-gray-300 text-sm">
                                  1 point (60s cooldown)
                                </p>
                                <p className="text-gray-400 text-xs mt-1">
                                  Maximum 100 per day
                                </p>
                              </div>

                              <div className="bg-black/30 rounded p-3 border border-indigo-500/10">
                                <div className="flex items-center mb-2">
                                  <Zap className="w-4 h-4 text-indigo-400 mr-2" />
                                  <h4 className="font-medium text-white">
                                    Reactions
                                  </h4>
                                </div>
                                <p className="text-gray-300 text-sm">
                                  0.5 points (30s cooldown)
                                </p>
                                <p className="text-gray-400 text-xs mt-1">
                                  Maximum 50 per day
                                </p>
                              </div>

                              <div className="bg-black/30 rounded p-3 border border-indigo-500/10">
                                <div className="flex items-center mb-2">
                                  <Globe className="w-4 h-4 text-indigo-400 mr-2" />
                                  <h4 className="font-medium text-white">
                                    Voice Chat
                                  </h4>
                                </div>
                                <p className="text-gray-300 text-sm">
                                  1 point (300s cooldown)
                                </p>
                                <p className="text-gray-400 text-xs mt-1">
                                  Minimum 5 minutes
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {activeTab === "twitter" && (
                      <div className="space-y-6">
                        <div className="bg-black/50 rounded-lg p-4 border border-blue-500/20">
                          <h3 className="text-lg font-medium text-blue-400 mb-3">
                            Twitter Points
                          </h3>
                          <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              <div className="bg-black/30 rounded p-3 border border-blue-500/10">
                                <div className="flex items-center mb-2">
                                  <Twitter className="w-4 h-4 text-blue-400 mr-2" />
                                  <h4 className="font-medium text-white">
                                    Tweets
                                  </h4>
                                </div>
                                <p className="text-gray-300 text-sm">
                                  2 points (300s cooldown)
                                </p>
                                <p className="text-gray-400 text-xs mt-1">
                                  Maximum 10 per day
                                </p>
                              </div>

                              <div className="bg-black/30 rounded p-3 border border-blue-500/10">
                                <div className="flex items-center mb-2">
                                  <Zap className="w-4 h-4 text-blue-400 mr-2" />
                                  <h4 className="font-medium text-white">
                                    Retweets
                                  </h4>
                                </div>
                                <p className="text-gray-300 text-sm">
                                  1 point (300s cooldown)
                                </p>
                                <p className="text-gray-400 text-xs mt-1">
                                  Maximum 20 per day
                                </p>
                              </div>

                              <div className="bg-black/30 rounded p-3 border border-blue-500/10">
                                <div className="flex items-center mb-2">
                                  <Star className="w-4 h-4 text-blue-400 mr-2" />
                                  <h4 className="font-medium text-white">
                                    Mentions
                                  </h4>
                                </div>
                                <p className="text-gray-300 text-sm">
                                  3 points (600s cooldown)
                                </p>
                                <p className="text-gray-400 text-xs mt-1">
                                  Maximum 5 per day
                                </p>
                              </div>
                            </div>

                            <div className="bg-black/30 rounded p-3 border border-blue-500/10">
                              <div className="flex items-center mb-2">
                                <Trophy className="w-4 h-4 text-blue-400 mr-2" />
                                <h4 className="font-medium text-white">
                                  Hashtag Tips
                                </h4>
                              </div>
                              <p className="text-gray-300 text-sm">
                                Use these hashtags for more visibility:
                              </p>
                              <div className="flex flex-wrap gap-2 mt-2">
                                <span className="bg-blue-900/30 text-blue-400 text-xs px-2 py-1 rounded">
                                  #soless
                                </span>
                                <span className="bg-blue-900/30 text-blue-400 text-xs px-2 py-1 rounded">
                                  #solesssystem
                                </span>
                                <span className="bg-blue-900/30 text-blue-400 text-xs px-2 py-1 rounded">
                                  #soulie
                                </span>
                                <span className="bg-blue-900/30 text-blue-400 text-xs px-2 py-1 rounded">
                                  #soulieplay
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {activeTab === "streaks" && (
                      <div className="space-y-6">
                        <div className="bg-black/50 rounded-lg p-4 border border-orange-500/20">
                          <h3 className="text-lg font-medium text-orange-400 mb-3">
                            Streak System
                          </h3>

                          <div className="grid grid-cols-1 gap-4">
                            <div className="bg-black/30 rounded p-4 border border-orange-500/10">
                              <h4 className="text-white font-medium mb-2">
                                How Streaks Work
                              </h4>
                              <ul className="space-y-2 text-gray-300 list-disc list-inside text-sm">
                                <li>
                                  Streaks are tracked separately for each
                                  platform
                                </li>
                                <li>
                                  You must be active at least once every 24
                                  hours
                                </li>
                                <li>Miss a day and your streak resets to 1</li>
                                <li>3-day streaks earn a 5 point bonus</li>
                                <li>Streaks reset at 00:00 UTC each day</li>
                              </ul>
                            </div>

                            <div className="bg-black/30 rounded p-4 border border-orange-500/10">
                              <h4 className="text-white font-medium mb-2">
                                Streak Bonus Structure
                              </h4>
                              <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-orange-800/30">
                                  <thead>
                                    <tr>
                                      <th className="px-4 py-2 text-left text-xs font-medium text-orange-300">
                                        Streak Length
                                      </th>
                                      <th className="px-4 py-2 text-left text-xs font-medium text-orange-300">
                                        Bonus Points
                                      </th>
                                      <th className="px-4 py-2 text-left text-xs font-medium text-orange-300">
                                        Frequency
                                      </th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-orange-800/30">
                                    <tr>
                                      <td className="px-4 py-2 text-sm text-gray-300">
                                        3 days
                                      </td>
                                      <td className="px-4 py-2 text-sm text-gray-300">
                                        5 points
                                      </td>
                                      <td className="px-4 py-2 text-sm text-gray-300">
                                        Every 3 days
                                      </td>
                                    </tr>
                                    <tr>
                                      <td className="px-4 py-2 text-sm text-gray-300">
                                        7 days
                                      </td>
                                      <td className="px-4 py-2 text-sm text-gray-300">
                                        10 points
                                      </td>
                                      <td className="px-4 py-2 text-sm text-gray-300">
                                        Once at 7 days
                                      </td>
                                    </tr>
                                    <tr>
                                      <td className="px-4 py-2 text-sm text-gray-300">
                                        14 days
                                      </td>
                                      <td className="px-4 py-2 text-sm text-gray-300">
                                        15 points
                                      </td>
                                      <td className="px-4 py-2 text-sm text-gray-300">
                                        Once at 14 days
                                      </td>
                                    </tr>
                                    <tr>
                                      <td className="px-4 py-2 text-sm text-gray-300">
                                        30 days
                                      </td>
                                      <td className="px-4 py-2 text-sm text-gray-300">
                                        30 points
                                      </td>
                                      <td className="px-4 py-2 text-sm text-gray-300">
                                        Once at 30 days
                                      </td>
                                    </tr>
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="bg-black/50 rounded-lg p-4 border border-green-500/20">
                          <h3 className="text-lg font-medium text-green-400 mb-3">
                            Daily Limits & Maximums
                          </h3>
                          <div className="bg-black/30 rounded p-4 border border-green-500/10">
                            <ul className="space-y-2 text-gray-300 list-disc list-inside text-sm">
                              <li>
                                Maximum 1,000 points per day across all
                                activities
                              </li>
                              <li>Maximum 10 invites per day</li>
                              <li>Maximum 10 commands per minute</li>
                              <li>
                                You can earn points from all platforms
                                simultaneously
                              </li>
                              <li>
                                Multi-platform activity earns bonus multipliers
                                during contests
                              </li>
                            </ul>
                          </div>
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

export default PointsInfoModal;
