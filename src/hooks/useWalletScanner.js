import { useState, useCallback } from 'react';
import { getWalletData } from '../services/walletScanner';

const useWalletScanner = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const scanWallet = useCallback(async (walletAddress) => {
    setLoading(true);
    setError(null);
    setData(null);

    try {
      const txs = await getWalletData(walletAddress);

      if (!txs || txs.length === 0) {
        throw new Error('No transactions found');
      }

      const totalTransactions = txs.length;

      const firstTx = txs[0];
      const lastTx = txs[txs.length - 1];

      const walletAgeDays = Math.floor(
        (Date.now() / 1000 - Number(firstTx.timeStamp)) / 86400
      );

      const totalGasSpent = txs.reduce((sum, tx) => {
        return (
          sum +
          (
            (Number(tx.gasUsed || 0) *
              Number(tx.gasPrice || 0)) /
            1e18
          )
        );
      }, 0);

      const lastActivity = new Date(
        Number(lastTx.timeStamp) * 1000
      ).toLocaleString();

      const firstTransaction = new Date(
        Number(firstTx.timeStamp) * 1000
      ).toLocaleDateString();

      const isContract = txs.some(
        (tx) => tx.input && tx.input !== '0x'
      );

      let riskProfile = 'Low';

      if (walletAgeDays < 30) {
        riskProfile = 'Medium';
      }

      if (walletAgeDays < 7) {
        riskProfile = 'High';
      }

      setData({
        walletAddress,
        totalTransactions,
        walletAge: walletAgeDays,
        firstTransaction,
        lastActivity,
        gasSpent: totalGasSpent.toFixed(4),
        isContract,
        riskProfile,
        aiVerdict:
          riskProfile === 'Low'
            ? 'This wallet shows normal activity and appears established.'
            : riskProfile === 'Medium'
            ? 'This wallet is relatively new. Exercise caution.'
            : 'This wallet is very new and carries a higher risk profile.'
      });

    } catch (err) {
      console.error('Wallet Scanner Error:', err);
      setError(err.message || 'Failed to analyze wallet');
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    scanWallet,
    data,
    loading,
    error
  };
};

export default useWalletScanner;