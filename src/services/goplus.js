const CHAIN_IDS = {
  ethereum: '1',
  bsc: '56',
  polygon: '137',
  arbitrum: '42161',
  base: '8453',
};

export const getGoPlusSecurity = async (address, chain = 'bsc') => {
  try {
    const chainId = CHAIN_IDS[chain];

    const response = await fetch(
      `https://api.gopluslabs.io/api/v1/token_security/${chainId}?contract_addresses=${address}`
    );

    const result = await response.json();

    if (!result.result || !result.result[address.toLowerCase()]) {
      throw new Error('Token security data not found');
    }

    return result.result[address.toLowerCase()];
  } catch (error) {
    console.error('GoPlus Error:', error);
    throw error;
  }
};