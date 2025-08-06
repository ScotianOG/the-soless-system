import React from "react";
import { Button } from "./ui/button";

interface Auction {
  id: number;
  image: string;
  currentBid: number;
  timeLeft: string;
  bids: number;
  mintedPartnerId: number;
}

interface AuctionModalProps {
  auction: Auction | null;
  onClose: () => void;
}

const AuctionModal: React.FC<AuctionModalProps> = ({ auction, onClose }) => {
  if (!auction) return null;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-black/90 p-8 rounded-xl border border-purple-500/40 max-w-lg w-full relative" onClick={e => e.stopPropagation()}>
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white"
        >
          ✕
        </button>
        
        <div className="mb-6 relative">
          <img
            src="/assets/images/liveauction2.png"
            alt={`Auction NFT ${auction.id}`}
            className="w-full aspect-square object-cover rounded-lg"
          />
          <div className="absolute top-2 right-2 bg-purple-500 text-white px-3 py-1 rounded-full text-sm">
            #{auction.id}
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-gray-400">Current Bid:</span>
            <span className="text-purple-400 font-bold text-lg">
              {auction.currentBid} SOL
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-400">Time Left:</span>
            <span className="text-purple-400">{auction.timeLeft}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-400">Total Bids:</span>
            <span className="text-purple-400">{auction.bids}</span>
          </div>
          <Button className="w-full bg-gradient-to-r from-purple-500 to-soless-purple hover:opacity-90 mt-2">
            Place Bid
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AuctionModal;
