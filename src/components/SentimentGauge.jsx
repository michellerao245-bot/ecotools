const SentimentGauge = ({ sentiment }) => (
  <div className="bg-black/20 p-6 rounded-2xl text-center">
    <p className="text-gray-400 text-xs uppercase mb-2">Market Sentiment</p>
    <div className={`text-2xl font-bold ${sentiment === 'Bullish' ? 'text-green-400' : 'text-red-400'}`}>
      {sentiment}
    </div>
  </div>
);
export default SentimentGauge;