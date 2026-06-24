import React from 'react';

const Header = () => {
  return (
    <header className="w-full py-6 px-8 flex justify-between items-center bg-gray-900 border-b border-gray-800">
      {/* Logo Section */}
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center font-bold text-white">
          S
        </div>
        <h1 className="text-xl font-bold tracking-tight text-white">
          EcoScanner<span className="text-blue-500">AI</span>
        </h1>
      </div>

      {/* Navigation Links */}
      <nav className="flex gap-8 text-sm font-medium text-gray-400">
        <a href="/" className="hover:text-white transition">Dashboard</a>
        <a href="/scanner" className="hover:text-white transition">Scanner</a>
        <a href="/wallet" className="hover:text-white transition">Wallet</a>
      </nav>

      {/* Action Button */}
      <button className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-full text-sm font-semibold transition">
        Connect Wallet
      </button>
    </header>
  );
};

export default Header;