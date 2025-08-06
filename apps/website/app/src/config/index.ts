import { PublicKey } from "@solana/web3.js";
import { Buffer } from "buffer";
window.Buffer = Buffer;

export const config = {
  // Wallet addresses
  TREASURY_WALLET: new PublicKey(
    "3RcJunhg5ciP3UWrUvzeRWDRMiAsSFdMLBFPZXBgWKMo"
  ),

  // Dates
  PRESALE_START: new Date("2024-11-25T12:00:00Z"),
  PRESALE_END: new Date("2024-11-29T23:59:59Z"),

  // Contribution limits
  MIN_CONTRIBUTION: 0.1,
  MAX_CONTRIBUTION: 5,

  // RPC Config
  RPC_ENDPOINT: "https://api.mainnet-beta.solana.com", // Default fallback

  // Environment
  IS_MAINNET: true,

  // Optional backup RPC endpoints
  BACKUP_ENDPOINTS: [
    "https://solana-api.projectserum.com",
    "https://rpc.ankr.com/solana",
  ],
};
