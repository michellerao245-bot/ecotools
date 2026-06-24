// Network Configs
export const CHAIN_OPTIONS = [
  { id: 1, name: 'Ethereum Mainnet', symbol: 'ETH' },
  { id: 56, name: 'BNB Smart Chain', symbol: 'BNB' },
  { id: 137, name: 'Polygon', symbol: 'POL' },
];

// App Configuration
export const APP_NAME = "EcoScanner AI";
export const SUPPORT_EMAIL = "support@ecoscanner.ai";

// Risk Thresholds (Score based logic)
export const RISK_LEVELS = {
  LOW: { min: 0, max: 30, label: 'Low Risk', color: 'text-green-400' },
  MEDIUM: { min: 31, max: 70, label: 'Medium Risk', color: 'text-yellow-400' },
  HIGH: { min: 71, max: 100, label: 'High Risk', color: 'text-red-400' },
};

// Default Values
export const DEFAULT_AI_PROMPT = "Analyze the smart contract for potential backdoors and liquidity issues.";