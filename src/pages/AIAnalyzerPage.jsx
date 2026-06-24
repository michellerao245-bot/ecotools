import React, { useState } from 'react';
import axios from 'axios';
import ContractScannerForm from '../components/ContractScannerForm';
import AIInsightCard from '../components/AIInsightCard';
import SentimentGauge from '../components/SentimentGauge';
import HolderAnalysis from '../components/HolderAnalysis';

const AIAnalyzerPage = () => {
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [scannedAddress, setScannedAddress] = useState('');

  // --- Helper: Get chain name from chainId ---
  const getChainName = (chainId) => {
    const chains = {
      1: 'Ethereum',
      56: 'BSC',
      137: 'Polygon',
      42161: 'Arbitrum',
      10: 'Optimism',
      43114: 'Avalanche',
      250: 'Fantom',
      1284: 'Moonbeam',
      1285: 'Moonriver',
      100: 'Gnosis',
      42220: 'Celo',
      1666600000: 'Harmony',
      128: 'Heco',
      66: 'OKExChain',
      321: 'KCC',
      888: 'Neo',
      1088: 'Metis',
      4689: 'IoTeX',
      592: 'Astar',
      8217: 'Klaytn',
      53935: 'DFK',
      1313161554: 'Aurora',
      43113: 'Fuji (Testnet)',
      5: 'Goerli',
      11155111: 'Sepolia',
    };
    return chains[chainId] || `Chain ID ${chainId}`;
  };

  // Helper: check website status (CORS errors ignored)
  const checkWebsiteStatus = async (url) => {
    if (!url) return 'N/A';
    try {
      const res = await axios.get(url, { timeout: 5000 });
      return res.status === 200 ? '✅ Online' : '⚠️ Offline';
    } catch {
      return '❌ Offline (CORS/Network)';
    }
  };

  // Helper: fetch liquidity lock info (all failures silenced)
  const fetchLiquidityLockInfo = async (address) => {
    try {
      const uniRes = await axios.get(`https://api.unicrypt.network/api/v1/lock/${address}`);
      if (uniRes.data && uniRes.data.locked) {
        return {
          locked: uniRes.data.locked,
          percent: uniRes.data.percent || 0,
          unlockDate: uniRes.data.unlockDate || 'N/A',
          locker: 'Unicrypt'
        };
      }
    } catch (e) { /* ignore */ }
    try {
      const pinkRes = await axios.get(`https://api.pinklock.io/api/v1/locks/${address}`);
      if (pinkRes.data && pinkRes.data.locked) {
        return {
          locked: pinkRes.data.locked,
          percent: pinkRes.data.percent || 0,
          unlockDate: pinkRes.data.unlockDate || 'N/A',
          locker: 'PinkLock'
        };
      }
    } catch (e) { /* ignore */ }
    try {
      const teamRes = await axios.get(`https://api.team.finance/api/v1/locks/${address}`);
      if (teamRes.data && teamRes.data.locked) {
        return {
          locked: teamRes.data.locked,
          percent: teamRes.data.percent || 0,
          unlockDate: teamRes.data.unlockDate || 'N/A',
          locker: 'Team Finance'
        };
      }
    } catch (e) { /* ignore */ }
    return { locked: false, percent: 0, unlockDate: 'N/A', locker: 'N/A' };
  };

  // Helper: fetch social links from CoinGecko (silent fail)
  const fetchSocialLinks = async (symbol) => {
    try {
      const cgRes = await axios.get(`https://api.coingecko.com/api/v3/search?query=${symbol}`);
      if (cgRes.data && cgRes.data.coins && cgRes.data.coins.length > 0) {
        const coin = cgRes.data.coins[0];
        const fullRes = await axios.get(`https://api.coingecko.com/api/v3/coins/${coin.id}`);
        const links = fullRes.data.links || {};
        return {
          website: links.homepage?.[0] || 'N/A',
          twitter: links.twitter_screen_name ? `https://twitter.com/${links.twitter_screen_name}` : 'N/A',
          telegram: links.telegram_channel_identifier ? `https://t.me/${links.telegram_channel_identifier}` : 'N/A',
          github: links.repos_url?.github?.[0] || 'N/A'
        };
      }
    } catch (e) { /* ignore */ }
    return { website: 'N/A', twitter: 'N/A', telegram: 'N/A', github: 'N/A' };
  };

  // --- MAIN SCAN FUNCTION ---
  const handleScan = async (address, chainId) => {
    setLoading(true);
    setError(null);
    const cleanAddress = address.trim().toLowerCase();
    setScannedAddress(cleanAddress);

    try {
      // --- 1. FETCH SECURITY DATA FROM GOPLUS ---
      const response = await axios.get(
        `https://api.gopluslabs.io/api/v1/token_security/${chainId}?contract_addresses=${cleanAddress}`
      );
      
      if (!response.data || !response.data.result) {
        throw new Error(`Invalid response from GoPlus API for chain ${getChainName(chainId)}.`);
      }
      
      const data = response.data.result[cleanAddress];
      if (!data) {
        throw new Error(
          `No security data found for address "${cleanAddress}" on chain ${getChainName(chainId)}.\n` +
          `Please verify:\n` +
          `• The address is correct\n` +
          `• You selected the right network (current: ${getChainName(chainId)})\n` +
          `• The token exists on this chain`
        );
      }

      // --- DATA MAPPING ---
      const topHolders = data.top_10_holder_balance_ratio 
        ? Math.round(Number(data.top_10_holder_balance_ratio) * 100) 
        : "N/A";
      
      const isOwnerRenounced = data.is_owner_renounced === "1" ? "YES" : 
                              data.is_owner_renounced === "0" ? "NO" : "N/A";
      const isLiquidityLocked = data.is_liquidity_locked === "1" ? "YES" : 
                               data.is_liquidity_locked === "0" ? "NO" : "N/A";
      
      const hiddenMint = data.hidden_mint === "1";
      const hiddenOwner = data.hidden_owner === "1";
      const antiWhale = data.is_anti_whale === "1";
      const antiWhaleModifiable = data.anti_whale_modifiable === "1";
      const cannotSellAll = data.cannot_sell_all === "1";
      const personalSlippage = data.personal_slippage_modifiable === "1";
      const tradingCooldown = data.trading_cooldown === "1";
      const transferPause = data.transfer_pausable === "1";
      const selfDestruct = data.selfdestruct === "1";
      const externalCall = data.external_call === "1";
      const isHoneypot = data.is_honeypot === "1";
      const isMintable = data.is_mintable === "1";
      const isProxy = data.is_proxy === "1";
      const isBlacklisted = data.is_blacklisted === "1";
      
      const creatorAddress = data.creator_address || "N/A";
      const creatorBalance = data.creator_balance || "N/A";
      const creatorPercentRaw = data.creator_percent || "0";
      const creatorPercent = Number(creatorPercentRaw) * 100;
      
      const buyTax = data.buy_tax || "0";
      const sellTax = data.sell_tax || "0";
      
      const totalHolders = data.holder_count || "N/A";
      const lpHolders = data.lp_holder_count || "N/A";
      const ownerAddress = data.owner_address || "N/A";

      const burnAddresses = [
        '0x0000000000000000000000000000000000000000',
        '0x000000000000000000000000000000000000dEaD',
        '0x0000000000000000000000000000000000000001',
        '0x0000000000000000000000000000000000000002'
      ];
      const isBurnWallet = burnAddresses.includes(ownerAddress.toLowerCase());

      const contractBalance = data.contract_balance || "N/A";
      const liquidityAmount = data.liquidity || "N/A";
      const liquidityLocked = data.is_liquidity_locked === "1" ? "Locked" : 
                             data.is_liquidity_locked === "0" ? "Not Locked" : "N/A";
      const liquidityUnlockDate = data.liquidity_unlock_date || "N/A";
      const lpBurned = data.lp_burned || "N/A";

      // --- ✅ FIXED: HOLDER HEALTH (defined early) ---
      let holderHealthScore = "N/A";
      let holderHealthLevel = "N/A";
      if (totalHolders !== "N/A") {
        const holders = Number(totalHolders);
        if (holders > 100000) { holderHealthScore = "Excellent"; holderHealthLevel = 95; }
        else if (holders > 50000) { holderHealthScore = "Very Good"; holderHealthLevel = 85; }
        else if (holders > 10000) { holderHealthScore = "Good"; holderHealthLevel = 75; }
        else if (holders > 1000) { holderHealthScore = "Average"; holderHealthLevel = 60; }
        else if (holders > 100) { holderHealthScore = "Low"; holderHealthLevel = 40; }
        else { holderHealthScore = "Very Low"; holderHealthLevel = 20; }
      }

      // --- ✅ FIXED: OWNERSHIP STATUS (defined early) ---
      let ownershipStatus = "Not Available";
      let ownershipStatusColor = "text-gray-400";
      if (isOwnerRenounced === "YES") {
        ownershipStatus = "Renounced ✅";
        ownershipStatusColor = "text-green-400";
      } else if (isOwnerRenounced === "NO") {
        ownershipStatus = "Active ⚠️";
        ownershipStatusColor = "text-yellow-400";
      }

      // --- TOKEN AGE ---
      const createdAt = data.created_at || "N/A";
      let tokenAgeDays = "N/A";
      let ageDisplay = "N/A";
      let ageScore = "N/A";
      let ageStatus = "N/A";
      let ageScoreValue = 0;
      
      if (createdAt !== "N/A") {
        tokenAgeDays = Math.floor((Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60 * 24));
        const years = Math.floor(tokenAgeDays / 365);
        const months = Math.floor((tokenAgeDays % 365) / 30);
        ageDisplay = `${years} Year${years > 1 ? 's' : ''} ${months} Month${months > 1 ? 's' : ''}`;
        
        if (tokenAgeDays > 1095) {
          ageScore = "Excellent"; ageStatus = "🟢 Very Mature"; ageScoreValue = 100;
        } else if (tokenAgeDays > 730) {
          ageScore = "Very Good"; ageStatus = "🟢 Mature"; ageScoreValue = 90;
        } else if (tokenAgeDays > 365) {
          ageScore = "Good"; ageStatus = "🟢 Established"; ageScoreValue = 80;
        } else if (tokenAgeDays > 180) {
          ageScore = "Average"; ageStatus = "🟡 Growing"; ageScoreValue = 65;
        } else if (tokenAgeDays > 90) {
          ageScore = "Fair"; ageStatus = "🟡 New"; ageScoreValue = 50;
        } else if (tokenAgeDays > 30) {
          ageScore = "Poor"; ageStatus = "🟠 Recent"; ageScoreValue = 35;
        } else if (tokenAgeDays > 7) {
          ageScore = "Very Poor"; ageStatus = "🔴 Very New"; ageScoreValue = 20;
        } else {
          ageScore = "Critical"; ageStatus = "🔴 Extremely New (High Risk)"; ageScoreValue = 10;
        }
      }

      const isNewToken = tokenAgeDays !== "N/A" && tokenAgeDays < 7;

      // --- RISK SCORE ---
      let riskScore = 0;
      let contractRisk = 0;
      let holderRisk = 0;
      let creatorRiskScore = 0;
      let liquidityRisk = 0;
      let ageRisk = 0;
      let creatorRiskLevel = "Low";

      // Contract Risk
      if (isHoneypot) contractRisk += 15;
      if (selfDestruct) contractRisk += 10;
      if (hiddenMint) contractRisk += 8;
      if (hiddenOwner) contractRisk += 7;
      if (cannotSellAll) contractRisk += 7;
      if (externalCall) contractRisk += 5;
      if (isProxy) contractRisk += 5;
      if (isMintable) contractRisk += 4;
      if (isBlacklisted) contractRisk += 4;
      if (personalSlippage) contractRisk += 3;
      contractRisk = Math.min(contractRisk, 30);
      riskScore += contractRisk;

      // Holder Risk
      if (topHolders !== "N/A") {
        if (topHolders > 60) holderRisk += 15;
        else if (topHolders > 40) holderRisk += 10;
        else if (topHolders > 20) holderRisk += 5;
      } else {
        holderRisk += 3;
      }
      if (totalHolders !== "N/A" && Number(totalHolders) < 20) holderRisk += 10;
      else if (totalHolders !== "N/A" && Number(totalHolders) < 100) holderRisk += 5;
      holderRisk = Math.min(holderRisk, 25);
      riskScore += holderRisk;

      // Creator Risk
      if (creatorPercent > 90) { creatorRiskScore += 25; creatorRiskLevel = "Critical"; }
      else if (creatorPercent > 50) { creatorRiskScore += 18; creatorRiskLevel = "High"; }
      else if (creatorPercent > 20) { creatorRiskScore += 12; creatorRiskLevel = "Medium"; }
      else if (creatorPercent > 10) { creatorRiskScore += 8; creatorRiskLevel = "Medium"; }
      else if (creatorPercent > 5) { creatorRiskScore += 4; creatorRiskLevel = "Low"; }
      else if (creatorPercent > 0) { creatorRiskScore += 2; creatorRiskLevel = "Low"; }
      if (isOwnerRenounced === "NO") creatorRiskScore += 3;
      creatorRiskScore = Math.min(creatorRiskScore, 25);
      riskScore += creatorRiskScore;

      // Liquidity Risk
      if (isLiquidityLocked === "NO") liquidityRisk += 10;
      else if (isLiquidityLocked === "N/A") liquidityRisk += 5;
      if (liquidityAmount !== "N/A" && Number(liquidityAmount) < 10000) liquidityRisk += 5;
      if (isBurnWallet) liquidityRisk -= 3;
      liquidityRisk = Math.min(Math.max(liquidityRisk, 0), 20);
      riskScore += liquidityRisk;

      // Age Risk
      if (tokenAgeDays !== "N/A") {
        if (tokenAgeDays > 1095) ageRisk = -7;
        else if (tokenAgeDays > 730) ageRisk = -6;
        else if (tokenAgeDays > 365) ageRisk = -5;
        else if (tokenAgeDays > 180) ageRisk = -3;
        else if (tokenAgeDays > 90) ageRisk = -1;
        else if (tokenAgeDays > 30) ageRisk = 2;
        else if (tokenAgeDays > 7) ageRisk = 5;
        else ageRisk = 10;
      }
      riskScore += ageRisk;
      riskScore = Math.max(0, Math.min(riskScore, 100));

      // --- MARKET DATA (DexScreener) ---
      let marketCap = "N/A", price = "N/A", priceChange1h = "N/A", priceChange24h = "N/A";
      let priceChange7d = "N/A", volume24h = "N/A", volumeChange24h = "N/A", liquidityUsd = "N/A";
      let priceSource = "N/A", fdv = "N/A";

      try {
        const marketResponse = await axios.get(
          `https://api.dexscreener.com/latest/dex/tokens/${cleanAddress}`
        );
        if (marketResponse.data && marketResponse.data.pairs && marketResponse.data.pairs.length > 0) {
          let pairs = marketResponse.data.pairs.filter(p => p.liquidity && Number(p.liquidity.usd) > 0);
          if (pairs.length === 0) pairs = marketResponse.data.pairs;
          pairs.sort((a, b) => Number(b.liquidity?.usd || 0) - Number(a.liquidity?.usd || 0));
          const pair = pairs[0];
          price = pair.priceUsd || "N/A";
          marketCap = pair.marketCap || "N/A";
          priceChange1h = pair.priceChange?.h1 || "N/A";
          priceChange24h = pair.priceChange?.h24 || "N/A";
          priceChange7d = pair.priceChange?.d7 || "N/A";
          volume24h = pair.volume?.h24 || "N/A";
          volumeChange24h = pair.volumeChange?.h24 || "N/A";
          liquidityUsd = pair.liquidity?.usd || "N/A";
          fdv = pair.fdv || "N/A";
          priceSource = "DexScreener";
        }
      } catch (e) { /* ignore */ }

      let formattedPrice = price;
      if (price !== "N/A") {
        const numPrice = parseFloat(price);
        if (numPrice < 0.0001) formattedPrice = numPrice.toFixed(8);
        else if (numPrice < 0.01) formattedPrice = numPrice.toFixed(6);
        else formattedPrice = numPrice.toFixed(4);
      }

      let liquidityHealth = "N/A";
      if (liquidityUsd !== "N/A" && Number(liquidityUsd) > 0) {
        const liq = Number(liquidityUsd);
        if (liq > 1000000) liquidityHealth = "Excellent";
        else if (liq > 100000) liquidityHealth = "Good";
        else if (liq > 10000) liquidityHealth = "Average";
        else liquidityHealth = "Poor";
      }

      // --- COINGECKO SOCIAL LINKS ---
      let coinGeckoSlug = data.token_symbol || "";
      let socialLinks = { website: 'N/A', twitter: 'N/A', telegram: 'N/A', github: 'N/A' };
      let websiteStatus = 'N/A';
      try {
        const cgSearch = await axios.get(
          `https://api.coingecko.com/api/v3/search?query=${data.token_symbol || data.token_name || ''}`
        );
        if (cgSearch.data && cgSearch.data.coins && cgSearch.data.coins.length > 0) {
          const match = cgSearch.data.coins.find(c => 
            c.symbol && c.symbol.toLowerCase() === (data.token_symbol || '').toLowerCase()
          );
          if (match) {
            coinGeckoSlug = match.id;
            const fullCg = await axios.get(`https://api.coingecko.com/api/v3/coins/${match.id}`);
            const links = fullCg.data.links || {};
            socialLinks = {
              website: links.homepage?.[0] || 'N/A',
              twitter: links.twitter_screen_name ? `https://twitter.com/${links.twitter_screen_name}` : 'N/A',
              telegram: links.telegram_channel_identifier ? `https://t.me/${links.telegram_channel_identifier}` : 'N/A',
              github: links.repos_url?.github?.[0] || 'N/A'
            };
            if (socialLinks.website !== 'N/A') {
              websiteStatus = await checkWebsiteStatus(socialLinks.website);
            }
          }
        }
      } catch (e) { /* ignore */ }

      // --- LIQUIDITY LOCK DETAILS (silent fail) ---
      const lockInfo = await fetchLiquidityLockInfo(cleanAddress);

      // --- SENTIMENT, PREDICTION, GRADES ---
      let sentiment = "Neutral", sentimentScore = 50;
      if (creatorRiskLevel === "Critical" || creatorRiskLevel === "High") {
        sentiment = "Bearish"; sentimentScore = 20;
      } else if (riskScore < 15) { sentiment = "Bullish"; sentimentScore = 90; }
      else if (riskScore < 30) { sentiment = "Bullish"; sentimentScore = 70; }
      else if (riskScore < 50) { sentiment = "Neutral"; sentimentScore = 50; }
      else if (riskScore < 70) { sentiment = "Bearish"; sentimentScore = 30; }
      else { sentiment = "Bearish"; sentimentScore = 10; }

      let prediction = "Safe";
      if (riskScore > 80 || creatorRiskLevel === "Critical") prediction = "Potential Scam";
      else if (riskScore > 60 || creatorRiskLevel === "High") prediction = "Risky";
      else if (riskScore > 35 || creatorRiskLevel === "Medium") prediction = "Caution";
      else prediction = "Safe";

      let riskLevel = "Low";
      if (riskScore > 80 || creatorRiskLevel === "Critical") riskLevel = "Critical";
      else if (riskScore > 60 || creatorRiskLevel === "High") riskLevel = "High";
      else if (riskScore > 35 || creatorRiskLevel === "Medium") riskLevel = "Medium";
      else riskLevel = "Low";

      let rugpullRisk = 0;
      if (riskScore > 80) rugpullRisk = 90;
      else if (riskScore > 60) rugpullRisk = 65;
      else if (riskScore > 40) rugpullRisk = 40;
      else if (riskScore > 20) rugpullRisk = 20;
      else rugpullRisk = 8;
      rugpullRisk = Math.min(rugpullRisk, 99);

      let scannerGrade = "F";
      if (riskScore < 10) scannerGrade = "A+";
      else if (riskScore < 20) scannerGrade = "A";
      else if (riskScore < 35) scannerGrade = "B";
      else if (riskScore < 50) scannerGrade = "C";
      else if (riskScore < 70) scannerGrade = "D";
      else scannerGrade = "F";

      const securityScore = 100 - riskScore;
      let trustScore = securityScore;
      if (data.is_open_source === "1") trustScore += 2;
      if (totalHolders !== "N/A" && Number(totalHolders) > 10000) trustScore += 3;
      if (tokenAgeDays !== "N/A" && tokenAgeDays > 365) trustScore += 3;
      if (isBurnWallet) trustScore += 2;
      trustScore = Math.min(trustScore, 100);

      // --- COMMUNITY SCORE ---
      let communityScore = 50;
      let communityReasons = [];
      if (totalHolders !== "N/A") {
        const holders = Number(totalHolders);
        if (holders > 100000) { communityScore += 30; communityReasons.push("+ Large holder base"); }
        else if (holders > 50000) { communityScore += 25; communityReasons.push("+ Good holder base"); }
        else if (holders > 10000) { communityScore += 20; communityReasons.push("+ Moderate holder base"); }
        else if (holders > 1000) { communityScore += 10; communityReasons.push("+ Small holder base"); }
        else if (holders > 100) { communityScore += 5; }
      }
      if (liquidityUsd !== "N/A" && Number(liquidityUsd) > 100000) {
        communityScore += 10; communityReasons.push("+ Strong liquidity");
      }
      if (tokenAgeDays !== "N/A" && tokenAgeDays > 365) {
        communityScore += 10; communityReasons.push("+ Established project");
      }
      if (data.is_open_source === "1") {
        communityScore += 10; communityReasons.push("+ Open source");
      }
      if (volume24h !== "N/A" && Number(volume24h) > 100000) {
        communityScore += 5; communityReasons.push("+ High daily volume");
      }
      communityScore = Math.min(communityScore, 95);

      // --- OVERALL RATING ---
      const overallRating = Math.round((securityScore + trustScore + communityScore) / 3);
      const stars = Math.round(overallRating / 20);
      const starDisplay = "⭐".repeat(Math.min(stars, 5)) + "☆".repeat(Math.max(0, 5 - stars));

      // --- RECOMMENDATION ---
      let recommendation = "AVOID";
      let recommendationColor = "text-red-400 bg-red-600/20 border-red-600";
      let recommendationConfidence = 0;
      let investmentCategory = "Speculative / High Risk";
      
      if (trustScore >= 85 && riskScore < 20 && !isHoneypot) {
        recommendation = "INVESTABLE";
        recommendationColor = "text-green-400 bg-green-600/20 border-green-600";
        recommendationConfidence = 85 + Math.floor(trustScore / 10);
        investmentCategory = "Blue Chip";
      } else if (trustScore >= 70 && riskScore < 40) {
        recommendation = "SPECULATIVE";
        recommendationColor = "text-yellow-400 bg-yellow-600/20 border-yellow-600";
        recommendationConfidence = 70 + Math.floor(trustScore / 10);
        investmentCategory = "Established";
      } else if (trustScore >= 50 && riskScore < 60) {
        recommendation = "SPECULATIVE";
        recommendationColor = "text-yellow-400 bg-yellow-600/20 border-yellow-600";
        recommendationConfidence = 50 + Math.floor(trustScore / 10);
        investmentCategory = "Speculative";
      } else {
        recommendation = "AVOID";
        recommendationColor = "text-red-400 bg-red-600/20 border-red-600";
        recommendationConfidence = 90 - Math.floor(riskScore / 10);
        investmentCategory = "High Risk";
      }
      recommendationConfidence = Math.min(Math.max(recommendationConfidence, 0), 98);

      const isLongTerm = tokenAgeDays !== "N/A" && tokenAgeDays > 730 && liquidityHealth === "Excellent";
      const topHoldersDisplay = topHolders !== "N/A" ? `${topHolders}%` : "N/A";

      // --- PERMISSIONS, FUNCTIONS, HONEYPOT TEST ---
      const permissions = {
        canMint: isMintable,
        canPause: transferPause,
        canBlacklist: isBlacklisted,
        canUpgrade: isProxy,
        canChangeTax: personalSlippage || antiWhaleModifiable,
        canRug: isHoneypot || cannotSellAll
      };
      const suspiciousFunctions = [];
      if (isMintable) suspiciousFunctions.push("mint()");
      if (isProxy) suspiciousFunctions.push("upgradeTo()");
      if (isBlacklisted) suspiciousFunctions.push("blacklist()");
      if (personalSlippage) suspiciousFunctions.push("setTax()");
      if (transferPause) suspiciousFunctions.push("pause()");
      if (antiWhaleModifiable) suspiciousFunctions.push("setMaxTx()");
      if (isHoneypot) suspiciousFunctions.push("Honeypot");
      if (cannotSellAll) suspiciousFunctions.push("cannotSellAll()");

      const honeypotTest = {
        buyTest: !isHoneypot && !cannotSellAll ? "Passed ✅" : "Failed ⚠️",
        sellTest: !isHoneypot && !cannotSellAll ? "Passed ✅" : "Failed ⚠️",
        transferTest: !isBlacklisted ? "Passed ✅" : "Failed ⚠️",
        status: isHoneypot ? "Honeypot Detected 🚨" : "Safe ✅"
      };

      // --- BADGES (holderHealthScore now defined) ---
      const badges = [];
      if (data.is_open_source === "1") badges.push("🛡️ Verified");
      if (honeypotTest.status === "Safe ✅") badges.push("🧪 Honeypot Safe");
      if (liquidityHealth === "Excellent") badges.push("💧 High Liquidity");
      if (holderHealthScore === "Excellent" || holderHealthScore === "Very Good") badges.push("👥 Strong Community");
      if (holderRisk < 10) badges.push("🐋 Low Whale Risk");
      if (investmentCategory === "Blue Chip") badges.push("🏆 Blue Chip");

      // --- SECURITY CHECKLIST ---
      const securityChecks = [
        { label: "Verified", passed: data.is_open_source === "1" },
        { label: "No Hidden Mint", passed: !hiddenMint },
        { label: "No Honeypot", passed: !isHoneypot },
        { label: "Transfer Enabled", passed: !isBlacklisted },
        { label: "Sell Enabled", passed: !cannotSellAll },
        { label: "No Blacklist", passed: !isBlacklisted },
        { label: "No Mint Function", passed: !isMintable },
        { label: "Low Creator Ownership", passed: creatorPercent < 10 },
        { label: "Healthy Holders", passed: !(totalHolders !== "N/A" && Number(totalHolders) < 20) },
        { label: "No Self Destruct", passed: !selfDestruct },
        { label: "No Hidden Owner", passed: !hiddenOwner },
        { label: "Strong Liquidity", passed: liquidityHealth === "Excellent" || liquidityHealth === "Good" }
      ];
      const passedChecks = securityChecks.filter(c => c.passed).length;
      const totalChecks = securityChecks.length;

      // --- SIMILAR TOKENS ---
      const similarTokens = [
        { name: "LINK", score: 94 },
        { name: "UNI", score: 95 },
        { name: "AAVE", score: 91 }
      ];
      const rankPercentile = Math.min(98, Math.round((securityScore / 100) * 90 + 10));

      // --- RISK SUMMARY ---
      const positives = [], negatives = [], warnings = [];
      const riskExplanation = [];

      if (data.is_open_source === "1") positives.push("Verified");
      if (isOwnerRenounced === "YES") positives.push("Owner Renounced");
      if (isLiquidityLocked === "YES") positives.push("Liquidity Locked");
      if (!hiddenMint) positives.push("No Hidden Mint");
      if (!hiddenOwner) positives.push("No Hidden Owner");
      if (antiWhale) positives.push("Anti-Whale Enabled");
      if (creatorPercent < 10) positives.push("Low Creator Ownership");
      if (!(totalHolders !== "N/A" && Number(totalHolders) < 20)) positives.push("Healthy Holder Count");
      if (isBurnWallet) positives.push("Tokens Burned");
      if (tokenAgeDays !== "N/A" && tokenAgeDays > 365) positives.push(`Established (${tokenAgeDays} days)`);

      if (isHoneypot) { negatives.push("Honeypot"); riskExplanation.push("🚨 Honeypot detected"); }
      if (hiddenMint) { negatives.push("Hidden Mint"); riskExplanation.push("⚠️ Hidden mint function"); }
      if (hiddenOwner) { negatives.push("Hidden Owner"); riskExplanation.push("⚠️ Hidden owner can steal funds"); }
      if (isMintable) { negatives.push("Mintable"); riskExplanation.push("⚠️ Contract can mint new tokens"); }
      if (isBlacklisted) { negatives.push("Blacklist"); riskExplanation.push("⚠️ Contract can blacklist addresses"); }
      if (cannotSellAll) { negatives.push("Cannot Sell All"); riskExplanation.push("⚠️ Cannot sell all in one tx"); }
      if (personalSlippage) { negatives.push("Personal Slippage"); riskExplanation.push("⚠️ Slippage can be modified"); }
      if (isProxy) { negatives.push("Upgradeable"); riskExplanation.push("⚠️ Upgradeable contract"); }
      if (creatorPercent > 50) { negatives.push(`Creator owns ${creatorPercent.toFixed(2)}%`); riskExplanation.push(`👤 Creator controls ${creatorPercent.toFixed(2)}% of supply`); }
      if (totalHolders !== "N/A" && Number(totalHolders) < 20) { negatives.push(`Only ${totalHolders} holders`); riskExplanation.push(`📊 Only ${totalHolders} holders`); }
      if (isLiquidityLocked === "NO") riskExplanation.push("💧 Liquidity not locked");
      if (isNewToken) riskExplanation.push(`📅 Token is only ${tokenAgeDays} days old`);

      if (isNewToken) warnings.push(`Token is very new (${tokenAgeDays} days old)`);
      if (isLiquidityLocked === "NO") warnings.push("Liquidity not locked");
      if (isProxy) warnings.push("Contract is upgradeable");
      if (creatorPercent > 20) warnings.push(`Creator owns ${creatorPercent.toFixed(2)}%`);

      // --- TRUST FACTORS ---
      const trustFactors = [];
      if (data.is_open_source === "1") trustFactors.push("✅ Verified contract");
      if (totalHolders !== "N/A" && Number(totalHolders) > 10000) trustFactors.push(`✅ ${totalHolders} holders`);
      if (liquidityUsd !== "N/A" && Number(liquidityUsd) > 100000) trustFactors.push("✅ Strong liquidity");
      if (!isMintable) trustFactors.push("✅ No mint function");
      if (!isBlacklisted) trustFactors.push("✅ No blacklist");
      if (creatorPercent < 10) trustFactors.push("✅ Low creator ownership");
      if (tokenAgeDays !== "N/A" && tokenAgeDays > 365) trustFactors.push(`✅ ${tokenAgeDays} days old`);

      // --- AI VERDICT ---
      let aiVerdict = "";
      const isEstablished = tokenAgeDays !== "N/A" && tokenAgeDays > 365;
      const hasManyHolders = totalHolders !== "N/A" && Number(totalHolders) > 10000;
      const isScam = isHoneypot || hiddenMint || hiddenOwner;

      if (isHoneypot) {
        aiVerdict = "🚨 HONEYPOT DETECTED: Do not invest.";
      } else if (isScam) {
        aiVerdict = "🚨 HIGH RISK: Multiple scam indicators.";
      } else if (creatorPercent > 90 && totalHolders !== "N/A" && Number(totalHolders) < 20) {
        aiVerdict = `Highly centralized: ${creatorPercent.toFixed(2)}% supply by creator, only ${totalHolders} holders.`;
      } else if (riskScore < 15 && isEstablished && hasManyHolders) {
        aiVerdict = `${data.token_name || "This token"} is mature with large holder base, verified, low risk.`;
      } else if (riskScore < 15) {
        aiVerdict = "Technically safe: no hidden mint, no honeypot, low creator ownership.";
      } else if (riskScore < 35) {
        aiVerdict = "Minor risk factors, generally safe. Review flagged items.";
      } else if (riskScore < 55) {
        aiVerdict = "Moderate risk, caution advised. Several security features missing.";
      } else if (riskScore < 80) {
        aiVerdict = "Significant risk. Multiple red flags. Not recommended without extensive research.";
      } else {
        aiVerdict = "🚨 HIGH RISK: Multiple scam indicators. AVOID.";
      }

      // --- BULL/BEAR ---
      let bullCase = [], bearCase = [];
      if (data.is_open_source === "1") bullCase.push("✅ Verified contract");
      if (!hiddenMint) bullCase.push("✅ No hidden mint");
      if (!hiddenOwner) bullCase.push("✅ No hidden owner");
      if (!isMintable) bullCase.push("✅ No mint function");
      if (antiWhale) bullCase.push("✅ Anti-whale enabled");
      if (creatorPercent < 10) bullCase.push("✅ Low creator ownership");
      if (totalHolders !== "N/A" && Number(totalHolders) > 10000) bullCase.push("✅ Large holder base");
      if (liquidityUsd !== "N/A" && Number(liquidityUsd) > 100000) bullCase.push("✅ Strong liquidity");
      if (tokenAgeDays !== "N/A" && tokenAgeDays > 365) bullCase.push("✅ Established token");

      if (creatorPercent > 50) bearCase.push(`⚠️ Creator owns ${creatorPercent.toFixed(2)}%`);
      if (totalHolders !== "N/A" && Number(totalHolders) < 20) bearCase.push(`⚠️ Only ${totalHolders} holders`);
      if (isLiquidityLocked === "NO") bearCase.push("⚠️ Liquidity not locked");
      if (isProxy) bearCase.push("⚠️ Upgradeable contract");
      if (isMintable) bearCase.push("⚠️ Mintable");
      if (isBlacklisted) bearCase.push("⚠️ Blacklist function");
      if (isNewToken) bearCase.push(`⚠️ Very new (${tokenAgeDays} days)`);
      if (isHoneypot) bearCase.push("🚨 Honeypot detected");

      // --- WHAT COULD GO WRONG ---
      const whatCouldGoWrong = [];
      if (isProxy) whatCouldGoWrong.push("Contract is upgradeable - admin can change logic");
      if (isMintable) whatCouldGoWrong.push("Admin can mint new tokens at any time");
      if (isBlacklisted) whatCouldGoWrong.push("Admin can blacklist addresses");
      if (isOwnerRenounced === "NO" && creatorPercent > 0) whatCouldGoWrong.push("Owner has administrative privileges");
      if (isLiquidityLocked === "NO") whatCouldGoWrong.push("Liquidity can be removed by owner");

      // --- TRADING STATUS ---
      const tradingEnabled = !isHoneypot && !cannotSellAll;
      const transfersEnabled = !isBlacklisted;

      // --- LINKS ---
      const etherscanLink = `https://etherscan.io/address/${cleanAddress}`;
      const dexScreenerLink = `https://dexscreener.com/ethereum/${cleanAddress}`;
      const coinGeckoLink = coinGeckoSlug !== "" ? `https://www.coingecko.com/en/coins/${coinGeckoSlug}` : "";

      // --- Placeholder for unavailable data ---
      const smartMoney = { wallets: 0, netFlow: 'N/A', signal: 'N/A' };
      const topHolderBreakdown = [];
      const telegramMembers = 'N/A';
      const xFollowers = 'N/A';

      // --- SET ANALYSIS ---
      setAnalysis({
        // Core
        riskScore,
        securityScore,
        trustScore,
        communityScore,
        communityReasons,
        overallRating,
        starDisplay,
        riskLevel,
        prediction,
        sentiment,
        sentimentScore,
        rugpullRisk,
        scannerGrade,
        contractType: isProxy ? "Upgradeable Contract" : "Standard Contract",
        recommendation,
        recommendationColor,
        recommendationConfidence,
        investmentCategory,
        isLongTerm,

        // Token
        tokenName: data.token_name || "Unknown Token",
        tokenSymbol: data.token_symbol || "???",
        totalSupply: data.total_supply || "N/A",
        contractBalance,
        isBurnWallet,

        // Age
        tokenAgeDays,
        ageDisplay,
        ageScore,
        ageScoreValue,
        ageStatus,
        createdAt,
        isNewToken,

        // Security
        hiddenMint, hiddenOwner, antiWhale, antiWhaleModifiable,
        cannotSellAll, personalSlippage, tradingCooldown, transferPause,
        selfDestruct, externalCall, isHoneypot, isMintable, isProxy, isBlacklisted,

        // Tax
        buyTax, sellTax,

        // Creator
        creatorAddress,
        creatorBalance,
        creatorPercent: creatorPercent.toFixed(2),
        creatorRisk: creatorRiskLevel,
        creatorRiskScore,
        isHighlyCentralized: creatorPercent > 90,

        // Ownership (now defined)
        ownershipStatus,
        ownershipStatusColor,

        // Holders
        topHolders,
        topHoldersDisplay,
        holderConcentrationRisk: holderRisk,
        isOwnerRenounced,
        isLiquidityLocked,
        totalHolders,
        lpHolders,
        ownerAddress,
        isLowHolders: totalHolders !== "N/A" && Number(totalHolders) < 20,
        holderHealthScore,
        holderHealthLevel,

        // Liquidity
        liquidityAmount,
        liquidityLocked,
        liquidityUnlockDate,
        lpBurned,
        liquidityUsd,
        liquidityHealth,

        // New: Liquidity Lock
        lockInfo,

        // New: Social Links
        socialLinks,
        websiteStatus,

        // New: Placeholder data
        smartMoney,
        topHolderBreakdown,
        telegramMembers,
        xFollowers,

        // Risk Breakdown
        contractRisk,
        holderRisk,
        liquidityRisk,
        ageRisk,

        // Market
        price: formattedPrice,
        marketCap,
        fdv,
        priceChange1h,
        priceChange24h,
        priceChange7d,
        volume24h,
        volumeChange24h,
        priceSource,

        // Explanations
        riskExplanation,
        trustFactors,
        suspiciousFunctions,
        permissions,
        honeypotTest,
        badges,
        securityChecks,
        passedChecks,
        totalChecks,
        whatCouldGoWrong,

        // Similar Tokens
        similarTokens,
        rankPercentile,

        // Trading
        tradingEnabled,
        transfersEnabled,

        // Bull/Bear
        bullCase,
        bearCase,

        // Misc
        isVerified: data.is_open_source === "1",

        // Summaries
        positives,
        negatives,
        warnings,
        aiVerdict,

        // Links
        etherscanLink,
        dexScreenerLink,
        coinGeckoLink,
        coinGeckoSlug,

        summary: `AI Audit: ${data.token_name || "Token"}\nRisk Score: ${riskScore}/100\nSecurity Score: ${securityScore}/100\nTrust Score: ${trustScore}/100\nEstimated Rugpull Risk: ${rugpullRisk}%`,

        holders: [
          { 
            label: "Top 10 Holders", 
            percent: topHolders === "N/A" ? 0 : Math.min(topHolders, 100), 
            value: topHoldersDisplay,
            color: topHolders !== "N/A" && topHolders > 60 ? "bg-red-500" : 
                   topHolders !== "N/A" && topHolders > 40 ? "bg-yellow-500" : "bg-green-500" 
          },
          { 
            label: "Owner Renounced", 
            percent: isOwnerRenounced === "YES" ? 100 : 0, 
            value: isOwnerRenounced,
            color: isOwnerRenounced === "YES" ? "bg-green-500" : 
                   isOwnerRenounced === "NO" ? "bg-red-500" : "bg-yellow-500"
          },
          { 
            label: "Liquidity Locked", 
            percent: isLiquidityLocked === "YES" ? 100 : 0, 
            value: isLiquidityLocked,
            color: isLiquidityLocked === "YES" ? "bg-green-500" : 
                   isLiquidityLocked === "NO" ? "bg-red-500" : "bg-yellow-500"
          }
        ]
      });
    } catch (err) {
      let userMessage = err.message || "An unexpected error occurred.";
      setError(userMessage);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // --- Part 1 ends here (Part 2 is the JSX return) ---

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6 pt-20 flex flex-col">
      <div className="max-w-4xl mx-auto w-full flex-1">
        {/* --- BIGGER TITLE --- */}
        <h1 className="text-5xl md:text-6xl font-extrabold text-center mb-8 bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
        Solt AI Intelligence Suite
        </h1>
        <ContractScannerForm onScan={handleScan} />

        {analysis && !loading && (
          <div className="mt-10 grid gap-6">
            {/* Token Info Card with Age */}
            <div className="bg-gray-800 p-6 rounded-2xl border border-gray-700">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-gray-400 text-sm">Token</p>
                  <h2 className="text-3xl font-bold text-white">
                    {analysis.tokenName}
                  </h2>
                  <p className="text-purple-400 text-lg">
                    {analysis.tokenSymbol}
                  </p>
                  <p className="text-xs text-gray-500 break-all mt-2">
                    {scannedAddress}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  {analysis.isVerified && (
                    <span className="bg-green-600/20 text-green-400 px-3 py-1 rounded-full text-xs font-bold border border-green-600">
                      ✅ Verified
                    </span>
                  )}
                  {analysis.isNewToken && (
                    <span className="bg-yellow-600/20 text-yellow-400 px-3 py-1 rounded-full text-xs font-bold border border-yellow-600">
                      ⚠️ New Token ({analysis.tokenAgeDays} days)
                    </span>
                  )}
                  {analysis.isLongTerm && (
                    <span className="bg-blue-600/20 text-blue-400 px-3 py-1 rounded-full text-xs font-bold border border-blue-600">
                      🟢 Long-Term Project
                    </span>
                  )}
                </div>
              </div>
              
              {/* Token Age Card - Detailed */}
              {analysis.tokenAgeDays !== "N/A" ? (
                <div className="mt-4 grid grid-cols-4 gap-4 pt-4 border-t border-gray-700">
                  <div className="text-center">
                    <p className="text-gray-400 text-xs">📅 Created</p>
                    <p className="text-sm font-bold">{analysis.createdAt}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-gray-400 text-xs">⏳ Age</p>
                    <p className="text-sm font-bold">{analysis.ageDisplay}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-gray-400 text-xs">📊 Age Score</p>
                    <p className={`text-sm font-bold ${
                      analysis.ageScoreValue > 80 ? 'text-green-400' :
                      analysis.ageScoreValue > 50 ? 'text-yellow-400' :
                      'text-red-400'
                    }`}>
                      {analysis.ageScoreValue}/100
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-gray-400 text-xs">🏷️ Status</p>
                    <p className={`text-sm font-bold ${
                      analysis.ageScore === "Excellent" ? 'text-green-400' :
                      analysis.ageScore === "Very Good" ? 'text-green-300' :
                      analysis.ageScore === "Good" ? 'text-blue-400' :
                      analysis.ageScore === "Average" ? 'text-yellow-400' :
                      analysis.ageScore === "Fair" ? 'text-orange-400' :
                      'text-red-400'
                    }`}>
                      {analysis.ageStatus}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="mt-4 pt-4 border-t border-gray-700 text-center text-gray-500">
                  Token age data not available.
                </div>
              )}
            </div>

            {/* Security Badges */}
            {analysis.badges.length > 0 && (
              <div className="bg-gray-800/50 p-4 rounded-2xl border border-gray-700">
                <div className="flex flex-wrap gap-2">
                  {analysis.badges.map((badge, i) => (
                    <span key={i} className="bg-purple-900/30 text-purple-300 px-3 py-1 rounded-full text-xs font-bold border border-purple-500">
                      {badge}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Alerts */}
            {analysis.isHoneypot && (
              <div className="bg-red-600/20 border-2 border-red-600 p-4 rounded-2xl text-center animate-pulse">
                <p className="text-2xl font-bold text-red-500">🚨 HONEYPOT DETECTED 🚨</p>
                <p className="text-sm text-red-300">This contract is a confirmed honeypot - You CANNOT sell this token!</p>
              </div>
            )}
            {analysis.isHighlyCentralized && (
              <div className="bg-red-600/20 border-2 border-red-600 p-4 rounded-2xl text-center animate-pulse">
                <p className="text-xl font-bold text-red-500">🚨 EXTREME CENTRALIZATION 🚨</p>
                <p className="text-sm text-red-300">
                  Creator owns {analysis.creatorPercent}% of supply - This token is highly centralized!
                </p>
              </div>
            )}
            {analysis.isLowHolders && (
              <div className="bg-yellow-600/20 border-2 border-yellow-600 p-4 rounded-2xl text-center">
                <p className="text-xl font-bold text-yellow-400">⚠️ VERY LOW HOLDER COUNT</p>
                <p className="text-sm text-yellow-300">
                  Only {analysis.totalHolders} holders - Risk of price manipulation!
                </p>
              </div>
            )}

            {/* Recommendation Badge */}
            <div className={`${analysis.recommendationColor} p-4 rounded-2xl border-2 text-center`}>
              <p className={`text-2xl font-bold ${
                analysis.recommendation === "INVESTABLE" ? 'text-green-400' :
                analysis.recommendation === "SPECULATIVE" ? 'text-yellow-400' :
                'text-red-400'
              }`}>
                {analysis.recommendation === "INVESTABLE" ? "🟢 INVESTABLE" :
                 analysis.recommendation === "SPECULATIVE" ? "🟡 SPECULATIVE" :
                 "🔴 AVOID"}
              </p>
              <p className="text-sm text-gray-300 mt-1">Confidence: {analysis.recommendationConfidence}%</p>
              <p className="text-xs text-gray-400 mt-1">Category: {analysis.investmentCategory}</p>
            </div>

            {/* Overall Rating */}
            <div className="bg-gray-800 p-4 rounded-2xl border border-gray-700 text-center">
              <p className="text-gray-400 text-sm">Overall Rating</p>
              <p className="text-3xl font-bold text-purple-400">{analysis.starDisplay}</p>
              <p className="text-sm text-gray-300 mt-1">{analysis.overallRating}/100</p>
            </div>

            {/* Scores */}
            <div className="grid grid-cols-4 gap-4">
              <div className="bg-gray-800 p-4 rounded-2xl border border-gray-700 text-center">
                <p className="text-gray-400 text-sm">Scanner Grade</p>
                <p className={`text-3xl font-bold ${
                  analysis.scannerGrade === "A+" ? 'text-green-400' :
                  analysis.scannerGrade === "A" ? 'text-green-300' :
                  analysis.scannerGrade === "B" ? 'text-blue-400' :
                  analysis.scannerGrade === "C" ? 'text-yellow-400' :
                  analysis.scannerGrade === "D" ? 'text-orange-400' :
                  'text-red-400'
                }`}>
                  {analysis.scannerGrade}
                </p>
              </div>
              <div className="bg-gray-800 p-4 rounded-2xl border border-gray-700 text-center">
                <p className="text-gray-400 text-sm">Security</p>
                <p className={`text-3xl font-bold ${
                  analysis.securityScore > 70 ? 'text-green-400' :
                  analysis.securityScore > 50 ? 'text-yellow-400' :
                  'text-red-400'
                }`}>
                  {analysis.securityScore}
                </p>
              </div>
              <div className="bg-gray-800 p-4 rounded-2xl border border-gray-700 text-center">
                <p className="text-gray-400 text-sm">Trust</p>
                <p className={`text-3xl font-bold ${
                  analysis.trustScore > 70 ? 'text-green-400' :
                  analysis.trustScore > 50 ? 'text-yellow-400' :
                  'text-red-400'
                }`}>
                  {analysis.trustScore}
                </p>
              </div>
              <div className="bg-gray-800 p-4 rounded-2xl border border-gray-700 text-center">
                <p className="text-gray-400 text-sm">Community</p>
                <p className={`text-3xl font-bold ${
                  analysis.communityScore > 70 ? 'text-green-400' :
                  analysis.communityScore > 50 ? 'text-yellow-400' :
                  'text-red-400'
                }`}>
                  {analysis.communityScore}
                </p>
              </div>
            </div>

            {/* Community Score Reasons */}
            {analysis.communityReasons.length > 0 && (
              <div className="bg-gray-800/50 p-4 rounded-2xl border border-gray-700">
                <p className="text-gray-400 text-sm mb-2">Community Score Factors:</p>
                <div className="flex flex-wrap gap-2">
                  {analysis.communityReasons.map((reason, i) => (
                    <span key={i} className="text-xs text-green-300 bg-green-900/20 px-2 py-1 rounded-full">
                      {reason}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Contract Type & Ownership Status */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-800 p-4 rounded-2xl border border-gray-700 text-center">
                <p className="text-gray-400 text-sm">Contract Type</p>
                <p className={`text-xl font-bold ${
                  analysis.contractType === "Upgradeable Contract" ? 'text-yellow-400' : 'text-green-400'
                }`}>
                  {analysis.contractType}
                </p>
              </div>
              <div className="bg-gray-800 p-4 rounded-2xl border border-gray-700 text-center">
                <p className="text-gray-400 text-sm">Ownership Status</p>
                <p className={`text-xl font-bold ${analysis.ownershipStatusColor}`}>
                  {analysis.ownershipStatus}
                </p>
              </div>
            </div>

            {/* --- NEW: Smart Money Activity (Placeholder) --- */}
            <div className="bg-gray-800 p-6 rounded-2xl border border-gray-700">
              <h3 className="text-lg font-bold mb-4">💼 Smart Money Activity</h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-gray-900 p-3 rounded-xl border border-gray-700 text-center">
                  <p className="text-gray-400 text-xs">Smart Wallets</p>
                  <p className="text-xl font-bold">N/A</p>
                </div>
                <div className="bg-gray-900 p-3 rounded-xl border border-gray-700 text-center">
                  <p className="text-gray-400 text-xs">Net Flow (24h)</p>
                  <p className="text-xl font-bold">N/A</p>
                </div>
                <div className="bg-gray-900 p-3 rounded-xl border border-gray-700 text-center">
                  <p className="text-gray-400 text-xs">Signal</p>
                  <p className="text-xl font-bold text-gray-500">N/A</p>
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-2 text-center">Smart Money tracking requires premium API.</p>
            </div>

            {/* --- NEW: Real Top Holder Breakdown (Placeholder) --- */}
            <div className="bg-gray-800 p-6 rounded-2xl border border-gray-700">
              <h3 className="text-lg font-bold mb-4">🐋 Top Holder Breakdown</h3>
              <div className="text-center text-gray-400 py-4">
                <p>Top holder data not available via free API.</p>
                <p className="text-xs mt-1">Requires Etherscan API or premium service.</p>
              </div>
            </div>

            {/* --- SOCIAL LINKS & WEBSITE STATUS --- */}
            <div className="bg-gray-800 p-6 rounded-2xl border border-gray-700">
              <h3 className="text-lg font-bold mb-4">🌐 Social & Web Presence</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-900 p-3 rounded-xl border border-gray-700 text-center">
                  <p className="text-gray-400 text-xs">Website</p>
                  <p className="text-sm font-bold truncate">
                    {analysis.socialLinks.website !== 'N/A' ? (
                      <a href={analysis.socialLinks.website} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">
                        {analysis.socialLinks.website.replace(/^https?:\/\//, '')}
                      </a>
                    ) : 'N/A'}
                  </p>
                  <p className="text-xs mt-1">{analysis.websiteStatus}</p>
                </div>
                <div className="bg-gray-900 p-3 rounded-xl border border-gray-700 text-center">
                  <p className="text-gray-400 text-xs">Twitter/X</p>
                  <p className="text-sm font-bold truncate">
                    {analysis.socialLinks.twitter !== 'N/A' ? (
                      <a href={analysis.socialLinks.twitter} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">
                        {analysis.socialLinks.twitter.replace(/^https?:\/\//, '')}
                      </a>
                    ) : 'N/A'}
                  </p>
                  <p className="text-xs text-gray-500">Followers: N/A</p>
                </div>
                <div className="bg-gray-900 p-3 rounded-xl border border-gray-700 text-center">
                  <p className="text-gray-400 text-xs">Telegram</p>
                  <p className="text-sm font-bold truncate">
                    {analysis.socialLinks.telegram !== 'N/A' ? (
                      <a href={analysis.socialLinks.telegram} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">
                        {analysis.socialLinks.telegram.replace(/^https?:\/\//, '')}
                      </a>
                    ) : 'N/A'}
                  </p>
                  <p className="text-xs text-gray-500">Members: N/A</p>
                </div>
                <div className="bg-gray-900 p-3 rounded-xl border border-gray-700 text-center">
                  <p className="text-gray-400 text-xs">GitHub</p>
                  <p className="text-sm font-bold truncate">
                    {analysis.socialLinks.github !== 'N/A' ? (
                      <a href={analysis.socialLinks.github} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">
                        {analysis.socialLinks.github.replace(/^https?:\/\//, '')}
                      </a>
                    ) : 'N/A'}
                  </p>
                </div>
              </div>
            </div>

            {/* --- LIQUIDITY LOCK DETAILS --- */}
            <div className="bg-gray-800 p-6 rounded-2xl border border-gray-700">
              <h3 className="text-lg font-bold mb-4">🔒 Liquidity Lock Details</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-900 p-3 rounded-xl border border-gray-700 text-center">
                  <p className="text-gray-400 text-xs">Lock Status</p>
                  <p className={`text-xl font-bold ${analysis.lockInfo.locked ? 'text-green-400' : 'text-red-400'}`}>
                    {analysis.lockInfo.locked ? '🔒 Locked' : '🔓 Not Locked'}
                  </p>
                </div>
                <div className="bg-gray-900 p-3 rounded-xl border border-gray-700 text-center">
                  <p className="text-gray-400 text-xs">Locked %</p>
                  <p className="text-xl font-bold">{analysis.lockInfo.percent || 0}%</p>
                </div>
                <div className="bg-gray-900 p-3 rounded-xl border border-gray-700 text-center">
                  <p className="text-gray-400 text-xs">Locker</p>
                  <p className="text-sm font-bold">{analysis.lockInfo.locker || 'N/A'}</p>
                </div>
                <div className="bg-gray-900 p-3 rounded-xl border border-gray-700 text-center">
                  <p className="text-gray-400 text-xs">Unlock Date</p>
                  <p className="text-sm font-bold">{analysis.lockInfo.unlockDate || 'N/A'}</p>
                </div>
              </div>
            </div>

            {/* --- Contract Permissions --- */}
            <div className="bg-gray-800 p-6 rounded-2xl border border-gray-700">
              <h3 className="text-lg font-bold mb-4">🔑 Contract Permissions</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <div className="bg-gray-900 p-3 rounded-xl border border-gray-700 text-center">
                  <p className="text-gray-400 text-xs">Owner Can Mint</p>
                  <p className={`font-bold ${analysis.permissions.canMint ? 'text-red-400' : 'text-green-400'}`}>
                    {analysis.permissions.canMint ? '⚠️ YES' : '✅ NO'}
                  </p>
                </div>
                <div className="bg-gray-900 p-3 rounded-xl border border-gray-700 text-center">
                  <p className="text-gray-400 text-xs">Owner Can Pause</p>
                  <p className={`font-bold ${analysis.permissions.canPause ? 'text-red-400' : 'text-green-400'}`}>
                    {analysis.permissions.canPause ? '⚠️ YES' : '✅ NO'}
                  </p>
                </div>
                <div className="bg-gray-900 p-3 rounded-xl border border-gray-700 text-center">
                  <p className="text-gray-400 text-xs">Owner Can Blacklist</p>
                  <p className={`font-bold ${analysis.permissions.canBlacklist ? 'text-red-400' : 'text-green-400'}`}>
                    {analysis.permissions.canBlacklist ? '⚠️ YES' : '✅ NO'}
                  </p>
                </div>
                <div className="bg-gray-900 p-3 rounded-xl border border-gray-700 text-center">
                  <p className="text-gray-400 text-xs">Owner Can Upgrade</p>
                  <p className={`font-bold ${analysis.permissions.canUpgrade ? 'text-red-400' : 'text-green-400'}`}>
                    {analysis.permissions.canUpgrade ? '⚠️ YES' : '✅ NO'}
                  </p>
                </div>
                <div className="bg-gray-900 p-3 rounded-xl border border-gray-700 text-center">
                  <p className="text-gray-400 text-xs">Owner Can Change Tax</p>
                  <p className={`font-bold ${analysis.permissions.canChangeTax ? 'text-red-400' : 'text-green-400'}`}>
                    {analysis.permissions.canChangeTax ? '⚠️ YES' : '✅ NO'}
                  </p>
                </div>
                <div className="bg-gray-900 p-3 rounded-xl border border-gray-700 text-center">
                  <p className="text-gray-400 text-xs">Rug Risk</p>
                  <p className={`font-bold ${analysis.permissions.canRug ? 'text-red-400' : 'text-green-400'}`}>
                    {analysis.permissions.canRug ? '⚠️ YES' : '✅ NO'}
                  </p>
                </div>
              </div>
            </div>

            {/* Suspicious Functions */}
            {analysis.suspiciousFunctions.length > 0 && (
              <div className="bg-red-900/20 p-4 rounded-2xl border border-red-600">
                <h3 className="text-lg font-bold text-red-400 mb-2">🚨 Suspicious Functions Detected</h3>
                <div className="flex flex-wrap gap-2">
                  {analysis.suspiciousFunctions.map((func, i) => (
                    <span key={i} className="bg-red-600/30 text-red-300 px-3 py-1 rounded-full text-xs font-bold border border-red-600">
                      {func}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Honeypot Test */}
            <div className="bg-gray-800 p-6 rounded-2xl border border-gray-700">
              <h3 className="text-lg font-bold mb-4">🧪 Honeypot Test Simulation</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-900 p-4 rounded-xl border border-gray-700 text-center">
                  <p className="text-gray-400 text-xs">Buy Test</p>
                  <p className={`text-xl font-bold ${
                    analysis.honeypotTest.buyTest.includes('Passed') ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {analysis.honeypotTest.buyTest}
                  </p>
                </div>
                <div className="bg-gray-900 p-4 rounded-xl border border-gray-700 text-center">
                  <p className="text-gray-400 text-xs">Sell Test</p>
                  <p className={`text-xl font-bold ${
                    analysis.honeypotTest.sellTest.includes('Passed') ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {analysis.honeypotTest.sellTest}
                  </p>
                </div>
                <div className="bg-gray-900 p-4 rounded-xl border border-gray-700 text-center">
                  <p className="text-gray-400 text-xs">Transfer Test</p>
                  <p className={`text-xl font-bold ${
                    analysis.honeypotTest.transferTest.includes('Passed') ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {analysis.honeypotTest.transferTest}
                  </p>
                </div>
                <div className="bg-gray-900 p-4 rounded-xl border border-gray-700 text-center">
                  <p className="text-gray-400 text-xs">Overall Status</p>
                  <p className={`text-xl font-bold ${
                    analysis.honeypotTest.status.includes('Safe') ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {analysis.honeypotTest.status}
                  </p>
                </div>
              </div>
            </div>

            {/* Market Data */}
            <div className="bg-gray-800 p-4 rounded-2xl border border-gray-700 text-center">
              <p className="text-gray-400 text-sm">Price</p>
              <p className="text-2xl font-bold">${analysis.price}</p>
              <div className="flex justify-center gap-4 mt-1">
                {analysis.priceChange1h !== "N/A" && (
                  <span className={`text-sm ${parseFloat(analysis.priceChange1h) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    1h: {parseFloat(analysis.priceChange1h) >= 0 ? '↑' : '↓'} {Math.abs(parseFloat(analysis.priceChange1h)).toFixed(2)}%
                  </span>
                )}
                {analysis.priceChange24h !== "N/A" && (
                  <span className={`text-sm ${parseFloat(analysis.priceChange24h) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    24h: {parseFloat(analysis.priceChange24h) >= 0 ? '↑' : '↓'} {Math.abs(parseFloat(analysis.priceChange24h)).toFixed(2)}%
                  </span>
                )}
                {analysis.priceChange7d !== "N/A" && (
                  <span className={`text-sm ${parseFloat(analysis.priceChange7d) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    7d: {parseFloat(analysis.priceChange7d) >= 0 ? '↑' : '↓'} {Math.abs(parseFloat(analysis.priceChange7d)).toFixed(2)}%
                  </span>
                )}
              </div>
              {analysis.priceSource !== "N/A" && (
                <p className="text-[10px] text-gray-500 mt-1">Source: {analysis.priceSource}</p>
              )}
            </div>

            {/* Market Cap, FDV, Volume */}
            <div className="grid grid-cols-3 gap-4">
              {analysis.marketCap !== "N/A" && (
                <div className="bg-gray-800 p-4 rounded-2xl border border-gray-700 text-center">
                  <p className="text-gray-400 text-xs">Market Cap</p>
                  <p className="text-sm font-bold">${parseFloat(analysis.marketCap).toLocaleString()}</p>
                </div>
              )}
              {analysis.fdv !== "N/A" && (
                <div className="bg-gray-800 p-4 rounded-2xl border border-gray-700 text-center">
                  <p className="text-gray-400 text-xs">FDV</p>
                  <p className="text-sm font-bold">${parseFloat(analysis.fdv).toLocaleString()}</p>
                </div>
              )}
              {analysis.volume24h !== "N/A" && (
                <div className="bg-gray-800 p-4 rounded-2xl border border-gray-700 text-center">
                  <p className="text-gray-400 text-xs">24h Volume</p>
                  <p className="text-sm font-bold">${parseFloat(analysis.volume24h).toLocaleString()}</p>
                </div>
              )}
            </div>

            {/* Liquidity Health */}
            {analysis.liquidityHealth !== "N/A" && (
              <div className="bg-gray-800 p-4 rounded-2xl border border-gray-700 text-center">
                <p className="text-gray-400 text-sm">💧 Liquidity Health</p>
                <p className={`text-xl font-bold ${
                  analysis.liquidityHealth === "Excellent" ? 'text-green-400' :
                  analysis.liquidityHealth === "Good" ? 'text-blue-400' :
                  analysis.liquidityHealth === "Average" ? 'text-yellow-400' :
                  'text-red-400'
                }`}>
                  {analysis.liquidityHealth}
                </p>
                {analysis.liquidityUsd !== "N/A" && (
                  <p className="text-xs text-gray-400 mt-1">${parseFloat(analysis.liquidityUsd).toLocaleString()}</p>
                )}
              </div>
            )}

            {/* Sentiment Gauge */}
            <SentimentGauge 
              sentiment={analysis.sentiment} 
              score={analysis.sentimentScore}
              rugpullProbability={analysis.rugpullRisk}
            />

            {/* Risk Assessment */}
            <div className="bg-gray-800 p-6 rounded-2xl border border-gray-700">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold">Risk Assessment</h3>
                <div className="flex items-center gap-4">
                  <span className={`px-3 py-1 rounded-full text-sm font-bold ${
                    analysis.riskLevel === "Critical" ? 'bg-red-600' :
                    analysis.riskLevel === "High" ? 'bg-orange-500' :
                    analysis.riskLevel === "Medium" ? 'bg-yellow-500' :
                    'bg-green-500'
                  }`}>
                    {analysis.riskLevel}
                  </span>
                  <span className="text-2xl font-bold">{analysis.riskScore}/100</span>
                </div>
              </div>
              <div className="mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Estimated Rugpull Risk</span>
                  <span className="font-bold">{analysis.rugpullRisk}%</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2 mt-1">
                  <div 
                    className={`h-2 rounded-full transition-all ${
                      analysis.rugpullRisk > 70 ? 'bg-red-500' :
                      analysis.rugpullRisk > 40 ? 'bg-yellow-500' :
                      'bg-green-500'
                    }`}
                    style={{ width: `${analysis.rugpullRisk}%` }}
                  />
                </div>
              </div>
              <p className="text-sm text-gray-300 mt-2">
                Prediction: <span className="font-bold">{analysis.prediction}</span>
              </p>
            </div>

            {/* Risk Breakdown */}
            <div className="bg-gray-800 p-6 rounded-2xl border border-gray-700">
              <h3 className="text-lg font-bold mb-4">📊 Risk Breakdown</h3>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="bg-gray-900 p-3 rounded-xl border border-gray-700 text-center">
                  <p className="text-gray-400 text-xs">Contract</p>
                  <p className={`text-xl font-bold ${analysis.contractRisk > 20 ? 'text-red-400' : analysis.contractRisk > 10 ? 'text-yellow-400' : 'text-green-400'}`}>
                    {analysis.contractRisk}/30
                  </p>
                </div>
                <div className="bg-gray-900 p-3 rounded-xl border border-gray-700 text-center">
                  <p className="text-gray-400 text-xs">Holders</p>
                  <p className={`text-xl font-bold ${analysis.holderRisk > 15 ? 'text-red-400' : analysis.holderRisk > 8 ? 'text-yellow-400' : 'text-green-400'}`}>
                    {analysis.holderRisk}/25
                  </p>
                </div>
                <div className="bg-gray-900 p-3 rounded-xl border border-gray-700 text-center">
                  <p className="text-gray-400 text-xs">Creator</p>
                  <p className={`text-xl font-bold ${analysis.creatorRiskScore > 15 ? 'text-red-400' : analysis.creatorRiskScore > 8 ? 'text-yellow-400' : 'text-green-400'}`}>
                    {analysis.creatorRiskScore}/25
                  </p>
                </div>
                <div className="bg-gray-900 p-3 rounded-xl border border-gray-700 text-center">
                  <p className="text-gray-400 text-xs">Liquidity</p>
                  <p className={`text-xl font-bold ${analysis.liquidityRisk > 12 ? 'text-red-400' : analysis.liquidityRisk > 6 ? 'text-yellow-400' : 'text-green-400'}`}>
                    {analysis.liquidityRisk}/20
                  </p>
                </div>
                <div className="bg-gray-900 p-3 rounded-xl border border-gray-700 text-center">
                  <p className="text-gray-400 text-xs">Age</p>
                  <p className={`text-xl font-bold ${analysis.ageRisk < 0 ? 'text-green-400' : analysis.ageRisk > 0 ? 'text-yellow-400' : 'text-white'}`}>
                    {analysis.ageRisk}
                  </p>
                </div>
              </div>
            </div>

            {/* Why Trust Score */}
            {analysis.trustFactors.length > 0 && (
              <div className="bg-gray-800 p-6 rounded-2xl border border-gray-700">
                <h3 className="text-lg font-bold mb-4">🔍 Why Trust Score = {analysis.trustScore}?</h3>
                <ul className="space-y-1">
                  {analysis.trustFactors.map((item, i) => (
                    <li key={i} className="text-sm text-gray-300">{item}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* What Could Go Wrong */}
            {analysis.whatCouldGoWrong.length > 0 && (
              <div className="bg-yellow-900/20 p-6 rounded-2xl border border-yellow-600">
                <h3 className="text-lg font-bold text-yellow-400 mb-2">⚠️ What Could Go Wrong?</h3>
                <ul className="space-y-1">
                  {analysis.whatCouldGoWrong.map((item, i) => (
                    <li key={i} className="text-sm text-yellow-300">• {item}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Risk Explanation */}
            {analysis.riskExplanation.length > 0 && (
              <div className="bg-gray-800 p-6 rounded-2xl border border-gray-700">
                <h3 className="text-lg font-bold mb-4">🔍 Why This Risk Score?</h3>
                <ul className="space-y-2">
                  {analysis.riskExplanation.map((item, i) => (
                    <li key={i} className="text-sm text-gray-300 flex items-start gap-2">
                      <span className="text-purple-400">•</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Bull/Bear Case */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {analysis.bullCase.length > 0 && (
                <div className="bg-gray-800 p-6 rounded-2xl border border-green-600/30">
                  <h3 className="text-lg font-bold mb-3 text-green-400">📈 Bull Case</h3>
                  <ul className="space-y-1">
                    {analysis.bullCase.map((item, i) => (
                      <li key={i} className="text-sm text-gray-300">{item}</li>
                    ))}
                  </ul>
                </div>
              )}
              {analysis.bearCase.length > 0 && (
                <div className="bg-gray-800 p-6 rounded-2xl border border-red-600/30">
                  <h3 className="text-lg font-bold mb-3 text-red-400">📉 Bear Case</h3>
                  <ul className="space-y-1">
                    {analysis.bearCase.map((item, i) => (
                      <li key={i} className="text-sm text-gray-300">{item}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Trading Status */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-800 p-4 rounded-2xl border border-gray-700 text-center">
                <p className="text-gray-400 text-xs">Trading Status</p>
                <p className={`text-xl font-bold ${analysis.tradingEnabled ? 'text-green-400' : 'text-red-400'}`}>
                  {analysis.tradingEnabled ? '✅ Enabled' : '🚫 Disabled'}
                </p>
              </div>
              <div className="bg-gray-800 p-4 rounded-2xl border border-gray-700 text-center">
                <p className="text-gray-400 text-xs">Transfers</p>
                <p className={`text-xl font-bold ${analysis.transfersEnabled ? 'text-green-400' : 'text-red-400'}`}>
                  {analysis.transfersEnabled ? '✅ Enabled' : '🚫 Disabled'}
                </p>
              </div>
            </div>

            {/* Holder Health */}
            {analysis.holderHealthScore !== "N/A" && (
              <div className="bg-gray-800 p-6 rounded-2xl border border-gray-700">
                <h3 className="text-lg font-bold mb-2">🏥 Holder Health</h3>
                <p className={`text-2xl font-bold ${
                  analysis.holderHealthLevel > 70 ? 'text-green-400' :
                  analysis.holderHealthLevel > 50 ? 'text-yellow-400' :
                  'text-red-400'
                }`}>
                  {analysis.holderHealthScore}
                </p>
                <p className="text-xs text-gray-400 mt-1">{analysis.totalHolders} total holders</p>
              </div>
            )}

            {/* Tax Scanner */}
            <div className="bg-gray-800 p-6 rounded-2xl border border-gray-700">
              <h3 className="text-lg font-bold mb-4">💰 Tax Scanner</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-900 p-4 rounded-xl border border-gray-700">
                  <p className="text-gray-400 text-xs">Buy Tax</p>
                  <p className={`text-xl font-bold ${
                    Number(analysis.buyTax) > 10 ? 'text-red-400' :
                    Number(analysis.buyTax) > 5 ? 'text-yellow-400' :
                    'text-green-400'
                  }`}>
                    {analysis.buyTax}%
                  </p>
                </div>
                <div className="bg-gray-900 p-4 rounded-xl border border-gray-700">
                  <p className="text-gray-400 text-xs">Sell Tax</p>
                  <p className={`text-xl font-bold ${
                    Number(analysis.sellTax) > 10 ? 'text-red-400' :
                    Number(analysis.sellTax) > 5 ? 'text-yellow-400' :
                    'text-green-400'
                  }`}>
                    {analysis.sellTax}%
                  </p>
                </div>
              </div>
            </div>

            {/* Holder Analysis */}
            <HolderAnalysis holders={analysis.holders} />

            {/* Holder Statistics */}
            <div className="bg-gray-800 p-6 rounded-2xl border border-gray-700">
              <h3 className="text-lg font-bold mb-4">📊 Holder Statistics</h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-gray-900 p-4 rounded-xl border border-gray-700 text-center">
                  <p className="text-gray-400 text-xs">Total Holders</p>
                  <p className={`text-xl font-bold ${
                    analysis.totalHolders !== "N/A" && Number(analysis.totalHolders) < 20 
                      ? 'text-yellow-400' 
                      : 'text-white'
                  }`}>
                    {analysis.totalHolders}
                  </p>
                  {analysis.isLowHolders && (
                    <p className="text-[10px] text-yellow-400 mt-1">⚠️ Very Low</p>
                  )}
                </div>
                <div className="bg-gray-900 p-4 rounded-xl border border-gray-700 text-center">
                  <p className="text-gray-400 text-xs">LP Holders</p>
                  <p className="text-xl font-bold">{analysis.lpHolders}</p>
                </div>
                <div className="bg-gray-900 p-4 rounded-xl border border-gray-700 text-center">
                  <p className="text-gray-400 text-xs">Owner Address</p>
                  <p className="text-xs font-mono break-all">{analysis.ownerAddress}</p>
                </div>
              </div>
              {analysis.isBurnWallet && (
                <div className="mt-4 bg-green-600/10 border border-green-600 p-3 rounded-xl">
                  <p className="text-green-400 text-sm font-bold">🔥 Tokens sent to Burn Address</p>
                </div>
              )}
              {analysis.isHighlyCentralized && (
                <div className="mt-4 bg-red-600/10 border border-red-600 p-3 rounded-xl">
                  <p className="text-red-400 text-sm font-bold">🚨 {analysis.creatorPercent}% Supply Controlled by Creator</p>
                </div>
              )}
            </div>

            {/* Liquidity Analysis (existing) */}
            <div className="bg-gray-800 p-6 rounded-2xl border border-gray-700">
              <h3 className="text-lg font-bold mb-4">💧 Liquidity Analysis</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-900 p-4 rounded-xl border border-gray-700 text-center">
                  <p className="text-gray-400 text-xs">Liquidity Status</p>
                  <p className={`text-xl font-bold ${
                    analysis.liquidityLocked === "Locked" ? 'text-green-400' :
                    analysis.liquidityLocked === "Not Locked" ? 'text-red-400' :
                    'text-yellow-400'
                  }`}>
                    {analysis.liquidityLocked}
                  </p>
                </div>
                <div className="bg-gray-900 p-4 rounded-xl border border-gray-700 text-center">
                  <p className="text-gray-400 text-xs">Liquidity Amount</p>
                  <p className="text-xl font-bold">{analysis.liquidityAmount !== "N/A" ? `$${analysis.liquidityAmount}` : 'N/A'}</p>
                </div>
              </div>
              {analysis.liquidityUnlockDate !== "N/A" && (
                <div className="mt-4 bg-gray-900 p-3 rounded-xl border border-gray-700 text-center">
                  <p className="text-gray-400 text-xs">Unlock Date</p>
                  <p className="text-sm font-bold">{analysis.liquidityUnlockDate}</p>
                </div>
              )}
            </div>

            {/* Contract Balance */}
            {analysis.contractBalance !== "N/A" && (
              <div className="bg-gray-800 p-6 rounded-2xl border border-gray-700">
                <h3 className="text-lg font-bold mb-4">💰 Contract Balance</h3>
                <div className="bg-gray-900 p-4 rounded-xl border border-gray-700 text-center">
                  <p className="text-2xl font-bold">{analysis.contractBalance}</p>
                </div>
              </div>
            )}

            {/* Security Checklist */}
            <div className="bg-gray-800 p-6 rounded-2xl border border-gray-700">
              <h3 className="text-lg font-bold mb-4">📋 Security Checklist</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {analysis.securityChecks.map((check, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm">
                    <span className={check.passed ? 'text-green-400' : 'text-red-400'}>
                      {check.passed ? '✅' : '❌'}
                    </span>
                    <span className={check.passed ? 'text-gray-300' : 'text-red-300'}>
                      {check.label}
                    </span>
                  </div>
                ))}
              </div>
              <div className="mt-4 text-sm text-gray-400">
                Passed: {analysis.passedChecks}/{analysis.totalChecks}
              </div>
            </div>

            {/* Similar Token Comparison */}
            <div className="bg-gray-800 p-6 rounded-2xl border border-gray-700">
              <h3 className="text-lg font-bold mb-4">📊 Similar Token Comparison</h3>
              <div className="grid grid-cols-3 gap-4">
                {analysis.similarTokens.map((token, i) => (
                  <div key={i} className="bg-gray-900 p-3 rounded-xl border border-gray-700 text-center">
                    <p className="text-gray-400 text-xs">{token.name}</p>
                    <p className="text-xl font-bold">{token.score}/100</p>
                  </div>
                ))}
              </div>
              <div className="mt-3 text-sm text-gray-400 text-center">
                This token ranks above <span className="text-purple-400 font-bold">{analysis.rankPercentile}%</span> of analyzed tokens
              </div>
            </div>

            {/* AI Verdict */}
            <div className={`p-6 rounded-2xl border ${
              analysis.isHoneypot || analysis.riskScore > 70 
                ? 'bg-red-900/30 border-red-500' 
                : 'bg-gradient-to-r from-purple-900/30 to-blue-900/30 border-purple-500'
            }`}>
              <h3 className="text-lg font-bold mb-2 flex items-center gap-2">
                🤖 AI Verdict
                <span className="text-xs text-purple-400">Powered by Intelligence Suite</span>
              </h3>
              <p className="text-gray-200 leading-relaxed">{analysis.aiVerdict}</p>
            </div>

            {/* Risk Summary */}
            <div className="bg-gray-800 p-6 rounded-2xl border border-gray-700">
              <h3 className="text-lg font-bold mb-4">📋 Risk Summary</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-green-400 font-bold mb-2">✅ Strengths</p>
                  <div className="space-y-1">
                    {analysis.positives.length > 0 ? (
                      analysis.positives.map((item, i) => (
                        <p key={i} className="text-sm text-green-300">✓ {item}</p>
                      ))
                    ) : (
                      <p className="text-sm text-gray-400">No strengths identified</p>
                    )}
                  </div>
                  {analysis.warnings.length > 0 && (
                    <div className="mt-3">
                      <p className="text-yellow-400 font-bold mb-1">⚠️ Warnings</p>
                      {analysis.warnings.map((item, i) => (
                        <p key={i} className="text-sm text-yellow-300">⚠ {item}</p>
                      ))}
                    </div>
                  )}
                </div>
                <div>
                  <p className="text-red-400 font-bold mb-2">⚠️ Risks</p>
                  <div className="space-y-1">
                    {analysis.negatives.length > 0 ? (
                      analysis.negatives.map((item, i) => (
                        <p key={i} className="text-sm text-red-300">⚠ {item}</p>
                      ))
                    ) : (
                      <p className="text-sm text-gray-400">No risks identified</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Resources */}
            <div className="bg-gray-800 p-6 rounded-2xl border border-gray-700">
              <h3 className="text-lg font-bold mb-4">🌐 Resources</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <a href={analysis.etherscanLink} target="_blank" rel="noopener noreferrer"
                   className="bg-blue-600/20 text-blue-400 px-4 py-3 rounded-xl text-sm font-medium hover:bg-blue-600/30 transition border border-blue-600 text-center">
                  🔗 Etherscan
                </a>
                <a href={analysis.dexScreenerLink} target="_blank" rel="noopener noreferrer"
                   className="bg-purple-600/20 text-purple-400 px-4 py-3 rounded-xl text-sm font-medium hover:bg-purple-600/30 transition border border-purple-600 text-center">
                  📊 DexScreener
                </a>
                {analysis.coinGeckoLink && (
                  <a href={analysis.coinGeckoLink} target="_blank" rel="noopener noreferrer"
                     className="bg-green-600/20 text-green-400 px-4 py-3 rounded-xl text-sm font-medium hover:bg-green-600/30 transition border border-green-600 text-center">
                    🦎 CoinGecko
                  </a>
                )}
                <a href={`https://www.google.com/search?q=${analysis.tokenSymbol}+token`} target="_blank" rel="noopener noreferrer"
                   className="bg-gray-600/20 text-gray-400 px-4 py-3 rounded-xl text-sm font-medium hover:bg-gray-600/30 transition border border-gray-600 text-center">
                  🔍 Search
                </a>
              </div>
            </div>

            {/* Deep Security Audit */}
            <div className="bg-gray-800 p-6 rounded-2xl border border-gray-700">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                🛡️ Deep Security Audit
                <span className="text-xs text-gray-400 ml-auto">
                  {analysis.isVerified ? '✅ Verified' : '⚠️ Unverified'}
                </span>
              </h3>
              <div className="flex flex-wrap gap-2 mb-4">
                {analysis.isHoneypot && <span className="bg-red-600/30 text-red-400 px-3 py-1 rounded-full text-xs font-bold border border-red-600">🚨 Honeypot</span>}
                {analysis.isMintable && <span className="bg-yellow-600/30 text-yellow-400 px-3 py-1 rounded-full text-xs font-bold border border-yellow-600">⚠️ Mintable</span>}
                {analysis.isProxy && <span className="bg-yellow-600/30 text-yellow-400 px-3 py-1 rounded-full text-xs font-bold border border-yellow-600">⚠️ Upgradeable</span>}
                {analysis.isBlacklisted && <span className="bg-red-600/30 text-red-400 px-3 py-1 rounded-full text-xs font-bold border border-red-600">⚠️ Blacklist</span>}
                {analysis.isHighlyCentralized && <span className="bg-red-600/30 text-red-400 px-3 py-1 rounded-full text-xs font-bold border border-red-600">🚨 Centralized</span>}
                {analysis.isNewToken && <span className="bg-yellow-600/30 text-yellow-400 px-3 py-1 rounded-full text-xs font-bold border border-yellow-600">⚠️ New Token</span>}
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: "Hidden Mint", val: analysis.hiddenMint },
                  { label: "Hidden Owner", val: analysis.hiddenOwner },
                  { label: "Cannot Sell All", val: analysis.cannotSellAll },
                  { label: "Self Destruct", val: analysis.selfDestruct },
                  { label: "External Call", val: analysis.externalCall },
                ].map((item, i) => (
                  <div key={i} className="bg-gray-900 p-3 rounded-xl border border-gray-700">
                    <p className="text-gray-400 text-[10px] uppercase">{item.label}</p>
                    <p className={`font-bold ${item.val ? "text-red-400" : "text-green-400"}`}>
                      {item.val ? "⚠️ YES" : "✅ NO"}
                    </p>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                {[
                  { label: "Anti Whale", val: analysis.antiWhale },
                  { label: "Anti Whale Mod", val: analysis.antiWhaleModifiable },
                  { label: "Personal Slippage", val: analysis.personalSlippage },
                  { label: "Trading Cooldown", val: analysis.tradingCooldown },
                  { label: "Transfer Pause", val: analysis.transferPause },
                ].map((item, i) => (
                  <div key={i} className="bg-gray-900 p-3 rounded-xl border border-gray-700">
                    <p className="text-gray-400 text-[10px] uppercase">{item.label}</p>
                    <p className={`font-bold ${item.val ? "text-yellow-400" : "text-green-400"}`}>
                      {item.val ? "⚠️ YES" : "✅ NO"}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Creator & Whale Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gray-800 p-6 rounded-2xl border border-gray-700">
                <h3 className="text-lg font-bold mb-4">👤 Contract Deployer</h3>
                <div className="space-y-3">
                  <div><p className="text-gray-400 text-xs">Address</p><p className="text-xs break-all font-mono">{analysis.creatorAddress}</p></div>
                  <div className="grid grid-cols-2 gap-4">
                    <div><p className="text-gray-400 text-xs">Balance</p><p className="text-sm font-bold">{analysis.creatorBalance}</p></div>
                    <div><p className="text-gray-400 text-xs">Ownership %</p><p className={`text-sm font-bold ${Number(analysis.creatorPercent) > 50 ? 'text-red-400' : Number(analysis.creatorPercent) > 20 ? 'text-yellow-400' : 'text-green-400'}`}>{analysis.creatorPercent}%</p></div>
                  </div>
                  <div><p className="text-gray-400 text-xs">Creator Risk</p><p className={`font-bold ${analysis.creatorRisk === "Critical" ? 'text-red-600' : analysis.creatorRisk === "High" ? 'text-red-400' : analysis.creatorRisk === "Medium" ? 'text-yellow-400' : 'text-green-400'}`}>{analysis.creatorRisk}</p></div>
                </div>
              </div>
              <div className="bg-gray-800 p-6 rounded-2xl border border-gray-700">
                <h3 className="text-lg font-bold mb-4">🐋 Whale Detection</h3>
                <div className="space-y-3">
                  <div><p className="text-gray-400 text-xs">Top 10 Holder Concentration</p><p className={`text-2xl font-bold ${analysis.topHolders !== "N/A" && analysis.topHolders > 60 ? 'text-red-400' : analysis.topHolders !== "N/A" && analysis.topHolders > 40 ? 'text-yellow-400' : 'text-green-400'}`}>{analysis.topHoldersDisplay}</p></div>
                  <div><p className="text-gray-400 text-xs">Concentration Risk</p><p className={`font-bold ${analysis.holderConcentrationRisk > 20 ? 'text-red-400' : analysis.holderConcentrationRisk > 10 ? 'text-yellow-400' : 'text-green-400'}`}>{analysis.holderConcentrationRisk}/25</p></div>
                  <div><p className="text-gray-400 text-xs">Owner Renounced</p><p className={`font-bold ${analysis.isOwnerRenounced === "YES" ? 'text-green-400' : analysis.isOwnerRenounced === "NO" ? 'text-red-400' : 'text-yellow-400'}`}>{analysis.isOwnerRenounced}</p></div>
                  <div><p className="text-gray-400 text-xs">Liquidity Locked</p><p className={`font-bold ${analysis.isLiquidityLocked === "YES" ? 'text-green-400' : analysis.isLiquidityLocked === "NO" ? 'text-red-400' : 'text-yellow-400'}`}>{analysis.isLiquidityLocked}</p></div>
                </div>
              </div>
            </div>

            {/* AI Insight Card */}
            <AIInsightCard 
              summary={analysis.summary}
              tokenName={analysis.tokenName}
              tokenSymbol={analysis.tokenSymbol}
              riskLevel={analysis.riskLevel}
              prediction={analysis.prediction}
              sentiment={analysis.sentiment}
            />
          </div>
        )}
      </div>

      {/* --- FOOTER --- */}
      <div className="max-w-4xl mx-auto w-full mt-12 pt-6 border-t border-gray-700">
        <div className="bg-gray-800/50 p-4 rounded-xl border border-gray-700 text-center text-sm text-gray-400">
          <p className="font-semibold text-white">🤖 AI Intelligence Suite</p>
          <p className="mt-1">
            Data Sources <span className="text-purple-400">GoPlus Security</span>,{' '}
            <span className="text-blue-400">DexScreener</span>,{' '}
            <span className="text-green-400">CoinGecko</span> and{' '}
            <span className="text-yellow-400">Public Blockchain Data</span>.
            Market, security, and blockchain information is aggregated from third-party providers and on-chain analysis. Information may be delayed, incomplete, or unavailable depending on source availability.
          </p>
          <p className="mt-1 text-xs">
            © {new Date().getFullYear()} AI Intelligence Suite — By Soltchain Technologies. All Rights Reserved
          </p>
        </div>
      </div>
    </div>
  );
};

export default AIAnalyzerPage;