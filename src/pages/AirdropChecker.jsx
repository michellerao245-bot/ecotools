import React, { useState } from "react";
import { Search, Wallet, Trophy, Activity, Globe, Shield, Coins, Network, Sparkles, AlertTriangle } from "lucide-react";

const AirdropChecker = () => {
  const [wallet, setWallet] = useState("");
  const score = 78;

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6 pt-20">
      <div className="max-w-6xl mx-auto">
        
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-3">🎁 Solt Airdrop Checker</h1>
          <p className="text-gray-400">Analyze wallet activity and estimate airdrop readiness.</p>
        </div>

        {/* Wallet Search */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            <input
              value={wallet}
              onChange={(e) => setWallet(e.target.value)}
              placeholder="Enter wallet address..."
              className="flex-1 bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 outline-none focus:border-blue-500 transition"
            />
            <button className="bg-blue-600 hover:bg-blue-700 transition px-6 py-3 rounded-xl font-semibold flex items-center justify-center gap-2">
              <Search size={18} /> Analyze Wallet
            </button>
          </div>
        </div>

        {/* Score Section */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Airdrop Score", val: `${score}/100`, color: "text-green-400" },
            { label: "Wallet Age", val: "2.8 Years", color: "text-white" },
            { label: "Transactions", val: "1,248", color: "text-white" },
            { label: "Active Chains", val: "6", color: "text-white" }
          ].map((item, idx) => (
            <div key={idx} className="bg-gray-900 border border-gray-800 rounded-2xl p-5 shadow-lg">
              <p className="text-gray-400 text-sm">{item.label}</p>
              <h2 className={`text-3xl font-bold mt-2 ${item.color}`}>{item.val}</h2>
            </div>
          ))}
        </div>

        {/* Activity Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
          <ActivityCard title="Chain Activity" icon={<Globe />} content={["Ethereum", "Arbitrum", "Optimism", "Base"]} />
          <ActivityCard title="Bridge Usage" icon={<Network />} val="34" desc="Cross-chain transactions." />
          <ActivityCard title="DeFi Activity" icon={<Coins />} val="High" desc="Lending, swaps, and staking." />
          <ActivityCard title="NFT Activity" icon={<Wallet />} val="Medium" desc="Minting and transfers." />
        </div>

        {/* Potential Airdrops */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 mb-8">
          <div className="flex items-center gap-2 mb-5">
            <Trophy className="text-yellow-400" />
            <h2 className="text-xl font-bold">Potential Airdrop Readiness</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            {["Arbitrum", "Optimism", "Base", "zkSync"].map((style) => (
              <div key={style} className="bg-gray-800 rounded-xl p-4 border border-gray-700">
                <h3 className="font-semibold mb-2">{style} Style</h3>
                <span className="text-green-400 font-bold">High</span>
              </div>
            ))}
          </div>
        </div>

        {/* AI Recommendations */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 mb-8">
          <div className="flex items-center gap-2 mb-5">
            <Sparkles className="text-purple-400" />
            <h2 className="text-xl font-bold">AI Recommendations</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-3">
            {["Increase activity on Base", "Use more cross-chain bridges", "Interact with lending", "Consistency is key"].map((rec, i) => (
              <div key={i} className="bg-gray-800 rounded-xl p-4 border border-gray-700">✅ {rec}</div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-gray-500 text-sm pb-6">
          Powered by Solt Intelligence Suite • Wallet Activity Analysis
        </div>
      </div>
    </div>
  );
};

// Helper Component for consistency
const ActivityCard = ({ title, icon, val, desc, content }) => (
  <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
    <div className="flex items-center gap-3 mb-3 text-purple-400">
      {icon}
      <h3 className="font-semibold text-white">{title}</h3>
    </div>
    {val ? <h2 className="text-3xl font-bold">{val}</h2> : null}
    {desc && <p className="text-gray-400 mt-2 text-sm">{desc}</p>}
    {content && <ul className="text-gray-300 text-sm space-y-1">{content.map(c => <li key={c}>• {c}</li>)}</ul>}
  </div>
);

export default AirdropChecker;