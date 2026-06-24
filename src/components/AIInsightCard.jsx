const AIInsightCard = ({ title, content, color = "purple" }) => (
  <div className={`bg-${color}-900/10 border border-${color}-500/20 p-6 rounded-2xl`}>
    <h3 className={`text-${color}-400 font-bold mb-2`}>{title}</h3>
    <p className="text-gray-300 text-sm leading-relaxed">{content}</p>
  </div>
);
export default AIInsightCard;