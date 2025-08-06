import React, { useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { useAdminAuth } from "../../hooks/useAdminAuth";
import { getAdminWalletConfig } from "../../utils/wallet";
import {
  Shield,
  Wallet,
  CheckCircle2,
  AlertCircle,
  Loader2,
  LogOut,
  Info,
} from "lucide-react";

export interface AdminWalletConnectionProps {
  onAuthenticationSuccess?: () => void;
  onAuthenticationFailure?: (error: string) => void;
  showConfig?: boolean;
}

const AdminWalletConnection: React.FC<AdminWalletConnectionProps> = ({
  onAuthenticationSuccess,
  onAuthenticationFailure,
  showConfig = false,
}) => {
  const { connected, publicKey } = useWallet();
  const {
    isAdminAuthenticated,
    isAdminAuthorized,
    adminUser,
    isAuthenticating,
    authError,
    authenticateAdmin,
    logoutAdmin,
  } = useAdminAuth();

  const [showConfigDetails, setShowConfigDetails] = useState(false);
  const walletConfig = getAdminWalletConfig();

  const handleAuthenticate = async () => {
    const result = await authenticateAdmin();

    if (result.success) {
      onAuthenticationSuccess?.();
    } else {
      onAuthenticationFailure?.(result.error || "Authentication failed");
    }
  };

  const handleLogout = () => {
    logoutAdmin();
  };

  // Show authentication success state
  if (isAdminAuthenticated && adminUser) {
    return (
      <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <CheckCircle2 className="h-6 w-6 text-green-500 mr-3" />
            <h3 className="text-xl font-bold text-green-400">
              Admin Authenticated
            </h3>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center px-3 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded-lg transition-colors"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </button>
        </div>

        <div className="text-gray-300 space-y-2">
          <p>
            <strong>Wallet:</strong> {adminUser.wallet.slice(0, 8)}...
            {adminUser.wallet.slice(-8)}
          </p>
          <p>
            <strong>Platform:</strong> {adminUser.platform}
          </p>
          <p>
            <strong>Authenticated:</strong>{" "}
            {new Date(adminUser.authenticatedAt).toLocaleString()}
          </p>
        </div>
      </div>
    );
  }

  // Show wallet connection and authorization flow
  return (
    <div className="space-y-6">
      {/* Wallet Connection */}
      <div className="bg-black/30 border border-gray-600 rounded-xl p-6">
        <div className="flex items-center mb-4">
          <Wallet className="h-6 w-6 text-blue-400 mr-3" />
          <h3 className="text-xl font-bold text-white">Connect Admin Wallet</h3>
        </div>

        <div className="space-y-4">
          <WalletMultiButton className="!bg-blue-600 hover:!bg-blue-700" />

          {connected && publicKey && (
            <div className="flex items-center text-sm text-gray-400">
              <CheckCircle2 className="h-4 w-4 text-green-500 mr-2" />
              Connected: {publicKey.toBase58().slice(0, 8)}...
              {publicKey.toBase58().slice(-8)}
            </div>
          )}
        </div>
      </div>

      {/* Admin Authorization */}
      {connected && (
        <div
          className={`border rounded-xl p-6 ${
            isAdminAuthorized
              ? "bg-green-500/10 border-green-500/30"
              : "bg-red-500/10 border-red-500/30"
          }`}
        >
          <div className="flex items-center mb-4">
            <Shield
              className={`h-6 w-6 mr-3 ${
                isAdminAuthorized ? "text-green-500" : "text-red-500"
              }`}
            />
            <h3 className="text-xl font-bold text-white">
              Admin Authorization
            </h3>
          </div>

          {isAdminAuthorized ? (
            <div className="space-y-4">
              <div className="flex items-center text-green-400">
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Wallet authorized for admin access
              </div>

              <button
                onClick={handleAuthenticate}
                disabled={isAuthenticating}
                className="bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center"
              >
                {isAuthenticating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Authenticating...
                  </>
                ) : (
                  <>
                    <Shield className="h-4 w-4 mr-2" />
                    Sign Message to Authenticate
                  </>
                )}
              </button>
            </div>
          ) : (
            <div className="flex items-center text-red-400">
              <AlertCircle className="h-4 w-4 mr-2" />
              This wallet is not authorized for admin access
            </div>
          )}

          {authError && (
            <div className="mt-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg">
              <div className="flex items-center text-red-300">
                <AlertCircle className="h-4 w-4 mr-2" />
                {authError}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Configuration Info */}
      {showConfig && (
        <div className="bg-black/30 border border-gray-600 rounded-xl p-6">
          <div
            className="flex items-center justify-between cursor-pointer"
            onClick={() => setShowConfigDetails(!showConfigDetails)}
          >
            <div className="flex items-center">
              <Info className="h-6 w-6 text-blue-400 mr-3" />
              <h3 className="text-xl font-bold text-white">
                Admin Configuration
              </h3>
            </div>
            <button className="text-blue-400 hover:text-blue-300">
              {showConfigDetails ? "Hide" : "Show"} Details
            </button>
          </div>

          {showConfigDetails && (
            <div className="mt-4 space-y-2 text-gray-300">
              <p>
                <strong>Total Admin Wallets:</strong>{" "}
                {walletConfig.totalAdminWallets}
              </p>
              <p>
                <strong>Environment Configured:</strong>{" "}
                {walletConfig.environmentConfigured ? "Yes" : "No"}
              </p>
              <p>
                <strong>Development Mode:</strong>{" "}
                {walletConfig.isDevelopment ? "Yes" : "No"}
              </p>

              {walletConfig.isDevelopment && (
                <div className="mt-4 p-3 bg-yellow-500/20 border border-yellow-500/30 rounded-lg">
                  <p className="text-yellow-300 text-sm">
                    <strong>Development Mode:</strong> Additional debug
                    information is available. Configured admin wallets:{" "}
                    {walletConfig.adminWallets.length}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminWalletConnection;
