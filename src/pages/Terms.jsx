import React from 'react';

const Terms = () => {
  return (
    <div className="min-h-screen bg-gray-900 text-white py-16 px-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">Terms of Service</h1>
        
        <div className="space-y-8 text-gray-400">
          <section>
            <h2 className="text-xl font-semibold text-white mb-3">1. No Financial Advice</h2>
            <p>
              EcoScanner AI ka istemal sirf education aur research ke liye karein. Hum koi financial advisor nahi hain. 
              Kisi bhi token mein invest karne se pehle apni khud ki research (DYOR) zaroor karein.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">2. Accuracy of Data</h2>
            <p>
              Hum on-chain data dikhane ki poori koshish karte hain, lekin blockchain data kabhi-kabhi delay ho sakta hai. 
              Hum kisi bhi tarah ke financial loss ke liye zimmedar (liable) nahi honge.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">3. Usage Policy</h2>
            <p>
              Hamare platform ka istemal kisi bhi illegal activity ya botting ke liye karna mana hai. 
              Violation ki wajah se aapka access permanent block kiya ja sakta hai.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">4. Intellectual Property</h2>
            <p>
              EcoScanner AI ka design, code, aur branding hamari property hai. Ise bina permission ke copy karna mana hai.
            </p>
          </section>
        </div>

        <div className="mt-12 border-t border-gray-800 pt-8">
          <p className="text-sm text-gray-500">
            Last Updated: June 19, 2026. By using our service, you agree to these terms.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Terms;