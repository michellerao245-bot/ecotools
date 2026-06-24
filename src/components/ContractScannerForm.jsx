import React, { useState } from 'react';

const ContractScannerForm = ({ onScan }) => {
  const [address, setAddress] = useState('');
  const [chainId, setChainId] = useState('1'); // Default Ethereum

  const handleSubmit = (e) => {
    e.preventDefault();
    if (address.trim()) {
      onScan(address, chainId); // Address aur ChainId dono bhej rahe hain
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-3xl mx-auto mb-10">
      <div className="flex flex-col md:flex-row gap-3">
        {/* Chain Selector */}
        <select 
          value={chainId} 
          onChange={(e) => setChainId(e.target.value)}
          className="bg-gray-800 border border-gray-700 text-white rounded-xl py-4 px-4 outline-none focus:border-purple-500 transition-all cursor-pointer"
        >
          <option value="1">Ethereum</option>
          <option value="56">BSC</option>
          <option value="137">Polygon</option>
          <option value="42161">Arbitrum</option>
          <option value="10">Optimism</option>
        </select>

        {/* Address Input */}
        <div className="relative flex-grow flex items-center">
          <input
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Paste token contract address (0x...)"
            className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl py-4 px-6 outline-none focus:border-purple-500 transition-all shadow-lg placeholder-gray-500"
          />
          <button
            type="submit"
            className="absolute right-2 bg-purple-600 hover:bg-purple-500 text-white font-bold py-2 px-6 rounded-lg transition-all"
          >
            Scan
          </button>
        </div>
      </div>
    </form>
  );
};

export default ContractScannerForm;