import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Web3ReactProvider } from '@web3-react/core';
import { Web3Provider } from '@ethersproject/providers';

// Pages Import
import HomePage from './pages/HomePage';
import ScannerPage from './pages/ScannerPage';
import WalletAnalyzerPage from './pages/WalletAnalyzerPage';
import ContractAnalyzerPage from './pages/ContractAnalyzerPage';
import AIAnalyzerPage from './pages/AIAnalyzerPage';
import PortfolioTracker from './pages/PortfolioTracker';
import AirdropChecker from './pages/AirdropChecker';
import PresaleChecker from './pages/PresaleChecker'; // Yahan se './pages/' hatakar dekho
import LpLockChecker from './pages/LpLockChecker';
import SmartMoneyTracker from './pages/SmartMoneyTracker';

function getLibrary(provider) {
  const library = new Web3Provider(provider);
  library.pollingInterval = 12000;
  return library;
}

function App() {
  return (
    <Web3ReactProvider getLibrary={getLibrary}>
      <Router>
        <div className="bg-gray-900 min-h-screen text-white font-sans">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/scanner" element={<ScannerPage />} />
            <Route path="/wallet-analyzer" element={<WalletAnalyzerPage />} />
            <Route path="/contract-analyzer" element={<ContractAnalyzerPage />} />
            <Route path="/ai-analyzer" element={<AIAnalyzerPage />} />
            <Route path="/portfolio" element={<PortfolioTracker />} />
            <Route path="/airdrop-checker" element={<AirdropChecker />} />
            
            {/* New Routes */}
            <Route path="/presale" element={<PresaleChecker />} />
            <Route path="/lp-lock" element={<LpLockChecker />} />
            <Route path="/smart-money" element={<SmartMoneyTracker />} />
          </Routes>
        </div>
      </Router>
    </Web3ReactProvider>
  );
}

export default App;