const HolderAnalysis = ({ holders }) => (
  <div className="bg-gray-800 p-6 rounded-2xl border border-gray-700">
    <h3 className="text-purple-400 font-bold mb-4">Holder Distribution</h3>
    <div className="space-y-4">
      {holders.map((item, index) => (
        <div key={index}>
          <div className="flex justify-between text-sm mb-1">
            <span>{item.label}</span>
            <span className="font-bold">{item.percent}%</span>
          </div>
          <div className="w-full bg-gray-700 h-2 rounded-full overflow-hidden">
            <div 
              className={`h-full ${item.color}`} 
              style={{ width: `${item.percent}%` }}
            ></div>
          </div>
        </div>
      ))}
    </div>
  </div>
);
export default HolderAnalysis;