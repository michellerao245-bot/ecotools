import React, { useState } from 'react';
import ContractScannerForm from '../components/ContractScannerForm';
import ContractResultCard from '../components/ContractResultCard';
// Tumhe apna hook yahan import karna hoga (e.g., useTokenScanner)
import useTokenScanner from '../hooks/useTokenScanner'; 

const ContractAnalyzerPage = () => {
  const { scanToken, data, loading, error } = useTokenScanner();

  return (
    <div className="min-h-screen bg-gray-950 text-white py-12 px-6">
      <div className="max-w-4xl mx-auto">
        
        {/* Page Header */}
        <div className="text-center mb-10">
          <h1 className="text-4xl font-extrabold text-white mb-4">
            Contract Analyzer
          </h1>
          <p className="text-gray-400 text-lg">
            Paste any token contract address to run a deep security audit.
          </p>
        </div>

        {/* Input Form */}
        <ContractScannerForm onScan={scanToken} />

        {/* Loading State */}
        {loading && (
          <div className="text-center mt-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mb-2"></div>
            <p className="text-blue-400 font-medium">Analyzing contract... This may take a few seconds.</p>
          </div>
        )}

        {/* Error Handling */}
        {error && (
          <div className="mt-8 bg-red-500/10 border border-red-500/50 p-4 rounded-xl text-center text-red-400">
            {error}
          </div>
        )}

        {/* Result Display */}
        {data && !loading && (
          <div className="mt-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <ContractResultCard data={data} />
          </div>
        )}

      </div>
    </div>
  );
};

export default ContractAnalyzerPage;