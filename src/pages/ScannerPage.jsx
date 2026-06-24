import React from 'react';
import ScannerForm from '../components/ScannerForm';
import ResultCard from '../components/ResultCard';
import useTokenScanner from '../hooks/useTokenScanner';

const ScannerPage = () => {
  const { scanToken, data, loading, error } = useTokenScanner();

  return (
    <div className="min-h-screen bg-gray-900 text-white py-12 px-6">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold mb-2">Token Scanner</h1>
          <p className="text-gray-400">Paste a contract address to analyze its risk factors.</p>
        </div>

        {/* Input Form */}
        <ScannerForm onScan={scanToken} />

        {/* Loading State */}
        {loading && (
          <div className="text-center mt-10 text-blue-400 animate-pulse">
            Analyzing contract on-chain... Please wait.
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="mt-8 p-4 bg-red-900/20 border border-red-500/30 rounded-xl text-red-400 text-center">
            {error}
          </div>
        )}

        {/* Results */}
        {data && !loading && (
          <div className="mt-10 animate-in fade-in duration-500">
            <ResultCard data={data} />
          </div>
        )}
      </div>
    </div>
  );
};

export default ScannerPage;