import React, { useState } from 'react';

const WalletScannerForm = ({ onScan }) => {
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
      alert('Please enter a valid wallet address');
      return;
    }

    setLoading(true);

    try {
      await onScan(address);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="relative">

        <input
          type="text"
          placeholder="Enter Wallet Address (0x...)"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          className="w-full bg-gray-800 border border-gray-700 rounded-xl px-5 py-4 text-white outline-none focus:border-blue-500"
        />

        <button
          type="submit"
          disabled={loading}
          className="absolute right-2 top-2 bg-blue-600 hover:bg-blue-700 px-5 py-2 rounded-lg font-semibold"
        >
          {loading ? 'Scanning...' : 'Analyze'}
        </button>

      </div>
    </form>
  );
};

export default WalletScannerForm;