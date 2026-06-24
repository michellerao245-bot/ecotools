const DEXSCREENER_API =
  'https://api.dexscreener.com/latest/dex/tokens';

export const getDexScreenerData = async (address) => {
  try {
    const response = await fetch(
      `${DEXSCREENER_API}/${address}`
    );

    const data = await response.json();

    console.log('RAW DEX DATA:', data);

    if (!data?.pairs?.length) {
      return null;
    }

    const pair = data.pairs.sort(
      (a, b) =>
        (b.liquidity?.usd || 0) -
        (a.liquidity?.usd || 0)
    )[0];

    return {
      pairName: `${pair.baseToken?.symbol}/${pair.quoteToken?.symbol}`,
      dexName: pair.dexId,
      liquidity: pair.liquidity?.usd || 0,
      marketCap: pair.marketCap || 0,
      volume24h: pair.volume?.h24 || 0,
      priceUsd: pair.priceUsd || 0,
      pairAddress: pair.pairAddress,
      pairUrl: pair.url,
    };
  } catch (error) {
    console.error('DexScreener Error:', error);
    return null;
  }
};