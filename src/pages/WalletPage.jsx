import React from 'react';
import ScannerForm from '../components/ScannerForm';
import useWalletScanner from '../hooks/useWalletScanner';

const WalletPage = () => {
  const { scanWallet, data, loading, error } = useWalletScanner();

  return (
    <div className="min-h-screen bg-gray-900 text-white py-12 px-6">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold mb-2">Wallet Analyzer</h1>
          <p className="text-gray-400">Check the risk profile and reputation of any EVM wallet.</p>
        </div>

        {/* Input Form */}
        <ScannerForm onScan={scanWallet} />

        {/* Loading State */}
        {loading && (
          <div className="text-center mt-10 text-blue-400 animate-pulse">
            Analyzing wallet transactions...
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="mt-8 p-4 bg-red-900/20 border border-red-500/30 rounded-xl text-red-400 text-center">
            {error}
          </div>
        )}

        {/* Results Section */}
        {data && !loading && (
          <div className="mt-10 bg-gray-800 p-8 rounded-2xl border border-gray-700 shadow-xl animate-in fade-in duration-500">
            <h2 className="text-xl font-bold mb-6 text-blue-400">Analysis Result</h2>
            <div className="space-y-4">
              <p><strong>Wallet:</strong> {data.walletAddress}</p>
              <p><strong>Total Transactions:</strong> {data.totalTransactions}</p>
              <p><strong>Risk Profile:</strong> {data.riskProfile}</p>
              <div className="mt-6 p-4 bg-gray-900 rounded-xl border border-gray-700">
                <p className="text-sm text-gray-300 italic">"{data.aiVerdict}"</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default WalletPage;