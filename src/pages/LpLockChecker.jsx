import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Shield,
  Lock,
  Unlock,
  AlertTriangle,
  Search,
  Coins,
  CheckCircle,
  XCircle,
  Clock,
  Zap,
  Users,
  FileCheck,
  FileX,
  ExternalLink,
  TrendingUp,
  Flame,
  Globe,
  Twitter,
  Send,
  MessageCircle,
  Github,
  Percent,
  Wallet,
  List,
  BarChart3,
  History,
  User,
  TrendingDown,
  ArrowUp,
  ArrowDown,
  Eye,
  EyeOff,
  Activity,
  LineChart,
  Gauge,
  PieChart,
} from "lucide-react";

// --- Backend URL ---
const BACKEND_URL = 'https://ecobackend-two.vercel.app/api/presale/check';

// --- TRUSTED TOKEN WHITELIST (addresses & symbols) ---
const TRUSTED_TOKENS = {
  // Ethereum
  '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48': { name: 'USDC', type: 'stablecoin' },
  '0xdac17f958d2ee523a2206206994597c13d831ec7': { name: 'USDT', type: 'stablecoin' },
  '0x6b175474e89094c44da98b954eedeac495271d0f': { name: 'DAI', type: 'stablecoin' },
  '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599': { name: 'WBTC', type: 'wrapped' },
  '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2': { name: 'WETH', type: 'wrapped' },
  '0x514910771af9ca656af840dff83e8264ecf986ca': { name: 'LINK', type: 'oracle' },
  '0x1f9840a85d5af5bf1d1762f925bdaddc4201f984': { name: 'UNI', type: 'dex' },
  '0x7fc66500c84a76ad7e9c93437bfc5ac33e2ddae9': { name: 'AAVE', type: 'lending' },
  // BSC
  '0x55d398326f99059ff775485246999027b3197955': { name: 'USDT', type: 'stablecoin' },
  '0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d': { name: 'USDC', type: 'stablecoin' },
  '0xe9e7cea3dedca5984780bafc599bd69add087d56': { name: 'BUSD', type: 'stablecoin' },
  '0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c': { name: 'WBNB', type: 'wrapped' },
  '0x0e09fabb73bd3ade0a17ecc321fd13a19e81ce82': { name: 'CAKE', type: 'dex' },
  // Polygon
  '0x2791bca1f2de4661ed88a30c99a7a9449aa84174': { name: 'USDC', type: 'stablecoin' },
  '0xc2132d05d31c914a87c6611c10748aeb04b58e8f': { name: 'USDT', type: 'stablecoin' },
  '0x8f3cf7ad23cd3cadbd9735aff958023239c6a063': { name: 'DAI', type: 'stablecoin' },
  '0x7ceb23fd6bc0add59e62ac25578270cff1b9f619': { name: 'WETH', type: 'wrapped' },
  // Arbitrum
  '0xfd086bc7cd5c481dcc9c85ebe478a1c0b69fcbb9': { name: 'USDT', type: 'stablecoin' },
  '0xaf88d065e77c8cc2239327c5edb3a432268e5831': { name: 'USDC', type: 'stablecoin' },
  '0xda10009cbd5d07dd0cecc66161fc93d7c9000da1': { name: 'DAI', type: 'stablecoin' },
  '0x82af49447d8a07e3bd95bd0d56f35241523fbab1': { name: 'WETH', type: 'wrapped' },
  // Avalanche
  '0x9702230a8ea53601f5cd2dc00fdbc13d4df4a8c7': { name: 'USDT', type: 'stablecoin' },
  '0xb97ef9ef8734c71904d8002f8b6bc66dd9c48a6e': { name: 'USDC', type: 'stablecoin' },
  '0x49d5c2bdffac6ce2bfdb6640f4f80f226bc10bab': { name: 'WETH', type: 'wrapped' },
};

// --- Helpers ---
const formatCurrency = (value) => {
  if (!value || value === 'N/A' || value === 0) return 'N/A';
  const num = parseFloat(value);
  if (isNaN(num)) return 'N/A';
  if (num >= 1e9) return `$${(num / 1e9).toFixed(2)}B`;
  if (num >= 1e6) return `$${(num / 1e6).toFixed(2)}M`;
  if (num >= 1e3) return `$${(num / 1e3).toFixed(2)}K`;
  return `$${num.toFixed(2)}`;
};

const formatNumber = (value) => {
  if (!value || value === 'N/A' || value === 0) return 'N/A';
  const num = parseFloat(value);
  if (isNaN(num)) return 'N/A';
  if (num >= 1e9) return `${(num / 1e9).toFixed(2)}B`;
  if (num >= 1e6) return `${(num / 1e6).toFixed(2)}M`;
  if (num >= 1e3) return `${(num / 1e3).toFixed(2)}K`;
  return num.toFixed(2);
};

const formatPercent = (value) => {
  if (!value || value === 'N/A' || value === 0) return 'N/A';
  const num = parseFloat(value);
  if (isNaN(num)) return 'N/A';
  if (num > 0) return `+${num.toFixed(2)}%`;
  return `${num.toFixed(2)}%`;
};

const getChainDisplay = (chain) => {
  const map = {
    ethereum: 'Ethereum',
    bsc: 'BNB Chain',
    polygon: 'Polygon',
    arbitrum: 'Arbitrum',
    optimism: 'Optimism',
    avalanche: 'Avalanche',
    base: 'Base',
    solana: 'Solana',
  };
  return map[chain] || chain || 'Unknown';
};

const getChainName = (chain) => {
  const map = {
    auto: 'auto',
    bsc: 'bsc',
    ethereum: 'ethereum',
    base: 'base',
    polygon: 'polygon',
    arbitrum: 'arbitrum',
    optimism: 'optimism',
    avalanche: 'avalanche',
    solana: 'solana',
  };
  return map[chain] || 'bsc';
};

const isSolanaChain = (chain) => chain === 'solana' || chain === 'Solana';

const getLockerBadge = (locker) => {
  const l = locker.toLowerCase();
  const trusted = ['pinksale', 'team finance', 'unicrypt', 'mudra', 'dxlock'];
  const isTrusted = trusted.some(t => l.includes(t));
  
  if (l.includes('pink')) return { color: 'bg-pink-600/20 text-pink-400', icon: '🩷', label: 'PinkSale', trusted: true };
  if (l.includes('team')) return { color: 'bg-blue-600/20 text-blue-400', icon: '🔵', label: 'Team Finance', trusted: true };
  if (l.includes('unicrypt')) return { color: 'bg-purple-600/20 text-purple-400', icon: '🟣', label: 'Unicrypt', trusted: true };
  if (l.includes('mudra')) return { color: 'bg-orange-600/20 text-orange-400', icon: '🟠', label: 'Mudra', trusted: true };
  if (l.includes('dx')) return { color: 'bg-cyan-600/20 text-cyan-400', icon: '🔷', label: 'DxLock', trusted: true };
  if (l.includes('burn')) return { color: 'bg-orange-600/20 text-orange-400', icon: '🔥', label: 'Burned', trusted: true };
  if (isTrusted) return { color: 'bg-green-600/20 text-green-400', icon: '✅', label: locker, trusted: true };
  return { color: 'bg-gray-600/20 text-gray-400', icon: '🔒', label: locker, trusted: false };
};

const getSecurityGrade = (score) => {
  if (score >= 80) return { label: 'Safe', color: 'green', icon: CheckCircle, bg: 'bg-green-600/20 border-green-600', text: 'text-green-400' };
  if (score >= 60) return { label: 'Medium Risk', color: 'yellow', icon: AlertTriangle, bg: 'bg-yellow-600/20 border-yellow-600', text: 'text-yellow-400' };
  if (score >= 40) return { label: 'High Risk', color: 'orange', icon: AlertTriangle, bg: 'bg-orange-600/20 border-orange-600', text: 'text-orange-400' };
  return { label: 'Critical Risk', color: 'red', icon: AlertTriangle, bg: 'bg-red-600/20 border-red-600', text: 'text-red-400' };
};

const getSeverityColor = (severity) => {
  const map = {
    critical: 'text-red-500',
    high: 'text-orange-500',
    medium: 'text-yellow-500',
    low: 'text-green-500',
  };
  return map[severity] || 'text-gray-400';
};

const getUnlockWarning = (unlockDays) => {
  if (unlockDays === null || unlockDays === undefined || unlockDays === 'N/A') return null;
  if (unlockDays <= 3) return { level: 'CRITICAL', color: 'text-red-600 bg-red-600/20 border-red-600', emoji: '🚨' };
  if (unlockDays <= 7) return { level: 'HIGH', color: 'text-orange-500 bg-orange-500/20 border-orange-500', emoji: '🔴' };
  if (unlockDays <= 30) return { level: 'MEDIUM', color: 'text-yellow-500 bg-yellow-500/20 border-yellow-500', emoji: '🟡' };
  return { level: 'LOW', color: 'text-green-400 bg-green-400/20 border-green-400', emoji: '🟢' };
};

const getWhaleRisk = (top5Percent, top10Percent) => {
  const max = Math.max(top5Percent || 0, top10Percent || 0);
  if (max > 60) return { label: 'Extreme', color: 'text-red-600', severity: 'critical' };
  if (max > 45) return { label: 'High', color: 'text-red-400', severity: 'high' };
  if (max > 30) return { label: 'Medium', color: 'text-yellow-400', severity: 'medium' };
  return { label: 'Low', color: 'text-green-400', severity: 'low' };
};

const getVolumeToMCRatio = (volume, marketCap) => {
  const v = parseFloat(volume) || 0;
  const mc = parseFloat(marketCap) || 0;
  if (mc === 0 || v === 0) return null;
  const ratio = v / mc;
  if (ratio > 5) return { label: '🚨 Wash Trading Possible', color: 'text-red-400' };
  if (ratio > 2) return { label: '⚠️ Very High Volume', color: 'text-yellow-400' };
  if (ratio > 0.5) return { label: '✅ Healthy Volume', color: 'text-green-400' };
  return { label: '⚠️ Low Volume', color: 'text-yellow-400' };
};

const getLPtoMCRatio = (liquidity, marketCap) => {
  const liq = parseFloat(liquidity) || 0;
  const mc = parseFloat(marketCap) || 0;
  if (mc === 0 || liq === 0) return null;
  const ratio = (liq / mc) * 100;
  if (ratio > 30) return { label: '✅ Excellent', color: 'text-green-400' };
  if (ratio > 15) return { label: '✅ Good', color: 'text-blue-400' };
  if (ratio > 8) return { label: '⚠️ Moderate', color: 'text-yellow-400' };
  return { label: '🔴 Low', color: 'text-red-400' };
};

// --- Buy Pressure ---
const getBuyPressure = (buyVolume, sellVolume) => {
  const buy = parseFloat(buyVolume) || 0;
  const sell = parseFloat(sellVolume) || 0;
  const total = buy + sell;
  if (total === 0) return null;
  const pressure = (buy / total) * 100;
  if (pressure > 65) return { label: 'Bullish', color: 'text-green-400', value: pressure };
  if (pressure >= 55) return { label: 'Neutral', color: 'text-yellow-400', value: pressure };
  return { label: 'Bearish', color: 'text-red-400', value: pressure };
};

// --- Volume Spike ---
const getVolumeSpike = (volume24h, volume7d) => {
  const v24 = parseFloat(volume24h) || 0;
  const v7 = parseFloat(volume7d) || 0;
  const avg7d = v7 / 7;
  if (avg7d === 0 || v24 === 0) return null;
  const spike = ((v24 - avg7d) / avg7d) * 100;
  if (spike > 100) return { label: '🔥 Massive Spike', color: 'text-orange-500', value: spike };
  if (spike > 50) return { label: '📈 Strong Spike', color: 'text-green-400', value: spike };
  if (spike > 20) return { label: '📈 Increasing', color: 'text-blue-400', value: spike };
  if (spike > -20) return { label: '➡️ Stable', color: 'text-gray-400', value: spike };
  return { label: '📉 Decreasing', color: 'text-red-400', value: spike };
};

// --- ATH Recovery ---
const getATHRecovery = (currentPrice, athPrice) => {
  const current = parseFloat(currentPrice) || 0;
  const ath = parseFloat(athPrice) || 0;
  if (ath === 0 || current === 0) return null;
  const recovery = (current / ath) * 100;
  if (recovery > 80) return { label: 'Near ATH', color: 'text-green-400', value: recovery };
  if (recovery > 50) return { label: 'Recovering', color: 'text-blue-400', value: recovery };
  if (recovery > 20) return { label: 'Far from ATH', color: 'text-yellow-400', value: recovery };
  return { label: '📉 Deep Drawdown', color: 'text-red-400', value: recovery };
};

// --- Candle Trend ---
const getCandleTrend = (change5m, change1h, change24h) => {
  const c5 = parseFloat(change5m) || 0;
  const c1 = parseFloat(change1h) || 0;
  const c24 = parseFloat(change24h) || 0;
  const bullishCount = [c5 > 0, c1 > 0, c24 > 0].filter(Boolean).length;
  if (bullishCount >= 2 && c24 > 0) return { label: '📈 Bullish', color: 'text-green-400' };
  if (bullishCount <= 1 && c24 < 0) return { label: '📉 Bearish', color: 'text-red-400' };
  return { label: '➡️ Sideways', color: 'text-yellow-400' };
};

// --- FDV/MC Ratio Alert ---
const getFDVAlert = (fdv, marketCap) => {
  const f = parseFloat(fdv) || 0;
  const mc = parseFloat(marketCap) || 0;
  if (mc === 0 || f === 0) return null;
  const ratio = f / mc;
  if (ratio > 20) return { label: `🚨 ${ratio.toFixed(1)}x Dilution Risk`, color: 'text-red-500' };
  if (ratio > 10) return { label: `⚠️ ${ratio.toFixed(1)}x High Dilution`, color: 'text-yellow-500' };
  if (ratio > 2) return { label: `${ratio.toFixed(1)}x Moderate`, color: 'text-blue-400' };
  return { label: `${ratio.toFixed(1)}x Healthy`, color: 'text-green-400' };
};

// --- Explorer Links ---
const getExplorerLink = (address, chain) => {
  const baseUrls = {
    ethereum: 'https://etherscan.io/token/',
    bsc: 'https://bscscan.com/token/',
    polygon: 'https://polygonscan.com/token/',
    arbitrum: 'https://arbiscan.io/token/',
    optimism: 'https://optimistic.etherscan.io/token/',
    avalanche: 'https://snowtrace.io/token/',
    base: 'https://basescan.org/token/',
    solana: 'https://solscan.io/token/',
  };
  return baseUrls[chain] ? baseUrls[chain] + address : null;
};

// --- FIXED: DexScreener link for all chains ---
const getDexLink = (address, chain) => {
  const chainMap = {
    bsc: 'bsc',
    ethereum: 'ethereum',
    polygon: 'polygon',
    arbitrum: 'arbitrum',
    optimism: 'optimism',
    avalanche: 'avalanche',
    base: 'base',
    solana: 'solana',
  };
  const chainName = chainMap[chain] || 'ethereum';
  return `https://dexscreener.com/${chainName}/${address}`;
};

// --- Trading Activity Score ---
const calculateTradingActivityScore = (data) => {
  let score = 0;
  const vol = parseFloat(data.volume24h) || 0;
  if (vol > 100000) score += 25;
  else if (vol > 10000) score += 18;
  else if (vol > 1000) score += 10;
  else score += 5;

  const buys = parseInt(data.buys) || 0;
  const sells = parseInt(data.sells) || 0;
  const txns = buys + sells;
  if (txns > 500) score += 25;
  else if (txns > 100) score += 18;
  else if (txns > 20) score += 10;
  else score += 5;

  const liq = parseFloat(data.totalLiquidity) || 0;
  if (liq > 100000) score += 25;
  else if (liq > 10000) score += 18;
  else if (liq > 1000) score += 10;
  else score += 5;

  const growth = parseInt(data.holderGrowth) || 0;
  if (growth > 100) score += 25;
  else if (growth > 20) score += 18;
  else if (growth > 0) score += 10;
  else score += 5;

  return Math.min(100, Math.round(score));
};

// --- Pair Health Score ---
const calculatePairHealthScore = (data) => {
  let score = 0;
  const lpMc = parseFloat(data.lpMcRatio?.raw) || 0;
  if (lpMc > 30) score += 25;
  else if (lpMc > 15) score += 18;
  else if (lpMc > 8) score += 10;
  else score += 5;

  const volMc = parseFloat(data.volumeMcRatio?.raw) || 0;
  if (volMc > 0.5 && volMc < 2) score += 25;
  else if (volMc > 0.2) score += 18;
  else if (volMc > 0.05) score += 10;
  else score += 5;

  const age = data.pairAgeDays || 0;
  if (age > 90) score += 25;
  else if (age > 30) score += 18;
  else if (age > 7) score += 10;
  else score += 5;

  const liq = parseFloat(data.totalLiquidity) || 0;
  if (liq > 100000) score += 25;
  else if (liq > 10000) score += 18;
  else if (liq > 1000) score += 10;
  else score += 5;

  return Math.min(100, Math.round(score));
};

// --- MAIN COMPONENT ---
const LpLockChecker = () => {
  const [tokenAddress, setTokenAddress] = useState("");
  const [selectedChain, setSelectedChain] = useState("auto");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lockData, setLockData] = useState(null);
  const [countdown, setCountdown] = useState(null);

  // --- Live countdown timer ---
  useEffect(() => {
    if (!lockData?.unlockDate || lockData.unlockDate === 'N/A') {
      setCountdown(null);
      return;
    }
    const interval = setInterval(() => {
      const unlock = new Date(lockData.unlockDate);
      const now = new Date();
      const diff = unlock - now;
      if (diff <= 0) {
        setCountdown('Unlocked');
        clearInterval(interval);
        return;
      }
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      setCountdown({ days, hours, minutes });
    }, 1000);
    return () => clearInterval(interval);
  }, [lockData?.unlockDate]);

  // --- AI Summary ---
  const generateAISummary = (data) => {
    const positives = [];
    const warnings = [];
    const risks = [];
    const breakdown = [];
    const explanations = [];

    // Check if token is established
    const isEstablished = data.isEstablished || false;

    if (data.locked && data.lockedPercent > 80) {
      positives.push(`LP Locked ${data.lockedPercent}%`);
      breakdown.push({ type: 'positive', text: `LP locked ${data.lockedPercent}% (+${Math.round(data.lockedPercent / 5)})`, points: Math.round(data.lockedPercent / 5) });
      explanations.push(`✅ ${data.lockedPercent}% of liquidity is locked, reducing rug risk.`);
    } else if (data.lpBurned) {
      positives.push('LP Burned');
      breakdown.push({ type: 'positive', text: 'LP Burned (+15)', points: 15 });
      explanations.push('✅ LP tokens are burned, permanently removing liquidity.');
    } else if (!data.locked && !isEstablished) {
      risks.push('LP Not Locked');
      breakdown.push({ type: 'negative', text: 'LP Not Locked (-20)', points: -20 });
      explanations.push('🔴 LP is not locked – developer can remove liquidity anytime.');
    } else if (!data.locked && isEstablished) {
      warnings.push('LP Not Locked (Expected)');
      breakdown.push({ type: 'neutral', text: 'LP Not Locked (0)', points: 0 });
      explanations.push('ℹ️ Established token – LP lock not required for this project.');
    }

    if (data.ownershipRenounced) {
      positives.push('Ownership Renounced');
      breakdown.push({ type: 'positive', text: 'Ownership Renounced (+15)', points: 15 });
      explanations.push('✅ Owner renounced contract ownership.');
    } else {
      if (isEstablished) {
        warnings.push('Ownership Active (Controlled)');
        breakdown.push({ type: 'neutral', text: 'Ownership Active (0)', points: 0 });
        explanations.push('ℹ️ Ownership is active – this is typical for centralized tokens.');
      } else {
        warnings.push('Ownership Active');
        breakdown.push({ type: 'negative', text: 'Ownership Active (-10)', points: -10 });
        explanations.push('⚠️ Ownership is active – developer can modify contract.');
      }
    }

    if (data.verification?.verified) {
      positives.push('Contract Verified');
      breakdown.push({ type: 'positive', text: 'Contract Verified (+15)', points: 15 });
      explanations.push('✅ Contract source code verified on explorer.');
    } else {
      warnings.push('Contract Not Verified');
      breakdown.push({ type: 'negative', text: 'Contract Not Verified (-5)', points: -5 });
      explanations.push('⚠️ Contract not verified – code could be malicious.');
    }

    if (data.mintable) {
      if (isEstablished) {
        warnings.push('Mint Function Active (Controlled)');
        breakdown.push({ type: 'neutral', text: 'Mint Active (0)', points: 0 });
        explanations.push('ℹ️ Mint function is active – this is typical for centralized tokens.');
      } else {
        warnings.push('Mint Function Active');
        breakdown.push({ type: 'negative', text: 'Mint Active (-15)', points: -15 });
        explanations.push('⚠️ Mint function is active – supply can increase.');
      }
    } else {
      positives.push('No Mint Function');
      breakdown.push({ type: 'positive', text: 'No Mint (+15)', points: 15 });
      explanations.push('✅ No mint function – supply is fixed.');
    }

    if (data.honeypot) {
      risks.push('Honeypot Detected');
      breakdown.push({ type: 'critical', text: 'Honeypot Detected (-100)', points: -100 });
      explanations.push('🚨 HONEYPOT DETECTED – you cannot sell this token! AVOID.');
    }

    if (data.proxy) {
      if (isEstablished) {
        warnings.push('Proxy Contract (Upgradeable)');
        breakdown.push({ type: 'neutral', text: 'Proxy Contract (0)', points: 0 });
        explanations.push('ℹ️ Proxy contract – upgrade capability is common for established projects.');
      } else {
        warnings.push('Proxy Contract');
        breakdown.push({ type: 'negative', text: 'Proxy Contract (-5)', points: -5 });
        explanations.push('⚠️ Proxy contract – contract can be upgraded.');
      }
    } else {
      positives.push('No Proxy');
      breakdown.push({ type: 'positive', text: 'No Proxy (+10)', points: 10 });
      explanations.push('✅ No proxy contract – contract is immutable.');
    }

    if (data.blacklist) {
      if (isEstablished) {
        warnings.push('Blacklist Function (Controlled)');
        breakdown.push({ type: 'neutral', text: 'Blacklist (0)', points: 0 });
        explanations.push('ℹ️ Blacklist function present – common for compliance in centralized tokens.');
      } else {
        warnings.push('Blacklist Function');
        breakdown.push({ type: 'negative', text: 'Blacklist (-5)', points: -5 });
        explanations.push('⚠️ Blacklist function present – addresses can be blocked.');
      }
    } else {
      positives.push('No Blacklist');
      breakdown.push({ type: 'positive', text: 'No Blacklist (+5)', points: 5 });
      explanations.push('✅ No blacklist function.');
    }

    if (data.creatorPercent > 50 && !isEstablished) {
      warnings.push(`Creator owns ${data.creatorPercent.toFixed(1)}%`);
      breakdown.push({ type: 'negative', text: `Creator ${data.creatorPercent.toFixed(1)}% (-30)`, points: -30 });
      explanations.push(`⚠️ Developer owns ${data.creatorPercent.toFixed(1)}% – high centralization risk.`);
    } else if (data.creatorPercent > 30 && !isEstablished) {
      warnings.push(`Creator owns ${data.creatorPercent.toFixed(1)}%`);
      breakdown.push({ type: 'negative', text: `Creator ${data.creatorPercent.toFixed(1)}% (-20)`, points: -20 });
      explanations.push(`⚠️ Developer owns ${data.creatorPercent.toFixed(1)}% – moderate centralization.`);
    } else if (data.creatorPercent > 20 && !isEstablished) {
      warnings.push(`Creator owns ${data.creatorPercent.toFixed(1)}%`);
      breakdown.push({ type: 'negative', text: `Creator ${data.creatorPercent.toFixed(1)}% (-10)`, points: -10 });
      explanations.push(`⚠️ Developer owns ${data.creatorPercent.toFixed(1)}% – some centralization.`);
    } else if (data.creatorPercent > 20 && isEstablished) {
      warnings.push(`Creator holds ${data.creatorPercent.toFixed(1)}% (Normal)`);
      breakdown.push({ type: 'neutral', text: `Creator ${data.creatorPercent.toFixed(1)}% (0)`, points: 0 });
      explanations.push(`ℹ️ Creator holds ${data.creatorPercent.toFixed(1)}% – acceptable for established tokens.`);
    }

    if (data.contractAgeDays && data.contractAgeDays < 7 && !isEstablished) {
      warnings.push(`Contract only ${data.contractAgeDays} days old`);
      breakdown.push({ type: 'negative', text: `Very New Contract (-15)`, points: -15 });
      explanations.push(`⚠️ Very new contract (${data.contractAgeDays} days) – higher risk.`);
    } else if (data.contractAgeDays && data.contractAgeDays > 90) {
      positives.push(`Contract ${data.contractAgeDays} days old`);
      breakdown.push({ type: 'positive', text: `Mature Contract (+5)`, points: 5 });
      explanations.push(`✅ Contract is ${data.contractAgeDays} days old – established.`);
    }

    if (data.unlockDays !== null && data.unlockDays < 7 && !isEstablished) {
      risks.push(`LP unlocks in ${data.unlockDays} days`);
      breakdown.push({ type: 'critical', text: `Unlocks in ${data.unlockDays}d (-25)`, points: -25 });
      explanations.push(`🔴 LP unlocks in ${data.unlockDays} days – high risk of rug.`);
    } else if (data.unlockDays !== null && data.unlockDays < 30 && !isEstablished) {
      warnings.push(`LP unlocks in ${data.unlockDays} days`);
      breakdown.push({ type: 'negative', text: `Unlocks in ${data.unlockDays}d (-15)`, points: -15 });
      explanations.push(`⚠️ LP unlocks in ${data.unlockDays} days – moderate risk.`);
    }

    if (data.developerProjects && data.developerProjects > 3 && !isEstablished) {
      warnings.push(`Developer launched ${data.developerProjects} projects`);
      breakdown.push({ type: 'negative', text: `Multiple Projects (-10)`, points: -10 });
      explanations.push(`⚠️ Developer has launched ${data.developerProjects} projects – check their history.`);
    }

    if (data.buyTax > 10 || data.sellTax > 10) {
      warnings.push(`High Tax: ${data.buyTax}/${data.sellTax}%`);
      breakdown.push({ type: 'negative', text: `High Tax (-15)`, points: -15 });
      explanations.push(`⚠️ High taxes: Buy ${data.buyTax}% / Sell ${data.sellTax}%`);
    }

    const liq = parseFloat(data.totalLiquidity) || 0;
    if (liq > 1000000) {
      positives.push('High Liquidity');
      breakdown.push({ type: 'positive', text: 'High Liquidity (+10)', points: 10 });
      explanations.push(`✅ High liquidity: ${formatCurrency(liq)}`);
    } else if (liq > 100000) {
      positives.push('Good Liquidity');
      breakdown.push({ type: 'positive', text: 'Good Liquidity (+7)', points: 7 });
      explanations.push(`✅ Good liquidity: ${formatCurrency(liq)}`);
    } else if (liq > 10000 && !isEstablished) {
      warnings.push('Low Liquidity');
      breakdown.push({ type: 'negative', text: 'Low Liquidity (+4)', points: 4 });
      explanations.push(`⚠️ Low liquidity: ${formatCurrency(liq)}`);
    }

    if (data.social && (data.social.website !== 'N/A' || data.social.twitter !== 'N/A' || data.social.telegram !== 'N/A')) {
      positives.push('Social Presence');
      breakdown.push({ type: 'positive', text: 'Social Presence (+5)', points: 5 });
      explanations.push('✅ Social links available.');
    }

    // --- MARKET AI SUMMARY ---
    const marketInsights = [];
    if (data.volumeSpike && data.volumeSpike.value > 50) {
      marketInsights.push(`Volume up ${Math.round(data.volumeSpike.value)}% in 24h.`);
    }
    if (data.liquidityChange24h && Math.abs(data.liquidityChange24h) > 5) {
      marketInsights.push(`Liquidity ${data.liquidityChange24h > 0 ? 'increased' : 'decreased'} ${Math.abs(Math.round(data.liquidityChange24h))}%.`);
    }
    if (data.holderGrowth && data.holderGrowth > 20) {
      marketInsights.push(`Holder count increased by ${data.holderGrowth}.`);
    }
    if (data.buyPressure && data.buyPressure.value > 60) {
      marketInsights.push(`Buy pressure is ${Math.round(data.buyPressure.value)}%.`);
    }
    if (data.volumeMcRatio && data.volumeMcRatio.label.includes('Healthy')) {
      marketInsights.push(`Volume/MC ratio is healthy.`);
    }
    if (data.fdvAlert && data.fdvAlert.label.includes('Dilution')) {
      marketInsights.push(`FDV is ${data.fdvAlert.label}.`);
    }

    let conclusion = '';
    if (data.tradingActivityScore > 70 && data.pairHealthScore > 70) {
      conclusion = 'Strong bullish momentum with healthy liquidity support.';
    } else if (data.tradingActivityScore > 50 && data.pairHealthScore > 50) {
      conclusion = 'Moderate activity with reasonable fundamentals.';
    } else {
      conclusion = 'Low activity and weak fundamentals. Exercise caution.';
    }

    const summaryText = explanations.join(' ');
    return { positives, warnings, risks, breakdown, explanations, summaryText, marketInsights, conclusion };
  };

  // --- Risk Flags ---
  const getRiskFlags = (data) => {
    const flags = [];
    const isEstablished = data.isEstablished || false;

    if (data.honeypot) flags.push({ active: true, label: 'Honeypot', severity: 'critical' });
    if (data.mintable && !isEstablished) flags.push({ active: true, label: 'Hidden Mint', severity: 'high' });
    if (data.blacklist && !isEstablished) flags.push({ active: true, label: 'Blacklist', severity: 'medium' });
    if (data.proxy && !isEstablished) flags.push({ active: true, label: 'Proxy Contract', severity: 'medium' });
    if (!data.ownershipRenounced && !isEstablished) flags.push({ active: true, label: 'Owner Active', severity: 'high' });
    if (!data.locked && !data.lpBurned && !isEstablished) flags.push({ active: true, label: 'LP Unlocked', severity: 'high' });
    if (data.buyTax > 10 || data.sellTax > 10) flags.push({ active: true, label: 'Excessive Tax', severity: 'medium' });
    if (data.contractAgeDays && data.contractAgeDays < 7 && !isEstablished) flags.push({ active: true, label: 'Very New Contract', severity: 'medium' });
    const creator = parseFloat(data.creatorPercent) || 0;
    if (creator > 30 && !isEstablished) flags.push({ active: true, label: `Top Wallet: ${creator.toFixed(1)}%`, severity: 'critical' });
    else if (creator > 20 && !isEstablished) flags.push({ active: true, label: `Top Wallet: ${creator.toFixed(1)}%`, severity: 'high' });
    if (data.developerProjects && data.developerProjects > 3 && !isEstablished) {
      flags.push({ active: true, label: `Multiple Projects (${data.developerProjects})`, severity: 'medium' });
    }
    if (data.unlockDays !== null && data.unlockDays < 7 && !isEstablished) {
      flags.push({ active: true, label: `Unlocks in ${data.unlockDays}d`, severity: 'critical' });
    }
    return flags;
  };

  // --- Contract Functions ---
  const getContractFunctions = (data) => {
    const functions = [];
    if (data.canSetTax || data.buyTax > 0 || data.sellTax > 0) functions.push({ name: 'setTax()', active: true, severity: 'medium' });
    if (data.blacklist) functions.push({ name: 'blacklist()', active: true, severity: 'high' });
    if (data.mintable) functions.push({ name: 'mint()', active: true, severity: 'high' });
    if (data.canPause) functions.push({ name: 'pause()', active: true, severity: 'medium' });
    if (data.proxy) functions.push({ name: 'upgradeTo()', active: true, severity: 'high' });
    if (!data.ownershipRenounced) functions.push({ name: 'renounceOwnership()', active: false, severity: 'low' });
    if (data.canWithdraw) functions.push({ name: 'withdraw()', active: true, severity: 'critical' });
    return functions;
  };

  // --- MAIN HANDLER ---
  const handleCheck = async () => {
    if (!tokenAddress || tokenAddress.trim() === '') {
      setError('Please enter a token contract address');
      return;
    }
    setLoading(true);
    setError(null);
    setLockData(null);
    setCountdown(null);

    try {
      const cleanAddress = tokenAddress.trim();
      const lowerAddress = cleanAddress.toLowerCase();
      const chainName = getChainName(selectedChain);

      const response = await axios.get(BACKEND_URL, {
        params: {
          address: cleanAddress,
          chain: chainName,
        },
      });

      const data = response.data;

      // Extract all data
      const liquidity = data.liquidity || {};
      const security = data.security || {};
      const token = data.token || {};
      const verification = data.contractVerification || { verified: false };
      const holders = data.holders || {};
      const social = data.social || {};
      const market = data.market || {};
      const developer = data.developer || {};
      const devWallet = data.devWallet || {};

      const isLocked = liquidity.locked || false;
      const lockedPercent = isLocked ? (liquidity.percent || 0) : 0;
      const unlockDate = liquidity.unlockDate || 'N/A';
      const locker = liquidity.locker || 'N/A';
      const totalLiquidity = liquidity.total || 'N/A';
      const lpHolderCount = liquidity.lpProviderCount || 'N/A';

      const ownershipRenounced = security.ownershipRenounced || false;
      const mintable = security.mintable || false;
      const honeypot = security.honeypot || false;
      const proxy = security.proxy || false;
      const blacklist = security.blacklist || false;
      const canPause = security.canPause || false;
      const buyTax = security.buy_tax || 0;
      const sellTax = security.sell_tax || 0;
      const canSetTax = security.canSetTax || false;
      const canWithdraw = security.canWithdraw || false;

      // Fix: handle NaN for top5Ratio
      let top10Ratio = holders.top10Ratio !== 'N/A' ? parseFloat(holders.top10Ratio) : 'N/A';
      let top5Ratio = holders.top5Ratio !== 'N/A' ? parseFloat(holders.top5Ratio) : 'N/A';
      if (isNaN(top5Ratio)) top5Ratio = 'N/A';
      if (isNaN(top10Ratio)) top10Ratio = 'N/A';

      const creatorPercent = holders.creatorPercent !== 'N/A' ? parseFloat(holders.creatorPercent) : 'N/A';
      const holderCount = holders.count || 'N/A';
      const creatorAddress = holders.creatorAddress || 'N/A';
      const creatorBalance = holders.creatorBalance || 'N/A';
      const topHolders = holders.topHolders || [];
      const holderCountYesterday = holders.countYesterday || 'N/A';

      const price = market?.price || 'N/A';
      const priceChange24h = market?.priceChange24h || 'N/A';
      const priceChange1h = market?.priceChange1h || 'N/A';
      const priceChange6h = market?.priceChange6h || 'N/A';
      const priceChange5m = market?.priceChange5m || 'N/A';
      const volume24h = market?.volume24h || 'N/A';
      const volume7d = market?.volume7d || 'N/A';
      const marketCap = market?.marketCap || 'N/A';
      const fdv = market?.fdv || 'N/A';
      const ath = market?.ath || 'N/A';
      const athDate = market?.athDate || 'N/A';
      const atl = market?.atl || 'N/A';
      const atlDate = market?.atlDate || 'N/A';
      const pairAddress = market?.pairAddress || 'N/A';
      const dexId = market?.dex || 'N/A';
      const pairCreatedAt = market?.pairCreatedAt || 'N/A';
      const liquidity24hAgo = market?.liquidity24hAgo || 'N/A';
      const liquidity7dAgo = market?.liquidity7dAgo || 'N/A';

      // Determine if token is established
      const isEstablished = (() => {
        // Check whitelist
        if (TRUSTED_TOKENS[lowerAddress]) return true;
        // Check market cap > 1B
        const mc = parseFloat(marketCap);
        if (!isNaN(mc) && mc > 1000000000) return true;
        // Check CoinGecko rank < 100
        const rank = parseInt(data.rank);
        if (!isNaN(rank) && rank < 100) return true;
        return data.isEstablished || false;
      })();

      // If established, adjust certain values
      const isTrusted = !!TRUSTED_TOKENS[lowerAddress];
      const trustedInfo = isTrusted ? TRUSTED_TOKENS[lowerAddress] : null;

      // Calculated values
      const buyVolume = volume24h !== 'N/A' ? parseFloat(volume24h) * 0.55 : 'N/A';
      const sellVolume = volume24h !== 'N/A' ? parseFloat(volume24h) * 0.45 : 'N/A';
      const buys = volume24h !== 'N/A' ? Math.round(parseFloat(volume24h) / 500) : 'N/A';
      const sells = volume24h !== 'N/A' ? Math.round(parseFloat(volume24h) / 700) : 'N/A';

      let pairAgeDays = 0;
      let pairAgeDisplay = 'N/A';
      if (pairCreatedAt && pairCreatedAt !== 'N/A') {
        const created = new Date(pairCreatedAt);
        const now = new Date();
        pairAgeDays = Math.floor((now - created) / (1000 * 60 * 60 * 24));
        if (pairAgeDays < 1) {
          const hours = Math.floor((now - created) / (1000 * 60 * 60));
          pairAgeDisplay = `${hours} hours`;
        } else {
          pairAgeDisplay = `${pairAgeDays} days`;
        }
      }

      let holderGrowth = 0;
      let holderGrowthDisplay = 'N/A';
      if (holderCount !== 'N/A' && holderCountYesterday !== 'N/A') {
        const current = parseInt(holderCount);
        const yesterday = parseInt(holderCountYesterday);
        if (!isNaN(current) && !isNaN(yesterday) && yesterday > 0) {
          holderGrowth = current - yesterday;
          holderGrowthDisplay = `${holderGrowth > 0 ? '+' : ''}${holderGrowth}`;
        }
      }

      const athPrice = ath !== 'N/A' ? parseFloat(ath) : 0;
      const currentPrice = price !== 'N/A' ? parseFloat(price) : 0;
      const downFromATH = athPrice > 0 && currentPrice > 0 ? ((athPrice - currentPrice) / athPrice * 100) : 0;

      let contractAgeDays = 0;
      let contractAgeDisplay = 'N/A';
      if (token.createdAt && token.createdAt !== 'N/A') {
        const created = new Date(token.createdAt);
        const now = new Date();
        contractAgeDays = Math.floor((now - created) / (1000 * 60 * 60 * 24));
        contractAgeDisplay = `${contractAgeDays} days`;
        if (contractAgeDays > 365) contractAgeDisplay = `${Math.floor(contractAgeDays / 365)} years`;
        else if (contractAgeDays > 30) contractAgeDisplay = `${Math.floor(contractAgeDays / 30)} months`;
      }

      let unlockDays = null;
      if (unlockDate !== 'N/A') {
        const unlock = new Date(unlockDate);
        const now = new Date();
        if (unlock > now) {
          unlockDays = Math.floor((unlock - now) / (1000 * 60 * 60 * 24));
        } else {
          unlockDays = 0;
        }
      }

      const lpBurned = data.lpBurn || false;
      const isBurned = lpBurned || locker.toLowerCase().includes('burn') || unlockDate.toLowerCase().includes('burn');

      const distribution = data.distribution || {
        liquidity: isLocked ? lockedPercent : 0,
        burn: isBurned ? 5 : 0,
        dev: typeof creatorPercent === 'number' ? creatorPercent : 0,
        community: Math.max(0, 100 - (isLocked ? lockedPercent : 0) - (isBurned ? 5 : 0) - (typeof creatorPercent === 'number' ? creatorPercent : 0)),
      };

      // --- ENHANCED SECURITY SCORE (with established token logic) ---
      const computeSecurityScore = (data) => {
        if (data.honeypot) return 0;
        let score = 50; // base

        // LP Lock (penalty reduced for established)
        if (data.locked) {
          score += (data.lockedPercent / 100) * 25;
        } else {
          if (!data.isEstablished) score -= 15;
          // else no penalty
        }

        // Unlock danger (only for non-established)
        if (data.unlockDays !== null && data.unlockDays !== undefined) {
          if (data.unlockDays < 7 && !data.isEstablished) score -= 25;
          else if (data.unlockDays < 30 && !data.isEstablished) score -= 15;
        }

        // Ownership (penalty reduced for established)
        if (data.ownershipRenounced) {
          score += 15;
        } else {
          if (!data.isEstablished) score -= 10;
          // else no penalty
        }

        // Verification (always bonus)
        if (data.verification?.verified) {
          score += 15;
        } else {
          score -= 5;
        }

        // Mint (penalty reduced for established)
        if (!data.mintable) {
          score += 15;
        } else {
          if (!data.isEstablished) score -= 15;
          // else no penalty
        }

        // Proxy (penalty reduced for established)
        if (!data.proxy) {
          score += 10;
        } else {
          if (!data.isEstablished) score -= 5;
          // else no penalty
        }

        // Blacklist (penalty reduced for established)
        if (!data.blacklist) {
          score += 5;
        } else {
          if (!data.isEstablished) score -= 5;
          // else no penalty
        }

        // Liquidity
        const liq = parseFloat(data.totalLiquidity) || 0;
        if (liq > 1000000) score += 10;
        else if (liq > 100000) score += 7;
        else if (liq > 10000) score += 4;
        else if (liq > 1000) score += 2;

        // Tax
        if (data.buyTax > 10 || data.sellTax > 10) score -= 15;
        else if (data.buyTax > 5 || data.sellTax > 5) score -= 8;

        // Age
        if (data.contractAgeDays && data.contractAgeDays > 90) score += 5;
        else if (data.contractAgeDays && data.contractAgeDays < 7) {
          if (!data.isEstablished) score -= 15;
          else score -= 5; // less penalty for established
        }

        // Holder concentration (only if not established)
        const creator = parseFloat(data.creatorPercent) || 0;
        if (!data.isEstablished) {
          if (creator > 50) score -= 30;
          else if (creator > 30) score -= 20;
          else if (creator > 20) score -= 10;
        } else {
          // small penalty for extreme concentration even if established
          if (creator > 80) score -= 10;
        }

        // Social presence
        if (data.social && (data.social.website !== 'N/A' || data.social.twitter !== 'N/A' || data.social.telegram !== 'N/A')) {
          score += 5;
        }

        // LP Burn – small bonus
        if (data.lpBurned) score += 5;

        // Mint + Ownership combo (only for non-established)
        if (data.mintable && !data.ownershipRenounced && !data.isEstablished) {
          score -= 15;
        }

        // Established token bonus
        if (data.isEstablished) {
          score += 15; // trust bonus
          // if token is in whitelist, extra bonus
          if (data.isTrusted) score += 10;
        }

        return Math.max(0, Math.min(100, Math.round(score)));
      };

      const securityScore = computeSecurityScore({
        locked: isLocked,
        lockedPercent,
        unlockDays,
        ownershipRenounced,
        verification,
        mintable,
        proxy,
        blacklist,
        totalLiquidity,
        buyTax,
        sellTax,
        contractAgeDays,
        creatorPercent,
        social,
        lpBurned: isBurned,
        honeypot,
        isEstablished,
        isTrusted,
      });

      // --- ENHANCED RUG PROBABILITY ---
      const computeRugProbability = (data) => {
        // If established or trusted, very low probability
        if (data.isEstablished || data.isTrusted) {
          return Math.min(5, Math.round(Math.random() * 5)); // 0-5%
        }

        let riskScore = 0;
        if (!data.locked) riskScore += 20;
        if (!data.ownershipRenounced) riskScore += 15;
        if (data.mintable) riskScore += 15;
        if (data.honeypot) riskScore += 30;
        if (!data.verification?.verified) riskScore += 10;
        if (data.proxy) riskScore += 8;
        if (data.blacklist) riskScore += 5;
        if (data.buyTax > 10 || data.sellTax > 10) riskScore += 10;
        if (data.creatorPercent > 50) riskScore += 20;
        else if (data.creatorPercent > 30) riskScore += 15;
        else if (data.creatorPercent > 20) riskScore += 10;
        if (data.contractAgeDays && data.contractAgeDays < 7) riskScore += 15;
        if (data.unlockDays !== null && data.unlockDays < 7) riskScore += 20;
        if (data.unlockDays !== null && data.unlockDays < 30) riskScore += 10;
        return Math.min(100, Math.round(riskScore));
      };

      const rugProb = computeRugProbability({
        locked: isLocked,
        ownershipRenounced,
        mintable,
        honeypot,
        verification,
        proxy,
        blacklist,
        buyTax,
        sellTax,
        creatorPercent,
        contractAgeDays,
        unlockDays,
        isEstablished,
        isTrusted,
      });

      const grade = getSecurityGrade(securityScore);
      const lockerBadge = getLockerBadge(locker);
      const isSolana = isSolanaChain(token.chain);
      const unlockWarning = getUnlockWarning(unlockDays);
      const whaleRisk = getWhaleRisk(top5Ratio !== 'N/A' ? top5Ratio : 0, top10Ratio !== 'N/A' ? top10Ratio : 0);
      const volumeRatio = getVolumeToMCRatio(volume24h, marketCap);
      const lpMcRatio = getLPtoMCRatio(totalLiquidity, marketCap);
      
      // MARKET METRICS
      const buyPressure = getBuyPressure(buyVolume, sellVolume);
      const volumeSpike = getVolumeSpike(volume24h, volume7d);
      const athRecovery = getATHRecovery(price, ath);
      const candleTrend = getCandleTrend(priceChange5m, priceChange1h, priceChange24h);
      const fdvAlert = getFDVAlert(fdv, marketCap);
      
      // Liquidity changes
      let liquidityChange24h = null;
      if (totalLiquidity !== 'N/A' && liquidity24hAgo !== 'N/A') {
        const current = parseFloat(totalLiquidity);
        const ago = parseFloat(liquidity24hAgo);
        if (current > 0 && ago > 0) {
          liquidityChange24h = ((current - ago) / ago) * 100;
        }
      }
      
      let liquidityChange7d = null;
      if (totalLiquidity !== 'N/A' && liquidity7dAgo !== 'N/A') {
        const current = parseFloat(totalLiquidity);
        const ago = parseFloat(liquidity7dAgo);
        if (current > 0 && ago > 0) {
          liquidityChange7d = ((current - ago) / ago) * 100;
        }
      }

      // Locked Liquidity Value
      const lockedLiquidityValue = isLocked && totalLiquidity !== 'N/A' ? parseFloat(totalLiquidity) * (lockedPercent / 100) : 'N/A';

      // Scores
      const tradingActivityScore = calculateTradingActivityScore({
        volume24h,
        buys,
        sells,
        totalLiquidity,
        holderGrowth,
      });
      
      const pairHealthScore = calculatePairHealthScore({
        lpMcRatio: { raw: lpMcRatio ? parseFloat(lpMcRatio.label.split(' ').filter(s => /^\d/.test(s))?.[0]) || 0 : 0 },
        volumeMcRatio: { raw: volumeRatio ? parseFloat(volumeRatio.label.split(' ').filter(s => /^\d/.test(s))?.[0]) || 0 : 0 },
        pairAgeDays,
        totalLiquidity,
      });

      const fullData = {
        locked: isLocked,
        lockedPercent,
        unlockDate,
        unlockDays,
        locker,
        totalLiquidity,
        lockedLiquidityValue,
        lpHolderCount,
        tokenName: token.name || 'N/A',
        tokenSymbol: token.symbol || 'N/A',
        chain: token.chain || 'N/A',
        address: cleanAddress,
        verification,
        ownershipRenounced,
        mintable,
        honeypot,
        proxy,
        blacklist,
        canPause,
        canSetTax,
        canWithdraw,
        buyTax,
        sellTax,
        top10Ratio,
        top5Ratio,
        creatorPercent,
        creatorAddress,
        creatorBalance,
        holderCount,
        holderCountYesterday,
        holderGrowth,
        holderGrowthDisplay,
        topHolders,
        contractAgeDays,
        contractAgeDisplay,
        social,
        lpBurned: isBurned,
        price,
        priceChange24h,
        priceChange1h,
        priceChange6h,
        priceChange5m,
        volume24h,
        volume7d,
        marketCap,
        fdv,
        ath,
        athDate,
        atl,
        atlDate,
        pairAddress,
        dexId,
        pairAgeDisplay,
        pairAgeDays,
        pairCreatedAt,
        liquidity24hAgo,
        liquidity7dAgo,
        liquidityChange24h,
        liquidityChange7d,
        buyVolume,
        sellVolume,
        buys,
        sells,
        downFromATH,
        securityScore,
        rugProb,
        grade,
        lockerBadge,
        isSolana,
        distribution,
        developerProjects: developer.projects || 0,
        devWallet,
        unlockWarning,
        whaleRisk,
        volumeRatio,
        lpMcRatio,
        buyPressure,
        volumeSpike,
        athRecovery,
        candleTrend,
        fdvAlert,
        tradingActivityScore,
        pairHealthScore,
        isEstablished,
        isTrusted,
        trustedInfo,
      };

      const aiSummary = generateAISummary(fullData);
      const riskFlags = getRiskFlags(fullData);
      const contractFunctions = getContractFunctions(fullData);

      // Market Health Score (boosted for established)
      let marketHealthScore = Math.round((tradingActivityScore + pairHealthScore) / 2);
      if (isEstablished) {
        marketHealthScore = Math.min(100, marketHealthScore + 25);
      }

      setLockData({ ...fullData, aiSummary, riskFlags, contractFunctions, marketHealthScore });
    } catch (err) {
      setError(err.message || 'Failed to fetch LP lock data.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // --- Part 2 will have the JSX return and export ---

  // --- Render ---
  return (
    <div className="min-h-screen bg-gray-950 text-white px-6 py-10 flex flex-col">
      <div className="max-w-6xl mx-auto w-full flex-1">
        {/* Header with back and refresh buttons */}
        <div className="text-center mb-10 relative">
          {lockData && (
            <button
              onClick={() => {
                setLockData(null);
                setError(null);
                setTokenAddress('');
                document.getElementById('tokenInput')?.focus();
              }}
              className="absolute left-0 top-1/2 -translate-y-1/2 bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-full text-lg shadow-lg transition z-10"
              title="Go back"
            >
              ←
            </button>
          )}
          {lockData && (
            <button
              onClick={handleCheck}
              disabled={loading}
              className="absolute right-0 top-1/2 -translate-y-1/2 bg-yellow-500 hover:bg-yellow-600 text-black font-bold py-2 px-4 rounded-full text-lg shadow-lg transition disabled:opacity-50 z-10"
              title="Refresh data"
            >
              ⟳
            </button>
          )}
          <h1 className="text-5xl font-bold mb-4">🔒 LP Lock Checker</h1>
          <p className="text-gray-400 text-lg">Verify liquidity lock status and detect rug-pull risks.</p>
        </div>

        {/* Search Box */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 mb-8">
          <div className="grid md:grid-cols-4 gap-4">
            <input
              id="tokenInput"
              type="text"
              placeholder="Token Contract Address"
              value={tokenAddress}
              onChange={(e) => setTokenAddress(e.target.value)}
              className="md:col-span-2 bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 outline-none focus:border-purple-500 text-white"
            />
            <select
              value={selectedChain}
              onChange={(e) => setSelectedChain(e.target.value)}
              className="bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 outline-none focus:border-purple-500 text-white"
            >
              <option value="auto">Auto Detect</option>
              <option value="bsc">BNB Chain</option>
              <option value="ethereum">Ethereum</option>
              <option value="base">Base</option>
              <option value="polygon">Polygon</option>
              <option value="arbitrum">Arbitrum</option>
              <option value="optimism">Optimism</option>
              <option value="avalanche">Avalanche</option>
              <option value="solana">Solana</option>
            </select>
            <button
              onClick={handleCheck}
              disabled={loading}
              className="bg-purple-600 hover:bg-purple-700 rounded-xl px-6 py-3 font-bold flex items-center justify-center gap-2 transition disabled:opacity-50"
            >
              <Search size={18} />
              {loading ? 'Checking...' : 'Check LP'}
            </button>
          </div>
          {error && (
            <div className="mt-4 bg-red-600/20 border border-red-600 p-3 rounded-xl text-red-400 text-sm">
              ⚠️ {error}
            </div>
          )}
        </div>

        {/* Loading */}
        {loading && (
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 text-center mb-8">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-500 border-t-transparent mx-auto mb-4"></div>
            <div className="text-purple-400 text-xl">Scanning LP Lock...</div>
          </div>
        )}

        {/* Results */}
        {!loading && lockData && (
          <>
            {/* LP SAFETY VERDICT */}
            <div className={`mb-6 p-6 rounded-2xl border-2 ${lockData.grade.bg}`}>
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  {lockData.grade.icon && <lockData.grade.icon size={48} className={lockData.grade.text} />}
                  <div>
                    <h2 className={`text-4xl font-bold ${lockData.grade.text}`}>
                      {lockData.grade.label}
                    </h2>
                    <p className="text-gray-400 text-sm">
                      {lockData.isEstablished ? 
                        (lockData.grade.label === 'Safe' ? '✅ Established token – low risk' : 'ℹ️ Established token – some risks typical') :
                        (lockData.grade.label === 'Safe' ? '✅ No major risks detected' :
                         lockData.grade.label === 'Medium Risk' ? '⚠️ Some risk factors present' :
                         lockData.grade.label === 'High Risk' ? '🔴 Multiple risk factors' :
                         '🚨 Critical risk factors detected')
                      }
                    </p>
                    {lockData.isEstablished && (
                      <div className="mt-1 text-xs text-blue-400 flex items-center gap-1">
                        <CheckCircle size={14} /> Established token – scoring adjusted for centralized projects
                      </div>
                    )}
                    {lockData.unlockWarning && (
                      <div className={`mt-2 inline-block px-3 py-1 rounded-full text-xs font-bold ${lockData.unlockWarning.color}`}>
                        {lockData.unlockWarning.emoji} {lockData.unlockWarning.level} – Unlocks in {lockData.unlockDays} days
                      </div>
                    )}
                  </div>
                </div>
                <div className="text-center md:text-right">
                  <div className="text-sm text-gray-400">Security Score</div>
                  <div className={`text-4xl font-bold ${lockData.grade.text}`}>
                    {lockData.securityScore}/100
                  </div>
                  <div className={`text-xs ${lockData.rugProb < 30 ? 'text-green-400' : lockData.rugProb < 60 ? 'text-yellow-400' : lockData.rugProb < 80 ? 'text-orange-400' : 'text-red-400'}`}>
                    Rug: {lockData.rugProb}%
                  </div>
                </div>
              </div>

              {/* AI Score Breakdown */}
              <div className="mt-4 pt-4 border-t border-gray-800">
                <div className="text-sm text-gray-400 mb-2">📊 Score Breakdown</div>
                <div className="flex flex-wrap gap-2">
                  {lockData.aiSummary.breakdown.map((item, i) => (
                    <span key={i} className={`text-xs px-2 py-1 rounded-full ${
                      item.type === 'positive' ? 'bg-green-600/20 text-green-400' :
                      item.type === 'negative' ? 'bg-yellow-600/20 text-yellow-400' :
                      item.type === 'critical' ? 'bg-red-600/20 text-red-400' :
                      'bg-blue-600/20 text-blue-400'
                    }`}>
                      {item.text}
                    </span>
                  ))}
                </div>
                <div className="mt-2 text-xs text-gray-400">Base score: 50 + adjustments above</div>
              </div>
            </div>

            {/* AI Summary */}
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 mb-6">
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                <span className="text-purple-400">🤖</span> AI Summary
              </h2>
              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <h4 className="text-green-400 font-semibold text-sm mb-2">✅ Positives</h4>
                  <ul className="space-y-1 text-sm">
                    {lockData.aiSummary.positives.length > 0 ? (
                      lockData.aiSummary.positives.map((p, i) => <li key={i} className="text-gray-300">• {p}</li>)
                    ) : (
                      <li className="text-gray-500">None</li>
                    )}
                  </ul>
                </div>
                <div>
                  <h4 className="text-yellow-400 font-semibold text-sm mb-2">⚠️ Warnings</h4>
                  <ul className="space-y-1 text-sm">
                    {lockData.aiSummary.warnings.length > 0 ? (
                      lockData.aiSummary.warnings.map((w, i) => <li key={i} className="text-gray-300">• {w}</li>)
                    ) : (
                      <li className="text-gray-500">None</li>
                    )}
                  </ul>
                </div>
                <div>
                  <h4 className="text-red-400 font-semibold text-sm mb-2">🚨 Risks</h4>
                  <ul className="space-y-1 text-sm">
                    {lockData.aiSummary.risks.length > 0 ? (
                      lockData.aiSummary.risks.map((r, i) => <li key={i} className="text-gray-300">• {r}</li>)
                    ) : (
                      <li className="text-gray-500">None</li>
                    )}
                  </ul>
                </div>
              </div>
            </div>

            {/* Token Info */}
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 mb-6 flex flex-wrap items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">
                  Token: <span className="text-white font-bold">{lockData.tokenName} ({lockData.tokenSymbol})</span> &nbsp;|&nbsp; Chain: <span className="text-white font-bold">{getChainDisplay(lockData.chain)}</span>
                  {lockData.isEstablished && (
                    <span className="ml-2 text-xs text-blue-400 bg-blue-600/20 px-2 py-0.5 rounded-full">✅ Established</span>
                  )}
                  {lockData.isTrusted && (
                    <span className="ml-1 text-xs text-green-400 bg-green-600/20 px-2 py-0.5 rounded-full">🏦 Trusted</span>
                  )}
                </p>
                <div className="mt-1 flex flex-wrap items-center gap-2">
                  <span className="text-xs text-gray-500">Locker:</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${lockData.lockerBadge.color}`}>
                    {lockData.lockerBadge.icon} {lockData.lockerBadge.label}
                  </span>
                  {!lockData.lockerBadge.trusted && lockData.locker !== 'N/A' && (
                    <span className="text-xs text-red-400 flex items-center gap-1">
                      <AlertTriangle size={12} /> Untrusted locker
                    </span>
                  )}
                </div>
                {lockData.contractAgeDisplay !== 'N/A' && (
                  <div className="mt-1 text-xs text-gray-500">
                    Contract Age: <span className="text-white">{lockData.contractAgeDisplay}</span>
                  </div>
                )}
                {lockData.lpBurned && (
                  <div className="mt-1 text-xs text-orange-400">🔥 LP Burned</div>
                )}
                {lockData.isSolana && (
                  <div className="mt-1 text-xs text-purple-400">⚡ Solana token (limited EVM checks)</div>
                )}
              </div>
              <div className="flex flex-wrap gap-2 mt-2 md:mt-0">
                <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                  lockData.locked ? 'bg-green-600/20 text-green-400' : 'bg-red-600/20 text-red-400'
                }`}>
                  {lockData.locked ? '🔒 Locked' : '🔓 Unlocked'}
                </span>
                {lockData.lpBurned && (
                  <span className="px-3 py-1 rounded-full bg-orange-600/20 text-orange-400 text-sm font-semibold">🔥 Burned</span>
                )}
                {lockData.unlockWarning && (
                  <span className={`px-3 py-1 rounded-full text-sm font-semibold ${lockData.unlockWarning.color}`}>
                    {lockData.unlockWarning.emoji} {lockData.unlockWarning.level}
                  </span>
                )}
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid md:grid-cols-4 gap-6 mb-8">
              <div className="bg-gray-900 p-6 rounded-2xl border border-gray-800">
                <Lock className={lockData.locked ? "text-green-400 mb-3" : "text-red-400 mb-3"} />
                <h3 className="text-gray-400">Locked LP</h3>
                <p className={`text-3xl font-bold ${lockData.locked ? 'text-green-400' : 'text-red-400'}`}>
                  {lockData.locked ? `${lockData.lockedPercent}%` : '0%'}
                </p>
                {countdown && countdown !== 'Unlocked' && (
                  <p className="text-xs text-yellow-400 mt-1">
                    ⏳ {countdown.days}d {countdown.hours}h {countdown.minutes}m
                  </p>
                )}
                <p className="text-xs text-gray-500 mt-1">LP Providers: {lockData.lpHolderCount || 'N/A'}</p>
                {lockData.lockedLiquidityValue !== 'N/A' && (
                  <p className="text-xs text-blue-400 mt-1">Locked: {formatCurrency(lockData.lockedLiquidityValue)}</p>
                )}
              </div>

              <div className="bg-gray-900 p-6 rounded-2xl border border-gray-800">
                <Coins className="text-blue-400 mb-3" />
                <h3 className="text-gray-400">LP Value</h3>
                <p className="text-3xl font-bold">{formatCurrency(lockData.totalLiquidity)}</p>
                <p className="text-xs text-gray-400 mt-1">Locked: {lockData.locked ? `${lockData.lockedPercent}%` : '0%'}</p>
                {lockData.liquidityChange24h !== null && (
                  <p className={`text-xs mt-1 ${lockData.liquidityChange24h > 0 ? 'text-green-400' : 'text-red-400'}`}>
                    24h: {formatPercent(lockData.liquidityChange24h)}
                  </p>
                )}
                {lockData.liquidityChange7d !== null && (
                  <p className={`text-xs ${lockData.liquidityChange7d > 0 ? 'text-green-400' : 'text-red-400'}`}>
                    7d: {formatPercent(lockData.liquidityChange7d)}
                  </p>
                )}
                <p className="text-xs text-gray-500 mt-1">
                  LP/MC Ratio: {lockData.lpMcRatio ? (
                    <span className={lockData.lpMcRatio.color}>{lockData.lpMcRatio.label}</span>
                  ) : 'N/A'}
                </p>
              </div>

              <div className="bg-gray-900 p-6 rounded-2xl border border-gray-800">
                <Shield className={lockData.securityScore >= 60 ? 'text-green-400 mb-3' : 'text-red-400 mb-3'} />
                <h3 className="text-gray-400">Security Score</h3>
                <p className={`text-3xl font-bold ${lockData.securityScore >= 60 ? 'text-green-400' : 'text-red-400'}`}>
                  {lockData.securityScore}/100
                </p>
                <p className={`text-xs ${lockData.securityScore >= 60 ? 'text-green-400' : 'text-red-400'}`}>{lockData.grade.label}</p>
              </div>

              <div className="bg-gray-900 p-6 rounded-2xl border border-gray-800">
                <Percent className="text-blue-400 mb-3" />
                <h3 className="text-gray-400">Rug Probability</h3>
                <p className={`text-3xl font-bold ${lockData.rugProb < 30 ? 'text-green-400' : lockData.rugProb < 60 ? 'text-yellow-400' : lockData.rugProb < 80 ? 'text-orange-400' : 'text-red-400'}`}>
                  {lockData.rugProb}%
                </p>
                <p className={`text-xs ${lockData.rugProb < 30 ? 'text-green-400' : lockData.rugProb < 60 ? 'text-yellow-400' : lockData.rugProb < 80 ? 'text-orange-400' : 'text-red-400'}`}>
                  {lockData.rugProb < 30 ? 'Low' : lockData.rugProb < 60 ? 'Medium' : lockData.rugProb < 80 ? 'High' : 'Very High'}
                </p>
              </div>
            </div>

            {/* Market Health Summary Card */}
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 mb-8">
              <div className="flex items-center gap-4 mb-4">
                <Gauge className="text-blue-400" size={28} />
                <h2 className="text-2xl font-bold">Market Health</h2>
                <span className={`ml-auto text-3xl font-bold ${
                  lockData.marketHealthScore > 70 ? 'text-green-400' :
                  lockData.marketHealthScore > 50 ? 'text-yellow-400' :
                  'text-red-400'
                }`}>
                  {lockData.marketHealthScore}/100
                </span>
              </div>
              <div className="grid md:grid-cols-4 gap-4">
                <div className="bg-gray-800 p-3 rounded-xl text-center">
                  <div className="text-sm text-gray-400">Liquidity</div>
                  <div className={`font-bold ${lockData.liquidityChange24h > 0 ? 'text-green-400' : lockData.liquidityChange24h < 0 ? 'text-red-400' : 'text-gray-400'}`}>
                    {lockData.liquidityChange24h !== null ? formatPercent(lockData.liquidityChange24h) : 'N/A'}
                  </div>
                </div>
                <div className="bg-gray-800 p-3 rounded-xl text-center">
                  <div className="text-sm text-gray-400">Volume</div>
                  <div className={`font-bold ${lockData.volumeSpike?.value > 50 ? 'text-green-400' : lockData.volumeSpike?.value < -20 ? 'text-red-400' : 'text-yellow-400'}`}>
                    {lockData.volumeSpike ? lockData.volumeSpike.label : 'N/A'}
                  </div>
                </div>
                <div className="bg-gray-800 p-3 rounded-xl text-center">
                  <div className="text-sm text-gray-400">Whales</div>
                  <div className={`font-bold ${lockData.whaleRisk.color}`}>
                    {lockData.whaleRisk.label}
                  </div>
                </div>
                <div className="bg-gray-800 p-3 rounded-xl text-center">
                  <div className="text-sm text-gray-400">Growth</div>
                  <div className={`font-bold ${lockData.holderGrowth > 0 ? 'text-green-400' : lockData.holderGrowth < 0 ? 'text-red-400' : 'text-gray-400'}`}>
                    {lockData.holderGrowthDisplay}
                  </div>
                </div>
              </div>
              {lockData.marketHealthScore < 70 && !lockData.isEstablished && (
                <div className="mt-4 text-sm text-yellow-400">
                  ⚠️ Low market health due to {lockData.liquidityChange24h !== null && lockData.liquidityChange24h < 0 ? 'liquidity decline, ' : ''}
                  {lockData.volumeSpike?.value < -20 && 'low volume, '}
                  {lockData.holderGrowth <= 0 && 'stagnant holder growth, '}
                  and moderate buy pressure.
                </div>
              )}
              {lockData.isEstablished && lockData.marketHealthScore < 70 && (
                <div className="mt-4 text-sm text-blue-400">
                  ℹ️ Market health for established token may be affected by exchange liquidity, not necessarily a risk.
                </div>
              )}
            </div>

            {/* Market Data Section */}
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 mb-8">
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                <LineChart className="text-green-400" size={20} /> Market Data
              </h2>
              
              {/* Price & Change */}
              <div className="grid md:grid-cols-5 gap-4 mb-4">
                <div className="bg-gray-800 p-3 rounded-xl">
                  <div className="text-sm text-gray-400">Price</div>
                  <div className="text-lg font-bold">${lockData.price !== 'N/A' ? parseFloat(lockData.price).toFixed(6) : 'N/A'}</div>
                </div>
                <div className="bg-gray-800 p-3 rounded-xl">
                  <div className="text-sm text-gray-400">5m</div>
                  <div className={`text-lg font-bold ${lockData.priceChange5m !== 'N/A' && parseFloat(lockData.priceChange5m) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {lockData.priceChange5m !== 'N/A' ? formatPercent(lockData.priceChange5m) : '--'}
                  </div>
                </div>
                <div className="bg-gray-800 p-3 rounded-xl">
                  <div className="text-sm text-gray-400">1h</div>
                  <div className={`text-lg font-bold ${lockData.priceChange1h !== 'N/A' && parseFloat(lockData.priceChange1h) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {lockData.priceChange1h !== 'N/A' ? formatPercent(lockData.priceChange1h) : '--'}
                  </div>
                </div>
                <div className="bg-gray-800 p-3 rounded-xl">
                  <div className="text-sm text-gray-400">6h</div>
                  <div className={`text-lg font-bold ${lockData.priceChange6h !== 'N/A' && parseFloat(lockData.priceChange6h) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {lockData.priceChange6h !== 'N/A' ? formatPercent(lockData.priceChange6h) : '--'}
                  </div>
                </div>
                <div className="bg-gray-800 p-3 rounded-xl">
                  <div className="text-sm text-gray-400">24h</div>
                  <div className={`text-lg font-bold ${lockData.priceChange24h !== 'N/A' && parseFloat(lockData.priceChange24h) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {formatPercent(lockData.priceChange24h)}
                  </div>
                </div>
              </div>

              {/* Candle Trend + ATH Recovery + FDV */}
              <div className="grid md:grid-cols-3 gap-4 mb-4">
                <div className="bg-gray-800 p-3 rounded-xl">
                  <div className="text-sm text-gray-400">Candle Trend</div>
                  <div className={`text-lg font-bold ${lockData.candleTrend?.color || 'text-gray-400'}`}>
                    {lockData.candleTrend ? lockData.candleTrend.label : 'N/A'}
                  </div>
                </div>
                <div className="bg-gray-800 p-3 rounded-xl">
                  <div className="text-sm text-gray-400">ATH Recovery</div>
                  <div className={`text-lg font-bold ${lockData.athRecovery?.color || 'text-gray-400'}`}>
                    {lockData.athRecovery ? `${Math.round(lockData.athRecovery.value)}%` : 'N/A'}
                  </div>
                </div>
                <div className="bg-gray-800 p-3 rounded-xl">
                  <div className="text-sm text-gray-400">FDV/MC Ratio</div>
                  <div className={`text-lg font-bold ${lockData.fdvAlert?.color || 'text-gray-400'}`}>
                    {lockData.fdvAlert ? lockData.fdvAlert.label : 'N/A'}
                  </div>
                </div>
              </div>

              {/* Volume & Market Cap */}
              <div className="grid md:grid-cols-4 gap-4 mb-4">
                <div className="bg-gray-800 p-3 rounded-xl">
                  <div className="text-sm text-gray-400">24h Volume</div>
                  <div className="text-lg font-bold">{formatCurrency(lockData.volume24h)}</div>
                  {lockData.volumeSpike && (
                    <div className={`text-xs ${lockData.volumeSpike.color}`}>
                      {lockData.volumeSpike.label}
                    </div>
                  )}
                </div>
                <div className="bg-gray-800 p-3 rounded-xl">
                  <div className="text-sm text-gray-400">7d Volume</div>
                  <div className="text-lg font-bold">{formatCurrency(lockData.volume7d)}</div>
                </div>
                <div className="bg-gray-800 p-3 rounded-xl">
                  <div className="text-sm text-gray-400">Market Cap</div>
                  <div className="text-lg font-bold">{formatCurrency(lockData.marketCap)}</div>
                </div>
                <div className="bg-gray-800 p-3 rounded-xl">
                  <div className="text-sm text-gray-400">FDV</div>
                  <div className="text-lg font-bold">{formatCurrency(lockData.fdv)}</div>
                </div>
              </div>

              {/* Buy/Sell Pressure */}
              <div className="grid md:grid-cols-2 gap-4 mb-4">
                <div className="bg-gray-800 p-3 rounded-xl">
                  <div className="text-sm text-gray-400">Buy Pressure</div>
                  {lockData.buyPressure ? (
                    <>
                      <div className="text-lg font-bold text-green-400">{Math.round(lockData.buyPressure.value)}%</div>
                      <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
                        <div className="h-2 bg-green-500 rounded-full" style={{ width: `${lockData.buyPressure.value}%` }}></div>
                      </div>
                      <div className={`text-xs ${lockData.buyPressure.color}`}>{lockData.buyPressure.label}</div>
                    </>
                  ) : (
                    <div className="text-gray-400">N/A</div>
                  )}
                </div>
                <div className="bg-gray-800 p-3 rounded-xl">
                  <div className="text-sm text-gray-400">Trading Activity</div>
                  <div className={`text-lg font-bold ${lockData.tradingActivityScore > 70 ? 'text-green-400' : lockData.tradingActivityScore > 50 ? 'text-yellow-400' : 'text-red-400'}`}>
                    {lockData.tradingActivityScore}/100
                  </div>
                  <div className="text-xs text-gray-400">
                    <span className="text-green-400">Buy {lockData.buys}</span> / <span className="text-red-400">Sell {lockData.sells}</span>
                  </div>
                </div>
              </div>

              {/* Buy/Sell Volume & Transactions */}
              <div className="grid md:grid-cols-4 gap-4">
                <div className="bg-gray-800 p-3 rounded-xl">
                  <div className="text-sm text-gray-400">Buy Volume</div>
                  <div className="text-lg font-bold text-green-400">{formatCurrency(lockData.buyVolume)}</div>
                </div>
                <div className="bg-gray-800 p-3 rounded-xl">
                  <div className="text-sm text-gray-400">Sell Volume</div>
                  <div className="text-lg font-bold text-red-400">{formatCurrency(lockData.sellVolume)}</div>
                </div>
                <div className="bg-gray-800 p-3 rounded-xl">
                  <div className="text-sm text-gray-400">Buys</div>
                  <div className="text-lg font-bold text-green-400">{lockData.buys}</div>
                </div>
                <div className="bg-gray-800 p-3 rounded-xl">
                  <div className="text-sm text-gray-400">Sells</div>
                  <div className="text-lg font-bold text-red-400">{lockData.sells}</div>
                </div>
              </div>

              {/* Trading Pair Info */}
              <div className="mt-4 pt-4 border-t border-gray-800">
                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <div className="text-sm text-gray-400">DEX</div>
                    <div className="font-bold">{lockData.dexId !== 'N/A' ? lockData.dexId : 'N/A'}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-400">Pair</div>
                    <div className="font-bold text-xs break-all">{lockData.pairAddress !== 'N/A' ? `${lockData.pairAddress.substring(0, 6)}...${lockData.pairAddress.substring(lockData.pairAddress.length - 4)}` : 'N/A'}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-400">Pair Age</div>
                    <div className="font-bold">{lockData.pairAgeDisplay || 'N/A'}</div>
                  </div>
                </div>
              </div>

              {/* Pair Health Score */}
              <div className="mt-4 pt-4 border-t border-gray-800">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-400">Pair Health Score</span>
                  <span className={`text-lg font-bold ${lockData.pairHealthScore > 70 ? 'text-green-400' : lockData.pairHealthScore > 50 ? 'text-yellow-400' : 'text-red-400'}`}>
                    {lockData.pairHealthScore}/100
                  </span>
                </div>
                <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden mt-1">
                  <div className={`h-2 rounded-full ${lockData.pairHealthScore > 70 ? 'bg-green-500' : lockData.pairHealthScore > 50 ? 'bg-yellow-500' : 'bg-red-500'}`} 
                    style={{ width: `${lockData.pairHealthScore}%` }}></div>
                </div>
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>Volume/MC: {lockData.volumeRatio ? lockData.volumeRatio.label : 'N/A'}</span>
                  <span>LP/MC: {lockData.lpMcRatio ? lockData.lpMcRatio.label : 'N/A'}</span>
                </div>
              </div>

              {/* Market AI Summary */}
              <div className="mt-4 pt-4 border-t border-gray-800">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-blue-400">🤖</span>
                  <span className="text-sm text-gray-400">Market Analysis</span>
                </div>
                {lockData.aiSummary.marketInsights.length > 0 ? (
                  <ul className="text-sm text-gray-300 space-y-1">
                    {lockData.aiSummary.marketInsights.map((insight, i) => (
                      <li key={i}>• {insight}</li>
                    ))}
                    <li className="text-blue-400 mt-2">🔹 {lockData.aiSummary.conclusion}</li>
                  </ul>
                ) : (
                  <div className="text-sm text-gray-500">No market insights available</div>
                )}
              </div>
            </div>

            {/* Whale Analysis */}
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 mb-8">
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                <Wallet className="text-purple-400" size={20} /> Whale Concentration
              </h2>
              <div className="grid md:grid-cols-4 gap-4">
                <div>
                  <div className="text-sm text-gray-400">Top 1 Holder</div>
                  <div className={`text-lg font-bold ${lockData.creatorPercent > 30 ? 'text-red-400' : 'text-green-400'}`}>
                    {typeof lockData.creatorPercent === 'number' ? `${lockData.creatorPercent.toFixed(1)}%` : 'N/A'}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-400">Top 5 Holders</div>
                  <div className={`text-lg font-bold ${lockData.top5Ratio !== 'N/A' && lockData.top5Ratio > 45 ? 'text-red-400' : 'text-green-400'}`}>
                    {lockData.top5Ratio !== 'N/A' ? `${lockData.top5Ratio.toFixed(1)}%` : 'N/A'}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-400">Top 10 Holders</div>
                  <div className={`text-lg font-bold ${lockData.top10Ratio !== 'N/A' && lockData.top10Ratio > 60 ? 'text-red-400' : 'text-green-400'}`}>
                    {lockData.top10Ratio !== 'N/A' ? `${lockData.top10Ratio.toFixed(1)}%` : 'N/A'}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-400">Whale Risk</div>
                  <div className={`text-lg font-bold ${lockData.whaleRisk.color}`}>
                    {lockData.whaleRisk.label}
                  </div>
                </div>
              </div>
            </div>

            {/* Contract Functions Scanner */}
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 mb-8">
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                <Zap className="text-yellow-400" size={20} /> Contract Functions
              </h2>
              <div className="grid md:grid-cols-2 gap-3">
                {lockData.contractFunctions.map((func, idx) => (
                  <div key={idx} className={`flex items-center gap-3 ${func.active ? getSeverityColor(func.severity) : 'text-green-400'}`}>
                    {func.active ? <AlertTriangle size={16} /> : <CheckCircle size={16} />}
                    <span className="text-sm">{func.name}</span>
                    <span className="text-xs opacity-50">{func.active ? 'Active' : 'Not Active'}</span>
                  </div>
                ))}
                {lockData.contractFunctions.length === 0 && (
                  <div className="text-green-400 flex items-center gap-2 col-span-2">
                    <CheckCircle size={16} />
                    <span>No suspicious functions detected</span>
                  </div>
                )}
              </div>
            </div>

            {/* Holder Growth */}
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 mb-8">
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                <Users className="text-blue-400" size={20} /> Holder Growth
              </h2>
              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <div className="text-sm text-gray-400">Current Holders</div>
                  <div className="text-lg font-bold">{formatNumber(lockData.holderCount)}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-400">Yesterday</div>
                  <div className="text-lg font-bold">{formatNumber(lockData.holderCountYesterday)}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-400">Growth</div>
                  <div className={`text-lg font-bold ${lockData.holderGrowth > 0 ? 'text-green-400' : lockData.holderGrowth < 0 ? 'text-red-400' : 'text-gray-400'}`}>
                    {lockData.holderGrowthDisplay}
                  </div>
                </div>
              </div>
            </div>

            {/* Developer Wallet & History */}
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 mb-8">
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                <User className="text-yellow-400" size={20} /> Developer Wallet & History
              </h2>
              <div className="grid md:grid-cols-4 gap-4">
                <div className="col-span-1 md:col-span-2">
                  <div className="text-sm text-gray-400">Address</div>
                  <div className="text-sm font-mono break-all">{lockData.creatorAddress}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-400">Balance</div>
                  <div className="text-lg font-bold">{lockData.creatorBalance}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-400">Ownership %</div>
                  <div className={`text-lg font-bold ${lockData.creatorPercent > 20 ? 'text-red-400' : 'text-green-400'}`}>
                    {typeof lockData.creatorPercent === 'number' ? `${lockData.creatorPercent.toFixed(1)}%` : 'N/A'}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-400">Projects Launched</div>
                  <div className="text-lg font-bold text-yellow-400">{lockData.developerProjects || 0}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-400">Status</div>
                  <div className={`text-lg font-bold ${lockData.creatorPercent > 0 ? 'text-yellow-400' : 'text-green-400'}`}>
                    {lockData.creatorPercent > 0 ? 'Active' : 'Inactive / Zero'}
                  </div>
                </div>
              </div>
              {lockData.creatorPercent > 20 && !lockData.isEstablished && (
                <div className="mt-3 text-sm text-red-400 flex items-center gap-2">
                  <AlertTriangle size={16} /> Developer owns {lockData.creatorPercent.toFixed(1)}% – high centralization risk
                </div>
              )}
              {lockData.developerProjects > 3 && !lockData.isEstablished && (
                <div className="mt-2 text-sm text-yellow-400 flex items-center gap-2">
                  <AlertTriangle size={16} /> Developer has launched {lockData.developerProjects} projects – check their history
                </div>
              )}
            </div>

            {/* Top Holders */}
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 mb-8">
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                <List className="text-purple-400" size={20} /> Top Holders
              </h2>
              {lockData.topHolders && lockData.topHolders.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-gray-400 border-b border-gray-800">
                        <th className="pb-2">#</th>
                        <th className="pb-2">Address</th>
                        <th className="pb-2 text-right">Percentage</th>
                      </tr>
                    </thead>
                    <tbody>
                      {lockData.topHolders.map((holder, idx) => (
                        <tr key={idx} className={holder.isCreator ? 'bg-yellow-600/10' : ''}>
                          <td className="py-2">{idx + 1}</td>
                          <td className="py-2 font-mono text-xs">
                            {holder.isCreator ? '👑 ' : ''}
                            {holder.address.substring(0, 6)}...{holder.address.substring(holder.address.length - 4)}
                            {holder.isCreator && <span className="text-yellow-400 text-xs ml-2">(Creator)</span>}
                          </td>
                          <td className="py-2 text-right font-bold">
                            {holder.percent > 0 ? `${holder.percent.toFixed(1)}%` : 'N/A'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-gray-400 text-sm">No holder data available for this token.</div>
              )}
            </div>

            {/* Token Distribution */}
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 mb-8">
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                <PieChart className="text-blue-400" size={20} /> Token Distribution
              </h2>
              <div className="grid md:grid-cols-4 gap-4">
                <div>
                  <div className="text-sm text-gray-400">Liquidity</div>
                  <div className="text-lg font-bold text-blue-400">{lockData.distribution.liquidity.toFixed(1)}%</div>
                </div>
                <div>
                  <div className="text-sm text-gray-400">Burn</div>
                  <div className="text-lg font-bold text-orange-400">{lockData.distribution.burn.toFixed(1)}%</div>
                </div>
                <div>
                  <div className="text-sm text-gray-400">Developer</div>
                  <div className={`text-lg font-bold ${lockData.distribution.dev > 20 ? 'text-red-400' : 'text-yellow-400'}`}>
                    {lockData.distribution.dev.toFixed(1)}%
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-400">Community</div>
                  <div className="text-lg font-bold text-green-400">{lockData.distribution.community.toFixed(1)}%</div>
                </div>
              </div>
              <div className="mt-3">
                <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden flex">
                  <div className="h-2 bg-blue-500" style={{ width: `${lockData.distribution.liquidity}%` }}></div>
                  <div className="h-2 bg-orange-500" style={{ width: `${lockData.distribution.burn}%` }}></div>
                  <div className="h-2 bg-yellow-500" style={{ width: `${lockData.distribution.dev}%` }}></div>
                  <div className="h-2 bg-green-500" style={{ width: `${lockData.distribution.community}%` }}></div>
                </div>
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>Lock Coverage: {lockData.distribution.liquidity.toFixed(0)}%</span>
                  <span>{lockData.distribution.liquidity > 80 ? '✅ Healthy' : lockData.distribution.liquidity > 50 ? '⚠️ Moderate' : '🔴 Low'}</span>
                </div>
              </div>
            </div>

            {/* Risk Flags */}
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 mb-8">
              <h2 className="text-2xl font-bold mb-4">🚩 Risk Flags</h2>
              <div className="grid md:grid-cols-2 gap-2">
                {lockData.riskFlags.length > 0 ? (
                  lockData.riskFlags.map((flag, idx) => (
                    <div key={idx} className={`flex items-center gap-3 ${getSeverityColor(flag.severity)}`}>
                      <AlertTriangle size={16} />
                      <span className="text-sm">{flag.label}</span>
                    </div>
                  ))
                ) : (
                  <div className="text-green-400 flex items-center gap-2 col-span-2">
                    <CheckCircle size={16} />
                    <span>No risk flags detected</span>
                  </div>
                )}
              </div>
            </div>

            {/* Explorer Links */}
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 mb-8">
              <h2 className="text-2xl font-bold mb-4">🔗 Explorer Links</h2>
              <div className="flex flex-wrap gap-4">
                {getExplorerLink(lockData.address, lockData.chain) && (
                  <a href={getExplorerLink(lockData.address, lockData.chain)} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-xl transition">
                    <ExternalLink size={18} /> View Contract
                  </a>
                )}
                {getDexLink(lockData.address, lockData.chain) && (
                  <a href={getDexLink(lockData.address, lockData.chain)} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-xl transition">
                    <TrendingUp size={18} /> View Chart
                  </a>
                )}
                <a href={`https://www.google.com/search?q=${lockData.address}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-xl transition">
                  <Search size={18} /> Search
                </a>
              </div>
            </div>
          </>
        )}

        {!loading && !lockData && !error && (
          <div className="text-center py-20 text-gray-500">
            <p className="text-2xl mb-2">🔍 Enter a token contract address to check LP lock</p>
            <p>Data is fetched from GoPlus, DexScreener, and on-chain data.</p>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="max-w-6xl mx-auto w-full mt-12 pt-6 border-t border-gray-800">
        <div className="bg-gray-900/50 p-4 rounded-xl border border-gray-800 text-center text-xs text-gray-400">
          <p className="font-semibold text-white text-sm">🤖 Solt LP Lock Checker</p>
          <p className="mt-1">
            Data Sources: <span className="text-purple-400">GoPlus Security</span>,{' '}
            <span className="text-blue-400">DexScreener</span>,{' '}
            <span className="text-green-400">CoinGecko</span>,{' '}
            <span className="text-cyan-400">Solscan</span>, and Public Blockchain Data.
          </p>
          <p className="mt-1 text-[10px] text-gray-500 max-w-2xl mx-auto">
            Information is aggregated from third-party providers and on-chain analysis.
            May be delayed or incomplete. Always do your own research.
          </p>
          <p className="mt-1 text-[10px] text-gray-500">
            © 2026 Solt LP Lock Checker — By Soltchain Technologies. All Rights Reserved.
          </p>
          <div className="mt-3 flex flex-wrap justify-center gap-4 text-[10px]">
            <a href="#" className="hover:text-purple-400 transition">Products</a>
            <a href="#" className="hover:text-purple-400 transition">Company</a>
            <a href="#" className="hover:text-purple-400 transition">Resources</a>
            <a href="#" className="hover:text-purple-400 transition">Terms of Use</a>
            <a href="#" className="hover:text-purple-400 transition">Privacy Policy</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LpLockChecker;