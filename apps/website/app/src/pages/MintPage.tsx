// src/pages/MintPage.tsx
import React, { useState, useEffect } from "react";
import AuctionModal from "../components/AuctionModal";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import { AlertTriangle, Info, ArrowRight, ExternalLink } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "../components/ui/alert";
import { Button } from "../components/ui/button";

const NFT_PRICE = 0.25;
const MAX_PER_TX = 5;
const MAX_PER_WALLET = 10;
const TOTAL_3D_NFTS = 30;
const MINT_3D_NFTS = 15;

interface Auction {
  id: number;
  image: string;
  currentBid: number;
  timeLeft: string;
  bids: number;
  mintedPartnerId: number;
}

const MintPage = () => {
  const { connection } = useConnection();
  const { publicKey, signTransaction } = useWallet();
  const [mintCount, setMintCount] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [mintedCount, setMintedCount] = useState(0);
  const [threeDNFTs, setThreeDNFTs] = useState(Array(TOTAL_3D_NFTS).fill(null));
  const [error, setError] = useState("");
  const [isMintLive, setIsMintLive] = useState(false);
  const [selectedAuction, setSelectedAuction] = useState<Auction | null>(null);

  useEffect(() => {
    document.title = "SOLess | Mint";
  }, []);

  // Demo data
  const DEMO_LIVE_AUCTIONS = [17, 19, 21]; // Partner NFTs available for auction
  const DEMO_MINTED_NFTS = [2, 4, 6]; // NFTs that have been minted

  const [activeAuctions] = useState<Auction[]>([
    {
      id: 17,
      image: "/assets/images/liveauction2.png",
      currentBid: 2.5,
      timeLeft: "12h 30m",
      bids: 5,
      mintedPartnerId: 2,
    },
    {
      id: 19,
      image: "/assets/images/liveauction2.png",
      currentBid: 1.8,
      timeLeft: "6h 45m",
      bids: 3,
      mintedPartnerId: 4,
    },
    {
      id: 21,
      image: "/assets/images/liveauction2.png",
      currentBid: 3.2,
      timeLeft: "2h 15m",
      bids: 8,
      mintedPartnerId: 6,
    },
  ]);

  useEffect(() => {
    const fetchMintState = async () => {
      try {
        // TODO: Implement contract state fetching
        setMintedCount(0);
        setIsMintLive(false);
      } catch (err) {
        console.error("Error fetching mint state:", err);
      }
    };

    fetchMintState();
    const interval = setInterval(fetchMintState, 10000);
    return () => clearInterval(interval);
  }, [connection]);

  const handleMint = async () => {
    if (!publicKey || !signTransaction) {
      setError("Please connect your wallet");
      return;
    }

    if (!isMintLive) {
      setError("Minting is not live yet");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      // TODO: Implement mint transaction
    } catch (err) {
      console.error("Mint error:", err);
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError(String(err));
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Hero section */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-black to-soless-blue/30 mb-8">
        <div className="absolute inset-0 bg-[url('/assets/images/grid-pattern.svg')] opacity-20"></div>
        <div className="relative z-10 p-8">
          <div className="max-w-3xl">
            <h1 className="text-4xl font-bold mb-4 text-white">
              SOLess <span className="text-soless-blue">NFT Mint</span>
            </h1>
            <p className="text-xl text-gray-300 mb-6">
              Mint your exclusive SOLess NFT with guaranteed utility and
              liquidity backing.
            </p>
            <div className="flex flex-wrap gap-4">
              <a
                href="/founders-collection"
                className="bg-soless-blue hover:bg-soless-blue/80 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center"
              >
                Founders Collection <ArrowRight className="ml-2 h-4 w-4" />
              </a>
              <a
                href="/NFT-Benefits"
                className="bg-black/50 border border-soless-blue text-white hover:bg-black/70 px-6 py-3 rounded-lg font-medium transition-colors flex items-center"
              >
                NFT Benefits <ArrowRight className="ml-2 h-4 w-4" />
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Mint Status Banner */}
      {!isMintLive && (
        <Alert className="mb-8 bg-black/30 border border-soless-blue/40">
          <Info className="h-4 w-4" />
          <AlertTitle>Mint Not Live</AlertTitle>
          <AlertDescription>
            The mint will start soon. Follow our social media for the
            announcement.
          </AlertDescription>
        </Alert>
      )}

      {/* Mint Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-black/30 p-6 rounded-xl border border-soless-blue/40 text-center">
          <p className="text-2xl font-bold text-soless-blue">
            {mintedCount}/3000
          </p>
          <p className="text-gray-300">NFTs Minted</p>
        </div>
        <div className="bg-black/30 p-6 rounded-xl border border-soless-blue/40 text-center">
          <p className="text-2xl font-bold text-soless-blue">{NFT_PRICE} SOL</p>
          <p className="text-gray-300">Price Per NFT</p>
        </div>
        <div className="bg-black/30 p-6 rounded-xl border border-soless-blue/40 text-center">
          <p className="text-2xl font-bold text-soless-blue">12,500 $SOUL</p>
          <p className="text-gray-300">Guaranteed Floor</p>
        </div>
      </div>

      {/* Mint Interface */}
      <div className="bg-black/30 p-8 rounded-xl border border-soless-blue/40 mb-8">
        {!publicKey ? (
          <div className="text-center">
            <p className="text-xl text-gray-300 mb-4">
              Connect your wallet to mint
            </p>
            <WalletMultiButton className="!bg-gradient-to-r !from-soless-blue !to-soless-purple hover:!opacity-90" />
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center justify-center space-x-4">
              <Button
                onClick={() => setMintCount(Math.max(1, mintCount - 1))}
                className="bg-black/50 hover:bg-black/70"
                disabled={!isMintLive}
              >
                -
              </Button>
              <span className="text-2xl font-bold text-white">{mintCount}</span>
              <Button
                onClick={() =>
                  setMintCount(Math.min(MAX_PER_TX, mintCount + 1))
                }
                className="bg-black/50 hover:bg-black/70"
                disabled={!isMintLive}
              >
                +
              </Button>
            </div>

            <div className="text-center">
              <p className="text-gray-300">
                Total: {(NFT_PRICE * mintCount).toFixed(2)} SOL
              </p>
            </div>

            <Button
              onClick={handleMint}
              disabled={isLoading || !isMintLive}
              className="w-full bg-gradient-to-r from-soless-blue to-soless-purple hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {isLoading
                ? "Minting..."
                : isMintLive
                ? "Mint Now"
                : "Mint Not Live"}
            </Button>

            {error && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </div>
        )}
      </div>

      {/* Gallery Sections */}
      <div className="space-y-8">
        {/* Available for Mint */}
        <div className="bg-black/30 p-8 rounded-xl border border-soless-blue/40">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-soless-blue mb-2">
              Available for Mint
            </h2>
            <div className="bg-black/50 p-4 rounded-lg border border-soless-blue/20 mb-4">
              <p className="text-gray-300">
                The first 15 3D NFTs are available for direct minting. Each NFT
                is unique and comes with exclusive benefits.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {Array(MINT_3D_NFTS)
              .fill(null)
              .map((_, index) => (
                <div
                  key={index}
                  className="aspect-square bg-black/50 rounded-lg border border-soless-blue/20 flex items-center justify-center relative group"
                >
                  {DEMO_MINTED_NFTS.includes(index) ? (
                    <img
                      src="/assets/images/liveauction.png"
                      alt="Minted NFT"
                      className="w-full h-full object-cover rounded-lg"
                    />
                  ) : (
                    <img
                      src="/assets/images/unrevealed.png"
                      alt="Unrevealed NFT"
                      className="w-full h-full object-cover rounded-lg"
                    />
                  )}

                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                    <p className="text-white text-sm">
                      {DEMO_MINTED_NFTS.includes(index)
                        ? "Minted NFT"
                        : "Available for Mint"}
                    </p>
                  </div>
                </div>
              ))}
          </div>
        </div>

        {/* Partner NFTs */}
        <div className="bg-black/30 p-8 rounded-xl border border-soless-blue/40">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-soless-blue mb-2">
              Partner NFTs
            </h2>
            <div className="bg-black/50 p-4 rounded-lg border border-soless-blue/20 mb-4">
              <p className="text-gray-300">
                When an NFT is minted, its matching partner will begin a 24-hour
                auction. Click on available auctions to place your bid.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {Array(MINT_3D_NFTS)
              .fill(null)
              .map((_, index) => {
                const actualIndex = index + MINT_3D_NFTS;
                const auction = activeAuctions.find(
                  (a) => a.id === actualIndex
                );

                return (
                  <div
                    key={actualIndex}
                    className="aspect-square bg-black/50 rounded-lg border border-soless-blue/20 flex items-center justify-center relative group cursor-pointer"
                    onClick={() => auction && setSelectedAuction(auction)}
                  >
                    {DEMO_LIVE_AUCTIONS.includes(actualIndex) ? (
                      <>
                        <img
                          src="/assets/images/liveauction2.png"
                          alt="Live Auction NFT"
                          className="w-full h-full object-cover rounded-lg"
                        />
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-r from-purple-500/80 to-soless-purple/80 p-2 text-center text-sm text-white rounded-b-lg">
                          <span className="font-semibold">Live Auction</span>
                          <span className="text-xs block">
                            Current Bid: {auction?.currentBid} SOL
                          </span>
                        </div>
                      </>
                    ) : (
                      <div className="text-gray-500 text-4xl font-bold">?</div>
                    )}

                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                      <p className="text-white text-sm">
                        {DEMO_LIVE_AUCTIONS.includes(actualIndex)
                          ? "Click to View Auction"
                          : "Future Auction"}
                      </p>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      </div>

      {/* Auction Modal */}
      {selectedAuction && (
        <AuctionModal
          auction={selectedAuction}
          onClose={() => setSelectedAuction(null)}
        />
      )}
    </div>
  );
};

export default MintPage;
