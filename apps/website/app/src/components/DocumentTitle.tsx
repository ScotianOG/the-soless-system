import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

// Map routes to their respective titles
const routeTitles: Record<string, string> = {
  '/': 'Home',
  '/swap': 'SOLessSwap',
  '/solspace': 'SOLspace',
  '/solarium': 'SOLarium',
  '/founders-collection': 'Founders Collection',
  '/pioneer-partnership': 'Partner Program',
  '/community': 'Spring SOLstice Contest',
  '/liquidity': 'Liquidity Staking',
  '/soulie': 'Soulie Bot',
  '/docs': 'Documentation',
  '/admin': 'Admin',
  '/presale': 'Presale',
  '/marketing-application': 'Marketing Application',
  '/trading-bot-access': 'Trading Bot Access',
  '/mint': 'Mint',
  '/NFT-Benefits': 'NFT Benefits',
  '/register': 'Register',
};

const DocumentTitle = () => {
  const location = useLocation();
  
  useEffect(() => {
    // Get the title for the current path, or use a default if not found
    const pageTitle = routeTitles[location.pathname] || 'Page';
    
    // Set the document title with the SOLess brand prefix
    document.title = `SOLess | ${pageTitle}`;
  }, [location.pathname]);
  
  // This component doesn't render anything
  return null;
};

export default DocumentTitle;
