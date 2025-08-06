// app/src/routes/index.tsx
import { RouteObject } from "react-router-dom";
import Home from "../pages/Home";
import Presale from "../pages/Presale";
import SOLspace from "../pages/Solspace";
import Solarium from "../pages/Solarium";
import Swap from "../pages/Swap";
import Admin from "../pages/Admin";
import Documentation from "../pages/Documentation";
import DocumentReader from "../pages/DocumentReader";
import PioneerPartnership from "../pages/pioneer-partnership";
import MarketingApplicationForm from "../pages/MarketingApplicationForm";
import FoundersCollection from "../pages/FoundersCollection";
import TradingBotAccess from "../pages/TradingBotAccess";
import MintPage from "../pages/MintPage";
import NFTRewardsPage from "../pages/NFT-Benefits";
import Community from "../pages/Community";
import CommunityPreview from "../pages/CommunityPreview";
import Register from "../pages/Register";
import LiquidityPage from "../components/LiquidityPage";
import SouliePage from "../pages/Soulie";
import SolspaceVisualization from "../pages/SolspaceVisualization";
import BetaTesterSignup from "../pages/BetaTesterSignup";

const routes: RouteObject[] = [
  {
    path: "/",
    element: <Home />,
  },
  {
    path: "/presale",
    element: <Presale />,
  },
  {
    path: "/solspace",
    element: <SOLspace />,
  },
  {
    path: "/solarium",
    element: <Solarium />,
  },
  {
    path: "/swap",
    element: <Swap />,
  },
  {
    path: "/docs",
    element: <Documentation />,
  },
  {
    path: "/docs/:docId",
    element: <DocumentReader />,
  },
  {
    path: "/admin",
    element: <Admin />,
  },
  {
    path: "/pioneer-partnership",
    element: <PioneerPartnership />,
  },
  {
    path: "/marketing-application",
    element: <MarketingApplicationForm />,
  },
  {
    path: "/founders-collection",
    element: <FoundersCollection />,
  },
  {
    path: "/trading-bot-access",
    element: <TradingBotAccess />,
  },
  {
    path: "/mint",
    element: <MintPage />,
  },
  {
    path: "/NFT-Benefits",
    element: <NFTRewardsPage />,
  },
  {
    path: "/community",
    element: <Community />,
  },
  {
    path: "/register",
    element: <Register />,
  },
  {
    path: "/liquidity",
    element: <LiquidityPage />,
  },
  {
    path: "/soulie",
    element: <SouliePage />,
  },
  {
    path: "/solspace-system",
    element: <SolspaceVisualization />,
  },
  {
    path: "/community-preview",
    element: <CommunityPreview />,
  },
  {
    path: "/beta-signup",
    element: <BetaTesterSignup />,
  },
];

export default routes;
