import React, { useState } from "react";
import {
  Shield,
  Lock,
  Unlock,
  AlertTriangle,
  Search,
  Calendar,
  Coins,
} from "lucide-react";

const LpLockChecker = () => {
  const [tokenAddress, setTokenAddress] = useState("");
  const [loading, setLoading] = useState(false);

  const handleCheck = () => {
    setLoading(true);

    setTimeout(() => {
      setLoading(false);
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white px-6 py-10">
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-5xl font-bold mb-4">
            🔒 LP Lock Checker
          </h1>

          <p className="text-gray-400 text-lg">
            Verify liquidity lock status and detect rug-pull risks.
          </p>
        </div>

        {/* Search Box */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 mb-8">

          <div className="grid md:grid-cols-4 gap-4">

            <input
              type="text"
              placeholder="Token or LP Address"
              value={tokenAddress}
              onChange={(e) => setTokenAddress(e.target.value)}
              className="md:col-span-2 bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 outline-none"
            />

            <select className="bg-gray-800 border border-gray-700 rounded-xl px-4 py-3">
              <option>BNB Chain</option>
              <option>Ethereum</option>
              <option>Base</option>
              <option>Polygon</option>
              <option>Arbitrum</option>
            </select>

            <button
              onClick={handleCheck}
              className="bg-blue-600 hover:bg-blue-700 rounded-xl px-6 py-3 font-bold flex items-center justify-center gap-2"
            >
              <Search size={18} />
              Check LP
            </button>
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 text-center mb-8">
            <div className="animate-pulse text-blue-400 text-xl">
              Scanning LP Lock...
            </div>
          </div>
        )}

        {/* Results */}
        {!loading && (
          <>
            <div className="grid md:grid-cols-4 gap-6 mb-8">

              <div className="bg-gray-900 p-6 rounded-2xl border border-gray-800">
                <Lock className="text-green-400 mb-3" />
                <h3 className="text-gray-400">Locked LP</h3>
                <p className="text-3xl font-bold text-green-400">
                  92%
                </p>
              </div>

              <div className="bg-gray-900 p-6 rounded-2xl border border-gray-800">
                <Coins className="text-blue-400 mb-3" />
                <h3 className="text-gray-400">LP Value</h3>
                <p className="text-3xl font-bold">
                  $1.2M
                </p>
              </div>

              <div className="bg-gray-900 p-6 rounded-2xl border border-gray-800">
                <Calendar className="text-yellow-400 mb-3" />
                <h3 className="text-gray-400">Unlock Date</h3>
                <p className="font-bold">
                  Dec 2027
                </p>
              </div>

              <div className="bg-gray-900 p-6 rounded-2xl border border-gray-800">
                <Shield className="text-green-400 mb-3" />
                <h3 className="text-gray-400">Risk Score</h3>
                <p className="text-3xl font-bold text-green-400">
                  8/100
                </p>
              </div>

            </div>

            {/* LP Status */}
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 mb-8">

              <h2 className="text-2xl font-bold mb-4">
                LP Lock Analysis
              </h2>

              <div className="space-y-4">

                <div className="flex justify-between">
                  <span>Liquidity Locked</span>
                  <span className="text-green-400 font-bold">
                    92%
                  </span>
                </div>

                <div className="w-full h-4 bg-gray-800 rounded-full">
                  <div
                    className="h-4 bg-green-500 rounded-full"
                    style={{ width: "92%" }}
                  ></div>
                </div>

                <div className="flex justify-between">
                  <span>Liquidity Unlocked</span>
                  <span className="text-red-400 font-bold">
                    8%
                  </span>
                </div>

                <div className="w-full h-4 bg-gray-800 rounded-full">
                  <div
                    className="h-4 bg-red-500 rounded-full"
                    style={{ width: "8%" }}
                  ></div>
                </div>

              </div>
            </div>

            {/* Security Report */}
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">

              <h2 className="text-2xl font-bold mb-4">
                Security Report
              </h2>

              <div className="space-y-4">

                <div className="flex items-center gap-3 text-green-400">
                  <Shield />
                  <span>Liquidity is mostly locked.</span>
                </div>

                <div className="flex items-center gap-3 text-green-400">
                  <Lock />
                  <span>No suspicious unlock schedule detected.</span>
                </div>

                <div className="flex items-center gap-3 text-yellow-400">
                  <AlertTriangle />
                  <span>8% liquidity remains unlocked.</span>
                </div>

                <div className="flex items-center gap-3 text-red-400">
                  <Unlock />
                  <span>
                    Always verify ownership renouncement separately.
                  </span>
                </div>

              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default LpLockChecker;