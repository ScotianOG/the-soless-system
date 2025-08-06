import { FC, ReactNode, useMemo, useEffect } from "react";
import {
  ConnectionProvider,
  WalletProvider,
  useWallet,
} from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import {
  PhantomWalletAdapter,
  SolflareWalletAdapter,
  AlphaWalletAdapter,
  CoinbaseWalletAdapter,
  LedgerWalletAdapter,
  TorusWalletAdapter,
} from "@solana/wallet-adapter-wallets";

import "@solana/wallet-adapter-react-ui/styles.css";

interface Props {
  children: ReactNode;
}

const PRIVATE_RPC =
  import.meta.env.VITE_SOLANA_RPC_URL || "https://api.mainnet-beta.solana.com";

// Wallet address tracker component
const WalletAddressTracker: FC<{ children: ReactNode }> = ({ children }) => {
  const { publicKey, connected } = useWallet();

  useEffect(() => {
    if (connected && publicKey) {
      localStorage.setItem("walletAddress", publicKey.toBase58());
    } else {
      localStorage.removeItem("walletAddress");
    }
  }, [connected, publicKey]);

  return <>{children}</>;
};

export const WalletContextProvider: FC<Props> = ({ children }) => {
  const endpoint = useMemo(() => PRIVATE_RPC, []);

  const wallets = useMemo(
    () => [
      new PhantomWalletAdapter({
        appName: "SOLess Presale",
        network: "mainnet-beta",
      }),
      new SolflareWalletAdapter(),
      new AlphaWalletAdapter(),
      new CoinbaseWalletAdapter({
        detached: true,
        overrideNavigate: false,
      }),
      new TorusWalletAdapter(),
      new LedgerWalletAdapter(),
    ],
    []
  );

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          <WalletAddressTracker>{children}</WalletAddressTracker>
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
};

export default WalletContextProvider;
