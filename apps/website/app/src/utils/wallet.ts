// Admin wallet configuration with environment variable support
// This supports both hardcoded wallets and environment-based configuration
export const ADMIN_WALLETS = [
  // Environment-configured admin wallets (preferred)
  import.meta.env.VITE_SOLESS_ADMIN_WALLET_1,
  import.meta.env.VITE_SOLESS_ADMIN_WALLET_2,
  import.meta.env.VITE_ADMIN_WALLET_1,
  import.meta.env.VITE_ADMIN_WALLET_2,

  // Development fallback
  import.meta.env.VITE_DEV_ADMIN_WALLET,

  // Hardcoded fallbacks (for backward compatibility)
  "8rYNzisESAJZAJGZiyosNkVb1tbrWhsgQkLgavj6Ytyj", // Your wallet
  "EJPvo6CPGC8Pj9p25zdyXqipQac4Bt1RXn9X4fQ9XnC4", // Add more admin wallets here

  // Development testing wallet
  "9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM",
].filter(Boolean); // Remove any undefined values

export const isAdminWallet = (address: string | undefined) => {
  if (!address) return false;
  return ADMIN_WALLETS.includes(address);
};

// Enhanced admin validation with logging
export const validateAdminAccess = (address: string | undefined): boolean => {
  const isAdmin = isAdminWallet(address);

  if (import.meta.env.NODE_ENV === "development") {
    console.log(
      `Admin validation for ${address}: ${isAdmin ? "GRANTED" : "DENIED"}`
    );
    console.log("Available admin wallets:", ADMIN_WALLETS);
  }

  return isAdmin;
};

// Get admin wallet configuration info
export const getAdminWalletConfig = () => {
  return {
    totalAdminWallets: ADMIN_WALLETS.length,
    adminWallets: ADMIN_WALLETS,
    environmentConfigured: !!(
      import.meta.env.VITE_SOLESS_ADMIN_WALLET_1 ||
      import.meta.env.VITE_ADMIN_WALLET_1
    ),
    isDevelopment: import.meta.env.NODE_ENV === "development",
  };
};
