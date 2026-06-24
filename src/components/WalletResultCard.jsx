import React from 'react';

const WalletResultCard = ({ data }) => {
  if (!data) return null;

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-2xl p-6 shadow-xl">

      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white">
          Wallet Analysis Result
        </h2>
      </div>

      {/* Wallet Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">

        <div className="bg-gray-900 p-4 rounded-xl">
          <p className="text-gray-400 text-xs">Wallet Address</p>
          <p className="text-white break-all">
            {data.walletAddress}
          </p>
        </div>

        <div className="bg-gray-900 p-4 rounded-xl">
          <p className="text-gray-400 text-xs">Risk Profile</p>

          <p
            className={`font-bold ${
              data.riskProfile === 'Low'
                ? 'text-green-400'
                : data.riskProfile === 'Medium'
                ? 'text-yellow-400'
                : 'text-red-400'
            }`}
          >
            {data.riskProfile}
          </p>
        </div>

        <div className="bg-gray-900 p-4 rounded-xl">
          <p className="text-gray-400 text-xs">Total Transactions</p>
          <p className="text-white font-semibold">
            {data.totalTransactions}
          </p>
        </div>

        <div className="bg-gray-900 p-4 rounded-xl">
          <p className="text-gray-400 text-xs">Wallet Age</p>
          <p className="text-white font-semibold">
            {data.walletAge} Days
          </p>
        </div>

        <div className="bg-gray-900 p-4 rounded-xl">
          <p className="text-gray-400 text-xs">First Transaction</p>
          <p className="text-white font-semibold">
            {data.firstTransaction}
          </p>
        </div>

        <div className="bg-gray-900 p-4 rounded-xl">
          <p className="text-gray-400 text-xs">Last Activity</p>
          <p className="text-white font-semibold">
            {data.lastActivity}
          </p>
        </div>

        <div className="bg-gray-900 p-4 rounded-xl">
          <p className="text-gray-400 text-xs">Total Gas Spent</p>
          <p className="text-white font-semibold">
            {data.gasSpent} BNB
          </p>
        </div>

        <div className="bg-gray-900 p-4 rounded-xl">
          <p className="text-gray-400 text-xs">Contract Wallet</p>

          <p
            className={`font-semibold ${
              data.isContract
                ? 'text-yellow-400'
                : 'text-green-400'
            }`}
          >
            {data.isContract ? 'YES ⚠️' : 'NO ✅'}
          </p>
        </div>

      </div>

      {/* AI Verdict */}
      <div className="bg-blue-500/10 border border-blue-500 rounded-xl p-4">
        <h3 className="text-blue-400 font-semibold mb-2">
          AI Verdict
        </h3>

        <p className="text-gray-300">
          {data.aiVerdict}
        </p>
      </div>

    </div>
  );
};

export default WalletResultCard;