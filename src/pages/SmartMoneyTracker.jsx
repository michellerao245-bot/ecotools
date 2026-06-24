import React, { useState } from "react";
import { Search, TrendingUp, TrendingDown, Wallet, Activity, Crown, Brain } from "lucide-react";

const SmartMoneyTracker = () => {
  const [wallet, setWallet] = useState("");
  const [loading, setLoading] = useState(false);

  const handleTrack = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white px-6 py-10">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-5xl font-bold mb-4">🐋 Smart Money Tracker</h1>
          <p className="text-gray-400 text-lg">
            Track whale wallets, smart investors, and institutional activity.
          </p>
        </div>

        {/* Search */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 mb-8">
          <div className="grid md:grid-cols-4 gap-4">
            <input
              type="text"
              placeholder="Wallet Address"
              value={wallet}
              onChange={(e) => setWallet(e.target.value)}
              className="md:col-span-2 bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 outline-none focus:border-blue-500"
            />
            <select className="bg-gray-800 border border-gray-700 rounded-xl px-4 py-3">
              <option>All Chains</option>
              <option>Ethereum</option>
              <option>BNB Chain</option>
              <option>Base</option>
              <option>Arbitrum</option>
              <option>Polygon</option>
            </select>
            <button
              onClick={handleTrack}
              className="bg-blue-600 hover:bg-blue-700 rounded-xl px-6 py-3 font-bold flex items-center justify-center gap-2 transition"
            >
              <Search size={18} /> Track Wallet
            </button>
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 text-center mb-8">
            <div className="animate-pulse text-blue-400 text-xl">Tracking Smart Money...</div>
          </div>
        )}

        {!loading && (
          <>
            {/* Stats */}
            <div className="grid md:grid-cols-4 gap-6 mb-8">
              <div className="bg-gray-900 p-6 rounded-2xl border border-gray-800">
                <Wallet className="text-blue-400 mb-3" />
                <h3 className="text-gray-400">Tracked Wallets</h3>
                <p className="text-3xl font-bold">2,485</p>
              </div>
              <div className="bg-gray-900 p-6 rounded-2xl border border-gray-800">
                <TrendingUp className="text-green-400 mb-3" />
                <h3 className="text-gray-400">Bullish Signals</h3>
                <p className="text-3xl font-bold text-green-400">84%</p>
              </div>
              <div className="bg-gray-900 p-6 rounded-2xl border border-gray-800">
                <TrendingDown className="text-red-400 mb-3" />
                <h3 className="text-gray-400">Bearish Signals</h3>
                <p className="text-3xl font-bold text-red-400">16%</p>
              </div>
              <div className="bg-gray-900 p-6 rounded-2xl border border-gray-800">
                <Activity className="text-yellow-400 mb-3" />
                <h3 className="text-gray-400">24h Volume</h3>
                <p className="text-3xl font-bold">$12.4M</p>
              </div>
            </div>

            {/* Whale Transactions */}
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 mb-8">
              <h2 className="text-2xl font-bold mb-6">🐋 Recent Whale Activity</h2>
              <div className="space-y-4">
                <div className="bg-gray-800 rounded-xl p-4 flex justify-between">
                  <div>
                    <p className="font-semibold">ETH Purchase</p>
                    <p className="text-gray-400 text-sm">Wallet: 0x8A7...2E1</p>
                  </div>
                  <div className="text-green-400 font-bold">+$1.2M</div>
                </div>
                <div className="bg-gray-800 rounded-xl p-4 flex justify-between">
                  <div>
                    <p className="font-semibold">BNB Purchase</p>
                    <p className="text-gray-400 text-sm">Wallet: 0x91D...8AF</p>
                  </div>
                  <div className="text-green-400 font-bold">+$850K</div>
                </div>
                <div className="bg-gray-800 rounded-xl p-4 flex justify-between">
                  <div>
                    <p className="font-semibold">ARB Sell</p>
                    <p className="text-gray-400 text-sm">Wallet: 0x77B...1CE</p>
                  </div>
                  <div className="text-red-400 font-bold">-$620K</div>
                </div>
              </div>
            </div>

            {/* Top Wallets & AI Analysis */}
            <div className="grid lg:grid-cols-2 gap-6 mb-8">
              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
                <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                  <Crown className="text-yellow-400" /> Top Smart Wallets
                </h2>
                <div className="space-y-3">
                  <div className="bg-gray-800 p-4 rounded-xl">0x8A7...2E1 — ROI: +248%</div>
                  <div className="bg-gray-800 p-4 rounded-xl">0x91D...8AF — ROI: +193%</div>
                  <div className="bg-gray-800 p-4 rounded-xl">0xA12...5CE — ROI: +165%</div>
                </div>
              </div>
              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
                <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                  <Brain className="text-purple-400" /> AI Smart Money Analysis
                </h2>
                <div className="bg-gray-800 rounded-xl p-5">
                  <p className="text-gray-300 leading-relaxed">
                    Smart wallets are accumulating ETH and BNB. Market sentiment remains bullish despite short-term volatility.
                  </p>
                  <div className="mt-4">
                    <span className="inline-block bg-green-500/20 text-green-400 px-4 py-2 rounded-lg">
                      Bullish Outlook
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default SmartMoneyTracker;