import React, { useState, useCallback, useEffect } from 'react';
import axios from 'axios';

// --- Backend URL ---
const BACKEND_URL = 'https://ecobackend-two.vercel.app/api/presale/check';

// --- Chain Mapping ---
const chainMap = {
  1: 'Ethereum',
  56: 'BNB Chain',
  137: 'Polygon',
  42161: 'Arbitrum',
  10: 'Optimism',
  43114: 'Avalanche',
  501: 'Solana',
};

const chainOptions = [
  { id: 'auto', name: 'Auto Detect' },
  { id: 1, name: 'Ethereum' },
  { id: 56, name: 'BNB Chain' },
  { id: 137, name: 'Polygon' },
  { id: 42161, name: 'Arbitrum' },
  { id: 10, name: 'Optimism' },
  { id: 43114, name: 'Avalanche' },
  { id: 501, name: 'Solana' },
];

const detectChainFromAddress = (address) => {
  if (!address) return 'auto';
  const trimmed = address.trim();
  if (trimmed.startsWith('0x')) return 'auto';
  if (/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(trimmed)) return 501;
  return 'auto';
};

const formatCurrency = (value) => {
  if (!value || value === 'N/A') return 'N/A';
  const num = parseFloat(value);
  if (isNaN(num)) return 'N/A';
  if (num >= 1e9) return `$${(num / 1e9).toFixed(2)}B`;
  if (num >= 1e6) return `$${(num / 1e6).toFixed(2)}M`;
  if (num >= 1e3) return `$${(num / 1e3).toFixed(2)}K`;
  return `$${num.toFixed(2)}`;
};

const formatNumber = (value) => {
  if (!value || value === 'N/A') return 'N/A';
  const num = parseFloat(value);
  if (isNaN(num)) return 'N/A';
  if (num >= 1e9) return `${(num / 1e9).toFixed(2)}B`;
  if (num >= 1e6) return `${(num / 1e6).toFixed(2)}M`;
  if (num >= 1e3) return `${(num / 1e3).toFixed(2)}K`;
  return num.toFixed(2);
};

const safeToFixed = (value, digits = 1) => {
  if (typeof value === 'number' && !isNaN(value)) {
    return value.toFixed(digits);
  }
  return 'N/A';
};

// --- MAIN COMPONENT ---
const PresaleChecker = () => {
  const [tokenAddress, setTokenAddress] = useState('');
  const [selectedChain, setSelectedChain] = useState('auto');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [presaleData, setPresaleData] = useState(null);
  const [scanHistory, setScanHistory] = useState([]);
  const [monitoring, setMonitoring] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [whatIfAmount, setWhatIfAmount] = useState(1000);

  const resolveChainId = useCallback((address, selected) => {
    if (selected !== 'auto') return parseInt(selected);
    const detected = detectChainFromAddress(address);
    if (detected === 501) return 501;
    return 56;
  }, []);

  const getChainName = (chainId) => {
    const map = {
      1: 'ethereum',
      56: 'bsc',
      137: 'polygon',
      42161: 'arbitrum',
      10: 'optimism',
      43114: 'avalanche',
      501: 'solana',
    };
    return map[chainId] || 'bsc';
  };

  const analyzePresale = useCallback(async (addressOverride) => {
    const addressToScan = addressOverride || tokenAddress;
    if (!addressToScan || addressToScan.trim() === '') {
      setError('Please enter a token address');
      return;
    }
    setLoading(true);
    setError(null);

    try {
      const cleanAddress = addressToScan.trim();
      const actualChainId = resolveChainId(cleanAddress, selectedChain);
      const chainName = getChainName(actualChainId);

      const response = await axios.get(BACKEND_URL, {
        params: {
          address: cleanAddress,
          chain: chainName,
        },
      });

      const result = response.data;

      if (result.market && result.market.price !== 'N/A') {
        const currentPrice = parseFloat(result.market.price);
        const launchPrice = currentPrice > 0 ? currentPrice / 10 : 0;
        const whatIfValue = launchPrice > 0 ? (whatIfAmount / launchPrice) * currentPrice : 0;
        result.whatIf = { amount: whatIfAmount, value: whatIfValue };
      }

      setPresaleData(result);
      setScanHistory(prev => [result, ...prev.slice(0, 9)]);
    } catch (err) {
      setError(err.message || 'Failed to analyze presale.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [tokenAddress, selectedChain, resolveChainId, whatIfAmount]);

  // --- Go Back: clear everything and focus input ---
  const goBack = () => {
    setPresaleData(null);
    setError(null);
    setTokenAddress('');
    document.getElementById('tokenInput')?.focus();
  };

  // --- Refresh: clear token address and results (so user can enter new address) ---
  const handleRefresh = () => {
    setPresaleData(null);
    setError(null);
    setTokenAddress('');
    document.getElementById('tokenInput')?.focus();
  };

  // --- Live Monitoring toggle ---
  const toggleMonitoring = () => {
    setMonitoring(!monitoring);
    if (!monitoring) {
      setCountdown(30);
    }
  };

  // --- POLLING-BASED LIVE MONITORING with visual refresh indicator ---
  useEffect(() => {
    if (!monitoring || !presaleData?.token?.address) {
      setCountdown(0);
      return;
    }

    console.log(`🟢 Monitoring started for ${presaleData.token.symbol}`);
    let previousData = { ...presaleData };
    let countdownInterval = null;
    let isMounted = true;

    // Countdown timer
    setCountdown(30);
    countdownInterval = setInterval(() => {
      if (isMounted) {
        setCountdown(prev => (prev > 0 ? prev - 1 : 0));
      }
    }, 1000);

    const interval = setInterval(async () => {
      if (!isMounted) return;

      setIsRefreshing(true);
      try {
        const cleanAddress = presaleData.token.address.trim();
        const actualChainId = resolveChainId(cleanAddress, selectedChain);
        const chainName = getChainName(actualChainId);

        const response = await axios.get(BACKEND_URL, {
          params: {
            address: cleanAddress,
            chain: chainName,
          },
        });

        const newData = response.data;

        // Detect changes
        const changes = [];
        if (newData.liquidity?.total !== previousData.liquidity?.total) {
          changes.push(`💧 Liquidity: ${formatCurrency(newData.liquidity?.total)}`);
        }
        if (newData.market?.price !== previousData.market?.price) {
          changes.push(`💰 Price: $${newData.market?.price}`);
        }
        if (newData.holders?.count !== previousData.holders?.count) {
          changes.push(`👥 Holders: ${newData.holders?.count}`);
        }
        if (newData.security?.ownershipRenounced !== previousData.security?.ownershipRenounced) {
          changes.push(`🏛️ Ownership status changed!`);
        }
        if (newData.liquidity?.locked !== previousData.liquidity?.locked) {
          changes.push(`🔒 Liquidity lock status changed!`);
        }

        if (changes.length > 0) {
          console.log('🔔 Changes detected:', changes);
          alert(`🔔 Changes detected for ${presaleData.token.symbol}:\n${changes.join('\n')}`);
          if (isMounted) {
            setPresaleData(newData);
            previousData = { ...newData };
          }
        } else {
          console.log('⏳ No changes detected');
        }

        // Reset countdown after refresh
        if (isMounted) {
          setCountdown(30);
        }
      } catch (err) {
        console.error('Monitoring error:', err);
      } finally {
        if (isMounted) {
          setIsRefreshing(false);
        }
      }
    }, 30000); // 30 seconds

    return () => {
      isMounted = false;
      clearInterval(interval);
      clearInterval(countdownInterval);
      console.log(`🔴 Monitoring stopped for ${presaleData.token.symbol}`);
    };
  }, [monitoring, presaleData, selectedChain, resolveChainId]);

  // ----- JSX -----
  return (
    <div className="min-h-screen bg-gray-950 text-white px-4 md:px-6 py-8 pt-20 flex flex-col">
      <div className="max-w-6xl mx-auto w-full">
        {/* Header with back and refresh buttons */}
        <div className="text-center mb-10 relative">
          {presaleData && (
            <button
              onClick={goBack}
              className="absolute left-0 top-1/2 -translate-y-1/2 bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-full text-lg shadow-lg transition z-10"
              title="Go back"
            >
              ←
            </button>
          )}
          {presaleData && (
            <button
              onClick={handleRefresh}
              disabled={loading}
              className="absolute right-0 top-1/2 -translate-y-1/2 bg-yellow-500 hover:bg-yellow-600 text-black font-bold py-2 px-4 rounded-full text-lg shadow-lg transition disabled:opacity-50 z-10"
              title="Clear address & results"
            >
              ⟳
            </button>
          )}
          <h1 className="text-4xl md:text-5xl font-extrabold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
            🚀 Solt Presale Checker
          </h1>
          <p className="text-gray-400 text-lg mt-2">
            Analyze crypto presales with real data.
          </p>
        </div>

        {/* Search Box */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-4 items-center">
            <div className="flex-1 w-full">
              <input
                id="tokenInput"
                type="text"
                placeholder="Enter token address (0x... or Solana address)"
                value={tokenAddress}
                onChange={(e) => setTokenAddress(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 outline-none focus:border-purple-500 text-white"
              />
            </div>
            <div className="flex gap-2 w-full md:w-auto">
              <select
                value={selectedChain}
                onChange={(e) => setSelectedChain(e.target.value)}
                className="bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 outline-none focus:border-purple-500 text-white"
              >
                {chainOptions.map((opt) => (
                  <option key={opt.id} value={opt.id}>{opt.name}</option>
                ))}
              </select>
              <button
                onClick={() => analyzePresale()}
                disabled={loading}
                className="bg-purple-600 hover:bg-purple-700 px-6 py-3 rounded-xl font-semibold transition disabled:opacity-50"
              >
                {loading ? 'Analyzing...' : 'Analyze'}
              </button>
            </div>
          </div>
          {error && (
            <div className="mt-4 bg-red-600/20 border border-red-600 p-3 rounded-xl text-red-400 text-sm">
              ⚠️ {error}
            </div>
          )}
        </div>

        {loading && (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-500 border-t-transparent mx-auto"></div>
            <p className="text-gray-400 mt-4">Fetching real-time data from multiple sources...</p>
          </div>
        )}

        {presaleData && !loading && (
          <div className="space-y-6">
            {/* Launch Status */}
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
              <div className="flex items-center gap-4">
                <span className="text-3xl">{presaleData.launch.icon}</span>
                <div>
                  <h2 className="text-xl font-bold">{presaleData.launch.status}</h2>
                  <p className="text-sm text-gray-400">{presaleData.launch.details}</p>
                </div>
                {presaleData.launch.status === 'Pre-Launch Token' && (
                  <span className="ml-auto bg-blue-600/20 text-blue-400 px-4 py-1 rounded-full text-sm border border-blue-600">🔵 Pre-Launch</span>
                )}
                {presaleData.launch.status === 'Active Trading' && (
                  <span className="ml-auto bg-green-600/20 text-green-400 px-4 py-1 rounded-full text-sm border border-green-600">🟢 Trading</span>
                )}
                {presaleData.launch.status === 'Liquidity Added (Pre-Launch)' && (
                  <span className="ml-auto bg-yellow-600/20 text-yellow-400 px-4 py-1 rounded-full text-sm border border-yellow-600">🟡 Liquidity Added</span>
                )}
              </div>
              <div className="mt-4 grid grid-cols-2 md:grid-cols-5 gap-2 text-sm">
                <div className="flex items-center gap-2">
                  <span className={presaleData.token.name !== 'N/A' ? 'text-green-400' : 'text-red-400'}>
                    {presaleData.token.name !== 'N/A' ? '✅' : '❌'}
                  </span>
                  Contract
                </div>
                <div className="flex items-center gap-2">
                  <span className={presaleData.hasMarketData && parseFloat(presaleData.liquidity.total) > 0 ? 'text-green-400' : 'text-red-400'}>
                    {presaleData.hasMarketData && parseFloat(presaleData.liquidity.total) > 0 ? '✅' : '❌'}
                  </span>
                  Liquidity
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-yellow-400">⚠️</span>
                  Audit
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-yellow-400">⚠️</span>
                  KYC
                </div>
                <div className="flex items-center gap-2">
                  <span className={presaleData.social.twitter !== 'N/A' || presaleData.social.telegram !== 'N/A' ? 'text-green-400' : 'text-red-400'}>
                    {presaleData.social.twitter !== 'N/A' || presaleData.social.telegram !== 'N/A' ? '✅' : '❌'}
                  </span>
                  Community
                </div>
              </div>
              <div className="mt-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Launch Readiness</span>
                  <span className="font-bold">{presaleData.readiness}/100</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2 mt-1">
                  <div
                    className={`h-2 rounded-full ${
                      presaleData.readiness > 70 ? 'bg-green-500' :
                      presaleData.readiness > 40 ? 'bg-yellow-500' :
                      'bg-red-500'
                    }`}
                    style={{ width: `${presaleData.readiness}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Token Overview */}
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
              <div className="flex flex-wrap justify-between items-start">
                <div>
                  <h2 className="text-2xl font-bold">{presaleData.token.name}</h2>
                  <p className="text-purple-400 text-lg">{presaleData.token.symbol}</p>
                  <p className="text-xs text-gray-500 break-all mt-1">{presaleData.token.address}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-400">Chain</p>
                  <p className="font-semibold">{presaleData.token.chain}</p>
                  <p className="text-xs text-gray-500">Total Supply: {formatNumber(presaleData.token.totalSupply)}</p>
                  <p className="text-xs text-gray-500">Decimals: {presaleData.token.decimals}</p>
                  {presaleData.token.age !== 'N/A' && (
                    <p className="text-xs text-gray-400">Age: {presaleData.token.age} {presaleData.token.ageRisk}</p>
                  )}
                </div>
              </div>
              <div className="mt-4 flex flex-wrap items-center gap-4">
                <span className={`px-4 py-1 rounded-full text-sm font-bold border ${
                  presaleData.grades.overall === 'A+' ? 'text-green-400 bg-green-600/20 border-green-600' :
                  presaleData.grades.overall === 'A' ? 'text-green-300 bg-green-600/10 border-green-500' :
                  presaleData.grades.overall === 'B' ? 'text-blue-400 bg-blue-600/20 border-blue-600' :
                  presaleData.grades.overall === 'C' ? 'text-yellow-400 bg-yellow-600/20 border-yellow-600' :
                  'text-red-400 bg-red-600/20 border-red-600'
                }`}>
                  {presaleData.grades.overall}
                </span>
                <span className="text-sm text-gray-400">Confidence: {Math.min(100, 80 + (presaleData.security.score !== 'N/A' ? presaleData.security.score / 5 : 10))}%</span>
                <span className="text-xs text-gray-500">Rank #{presaleData.rank}</span>
              </div>
            </div>

            {/* Score Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-gray-900 rounded-2xl p-5 border border-gray-800">
                <h3 className="text-gray-400 text-sm">Security Score</h3>
                <p className="text-3xl font-bold text-green-400">{presaleData.security.score !== 'N/A' ? presaleData.security.score + '/100' : 'N/A'}</p>
                <p className="text-xs text-gray-500">{presaleData.security.level}</p>
              </div>
              <div className="bg-gray-900 rounded-2xl p-5 border border-gray-800">
                <h3 className="text-gray-400 text-sm">Investment Score</h3>
                <p className="text-3xl font-bold text-blue-400">
                  {typeof presaleData.investScore === 'number' ? presaleData.investScore + '/100' : 'N/A'}
                </p>
                <p className="text-xs text-gray-500">{presaleData.hasMarketData ? 'AI Estimated' : 'Insufficient Data'}</p>
              </div>
              <div className="bg-gray-900 rounded-2xl p-5 border border-gray-800">
                <h3 className="text-gray-400 text-sm">Liquidity</h3>
                <p className="text-3xl font-bold">{formatCurrency(presaleData.liquidity.total)}</p>
                <p className="text-xs text-gray-500">{presaleData.liquidity.locked ? '🔒 Locked' : '🔓 Not Locked'}</p>
              </div>
              <div className="bg-gray-900 rounded-2xl p-5 border border-gray-800">
                <h3 className="text-gray-400 text-sm">Holders</h3>
                <p className="text-3xl font-bold">{formatNumber(presaleData.holders.count)}</p>
                <p className="text-xs text-gray-500">Top 10: {safeToFixed(presaleData.holders.top10Ratio)}%</p>
              </div>
            </div>

            {/* Risk Meter */}
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
              <h3 className="text-lg font-bold mb-2">🔥 Risk Meter</h3>
              <div className="w-full bg-gray-700 rounded-full h-4">
                <div
                  className={`h-4 rounded-full transition-all ${
                    presaleData.security.score !== 'N/A' && presaleData.security.score > 80 ? 'bg-green-500' :
                    presaleData.security.score !== 'N/A' && presaleData.security.score > 60 ? 'bg-yellow-500' :
                    'bg-red-500'
                  }`}
                  style={{ width: `${presaleData.security.score !== 'N/A' ? presaleData.security.score : 0}%` }}
                />
              </div>
              <p className="text-sm text-gray-400 mt-2">{presaleData.security.score !== 'N/A' ? presaleData.security.score : '0'}% – {presaleData.security.level}</p>
            </div>

            {/* Presale Intelligence */}
            {presaleData.presale && (
              <div className="bg-gradient-to-r from-blue-900/20 to-purple-900/20 border border-blue-500 rounded-2xl p-6">
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                  🎯 Presale Intelligence
                  <span className="text-xs text-blue-400">Powered by PinkSale</span>
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-gray-400">Platform</p>
                    <p className="font-bold">{presaleData.presale.platform}</p>
                  </div>
                  <div>
                    <p className="text-gray-400">Pool Status</p>
                    <p className={`font-bold ${
                      presaleData.presale.status === 'active' ? 'text-green-400' :
                      presaleData.presale.status === 'ended' ? 'text-yellow-400' :
                      'text-red-400'
                    }`}>
                      {presaleData.presale.status}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-400">Soft Cap</p>
                    <p className="font-bold">{presaleData.presale.softCap}</p>
                  </div>
                  <div>
                    <p className="text-gray-400">Hard Cap</p>
                    <p className="font-bold">{presaleData.presale.hardCap}</p>
                  </div>
                  <div>
                    <p className="text-gray-400">Raised</p>
                    <p className="font-bold">{presaleData.presale.raised} ({presaleData.presale.raisedPercent}%)</p>
                  </div>
                  <div>
                    <p className="text-gray-400">Contributors</p>
                    <p className="font-bold">{presaleData.presale.contributors}</p>
                  </div>
                  <div>
                    <p className="text-gray-400">Presale Rate</p>
                    <p className="font-bold">{presaleData.presale.presaleRate}</p>
                  </div>
                  <div>
                    <p className="text-gray-400">Sale Type</p>
                    <p className="font-bold">{presaleData.presale.saleType}</p>
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-3 gap-2 text-xs text-gray-400">
                  <div>Start: {presaleData.presale.startTime}</div>
                  <div>End: {presaleData.presale.endTime}</div>
                  <div>Claim: {presaleData.presale.claimTime}</div>
                </div>
                {presaleData.presale.unsoldTokens !== 'N/A' && (
                  <div className="mt-2 text-sm">
                    <span className="text-gray-400">Unsold: </span>
                    <span className="font-bold">{presaleData.presale.unsoldTokens}</span>
                  </div>
                )}
                {presaleData.presale.liquidityPercent !== 'N/A' && (
                  <div className="mt-1 text-sm">
                    <span className="text-gray-400">Liquidity %: </span>
                    <span className="font-bold">{presaleData.presale.liquidityPercent}%</span>
                  </div>
                )}
              </div>
            )}

            {/* Two-column layout */}
            <div className="grid lg:grid-cols-2 gap-6">
              {/* Left column */}
              <div className="space-y-6">
                {/* Red Flags */}
                {presaleData.redFlags.length > 0 && (
                  <div className="bg-red-900/20 border border-red-600 rounded-2xl p-6">
                    <h2 className="text-xl font-bold text-red-400 mb-4">🚨 Red Flags ({presaleData.redFlags.length})</h2>
                    <ul className="space-y-2 text-sm">
                      {presaleData.redFlags.map((flag, i) => (
                        <li key={i} className="flex items-start gap-2 text-red-300">
                          <span>⚠️</span>
                          <span>{flag}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Security Checks */}
                <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
                  <h2 className="text-xl font-bold mb-4">🔒 Security Checks</h2>
                  <ul className="space-y-2 text-sm">
                    <li className="flex justify-between border-b border-gray-800 pb-2">
                      <span>Honeypot</span>
                      <span className={presaleData.security.honeypot ? 'text-red-400' : 'text-green-400'}>
                        {presaleData.security.honeypot ? '⚠️ Yes' : '✅ No'}
                      </span>
                    </li>
                    <li className="flex justify-between border-b border-gray-800 pb-2">
                      <span>Ownership Renounced</span>
                      <span className={presaleData.security.ownershipRenounced ? 'text-green-400' : 'text-red-400'}>
                        {presaleData.security.ownershipRenounced ? '✅ Yes' : '❌ No'}
                      </span>
                    </li>
                    <li className="flex justify-between border-b border-gray-800 pb-2">
                      <span>Mint Function</span>
                      <span className={presaleData.security.mintable ? 'text-red-400' : 'text-green-400'}>
                        {presaleData.security.mintable ? '⚠️ Active' : '✅ None'}
                      </span>
                    </li>
                    <li className="flex justify-between border-b border-gray-800 pb-2">
                      <span>Blacklist Function</span>
                      <span className={presaleData.security.blacklist ? 'text-red-400' : 'text-green-400'}>
                        {presaleData.security.blacklist ? '⚠️ Yes' : '✅ No'}
                      </span>
                    </li>
                    <li className="flex justify-between border-b border-gray-800 pb-2">
                      <span>Pause Trading</span>
                      <span className={presaleData.security.canPause ? 'text-yellow-400' : 'text-green-400'}>
                        {presaleData.security.canPause ? '⚠️ Yes' : '✅ No'}
                      </span>
                    </li>
                    <li className="flex justify-between border-b border-gray-800 pb-2">
                      <span>Proxy Contract</span>
                      <span className={presaleData.security.proxy ? 'text-yellow-400' : 'text-green-400'}>
                        {presaleData.security.proxy ? '⚠️ Yes' : '✅ No'}
                      </span>
                    </li>
                    <li className="flex justify-between border-b border-gray-800 pb-2">
                      <span>Hidden Owner</span>
                      <span className={presaleData.security.hiddenOwner ? 'text-red-400' : 'text-green-400'}>
                        {presaleData.security.hiddenOwner ? '⚠️ Yes' : '✅ No'}
                      </span>
                    </li>
                    <li className="flex justify-between">
                      <span>Trading Disabled Risk</span>
                      <span className={presaleData.security.tradingDisabled ? 'text-red-400' : 'text-green-400'}>
                        {presaleData.security.tradingDisabled ? '⚠️ High' : '✅ Low'}
                      </span>
                    </li>
                  </ul>
                  <div className="mt-4 bg-gray-800 rounded-xl p-3 text-center">
                    <p className="text-sm">Security Score: <strong>{presaleData.security.score !== 'N/A' ? presaleData.security.score : 'N/A'}/100</strong></p>
                  </div>
                </div>

                {/* Tax Detector */}
                <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
                  <h2 className="text-xl font-bold mb-4">💰 Tax Detector</h2>
                  <ul className="space-y-2 text-sm">
                    <li className="flex justify-between border-b border-gray-800 pb-2">
                      <span>Buy Tax</span>
                      <span>{presaleData.tax.buy}%</span>
                    </li>
                    <li className="flex justify-between border-b border-gray-800 pb-2">
                      <span>Sell Tax</span>
                      <span>{presaleData.tax.sell}%</span>
                    </li>
                    <li className="flex justify-between">
                      <span>Transfer Tax</span>
                      <span>{presaleData.tax.transfer}%</span>
                    </li>
                  </ul>
                </div>

                {/* Supply Distribution */}
                <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
                  <h2 className="text-xl font-bold mb-4">📦 Supply Distribution</h2>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Team Wallet</span>
                      <span className="font-bold text-red-400">{safeToFixed(presaleData.supplyDist.team)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Community</span>
                      <span className="font-bold text-green-400">{safeToFixed(presaleData.supplyDist.community)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Burn Wallet</span>
                      <span className="font-bold text-gray-400">{presaleData.supplyDist.burn}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Liquidity</span>
                      <span className="font-bold text-yellow-400">{presaleData.supplyDist.liquidity}%</span>
                    </div>
                  </div>
                </div>

                {/* Wallet Concentration */}
                <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
                  <h2 className="text-xl font-bold mb-4">🐳 Wallet Concentration</h2>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Top 1 Holder</span>
                      <span className={`font-bold ${
                        typeof presaleData.concentration.top1 === 'number' && presaleData.concentration.top1 > 50 ? 'text-red-400' :
                        typeof presaleData.concentration.top1 === 'number' && presaleData.concentration.top1 > 30 ? 'text-yellow-400' :
                        'text-green-400'
                      }`}>
                        {safeToFixed(presaleData.concentration.top1)}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Top 5 Holders</span>
                      <span className={`font-bold ${
                        typeof presaleData.concentration.top5 === 'number' && presaleData.concentration.top5 > 70 ? 'text-red-400' :
                        typeof presaleData.concentration.top5 === 'number' && presaleData.concentration.top5 > 50 ? 'text-yellow-400' :
                        'text-green-400'
                      }`}>
                        {safeToFixed(presaleData.concentration.top5)}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Top 10 Holders</span>
                      <span className={`font-bold ${
                        typeof presaleData.concentration.top10 === 'number' && presaleData.concentration.top10 > 80 ? 'text-red-400' :
                        typeof presaleData.concentration.top10 === 'number' && presaleData.concentration.top10 > 60 ? 'text-yellow-400' :
                        'text-green-400'
                      }`}>
                        {safeToFixed(presaleData.concentration.top10)}%
                      </span>
                    </div>
                  </div>
                </div>

                {/* Scam Pattern Detector */}
                <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
                  <h2 className="text-xl font-bold mb-4">🚨 Scam Pattern Detector</h2>
                  <p className="text-sm">Similarity to known scam patterns: <span className="font-bold">{presaleData.scamRisk}</span></p>
                  <p className="text-xs text-gray-500 mt-2">Based on 5+ security indicators</p>
                </div>

                {/* Pros & Cons */}
                <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
                  <h2 className="text-xl font-bold mb-4">📊 Pros & Cons</h2>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h3 className="text-green-400 font-semibold text-sm mb-2">✅ Pros</h3>
                      <ul className="space-y-1 text-sm text-gray-300">
                        {presaleData.pros.length > 0 ? (
                          presaleData.pros.map((p, i) => <li key={i}>{p}</li>)
                        ) : (
                          <li className="text-gray-500">None identified</li>
                        )}
                      </ul>
                    </div>
                    <div>
                      <h3 className="text-red-400 font-semibold text-sm mb-2">❌ Cons</h3>
                      <ul className="space-y-1 text-sm text-gray-300">
                        {presaleData.cons.length > 0 ? (
                          presaleData.cons.map((c, i) => <li key={i}>{c}</li>)
                        ) : (
                          <li className="text-gray-500">None identified</li>
                        )}
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Score Breakdown */}
                <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
                  <h2 className="text-xl font-bold mb-4">📊 Score Breakdown</h2>
                  {Object.entries(presaleData.scoreBreakdown).map(([key, value]) => (
                    <div key={key} className="mb-2">
                      <div className="flex justify-between text-sm">
                        <span className="capitalize">{key}</span>
                        <span>{value}/100</span>
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-1.5">
                        <div
                          className={`h-1.5 rounded-full ${
                            value > 70 ? 'bg-green-500' :
                            value > 50 ? 'bg-yellow-500' :
                            'bg-red-500'
                          }`}
                          style={{ width: `${value}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Solt Rating System */}
                <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
                  <h2 className="text-xl font-bold mb-4">🏆 Solt Rating System</h2>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="flex justify-between"><span>Security</span><span className="font-bold">{presaleData.grades.security}</span></div>
                    <div className="flex justify-between"><span>Liquidity</span><span className="font-bold">{presaleData.grades.liquidity}</span></div>
                    <div className="flex justify-between"><span>Community</span><span className="font-bold">{presaleData.grades.community}</span></div>
                    <div className="flex justify-between"><span>Tokenomics</span><span className="font-bold">{presaleData.grades.tokenomics}</span></div>
                    <div className="col-span-2 flex justify-between border-t border-gray-700 pt-2 mt-2"><span>Overall</span><span className="font-bold text-purple-400">{presaleData.grades.overall}</span></div>
                  </div>
                </div>
              </div>

              {/* Right column */}
              <div className="space-y-6">
                {/* Liquidity Analysis */}
                <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
                  <h2 className="text-xl font-bold mb-4">💧 Liquidity Analysis</h2>
                  <ul className="space-y-2 text-sm">
                    <li className="flex justify-between border-b border-gray-800 pb-2">
                      <span>Total Liquidity</span>
                      <span>{formatCurrency(presaleData.liquidity.total)}</span>
                    </li>
                    <li className="flex justify-between border-b border-gray-800 pb-2">
                      <span>LP Lock Status</span>
                      <span className={presaleData.liquidity.locked ? 'text-green-400' : 'text-red-400'}>
                        {presaleData.liquidity.locked ? '🔒 Locked' : '🔓 Not Locked'}
                      </span>
                    </li>
                    <li className="flex justify-between border-b border-gray-800 pb-2">
                      <span>Lock Percentage</span>
                      <span>{presaleData.liquidity.percent || 0}%</span>
                    </li>
                    <li className="flex justify-between border-b border-gray-800 pb-2">
                      <span>Locker</span>
                      <span>{presaleData.liquidity.locker || 'N/A'}</span>
                    </li>
                    <li className="flex justify-between">
                      <span>Unlock Date</span>
                      <span>{presaleData.liquidity.unlockDate || 'N/A'}</span>
                    </li>
                  </ul>
                </div>

                {/* Holder Analysis */}
                <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
                  <h2 className="text-xl font-bold mb-4">👑 Holder Analysis</h2>
                  <ul className="space-y-2 text-sm">
                    <li className="flex justify-between border-b border-gray-800 pb-2">
                      <span>Total Holders</span>
                      <span>{formatNumber(presaleData.holders.count)}</span>
                    </li>
                    <li className="flex justify-between border-b border-gray-800 pb-2">
                      <span>Top 10 Holders %</span>
                      <span>{safeToFixed(presaleData.holders.top10Ratio)}%</span>
                    </li>
                    <li className="flex justify-between border-b border-gray-800 pb-2">
                      <span>Top Wallet %</span>
                      <span className={typeof presaleData.holders.creatorPercent === 'number' && presaleData.holders.creatorPercent > 50 ? 'text-red-400' : 'text-green-400'}>
                        {safeToFixed(presaleData.holders.creatorPercent)}%
                      </span>
                    </li>
                    <li className="flex justify-between">
                      <span>Whale Risk</span>
                      <span className={
                        typeof presaleData.holders.creatorPercent === 'number' && presaleData.holders.creatorPercent > 90 ? 'text-red-600 font-bold' :
                        typeof presaleData.holders.creatorPercent === 'number' && presaleData.holders.creatorPercent > 50 ? 'text-red-400' :
                        typeof presaleData.holders.creatorPercent === 'number' && presaleData.holders.creatorPercent > 30 ? 'text-yellow-400' :
                        'text-green-400'
                      }>
                        {typeof presaleData.holders.creatorPercent === 'number' && presaleData.holders.creatorPercent > 90 ? '🔴 EXTREME' :
                         typeof presaleData.holders.creatorPercent === 'number' && presaleData.holders.creatorPercent > 50 ? 'High' :
                         typeof presaleData.holders.creatorPercent === 'number' && presaleData.holders.creatorPercent > 30 ? 'Medium' :
                         'Low'}
                      </span>
                    </li>
                  </ul>
                </div>

                {/* Market Intelligence */}
                <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
                  <h2 className="text-xl font-bold mb-4">📈 Market Intelligence</h2>
                  <ul className="space-y-2 text-sm">
                    <li className="flex justify-between border-b border-gray-800 pb-2">
                      <span>Price</span>
                      <span>{presaleData.market.price !== 'N/A' ? `$${parseFloat(presaleData.market.price).toFixed(6)}` : 'N/A'}</span>
                    </li>
                    <li className="flex justify-between border-b border-gray-800 pb-2">
                      <span>24h Change</span>
                      <span className={presaleData.market.priceChange24h !== 'N/A' && parseFloat(presaleData.market.priceChange24h) >= 0 ? 'text-green-400' : 'text-red-400'}>
                        {presaleData.market.priceChange24h !== 'N/A' ? `${parseFloat(presaleData.market.priceChange24h).toFixed(2)}%` : 'N/A'}
                      </span>
                    </li>
                    <li className="flex justify-between border-b border-gray-800 pb-2">
                      <span>Volume 24h</span>
                      <span>{formatCurrency(presaleData.market.volume24h)}</span>
                    </li>
                    <li className="flex justify-between border-b border-gray-800 pb-2">
                      <span>Market Cap</span>
                      <span>{formatCurrency(presaleData.market.marketCap)}</span>
                    </li>
                    <li className="flex justify-between">
                      <span>FDV</span>
                      <span>{formatCurrency(presaleData.market.fdv)}</span>
                    </li>
                  </ul>
                </div>

                {/* Exchange Listings */}
                <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
                  <h2 className="text-xl font-bold mb-4">🏦 Exchange Listings</h2>
                  <p className="text-sm text-gray-300">{presaleData.listingStatus}</p>
                  {presaleData.exchangeIcons.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {presaleData.exchangeIcons.map((ex, i) => (
                        <span key={i} className="bg-gray-800 px-3 py-1 rounded-full text-xs border border-gray-700">{ex}</span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Smart Money */}
                <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
                  <h2 className="text-xl font-bold mb-4">🐋 Smart Money</h2>
                  <ul className="space-y-2 text-sm">
                    <li className="flex justify-between border-b border-gray-800 pb-2">
                      <span>Smart Wallets</span>
                      <span>{presaleData.smartMoney.wallets}</span>
                    </li>
                    <li className="flex justify-between border-b border-gray-800 pb-2">
                      <span>Net Flow (24h)</span>
                      <span className={presaleData.smartMoney.netFlow !== 'N/A' && presaleData.smartMoney.netFlow.includes('+') ? 'text-green-400' : 'text-gray-400'}>
                        {presaleData.smartMoney.netFlow || 'N/A'}
                      </span>
                    </li>
                    <li className="flex justify-between border-b border-gray-800 pb-2">
                      <span>Buys</span>
                      <span>{presaleData.smartMoney.buys}</span>
                    </li>
                    <li className="flex justify-between">
                      <span>Sells</span>
                      <span>{presaleData.smartMoney.sells}</span>
                    </li>
                  </ul>
                </div>

                {/* Whale Activity */}
                <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
                  <h2 className="text-xl font-bold mb-4">🐳 Whale Activity (24h)</h2>
                  <ul className="space-y-2 text-sm">
                    <li className="flex justify-between border-b border-gray-800 pb-2">
                      <span>Whale Buys</span>
                      <span>{presaleData.whale.buys || 'N/A'}</span>
                    </li>
                    <li className="flex justify-between border-b border-gray-800 pb-2">
                      <span>Whale Sells</span>
                      <span>{presaleData.whale.sells || 'N/A'}</span>
                    </li>
                    <li className="flex justify-between">
                      <span>Net Flow</span>
                      <span className={presaleData.whale.netFlow !== 'N/A' && presaleData.whale.netFlow.includes('+') ? 'text-green-400' : 'text-red-400'}>
                        {presaleData.whale.netFlow || 'N/A'}
                      </span>
                    </li>
                  </ul>
                </div>

                {/* Narrative & Community */}
                <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
                  <h2 className="text-xl font-bold mb-4">📣 Narrative & Community</h2>
                  <ul className="space-y-2 text-sm">
                    <li className="flex justify-between border-b border-gray-800 pb-2">
                      <span>Narrative</span>
                      <span>{presaleData.narrative?.narrative || 'Other'}</span>
                    </li>
                    <li className="flex justify-between border-b border-gray-800 pb-2">
                      <span>Strength</span>
                      <span>{presaleData.narrative?.strength || 5}/10</span>
                    </li>
                    <li className="flex justify-between border-b border-gray-800 pb-2">
                      <span>Trend</span>
                      <span className={presaleData.narrative?.trend === 'Trending' ? 'text-green-400' : presaleData.narrative?.trend === 'Growing' ? 'text-yellow-400' : 'text-gray-400'}>
                        {presaleData.narrative?.trend || 'Unknown'}
                      </span>
                    </li>
                    <li className="flex justify-between">
                      <span>Community Score</span>
                      <span>{presaleData.communityScore}/100</span>
                    </li>
                  </ul>
                </div>

                {/* Social Verification */}
                <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
                  <h2 className="text-xl font-bold mb-4">🌐 Social Verification</h2>
                  <ul className="space-y-2 text-sm">
                    <li className="flex justify-between border-b border-gray-800 pb-2">
                      <span>Website</span>
                      <span>{presaleData.social.website !== 'N/A' ? '✅' : '❌'}</span>
                    </li>
                    <li className="flex justify-between border-b border-gray-800 pb-2">
                      <span>Twitter/X</span>
                      <span>{presaleData.social.twitter !== 'N/A' ? '✅' : '❌'}</span>
                    </li>
                    <li className="flex justify-between border-b border-gray-800 pb-2">
                      <span>Telegram</span>
                      <span>{presaleData.social.telegram !== 'N/A' ? '✅' : '❌'}</span>
                    </li>
                    <li className="flex justify-between border-b border-gray-800 pb-2">
                      <span>Discord</span>
                      <span>{presaleData.social.discord !== 'N/A' ? '✅' : '❌'}</span>
                    </li>
                    <li className="flex justify-between">
                      <span>GitHub</span>
                      <span>{presaleData.social.github !== 'N/A' ? '✅' : '❌'}</span>
                    </li>
                  </ul>
                </div>

                {/* Developer Wallet */}
                <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
                  <h2 className="text-xl font-bold mb-4">👨‍💻 Developer Wallet</h2>
                  <ul className="space-y-2 text-sm">
                    <li className="flex justify-between border-b border-gray-800 pb-2">
                      <span>Creator Address</span>
                      <span className="text-xs break-all max-w-[150px] text-right">{presaleData.holders.creatorAddress}</span>
                    </li>
                    <li className="flex justify-between border-b border-gray-800 pb-2">
                      <span>Balance</span>
                      <span>{presaleData.holders.creatorBalance}</span>
                    </li>
                    <li className="flex justify-between border-b border-gray-800 pb-2">
                      <span>Ownership %</span>
                      <span className={typeof presaleData.holders.creatorPercent === 'number' && presaleData.holders.creatorPercent > 50 ? 'text-red-400 font-bold' : 'text-green-400'}>
                        {safeToFixed(presaleData.holders.creatorPercent, 2)}%
                      </span>
                    </li>
                    <li className="flex justify-between">
                      <span>Projects Created</span>
                      <span>{presaleData.developer.projects}</span>
                    </li>
                  </ul>
                </div>

                {/* Hidden Gem & Moon Potential */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 text-center">
                    <h3 className="text-gray-400 text-sm">💎 Hidden Gem Score</h3>
                    <p className="text-2xl font-bold text-purple-400">
                      {presaleData.hiddenGemScore !== 'N/A' ? presaleData.hiddenGemScore + '/100' : 'N/A'}
                    </p>
                  </div>
                  <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 text-center">
                    <h3 className="text-gray-400 text-sm">🚀 Moon Potential</h3>
                    <p className="text-2xl font-bold text-pink-400">
                      {presaleData.moonPotential !== 'N/A' ? presaleData.moonPotential + '/100' : 'N/A'}
                    </p>
                  </div>
                </div>

                {/* What If Calculator */}
                <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
                  <h2 className="text-xl font-bold mb-4">💸 What If You Invested?</h2>
                  <div className="flex gap-2 mb-2">
                    <input
                      type="number"
                      value={whatIfAmount}
                      onChange={(e) => setWhatIfAmount(parseFloat(e.target.value) || 0)}
                      className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm w-32"
                    />
                    <span className="text-sm text-gray-400">USD</span>
                  </div>
                  <p className="text-sm">
                    Current Value: <span className="font-bold text-green-400">
                      {presaleData.whatIf.value > 0 ? formatCurrency(presaleData.whatIf.value) : 'N/A'}
                    </span>
                  </p>
                  <p className="text-xs text-gray-500">Based on estimated launch price</p>
                </div>

                {/* AI Summary */}
                <div className="bg-gradient-to-r from-purple-900/30 to-blue-900/30 border border-purple-500 rounded-2xl p-6">
                  <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                    🤖 Solt AI Summary
                    <span className="text-xs text-purple-400">Powered by Solt Intelligence</span>
                  </h2>
                  <p className="text-gray-300 text-sm mb-4">{presaleData.summary}</p>
                  <p className="text-gray-300 text-sm mb-4">{presaleData.aiVerdict}</p>
                  <div className="mt-4">
                    <span className={`inline-block px-4 py-2 rounded-lg text-sm font-bold ${
                      presaleData.overallRecommendation === 'Safe To Research Further' ? 'bg-green-500/20 text-green-400' :
                      presaleData.overallRecommendation === 'Caution Advised' ? 'bg-yellow-500/20 text-yellow-400' :
                      presaleData.overallRecommendation === 'Research Only' ? 'bg-blue-500/20 text-blue-400' :
                      presaleData.overallRecommendation === 'Wait For Launch' ? 'bg-purple-500/20 text-purple-400' :
                      presaleData.overallRecommendation === 'Extreme Caution' ? 'bg-orange-500/20 text-orange-400' :
                      'bg-red-500/20 text-red-400'
                    }`}>
                      {presaleData.overallRecommendation}
                    </span>
                  </div>
                </div>

                {/* Checklist */}
                <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
                  <h2 className="text-xl font-bold mb-4">📋 Presale Checklist</h2>
                  <ul className="space-y-2 text-sm">
                    <li className="flex justify-between border-b border-gray-800 pb-2">
                      <span>Ownership Renounced</span>
                      <span className={presaleData.security.ownershipRenounced ? 'text-green-400' : 'text-red-400'}>
                        {presaleData.security.ownershipRenounced ? '✅' : '❌'}
                      </span>
                    </li>
                    <li className="flex justify-between border-b border-gray-800 pb-2">
                      <span>LP Locked</span>
                      <span className={presaleData.liquidity.locked ? 'text-green-400' : 'text-red-400'}>
                        {presaleData.liquidity.locked ? '✅' : '❌'}
                      </span>
                    </li>
                    <li className="flex justify-between border-b border-gray-800 pb-2">
                      <span>Audit Available</span>
                      <span className="text-yellow-400">⚠️ N/A</span>
                    </li>
                    <li className="flex justify-between border-b border-gray-800 pb-2">
                      <span>KYC Missing</span>
                      <span className="text-yellow-400">⚠️ N/A</span>
                    </li>
                    <li className="flex justify-between">
                      <span>No Honeypot</span>
                      <span className={!presaleData.security.honeypot ? 'text-green-400' : 'text-red-400'}>
                        {!presaleData.security.honeypot ? '✅' : '❌'}
                      </span>
                    </li>
                  </ul>
                </div>

                {/* Investor Suitability */}
                <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
                  <h2 className="text-xl font-bold mb-4">🎯 Investor Suitability</h2>
                  <p className="text-sm text-gray-300">
                    {presaleData.isEstablished ? '✅ Suitable for all investor types – established token.' :
                     presaleData.overallRecommendation === 'Wait For Launch' ? '⏳ Wait for liquidity and trading data.' :
                     presaleData.overallRecommendation === 'Extreme Caution' ? '🔴 Only for High Risk Speculators – Extreme centralization.' :
                     presaleData.security.score !== 'N/A' && presaleData.security.score > 80 ? '✅ Suitable for Long-term & Conservative Investors' :
                     presaleData.security.score !== 'N/A' && presaleData.security.score > 60 ? '🟡 Suitable for Moderate Risk Investors' :
                     '🔴 Not Suitable for Conservative Investors – High Risk'}
                  </p>
                </div>

                {/* Scan History */}
                {scanHistory.length > 0 && (
                  <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
                    <h2 className="text-xl font-bold mb-4">📸 Scan History</h2>
                    <div className="space-y-2 text-sm">
                      {scanHistory.map((item, index) => (
                        <div key={index} className="flex justify-between border-b border-gray-800 pb-2">
                          <span>{new Date().toLocaleDateString()}</span>
                          <span>Score: {item.security.score !== 'N/A' ? item.security.score : 'N/A'}</span>
                          <span className="text-xs text-gray-400">{item.token.symbol}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Live Monitoring */}
                <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold">🔴 Live Monitoring</h2>
                    <button
                      onClick={toggleMonitoring}
                      className={`px-4 py-2 rounded-xl text-sm font-bold transition ${
                        monitoring ? 'bg-red-600/20 text-red-400 border border-red-600' : 'bg-green-600/20 text-green-400 border border-green-600'
                      }`}
                    >
                      {monitoring ? 'Stop Monitoring' : 'Start Monitoring'}
                    </button>
                  </div>
                  {monitoring && (
                    <div className="mt-4 text-sm text-gray-300">
                      <p>✅ Monitoring active for {presaleData.token.symbol}</p>
                      <p className="text-xs text-gray-500 mt-1">Alerts: Ownership Change, Liquidity Removed, Whale Sell</p>
                      <div className="flex items-center gap-2 mt-2">
                        {isRefreshing ? (
                          <div className="flex items-center gap-2 text-green-400">
                            <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            <span>Refreshing...</span>
                          </div>
                        ) : (
                          <p className="text-xs text-green-400">🔄 Next refresh in {countdown}s</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {!loading && !presaleData && !error && (
          <div className="text-center py-20 text-gray-500">
            <p className="text-2xl mb-2">🔍 Enter a token address to analyze</p>
            <p>Data is fetched from GoPlus, DexScreener, CoinGecko, PinkSale, Solscan, and public blockchains.</p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="max-w-6xl mx-auto w-full mt-12 pt-6 border-t border-gray-800">
        <div className="bg-gray-900/50 p-4 rounded-xl border border-gray-800 text-center text-xs text-gray-400">
          <p className="font-semibold text-white text-sm">🤖 Solt Presale Checker</p>
          <p className="mt-1">
            Data Sources: <span className="text-purple-400">GoPlus Security</span>,{' '}
            <span className="text-blue-400">DexScreener</span>,{' '}
            <span className="text-green-400">CoinGecko</span>,{' '}
            <span className="text-pink-400">PinkSale</span>,{' '}
            <span className="text-cyan-400">Solscan</span>, and Public Blockchain Data.
          </p>
          <p className="mt-1 text-[10px] text-gray-500 max-w-2xl mx-auto">
            Information is aggregated from third-party providers and on-chain analysis.
            May be delayed or incomplete. Always do your own research.
          </p>
          <p className="mt-1 text-[10px] text-gray-500">
            © 2026 Solt Presale Checker — By Soltchain Technologies. All Rights Reserved.
          </p>
        </div>
      </div>
    </div>
  );
};

export default PresaleChecker;