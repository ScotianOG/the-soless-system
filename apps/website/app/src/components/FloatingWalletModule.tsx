import { useState } from "react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { motion, AnimatePresence } from "framer-motion";
import { Wallet, ExternalLink, Power, Minimize2, Maximize2 } from "lucide-react";
import { useWallet } from "@solana/wallet-adapter-react";

const FloatingWalletModule = () => {
  const { publicKey, disconnect } = useWallet();
  const [isMinimized, setIsMinimized] = useState(false);

  const moduleVariants = {
    maximized: {
      right: 24,
      top: "10%",
      x: 0,
      width: "18rem",
      opacity: 1
    },
    minimized: {
      right: 24,
      bottom: 24,
      top: "auto",
      x: 0,
      width: "auto",
      opacity: 1
    }
  };

  const MinimizedView = () => (
    <div className="flex items-center gap-2 bg-black/90 backdrop-blur-sm border border-soless-blue/40 rounded-lg p-2">
      <button
        onClick={() => setIsMinimized(false)}
        className="text-gray-400 hover:text-soless-blue transition-colors duration-200 p-1"
        title="Maximize"
      >
        <Maximize2 className="w-5 h-5" />
      </button>
      {publicKey && (
        <button
          onClick={disconnect}
          className="text-gray-400 hover:text-red-400 transition-colors duration-200 p-1"
          title="Disconnect"
        >
          <Power className="w-5 h-5" />
        </button>
      )}
    </div>
  );

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, x: 100 }}
        animate={isMinimized ? "minimized" : "maximized"}
        variants={moduleVariants}
        transition={{ type: "spring", stiffness: 200, damping: 25 }}
        className="fixed z-40"
      >
        {isMinimized ? (
          <MinimizedView />
        ) : (
          <div className="bg-black/90 backdrop-blur-sm border border-soless-blue/40 rounded-xl p-6 shadow-xl">

            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-white">Wallet</h3>
              <button
                onClick={() => setIsMinimized(true)}
                className="text-gray-400 hover:text-soless-blue transition-colors duration-200"
                title="Minimize"
              >
                <Minimize2 className="w-5 h-5" />
              </button>
            </div>
            
            {!publicKey ? (
              // Not Connected State - Centered Content
              <div className="flex flex-col items-center justify-center min-h-[220px]">
                <div className="w-12 h-12 rounded-full bg-soless-blue/20 flex items-center justify-center mb-4">
                  <Wallet className="w-6 h-6 text-soless-blue" />
                </div>
                
                <h3 className="text-lg font-medium text-center text-white mb-2">
                  Connect Wallet
                </h3>
                
                <p className="text-sm text-center text-gray-400 mb-6">
                  Connect your Solana wallet to access The SOLess System's Spring SOLstice Contest
                </p>
                
                <WalletMultiButton className="w-full !bg-gradient-to-r !from-soless-blue !to-purple-500 
                  hover:!from-soless-blue/80 hover:!to-purple-500/80 !py-3 !rounded-lg
                  transition-all duration-200 hover:shadow-lg hover:shadow-purple-500/20 mb-4" 
                />
                
                <p className="text-xs text-center text-gray-500">
                  New to Solana? {" "}
                  <a 
                    href="https://phantom.app" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-soless-blue hover:text-blue-400"
                  >
                    Get a wallet →
                  </a>
                </p>
              </div>
            ) : (
              // Connected State
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center">
                      <div className="w-3 h-3 rounded-full bg-green-500" />
                    </div>
                    <span className="text-sm font-medium text-green-400">Connected</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => setIsMinimized(true)}
                      className="text-gray-400 hover:text-soless-blue transition-colors duration-200"
                      title="Minimize"
                    >
                      <Minimize2 className="w-5 h-5" />
                    </button>
                    <button
                      onClick={disconnect}
                      className="text-gray-400 hover:text-red-400 transition-colors duration-200"
                      title="Disconnect"
                    >
                      <Power className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                <div className="bg-black/50 rounded-lg p-3 border border-soless-blue/20">
                  <p className="text-xs text-gray-400 mb-1">Connected Wallet</p>
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-white font-mono">
                      {publicKey.toString().slice(0, 4)}...{publicKey.toString().slice(-4)}
                    </p>
                    <a
                      href={`https://solscan.io/account/${publicKey.toString()}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-soless-blue hover:text-blue-400 transition-colors duration-200"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                </div>

                <div className="pt-2">
                  <WalletMultiButton className="w-full !bg-gradient-to-r !from-soless-blue !to-purple-500 
                    hover:!from-soless-blue/80 hover:!to-purple-500/80 !py-2.5 !rounded-lg
                    transition-all duration-200 hover:shadow-lg hover:shadow-purple-500/20" 
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
};

export default FloatingWalletModule;
