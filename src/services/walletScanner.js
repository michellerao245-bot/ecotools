const API_KEY = import.meta.env.VITE_BSCSCAN_API_KEY;

export const getWalletData = async (address) => {
  try {
    // V1 ka updated structure try karte hain, kai baar ye V2 se pehle chal jata hai
    const url = `https://api.bscscan.com/api?module=account&action=txlist&address=${address}&startblock=0&endblock=99999999&sort=asc&apikey=${API_KEY}`;
    
    const response = await fetch(`https://api.bscscan.com/api?module=account&action=txlist&address=${address.toLowerCase()}&startblock=0&endblock=99999999&sort=asc&apikey=${API_KEY}`);
    const data = await response.json();

    console.log("RAW RESPONSE:", data);

    // Agar data.status '0' hai aur message 'NOTOK' hai
    if (data.status === '0') {
      // Yahan hum BscScan ke specific error handle kar rahe hain
      throw new Error(data.message || 'API request failed (NOTOK)');
    }

    return data.result;
     
  } catch (error) {
    console.error("Wallet Fetch Error:", error);
    throw error;
  }
};