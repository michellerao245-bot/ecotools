/**
 * Check karta hai ki kya address valid EVM address format mein hai
 */
export const isValidAddress = (address) => {
  // EVM addresses (ETH, BSC, Polygon) 42 characters ke hote hain (0x + 40 hex chars)
  const addressRegex = /^0x[a-fA-F0-9]{40}$/;
  return addressRegex.test(address);
};

/**
 * Check karta hai ki input khali toh nahi hai
 */
export const isNotEmpty = (value) => {
  return value && value.trim().length > 0;
};

/**
 * Input field ke liye helper message
 */
export const validateInput = (address) => {
  if (!isNotEmpty(address)) {
    return { isValid: false, message: "Address cannot be empty" };
  }
  if (!isValidAddress(address)) {
    return { isValid: false, message: "Invalid address format. Check for '0x' prefix." };
  }
  return { isValid: true, message: "" };
};