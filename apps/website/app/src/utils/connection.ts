import { Connection, ConnectionConfig } from "@solana/web3.js";

const PRIVATE_RPC =
  "https://solana-mainnet.core.chainstack.com/d758b1882ae4bd577530e643d63f8aa5";

const connectionConfig: ConnectionConfig = {
  commitment: "confirmed",
  disableRetryOnRateLimit: false,
  confirmTransactionInitialTimeout: 30000,
};

class ConnectionManager {
  private connection: Connection;

  constructor() {
    this.connection = new Connection(PRIVATE_RPC, connectionConfig);
  }

  async getCurrentConnection(): Promise<Connection> {
    return this.connection;
  }
}

export const connectionManager = new ConnectionManager();
