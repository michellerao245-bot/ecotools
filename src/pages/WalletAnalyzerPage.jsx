import React from 'react';

const WalletAnalyzerPage = () => {
  return (
    <div className="min-h-screen bg-gray-900 text-white py-20 px-6 flex flex-col items-center justify-center">
      <div className="max-w-2xl text-center space-y-6">
        <div className="text-6xl">🚀</div>
        <h1 className="text-4xl font-bold">Wallet Analyzer</h1>
        <p className="text-gray-400 text-lg">
          We are currently working on this feature! Our AI will soon be able to decode 
    deep on-chain activities and provide detailed risk profiles for any wallet address.
          
        </p>
        <div className="inline-block px-6 py-2 bg-blue-500/20 text-blue-400 rounded-full font-semibold border border-blue-500/30">
          Coming Soon
        </div>
        <button 
          onClick={() => window.location.href = '/scanner'} 
          className="block mt-8 mx-auto text-blue-400 underline hover:text-blue-300 transition"
        >
          &larr; Back to Token Scanner
        </button>
      </div>
    </div>
  );
};

export default WalletAnalyzerPage;