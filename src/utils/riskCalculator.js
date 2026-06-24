/**
 * Contract scan data ke basis par risk score calculate karta hai
 */
export const calculateRiskScore = (scanData) => {
  let score = 0;

  // 1. Liquidity Check
  if (!scanData.isLiquidityLocked) score += 40;
  
  // 2. Ownership Check
  if (scanData.isOwnerRenounced) {
    score -= 20; // Risk kam ho jata hai
  } else {
    score += 20; // Owner control risk badhata hai
  }

  // 3. Honeypot Indicators
  if (scanData.hasBuyTax || scanData.hasSellTax) score += 15;
  if (scanData.isMintable) score += 25;

  // Final score clamping (0 to 100)
  return Math.min(Math.max(score, 0), 100);
};

/**
 * Score ke base par status label dena
 */
export const getRiskLabel = (score) => {
  if (score <= 30) return { text: "Safe", color: "text-green-500" };
  if (score <= 60) return { text: "Moderate", color: "text-yellow-500" };
  return { text: "High Risk", color: "text-red-500" };
};