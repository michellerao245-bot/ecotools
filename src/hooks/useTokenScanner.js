import { useState, useCallback } from 'react';
import { getGoPlusSecurity } from '../services/goplus';
import { getDexScreenerData } from '../services/dexscreener';

const useTokenScanner = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const scanToken = useCallback(async (address, chain = 'bsc') => {
    setLoading(true);
    setError(null);
    setData(null);

    try {
      // Address Validation
      if (!address || !/^0x[a-fA-F0-9]{40}$/.test(address)) {
        throw new Error('Invalid contract address');
      }

      // GoPlus Security
      const security = await getGoPlusSecurity(address, chain);

      if (!security) {
        throw new Error('Unable to fetch token security data');
      }

      // DexScreener
      const dexData = await getDexScreenerData(address);

      console.log('SECURITY DATA:', security);
      console.log('DEX DATA:', dexData);

      // Verification
      const isVerified =
        security?.is_open_source === '1';

      // Honeypot
      const isHoneypot =
        security?.is_honeypot === '1';

      // Taxes
      const buyTax =
        Number(security?.buy_tax || 0);

      const sellTax =
        Number(security?.sell_tax || 0);

      // Mint
      const canMint =
        security?.can_take_back_ownership === '1' ||
        security?.is_mintable === '1';

      // Blacklist
      const blacklist =
        security?.is_blacklisted === '1';

      // Owner Renounced
      const ownerRenounced =
        security?.owner_address ===
        '0x0000000000000000000000000000000000000000';

      // Risk Engine
      let riskScore = 0;

      if (!isVerified) riskScore += 25;

      if (isHoneypot) riskScore += 100;

      if (canMint) riskScore += 20;

      if (blacklist) riskScore += 20;

      if (buyTax > 10) riskScore += 15;

      if (sellTax > 10) riskScore += 15;

      if (!ownerRenounced) riskScore += 10;

      riskScore = Math.min(riskScore, 100);

      // AI Verdict
      let aiVerdict = '';

      if (riskScore <= 20) {
        aiVerdict = 'Low Risk Token';
      } else if (riskScore <= 50) {
        aiVerdict = 'Medium Risk Token';
      } else if (riskScore <= 80) {
        aiVerdict = 'High Risk Token';
      } else {
        aiVerdict = 'Dangerous Token';
      }

      // Final Result
      setData({
        tokenName:
          security?.token_name ||
          security?.token_symbol ||
          'Unknown Token',

        symbol:
          security?.token_symbol ||
          'N/A',

        chain: chain.toUpperCase(),

        riskScore,

        isVerified,

        isHoneypot,

        ownerRenounced,

        buyTax,

        sellTax,

        canMint,

        blacklist,

        aiVerdict,

        liquidity:
          dexData?.liquidity || 0,

        marketCap:
          dexData?.marketCap || 0,

        volume24h:
          dexData?.volume24h || 0,

        dexName:
          dexData?.dexName || 'N/A',

        pairName:
          dexData?.pairName || 'N/A',

        priceUsd:
          dexData?.priceUsd || 0,

        pairAddress:
          dexData?.pairAddress || '',

        pairUrl:
          dexData?.pairUrl || '',
      });

    } catch (err) {
      console.error('Scanner Error:', err);

      setError(
        err.message ||
        'Token scan failed'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    scanToken,
    data,
    loading,
    error,
  };
};

export default useTokenScanner;