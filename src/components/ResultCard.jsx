import React from 'react';

const ResultCard = ({ data }) => {
  if (!data) return null;

  const securityRating = Math.max(0, 100 - data.riskScore);

  const getRiskColor = () => {
    if (data.riskScore <= 20) {
      return 'bg-green-500/20 text-green-400';
    }

    if (data.riskScore <= 50) {
      return 'bg-yellow-500/20 text-yellow-400';
    }

    return 'bg-red-500/20 text-red-400';
  };

  const getRiskText = () => {
    if (data.riskScore <= 20) {
      return 'LOW RISK ✅';
    }

    if (data.riskScore <= 50) {
      return 'MEDIUM RISK ⚠️';
    }

    return 'HIGH RISK 🚨';
  };

  return (
    <div className="w-full max-w-5xl mx-auto bg-gray-800 border border-gray-700 rounded-2xl p-6 shadow-xl">

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">

        <div>
          <h2 className="text-3xl font-bold text-white">
            🚨 Rug Pull Security Report
          </h2>

          <p className="text-gray-400 mt-2">
            {data.tokenName || 'Unknown Token'}
          </p>

          <p className="text-gray-500 text-sm">
            Chain: {data.chain}
          </p>
        </div>

        <div className={`px-5 py-3 rounded-xl font-bold ${getRiskColor()}`}>
          Risk Score: {data.riskScore}/100
        </div>

      </div>

      {/* Overall Security */}
      <div
        className={`mb-8 p-5 rounded-xl border ${
          data.riskScore <= 20
            ? 'bg-green-500/10 border-green-500'
            : data.riskScore <= 50
            ? 'bg-yellow-500/10 border-yellow-500'
            : 'bg-red-500/10 border-red-500'
        }`}
      >
        <h3 className="font-bold text-lg text-white mb-2">
          Overall Security Status
        </h3>

        <p className="text-gray-300">
          {data.riskScore <= 20
            ? 'This token appears relatively safe based on current security indicators.'
            : data.riskScore <= 50
            ? 'Some risk indicators detected. Additional research recommended.'
            : 'Multiple high-risk indicators detected. Extreme caution advised.'}
        </p>
      </div>

      {/* Security Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">

        <div className="bg-gray-900 p-4 rounded-xl border border-gray-700">
          <p className="text-gray-400 text-xs">
            Security Rating
          </p>

          <p className="text-green-400 font-bold text-xl">
            {securityRating}/100
          </p>
        </div>

        <div className="bg-gray-900 p-4 rounded-xl border border-gray-700">
          <p className="text-gray-400 text-xs">
            Honeypot Risk
          </p>

          <p className={data.isHoneypot ? 'text-red-400 font-bold' : 'text-green-400 font-bold'}>
            {data.isHoneypot ? 'DETECTED' : 'CLEAR'}
          </p>
        </div>

        <div className="bg-gray-900 p-4 rounded-xl border border-gray-700">
          <p className="text-gray-400 text-xs">
            Ownership
          </p>

          <p className={data.ownerRenounced ? 'text-green-400 font-bold' : 'text-yellow-400 font-bold'}>
            {data.ownerRenounced ? 'RENOUNCED' : 'ACTIVE'}
          </p>
        </div>

        <div className="bg-gray-900 p-4 rounded-xl border border-gray-700">
          <p className="text-gray-400 text-xs">
            Rug Pull Risk
          </p>

          <p className="font-bold">
            {getRiskText()}
          </p>
        </div>

      </div>

      {/* Security Checks */}
      <div className="mb-8">
        <h3 className="text-xl font-bold text-white mb-4">
          Security Checks
        </h3>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">

          <div className="bg-gray-900 p-4 rounded-xl border border-gray-700">
            <p className="text-gray-400 text-xs">Verified</p>
            <p className={data.isVerified ? 'text-green-400 font-semibold' : 'text-red-400 font-semibold'}>
              {data.isVerified ? 'YES ✅' : 'NO ❌'}
            </p>
          </div>

          <div className="bg-gray-900 p-4 rounded-xl border border-gray-700">
            <p className="text-gray-400 text-xs">Honeypot</p>
            <p className={data.isHoneypot ? 'text-red-400 font-semibold' : 'text-green-400 font-semibold'}>
              {data.isHoneypot ? 'YES 🚨' : 'NO ✅'}
            </p>
          </div>

          <div className="bg-gray-900 p-4 rounded-xl border border-gray-700">
            <p className="text-gray-400 text-xs">Owner Renounced</p>
            <p className={data.ownerRenounced ? 'text-green-400 font-semibold' : 'text-yellow-400 font-semibold'}>
              {data.ownerRenounced ? 'YES ✅' : 'NO ⚠️'}
            </p>
          </div>

          <div className="bg-gray-900 p-4 rounded-xl border border-gray-700">
            <p className="text-gray-400 text-xs">Mint Function</p>
            <p className={data.canMint ? 'text-red-400 font-semibold' : 'text-green-400 font-semibold'}>
              {data.canMint ? 'ENABLED ⚠️' : 'DISABLED ✅'}
            </p>
          </div>

          <div className="bg-gray-900 p-4 rounded-xl border border-gray-700">
            <p className="text-gray-400 text-xs">Blacklist</p>
            <p className={data.blacklist ? 'text-red-400 font-semibold' : 'text-green-400 font-semibold'}>
              {data.blacklist ? 'YES ⚠️' : 'NO ✅'}
            </p>
          </div>

          <div className="bg-gray-900 p-4 rounded-xl border border-gray-700">
            <p className="text-gray-400 text-xs">Buy Tax</p>
            <p className="text-white font-semibold">
              {data.buyTax}%
            </p>
          </div>

          <div className="bg-gray-900 p-4 rounded-xl border border-gray-700">
            <p className="text-gray-400 text-xs">Sell Tax</p>
            <p className="text-white font-semibold">
              {data.sellTax}%
            </p>
          </div>

        </div>
      </div>

      {/* Market Data */}
      <div className="mb-8">
        <h3 className="text-xl font-bold text-white mb-4">
          Market Data
        </h3>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">

          <div className="bg-gray-900 p-4 rounded-xl border border-gray-700">
            <p className="text-gray-400 text-xs">DEX</p>
            <p className="text-white font-semibold">
              {data.dexName || 'N/A'}
            </p>
          </div>

          <div className="bg-gray-900 p-4 rounded-xl border border-gray-700">
            <p className="text-gray-400 text-xs">Pair</p>
            <p className="text-white font-semibold">
              {data.pairName || 'N/A'}
            </p>
          </div>

          <div className="bg-gray-900 p-4 rounded-xl border border-gray-700">
            <p className="text-gray-400 text-xs">Price</p>
            <p className="text-white font-semibold">
              ${Number(data.priceUsd || 0).toFixed(6)}
            </p>
          </div>

          <div className="bg-gray-900 p-4 rounded-xl border border-gray-700">
            <p className="text-gray-400 text-xs">Liquidity</p>
            <p className="text-white font-semibold">
              ${Number(data.liquidity || 0).toLocaleString()}
            </p>
          </div>

          <div className="bg-gray-900 p-4 rounded-xl border border-gray-700">
            <p className="text-gray-400 text-xs">Market Cap</p>
            <p className="text-white font-semibold">
              ${Number(data.marketCap || 0).toLocaleString()}
            </p>
          </div>

          <div className="bg-gray-900 p-4 rounded-xl border border-gray-700">
            <p className="text-gray-400 text-xs">24h Volume</p>
            <p className="text-white font-semibold">
              ${Number(data.volume24h || 0).toLocaleString()}
            </p>
          </div>

        </div>
      </div>

      {/* AI Verdict */}
      <div className="bg-blue-900/20 border border-blue-500/30 p-5 rounded-xl">
        <h3 className="text-blue-400 text-lg font-bold mb-3">
          🤖 AI Security Verdict
        </h3>

        <p className="text-gray-300 leading-relaxed">
          {data.aiVerdict}
        </p>
      </div>

    </div>
  );
};

export default ResultCard;