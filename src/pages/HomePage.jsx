import React from 'react';
import { useNavigate } from 'react-router-dom';

const HomePage = () => {
  const navigate = useNavigate();

  const features = [
    { title: "Rug-pull Detector", path: "/scanner", desc: "Instant AI scan for liquidity and honeypot risks." },
    { title: "Wallet Analyzer", path: "/wallet-analyzer", desc: "Analyze wallet activity and risk profiles." },
    { title: "Contract Analyzer", path: "/contract-analyzer", desc: "Deep dive into smart contract security." },
    { title: "AI Analyzer", path: "/ai-analyzer", desc: "Advanced AI-driven market insights." },
    { title: "Portfolio Tracker", path: "/portfolio", desc: "Track your assets and performance." },
    // ✅ PATH UPDATED HERE TO MATCH App.jsx
    { title: "Airdrop Checker", path: "/airdrop-checker", desc: "Check eligibility for upcoming airdrops." },
    { title: "Presale Checker", path: "/presale", desc: "Validate new presale opportunities." },
    { title: "LP Lock Checker", path: "/lp-lock", desc: "Verify liquidity pool lock status." },
    { title: "Smart Money Tracker", path: "/smart-money", desc: "Follow whale movements in real-time." }
  ];

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center pt-20 px-6">
      
      {/* Hero Section */}
      <div className="text-center max-w-3xl mb-16">
        <h1 className="text-5xl md:text-6xl font-extrabold mb-6">
          Scan Tokens with <span className="text-blue-500">Solt AI Intelligence</span>
        </h1>
        <p className="text-gray-400 text-lg mb-8">
          Protect your assets, identify smart contract risks, and invest with confidence.
          Solt Scanner AI is your personal security guard on the blockchain.
        </p>
        <button
          onClick={() => navigate('/scanner')}
          className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-full font-bold text-lg transition shadow-lg shadow-blue-900/20"
        >
          Start Free Scanning Now
        </button>
      </div>

      {/* Features Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl w-full mb-20">
        {features.map((feature, index) => (
          <button
            key={index}
            onClick={() => navigate(feature.path)}
            className="bg-gray-800 p-6 rounded-2xl border border-gray-700 text-left hover:border-blue-500 hover:scale-105 transition-all duration-300"
          >
            <h3 className="text-lg font-bold mb-2">{feature.title}</h3>
            <p className="text-gray-400 text-sm">{feature.desc}</p>
          </button>
        ))}
      </div>
    </div>
  );
};

export default HomePage;