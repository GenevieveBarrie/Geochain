import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Navbar } from "./components/Navbar";
import { Footer } from "./components/Footer";
import { Dashboard } from "./pages/Dashboard";
import { Play } from "./pages/Play";
import { Result } from "./pages/Result";
import { Leaderboard } from "./pages/Leaderboard";
import { Badges } from "./pages/Badges";
import { Records } from "./pages/Records";
import { RecordDetail } from "./pages/RecordDetail";
import { useMetaMask } from "../web3/metamask/useMetaMask";
import { useFhevm } from "../web3/fhevm/useFhevm";
import { useInMemoryStorage } from "../web3/hooks/useInMemoryStorage";

export default function App() {
  const { storage: fhevmDecryptionSignatureStorage } = useInMemoryStorage();
  const {
    provider,
    chainId,
    accounts,
    isConnected,
    connect,
    disconnect,
    ethersSigner,
    ethersReadonlyProvider,
    sameChain,
    sameSigner,
    initialMockChains,
  } = useMetaMask();

  const {
    instance: fhevmInstance,
    status: fhevmStatus,
    error: fhevmError,
  } = useFhevm({
    provider,
    chainId,
    initialMockChains,
    enabled: true,
  });

  return (
    <Router>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex flex-col">
        <Navbar
          isConnected={isConnected}
          account={accounts?.[0]}
          chainId={chainId}
          onConnect={connect}
          onDisconnect={disconnect}
        />
        <main className="flex-1 container mx-auto px-4 py-8 max-w-7xl">
          <Routes>
            <Route
              path="/"
              element={
                <Dashboard
                  isConnected={isConnected}
                  account={accounts?.[0]}
                  fhevmInstance={fhevmInstance}
                  fhevmStatus={fhevmStatus}
                  ethersSigner={ethersSigner}
                  ethersReadonlyProvider={ethersReadonlyProvider}
                  chainId={chainId}
                  sameChain={sameChain}
                  sameSigner={sameSigner}
                />
              }
            />
            <Route
              path="/play"
              element={
                <Play
                  isConnected={isConnected}
                  fhevmInstance={fhevmInstance}
                  ethersSigner={ethersSigner}
                  ethersReadonlyProvider={ethersReadonlyProvider}
                  chainId={chainId}
                  sameChain={sameChain}
                  sameSigner={sameSigner}
                />
              }
            />
            <Route
              path="/result"
              element={
                <Result
                  fhevmInstance={fhevmInstance}
                  ethersSigner={ethersSigner}
                  ethersReadonlyProvider={ethersReadonlyProvider}
                  chainId={chainId}
                  sameChain={sameChain}
                  sameSigner={sameSigner}
                />
              }
            />
            <Route
              path="/records"
              element={
                <Records
                  account={accounts?.[0]}
                  ethersReadonlyProvider={ethersReadonlyProvider}
                  chainId={chainId}
                  fhevmInstance={fhevmInstance}
                  ethersSigner={ethersSigner}
                  sameChain={sameChain}
                  sameSigner={sameSigner}
                />
              }
            />
            <Route
              path="/records/:id"
              element={
                <RecordDetail
                  fhevmInstance={fhevmInstance}
                  ethersSigner={ethersSigner}
                  ethersReadonlyProvider={ethersReadonlyProvider}
                  chainId={chainId}
                  sameChain={sameChain}
                  sameSigner={sameSigner}
                />
              }
            />
            <Route
              path="/leaderboard"
              element={
                <Leaderboard
                  ethersReadonlyProvider={ethersReadonlyProvider}
                  chainId={chainId}
                />
              }
            />
            <Route
              path="/badges"
              element={
                <Badges
                  account={accounts?.[0]}
                  ethersReadonlyProvider={ethersReadonlyProvider}
                  chainId={chainId}
                  ethersSigner={ethersSigner}
                />
              }
            />
          </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  );
}
