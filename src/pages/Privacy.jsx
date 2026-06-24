import React from 'react';

const Privacy = () => {
  return (
    <div className="min-h-screen bg-gray-900 text-white py-16 px-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">Privacy Policy</h1>
        
        <div className="space-y-8 text-gray-400">
          <section>
            <h2 className="text-xl font-semibold text-white mb-3">1. Data Collection</h2>
            <p>
              EcoScanner AI aapka koi bhi private data (jaise Private Keys, Seed Phrases) store nahi karta. 
              Hum sirf public blockchain data ko analyze karte hain jo on-chain available hai.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">2. How We Use Data</h2>
            <p>
              Hum aapke search kiye gaye address ka use sirf risk analysis generate karne ke liye karte hain. 
              Ye data hamare servers par permanent store nahi hota, iska maqsad sirf aapko instant results dena hai.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">3. No Tracking</h2>
            <p>
              Hum koi invasive cookies ya tracking scripts use nahi karte. Aapka experience hamari priority hai.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">4. Security</h2>
            <p>
              Hum industry-standard encryption ka use karte hain taaki aapke connection ko secure rakha ja sake.
            </p>
          </section>
        </div>

        <div className="mt-12 p-6 bg-blue-900/20 border border-blue-500/30 rounded-xl">
          <p className="text-blue-300 font-medium">
            Remember: Hum aapse kabhi bhi aapki "Private Key" ya "Seed Phrase" nahi maangenge. 
            Agar koi ye maang raha hai, toh wo scam hai. Be safe!
          </p>
        </div>
      </div>
    </div>
  );
};

export default Privacy;