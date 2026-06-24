import React, { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';
import { ethers } from 'ethers';
import { useWeb3React } from '@web3-react/core';
import { InjectedConnector } from '@web3-react/injected-connector';
import { WalletConnectConnector } from '@web3-react/walletconnect-connector';
import { WalletLinkConnector } from '@web3-react/walletlink-connector';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import Papa from 'papaparse';

// --- Etherscan API Key (Optional) ---
const ETHERSCAN_API_KEY = 'YOUR_ETHERSCAN_API_KEY';

// --- Connectors ---
export const injected = new InjectedConnector({
  supportedChainIds: [1, 56, 137, 42161, 10, 43114],
});

export const walletconnect = new WalletConnectConnector({
  rpc: {
    1: 'https://cloudflare-eth.com',
  },
  chainId: 1,
  qrcode: true,
});

export const coinbaseWallet = new WalletLinkConnector({
  url: 'https://cloudflare-eth.com',
  appName: 'Solt Portfolio Tracker',
  supportedChainIds: [1, 56, 137, 42161, 10],
});

// --- MAIN COMPONENT ---
const PortfolioTracker = () => {
  const { active, account, activate, deactivate, chainId } = useWeb3React();

  // --- Core State ---
  const [wallets, setWallets] = useState([]);
  const [manualAddress, setManualAddress] = useState('');
  const [portfolio, setPortfolio] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState('');
  const [error, setError] = useState(null);
  const [selectedTimeframe, setSelectedTimeframe] = useState('7d');
  const [sortBy, setSortBy] = useState('value');
  const [chartData, setChartData] = useState([]);
  const [chartLoading, setChartLoading] = useState(false);
  const [walletAge, setWalletAge] = useState(null);
  const [approvals, setApprovals] = useState(null);
  const [ath, setAth] = useState(null);
  const [monthlyChange, setMonthlyChange] = useState(null);
  const [marketChange24h, setMarketChange24h] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [lastActivity, setLastActivity] = useState(null);
  const [copySuccess, setCopySuccess] = useState(false);

  // --- Custom Tokens ---
  const [customTokens, setCustomTokens] = useState([]);
  const [newTokenAddress, setNewTokenAddress] = useState('');
  const [newTokenChain, setNewTokenChain] = useState(1);

  // --- Premium Features State ---
  const [watchlist, setWatchlist] = useState([]);
  const [watchlistPrices, setWatchlistPrices] = useState({});
  const [priceAlerts, setPriceAlerts] = useState([]);
  const [alertSymbol, setAlertSymbol] = useState('');
  const [alertCondition, setAlertCondition] = useState('above');
  const [alertPrice, setAlertPrice] = useState('');
  const [goalTarget, setGoalTarget] = useState(10000);
  const [snapshots, setSnapshots] = useState([]);
  const [trackingStartDate, setTrackingStartDate] = useState(null);
  const [lastSyncTime, setLastSyncTime] = useState(null);

  // --- New Features State ---
  const [searchQuery, setSearchQuery] = useState('');
  const [hideDust, setHideDust] = useState(false);
  const [editingWalletIndex, setEditingWalletIndex] = useState(null);
  const [shareLinkCopied, setShareLinkCopied] = useState(false);

  // --- Chain Configuration (Public RPCs) ---
  const chains = {
    1: { name: 'Ethereum', symbol: 'ETH', rpc: 'https://cloudflare-eth.com' },
    56: { name: 'BNB Chain', symbol: 'BNB', rpc: 'https://bsc-dataseed.binance.org/' },
    137: { name: 'Polygon', symbol: 'MATIC', rpc: 'https://polygon-mainnet.g.alchemy.com/v2/demo' },
    42161: { name: 'Arbitrum', symbol: 'ETH', rpc: 'https://arb1.arbitrum.io/rpc' },
    10: { name: 'Optimism', symbol: 'ETH', rpc: 'https://mainnet.optimism.io' },
    43114: { name: 'Avalanche', symbol: 'AVAX', rpc: 'https://api.avax.network/ext/bc/C/rpc' },
  };

  // --- Native token addresses ---
  const nativeTokenAddresses = {
    1: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
    56: '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c',
    137: '0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270',
    42161: '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1',
    10: '0x4200000000000000000000000000000000000006',
    43114: '0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7',
  };

  // --- Asset Categories ---
  const categoryMap = {
    'USDC': 'Stablecoins',
    'USDT': 'Stablecoins',
    'DAI': 'Stablecoins',
    'BUSD': 'Stablecoins',
    'ETH': 'Blue Chip',
    'BTC': 'Blue Chip',
    'BNB': 'Blue Chip',
    'SOL': 'Blue Chip',
    'ADA': 'Blue Chip',
    'DOT': 'Blue Chip',
    'AVAX': 'Blue Chip',
    'MATIC': 'Blue Chip',
    'LINK': 'Blue Chip',
    'UNI': 'Blue Chip',
    'AAVE': 'Blue Chip',
    'MKR': 'DeFi',
    'COMP': 'DeFi',
    'CRV': 'DeFi',
    'DOGE': 'Meme',
    'SHIB': 'Meme',
    'PEPE': 'Meme',
    'SAND': 'Gaming',
    'MANA': 'Gaming',
  };

  const ERC20_ABI = [
    'function balanceOf(address owner) view returns (uint256)',
    'function decimals() view returns (uint8)',
    'function symbol() view returns (string)',
  ];

  const [trackedTokens] = useState([
    { address: '0x6b175474e89094c44da98b954eedeac495271d0f', chainId: 1, symbol: 'DAI' },
    { address: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48', chainId: 1, symbol: 'USDC' },
    { address: '0xdac17f958d2ee523a2206206994597c13d831ec7', chainId: 1, symbol: 'USDT' },
    { address: '0x514910771af9ca656af840dff83e8264ecf986ca', chainId: 1, symbol: 'LINK' },
    { address: '0x1f9840a85d5af5bf1d1762f925bdaddc4201f984', chainId: 1, symbol: 'UNI' },
    { address: '0x7fc66500c84a76ad7e9c93437bfc5ac33e2ddae9', chainId: 1, symbol: 'AAVE' },
    { address: '0x95ad61b0a150d79219dcf64e1e6cc01f0b64c4ce', chainId: 1, symbol: 'SHIB' },
    { address: '0x55d398326f99059ff775485246999027b3197955', chainId: 56, symbol: 'USDT' },
    { address: '0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d', chainId: 56, symbol: 'USDC' },
    { address: '0x2791bca1f2de4661ed88a30c99a7a9449aa84174', chainId: 137, symbol: 'USDC' },
    { address: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831', chainId: 42161, symbol: 'USDC' },
    { address: '0x7f5c764cbc14f9669b88837ca1490cca17c31607', chainId: 10, symbol: 'USDC' },
  ]);

  // --- Helpers ---
  const getChainName = (id) => chains[id]?.name || `Chain ${id}`;
  const getChainSymbol = (id) => chains[id]?.symbol || 'ETH';

  const formatCurrency = (value) => {
    if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
    if (value >= 1e6) return `$${(value / 1e6).toFixed(2)}M`;
    if (value >= 1e3) return `$${(value / 1e3).toFixed(2)}K`;
    return `$${value.toFixed(2)}`;
  };

  const formatNumber = (value, decimals = 2) => {
    if (value >= 1e9) return `${(value / 1e9).toFixed(2)}B`;
    if (value >= 1e6) return `${(value / 1e6).toFixed(2)}M`;
    if (value >= 1e3) return `${(value / 1e3).toFixed(2)}K`;
    return value.toFixed(decimals);
  };

  // --- Copy address ---
  const copyAddress = (address) => {
    navigator.clipboard.writeText(address);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  // --- Copy share link ---
  const copyShareLink = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    setShareLinkCopied(true);
    setTimeout(() => setShareLinkCopied(false), 2000);
  };

  // --- Wallet rename ---
  const renameWallet = (index, newName) => {
    const updated = [...wallets];
    updated[index].label = newName || `Wallet ${index + 1}`;
    setWallets(updated);
    setEditingWalletIndex(null);
  };

  // --- Watchlist ---
  const fetchWatchlistPrice = async (symbol) => {
    try {
      const res = await axios.get(
        `https://api.coingecko.com/api/v3/simple/price?ids=${symbol}&vs_currencies=usd`
      );
      return res.data?.[symbol]?.usd || null;
    } catch { return null; }
  };

  const addToWatchlist = async (symbol) => {
    if (!symbol) return;
    const id = symbol.toLowerCase();
    if (watchlist.includes(id)) return;
    const price = await fetchWatchlistPrice(id);
    if (price !== null) {
      setWatchlist([...watchlist, id]);
      setWatchlistPrices({ ...watchlistPrices, [id]: price });
    } else {
      setError(`Could not find token: ${symbol}`);
    }
  };

  const removeFromWatchlist = (symbol) => {
    setWatchlist(watchlist.filter(s => s !== symbol));
    const newPrices = { ...watchlistPrices };
    delete newPrices[symbol];
    setWatchlistPrices(newPrices);
  };

  // --- Price Alerts ---
  const addPriceAlert = () => {
    if (!alertSymbol || !alertPrice) return;
    const id = alertSymbol.toLowerCase();
    const price = parseFloat(alertPrice);
    if (isNaN(price)) return;
    setPriceAlerts([...priceAlerts, { symbol: id, condition: alertCondition, price, triggered: false }]);
    setAlertSymbol('');
    setAlertPrice('');
  };

  const removePriceAlert = (index) => {
    setPriceAlerts(priceAlerts.filter((_, i) => i !== index));
  };

  const checkAlerts = useCallback(async () => {
    if (priceAlerts.length === 0) return;
    for (const alert of priceAlerts) {
      if (alert.triggered) continue;
      const currentPrice = watchlistPrices[alert.symbol];
      if (currentPrice === undefined) continue;
      let triggered = false;
      if (alert.condition === 'above' && currentPrice >= alert.price) triggered = true;
      if (alert.condition === 'below' && currentPrice <= alert.price) triggered = true;
      if (triggered) {
        alert.triggered = true;
        console.log(`ALERT: ${alert.symbol} ${alert.condition} ${alert.price} (current: ${currentPrice})`);
      }
    }
    setPriceAlerts([...priceAlerts]);
  }, [priceAlerts, watchlistPrices]);

  // --- Portfolio Goals ---
  const goalProgress = portfolio ? Math.min(100, (portfolio.totalValue / goalTarget) * 100) : 0;

  // --- Achievements ---
  const achievements = useMemo(() => {
    if (!portfolio) return [];
    const earned = [];
    const total = portfolio.totalValue;
    const chains = portfolio.totalChains;
    const stablePct = portfolio.stablePercent;
    const riskScore = portfolio.riskScore;
    const assets = portfolio.totalAssets;

    if (total >= 1000) earned.push({ icon: '🐋', name: 'Whale In Training', desc: 'Portfolio > $1,000' });
    if (total >= 5000) earned.push({ icon: '🐳', name: 'Whale', desc: 'Portfolio > $5,000' });
    if (chains >= 3) earned.push({ icon: '🌐', name: 'Chain Explorer', desc: '3+ Chains' });
    if (chains >= 5) earned.push({ icon: '🏆', name: 'Diversification Expert', desc: '5+ Chains' });
    if (stablePct >= 50) earned.push({ icon: '🛡️', name: 'Stablecoin Master', desc: '50%+ Stablecoins' });
    if (riskScore <= 10) earned.push({ icon: '🟢', name: 'Low Risk', desc: 'Risk Score ≤ 10' });
    if (assets >= 5) earned.push({ icon: '📊', name: 'Diversified', desc: '5+ Assets' });
    return earned;
  }, [portfolio]);

  // --- Portfolio Age ---
  const portfolioAge = useMemo(() => {
    if (!trackingStartDate) return null;
    const start = new Date(trackingStartDate);
    const now = new Date();
    const days = Math.floor((now - start) / (1000 * 60 * 60 * 24));
    return { days, startDate: start.toLocaleDateString() };
  }, [trackingStartDate]);

  // --- Snapshot functions ---
  const takeSnapshot = () => {
    if (!portfolio) return;
    const newSnapshot = {
      date: new Date().toISOString(),
      value: portfolio.totalValue,
    };
    const updated = [...snapshots, newSnapshot];
    setSnapshots(updated);
    localStorage.setItem('portfolioSnapshots', JSON.stringify(updated));
  };

  // --- Load snapshots from localStorage on mount ---
  useEffect(() => {
    const saved = localStorage.getItem('portfolioSnapshots');
    if (saved) {
      try { setSnapshots(JSON.parse(saved)); } catch {}
    }
    if (!trackingStartDate) {
      setTrackingStartDate(new Date().toISOString());
    }
  }, []);

  // --- Fetch market comparison ---
  const fetchMarketChange = async () => {
    try {
      const res = await axios.get('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum&vs_currencies=usd&include_24hr_change=true');
      if (res.data) {
        const btcChange = res.data.bitcoin?.usd_24h_change || 0;
        const ethChange = res.data.ethereum?.usd_24h_change || 0;
        return (btcChange + ethChange) / 2;
      }
    } catch { /* ignore */ }
    return null;
  };

  // --- Wallet Age & First Transaction ---
  const fetchWalletAge = async (address) => {
    if (!ETHERSCAN_API_KEY || ETHERSCAN_API_KEY === 'YOUR_ETHERSCAN_API_KEY') return null;
    try {
      const res = await axios.get(
        `https://api.etherscan.io/api?module=account&action=txlist&address=${address}&sort=asc&limit=1&apikey=${ETHERSCAN_API_KEY}`
      );
      if (res.data.status === '1' && res.data.result && res.data.result.length > 0) {
        const ts = parseInt(res.data.result[0].timeStamp);
        const days = Math.floor((Date.now() - ts * 1000) / (86400000));
        const date = new Date(ts * 1000).toISOString().split('T')[0];
        const years = (days / 365).toFixed(1);
        return { days, years, firstTx: date };
      }
      return null;
    } catch { return null; }
  };

  // --- Recent Transactions & Last Activity ---
  const fetchRecentTransactions = async (address) => {
    if (!ETHERSCAN_API_KEY || ETHERSCAN_API_KEY === 'YOUR_ETHERSCAN_API_KEY') return { txs: [], lastActivity: null };
    try {
      const res = await axios.get(
        `https://api.etherscan.io/api?module=account&action=txlist&address=${address}&sort=desc&limit=10&apikey=${ETHERSCAN_API_KEY}`
      );
      if (res.data.status === '1' && res.data.result) {
        const txs = res.data.result.map(tx => ({
          hash: tx.hash,
          from: tx.from,
          to: tx.to,
          value: parseFloat(ethers.utils.formatEther(tx.value)),
          timestamp: new Date(parseInt(tx.timeStamp) * 1000).toLocaleString(),
          method: tx.input === '0x' ? 'Transfer' : 'Contract Interaction',
        }));
        const lastTx = txs.length > 0 ? txs[0] : null;
        const lastActivity = lastTx ? lastTx.timestamp : null;
        return { txs: txs.slice(0, 10), lastActivity };
      }
      return { txs: [], lastActivity: null };
    } catch { return { txs: [], lastActivity: null }; }
  };

  // --- Approval Checker ---
  const fetchApprovals = async (address) => {
    if (!ETHERSCAN_API_KEY || ETHERSCAN_API_KEY === 'YOUR_ETHERSCAN_API_KEY') return null;
    try {
      const tokens = [
        '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
        '0xdac17f958d2ee523a2206206994597c13d831ec7',
        '0x6b175474e89094c44da98b954eedeac495271d0f',
        '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
      ];
      let unlimitedCount = 0;
      for (const token of tokens) {
        const res = await axios.get(
          `https://api.etherscan.io/api?module=account&action=tokenapprovalcheck&address=${address}&tokenaddress=${token}&apikey=${ETHERSCAN_API_KEY}`
        );
        if (res.data.status === '1' && res.data.result) {
          for (const approval of res.data.result) {
            if (approval.allowance > 1e18) unlimitedCount++;
          }
        }
      }
      return { unlimited: unlimitedCount, total: tokens.length };
    } catch { return null; }
  };

  // --- Price fetch ---
  const fetchTokenPrice = async (address, chainId) => {
    try {
      let tokenAddress = address;
      if (!address) {
        tokenAddress = nativeTokenAddresses[chainId];
        if (!tokenAddress) return { price: 0, change24h: 0 };
      }
      const url = `https://api.dexscreener.com/latest/dex/tokens/${tokenAddress}`;
      const res = await axios.get(url);
      if (res.data && res.data.pairs) {
        let chainName = chainId === 1 ? 'ethereum' : chainId.toString();
        const pair = res.data.pairs.find(p => p.chainId === chainName);
        if (pair) {
          return {
            price: parseFloat(pair.priceUsd || 0),
            change24h: parseFloat(pair.priceChange?.h24 || 0),
          };
        }
        const firstPair = res.data.pairs[0];
        if (firstPair) {
          return {
            price: parseFloat(firstPair.priceUsd || 0),
            change24h: parseFloat(firstPair.priceChange?.h24 || 0),
          };
        }
      }
      return { price: 0, change24h: 0 };
    } catch { return { price: 0, change24h: 0 }; }
  };

  // --- Historical prices ---
  const fetchHistoricalPrices = async (cgId, days = 7) => {
    if (!cgId) return null;
    try {
      const url = `https://api.coingecko.com/api/v3/coins/${cgId}/market_chart?vs_currency=usd&days=${days}`;
      const res = await axios.get(url);
      if (res.data && res.data.prices) {
        return res.data.prices.map(p => ({ timestamp: p[0], price: p[1] }));
      }
    } catch { /* ignore */ }
    return null;
  };

  // --- Balance helpers ---
  const fetchNativeBalance = async (walletAddress, chainId) => {
    try {
      const chain = chains[chainId];
      if (!chain) return 0;
      const provider = new ethers.providers.JsonRpcProvider(chain.rpc);
      const balance = await provider.getBalance(walletAddress);
      return parseFloat(ethers.utils.formatEther(balance));
    } catch { return 0; }
  };

  const fetchTokenBalance = async (tokenAddress, walletAddress, chainId) => {
    try {
      const chain = chains[chainId];
      if (!chain) return 0;
      const provider = new ethers.providers.JsonRpcProvider(chain.rpc);
      const contract = new ethers.Contract(tokenAddress, ERC20_ABI, provider);
      const balance = await contract.balanceOf(walletAddress);
      const decimals = await contract.decimals();
      return parseFloat(ethers.utils.formatUnits(balance, decimals));
    } catch { return 0; }
  };

  // --- Main portfolio fetch ---
  const fetchPortfolio = useCallback(async () => {
    if (wallets.length === 0) {
      setPortfolio(null);
      return;
    }

    setLoading(true);
    setLoadingStatus('Fetching wallet data...');
    setError(null);

    try {
      const allTokens = [...trackedTokens, ...customTokens];
      const tokensByChain = {};
      allTokens.forEach(token => {
        if (!tokensByChain[token.chainId]) tokensByChain[token.chainId] = [];
        tokensByChain[token.chainId].push(token);
      });

      let totalValue = 0;
      let totalPnL = 0;
      let totalChange24h = 0;
      const assetsMap = {};
      const chainBreakdown = {};
      const tokenBalances = {};

      setLoadingStatus('Loading balances & prices...');

      for (const wallet of wallets) {
        const address = wallet.address;
        const chainIds = new Set(Object.keys(tokensByChain).concat(Object.keys(chains)));
        for (const cId of chainIds) {
          const chainId = parseInt(cId);
          const chainSymbol = getChainSymbol(chainId);
          if (!chainBreakdown[chainId]) chainBreakdown[chainId] = 0;

          const nativeBal = await fetchNativeBalance(address, chainId);
          const nativePriceData = await fetchTokenPrice(null, chainId);
          const nativeValue = nativeBal * nativePriceData.price;
          if (nativeBal > 0) {
            const key = `native-${chainId}`;
            if (!assetsMap[key]) {
              assetsMap[key] = {
                symbol: chainSymbol,
                chainId,
                balance: 0,
                price: nativePriceData.price,
                value: 0,
                change24h: nativePriceData.change24h || 0,
                isNative: true,
                address: 'native',
              };
            }
            assetsMap[key].balance += nativeBal;
            assetsMap[key].value += nativeValue;
            assetsMap[key].price = nativePriceData.price;
            chainBreakdown[chainId] += nativeValue;
            totalValue += nativeValue;
            if (!tokenBalances['native']) tokenBalances['native'] = { balance: 0, symbol: chainSymbol };
            tokenBalances['native'].balance += nativeBal;
          }

          const chainTokens = tokensByChain[chainId] || [];
          for (const token of chainTokens) {
            const bal = await fetchTokenBalance(token.address, address, chainId);
            if (bal > 0) {
              const priceData = await fetchTokenPrice(token.address, chainId);
              const val = bal * priceData.price;
              const key = `${token.address}-${chainId}`;
              if (!assetsMap[key]) {
                assetsMap[key] = {
                  symbol: token.symbol,
                  chainId,
                  balance: 0,
                  price: priceData.price,
                  value: 0,
                  change24h: priceData.change24h || 0,
                  isNative: false,
                  address: token.address,
                };
              }
              assetsMap[key].balance += bal;
              assetsMap[key].value += val;
              assetsMap[key].price = priceData.price;
              chainBreakdown[chainId] += val;
              totalValue += val;
              tokenBalances[token.address] = { balance: bal, symbol: token.symbol };
            }
          }
        }
      }

      setLoadingStatus('Analyzing portfolio...');

      const assets = Object.values(assetsMap);
      let totalCostBasis = 0;

      assets.forEach(asset => {
        asset.allocation = totalValue > 0 ? (asset.value / totalValue) * 100 : 0;
        const costBasis = asset.value * 0.7;
        asset.costBasis = costBasis;
        asset.pnl = asset.value - costBasis;
        totalCostBasis += costBasis;
        totalPnL += asset.pnl;
      });

      let weightedChange = 0;
      if (totalValue > 0) {
        assets.forEach(asset => {
          weightedChange += (asset.value / totalValue) * (asset.change24h || 0);
        });
      }
      totalChange24h = weightedChange;

      // Risk Analysis
      let riskScore = 0;
      let safeAssets = 0;
      let mediumRisk = 0;
      let highRisk = 0;
      let highRiskTokens = [];

      for (const asset of assets) {
        if (asset.isNative || asset.address === 'native') { safeAssets++; continue; }
        try {
          const scanRes = await axios.get(
            `https://api.gopluslabs.io/api/v1/token_security/${asset.chainId}?contract_addresses=${asset.address}`
          );
          const scanData = scanRes.data.result?.[asset.address.toLowerCase()];
          if (scanData) {
            let score = 0;
            if (scanData.is_honeypot === "1") score += 15;
            if (scanData.hidden_mint === "1") score += 8;
            if (scanData.is_owner_renounced === "0") score += 5;
            if (scanData.is_proxy === "1") score += 5;
            if (scanData.is_blacklisted === "1") score += 4;
            if (score < 5) safeAssets++;
            else if (score < 15) mediumRisk++;
            else { highRisk++; highRiskTokens.push(asset.symbol); }
            riskScore += score;
          }
        } catch {
          mediumRisk++;
          riskScore += 10;
        }
      }

      const totalRiskAssets = safeAssets + mediumRisk + highRisk;
      const riskScoreFinal = totalRiskAssets > 0 ? Math.round(riskScore / totalRiskAssets) : 0;

      // Categories
      const categories = {};
      assets.forEach(a => {
        const cat = categoryMap[a.symbol] || 'Other';
        categories[cat] = (categories[cat] || 0) + a.value;
      });

      const stablecoinSymbols = ['USDC', 'USDT', 'DAI', 'BUSD'];
      const blueChipSymbols = ['ETH', 'BTC', 'BNB', 'SOL', 'ADA', 'DOT', 'AVAX', 'MATIC', 'LINK', 'UNI', 'AAVE'];
      let stableValue = 0, blueChipValue = 0, highRiskValue = 0;
      assets.forEach(a => {
        if (stablecoinSymbols.includes(a.symbol)) stableValue += a.value;
        else if (blueChipSymbols.includes(a.symbol)) blueChipValue += a.value;
        else highRiskValue += a.value;
      });
      const stablePercent = totalValue > 0 ? (stableValue / totalValue) * 100 : 0;
      const blueChipPercent = totalValue > 0 ? (blueChipValue / totalValue) * 100 : 0;
      const highRiskPercent = totalValue > 0 ? (highRiskValue / totalValue) * 100 : 0;

      // --- Portfolio Grade ---
      const assetCount = assets.length;
      const divScore = assetCount >= 10 ? 100 : assetCount >= 5 ? 80 : assetCount >= 3 ? 60 : 30;
      const riskScoreWeight = 100 - riskScoreFinal;
      const stableWeight = 100 - Math.min(stablePercent, 80);
      const healthRaw = (0.4 * riskScoreWeight + 0.3 * divScore + 0.3 * stableWeight);
      const healthScore = Math.min(100, Math.round(healthRaw));

      let grade = 'D';
      if (healthScore >= 90) grade = 'A+';
      else if (healthScore >= 80) grade = 'A';
      else if (healthScore >= 70) grade = 'B';
      else if (healthScore >= 60) grade = 'C';
      else grade = 'D';

      // --- Portfolio Type ---
      let portfolioType = 'Balanced';
      let portfolioTypeEmoji = '🟡';
      if (stablePercent > 70) {
        portfolioType = 'Conservative';
        portfolioTypeEmoji = '🟢';
      } else if (highRiskPercent > 30) {
        portfolioType = 'Aggressive';
        portfolioTypeEmoji = '🔴';
      } else if (blueChipPercent > 50) {
        portfolioType = 'Balanced';
        portfolioTypeEmoji = '🟡';
      }

      // --- Portfolio Insights ---
      const sortedAssets = [...assets].sort((a, b) => b.value - a.value);
      const biggestAsset = sortedAssets[0] || null;
      const largestChain = Object.entries(chainBreakdown).sort((a, b) => b[1] - a[1])[0];
      const bestPerformer = sortedAssets.sort((a, b) => (b.change24h || 0) - (a.change24h || 0))[0] || null;
      const concentrationWarning = biggestAsset && biggestAsset.allocation > 30;

      // --- Rebalancing Suggestions ---
      const currentStable = stablePercent;
      const currentBlueChip = blueChipPercent;
      const currentGrowth = highRiskPercent;
      const targetStable = 40;
      const targetBlueChip = 50;
      const targetGrowth = 10;
      const rebalance = [];
      if (currentStable > targetStable + 10) rebalance.push(`Reduce stablecoins from ${currentStable.toFixed(1)}% to ~${targetStable}%`);
      if (currentBlueChip < targetBlueChip - 10) rebalance.push(`Increase blue-chip exposure from ${currentBlueChip.toFixed(1)}% to ~${targetBlueChip}%`);
      if (currentGrowth < targetGrowth - 5) rebalance.push(`Add growth assets to reach ~${targetGrowth}%`);
      if (rebalance.length === 0) rebalance.push('Your portfolio is already well balanced.');

      setPortfolio({
        totalValue,
        totalPnL,
        totalChange24h,
        totalAssets: assetCount,
        totalChains: Object.keys(chainBreakdown).length,
        assets,
        chainBreakdown,
        riskScore: riskScoreFinal,
        safeAssets,
        mediumRisk,
        highRisk,
        highRiskTokens,
        totalCostBasis,
        walletCount: wallets.length,
        stablePercent,
        blueChipPercent,
        highRiskPercent,
        tokenBalances,
        categories,
        grade,
        healthScore,
        divScore,
        biggestAsset,
        largestChain: largestChain ? { chainId: largestChain[0], value: largestChain[1] } : null,
        bestPerformer,
        portfolioType,
        portfolioTypeEmoji,
        rebalance,
        concentrationWarning,
        totalChange24h,
      });

      // Fetch chart data
      await fetchChartData(tokenBalances, selectedTimeframe);

      // Fetch wallet details
      if (wallets.length > 0 && wallets[0].address) {
        const addr = wallets[0].address;
        const age = await fetchWalletAge(addr);
        setWalletAge(age);
        const approvalsData = await fetchApprovals(addr);
        setApprovals(approvalsData);
        const { txs, lastActivity } = await fetchRecentTransactions(addr);
        setRecentTransactions(txs);
        setLastActivity(lastActivity);
      }

      const marketChange = await fetchMarketChange();
      setMarketChange24h(marketChange);
      const now = new Date().toLocaleString();
      setLastUpdated(now);
      setLastSyncTime(now);
      setLoadingStatus('Done!');

      await checkAlerts();

    } catch (err) {
      setError(err.message || 'Failed to fetch portfolio.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [wallets, trackedTokens, customTokens, selectedTimeframe, checkAlerts]);

  // --- Fetch chart data ---
  const fetchChartData = async (tokenBalances, timeframe) => {
    if (!tokenBalances || Object.keys(tokenBalances).length === 0) return;
    setChartLoading(true);
    try {
      const daysMap = { '24h': 1, '7d': 7, '30d': 30, 'all': 365 };
      const days = daysMap[timeframe] || 7;
      const tokenPriceHistory = {};
      const addressMap = {
        '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2': 'ethereum',
        '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c': 'binancecoin',
        '0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270': 'matic-network',
        '0x514910771af9ca656af840dff83e8264ecf986ca': 'chainlink',
        '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48': 'usd-coin',
        '0xdac17f958d2ee523a2206206994597c13d831ec7': 'tether',
        '0x55d398326f99059ff775485246999027b3197955': 'tether',
        '0x1f9840a85d5af5bf1d1762f925bdaddc4201f984': 'uniswap',
        '0x7fc66500c84a76ad7e9c93437bfc5ac33e2ddae9': 'aave',
        '0x95ad61b0a150d79219dcf64e1e6cc01f0b64c4ce': 'shiba-inu',
        '0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d': 'usd-coin',
        '0x2791bca1f2de4661ed88a30c99a7a9449aa84174': 'usd-coin',
        '0xaf88d065e77c8cC2239327C5EDb3A432268e5831': 'usd-coin',
        '0x7f5c764cbc14f9669b88837ca1490cca17c31607': 'usd-coin',
        '0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7': 'avalanche-2',
      };
      const nativeMap = { 'ETH': 'ethereum', 'BNB': 'binancecoin', 'MATIC': 'matic-network', 'AVAX': 'avalanche-2' };
      for (const [addr, data] of Object.entries(tokenBalances)) {
        let cgId = addr === 'native' ? nativeMap[data.symbol] : addressMap[addr.toLowerCase()];
        if (cgId) {
          const history = await fetchHistoricalPrices(cgId, days);
          if (history) tokenPriceHistory[addr] = { history, balance: data.balance };
        }
      }

      if (Object.keys(tokenPriceHistory).length === 0) {
        setChartData([]);
        setAth(null);
        setMonthlyChange(null);
        setChartLoading(false);
        return;
      }
      const firstToken = Object.values(tokenPriceHistory)[0];
      const chartPoints = firstToken.history.map((h, idx) => {
        let total = 0;
        for (const [addr, data] of Object.entries(tokenPriceHistory)) {
          total += (data.history[idx]?.price || 0) * data.balance;
        }
        return { timestamp: h.timestamp, value: total };
      });
      setChartData(chartPoints);

      if (chartPoints.length > 0) {
        setAth(Math.max(...chartPoints.map(p => p.value)));
        if (chartPoints.length > 1) {
          setMonthlyChange(chartPoints[chartPoints.length - 1].value - chartPoints[0].value);
        } else {
          setMonthlyChange(0);
        }
      }
    } catch (err) {
      console.error('Chart fetch failed', err);
    } finally {
      setChartLoading(false);
    }
  };

  // --- Wallet functions ---
  const connectWallet = async (type) => {
    try {
      if (type === 'metamask') await activate(injected);
      else if (type === 'walletconnect') await activate(walletconnect);
      else if (type === 'coinbase') await activate(coinbaseWallet);
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    if (active && account) {
      setWallets(prev => {
        if (!prev.find(w => w.address.toLowerCase() === account.toLowerCase())) {
          return [...prev, { address: account, label: `Wallet ${prev.length + 1}` }];
        }
        return prev;
      });
    }
  }, [active, account]);

  const addManualWallet = () => {
    if (manualAddress && ethers.utils.isAddress(manualAddress.trim())) {
      const addr = manualAddress.trim();
      setWallets(prev => {
        if (!prev.find(w => w.address.toLowerCase() === addr.toLowerCase())) {
          return [...prev, { address: addr, label: `Wallet ${prev.length + 1}` }];
        }
        return prev;
      });
      setManualAddress('');
      setError(null);
    } else {
      setError('Invalid Ethereum address.');
    }
  };

  const removeWallet = (index) => {
    setWallets(prev => prev.filter((_, i) => i !== index));
  };

  // --- Refresh function ---
  const refreshPortfolio = () => {
    if (wallets.length > 0) {
      fetchPortfolio();
    }
  };

  useEffect(() => {
    if (wallets.length > 0) {
      fetchPortfolio();
    } else {
      setPortfolio(null);
    }
  }, [wallets, fetchPortfolio]);

  // --- Auto-refresh timer (every 60 seconds) ---
  useEffect(() => {
    if (wallets.length === 0) return;
    const interval = setInterval(() => {
      fetchPortfolio();
    }, 60000);
    return () => clearInterval(interval);
  }, [wallets, fetchPortfolio]);

  // --- Custom tokens ---
  const addCustomToken = () => {
    if (newTokenAddress && ethers.utils.isAddress(newTokenAddress.trim())) {
      const addr = newTokenAddress.trim();
      setCustomTokens(prev => [...prev, { address: addr, chainId: newTokenChain, symbol: 'CUSTOM' }]);
      setNewTokenAddress('');
    } else {
      setError('Invalid token address.');
    }
  };

  const removeCustomToken = (index) => {
    setCustomTokens(prev => prev.filter((_, i) => i !== index));
  };

  // --- Export functions ---
  const exportPDF = () => {
    if (!portfolio) return;
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text('Solt Portfolio Report', 14, 22);
    doc.setFontSize(12);
    doc.text(`Total Value: ${formatCurrency(portfolio.totalValue)}`, 14, 32);
    doc.text(`Profit/Loss: ${formatCurrency(portfolio.totalPnL)}`, 14, 38);
    doc.text(`24h Change: ${portfolio.totalChange24h.toFixed(2)}%`, 14, 44);
    doc.text(`Risk Score: ${portfolio.riskScore}/100`, 14, 50);
    doc.text(`Grade: ${portfolio.grade}`, 14, 56);

    const tableData = portfolio.assets.map(a => [
      a.symbol,
      a.balance.toFixed(4),
      `$${a.price.toFixed(4)}`,
      formatCurrency(a.value),
      a.allocation.toFixed(1) + '%',
      formatCurrency(a.pnl),
    ]);
    autoTable(doc, {
      startY: 65,
      head: [['Asset', 'Balance', 'Price', 'Value', 'Allocation', 'PnL']],
      body: tableData,
    });
    doc.save('portfolio_report.pdf');
  };

  const exportCSV = () => {
    if (!portfolio) return;
    const data = portfolio.assets.map(a => ({
      Symbol: a.symbol,
      Balance: a.balance,
      Price: a.price,
      Value: a.value,
      Allocation: a.allocation,
      PnL: a.pnl,
      Change24h: a.change24h,
    }));
    const csv = Papa.unparse(data);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'portfolio.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  // --- Get top loser ---
  const getTopLoser = (assets) => {
    const stableSymbols = ['USDC', 'USDT', 'DAI', 'BUSD'];
    const nonStable = assets.filter(a => !stableSymbols.includes(a.symbol));
    if (nonStable.length === 0) return null;
    const sorted = [...nonStable].sort((a, b) => (a.change24h || 0) - (b.change24h || 0));
    const loser = sorted[0];
    if (loser && loser.change24h > 0) return null;
    return loser;
  };

  // --- Filtered and sorted assets ---
  const filteredAssets = useMemo(() => {
    if (!portfolio) return [];
    let assets = [...portfolio.assets];
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      assets = assets.filter(a => a.symbol.toLowerCase().includes(q));
    }
    if (hideDust) {
      assets = assets.filter(a => a.value >= 1);
    }
    const sortFunctions = {
      value: (a, b) => b.value - a.value,
      allocation: (a, b) => b.allocation - a.allocation,
      pnl: (a, b) => b.pnl - a.pnl,
      change: (a, b) => (b.change24h || 0) - (a.change24h || 0),
    };
    return assets.sort(sortFunctions[sortBy] || sortFunctions.value);
  }, [portfolio, searchQuery, hideDust, sortBy]);

  // --- Computed values ---
  const athValue = useMemo(() => {
    if (!portfolio) return null;
    const chartValues = chartData.map(d => d.value);
    const allValues = [portfolio.totalValue, ...chartValues];
    return Math.max(...allValues);
  }, [portfolio, chartData]);

  const historyStats = useMemo(() => {
    if (!chartData || chartData.length < 2) return null;
    const values = chartData.map(d => d.value);
    const allValues = [...values, portfolio.totalValue];
    const high7d = Math.max(...allValues.slice(-7));
    const low7d = Math.min(...allValues.slice(-7));
    const high30d = Math.max(...allValues.slice(-30));
    const low30d = Math.min(...allValues.slice(-30));
    const changes = values.slice(1).map((v, i) => (v - values[i]) / values[i] * 100);
    const bestDay = Math.max(...changes);
    const worstDay = Math.min(...changes);
    return { high7d, low7d, high30d, low30d, bestDay, worstDay };
  }, [chartData, portfolio]);

  const overallScore = useMemo(() => {
    if (!portfolio) return 0;
    const health = portfolio.healthScore || 0;
    const security = 100 - portfolio.riskScore;
    const diversification = portfolio.divScore || 0;
    const riskFactor = 100 - Math.min(portfolio.riskScore, 30);
    return Math.round(health * 0.4 + security * 0.3 + diversification * 0.2 + riskFactor * 0.1);
  }, [portfolio]);

  const investorProfile = useMemo(() => {
    if (!portfolio) return 'N/A';
    const stable = portfolio.stablePercent;
    const blueChip = portfolio.blueChipPercent;
    const highRisk = portfolio.highRiskPercent;
    if (stable > 70) return 'Conservative Investor (Capital Preservation)';
    if (blueChip > 50) return 'Balanced Investor';
    if (highRisk > 30) return 'Aggressive Investor';
    if (highRisk > 15) return 'Growth-Oriented Investor';
    return 'Balanced Investor';
  }, [portfolio]);

  const assetStats = useMemo(() => {
    if (!portfolio || !portfolio.assets.length) return null;
    const values = portfolio.assets.map(a => a.value);
    const sorted = [...values].sort((a, b) => a - b);
    const sum = values.reduce((acc, v) => acc + v, 0);
    return {
      average: sum / values.length,
      largest: sorted[sorted.length - 1],
      smallest: sorted[0],
    };
  }, [portfolio]);

  const multiChainScore = useMemo(() => {
    if (!portfolio) return 0;
    const totalChains = 6;
    const used = portfolio.totalChains;
    return Math.round((used / totalChains) * 100);
  }, [portfolio]);

  const portfolioActivity = useMemo(() => {
    if (!portfolio) return null;
    return {
      totalAssets: portfolio.totalAssets,
      totalChains: portfolio.totalChains,
      trackingDays: portfolioAge ? portfolioAge.days : 0,
    };
  }, [portfolio, portfolioAge]);

  const goalMessage = useMemo(() => {
    if (!portfolio || goalTarget <= portfolio.totalValue) return null;
    const remaining = goalTarget - portfolio.totalValue;
    return `You need to increase your portfolio by ${formatCurrency(remaining)} to reach your goal.`;
  }, [portfolio, goalTarget]);

  const riskWarnings = useMemo(() => {
    if (!portfolio) return [];
    const warnings = [];
    const biggest = portfolio.biggestAsset;
    if (biggest && biggest.allocation > 50) {
      warnings.push(`⚠️ One asset (${biggest.symbol}) exceeds 50% of portfolio.`);
    }
    const largestChain = portfolio.largestChain;
    if (largestChain && (largestChain.value / portfolio.totalValue) > 0.6) {
      const chainName = getChainName(parseInt(largestChain.chainId));
      warnings.push(`⚠️ One chain (${chainName}) exceeds 60% of portfolio.`);
    }
    if (marketChange24h !== null && portfolio.totalChange24h < marketChange24h) {
      warnings.push(`⚠️ Portfolio underperforming market by ${(marketChange24h - portfolio.totalChange24h).toFixed(2)}%.`);
    }
    return warnings;
  }, [portfolio, marketChange24h]);

  const portfolioSummary = useMemo(() => {
    if (!portfolio) return null;
    let verdict = 'Healthy Portfolio';
    let verdictColor = 'text-green-400';
    if (portfolio.riskScore > 30) { verdict = 'High Risk Portfolio'; verdictColor = 'text-red-400'; }
    else if (portfolio.riskScore > 15) { verdict = 'Moderate Risk Portfolio'; verdictColor = 'text-yellow-400'; }
    else if (portfolio.stablePercent > 70) { verdict = 'Conservative Portfolio'; verdictColor = 'text-blue-400'; }
    return { verdict, verdictColor };
  }, [portfolio]);

  const bestAssetEver = useMemo(() => {
    if (!portfolio || !portfolio.assets.length) return null;
    return portfolio.assets.reduce((best, current) => {
      return (current.pnl || 0) > (best.pnl || 0) ? current : best;
    }, portfolio.assets[0]);
  }, [portfolio]);

  // --- Display days tracked (fix) ---
  const displayDaysTracked = useMemo(() => {
    if (!portfolioAge) return null;
    if (portfolioAge.days === 0) return null; // hide if 0 days
    return portfolioAge.days;
  }, [portfolioAge]);

  // --- Part 1 ends here – return statement in Part 2 ---

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4 md:p-6 pt-20 flex flex-col">
      <div className="max-w-6xl mx-auto w-full">
        {/* --- Header --- */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent whitespace-nowrap">
            📊 Solt Portfolio Tracker
          </h1>
          <div className="flex flex-wrap gap-2 items-center">
            {!active ? (
              <>
                <button onClick={() => connectWallet('metamask')} className="bg-orange-600/20 hover:bg-orange-600/30 text-orange-400 px-3 py-1.5 rounded-xl border border-orange-600 text-xs font-medium transition">🦊 MetaMask</button>
                <button onClick={() => connectWallet('walletconnect')} className="bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 px-3 py-1.5 rounded-xl border border-blue-600 text-xs font-medium transition">📱 WalletConnect</button>
                <button onClick={() => connectWallet('coinbase')} className="bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 px-3 py-1.5 rounded-xl border border-blue-500 text-xs font-medium transition">🏦 Coinbase</button>
              </>
            ) : (
              <div className="flex items-center gap-3 text-sm flex-wrap">
                <div className="text-right">
                  <p className="text-xs text-gray-400">Connected</p>
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-purple-400">{account.slice(0,6)}...{account.slice(-4)}</p>
                    <button
                      onClick={() => copyAddress(account)}
                      className="text-gray-500 hover:text-gray-300 text-xs transition"
                      title="Copy address"
                    >
                      {copySuccess ? '✅' : '📋'}
                    </button>
                  </div>
                  <p className="text-xs text-gray-500">{getChainName(chainId)}</p>
                  {walletAge && (
                    <p className="text-xs text-gray-400">Age: {walletAge.years} years · First tx: {walletAge.firstTx}</p>
                  )}
                  {lastActivity && (
                    <p className="text-xs text-gray-400">Last activity: {lastActivity}</p>
                  )}
                  {lastSyncTime && (
                    <p className="text-xs text-gray-500">Last sync: {lastSyncTime}</p>
                  )}
                </div>
                {/* 🔄 Refresh Button */}
                <button
                  onClick={refreshPortfolio}
                  className="bg-purple-600/20 hover:bg-purple-600/30 text-purple-400 px-3 py-1.5 rounded-xl border border-purple-600 text-xs font-medium transition flex items-center gap-1"
                  title="Refresh portfolio data"
                >
                  🔄 Refresh
                </button>
                {/* 🔗 Share Button */}
                <button
                  onClick={copyShareLink}
                  className="bg-green-600/20 hover:bg-green-600/30 text-green-400 px-3 py-1.5 rounded-xl border border-green-600 text-xs font-medium transition flex items-center gap-1"
                  title="Copy share link"
                >
                  {shareLinkCopied ? '✅ Copied!' : '🔗 Share'}
                </button>
                <button onClick={() => { deactivate(); }} className="bg-red-600/20 hover:bg-red-600/30 text-red-400 px-3 py-1 rounded-xl border border-red-600 text-xs font-medium transition">Disconnect</button>
              </div>
            )}
          </div>
        </div>

        {/* --- Wallet Management --- */}
        <div className="bg-gray-800 p-4 rounded-2xl border border-gray-700 mb-6">
          <div className="flex flex-wrap gap-3 items-center">
            <div className="flex-1 min-w-[180px]">
              <input
                type="text"
                placeholder="Paste address to add wallet"
                value={manualAddress}
                onChange={(e) => setManualAddress(e.target.value)}
                className="w-full bg-gray-900 border border-gray-700 rounded-xl px-3 py-1.5 text-sm text-white focus:outline-none focus:border-purple-500"
              />
            </div>
            <button onClick={addManualWallet} className="bg-green-600/20 hover:bg-green-600/30 text-green-400 px-4 py-1.5 rounded-xl border border-green-600 text-sm font-medium transition">➕ Add Wallet</button>
            {portfolio && (
              <>
                <button onClick={exportPDF} className="bg-red-600/20 hover:bg-red-600/30 text-red-400 px-3 py-1.5 rounded-xl border border-red-600 text-sm font-medium transition">📄 PDF</button>
                <button onClick={exportCSV} className="bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 px-3 py-1.5 rounded-xl border border-blue-600 text-sm font-medium transition">📊 CSV</button>
              </>
            )}
          </div>
          <div className="flex flex-wrap gap-2 mt-3">
            {wallets.map((w, idx) => (
              <div key={idx} className="bg-gray-900 px-3 py-1 rounded-xl border border-gray-700 flex items-center gap-2 text-sm">
                {editingWalletIndex === idx ? (
                  <input
                    type="text"
                    defaultValue={w.label}
                    onBlur={(e) => renameWallet(idx, e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') renameWallet(idx, e.target.value);
                    }}
                    className="bg-gray-800 border border-purple-500 rounded px-1 py-0.5 text-white text-xs focus:outline-none w-24"
                    autoFocus
                  />
                ) : (
                  <span
                    className="font-mono cursor-pointer hover:text-purple-400 transition"
                    onClick={() => setEditingWalletIndex(idx)}
                    title="Click to rename"
                  >
                    {w.label}: {w.address.slice(0,6)}...{w.address.slice(-4)}
                  </span>
                )}
                <button
                  onClick={() => copyAddress(w.address)}
                  className="text-gray-500 hover:text-gray-300 text-xs transition"
                  title="Copy address"
                >
                  📋
                </button>
                <button onClick={() => removeWallet(idx)} className="text-red-400 hover:text-red-300 text-xs font-bold">✕</button>
              </div>
            ))}
            {wallets.length === 0 && <span className="text-gray-400 text-sm">No wallets added yet.</span>}
          </div>
        </div>

        {error && (
          <div className="bg-red-600/20 border-2 border-red-600 p-3 rounded-2xl text-center mb-6">
            <p className="text-red-400">⚠️ {error}</p>
          </div>
        )}

        {loading && (
          <div className="bg-gray-800/50 p-8 rounded-2xl border border-gray-700 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-500 border-t-transparent mx-auto mb-4"></div>
            <p className="text-gray-300 font-medium">{loadingStatus || 'Loading portfolio...'}</p>
            <div className="mt-4 max-w-md mx-auto">
              <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                <div className="h-full bg-purple-500 rounded-full animate-pulse" style={{ width: '60%' }}></div>
              </div>
            </div>
          </div>
        )}

        {!loading && wallets.length > 0 && portfolio && (
          <div className="space-y-4">
            {/* --- Overview Cards --- */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
              <div className="bg-gray-800 p-3 md:p-4 rounded-2xl border border-gray-700">
                <p className="text-gray-400 text-xs">Total Value</p>
                <p className="text-xl md:text-2xl font-bold">{formatCurrency(portfolio.totalValue)}</p>
                <p className={`text-xs ${!isNaN(portfolio.totalChange24h) && portfolio.totalChange24h !== 0 ? (portfolio.totalChange24h >= 0 ? 'text-green-400' : 'text-red-400') : 'text-gray-400'}`}>
                  {!isNaN(portfolio.totalChange24h) && portfolio.totalChange24h !== 0 ? `${portfolio.totalChange24h >= 0 ? '↑' : '↓'} ${Math.abs(portfolio.totalChange24h).toFixed(2)}%` : '0.00%'}
                </p>
              </div>
              <div className="bg-gray-800 p-3 md:p-4 rounded-2xl border border-gray-700">
                <p className="text-gray-400 text-xs">Profit/Loss</p>
                <p className={`text-xl md:text-2xl font-bold ${portfolio.totalPnL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {formatCurrency(portfolio.totalPnL)}
                </p>
              </div>
              <div className="bg-gray-800 p-3 md:p-4 rounded-2xl border border-gray-700">
                <p className="text-gray-400 text-xs">Assets / Wallets</p>
                <p className="text-xl md:text-2xl font-bold">{portfolio.totalAssets}</p>
                <p className="text-xs text-gray-500">{portfolio.walletCount} wallets, {portfolio.totalChains} chains</p>
              </div>
              <div className="bg-gray-800 p-3 md:p-4 rounded-2xl border border-gray-700">
                <p className="text-gray-400 text-xs">Portfolio Risk</p>
                <p className={`text-xl md:text-2xl font-bold ${portfolio.riskScore < 15 ? 'text-green-400' : portfolio.riskScore < 30 ? 'text-yellow-400' : 'text-red-400'}`}>
                  {portfolio.riskScore}/100
                </p>
                <div className="flex gap-1 mt-1 text-xs">
                  <span className="text-green-400">🟢 {portfolio.safeAssets}</span>
                  <span className="text-yellow-400">🟡 {portfolio.mediumRisk}</span>
                  <span className="text-red-400">🔴 {portfolio.highRisk}</span>
                </div>
              </div>
            </div>

            {/* --- Metrics Row --- */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
              <div className="bg-gray-800 p-2 md:p-3 rounded-2xl border border-gray-700 text-center">
                <p className="text-gray-400 text-xs">Portfolio Grade</p>
                <p className={`text-xl md:text-2xl font-bold ${portfolio.grade === 'A+' ? 'text-green-400' : portfolio.grade === 'A' ? 'text-green-300' : portfolio.grade === 'B' ? 'text-blue-400' : portfolio.grade === 'C' ? 'text-yellow-400' : 'text-red-400'}`}>
                  {portfolio.grade}
                </p>
              </div>
              <div className="bg-gray-800 p-2 md:p-3 rounded-2xl border border-gray-700 text-center">
                <p className="text-gray-400 text-xs">Health Score</p>
                <p className={`text-xl md:text-2xl font-bold ${portfolio.healthScore > 80 ? 'text-green-400' : portfolio.healthScore > 60 ? 'text-yellow-400' : 'text-red-400'}`}>
                  {portfolio.healthScore}/100
                </p>
              </div>
              <div className="bg-gray-800 p-2 md:p-3 rounded-2xl border border-gray-700 text-center">
                <p className="text-gray-400 text-xs">Security Score</p>
                <p className="text-xl md:text-2xl font-bold text-green-400">{100 - portfolio.riskScore}/100</p>
              </div>
              <div className="bg-gray-800 p-2 md:p-3 rounded-2xl border border-gray-700 text-center">
                <p className="text-gray-400 text-xs">Diversification</p>
                <p className={`text-xl md:text-2xl font-bold ${portfolio.divScore >= 80 ? 'text-green-400' : portfolio.divScore >= 50 ? 'text-yellow-400' : 'text-red-400'}`}>
                  {portfolio.divScore}/100
                </p>
              </div>
            </div>

            {/* --- Top Gainer / Loser & ATH / Monthly Change / Market --- */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 md:gap-4">
              {(() => {
                const sorted = [...portfolio.assets].sort((a, b) => (b.change24h || 0) - (a.change24h || 0));
                const topGainer = sorted[0];
                const topLoser = getTopLoser(portfolio.assets);
                const outperforming = marketChange24h !== null ? portfolio.totalChange24h > marketChange24h : null;
                const diff = marketChange24h !== null ? portfolio.totalChange24h - marketChange24h : null;
                return (
                  <>
                    <div className="bg-gray-800 p-2 md:p-3 rounded-2xl border border-green-600/30 text-center">
                      <p className="text-gray-400 text-xs">🏆 Top Gainer</p>
                      <p className="text-base md:text-lg font-bold text-green-400">{topGainer.symbol}</p>
                      <p className="text-xs md:text-sm text-green-400">+{topGainer.change24h?.toFixed(2)}%</p>
                    </div>
                    <div className="bg-gray-800 p-2 md:p-3 rounded-2xl border border-red-600/30 text-center">
                      <p className="text-gray-400 text-xs">📉 Top Loser</p>
                      {topLoser ? (
                        <>
                          <p className="text-base md:text-lg font-bold text-red-400">{topLoser.symbol}</p>
                          <p className="text-xs md:text-sm text-red-400">{topLoser.change24h?.toFixed(2)}%</p>
                        </>
                      ) : (
                        <p className="text-xs md:text-sm text-gray-400">No losers</p>
                      )}
                    </div>
                    <div className="bg-gray-800 p-2 md:p-3 rounded-2xl border border-purple-600/30 text-center">
                      <p className="text-gray-400 text-xs">📈 All-Time High</p>
                      <p className="text-base md:text-lg font-bold text-purple-400">
                        {athValue !== null ? formatCurrency(athValue) : 'N/A'}
                      </p>
                    </div>
                    <div className="bg-gray-800 p-2 md:p-3 rounded-2xl border border-blue-600/30 text-center">
                      <p className="text-gray-400 text-xs">📊 Monthly Change</p>
                      <p className={`text-base md:text-lg font-bold ${monthlyChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {monthlyChange !== null ? formatCurrency(monthlyChange) : 'N/A'}
                      </p>
                    </div>
                    {marketChange24h !== null && (
                      <div className="bg-gray-800 p-2 md:p-3 rounded-2xl border border-yellow-600/30 text-center">
                        <p className="text-gray-400 text-xs">📊 Vs Market</p>
                        {outperforming !== null ? (
                          <>
                            <p className={`text-base md:text-lg font-bold ${outperforming ? 'text-green-400' : 'text-red-400'}`}>
                              {outperforming ? '✅ Outperforming' : '❌ Underperforming'}
                            </p>
                            <p className="text-[10px] text-gray-400">
                              Portfolio: {portfolio.totalChange24h.toFixed(2)}% | Market: {marketChange24h.toFixed(2)}%
                              {diff !== null && ` (${diff > 0 ? '+' : ''}${diff.toFixed(2)}%)`}
                            </p>
                          </>
                        ) : (
                          <p className="text-sm text-gray-400">N/A</p>
                        )}
                      </div>
                    )}
                  </>
                );
              })()}
            </div>

            {/* --- Portfolio Insights --- */}
            <div className="bg-gray-800 p-3 md:p-4 rounded-2xl border border-gray-700">
              <h4 className="text-sm font-bold text-gray-300 mb-2">💡 Portfolio Insights</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                <div>
                  <span className="text-gray-400">Largest Asset:</span>
                  <span className="font-bold ml-1">{portfolio.biggestAsset?.symbol} ({portfolio.biggestAsset?.allocation.toFixed(1)}%)</span>
                </div>
                <div>
                  <span className="text-gray-400">Largest Chain:</span>
                  <span className="font-bold ml-1">
                    {portfolio.largestChain ? `${getChainName(parseInt(portfolio.largestChain.chainId))} (${((portfolio.largestChain.value / portfolio.totalValue) * 100).toFixed(1)}%)` : 'N/A'}
                  </span>
                </div>
                <div>
                  <span className="text-gray-400">Best Performer:</span>
                  <span className="font-bold ml-1 text-green-400">{portfolio.bestPerformer?.symbol} (+{portfolio.bestPerformer?.change24h?.toFixed(1)}%)</span>
                </div>
                <div>
                  <span className="text-gray-400">Portfolio Type:</span>
                  <span className="font-bold ml-1">
                    {portfolio.portfolioTypeEmoji} {portfolio.portfolioType}
                  </span>
                </div>
              </div>
              {walletAge && (
                <div className="mt-2 text-xs text-gray-400 border-t border-gray-700 pt-2">
                  Wallet Age: {walletAge.years} years · First Transaction: {walletAge.firstTx}
                </div>
              )}
              {lastActivity && (
                <div className="text-xs text-gray-400">Last Activity: {lastActivity}</div>
              )}
            </div>

            {/* --- Multi-Wallet Summary --- */}
            {wallets.length > 1 && portfolio && (
              <div className="bg-gray-800 p-3 md:p-4 rounded-2xl border border-gray-700">
                <h4 className="text-sm font-bold text-gray-300 mb-2">👛 Multi-Wallet Summary</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs">
                  {wallets.map((w, idx) => (
                    <div key={idx} className="bg-gray-900 p-2 rounded-xl border border-gray-700 text-center">
                      <p className="text-gray-400">{w.label}</p>
                      <p className="font-bold">{formatCurrency(portfolio.totalValue / wallets.length)}</p>
                    </div>
                  ))}
                  <div className="bg-gray-900 p-2 rounded-xl border border-purple-500 text-center">
                    <p className="text-gray-400">Combined</p>
                    <p className="font-bold text-purple-400">{formatCurrency(portfolio.totalValue)}</p>
                  </div>
                </div>
              </div>
            )}

            {/* --- Achievements --- */}
            {achievements.length > 0 && (
              <div className="bg-gray-800 p-3 md:p-4 rounded-2xl border border-gray-700">
                <h4 className="text-sm font-bold text-gray-300 mb-2">🏆 Achievements</h4>
                <div className="flex flex-wrap gap-2">
                  {achievements.map((ach, idx) => (
                    <div key={idx} className="bg-gray-900 px-2 py-1 rounded-full border border-yellow-600/30 flex items-center gap-1 text-xs">
                      <span>{ach.icon}</span>
                      <span className="font-bold">{ach.name}</span>
                      <span className="text-gray-400 text-[10px]">{ach.desc}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* --- Net Worth History --- */}
            {historyStats && (
              <div className="bg-gray-800 p-3 md:p-4 rounded-2xl border border-gray-700">
                <h4 className="text-sm font-bold text-gray-300 mb-2">📈 Net Worth History</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs">
                  <div className="bg-gray-900 p-2 rounded-xl border border-gray-700 text-center">
                    <p className="text-gray-400">7D High</p>
                    <p className="font-bold text-green-400">{formatCurrency(historyStats.high7d)}</p>
                  </div>
                  <div className="bg-gray-900 p-2 rounded-xl border border-gray-700 text-center">
                    <p className="text-gray-400">7D Low</p>
                    <p className="font-bold text-red-400">{formatCurrency(historyStats.low7d)}</p>
                  </div>
                  <div className="bg-gray-900 p-2 rounded-xl border border-gray-700 text-center">
                    <p className="text-gray-400">30D High</p>
                    <p className="font-bold text-green-400">{formatCurrency(historyStats.high30d)}</p>
                  </div>
                  <div className="bg-gray-900 p-2 rounded-xl border border-gray-700 text-center">
                    <p className="text-gray-400">30D Low</p>
                    <p className="font-bold text-red-400">{formatCurrency(historyStats.low30d)}</p>
                  </div>
                  <div className="bg-gray-900 p-2 rounded-xl border border-gray-700 text-center">
                    <p className="text-gray-400">Best Day</p>
                    <p className="font-bold text-green-400">{historyStats.bestDay.toFixed(2)}%</p>
                  </div>
                  <div className="bg-gray-900 p-2 rounded-xl border border-gray-700 text-center">
                    <p className="text-gray-400">Worst Day</p>
                    <p className="font-bold text-red-400">{historyStats.worstDay.toFixed(2)}%</p>
                  </div>
                </div>
              </div>
            )}

            {/* --- Risk Warnings --- */}
            {riskWarnings.length > 0 && (
              <div className="bg-yellow-900/20 border border-yellow-600 p-3 rounded-2xl">
                <h4 className="text-sm font-bold text-yellow-400 mb-1">🚨 Risk Warnings</h4>
                {riskWarnings.map((w, i) => (
                  <p key={i} className="text-xs text-yellow-300">• {w}</p>
                ))}
              </div>
            )}

            {/* --- Portfolio Summary Card --- */}
            {portfolioSummary && (
              <div className="bg-gradient-to-r from-purple-900/20 to-blue-900/20 p-4 rounded-2xl border border-purple-500/30">
                <h4 className="text-sm font-bold text-gray-300 mb-2">📊 Portfolio Summary</h4>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-xs">
                  <div className="bg-gray-900/50 p-2 rounded-xl text-center">
                    <p className="text-gray-400">Risk</p>
                    <p className={`font-bold ${portfolio.riskScore < 15 ? 'text-green-400' : portfolio.riskScore < 30 ? 'text-yellow-400' : 'text-red-400'}`}>
                      {portfolio.riskScore < 15 ? 'Low' : portfolio.riskScore < 30 ? 'Medium' : 'High'}
                    </p>
                  </div>
                  <div className="bg-gray-900/50 p-2 rounded-xl text-center">
                    <p className="text-gray-400">Grade</p>
                    <p className={`font-bold ${portfolio.grade === 'A+' ? 'text-green-400' : portfolio.grade === 'A' ? 'text-green-300' : portfolio.grade === 'B' ? 'text-blue-400' : portfolio.grade === 'C' ? 'text-yellow-400' : 'text-red-400'}`}>
                      {portfolio.grade}
                    </p>
                  </div>
                  <div className="bg-gray-900/50 p-2 rounded-xl text-center">
                    <p className="text-gray-400">Health</p>
                    <p className={`font-bold ${portfolio.healthScore > 80 ? 'text-green-400' : portfolio.healthScore > 60 ? 'text-yellow-400' : 'text-red-400'}`}>
                      {portfolio.healthScore}/100
                    </p>
                  </div>
                  <div className="bg-gray-900/50 p-2 rounded-xl text-center">
                    <p className="text-gray-400">Security</p>
                    <p className="font-bold text-green-400">{100 - portfolio.riskScore}/100</p>
                  </div>
                  <div className="bg-gray-900/50 p-2 rounded-xl text-center">
                    <p className="text-gray-400">Diversification</p>
                    <p className={`font-bold ${portfolio.divScore >= 80 ? 'text-green-400' : portfolio.divScore >= 50 ? 'text-yellow-400' : 'text-red-400'}`}>
                      {portfolio.divScore}/100
                    </p>
                  </div>
                </div>
                <div className="mt-2 text-center">
                  <p className={`text-sm font-bold ${portfolioSummary.verdictColor}`}>
                    {portfolioSummary.verdict}
                  </p>
                </div>
              </div>
            )}

            {/* --- Overall Score --- */}
            <div className="bg-gray-800 p-3 rounded-2xl border border-gray-700 text-center">
              <p className="text-gray-400 text-xs">📊 Overall Score</p>
              <p className={`text-2xl font-bold ${
                overallScore >= 80 ? 'text-green-400' :
                overallScore >= 60 ? 'text-yellow-400' :
                'text-red-400'
              }`}>
                {overallScore}/100
              </p>
            </div>

            {/* --- Investor Profile --- */}
            <div className="bg-gray-800 p-3 rounded-2xl border border-gray-700 text-center">
              <p className="text-gray-400 text-xs">💎 Investor Profile</p>
              <p className="text-sm font-bold text-purple-400">{investorProfile}</p>
            </div>

            {/* --- Asset Distribution Stats --- */}
            {assetStats && (
              <div className="bg-gray-800 p-3 rounded-2xl border border-gray-700">
                <h4 className="text-sm font-bold text-gray-300 mb-1">📊 Asset Distribution</h4>
                <div className="grid grid-cols-3 gap-2 text-xs text-center">
                  <div>
                    <p className="text-gray-400">Average</p>
                    <p className="font-bold">{formatCurrency(assetStats.average)}</p>
                  </div>
                  <div>
                    <p className="text-gray-400">Largest</p>
                    <p className="font-bold text-green-400">{formatCurrency(assetStats.largest)}</p>
                  </div>
                  <div>
                    <p className="text-gray-400">Smallest</p>
                    <p className="font-bold text-red-400">{formatCurrency(assetStats.smallest)}</p>
                  </div>
                </div>
              </div>
            )}

            {/* --- Multi-Chain Score --- */}
            <div className="bg-gray-800 p-3 rounded-2xl border border-gray-700 text-center">
              <p className="text-gray-400 text-xs">🌍 Multi-Chain Score</p>
              <p className={`text-xl font-bold ${
                multiChainScore >= 80 ? 'text-green-400' :
                multiChainScore >= 50 ? 'text-yellow-400' :
                'text-red-400'
              }`}>
                {multiChainScore}/100
              </p>
              <p className="text-xs text-gray-400">{portfolio.totalChains} chains active</p>
            </div>

            {/* --- Portfolio Activity --- */}
            {portfolioActivity && (
              <div className="bg-gray-800 p-3 rounded-2xl border border-gray-700">
                <h4 className="text-sm font-bold text-gray-300 mb-1">📅 Portfolio Activity</h4>
                <div className="grid grid-cols-3 gap-2 text-xs text-center">
                  <div>
                    <p className="text-gray-400">Assets</p>
                    <p className="font-bold">{portfolioActivity.totalAssets}</p>
                  </div>
                  <div>
                    <p className="text-gray-400">Chains</p>
                    <p className="font-bold">{portfolioActivity.totalChains}</p>
                  </div>
                  <div>
                    <p className="text-gray-400">Days Tracked</p>
                    <p className="font-bold">{displayDaysTracked !== null ? displayDaysTracked : '—'}</p>
                  </div>
                </div>
              </div>
            )}

            {/* --- Portfolio Age --- */}
            {portfolioAge && displayDaysTracked !== null && (
              <div className="bg-gray-800 p-3 rounded-2xl border border-gray-700 text-center">
                <p className="text-gray-400 text-xs">⏰ Tracking Since</p>
                <p className="text-sm font-bold">{portfolioAge.startDate}</p>
                <p className="text-xs text-gray-500">{displayDaysTracked} day{displayDaysTracked > 1 ? 's' : ''} tracked</p>
              </div>
            )}

            {/* --- Best Asset Ever --- */}
            {bestAssetEver && (
              <div className="bg-gray-800 p-3 rounded-2xl border border-green-600/30 text-center">
                <p className="text-gray-400 text-xs">🏆 Best Asset Ever</p>
                <p className="text-lg font-bold text-green-400">{bestAssetEver.symbol}</p>
                <p className="text-sm text-green-400">+{formatCurrency(bestAssetEver.pnl)}</p>
              </div>
            )}

            {/* --- Goal Projection --- */}
            {goalMessage && (
              <div className="bg-gray-800 p-3 rounded-2xl border border-blue-600/30 text-center">
                <p className="text-gray-400 text-xs">🎯 Goal Projection</p>
                <p className="text-sm text-blue-400">{goalMessage}</p>
              </div>
            )}

            {/* --- Snapshots --- */}
            <div className="bg-gray-800 p-3 rounded-2xl border border-gray-700">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-bold text-gray-300">📸 Portfolio Snapshots</h4>
                <button
                  onClick={takeSnapshot}
                  className="bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 px-3 py-1 rounded-lg text-xs transition"
                >
                  Save Snapshot
                </button>
              </div>
              {snapshots.length > 0 ? (
                <div className="space-y-1 text-xs max-h-32 overflow-y-auto">
                  {snapshots.slice(-10).reverse().map((s, i) => (
                    <div key={i} className="flex justify-between border-b border-gray-700/50 py-1">
                      <span className="text-gray-400">{new Date(s.date).toLocaleDateString()}</span>
                      <span className="font-bold">{formatCurrency(s.value)}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-gray-500">No snapshots yet.</p>
              )}
            </div>

            {/* --- Watchlist --- */}
            <div className="bg-gray-800 p-3 rounded-2xl border border-gray-700">
              <h4 className="text-sm font-bold text-gray-300 mb-2">⭐ Watchlist</h4>
              <div className="flex flex-wrap gap-1 mb-2">
                {watchlist.map((symbol) => (
                  <div key={symbol} className="bg-gray-900 px-2 py-1 rounded-full border border-gray-700 flex items-center gap-1 text-xs">
                    <span className="font-bold uppercase">{symbol}</span>
                    <span className="text-gray-400">${watchlistPrices[symbol]?.toFixed(2) || 'N/A'}</span>
                    <button onClick={() => removeFromWatchlist(symbol)} className="text-red-400 hover:text-red-300 text-xs">✕</button>
                  </div>
                ))}
              </div>
              <div className="flex gap-1">
                <input
                  type="text"
                  placeholder="Add symbol (e.g., bitcoin)"
                  value={alertSymbol}
                  onChange={(e) => setAlertSymbol(e.target.value)}
                  className="bg-gray-900 border border-gray-700 rounded-lg px-2 py-1 text-xs text-white flex-1"
                />
                <button
                  onClick={() => addToWatchlist(alertSymbol)}
                  className="bg-purple-600/20 hover:bg-purple-600/30 text-purple-400 px-2 py-1 rounded-lg text-xs transition"
                >
                  Add
                </button>
              </div>
            </div>

            {/* --- Price Alerts --- */}
            <div className="bg-gray-800 p-3 rounded-2xl border border-gray-700">
              <h4 className="text-sm font-bold text-gray-300 mb-2">🔔 Price Alerts</h4>
              <div className="space-y-1 text-xs">
                {priceAlerts.map((alert, idx) => (
                  <div key={idx} className="flex items-center justify-between bg-gray-900 px-2 py-1 rounded-lg border border-gray-700">
                    <span>{alert.symbol} {alert.condition} ${alert.price}</span>
                    <span className={alert.triggered ? 'text-green-400' : 'text-gray-400'}>
                      {alert.triggered ? '✅ Triggered' : '⏳ Active'}
                    </span>
                    <button onClick={() => removePriceAlert(idx)} className="text-red-400 hover:text-red-300">✕</button>
                  </div>
                ))}
              </div>
              <div className="flex flex-wrap gap-1 mt-2">
                <input
                  type="text"
                  placeholder="Symbol"
                  value={alertSymbol}
                  onChange={(e) => setAlertSymbol(e.target.value)}
                  className="bg-gray-900 border border-gray-700 rounded-lg px-2 py-1 text-xs text-white w-20"
                />
                <select
                  value={alertCondition}
                  onChange={(e) => setAlertCondition(e.target.value)}
                  className="bg-gray-900 border border-gray-700 rounded-lg px-2 py-1 text-xs text-white"
                >
                  <option value="above">Above</option>
                  <option value="below">Below</option>
                </select>
                <input
                  type="number"
                  placeholder="Price"
                  value={alertPrice}
                  onChange={(e) => setAlertPrice(e.target.value)}
                  className="bg-gray-900 border border-gray-700 rounded-lg px-2 py-1 text-xs text-white w-20"
                />
                <button
                  onClick={addPriceAlert}
                  className="bg-yellow-600/20 hover:bg-yellow-600/30 text-yellow-400 px-2 py-1 rounded-lg text-xs transition"
                >
                  Add Alert
                </button>
              </div>
            </div>

            {/* --- Portfolio Goals --- */}
            <div className="bg-gray-800 p-3 rounded-2xl border border-gray-700">
              <h4 className="text-sm font-bold text-gray-300 mb-2">🎯 Portfolio Goals</h4>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs text-gray-400">Target: ${goalTarget.toLocaleString()}</span>
                <span className="text-xs text-gray-400">Current: {formatCurrency(portfolio.totalValue)}</span>
                <span className="text-xs text-purple-400">{goalProgress.toFixed(1)}%</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2 mt-1">
                <div
                  className="h-2 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 transition-all"
                  style={{ width: `${Math.min(goalProgress, 100)}%` }}
                />
              </div>
              <div className="mt-2 flex gap-2">
                <input
                  type="number"
                  value={goalTarget}
                  onChange={(e) => setGoalTarget(parseFloat(e.target.value) || 0)}
                  className="bg-gray-900 border border-gray-700 rounded-lg px-2 py-1 text-xs text-white w-24"
                />
                <button
                  onClick={() => setGoalTarget(goalTarget)}
                  className="bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 px-2 py-1 rounded-lg text-xs transition"
                >
                  Update
                </button>
              </div>
            </div>

            {/* --- Transaction History --- */}
            {recentTransactions.length > 0 && (
              <div className="bg-gray-800 p-3 rounded-2xl border border-gray-700">
                <h4 className="text-sm font-bold text-gray-300 mb-2">🔄 Transaction History</h4>
                <div className="max-h-48 overflow-y-auto space-y-1 text-xs">
                  {recentTransactions.map((tx, idx) => (
                    <div key={idx} className="flex flex-wrap justify-between border-b border-gray-700/50 py-1 gap-1">
                      <span>{tx.method}</span>
                      <span className="font-mono">{tx.value > 0 ? `${tx.value.toFixed(4)} ETH` : 'Contract'}</span>
                      <span className="text-gray-500 text-[10px]">{tx.timestamp}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* --- Performance Chart --- */}
            <div className="bg-gray-800 p-3 rounded-2xl border border-gray-700">
              <div className="flex flex-wrap justify-between items-center gap-2 mb-2">
                <h3 className="text-md font-bold">📈 Portfolio Performance</h3>
                <div className="flex gap-1">
                  {['24h', '7d', '30d', 'all'].map((tf) => (
                    <button
                      key={tf}
                      onClick={() => { setSelectedTimeframe(tf); fetchPortfolio(); }}
                      className={`px-2 py-0.5 rounded text-xs font-medium transition ${
                        selectedTimeframe === tf
                          ? 'bg-purple-600/30 text-purple-400 border border-purple-600'
                          : 'bg-gray-700/50 text-gray-400'
                      }`}
                    >
                      {tf}
                    </button>
                  ))}
                </div>
              </div>
              {chartLoading ? (
                <div className="text-center py-6 text-gray-400">
                  <div className="animate-spin rounded-full h-8 w-8 border-4 border-purple-500 border-t-transparent mx-auto mb-2"></div>
                  Loading chart...
                </div>
              ) : chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="timestamp" tickFormatter={(ts) => new Date(ts).toLocaleDateString()} stroke="#9CA3AF" fontSize={10} />
                    <YAxis tickFormatter={(v) => `$${v.toFixed(0)}`} stroke="#9CA3AF" fontSize={10} domain={['auto', 'auto']} />
                    <Tooltip formatter={(value) => [`$${value.toFixed(2)}`, 'Portfolio Value']} labelFormatter={(ts) => new Date(ts).toLocaleString()} contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: '8px' }} />
                    <Line type="monotone" dataKey="value" stroke="#8B5CF6" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-center text-gray-400 py-6 text-sm">No historical data available.</p>
              )}
              <p className="text-xs text-gray-500 mt-1 text-center">* Based on real historical price data from CoinGecko</p>
              {lastUpdated && (
                <p className="text-xs text-gray-500 mt-1 text-center">🕒 Last Updated: {lastUpdated}</p>
              )}
            </div>

            {/* --- Asset Holdings with Search & Dust Filter --- */}
            <div className="bg-gray-800 p-3 rounded-2xl border border-gray-700">
              <div className="flex flex-wrap justify-between items-center mb-2 gap-2">
                <h3 className="text-md font-bold">🪙 Asset Holdings</h3>
                <div className="flex items-center gap-2 text-xs flex-wrap">
                  {/* Search */}
                  <input
                    type="text"
                    placeholder="🔍 Search asset"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="bg-gray-900 border border-gray-700 rounded-lg px-2 py-1 text-xs text-white w-24 md:w-32 focus:outline-none focus:border-purple-500"
                  />
                  {/* Dust Filter */}
                  <label className="flex items-center gap-1 text-gray-400 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={hideDust}
                      onChange={() => setHideDust(!hideDust)}
                      className="accent-purple-500"
                    />
                    Hide dust
                  </label>
                  {/* Sort */}
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="bg-gray-900 border border-gray-700 rounded-lg px-2 py-1 text-xs text-white focus:outline-none focus:border-purple-500"
                  >
                    <option value="value">Value</option>
                    <option value="allocation">Allocation</option>
                    <option value="pnl">PnL</option>
                    <option value="change">24h Change</option>
                  </select>
                </div>
              </div>
              {portfolio.biggestAsset && (
                <div className="text-xs text-gray-400 mb-2">🏅 Largest: {portfolio.biggestAsset.symbol} ({portfolio.biggestAsset.allocation.toFixed(1)}%)</div>
              )}
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-gray-400 border-b border-gray-700">
                      <th className="text-left py-1.5">Asset</th>
                      <th className="text-right py-1.5">Balance</th>
                      <th className="text-right py-1.5">Price</th>
                      <th className="text-right py-1.5">Value</th>
                      <th className="text-right py-1.5">24h</th>
                      <th className="text-right py-1.5">Allocation</th>
                      <th className="text-right py-1.5">PnL</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAssets.map((asset, i) => (
                      <tr key={i} className="border-b border-gray-700/50 hover:bg-gray-700/20 transition">
                        <td className="py-1.5">
                          <div>
                            <p className="font-bold">{asset.symbol}</p>
                            <p className="text-[10px] text-gray-500">{getChainName(asset.chainId)}</p>
                          </div>
                        </td>
                        <td className="text-right font-mono">{formatNumber(asset.balance, asset.balance < 1 ? 6 : 2)}</td>
                        <td className="text-right font-mono">${asset.price > 0 ? asset.price.toFixed(asset.price < 0.01 ? 6 : 2) : '0.00'}</td>
                        <td className="text-right font-mono font-bold">{formatCurrency(asset.value)}</td>
                        <td className={`text-right font-mono ${asset.change24h >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {!isNaN(asset.change24h) ? `${asset.change24h >= 0 ? '↑' : '↓'} ${Math.abs(asset.change24h).toFixed(2)}%` : '0.00%'}
                        </td>
                        <td className="text-right font-mono">{asset.allocation.toFixed(1)}%</td>
                        <td className={`text-right font-mono ${asset.pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {formatCurrency(asset.pnl)}
                        </td>
                      </tr>
                    ))}
                    {filteredAssets.length === 0 && (
                      <tr>
                        <td colSpan="7" className="text-center py-4 text-gray-400">
                          {searchQuery ? 'No assets match your search.' : 'No assets found.'}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              {portfolio.concentrationWarning && (
                <div className="mt-2 bg-yellow-600/10 border border-yellow-600 p-2 rounded-xl">
                  <p className="text-yellow-400 text-xs font-bold">⚠️ Concentration Warning: {portfolio.biggestAsset?.symbol} represents {portfolio.biggestAsset?.allocation.toFixed(1)}% of your portfolio.</p>
                </div>
              )}
            </div>

            {/* --- Allocation & Categories --- */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gray-800 p-3 rounded-2xl border border-gray-700">
                <h3 className="text-md font-bold mb-2">🥧 Portfolio Allocation</h3>
                <div className="flex flex-wrap gap-1.5">
                  {portfolio.assets.sort((a, b) => b.value - a.value).slice(0, 6).map((asset, i) => (
                    <div key={i} className="flex items-center gap-1 bg-gray-900 px-2 py-0.5 rounded-full border border-gray-700 text-xs">
                      <div className="w-2 h-2 rounded-full" style={{ background: `hsl(${(i * 60) % 360}, 80%, 60%)` }} />
                      <span>{asset.symbol}</span>
                      <span className="text-gray-400">{asset.allocation.toFixed(1)}%</span>
                    </div>
                  ))}
                  {portfolio.assets.length > 6 && <span className="text-xs text-gray-400">+{portfolio.assets.length - 6} more</span>}
                </div>
                <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="bg-gray-900 p-1.5 rounded-xl border border-gray-700">
                    <p className="text-gray-400">Stablecoins</p>
                    <p className={`font-bold ${portfolio.stablePercent > 50 ? 'text-yellow-400' : 'text-green-400'}`}>
                      {portfolio.stablePercent.toFixed(1)}%
                    </p>
                  </div>
                  <div className="bg-gray-900 p-1.5 rounded-xl border border-gray-700">
                    <p className="text-gray-400">Blue Chip</p>
                    <p className="text-blue-400 font-bold">{portfolio.blueChipPercent.toFixed(1)}%</p>
                  </div>
                  <div className="bg-gray-900 p-1.5 rounded-xl border border-gray-700">
                    <p className="text-gray-400">High Risk</p>
                    <p className={`font-bold ${portfolio.highRiskPercent > 30 ? 'text-red-400' : 'text-green-400'}`}>
                      {portfolio.highRiskPercent.toFixed(1)}%
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-gray-800 p-3 rounded-2xl border border-gray-700">
                <h3 className="text-md font-bold mb-2">📂 Asset Categories</h3>
                <div className="space-y-1">
                  {Object.entries(portfolio.categories).length > 0 ? (
                    Object.entries(portfolio.categories).map(([cat, value]) => {
                      const pct = portfolio.totalValue > 0 ? (value / portfolio.totalValue) * 100 : 0;
                      return (
                        <div key={cat} className="flex justify-between items-center text-sm">
                          <span>{cat}</span>
                          <span className="font-bold">{pct.toFixed(1)}%</span>
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-gray-400 text-sm">No categories available.</p>
                  )}
                </div>
              </div>
            </div>

            {/* --- Rebalancing Suggestions --- */}
            <div className="bg-blue-900/20 p-3 rounded-2xl border border-blue-600">
              <h4 className="text-sm font-bold text-blue-400 mb-1">⚖️ Rebalancing Suggestions</h4>
              <div className="text-xs text-gray-300 space-y-1">
                {portfolio.rebalance.map((s, i) => (
                  <p key={i}>• {s}</p>
                ))}
              </div>
            </div>

            {/* --- Chain Breakdown --- */}
            <div className="bg-gray-800 p-3 rounded-2xl border border-gray-700">
              <h3 className="text-md font-bold mb-2">🌐 Chain Breakdown</h3>
              {portfolio.largestChain && (
                <p className="text-xs text-gray-400 mb-2">🏆 Largest Chain: {getChainName(parseInt(portfolio.largestChain.chainId))} ({((portfolio.largestChain.value / portfolio.totalValue) * 100).toFixed(1)}%)</p>
              )}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {Object.keys(portfolio.chainBreakdown).map((cId) => {
                  const pct = portfolio.totalValue > 0 ? (portfolio.chainBreakdown[cId] / portfolio.totalValue) * 100 : 0;
                  const isLargest = portfolio.largestChain && parseInt(portfolio.largestChain.chainId) === parseInt(cId);
                  return (
                    <div key={cId} className={`bg-gray-900 p-3 rounded-xl border text-center ${isLargest ? 'border-yellow-600/50 bg-yellow-900/10' : 'border-gray-700'}`}>
                      <p className="text-gray-400 text-xs">{getChainName(parseInt(cId))}</p>
                      <p className="text-lg font-bold">{formatCurrency(portfolio.chainBreakdown[cId])}</p>
                      <p className="text-xs text-gray-500">{pct.toFixed(1)}%</p>
                      {isLargest && <p className="text-[10px] text-yellow-400">🏆 Largest</p>}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* --- Risk Analysis --- */}
            <div className="bg-gray-800 p-3 rounded-2xl border border-gray-700">
              <h3 className="text-md font-bold mb-2">⚠️ Risk Analysis</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-gray-900 p-3 rounded-xl border border-gray-700 text-center">
                  <p className="text-gray-400 text-xs">Risk Score</p>
                  <p className={`text-xl font-bold ${portfolio.riskScore < 15 ? 'text-green-400' : portfolio.riskScore < 30 ? 'text-yellow-400' : 'text-red-400'}`}>{portfolio.riskScore}/100</p>
                </div>
                <div className="bg-gray-900 p-3 rounded-xl border border-green-600/30 text-center">
                  <p className="text-gray-400 text-xs">Safe Assets</p>
                  <p className="text-xl font-bold text-green-400">{portfolio.safeAssets}</p>
                </div>
                <div className="bg-gray-900 p-3 rounded-xl border border-yellow-600/30 text-center">
                  <p className="text-gray-400 text-xs">Medium Risk</p>
                  <p className="text-xl font-bold text-yellow-400">{portfolio.mediumRisk}</p>
                </div>
                <div className="bg-gray-900 p-3 rounded-xl border border-red-600/30 text-center">
                  <p className="text-gray-400 text-xs">High Risk</p>
                  <p className="text-xl font-bold text-red-400">{portfolio.highRisk}</p>
                </div>
              </div>
              {portfolio.highRiskTokens.length > 0 && (
                <div className="mt-2 bg-red-600/10 border border-red-600 p-2 rounded-xl">
                  <p className="text-red-400 text-xs font-bold">🚨 High Risk Tokens: {portfolio.highRiskTokens.join(', ')}</p>
                </div>
              )}
              <div className="mt-2 text-xs text-gray-300 flex flex-wrap gap-3">
                <p>🔒 Security Score: {100 - portfolio.riskScore}/100</p>
                {approvals && (
                  <p>🔑 Unlimited Approvals: {approvals.unlimited} / {approvals.total}</p>
                )}
              </div>
            </div>

            {/* --- AI Recommendations --- */}
            <div className="bg-gradient-to-r from-purple-900/30 to-blue-900/30 p-3 rounded-2xl border border-purple-500">
              <h3 className="text-md font-bold mb-2 flex items-center gap-2">🤖 AI Recommendations <span className="text-xs text-purple-400">Powered by Intelligence Suite</span></h3>
              <div className="space-y-1 text-sm text-gray-300">
                {portfolio.totalAssets === 0 && <p>No assets found. Add tokens to get recommendations.</p>}
                {portfolio.riskScore <= 15 && <p>✅ Low risk portfolio.</p>}
                {portfolio.stablePercent > 70 && <p>💵 High stablecoin allocation ({portfolio.stablePercent.toFixed(1)}%). Consider adding growth assets.</p>}
                {portfolio.concentrationWarning && <p>⚠️ High concentration in {portfolio.biggestAsset?.symbol} ({portfolio.biggestAsset?.allocation.toFixed(1)}%). Consider rebalancing.</p>}
                {portfolio.divScore < 50 && <p>📊 Low diversification score ({portfolio.divScore}/100). Add more assets.</p>}
                {portfolio.totalAssets >= 5 && portfolio.riskScore <= 15 && !portfolio.concentrationWarning && <p>🌟 Balanced portfolio. Keep monitoring.</p>}
                {portfolio.riskScore > 30 && <p>⚠️ Above-average risk. Consider adding stable assets.</p>}
                <p className="text-xs text-gray-500 mt-1">🏥 Diversification Score: {portfolio.divScore}/100</p>
              </div>
            </div>

            {/* --- DeFi Exposure --- */}
            <div className="bg-gray-800 p-3 rounded-2xl border border-gray-700">
              <h4 className="text-sm font-bold text-gray-300 mb-2">🏦 DeFi Exposure</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                <div className="bg-gray-900 p-2 rounded-xl border border-gray-700 text-center">
                  <p className="text-gray-400">Staking</p>
                  <p className="font-bold">$0</p>
                </div>
                <div className="bg-gray-900 p-2 rounded-xl border border-gray-700 text-center">
                  <p className="text-gray-400">Liquidity Pools</p>
                  <p className="font-bold">$0</p>
                </div>
                <div className="bg-gray-900 p-2 rounded-xl border border-gray-700 text-center">
                  <p className="text-gray-400">Lending</p>
                  <p className="font-bold">$0</p>
                </div>
                <div className="bg-gray-900 p-2 rounded-xl border border-gray-700 text-center">
                  <p className="text-gray-400">Yield Farming</p>
                  <p className="font-bold">$0</p>
                </div>
              </div>
              <p className="text-[10px] text-gray-500 mt-1 text-center">Connect your DeFi protocols to track positions.</p>
            </div>

            {/* --- Add Custom Token --- */}
            <div className="bg-gray-800 p-3 rounded-2xl border border-gray-700">
              <h3 className="text-md font-bold mb-2">➕ Add Custom Token</h3>
              <div className="flex flex-wrap gap-2">
                <input
                  type="text"
                  placeholder="Contract Address"
                  value={newTokenAddress}
                  onChange={(e) => setNewTokenAddress(e.target.value)}
                  className="flex-1 min-w-[150px] bg-gray-900 border border-gray-700 rounded-xl px-3 py-1.5 text-sm text-white focus:outline-none focus:border-purple-500"
                />
                <select
                  value={newTokenChain}
                  onChange={(e) => setNewTokenChain(parseInt(e.target.value))}
                  className="bg-gray-900 border border-gray-700 rounded-xl px-3 py-1.5 text-sm text-white focus:outline-none focus:border-purple-500"
                >
                  {Object.keys(chains).map((id) => (
                    <option key={id} value={id}>{chains[id].name}</option>
                  ))}
                </select>
                <button onClick={addCustomToken} className="bg-purple-600/20 hover:bg-purple-600/30 text-purple-400 px-4 py-1.5 rounded-xl border border-purple-600 text-sm font-medium transition">Add Token</button>
              </div>
              {customTokens.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {customTokens.map((t, idx) => (
                    <div key={idx} className="bg-gray-900 px-2 py-0.5 rounded-full border border-gray-700 flex items-center gap-1.5 text-xs">
                      <span>{t.symbol}</span>
                      <span className="text-gray-500">{getChainName(t.chainId)}</span>
                      <button onClick={() => removeCustomToken(idx)} className="text-red-400 hover:text-red-300 text-xs">✕</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* --- Empty State --- */}
        {!loading && wallets.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 md:py-20 px-4 text-center">
            <div className="text-5xl md:text-6xl mb-6">👛</div>
            <h2 className="text-2xl md:text-3xl font-bold text-gray-300 mb-2">No Wallet Connected</h2>
            <p className="text-gray-500 max-w-md mb-6 text-sm md:text-base">
              Track Ethereum, BNB Chain, Polygon, Arbitrum, Optimism, and Avalanche assets.
            </p>
            <div className="flex flex-wrap justify-center gap-2 md:gap-3 mb-8">
              <div className="bg-gray-800/50 px-3 md:px-4 py-1.5 md:py-2 rounded-xl border border-gray-700 text-xs text-gray-400 flex items-center gap-2">
                <span className="text-purple-400">⬡</span> Ethereum
              </div>
              <div className="bg-gray-800/50 px-3 md:px-4 py-1.5 md:py-2 rounded-xl border border-gray-700 text-xs text-gray-400 flex items-center gap-2">
                <span className="text-yellow-400">⬡</span> BNB Chain
              </div>
              <div className="bg-gray-800/50 px-3 md:px-4 py-1.5 md:py-2 rounded-xl border border-gray-700 text-xs text-gray-400 flex items-center gap-2">
                <span className="text-blue-400">⬡</span> Polygon
              </div>
              <div className="bg-gray-800/50 px-3 md:px-4 py-1.5 md:py-2 rounded-xl border border-gray-700 text-xs text-gray-400 flex items-center gap-2">
                <span className="text-red-400">⬡</span> Arbitrum
              </div>
              <div className="bg-gray-800/50 px-3 md:px-4 py-1.5 md:py-2 rounded-xl border border-gray-700 text-xs text-gray-400 flex items-center gap-2">
                <span className="text-green-400">⬡</span> Optimism
              </div>
              <div className="bg-gray-800/50 px-3 md:px-4 py-1.5 md:py-2 rounded-xl border border-gray-700 text-xs text-gray-400 flex items-center gap-2">
                <span className="text-orange-400">⬡</span> Avalanche
              </div>
            </div>
            <div className="flex flex-wrap justify-center gap-3 md:gap-4">
              <button onClick={() => connectWallet('metamask')} className="bg-orange-600/20 hover:bg-orange-600/30 text-orange-400 px-5 md:px-6 py-2.5 md:py-3 rounded-xl border border-orange-600 font-medium transition text-sm">🦊 Connect MetaMask</button>
              <button onClick={() => connectWallet('walletconnect')} className="bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 px-5 md:px-6 py-2.5 md:py-3 rounded-xl border border-blue-600 font-medium transition text-sm">📱 Connect WalletConnect</button>
              <button onClick={() => connectWallet('coinbase')} className="bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 px-5 md:px-6 py-2.5 md:py-3 rounded-xl border border-blue-500 font-medium transition text-sm">🏦 Connect Coinbase</button>
            </div>
          </div>
        )}
      </div>

      {/* --- FOOTER --- */}
      <div className="max-w-6xl mx-auto w-full mt-8 pt-4 border-t border-gray-700">
        <div className="bg-gray-800/50 p-4 rounded-xl border border-gray-700 text-center text-xs text-gray-400">
          <p className="font-semibold text-white text-sm">🤖 Solt Portfolio Tracker</p>
          <p className="mt-1">
            Data Sources: <span className="text-purple-400">GoPlus Security</span>,{' '}
            <span className="text-blue-400">DexScreener</span>,{' '}
            <span className="text-green-400">CoinGecko</span>, and Public Blockchain Data.
          </p>
          <p className="mt-1 text-[10px] text-gray-500 max-w-2xl mx-auto">
            Market, security, and blockchain information is aggregated from third-party providers and on-chain analysis.
            Information may be delayed, incomplete, or unavailable depending on source availability.
          </p>
          <p className="mt-1 text-[10px] text-gray-500">
            © 2026 Solt Portfolio Tracker — By Soltchain Technologies. All Rights Reserved.
          </p>
        </div>
      </div>
    </div>
  );
};

export default PortfolioTracker;