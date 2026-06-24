/**
 * Blockchain addresses ko chhota karta hai (e.g., 0x123...abc)
 */
export const truncateAddress = (address) => {
  if (!address) return "";
  return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
};

/**
 * Risk score ko percentage ya readable string mein format karta hai
 */
export const formatRiskScore = (score) => {
  return `${score}/100`;
};

/**
 * Date/Time ko human-readable format mein batata hai
 */
export const formatDate = (timestamp) => {
  return new Date(timestamp).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

/**
 * Large numbers (tokens) ko comma format mein dikhata hai
 */
export const formatNumber = (num) => {
  return new Intl.NumberFormat('en-US').format(num);
};