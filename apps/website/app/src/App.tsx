// app/src/App.tsx
import { BrowserRouter } from "react-router-dom";
import WalletContextProvider from "./components/WalletContextProvider";
import routes from "./routes";
import Navbar from "./components/Navbar";
import Sidebar from "./components/Sidebar";
import { useRoutes } from "react-router-dom";
import { Suspense } from "react";
import ErrorBoundary from "./components/ErrorBoundary";
import FloatingWalletModule from "./components/FloatingWalletModule";
import DocumentTitle from "./components/DocumentTitle";

const LoadingSpinner = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="text-soless-blue animate-spin">Loading...</div>
  </div>
);

const AppRoutes = () => {
  const element = useRoutes(routes);

  if (!element) {
    return <div>Page not found</div>;
  }

  return <Suspense fallback={<LoadingSpinner />}>{element}</Suspense>;
};

function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <WalletContextProvider>
          {" "}
          {/* Updated this line */}
          <div className="min-h-screen bg-black font-space text-white">
            <DocumentTitle />
            <Navbar />
            <Sidebar /> <FloatingWalletModule />
            <main className="pt-16 pl-0 md:pl-16 lg:pl-64 transition-all duration-300">
              <div className="p-4">
                <AppRoutes />
              </div>
            </main>
          </div>
        </WalletContextProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;
