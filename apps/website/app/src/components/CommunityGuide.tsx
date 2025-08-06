import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Book,
  Rocket,
  Users,
  Trophy,
  Gift,
  HelpCircle,
  BarChart2,
  MessageCircle,
  Clock,
  Wallet,
  Info,
} from "lucide-react";

// Guide tab interface
interface GuideTab {
  id: string;
  label: string;
  icon: React.ElementType;
  content: React.ReactNode;
}

// Tab content components
const IntroductionContent = () => (
  <div className="space-y-4">
    <p className="text-gray-300">
      Welcome to the SOLess community engagement program! Our multi-platform
      system rewards users for active participation across Telegram, Discord,
      and Twitter. This guide explains how to register, connect your social
      accounts, earn points, participate in contests, and claim rewards.
    </p>
    <div className="bg-black/50 rounded-lg p-4 border border-soless-blue/20">
      <h3 className="text-lg font-medium text-soless-blue mb-2 flex items-center">
        <Info className="w-5 h-5 mr-2" />
        Why Participate?
      </h3>
      <ul className="space-y-2 text-gray-300">
        <li>• Earn rewards for activities you already do</li>
        <li>• Join a thriving community of SOLess enthusiasts</li>
        <li>• Help shape the future of the SOLess ecosystem</li>
        <li>• Get early access to new features and opportunities</li>
      </ul>
    </div>
  </div>
);

const GettingStartedContent = () => (
  <div className="space-y-6">
    <div>
      <h3 className="text-xl font-semibold text-soless-blue mb-3">
        Registration
      </h3>
      <ol className="list-decimal list-inside space-y-2 text-gray-300 ml-4">
        <li>
          Visit{" "}
          <a
            href="https://soless.app/register"
            className="text-blue-400 hover:underline"
          >
            https://soless.app/register
          </a>
        </li>
        <li>Connect your Solana wallet (Phantom, Solflare, etc.)</li>
        <li>Complete your profile information</li>
        <li>Accept the terms and conditions</li>
        <li>Claim your welcome bonus (5 points)</li>
      </ol>
    </div>

    <div>
      <h3 className="text-xl font-semibold text-soless-blue mb-3">
        Wallet Connection
      </h3>
      <p className="text-gray-300 mb-3">
        Your wallet address serves as your primary identifier across all
        platforms. Ensure you have access to your wallet for:
      </p>
      <ul className="list-disc list-inside space-y-2 text-gray-300 ml-4">
        <li>Initial registration</li>
        <li>Platform verification</li>
        <li>Claiming rewards</li>
        <li>Viewing your points and stats</li>
      </ul>

      <div className="mt-4 p-4 bg-black/50 rounded-lg border border-yellow-500/20">
        <p className="text-yellow-400 flex items-center mb-2">
          <Info className="w-5 h-5 mr-2" />
          Important Note
        </p>
        <p className="text-gray-300 text-sm">
          Each user can have only one wallet address associated with their
          SOLess account. Make sure you're using a wallet you plan to keep.
        </p>
      </div>
    </div>
  </div>
);

const PlatformIntegrationContent = () => (
  <div className="space-y-8">
    {/* Telegram */}
    <div className="bg-black/50 rounded-lg p-5 border border-blue-500/30">
      <h3 className="text-xl font-semibold text-blue-500 mb-3">Telegram</h3>

      <div className="mb-4">
        <h4 className="text-lg font-medium text-white mb-2">
          Registration Steps:
        </h4>
        <ol className="list-decimal list-inside space-y-2 text-gray-300 ml-4">
          <li>
            Join the{" "}
            <a
              href="https://t.me/SolessSystem"
              className="text-blue-400 hover:underline"
            >
              SOLess Telegram group
            </a>
          </li>
          <li>From the SOLess website dashboard, go to "Connect Accounts"</li>
          <li>Click "Connect Telegram"</li>
          <li>You'll receive a unique 6-character verification code</li>
          <li>
            Send the command{" "}
            <code className="bg-black/50 px-2 py-0.5 rounded">
              /verify [your_code]
            </code>{" "}
            to the SOLess bot in Telegram
          </li>
          <li>You'll receive confirmation that your account is verified</li>
        </ol>
      </div>

      <div>
        <h4 className="text-lg font-medium text-white mb-2">
          Tips for Telegram:
        </h4>
        <ul className="list-disc list-inside space-y-2 text-gray-300 ml-4">
          <li>
            Use the{" "}
            <code className="bg-black/50 px-2 py-0.5 rounded">/help</code>{" "}
            command to see all available bot commands
          </li>
          <li>
            Check your points anytime with{" "}
            <code className="bg-black/50 px-2 py-0.5 rounded">/points</code>
          </li>
          <li>
            View the community leaderboard with{" "}
            <code className="bg-black/50 px-2 py-0.5 rounded">
              /leaderboard
            </code>
          </li>
        </ul>
      </div>
    </div>

    {/* Discord */}
    <div className="bg-black/50 rounded-lg p-5 border border-indigo-500/30">
      <h3 className="text-xl font-semibold text-indigo-500 mb-3">Discord</h3>

      <div className="mb-4">
        <h4 className="text-lg font-medium text-white mb-2">
          Registration Steps:
        </h4>
        <ol className="list-decimal list-inside space-y-2 text-gray-300 ml-4">
          <li>
            Join the{" "}
            <a
              href="https://discord.gg/SOLess"
              className="text-blue-400 hover:underline"
            >
              SOLess Discord server
            </a>
          </li>
          <li>From the SOLess website dashboard, go to "Connect Accounts"</li>
          <li>Click "Connect Discord"</li>
          <li>You'll receive a unique 6-character verification code</li>
          <li>
            Use the{" "}
            <code className="bg-black/50 px-2 py-0.5 rounded">/verify</code>{" "}
            command with your code on the SOLess Discord server
          </li>
          <li>You'll receive confirmation that your account is verified</li>
        </ol>
      </div>

      <div>
        <h4 className="text-lg font-medium text-white mb-2">
          Tips for Discord:
        </h4>
        <ul className="list-disc list-inside space-y-2 text-gray-300 ml-4">
          <li>
            Use <code className="bg-black/50 px-2 py-0.5 rounded">/help</code>{" "}
            to see all available commands
          </li>
          <li>
            Check your points and stats with{" "}
            <code className="bg-black/50 px-2 py-0.5 rounded">/points</code>
          </li>
          <li>
            View the community leaderboard with{" "}
            <code className="bg-black/50 px-2 py-0.5 rounded">
              /leaderboard
            </code>
          </li>
        </ul>
      </div>
    </div>

    {/* Twitter */}
    <div className="bg-black/50 rounded-lg p-5 border border-sky-500/30">
      <h3 className="text-xl font-semibold text-sky-500 mb-3">Twitter</h3>

      <div className="mb-4">
        <h4 className="text-lg font-medium text-white mb-2">
          Registration Steps:
        </h4>
        <ol className="list-decimal list-inside space-y-2 text-gray-300 ml-4">
          <li>
            Follow{" "}
            <a
              href="https://twitter.com/SolessSystem"
              className="text-blue-400 hover:underline"
            >
              @SolessSystem
            </a>{" "}
            on Twitter
          </li>
          <li>From the SOLess website dashboard, go to "Connect Accounts"</li>
          <li>Click "Connect Twitter"</li>
          <li>Authorize the SOLess app to connect to your Twitter account</li>
          <li>Tweet a specific verification message when prompted</li>
          <li>Your account will be automatically verified</li>
        </ol>
      </div>

      <div>
        <h4 className="text-lg font-medium text-white mb-2">
          Tips for Twitter:
        </h4>
        <ul className="list-disc list-inside space-y-2 text-gray-300 ml-4">
          <li>Include #SOLess in your tweets about the project</li>
          <li>Retweet official announcements to earn points</li>
          <li>Mention @SOLessSystem in your posts about the project</li>
        </ul>
      </div>
    </div>
  </div>
);

const EarningPointsContent = () => (
  <div className="space-y-6">
    <h3 className="text-xl font-semibold text-soless-blue">
      Engagement Activities
    </h3>
    <div className="overflow-x-auto">
      <table className="min-w-full bg-black/30 rounded-lg overflow-hidden">
        <thead className="bg-soless-blue/20 border-b border-soless-blue/30">
          <tr>
            <th className="px-4 py-3 text-left text-sm font-medium text-white">
              Activity
            </th>
            <th className="px-4 py-3 text-left text-sm font-medium text-white">
              Points
            </th>
            <th className="px-4 py-3 text-left text-sm font-medium text-white">
              Platform
            </th>
            <th className="px-4 py-3 text-left text-sm font-medium text-white">
              Daily Limit
            </th>
            <th className="px-4 py-3 text-left text-sm font-medium text-white">
              Cooldown
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-800">
          <tr>
            <td className="px-4 py-3 text-sm text-gray-300">Sharing music</td>
            <td className="px-4 py-3 text-sm text-green-400">5</td>
            <td className="px-4 py-3 text-sm text-gray-300">
              Telegram, Discord
            </td>
            <td className="px-4 py-3 text-sm text-gray-300">10/day</td>
            <td className="px-4 py-3 text-sm text-gray-300">5 minutes</td>
          </tr>
          <tr>
            <td className="px-4 py-3 text-sm text-gray-300">
              Sharing SOLess facts
            </td>
            <td className="px-4 py-3 text-sm text-green-400">2</td>
            <td className="px-4 py-3 text-sm text-gray-300">
              Telegram, Discord
            </td>
            <td className="px-4 py-3 text-sm text-gray-300">3/day</td>
            <td className="px-4 py-3 text-sm text-gray-300">5 minutes</td>
          </tr>
          <tr>
            <td className="px-4 py-3 text-sm text-gray-300">
              Quality messages (10+ words)
            </td>
            <td className="px-4 py-3 text-sm text-green-400">1</td>
            <td className="px-4 py-3 text-sm text-gray-300">
              Telegram, Discord
            </td>
            <td className="px-4 py-3 text-sm text-gray-300">No limit</td>
            <td className="px-4 py-3 text-sm text-gray-300">5 minutes</td>
          </tr>
          <tr>
            <td className="px-4 py-3 text-sm text-gray-300">
              Long informative posts (35+ words)
            </td>
            <td className="px-4 py-3 text-sm text-green-400">4</td>
            <td className="px-4 py-3 text-sm text-gray-300">
              Telegram, Discord
            </td>
            <td className="px-4 py-3 text-sm text-gray-300">No limit</td>
            <td className="px-4 py-3 text-sm text-gray-300">15 minutes</td>
          </tr>
          <tr>
            <td className="px-4 py-3 text-sm text-gray-300">
              Mentioning other users
            </td>
            <td className="px-4 py-3 text-sm text-green-400">1</td>
            <td className="px-4 py-3 text-sm text-gray-300">
              Telegram, Discord
            </td>
            <td className="px-4 py-3 text-sm text-gray-300">No limit</td>
            <td className="px-4 py-3 text-sm text-gray-300">3 minutes</td>
          </tr>
          <tr>
            <td className="px-4 py-3 text-sm text-gray-300">
              Tweet with #SOLess hashtag
            </td>
            <td className="px-4 py-3 text-sm text-green-400">2</td>
            <td className="px-4 py-3 text-sm text-gray-300">Twitter</td>
            <td className="px-4 py-3 text-sm text-gray-300">5/day</td>
            <td className="px-4 py-3 text-sm text-gray-300">1 hour</td>
          </tr>
          <tr>
            <td className="px-4 py-3 text-sm text-gray-300">
              Retweet official content
            </td>
            <td className="px-4 py-3 text-sm text-green-400">3</td>
            <td className="px-4 py-3 text-sm text-gray-300">Twitter</td>
            <td className="px-4 py-3 text-sm text-gray-300">5/day</td>
            <td className="px-4 py-3 text-sm text-gray-300">6 hours</td>
          </tr>
          <tr>
            <td className="px-4 py-3 text-sm text-gray-300">
              Reply to official tweets
            </td>
            <td className="px-4 py-3 text-sm text-green-400">1</td>
            <td className="px-4 py-3 text-sm text-gray-300">Twitter</td>
            <td className="px-4 py-3 text-sm text-gray-300">10/day</td>
            <td className="px-4 py-3 text-sm text-gray-300">15 minutes</td>
          </tr>
          <tr>
            <td className="px-4 py-3 text-sm text-gray-300">
              Voice chat participation
            </td>
            <td className="px-4 py-3 text-sm text-green-400">
              2 per 10 minutes
            </td>
            <td className="px-4 py-3 text-sm text-gray-300">Discord</td>
            <td className="px-4 py-3 text-sm text-gray-300">10 points/day</td>
            <td className="px-4 py-3 text-sm text-gray-300">None</td>
          </tr>
          <tr>
            <td className="px-4 py-3 text-sm text-gray-300">
              Inviting new users
            </td>
            <td className="px-4 py-3 text-sm text-green-400">10 per user</td>
            <td className="px-4 py-3 text-sm text-gray-300">All platforms</td>
            <td className="px-4 py-3 text-sm text-gray-300">No limit</td>
            <td className="px-4 py-3 text-sm text-gray-300">None</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div className="space-y-6 pt-6">
      <h3 className="text-xl font-semibold text-soless-blue">
        Platform-Specific Actions
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Telegram Platform Actions */}
        <div className="bg-black/30 rounded-lg p-4 border border-blue-500/20">
          <h4 className="text-lg font-medium text-blue-400 mb-3">Telegram</h4>
          <ul className="space-y-2 text-gray-300">
            <li className="flex items-start">
              <span className="text-blue-400 mr-2">•</span>
              Use{" "}
              <code className="bg-black/50 px-1.5 rounded text-xs">
                /soulieplay [song]
              </code>{" "}
              to share music and earn 5 points
            </li>
            <li className="flex items-start">
              <span className="text-blue-400 mr-2">•</span>
              Use{" "}
              <code className="bg-black/50 px-1.5 rounded text-xs">
                /solfact
              </code>{" "}
              to share a random SOLess fact and earn 2 points
            </li>
            <li className="flex items-start">
              <span className="text-blue-400 mr-2">•</span>
              Messages containing SOLess keywords earn 1 point
            </li>
            <li className="flex items-start">
              <span className="text-blue-400 mr-2">•</span>
              Maintain a daily streak for bonus points every 3 days
            </li>
          </ul>
        </div>

        {/* Discord Platform Actions */}
        <div className="bg-black/30 rounded-lg p-4 border border-indigo-500/20">
          <h4 className="text-lg font-medium text-indigo-400 mb-3">Discord</h4>
          <ul className="space-y-2 text-gray-300">
            <li className="flex items-start">
              <span className="text-indigo-400 mr-2">•</span>
              Use{" "}
              <code className="bg-black/50 px-1.5 rounded text-xs">
                /soulieplay [song]
              </code>{" "}
              to share music and earn 5 points
            </li>
            <li className="flex items-start">
              <span className="text-indigo-400 mr-2">•</span>
              Use{" "}
              <code className="bg-black/50 px-1.5 rounded text-xs">
                /solfact
              </code>{" "}
              to share a random SOLess fact and earn 2 points
            </li>
            <li className="flex items-start">
              <span className="text-indigo-400 mr-2">•</span>
              Join voice channels to earn 2 points per 10 minutes of active
              participation
            </li>
            <li className="flex items-start">
              <span className="text-indigo-400 mr-2">•</span>
              Server boosting earns bonus points
            </li>
          </ul>
        </div>

        {/* Twitter Platform Actions */}
        <div className="bg-black/30 rounded-lg p-4 border border-sky-500/20">
          <h4 className="text-lg font-medium text-sky-400 mb-3">Twitter</h4>
          <ul className="space-y-2 text-gray-300">
            <li className="flex items-start">
              <span className="text-sky-400 mr-2">•</span>
              Tweet with #SOLess hashtag to earn 2 points
            </li>
            <li className="flex items-start">
              <span className="text-sky-400 mr-2">•</span>
              Retweet official @SOLessSystem content to earn 3 points
            </li>
            <li className="flex items-start">
              <span className="text-sky-400 mr-2">•</span>
              Reply to official tweets to earn 1 point
            </li>
          </ul>
        </div>
      </div>
    </div>

    <div className="pt-6">
      <h3 className="text-xl font-semibold text-soless-blue mb-4">
        Daily Limits & Cooldowns
      </h3>
      <div className="bg-black/30 rounded-lg p-5 border border-soless-blue/20">
        <p className="text-gray-300 mb-3">To ensure fair participation:</p>
        <ul className="space-y-2 text-gray-300">
          <li className="flex items-start">
            <Clock className="h-4 w-4 text-soless-blue mt-1 mr-2" />
            Maximum 1000 points can be earned per day across all platforms
          </li>
          <li className="flex items-start">
            <Clock className="h-4 w-4 text-soless-blue mt-1 mr-2" />
            Most activities have cooldown periods before you can earn points
            again
          </li>
          <li className="flex items-start">
            <Clock className="h-4 w-4 text-soless-blue mt-1 mr-2" />
            Some activities have daily limits as shown in the table above
          </li>
          <li className="flex items-start">
            <Clock className="h-4 w-4 text-soless-blue mt-1 mr-2" />
            Streaks require daily activity but have a 1-day grace period
          </li>
        </ul>
      </div>
    </div>
  </div>
);

const ContestsRewardsContent = () => (
  <div className="space-y-6">
    <div>
      <h3 className="text-xl font-semibold text-soless-blue mb-3">
        Current Contest
      </h3>
      <div className="bg-black/30 rounded-lg p-4 border border-green-500/30">
        <h4 className="text-lg font-medium text-green-400 mb-2">
          Spring SOLstice Contest (May 1-31, 2025)
        </h4>
        <ul className="space-y-2 text-gray-300">
          <li className="flex items-start">
            <span className="text-green-400 mr-2">•</span>
            Accumulate points throughout the month of May
          </li>
          <li className="flex items-start">
            <span className="text-green-400 mr-2">•</span>
            Earn exclusive NFTs, SOUL tokens, and USDC prizes
          </li>
          <li className="flex items-start">
            <span className="text-green-400 mr-2">•</span>
            Qualify for different reward tiers based on points earned
          </li>
          <li className="flex items-start">
            <span className="text-green-400 mr-2">•</span>
            Special bonuses for multi-platform engagement
          </li>
        </ul>
      </div>
    </div>

    <div>
      <h3 className="text-xl font-semibold text-soless-blue mb-3">
        Qualification Tiers
      </h3>
      <div className="overflow-x-auto">
        <table className="min-w-full bg-black/30 rounded-lg overflow-hidden">
          <thead className="bg-soless-blue/20 border-b border-soless-blue/30">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-medium text-white">
                Tier
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium text-white">
                Points Required
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium text-white">
                Rewards
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            <tr>
              <td className="px-4 py-3 text-sm text-gray-300">Bronze</td>
              <td className="px-4 py-3 text-sm text-amber-600">500</td>
              <td className="px-4 py-3 text-sm text-gray-300">
                "Spring Seedling" NFT + 50 SOUL tokens
              </td>
            </tr>
            <tr>
              <td className="px-4 py-3 text-sm text-gray-300">Silver</td>
              <td className="px-4 py-3 text-sm text-gray-400">1,500</td>
              <td className="px-4 py-3 text-sm text-gray-300">
                "Spring Bloom" NFT + 150 SOUL tokens
              </td>
            </tr>
            <tr>
              <td className="px-4 py-3 text-sm text-gray-300">Gold</td>
              <td className="px-4 py-3 text-sm text-yellow-500">3,000</td>
              <td className="px-4 py-3 text-sm text-gray-300">
                "Spring Garden" NFT + 300 SOUL tokens + 25 USDC
              </td>
            </tr>
            <tr>
              <td className="px-4 py-3 text-sm text-gray-300">Platinum</td>
              <td className="px-4 py-3 text-sm text-cyan-500">6,000</td>
              <td className="px-4 py-3 text-sm text-gray-300">
                "Spring Paradise" NFT + 600 SOUL tokens + 75 USDC
              </td>
            </tr>
            <tr>
              <td className="px-4 py-3 text-sm text-gray-300">Diamond</td>
              <td className="px-4 py-3 text-sm text-purple-400">10,000</td>
              <td className="px-4 py-3 text-sm text-gray-300">
                "SOLstice Champion" NFT + 1,000 SOUL tokens + 150 USDC
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="mt-6">
        <h4 className="text-lg font-medium text-yellow-500 mb-3">
          Rank Rewards (Additional)
        </h4>
        <ul className="space-y-2 text-gray-300">
          <li className="flex items-start">
            <Trophy className="h-4 w-4 text-yellow-500 mt-1 mr-2" />
            1st Place: 500 USDC + Special Edition 1/1 NFT
          </li>
          <li className="flex items-start">
            <Trophy className="h-4 w-4 text-gray-300 mt-1 mr-2" />
            2nd Place: 250 USDC + Rare NFT
          </li>
          <li className="flex items-start">
            <Trophy className="h-4 w-4 text-amber-600 mt-1 mr-2" />
            3rd Place: 150 USDC + Rare NFT
          </li>
          <li className="flex items-start">
            <Gift className="h-4 w-4 text-soless-blue mt-1 mr-2" />
            4th-10th Place: 50 USDC each
          </li>
        </ul>
      </div>
    </div>

    <div>
      <h3 className="text-xl font-semibold text-soless-blue mb-3">
        Prize Distribution
      </h3>
      <div className="bg-black/30 rounded-lg p-4 border border-soless-blue/20">
        <ul className="space-y-2 text-gray-300">
          <li className="flex items-start">
            <span className="text-soless-blue mr-2">•</span>
            NFT rewards will be distributed within 7 days after contest end
          </li>
          <li className="flex items-start">
            <span className="text-soless-blue mr-2">•</span>
            Token rewards will be distributed within 14 days after contest end
          </li>
          <li className="flex items-start">
            <span className="text-soless-blue mr-2">•</span>
            USDC prizes will be sent to your connected wallet
          </li>
          <li className="flex items-start">
            <span className="text-soless-blue mr-2">•</span>
            All rewards require verification of legitimate engagement
          </li>
        </ul>
      </div>
    </div>
  </div>
);

const ClaimingRewardsContent = () => (
  <div className="space-y-4">
    <p className="text-gray-300">
      Once you've qualified for rewards, follow these steps to claim them:
    </p>

    <ol className="list-decimal list-inside space-y-3 text-gray-300 ml-4">
      <li>
        Visit the{" "}
        <a
          href="https://soless.app/rewards"
          className="text-blue-400 hover:underline"
        >
          SOLess Rewards Dashboard
        </a>{" "}
        after contest end
      </li>
      <li>Connect your verified wallet</li>
      <li>View your qualified rewards</li>
      <li>Click "Claim" for each reward</li>
      <li>Confirm transactions for on-chain rewards</li>
      <li>NFTs will appear in your connected wallet</li>
      <li>Token rewards will be transferred to your wallet</li>
    </ol>

    <div className="mt-6 p-4 bg-black/50 rounded-lg border border-yellow-500/20">
      <p className="text-yellow-400 flex items-center mb-2">
        <Info className="w-5 h-5 mr-2" />
        Important Note
      </p>
      <p className="text-gray-300 text-sm">
        You must claim rewards within 30 days of them becoming available.
      </p>
    </div>
  </div>
);

const LeaderboardsStatsContent = () => (
  <div className="space-y-6">
    <p className="text-gray-300">
      Track your progress and compare with other community members:
    </p>

    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="bg-black/30 rounded-lg p-5 border border-soless-blue/20">
        <h3 className="text-lg font-medium text-soless-blue mb-3 flex items-center">
          <BarChart2 className="w-5 h-5 mr-2" />
          Personal Dashboard
        </h3>
        <ul className="space-y-2 text-gray-300">
          <li>• View your current points</li>
          <li>• Track your daily streaks</li>
          <li>• See recent point history</li>
          <li>• Check qualification progress</li>
        </ul>
      </div>

      <div className="bg-black/30 rounded-lg p-5 border border-soless-blue/20">
        <h3 className="text-lg font-medium text-soless-blue mb-3 flex items-center">
          <Trophy className="w-5 h-5 mr-2" />
          Global Leaderboards
        </h3>
        <ul className="space-y-2 text-gray-300">
          <li>• Overall ranking across all platforms</li>
          <li>• Platform-specific rankings</li>
          <li>• Weekly top performers</li>
          <li>• All-time highest earners</li>
        </ul>
      </div>

      <div className="bg-black/30 rounded-lg p-5 border border-soless-blue/20">
        <h3 className="text-lg font-medium text-soless-blue mb-3 flex items-center">
          <Clock className="w-5 h-5 mr-2" />
          Contest Stats
        </h3>
        <ul className="space-y-2 text-gray-300">
          <li>• Days remaining in current contest</li>
          <li>• Your tier qualification status</li>
          <li>• Distance to next tier</li>
          <li>• Historical contest performance</li>
        </ul>
      </div>
    </div>
  </div>
);

const FAQContent = () => (
  <div className="space-y-6">
    <div className="bg-black/30 rounded-lg p-4 border border-soless-blue/20">
      <h3 className="font-medium text-white mb-2">
        Q: Can I connect multiple wallets to my account?
      </h3>
      <p className="text-gray-300">
        A: No, each user can only have one wallet address associated with their
        account.
      </p>
    </div>

    <div className="bg-black/30 rounded-lg p-4 border border-soless-blue/20">
      <h3 className="font-medium text-white mb-2">
        Q: What happens if I miss a day for my streak?
      </h3>
      <p className="text-gray-300">
        A: You have a 1-day grace period. Missing two consecutive days will
        reset your streak.
      </p>
    </div>

    <div className="bg-black/30 rounded-lg p-4 border border-soless-blue/20">
      <h3 className="font-medium text-white mb-2">
        Q: Are points transferable between users?
      </h3>
      <p className="text-gray-300">
        A: No, points are non-transferable and tied to your account.
      </p>
    </div>

    <div className="bg-black/30 rounded-lg p-4 border border-soless-blue/20">
      <h3 className="font-medium text-white mb-2">
        Q: How can I report suspicious activity?
      </h3>
      <p className="text-gray-300">
        A: Use the "Report" feature on the website or contact a community
        moderator.
      </p>
    </div>

    <div className="bg-black/30 rounded-lg p-4 border border-soless-blue/20">
      <h3 className="font-medium text-white mb-2">
        Q: Can I earn points for past activity?
      </h3>
      <p className="text-gray-300">
        A: No, points are only awarded for activities after your account is
        verified.
      </p>
    </div>

    <div className="bg-black/30 rounded-lg p-4 border border-soless-blue/20">
      <h3 className="font-medium text-white mb-2">Q: Do my points expire?</h3>
      <p className="text-gray-300">
        A: Points accumulated for contests expire after the contest ends, but
        your lifetime points record is maintained.
      </p>
    </div>

    <div className="mt-8 p-5 bg-black/50 rounded-lg border border-soless-blue/20 text-center">
      <p className="text-gray-300">
        For additional questions or support, visit the{" "}
        <a
          href="https://soless.app/help"
          className="text-blue-400 hover:underline"
        >
          Help Center
        </a>{" "}
        or join our{" "}
        <a
          href="https://t.me/SOLessSupport"
          className="text-blue-400 hover:underline"
        >
          Telegram Support Group
        </a>
        .
      </p>
    </div>
  </div>
);

// Main component
export default function CommunityGuide() {
  const [activeTab, setActiveTab] = useState("introduction");

  // Define tabs
  const tabs: GuideTab[] = [
    {
      id: "introduction",
      label: "Introduction",
      icon: Book,
      content: <IntroductionContent />,
    },
    {
      id: "getting-started",
      label: "Getting Started",
      icon: Rocket,
      content: <GettingStartedContent />,
    },
    {
      id: "platform-integration",
      label: "Platform Integration",
      icon: Users,
      content: <PlatformIntegrationContent />,
    },
    {
      id: "earning-points",
      label: "Earning Points",
      icon: Trophy,
      content: <EarningPointsContent />,
    },
    {
      id: "contests-rewards",
      label: "Contests & Rewards",
      icon: Gift,
      content: <ContestsRewardsContent />,
    },
    {
      id: "claiming-rewards",
      label: "Claiming Rewards",
      icon: Wallet,
      content: <ClaimingRewardsContent />,
    },
    {
      id: "leaderboards-stats",
      label: "Leaderboards & Stats",
      icon: BarChart2,
      content: <LeaderboardsStatsContent />,
    },
    { id: "faq", label: "FAQ", icon: HelpCircle, content: <FAQContent /> },
  ];

  const fadeIn = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <div className="bg-black/50 backdrop-blur-lg rounded-lg border border-soless-blue/40 overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-soless-blue/40">
        <h2 className="text-2xl font-bold bg-gradient-to-r from-soless-blue to-green-400 bg-clip-text text-transparent">
          SOLess Community Guide
        </h2>
        <p className="text-gray-400 mt-1">
          Everything you need to know about the SOLess community engagement
          program
        </p>
      </div>

      {/* Navigation Tabs */}
      <div className="flex overflow-x-auto hide-scrollbar p-2 bg-black/50">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 whitespace-nowrap mx-1 ${
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
            {/* Display content for active tab */}
            {tabs.find((tab) => tab.id === activeTab)?.content}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
