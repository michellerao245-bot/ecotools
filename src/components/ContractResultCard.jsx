import React from 'react';

const ContractResultCard = ({ data }) => {
  if (!data) return null;

  return (
    <div className="w-full max-w-5xl mx-auto bg-gray-900 border border-gray-800 rounded-3xl p-8 shadow-2xl">
      
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
        <div>
          <h2 className="text-4xl font-black text-white uppercase tracking-tight">{data.tokenName}</h2>
          <p className="text-gray-500 text-sm mt-2 font-mono bg-black/30 inline-block px-3 py-1 rounded-md">{data.tokenAddress}</p>
        </div>
        <div className={`px-6 py-3 rounded-2xl font-bold text-lg border ${data.riskScore < 30 ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}>
          Risk Score: {data.riskScore}/100
        </div>
      </div>

      {/* Grid of Security Checks */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-10">
        <SecurityBadge label="Honeypot" status={!data.isHoneypot} text={data.isHoneypot ? 'DETECTED' : 'CLEAR'} />
        <SecurityBadge label="Verified" status={data.isVerified} text={data.isVerified ? 'YES' : 'NO'} />
        <SecurityBadge label="Renounced" status={data.ownerRenounced} text={data.ownerRenounced ? 'YES' : 'NO'} />
        <SecurityBadge label="Mintable" status={!data.canMint} text={data.canMint ? 'YES' : 'NO'} isWarning={data.canMint} />
      </div>

      {/* Financial Overview - Made it wider and clean */}
      <div className="bg-black/20 rounded-2xl p-8 border border-gray-800 mb-10">
        <h3 className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-6">Financial Overview</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <StatItem label="Liquidity" value={`$${Number(data.liquidity || 0).toLocaleString()}`} />
          <StatItem label="Market Cap" value={`$${Number(data.marketCap || 0).toLocaleString()}`} />
          <StatItem label="Buy / Sell Tax" value={`${data.buyTax || 0}% / ${data.sellTax || 0}%`} />
        </div>
      </div>

      {/* Verdict Section */}
      <div className="bg-blue-500/5 border border-blue-500/10 p-6 rounded-2xl">
        <h3 className="text-blue-400 font-bold mb-3 flex items-center gap-2">
          <span className="text-xl">🤖</span> AI Security Verdict
        </h3>
        <p className="text-gray-300 text-sm leading-relaxed">{data.aiVerdict}</p>
      </div>
    </div>
  );
};

const SecurityBadge = ({ label, status, text, isWarning = false }) => (
  <div className={`p-5 rounded-2xl border text-center transition-all ${isWarning ? 'bg-yellow-500/5 border-yellow-500/20 text-yellow-400' : status ? 'bg-green-500/5 border-green-500/20 text-green-400' : 'bg-red-500/5 border-red-500/20 text-red-400'}`}>
    <p className="text-[10px] uppercase font-bold tracking-widest opacity-70">{label}</p>
    <p className="text-xl font-black mt-2">{text}</p>
  </div>
);

const StatItem = ({ label, value }) => (
  <div className="border-l-2 border-gray-800 pl-4">
    <p className="text-gray-500 text-[10px] uppercase tracking-wider mb-1">{label}</p>
    <p className="text-white font-bold text-xl">{value}</p>
  </div>
);

export default ContractResultCard;