import React, { useState } from 'react';

const ScannerForm = ({ onScan }) => {
  const [address, setAddress] = useState('');
  const [chain, setChain] = useState('bsc');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
      alert('Please enter a valid contract address');
      return;
    }

    setLoading(true);

    try {
      await onScan(address, chain);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-lg mx-auto mt-10">
      
      {/* Chain Selector */}
      <select
        value={chain}
        onChange={(e) => setChain(e.target.value)}
        className="w-full mb-4 bg-gray-800 border border-gray-700 text-white rounded-xl py-3 px-4 outline-none focus:border-blue-500"
      >
        <option value="bsc">BNB Chain</option>
        <option value="ethereum">Ethereum</option>
        <option value="polygon">Polygon</option>
        <option value="arbitrum">Arbitrum</option>
        <option value="base">Base</option>
      </select>

      <div className="relative">
        <input
          type="text"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="Paste Token Contract Address (0x...)"
          className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl py-4 px-6 outline-none focus:border-blue-500 transition"
        />

        <button
          type="submit"
          disabled={loading}
          className="absolute right-2 top-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-semibold disabled:opacity-50"
        >
          {loading ? 'Scanning...' : 'Scan Token'}
        </button>
      </div>

      <p className="text-gray-500 text-xs mt-3 text-center">
        Ensure you are scanning on the correct chain.
      </p>
    </form>
  );
};

export default ScannerForm;