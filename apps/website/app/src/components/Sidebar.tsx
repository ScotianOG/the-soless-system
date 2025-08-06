import { useState, useRef, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { useWallet } from "@solana/wallet-adapter-react";
import {
  MessageCircle,
  BookOpen,
  Menu,
  X,
  Home,
  RefreshCw,
  Users,
  Zap,
  Trophy,
  Code,
  ChevronsLeft,
  ChevronsRight,
  Search,
} from "lucide-react";

const Sidebar = () => {
  const { publicKey } = useWallet();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false); // Hidden by default on mobile
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Array<any>>([]);

  // Check if connected wallet is admin
  const isAdmin =
    publicKey?.toBase58() === "8rYNzisESAJZAJGZiyosNkVb1tbrWhsgQkLgavj6Ytyj";

  const navigationItems = [
    {
      path: "/",
      label: "Home",
      icon: "/assets/icons/blue-head-24x24.png",
      className: "text-white",
    },
    {
      path: "/swap",
      label: "SOLessSwap",
      icon: "/assets/icons/blue-head-24x24.png",
      className: "text-soless-blue",
    },
    {
      path: "/solspace",
      label: "SOLspace",
      icon: "/assets/icons/blue-head-24x24.png",
      className: "text-soless-blue",
    },
    {
      path: "/solarium",
      label: "SOLarium",
      icon: "/assets/icons/blue-head-24x24.png",
      className: "text-soless-blue",
    },
    {
      path: "/soulie",
      label: "Soulie Bot",
      icon: "/assets/icons/blue-head-24x24.png",
      className: "text-pink-400",
    },
    {
      path: "/community",
      label: "SOLstice Contest",
      icon: "/assets/icons/blue-head-24x24.png",
      className: "text-green-400",
    },
    {
      path: "/beta-signup",
      label: "Beta Tester Signup",
      icon: "/assets/icons/blue-head-24x24.png",
      className: "text-yellow-400",
    },
    {
      path: "/founders-collection",
      label: "Founder's Club",
      icon: "/assets/icons/blue-head-24x24.png",
      className: "text-purple-400",
    },
    ...(isAdmin
      ? [
          {
            path: "/admin",
            label: "ADMIN",
            icon: "/assets/icons/logo-icon-24x24.png",
            className: "text-purple-400",
          },
        ]
      : []),
  ];

  // Handle search functionality
  const handleSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && searchQuery.trim()) {
      // Filter navigation items based on search query
      const results = navigationItems.filter((item) =>
        item.label.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setSearchResults(results);
    }
  };

  // Clear search results
  const clearSearch = () => {
    setSearchQuery("");
    setSearchResults([]);
  };

  // Close mobile sidebar on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  // Handle mobile sidebar toggle
  const toggleMobile = () => {
    setMobileOpen(!mobileOpen);
  };

  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile menu button */}
      <button
        onClick={toggleMobile}
        className="fixed top-4 left-4 z-50 md:hidden bg-black/80 backdrop-blur-lg border border-soless-blue/40 rounded-lg p-2 text-white hover:bg-black/90 transition-colors"
      >
        {mobileOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex flex-col bg-black/80 backdrop-blur-lg border-r border-soless-blue/40 transition-all duration-300 
          ${mobileOpen ? "translate-x-0" : "-translate-x-full"} 
          md:translate-x-0 
          ${collapsed ? "md:w-16" : "md:w-64"} 
          w-64`}
      >
        <div className="flex justify-between items-center p-4 border-b border-soless-blue/40">
          {!collapsed && (
            <Link to="/" className="flex items-center">
              <img
                src="/assets/images/logo.png"
                alt="SOLess Logo"
                className="h-8 w-auto"
              />
            </Link>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className={`rounded-full p-2 bg-black/50 text-white hover:bg-black/70 transition-colors ${
              collapsed ? "mx-auto" : ""
            } hidden md:block`}
          >
            {collapsed ? (
              <ChevronsRight size={16} />
            ) : (
              <ChevronsLeft size={16} />
            )}
          </button>
        </div>

        {/* Navigation Links */}
        <div className="flex flex-col flex-1 overflow-y-auto py-4 px-3 space-y-1.5">
          {/* Show search results if any, otherwise show all navigation items */}
          {searchResults.length > 0 ? (
            <>
              {/* Search results header */}
              {!collapsed && (
                <div className="px-4 py-2 flex justify-between">
                  <span className="text-xs text-gray-400">Search Results</span>
                  <button
                    onClick={clearSearch}
                    className="text-xs text-soless-blue hover:underline"
                  >
                    Clear
                  </button>
                </div>
              )}

              {/* Search results */}
              {searchResults.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => {
                      clearSearch();
                      setMobileOpen(false);
                    }}
                    className={`flex items-center py-3 ${
                      collapsed ? "md:justify-center md:px-2" : "px-4 space-x-3"
                    } 
                    ${
                      isActive
                        ? "bg-gradient-to-r from-black/50 to-soless-blue/30 border-r-4 border-soless-blue shadow-lg"
                        : "hover:bg-black/50 hover:border-r-4 hover:border-soless-blue/50"
                    } 
                    rounded-lg transition-all duration-200 ${
                      item.className || "text-gray-300"
                    }`}
                    title={collapsed ? item.label : ""}
                  >
                    <div
                      className={`${
                        isActive ? "bg-soless-blue/20" : "bg-black/30"
                      } p-2 rounded-lg`}
                    >
                      <img
                        src={item.icon}
                        alt={item.label}
                        className="h-5 w-5 flex-shrink-0"
                      />
                    </div>
                    {!collapsed && (
                      <span className="font-medium">{item.label}</span>
                    )}
                  </Link>
                );
              })}
            </>
          ) : (
            // Regular navigation items
            navigationItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-start py-3 ${
                    collapsed ? "md:justify-center md:px-2" : "px-4 space-x-3"
                  } 
                  ${
                    isActive
                      ? "bg-gradient-to-r from-black/50 to-soless-blue/30 border-r-4 border-soless-blue shadow-lg"
                      : "hover:bg-black/50 hover:border-r-4 hover:border-soless-blue/50"
                  } 
                  rounded-lg transition-all duration-200 ${
                    item.className || "text-gray-300"
                  }`}
                  title={collapsed ? item.label : ""}
                >
                  {" "}
                  <div
                    className={`${
                      isActive ? "bg-soless-blue/20" : "bg-black/30"
                    } p-2 rounded-lg flex items-center justify-center flex-shrink-0`}
                  >
                    <img
                      src={item.icon}
                      alt={item.label}
                      className="h-5 w-5 object-contain"
                    />
                  </div>{" "}
                  {!collapsed && (
                    <span className="font-medium pt-0.5 leading-tight">
                      {item.label}
                    </span>
                  )}
                </Link>
              );
            })
          )}
        </div>

        {/* Mini Soulie Chat Interface - Hidden on mobile when sidebar is collapsed */}
        <div
          className={`mt-auto pt-4 px-3 border-t border-soless-blue/40 ${
            collapsed ? "hidden md:block" : ""
          }`}
        >
          {!collapsed ? (
            <div className="bg-black/50 border border-soless-blue/30 rounded-lg p-3 mb-3">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center">
                  <div className="mr-2">
                    <img
                      src="/assets/icons/blue-head-24x24.png"
                      alt="SOLess"
                      className="h-6 w-6"
                    />
                  </div>
                  <span className="text-sm font-medium text-soless-blue">
                    SOLess Ecosystem
                  </span>
                </div>
                <Link
                  to="/soulie"
                  className="text-xs text-soless-blue hover:underline"
                >
                  Visit Soulie
                </Link>
              </div>
              <p className="text-xs text-gray-400 mb-2">
                Need help? Visit our AI assistant Soulie for guidance on the
                SOLess ecosystem.
              </p>
            </div>
          ) : (
            <div className="mb-3 flex justify-center">
              <Link to="/soulie">
                <div className="relative">
                  <img
                    src="/assets/icons/blue-head-24x24.png"
                    alt="Soulie"
                    className="h-8 w-8"
                  />
                  <span className="absolute -top-1 -right-1 h-3 w-3 bg-soless-blue rounded-full"></span>
                </div>
              </Link>
            </div>
          )}
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
