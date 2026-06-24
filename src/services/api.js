import axios from 'axios';

// API base URL hamari .env file se aayegi
const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://api.ecoscanner.ai';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 1. Token Scan API
export const scanToken = async (address) => {
  try {
    const response = await apiClient.post('/scan/token', { address });
    return response.data;
  } catch (error) {
    console.error("Error scanning token:", error);
    throw error;
  }
};

// 2. Wallet Scan API
export const scanWallet = async (address) => {
  try {
    const response = await apiClient.post('/scan/wallet', { address });
    return response.data;
  } catch (error) {
    console.error("Error scanning wallet:", error);
    throw error;
  }
};

export default apiClient;