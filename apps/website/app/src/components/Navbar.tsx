import { Link } from "react-router-dom";
import { useWallet } from "@solana/wallet-adapter-react";
import {
  BellRing,
  MessageCircle,
  Search,
  Menu,
  Twitter,
  Book,
  ShieldAlert,
} from "lucide-react";
import { FaReddit, FaTiktok } from "react-icons/fa";
import { useState } from "react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { isAdminWallet } from "../utils/wallet";

const Navbar = () => {
  const { publicKey } = useWallet();
  const isAdmin = isAdminWallet(publicKey?.toBase58());
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Placeholder for notifications
  const notifications = [
    { id: 1, text: "New platform update available", isNew: true },
    { id: 2, text: "Spring SOLstice Contest starts soon", isNew: true },
    { id: 3, text: "Your liquidity stake is active", isNew: false },
  ];

  // Toggle mobile sidebar function that would be implemented in Sidebar
  const toggleMobileSidebar = () => {
    // This would dispatch an event or use context to toggle the sidebar
    const event = new CustomEvent("toggle-mobile-sidebar");
    window.dispatchEvent(event);
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-black/50 backdrop-blur-lg border-b border-soless-blue/40 h-16">
      <div className="flex items-center justify-between h-full px-4 md:px-6">
        {/* Left section - Mobile menu toggle and logo */}
        <div className="flex items-center">
          <button
            onClick={toggleMobileSidebar}
            className="inline-flex items-center justify-center p-2 mr-2 rounded-md text-gray-400 hover:text-white md:hidden"
          >
            <Menu className="h-6 w-6" />
          </button>
          <Link
            to="/"
            className="flex items-center transition-transform duration-200 hover:scale-105 ml-16 md:ml-0"
          >
            <img
              src="/assets/images/word-banner-bright-blank.png"
              alt="SOLess Logo"
              className="h-8 w-auto"
            />
          </Link>
        </div>

        {/* Center - Nav Links */}
        <div className="hidden md:flex flex-1 justify-center items-center mx-4 space-x-3">
          <Link
            to="/swap"
            className="px-4 py-2 rounded-lg hover:bg-soless-blue/20 text-soless-blue font-semibold text-lg transition-colors font-['Montserrat',sans-serif] tracking-wide"
          >
            SOLess Swap
          </Link>
          <Link
            to="/solspace"
            className="px-4 py-2 rounded-lg hover:bg-soless-blue/20 text-soless-blue font-semibold text-lg transition-colors font-['Montserrat',sans-serif] tracking-wide"
          >
            SOLspace
          </Link>
          <Link
            to="/solarium"
            className="px-4 py-2 rounded-lg hover:bg-soless-blue/20 text-soless-blue font-semibold text-lg transition-colors font-['Montserrat',sans-serif] tracking-wide"
          >
            SOLarium
          </Link>
        </div>

        {/* Right section - Social links, admin, wallet */}
        <div className="flex items-center space-x-4">
          {/* Social Links */}
          <div className="hidden md:flex items-center space-x-3">
            <a
              href="https://x.com/SOLessSystem"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-300 hover:text-white transition-colors duration-200"
            >
              <Twitter className="h-5 w-5" />
            </a>
            <a
              href="https://t.me/SolessSystem"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-300 hover:text-white transition-colors duration-200"
            >
              <MessageCircle className="h-5 w-5" />
            </a>
            <a
              href="https://reddit.com/r/soless"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-300 hover:text-white transition-colors duration-200"
            >
              <FaReddit size={20} />
            </a>
            <a
              href="https://medium.com/@team_94982"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-300 hover:text-white transition-colors duration-200"
            >
              <Book className="h-5 w-5" />
            </a>
          </div>

          {/* Admin link when admin wallet is connected */}
          {isAdmin && (
            <Link
              to="/admin"
              className="flex items-center text-purple-400 hover:text-purple-300 bg-black/30 rounded-lg px-3 py-1 mr-2 transition-colors"
            >
              <ShieldAlert className="h-4 w-4 mr-1" />
              <span className="text-sm font-medium">Admin</span>
            </Link>
          )}

          {/* Wallet connection button */}
          <WalletMultiButton />
        </div>
      </div>

      {/* Mobile search bar */}
      {isSearchOpen && (
        <div className="md:hidden px-4 py-2 bg-black/90 border-t border-soless-blue/30">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="text"
              className="w-full bg-gray-900/70 border border-soless-blue/30 text-white rounded-lg pl-10 pr-4 py-2 focus:outline-none focus:ring-2 focus:ring-soless-blue/50"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
