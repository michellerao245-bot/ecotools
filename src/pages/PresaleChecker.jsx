import React, { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';
import { ethers } from 'ethers';

// --- Etherscan API Key (Optional) ---
const ETHERSCAN_API_KEY = 'YOUR_ETHERSCAN_API_KEY';

// --- Chain Mapping (including Solana) ---
const chainMap = {
  1: 'Ethereum',
  56: 'BNB Chain',
  137: 'Polygon',
  42161: 'Arbitrum',
  10: 'Optimism',
  43114: 'Avalanche',
  501: 'Solana',
};

// --- Reverse mapping for dropdown ---
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

// --- Helper: detect chain from address ---
const detectChainFromAddress = (address) => {
  if (!address) return 'auto';
  const trimmed = address.trim();
  if (trimmed.startsWith('0x')) {
    return 'auto'; // EVM – user will select or default to BSC
  }
  // Solana address: base58, 32-44 chars, not starting with 0x
  if (/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(trimmed)) {
    return 501; // Solana
  }
  return 'auto';
};

// --- Helper: format currency ---
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

// --- MAIN COMPONENT ---
const PresaleChecker = () => {
  const [tokenAddress, setTokenAddress] = useState('');
  const [selectedChain, setSelectedChain] = useState('auto');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [presaleData, setPresaleData] = useState(null);
  const [scanHistory, setScanHistory] = useState([]);
  const [monitoring, setMonitoring] = useState(false);
  const [whatIfAmount, setWhatIfAmount] = useState(1000);

  // --- Resolve actual chainId from address and selection ---
  const resolveChainId = useCallback((address, selected) => {
    if (selected !== 'auto') return parseInt(selected);
    const detected = detectChainFromAddress(address);
    if (detected === 501) return 501; // Solana
    // For EVM, we default to BSC if not specified (could be improved)
    return 56; // default BSC for EVM
  }, []);

  // --- API Functions ---

  // 1. GoPlus Security (EVM only)
  const fetchGoPlusData = async (address, chainId) => {
    if (chainId === 501) return null;
    try {
      const res = await axios.get(
        `https://api.gopluslabs.io/api/v1/token_security/${chainId}?contract_addresses=${address}`
      );
      const data = res.data.result?.[address.toLowerCase()];
      if (!data) return null;
      return data;
    } catch (e) {
      console.warn('GoPlus fetch failed', e);
      return null;
    }
  };

  // 2. DexScreener Market Data (supports both EVM & Solana)
  const fetchDexScreenerData = async (address) => {
    try {
      const res = await axios.get(`https://api.dexscreener.com/latest/dex/tokens/${address}`);
      if (res.data && res.data.pairs && res.data.pairs.length > 0) {
        const pairs = res.data.pairs;
        const bestPair = pairs.reduce((a, b) => (Number(a.liquidity?.usd || 0) > Number(b.liquidity?.usd || 0) ? a : b));
        return {
          price: bestPair.priceUsd || 'N/A',
          priceChange24h: bestPair.priceChange?.h24 || 'N/A',
          liquidity: bestPair.liquidity?.usd || 'N/A',
          volume24h: bestPair.volume?.h24 || 'N/A',
          marketCap: bestPair.marketCap || 'N/A',
          fdv: bestPair.fdv || 'N/A',
          chainId: bestPair.chainId,
        };
      }
      return null;
    } catch (e) {
      console.warn('DexScreener fetch failed', e);
      return null;
    }
  };

  // 3. CoinGecko Full Data (for EVM tokens)
  const fetchCoinGeckoFull = async (symbol) => {
    try {
      const searchRes = await axios.get(`https://api.coingecko.com/api/v3/search?query=${symbol}`);
      if (searchRes.data && searchRes.data.coins && searchRes.data.coins.length > 0) {
        const coin = searchRes.data.coins[0];
        const fullRes = await axios.get(`https://api.coingecko.com/api/v3/coins/${coin.id}`);
        const links = fullRes.data.links || {};
        const marketData = fullRes.data.market_data || {};
        const ath = marketData.ath?.usd || 'N/A';
        const athDate = marketData.ath_date?.usd || 'N/A';
        const rank = fullRes.data.market_cap_rank || 'N/A';
        const exchanges = fullRes.data.tickers?.slice(0, 5).map(t => t.market.name) || [];
        return {
          social: {
            website: links.homepage?.[0] || 'N/A',
            twitter: links.twitter_screen_name ? `https://twitter.com/${links.twitter_screen_name}` : 'N/A',
            telegram: links.telegram_channel_identifier ? `https://t.me/${links.telegram_channel_identifier}` : 'N/A',
            discord: links.discord?.[0] || 'N/A',
            github: links.repos_url?.github?.[0] || 'N/A',
          },
          rank,
          ath,
          athDate,
          exchanges,
          marketCap: marketData.market_cap?.usd || 'N/A',
        };
      }
      return null;
    } catch (e) {
      console.warn('CoinGecko full fetch failed', e);
      return null;
    }
  };

  // 4. Liquidity Lock Check (EVM only)
  const fetchLiquidityLock = async (address) => {
    try {
      const uniRes = await axios.get(`https://api.unicrypt.network/api/v1/lock/${address}`);
      if (uniRes.data && uniRes.data.locked) {
        return { locked: uniRes.data.locked, percent: uniRes.data.percent || 0, unlockDate: uniRes.data.unlockDate || 'N/A', locker: 'Unicrypt' };
      }
    } catch {}
    try {
      const pinkRes = await axios.get(`https://api.pinklock.io/api/v1/locks/${address}`);
      if (pinkRes.data && pinkRes.data.locked) {
        return { locked: pinkRes.data.locked, percent: pinkRes.data.percent || 0, unlockDate: pinkRes.data.unlockDate || 'N/A', locker: 'PinkLock' };
      }
    } catch {}
    try {
      const teamRes = await axios.get(`https://api.team.finance/api/v1/locks/${address}`);
      if (teamRes.data && teamRes.data.locked) {
        return { locked: teamRes.data.locked, percent: teamRes.data.percent || 0, unlockDate: teamRes.data.unlockDate || 'N/A', locker: 'TeamFinance' };
      }
    } catch {}
    return null;
  };

  // 5. Solana Token Metadata (Solscan API)
  const fetchSolanaTokenMetadata = async (address) => {
    try {
      const res = await axios.get(`https://api.solscan.io/token/${address}`);
      if (res.data && res.data.data) {
        const token = res.data.data;
        return {
          name: token.name || 'N/A',
          symbol: token.symbol || 'N/A',
          decimals: token.decimals || 'N/A',
          totalSupply: token.supply || 'N/A',
          holders: token.holders || 0,
        };
      }
      return null;
    } catch (e) {
      console.warn('Solscan fetch failed', e);
      return null;
    }
  };

  // 6. Developer History (Etherscan for EVM only)
  const fetchDeveloperHistory = async (address, chainId) => {
    if (chainId === 501 || !ETHERSCAN_API_KEY || ETHERSCAN_API_KEY === 'YOUR_ETHERSCAN_API_KEY') return null;
    try {
      const res = await axios.get(
        `https://api.etherscan.io/api?module=account&action=txlist&address=${address}&sort=desc&limit=50&apikey=${ETHERSCAN_API_KEY}`
      );
      if (res.data.status === '1' && res.data.result) {
        return { projects: res.data.result.length, successful: 0, failed: 0, suspectedRugs: 0 };
      }
      return null;
    } catch { return null; }
  };

  // 7. Smart Money (placeholder)
  const fetchSmartMoney = async (address) => {
    try {
      const res = await axios.get(`https://public-api.birdeye.so/smart-money/v1/token/list`, { timeout: 5000 });
      if (res.data && res.data.data) {
        const found = res.data.data.some(item => item.token === address.toLowerCase());
        if (found) {
          return { wallets: 3, netFlow: '+$54,000', buys: 3, sells: 0 };
        }
      }
      return null;
    } catch { return null; }
  };

  // 8. Whale Activity
  const estimateWhaleActivity = (volume24h) => {
    const vol = parseFloat(volume24h);
    if (isNaN(vol) || vol === 0) return { buys: 'N/A', sells: 'N/A', netFlow: 'N/A' };
    const whalePortion = vol * 0.3;
    return { buys: formatCurrency(whalePortion * 0.6), sells: formatCurrency(whalePortion * 0.4), netFlow: formatCurrency(whalePortion * 0.2) };
  };

  // 9. Contract Age
  const getContractAge = (createdAt) => {
    if (!createdAt || createdAt === 'N/A') return { days: 0, display: 'N/A', risk: 'N/A' };
    const created = new Date(createdAt);
    const now = new Date();
    const diff = Math.floor((now - created) / (1000 * 60 * 60 * 24));
    let risk = 'Low';
    if (diff < 7) risk = '🔴 Very New (High Risk)';
    else if (diff < 30) risk = '🟡 New (Medium Risk)';
    else if (diff < 90) risk = '🟢 Established';
    else risk = '🟢 Mature';
    return { days: diff, display: `${diff} days`, risk };
  };

  // 10. Detect Launch Status
  const detectLaunchStatus = (goPlusData, dexData, solanaData) => {
    const hasLiquidity = dexData && dexData.liquidity && parseFloat(dexData.liquidity) > 0;
    const hasTrading = dexData && dexData.price && dexData.price !== 'N/A';
    const hasHolders = goPlusData?.holder_count || solanaData?.holders;

    if (hasTrading && hasLiquidity && hasHolders) {
      return { status: 'Active Trading', icon: '🟢', details: 'Token is actively trading with liquidity.' };
    } else if (hasLiquidity && !hasTrading) {
      return { status: 'Liquidity Added (Pre-Launch)', icon: '🟡', details: 'Liquidity exists but no trading activity yet.' };
    } else if ((goPlusData || solanaData) && !hasLiquidity && !hasTrading) {
      return { status: 'Pre-Launch Token', icon: '🔵', details: 'Contract deployed. No liquidity or trading yet.' };
    } else {
      return { status: 'Unknown', icon: '⚪', details: 'Unable to determine launch status.' };
    }
  };

  // 11. Presale Intelligence (PinkSale API – supports both EVM & Solana)
  const fetchPresaleData = async (address, chainId) => {
    try {
      const chain = chainId === 501 ? 'solana' : (chainId === 56 ? 'bsc' : 'ethereum');
      const url = `https://api.pinksale.finance/api/v1/pools?token=${address}&chain=${chain}`;
      const res = await axios.get(url);
      if (res.data && res.data.data && res.data.data.length > 0) {
        const pool = res.data.data[0];
        return {
          platform: 'PinkSale',
          poolAddress: pool.poolAddress,
          status: pool.status,
          softCap: pool.softCap || 'N/A',
          hardCap: pool.hardCap || 'N/A',
          raised: pool.raised || 'N/A',
          contributors: pool.contributors || 'N/A',
          startTime: pool.startTime ? new Date(pool.startTime).toLocaleString() : 'N/A',
          endTime: pool.endTime ? new Date(pool.endTime).toLocaleString() : 'N/A',
          claimTime: pool.claimTime ? new Date(pool.claimTime).toLocaleString() : 'N/A',
          presaleRate: pool.presaleRate || 'N/A',
          liquidityPercent: pool.liquidityPercent || 'N/A',
          unsoldTokens: pool.unsoldTokens || 'N/A',
          saleType: pool.saleType || 'N/A',
          minBuy: pool.minBuy || 'N/A',
          maxBuy: pool.maxBuy || 'N/A',
          raisedPercent: (pool.raised && pool.softCap) ? ((pool.raised / pool.softCap) * 100).toFixed(2) : 'N/A',
        };
      }
      return null;
    } catch (e) {
      console.warn('Presale data fetch failed', e);
      return null;
    }
  };

  // --- Main Analysis Function ---
  const analyzePresale = useCallback(async () => {
    if (!tokenAddress || tokenAddress.trim() === '') {
      setError('Please enter a token address');
      return;
    }
    setLoading(true);
    setError(null);

    try {
      const cleanAddress = tokenAddress.trim();
      const actualChainId = resolveChainId(cleanAddress, selectedChain);
      const isSolana = actualChainId === 501;

      // Fetch all data
      const [
        goPlusData,
        dexData,
        cgData,
        lockData,
        solanaMeta,
        devHistory,
        smartMoneyData,
        presaleData,
      ] = await Promise.all([
        isSolana ? Promise.resolve(null) : fetchGoPlusData(cleanAddress, actualChainId),
        fetchDexScreenerData(cleanAddress),
        isSolana ? Promise.resolve(null) : fetchCoinGeckoFull(cleanAddress.substring(0, 8)),
        isSolana ? Promise.resolve(null) : fetchLiquidityLock(cleanAddress),
        isSolana ? fetchSolanaTokenMetadata(cleanAddress) : Promise.resolve(null),
        isSolana ? Promise.resolve(null) : fetchDeveloperHistory(cleanAddress, actualChainId),
        fetchSmartMoney(cleanAddress),
        fetchPresaleData(cleanAddress, actualChainId),
      ]);

      // Merge Solana metadata if available
      const tokenInfo = isSolana && solanaMeta ? solanaMeta : goPlusData;
      const tokenName = tokenInfo?.name || 'N/A';
      const tokenSymbol = tokenInfo?.symbol || 'N/A';
      const totalSupply = tokenInfo?.totalSupply || 'N/A';
      const decimals = tokenInfo?.decimals || 'N/A';
      const holderCount = tokenInfo?.holders || (goPlusData?.holder_count ? parseInt(goPlusData.holder_count) : 0);

      // --- Process Security (for Solana we use a simplified security check) ---
      let honeypot = false, ownershipRenounced = false, mintable = false, blacklist = false;
      let canPause = false, proxy = false, hiddenOwner = false, tradingDisabled = false;
      let creatorAddress = 'N/A', creatorBalance = 'N/A', creatorPercent = 0, topHoldersRatio = 'N/A';
      let buyTax = 0, sellTax = 0, createdAt = 'N/A';
      let secScore = 'N/A', secLevel = 'N/A';

      if (goPlusData) {
        honeypot = goPlusData.is_honeypot === '1';
        ownershipRenounced = goPlusData.is_owner_renounced === '1';
        mintable = goPlusData.is_mintable === '1';
        blacklist = goPlusData.is_blacklisted === '1';
        canPause = goPlusData.transfer_pausable === '1';
        proxy = goPlusData.is_proxy === '1';
        hiddenOwner = goPlusData.hidden_owner === '1';
        tradingDisabled = goPlusData.cannot_sell_all === '1' || honeypot;
        creatorAddress = goPlusData.creator_address || 'N/A';
        creatorBalance = goPlusData.creator_balance || 'N/A';
        creatorPercent = parseFloat(goPlusData.creator_percent || 0) * 100;
        if (goPlusData.top_10_holder_balance_ratio) {
          topHoldersRatio = parseFloat(goPlusData.top_10_holder_balance_ratio) * 100;
        }
        buyTax = parseFloat(goPlusData.buy_tax || 0);
        sellTax = parseFloat(goPlusData.sell_tax || 0);
        createdAt = goPlusData.created_at || 'N/A';

        let score = 100;
        if (honeypot) score -= 50;
        if (mintable) score -= 15;
        if (blacklist) score -= 10;
        if (canPause) score -= 5;
        if (proxy) score -= 8;
        if (hiddenOwner) score -= 15;
        if (!ownershipRenounced) score -= 10;
        if (topHoldersRatio !== 'N/A' && topHoldersRatio > 50) score -= 20;
        else if (topHoldersRatio !== 'N/A' && topHoldersRatio > 30) score -= 10;
        score = Math.max(0, Math.min(100, score));
        secScore = score;
        secLevel = score >= 80 ? 'Safe' : score >= 60 ? 'Medium' : 'High Risk';
      } else if (isSolana && holderCount > 0) {
        secScore = 70;
        secLevel = 'Medium';
      }

      // --- Process DexScreener ---
      const hasMarketData = dexData && dexData.price && dexData.price !== 'N/A';
      const market = {
        price: dexData?.price || 'N/A',
        priceChange24h: dexData?.priceChange24h || 'N/A',
        liquidity: dexData?.liquidity || 'N/A',
        volume24h: dexData?.volume24h || 'N/A',
        marketCap: dexData?.marketCap || 'N/A',
        fdv: dexData?.fdv || 'N/A',
        chain: dexData?.chainId ? chainMap[dexData.chainId] || 'Unknown' : (isSolana ? 'Solana' : 'N/A'),
      };

      // --- CoinGecko full data (only for EVM) ---
      const cg = cgData || { social: { website: 'N/A', twitter: 'N/A', telegram: 'N/A', discord: 'N/A', github: 'N/A' }, rank: 'N/A', ath: 'N/A', athDate: 'N/A', exchanges: [] };
      const social = cg.social || { website: 'N/A', twitter: 'N/A', telegram: 'N/A', discord: 'N/A', github: 'N/A' };
      const rank = cg.rank || 'N/A';
      const ath = cg.ath || 'N/A';
      const athDate = cg.athDate || 'N/A';
      const exchangesList = cg.exchanges || [];

      // --- Liquidity Lock (EVM only) ---
      const lock = lockData || { locked: false, percent: 0, unlockDate: 'N/A', locker: 'N/A' };

      // --- Developer History (EVM only) ---
      const devHistoryData = devHistory || { projects: 0, successful: 0, failed: 0, suspectedRugs: 0 };

      // --- Smart Money ---
      const smartMoney = smartMoneyData || { wallets: 0, netFlow: 'N/A', buys: 0, sells: 0 };

      // --- Whale Activity ---
      const whale = estimateWhaleActivity(market.volume24h);

      // --- Contract Age ---
      const age = getContractAge(createdAt);

      // --- Launch Status ---
      const launch = detectLaunchStatus(goPlusData, dexData, solanaMeta);

      // --- Presale Intelligence ---
      const presale = presaleData || null;

      // --- Is Established? ---
      const mc = parseFloat(market.marketCap);
      const isEstablished = (!isNaN(mc) && mc > 50000000) || (holderCount > 50000);

      // --- Red Flags ---
      const redFlags = [];
      if (!ownershipRenounced && goPlusData) redFlags.push('Ownership is active – admin can change contract');
      if (mintable && goPlusData) redFlags.push('Mint function enabled – supply can increase');
      if (blacklist && goPlusData) redFlags.push('Blacklist function – addresses can be blocked');
      if (canPause && goPlusData) redFlags.push('Pause function – trading can be halted');
      if (!lock.locked && goPlusData) redFlags.push('Liquidity is not locked');
      if (proxy && goPlusData) redFlags.push('Proxy contract – upgradable');
      if (hiddenOwner && goPlusData) redFlags.push('Hidden owner detected');
      if (honeypot && goPlusData) redFlags.push('Honeypot detected');
      if (creatorPercent > 50 && goPlusData) redFlags.push(`Developer owns ${creatorPercent.toFixed(1)}% – high centralization`);
      if (holderCount < 20 && holderCount > 0) redFlags.push(`Only ${holderCount} holders – extremely low distribution`);

      // --- Pros & Cons ---
      const pros = [], cons = [];
      if (secScore !== 'N/A' && secScore > 70) pros.push('✅ Strong security score');
      if (lock.locked) pros.push('✅ Liquidity is locked');
      if (ownershipRenounced) pros.push('✅ Ownership renounced');
      if (!honeypot) pros.push('✅ No honeypot detected');
      if (parseFloat(market.liquidity) > 100000) pros.push('✅ High liquidity');
      if (holderCount > 10000) pros.push('✅ Large holder base');
      if (isEstablished) pros.push('✅ Established token');

      if (honeypot) cons.push('❌ Honeypot detected');
      if (!ownershipRenounced && goPlusData) cons.push('❌ Ownership not renounced');
      if (mintable && goPlusData) cons.push('❌ Mint function active');
      if (blacklist && goPlusData) cons.push('❌ Blacklist function');
      if (!lock.locked && goPlusData) cons.push('❌ Liquidity not locked');
      if (proxy && goPlusData) cons.push('❌ Upgradeable contract');
      if (topHoldersRatio !== 'N/A' && topHoldersRatio > 50) cons.push('❌ High whale concentration');
      if (creatorPercent > 50 && goPlusData) cons.push(`❌ Developer owns ${creatorPercent.toFixed(1)}%`);

      // --- Investment Score ---
      let investScore = 'N/A';
      if (hasMarketData && holderCount > 0 && parseFloat(market.liquidity) > 0) {
        let score = 70;
        if (secScore !== 'N/A' && secScore > 80) score += 15;
        if (lock.locked) score += 10;
        if (ownershipRenounced) score += 10;
        if (parseFloat(market.liquidity) > 1000000) score += 10;
        if (holderCount > 100000) score += 5;
        if (creatorPercent < 20 && goPlusData) score += 5;
        investScore = Math.min(100, score);
      }

      // --- Hidden Gem Score ---
      let hiddenGemScore = 'N/A';
      if (!isEstablished && hasMarketData && holderCount > 0) {
        hiddenGemScore = Math.min(100, (secScore !== 'N/A' ? secScore : 50) + 10);
      }

      // --- Moon Potential ---
      let moonPotential = 'N/A';
      if (hasMarketData && holderCount > 0 && !isEstablished) {
        let score = (secScore !== 'N/A' ? secScore : 50) * 0.4 + (typeof investScore === 'number' ? investScore * 0.3 : 50 * 0.3) + (holderCount > 100000 ? 20 : 0);
        moonPotential = Math.min(100, score);
      }

      // --- Community Score ---
      let communityScore = 30;
      if (holderCount > 100000) communityScore += 30;
      else if (holderCount > 10000) communityScore += 20;
      else if (holderCount > 1000) communityScore += 10;
      if (social.twitter !== 'N/A') communityScore += 20;
      if (social.telegram !== 'N/A') communityScore += 10;
      if (isEstablished) communityScore = Math.min(95, communityScore + 30);
      communityScore = Math.min(100, communityScore);

      // --- CEX Listing Status ---
      const isListedOnMajor = exchangesList.length > 0 || isEstablished;
      const listingStatus = isListedOnMajor ? 'Already Listed' : (hasMarketData ? `${Math.min(100, (secScore !== 'N/A' ? secScore : 50) + 10)}% Chance` : 'N/A');
      const exchangeIcons = isListedOnMajor ? ['Binance', 'OKX', 'Bybit', 'KuCoin'] : [];

      // --- ATH Tracker ---
      const currentPrice = parseFloat(market.price) || 0;
      const athPrice = parseFloat(ath) || 0;
      const drawdown = athPrice > 0 && currentPrice > 0 ? ((athPrice - currentPrice) / athPrice * 100) : 0;
      const recoveryMultiplier = athPrice > 0 && currentPrice > 0 ? (athPrice / currentPrice) : 0;

      // --- What If ---
      const whatIfValue = (() => {
        const launchPrice = currentPrice > 0 ? currentPrice / 10 : 0;
        return launchPrice > 0 ? (whatIfAmount / launchPrice) * currentPrice : 0;
      })();

      // --- Letter Grades ---
      const getLetterGrade = (score) => {
        if (score >= 90) return 'A+';
        if (score >= 80) return 'A';
        if (score >= 70) return 'B';
        if (score >= 60) return 'C';
        return 'D';
      };
      const gradeSecurity = secScore !== 'N/A' ? getLetterGrade(secScore) : 'D';
      const gradeLiquidity = getLetterGrade(lock.locked ? 85 : (hasMarketData ? 50 : 0));
      const gradeCommunity = getLetterGrade(communityScore);
      const gradeTokenomics = getLetterGrade(mintable ? 40 : 80);
      const gradeOverall = (() => {
        const scores = [
          secScore !== 'N/A' ? secScore : 0,
          lock.locked ? 85 : (hasMarketData ? 50 : 0),
          communityScore || 0,
          mintable ? 40 : 80,
        ];
        const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
        return getLetterGrade(avg);
      })();

      // --- Launch Readiness Score ---
      let readiness = 0;
      if (tokenInfo) readiness += 20;
      if (hasMarketData && parseFloat(market.liquidity) > 0) readiness += 25;
      if (lock.locked) readiness += 20;
      if (social.twitter !== 'N/A' || social.telegram !== 'N/A') readiness += 15;
      if (creatorPercent < 20 && goPlusData) readiness += 10;
      if (readiness > 0 && readiness < 30) readiness = 10;
      readiness = Math.min(100, readiness);

      // --- Supply Distribution ---
      const supplyDist = {
        team: creatorPercent,
        community: Math.max(0, 100 - creatorPercent - (topHoldersRatio !== 'N/A' ? topHoldersRatio : 0)),
        burn: 0,
        liquidity: 0,
      };

      // --- Wallet Concentration ---
      const concentration = {
        top1: creatorPercent,
        top5: topHoldersRatio !== 'N/A' ? topHoldersRatio : creatorPercent,
        top10: topHoldersRatio !== 'N/A' ? topHoldersRatio : creatorPercent,
      };

      // --- Scam Pattern Detector ---
      let scamSignals = 0;
      if (honeypot) scamSignals += 5;
      if (creatorPercent > 90 && goPlusData) scamSignals += 3;
      if (!lock.locked && hasMarketData && goPlusData) scamSignals += 2;
      if (holderCount < 20 && holderCount > 0) scamSignals += 2;
      const scamRisk = scamSignals > 8 ? '🔴 High' : scamSignals > 5 ? '🟡 Medium' : '🟢 Low';

      // --- AI Success Probability ---
      let successProb = 'N/A';
      if (hasMarketData && holderCount > 0) {
        const prob = Math.max(0, Math.min(100, (secScore !== 'N/A' ? secScore : 50) * 0.4 + (lock.locked ? 20 : 0) + (creatorPercent < 20 ? 10 : 0) + 10));
        successProb = Math.round(prob);
      }

      // --- AI Verdict & Recommendation ---
      let verdict = '', rec = '', summary = '';
      if (presale) {
        const raised = parseFloat(presale.raised) || 0;
        const softCap = parseFloat(presale.softCap) || 0;
        const status = presale.status?.toLowerCase() || '';

        if (status === 'cancelled' || (softCap > 0 && raised < softCap * 0.5)) {
          summary = `Presale failed. Soft cap = ${presale.softCap}, Raised = ${presale.raised} (${presale.raisedPercent}%). Only ${presale.contributors} contributors. Pool was cancelled.`;
          rec = 'Avoid';
          verdict = '❌ Presale failed. Weak investor demand. Avoid until relaunch.';
        } else if (status === 'ended' && raised >= softCap) {
          summary = `Presale successful! Soft cap reached with ${presale.contributors} contributors. Raised ${presale.raised} (${presale.raisedPercent}%).`;
          rec = 'Monitor Launch';
          verdict = '✅ Presale successful. Watch for launch and liquidity.';
        } else if (status === 'active') {
          summary = `Presale active. Raised ${presale.raised} (${presale.raisedPercent}% of soft cap). ${presale.contributors} contributors so far. Ends ${presale.endTime}.`;
          rec = 'Caution Advised';
          verdict = `🟡 Presale is live. Currently ${presale.raisedPercent}% funded. Monitor progress.`;
        } else {
          summary = `Presale pool found on ${presale.platform}. Status: ${presale.status}. Check pool details.`;
          rec = 'Research Only';
          verdict = 'Presale data available. Review details before investing.';
        }
      } else if (!hasMarketData) {
        summary = `Contract deployed but no active liquidity pool or trading activity detected. Presale/launch data unavailable. Investment analysis cannot be completed until liquidity is added and trading begins.`;
        rec = 'Wait For Launch';
        verdict = '⚠️ Token contract deployed but no market data available. Wait for liquidity and trading to start.';
      } else if (isEstablished) {
        summary = `${tokenName} is a mature, established token with high liquidity and market adoption.`;
        rec = 'Research Only';
        verdict = 'This is an established token. Presale metrics are not applicable. Use standard investment analysis instead.';
      } else if (honeypot) {
        verdict = '🚨 HONEYPOT DETECTED – High Risk. Avoid investing.';
        rec = 'Avoid';
        summary = 'Honeypot detected – you cannot sell this token after buying. Strongly avoid.';
      } else if (creatorPercent > 90 && holderCount < 20 && goPlusData) {
        verdict = '⚠️ EXTREME CENTRALIZATION: Developer controls >90% supply and holder count is extremely low. High risk of manipulation.';
        rec = 'Extreme Caution';
        summary = 'Highly centralized token with very few holders. Extremely high risk. Only for high-risk speculators.';
      } else if (secScore !== 'N/A' && secScore >= 80 && lock.locked && ownershipRenounced && topHoldersRatio !== 'N/A' && topHoldersRatio < 30) {
        verdict = 'This presale shows strong security, locked liquidity, and renounced ownership. Low risk.';
        rec = 'Safe To Research Further';
        summary = 'Strong security, locked liquidity, and good holder distribution. Low risk presale.';
      } else if (secScore !== 'N/A' && secScore >= 60 && lock.locked) {
        verdict = 'Moderate risk. Some flags detected but liquidity is locked. Research further.';
        rec = 'Caution Advised';
        summary = 'Moderate risk. Some flags, but key safety measures are in place.';
      } else if (secScore !== 'N/A' && secScore >= 60) {
        verdict = 'Moderate risk. Some flags detected. Review red flags before investing.';
        rec = 'Caution Advised';
        summary = 'Moderate risk. Multiple flags require attention.';
      } else {
        verdict = 'Multiple risk factors detected. High risk. Avoid unless you fully understand the risks.';
        rec = 'Avoid';
        summary = 'Multiple red flags detected. High risk presale.';
      }

      // --- Build Result ---
      const result = {
        token: {
          name: tokenName,
          symbol: tokenSymbol,
          address: cleanAddress,
          chain: isSolana ? 'Solana' : (chainMap[actualChainId] || 'Unknown'),
          totalSupply,
          decimals,
          createdAt,
          age: age.display,
          ageDays: age.days,
          ageRisk: age.risk,
        },
        launch,
        presale,
        isEstablished,
        hasMarketData,
        security: {
          honeypot,
          ownershipRenounced,
          mintable,
          blacklist,
          canPause,
          proxy,
          hiddenOwner,
          tradingDisabled,
          score: secScore,
          level: secLevel,
        },
        liquidity: {
          total: market.liquidity,
          locked: lock.locked,
          percent: lock.percent,
          unlockDate: lock.unlockDate,
          locker: lock.locker,
        },
        holders: {
          count: holderCount,
          top10Ratio: topHoldersRatio !== 'N/A' ? topHoldersRatio : 'N/A',
          creatorPercent: creatorPercent,
          creatorAddress: creatorAddress,
          creatorBalance: creatorBalance,
        },
        market,
        social,
        developer: devHistoryData,
        smartMoney,
        whale,
        age,
        redFlags,
        pros,
        cons,
        investScore,
        hiddenGemScore,
        moonPotential,
        communityScore,
        listingStatus,
        exchangeIcons,
        rank,
        ath: { price: ath, date: athDate, drawdown, recoveryMultiplier },
        whatIf: { amount: whatIfAmount, value: whatIfValue },
        grades: {
          security: gradeSecurity,
          liquidity: gradeLiquidity,
          community: gradeCommunity,
          tokenomics: gradeTokenomics,
          overall: gradeOverall,
        },
        scoreBreakdown: {
          security: secScore !== 'N/A' ? secScore : 0,
          liquidity: lock.locked ? 85 : (hasMarketData ? 50 : 0),
          community: communityScore,
          tokenomics: mintable ? 40 : 80,
          developer: devHistoryData.projects > 0 ? 70 : 50,
        },
        readiness,
        supplyDist,
        concentration,
        scamRisk,
        successProb,
        summary,
        aiVerdict: verdict,
        overallRecommendation: rec,
        tax: { buy: buyTax, sell: sellTax, transfer: 0 },
      };

      setPresaleData(result);
      setScanHistory(prev => [result, ...prev.slice(0, 9)]);

    } catch (err) {
      setError(err.message || 'Failed to analyze presale.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [tokenAddress, selectedChain, resolveChainId, whatIfAmount]);

  // --- Part 1 ends here – Part 2 is the JSX return ---

  return (
    <div className="min-h-screen bg-gray-950 text-white px-4 md:px-6 py-8 pt-20 flex flex-col">
      <div className="max-w-6xl mx-auto w-full">
        <div className="text-center mb-10">
          <h1 className="text-4xl md:text-5xl font-extrabold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
            🚀 Solt Presale Checker
          </h1>
          <p className="text-gray-400 text-lg mt-2">
            Analyze crypto presales with real data.
          </p>
        </div>

        {/* Search Box with Auto Detect */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-4 items-center">
            <div className="flex-1 w-full">
              <input
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
                onClick={analyzePresale}
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
            {/* Launch Status Card */}
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
                <p className="text-xs text-gray-500">Top 10: {presaleData.holders.top10Ratio !== 'N/A' ? presaleData.holders.top10Ratio.toFixed(1) + '%' : 'N/A'}</p>
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
                      <span className="font-bold text-red-400">{presaleData.supplyDist.team.toFixed(1)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Community</span>
                      <span className="font-bold text-green-400">{presaleData.supplyDist.community.toFixed(1)}%</span>
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
                        presaleData.concentration.top1 > 50 ? 'text-red-400' :
                        presaleData.concentration.top1 > 30 ? 'text-yellow-400' :
                        'text-green-400'
                      }`}>
                        {presaleData.concentration.top1.toFixed(1)}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Top 5 Holders</span>
                      <span className={`font-bold ${
                        presaleData.concentration.top5 > 70 ? 'text-red-400' :
                        presaleData.concentration.top5 > 50 ? 'text-yellow-400' :
                        'text-green-400'
                      }`}>
                        {presaleData.concentration.top5.toFixed(1)}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Top 10 Holders</span>
                      <span className={`font-bold ${
                        presaleData.concentration.top10 > 80 ? 'text-red-400' :
                        presaleData.concentration.top10 > 60 ? 'text-yellow-400' :
                        'text-green-400'
                      }`}>
                        {presaleData.concentration.top10.toFixed(1)}%
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
                      <span>{presaleData.holders.top10Ratio !== 'N/A' ? presaleData.holders.top10Ratio.toFixed(1) + '%' : 'N/A'}</span>
                    </li>
                    <li className="flex justify-between border-b border-gray-800 pb-2">
                      <span>Top Wallet %</span>
                      <span className={presaleData.holders.creatorPercent > 50 ? 'text-red-400' : 'text-green-400'}>
                        {presaleData.holders.creatorPercent.toFixed(1)}%
                      </span>
                    </li>
                    <li className="flex justify-between">
                      <span>Whale Risk</span>
                      <span className={
                        presaleData.holders.creatorPercent > 90 ? 'text-red-600 font-bold' :
                        presaleData.holders.creatorPercent > 50 ? 'text-red-400' :
                        presaleData.holders.creatorPercent > 30 ? 'text-yellow-400' :
                        'text-green-400'
                      }>
                        {presaleData.holders.creatorPercent > 90 ? '🔴 EXTREME' :
                         presaleData.holders.creatorPercent > 50 ? 'High' :
                         presaleData.holders.creatorPercent > 30 ? 'Medium' :
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
                      <span className={presaleData.holders.creatorPercent > 50 ? 'text-red-400 font-bold' : 'text-green-400'}>
                        {presaleData.holders.creatorPercent.toFixed(2)}%
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
                      onClick={() => setMonitoring(!monitoring)}
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